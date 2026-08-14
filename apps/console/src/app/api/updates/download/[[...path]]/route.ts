import { NextRequest, NextResponse } from 'next/server';
import { resolvePublishedUpdateManifestUrl } from '@/lib/update-manifest-source';
import {
  isAllowedUpdateAssetPath,
  resolveUpdateProduct,
  updateBlobOrigin,
  updateProductForAssetPath,
  type UpdateProductConfig,
} from '@/lib/update-products';

export const runtime = 'nodejs';

const MANIFEST_FETCH_TIMEOUT_MS = 8_000;
const ASSET_CHECK_TIMEOUT_MS = 4_000;

function decodedPathname(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function fetchManifest(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MANIFEST_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json().catch(() => null)) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

function latestUpdaterAssetUrl(manifest: unknown, platform: string) {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }

  const platforms = (manifest as { platforms?: unknown }).platforms;
  if (!platforms || typeof platforms !== 'object') {
    return null;
  }

  const entries = platforms as Record<string, { url?: unknown }>;
  const preferredEntry = entries[platform] ?? entries['darwin-universal'] ?? entries['darwin-aarch64'];
  const url = preferredEntry?.url;

  return typeof url === 'string' ? url : null;
}

function latestDownloadAssetUrl(manifest: unknown, platform: string) {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }

  const downloads = (manifest as { downloads?: unknown }).downloads;
  if (!downloads || typeof downloads !== 'object') {
    return null;
  }

  const entries = downloads as Record<string, { type?: unknown; url?: unknown }>;
  const preferredEntry =
    entries[platform] ?? entries['darwin-universal'] ?? entries['darwin-aarch64'];

  if (preferredEntry?.type !== 'dmg' || typeof preferredEntry.url !== 'string') {
    return null;
  }

  return preferredEntry.url;
}

function inferDmgAssetUrl(
  manifest: unknown,
  updaterAssetUrl: string,
  product: UpdateProductConfig,
) {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }

  const version = (manifest as { version?: unknown }).version;
  if (typeof version !== 'string' || !version.trim()) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(updaterAssetUrl);
  } catch {
    return null;
  }

  const pathParts = parsed.pathname.split('/');
  pathParts[pathParts.length - 1] = product.inferredDmgName(version.trim());
  parsed.pathname = pathParts.join('/');
  parsed.search = '';

  return parsed.toString();
}

async function assetExists(assetUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSET_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(assetUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function proxiedDownloadUrl(
  request: NextRequest,
  assetUrl: string,
  product: UpdateProductConfig,
  blobOrigin: string | null,
) {
  let parsed: URL;
  try {
    parsed = new URL(assetUrl);
  } catch {
    return null;
  }

  if (!blobOrigin || parsed.origin !== blobOrigin) {
    return parsed;
  }

  const pathname = parsed.pathname.replace(/^\/+/, '');
  const decodedPath = decodedPathname(pathname);
  if (!decodedPath || !isAllowedUpdateAssetPath(decodedPath, product)) {
    return null;
  }

  const rewritten = new URL(`/api/updates/download/${pathname}`, request.nextUrl.origin);
  parsed.searchParams.forEach((value, key) => {
    rewritten.searchParams.set(key, value);
  });

  return rewritten;
}

async function redirectToLatest(request: NextRequest) {
  const product = resolveUpdateProduct(request.nextUrl.searchParams.get('product'));
  if (!product) {
    return NextResponse.json({ error: 'unsupported_update_product' }, { status: 404 });
  }

  const manifestUrl = await resolvePublishedUpdateManifestUrl(product);
  if (!manifestUrl) {
    return NextResponse.json({ error: 'update_product_not_configured' }, { status: 503 });
  }

  const platform = request.nextUrl.searchParams.get('platform') ?? 'darwin-universal';
  const format = request.nextUrl.searchParams.get('format') ?? 'dmg';
  const manifest = await fetchManifest(manifestUrl);
  const updaterAssetUrl = latestUpdaterAssetUrl(manifest, platform);
  const dmgAssetUrl =
    latestDownloadAssetUrl(manifest, platform) ??
    (updaterAssetUrl ? inferDmgAssetUrl(manifest, updaterAssetUrl, product) : null);
  const assetUrl = format === 'updater' ? updaterAssetUrl : dmgAssetUrl;

  if (!assetUrl) {
    return NextResponse.json({ error: 'latest_update_asset_not_found' }, { status: 404 });
  }

  if (format !== 'updater' && !(await assetExists(assetUrl))) {
    return NextResponse.json({ error: 'latest_dmg_asset_not_found' }, { status: 404 });
  }

  const target = proxiedDownloadUrl(
    request,
    assetUrl,
    product,
    updateBlobOrigin(product, manifestUrl),
  );
  if (!target) {
    return NextResponse.json({ error: 'latest_update_asset_not_found' }, { status: 404 });
  }

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'platform' && key !== 'format' && key !== 'product') {
      target.searchParams.set(key, value);
    }
  });
  if (!target.searchParams.has('download')) {
    target.searchParams.set('download', '1');
  }

  return NextResponse.redirect(target, 302);
}

async function redirectToBlob(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const path = (params.path ?? []).join('/');

  if (path === 'latest') {
    return redirectToLatest(request);
  }

  const product = updateProductForAssetPath(path);
  if (!product || !isAllowedUpdateAssetPath(path, product)) {
    return NextResponse.json({ error: 'update_asset_not_found' }, { status: 404 });
  }

  const manifestUrl = await resolvePublishedUpdateManifestUrl(product);
  const blobOrigin = updateBlobOrigin(product, manifestUrl);
  if (!blobOrigin) {
    return NextResponse.json({ error: 'update_product_not_configured' }, { status: 503 });
  }

  const target = new URL(`${blobOrigin}/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  if (!target.searchParams.has('download')) {
    target.searchParams.set('download', '1');
  }

  return NextResponse.redirect(target, 302);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return redirectToBlob(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return redirectToBlob(request, context);
}
