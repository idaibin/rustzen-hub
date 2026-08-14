import { NextRequest, NextResponse } from 'next/server';
import { resolvePublishedUpdateManifestUrl } from '@/lib/update-manifest-source';
import {
  isAllowedUpdateAssetPath,
  resolveUpdateProduct,
  updateBlobOrigin,
  type UpdateProductConfig,
} from '@/lib/update-products';

export const runtime = 'nodejs';

const MANIFEST_FETCH_TIMEOUT_MS = 8_000;

function decodedPathname(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

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
      return { ok: false as const, error: 'update_manifest_unavailable', status: response.status };
    }

    const manifest = await response.json().catch(() => null);
    if (!manifest || typeof manifest !== 'object') {
      return { ok: false as const, error: 'invalid_update_manifest', status: 502 };
    }

    return { ok: true as const, manifest };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : String(error),
      status: 502,
    };
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
    return assetUrl;
  }

  if (!blobOrigin || parsed.origin !== blobOrigin) {
    return assetUrl;
  }

  const pathname = parsed.pathname.replace(/^\/+/, '');
  const decodedPath = decodedPathname(pathname);
  if (!decodedPath || !isAllowedUpdateAssetPath(decodedPath, product)) {
    return assetUrl;
  }

  const rewritten = new URL(`/api/updates/download/${pathname}`, request.nextUrl.origin);
  parsed.searchParams.forEach((value, key) => {
    rewritten.searchParams.set(key, value);
  });
  if (!rewritten.searchParams.has('download')) {
    rewritten.searchParams.set('download', '1');
  }

  return rewritten.toString();
}

function rewriteManifestDownloadUrls(
  request: NextRequest,
  manifest: unknown,
  product: UpdateProductConfig,
  blobOrigin: string | null,
) {
  if (!manifest || typeof manifest !== 'object') {
    return manifest;
  }

  const candidate = manifest as {
    platforms?: Record<string, { url?: unknown }>;
  };

  if (!candidate.platforms || typeof candidate.platforms !== 'object') {
    return manifest;
  }

  const platforms = Object.fromEntries(
    Object.entries(candidate.platforms).map(([platform, value]) => {
      if (!value || typeof value !== 'object') {
        return [platform, value];
      }

      const entry = value as { url?: unknown };
      if (typeof entry.url !== 'string') {
        return [platform, value];
      }

      return [
        platform,
        {
          ...entry,
          url: proxiedDownloadUrl(request, entry.url, product, blobOrigin),
        },
      ];
    }),
  );

  return {
    ...candidate,
    platforms,
  };
}

export async function GET(request: NextRequest) {
  const product = resolveUpdateProduct(request.nextUrl.searchParams.get('product'));
  if (!product) {
    return NextResponse.json({ error: 'unsupported_update_product' }, { status: 404 });
  }

  const url = await resolvePublishedUpdateManifestUrl(product);
  if (!url) {
    return NextResponse.json({ error: 'update_product_not_configured' }, { status: 503 });
  }

  const result = await fetchManifest(url);
  if (result.ok) {
    return NextResponse.json(
      rewriteManifestDownloadUrls(request, result.manifest, product, updateBlobOrigin(product, url)),
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    );
  }

  return NextResponse.json(
    {
      error: 'update_manifest_unavailable',
      manifest_url: url,
      reason: result.error,
    },
    { status: result.status },
  );
}
