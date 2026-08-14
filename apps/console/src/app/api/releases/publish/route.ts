import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSameRequestOrigin } from '@/lib/request-origin';
import { publishImmutableManifest, verifyStoredReleaseAssets } from '@/lib/blob-release';
import {
  createTauriUpdateManifest,
  validateUploadedRelease,
  type UploadedReleaseAsset,
} from '@/lib/tauri-release';
import {
  compareReleaseVersions,
  newestReleaseVersion,
  resolveUpdateProduct,
  versionManifestPath,
  type UpdateProductConfig,
} from '@/lib/update-products';

export const runtime = 'nodejs';

type PublishBody = {
  product?: unknown;
  version?: unknown;
  notes?: unknown;
  updater?: unknown;
  signatureFileName?: unknown;
  signature?: unknown;
  dmg?: unknown;
};

const PUBLIC_PUBLISH_ERRORS = new Set([
  'invalid_release_asset',
  'invalid_release_payload',
  'invalid_release_version',
  'invalid_release_file_name',
  'unsupported_release_file',
  'invalid_release_asset_size',
  'invalid_release_asset_url',
  'release_asset_path_mismatch',
  'release_asset_origin_mismatch',
  'release_notes_too_long',
  'invalid_updater_archive',
  'updater_signature_file_mismatch',
  'invalid_updater_signature',
  'invalid_dmg_asset',
  'release_asset_not_found',
  'release_asset_metadata_mismatch',
  'invalid_updater_public_key',
  'unsupported_updater_signature_algorithm',
  'updater_signature_key_mismatch',
  'updater_signature_verification_failed',
  'updater_global_signature_verification_failed',
  'release_manifest_conflict',
]);

function parseAsset(value: unknown): UploadedReleaseAsset {
  if (!value || typeof value !== 'object') throw new Error('invalid_release_asset');
  const asset = value as Partial<UploadedReleaseAsset>;
  if (
    typeof asset.fileName !== 'string' ||
    typeof asset.url !== 'string' ||
    typeof asset.downloadUrl !== 'string' ||
    typeof asset.size !== 'number'
  ) {
    throw new Error('invalid_release_asset');
  }
  return asset as UploadedReleaseAsset;
}

function parseRelease(body: PublishBody, product: UpdateProductConfig) {
  if (
    typeof body.version !== 'string' ||
    typeof body.notes !== 'string' ||
    typeof body.signatureFileName !== 'string' ||
    typeof body.signature !== 'string'
  ) {
    throw new Error('invalid_release_payload');
  }

  return validateUploadedRelease({
    product,
    version: body.version,
    notes: body.notes,
    updater: parseAsset(body.updater),
    signatureFileName: body.signatureFileName,
    signature: body.signature,
    dmg: body.dmg ? parseAsset(body.dmg) : null,
  });
}

export async function POST(request: NextRequest) {
  if (!isSameRequestOrigin(request) || !(await hasAdminSession())) {
    return NextResponse.json({ error: 'release_publish_unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'blob_store_not_configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as PublishBody;
    const product = resolveUpdateProduct(typeof body.product === 'string' ? body.product : null);
    if (!product || body.product !== product.code) {
      return NextResponse.json({ error: 'unsupported_update_product' }, { status: 404 });
    }

    const release = parseRelease(body, product);
    await verifyStoredReleaseAssets(release, process.env.BLOB_READ_WRITE_TOKEN);

    const manifest = createTauriUpdateManifest(release);
    const manifestBlob = await publishImmutableManifest(
      versionManifestPath(product, release.version),
      manifest,
      process.env.BLOB_READ_WRITE_TOKEN,
    );

    await prisma.$transaction(
      async (transaction) => {
        const savedProduct = await transaction.product.upsert({
          where: { code: product.code },
          update: {},
          create: {
            code: product.code,
            name: product.name,
            description: product.description,
          },
        });
        const existing = await transaction.appVersion.findUnique({
          where: {
            productId_version_platform: {
              productId: savedProduct.id,
              version: release.version,
              platform: 'tauri-updater',
            },
          },
          select: { downloadUrl: true },
        });
        if (existing) {
          if (existing.downloadUrl !== manifestBlob.url) throw new Error('release_version_not_newer');
          return;
        }

        const current = await transaction.appVersion.findMany({
          where: { productId: savedProduct.id, platform: 'tauri-updater' },
          select: { version: true },
        });
        const currentVersion = newestReleaseVersion(current.map((item) => item.version));
        if (currentVersion && compareReleaseVersions(release.version, currentVersion) <= 0) {
          throw new Error('release_version_not_newer');
        }

        await transaction.appVersion.create({
          data: {
            productId: savedProduct.id,
            version: release.version,
            platform: 'tauri-updater',
            downloadUrl: manifestBlob.url,
            notes: release.notes || null,
            publishedAt: new Date(),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json({
      product: product.code,
      version: release.version,
      manifest_url: manifestBlob.url,
      update_url: `${request.nextUrl.origin}/api/updates/check?product=${product.code}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message === 'release_version_not_newer' ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034'))
    ) {
      return NextResponse.json({ error: 'release_version_conflict' }, { status: 409 });
    }
    const isPublicError = PUBLIC_PUBLISH_ERRORS.has(message);
    return NextResponse.json(
      { error: isPublicError ? message : 'release_publish_failed' },
      { status: isPublicError ? 400 : 500 },
    );
  }
}
