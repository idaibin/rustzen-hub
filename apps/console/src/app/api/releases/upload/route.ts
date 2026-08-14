import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSameRequestOrigin } from '@/lib/request-origin';
import {
  compareReleaseVersions,
  newestReleaseVersion,
  releaseArtifactPath,
  resolveUpdateProduct,
} from '@/lib/update-products';

export const runtime = 'nodejs';

type UploadKind = 'updater' | 'dmg';

type UploadPayload = {
  product: string;
  version: string;
  kind: UploadKind;
  fileName: string;
};

const PUBLIC_UPLOAD_ERRORS = new Set([
  'invalid_upload_payload',
  'invalid_release_version',
  'invalid_release_file_name',
  'unsupported_release_file',
  'unsupported_update_product',
  'release_upload_path_mismatch',
  'invalid_updater_archive',
  'invalid_dmg_asset',
  'release_version_already_published',
  'release_version_not_newer',
]);

function parsePayload(value: string | null): UploadPayload {
  const parsed = JSON.parse(value ?? 'null') as unknown;
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_upload_payload');

  const payload = parsed as Partial<UploadPayload>;
  if (
    typeof payload.product !== 'string' ||
    typeof payload.version !== 'string' ||
    (payload.kind !== 'updater' && payload.kind !== 'dmg') ||
    typeof payload.fileName !== 'string'
  ) {
    throw new Error('invalid_upload_payload');
  }
  return payload as UploadPayload;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  if (
    body.type === 'blob.generate-client-token' &&
    (!isSameRequestOrigin(request) || !(await hasAdminSession()))
  ) {
    return NextResponse.json({ error: 'release_upload_unauthorized' }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'blob_store_not_configured' }, { status: 503 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isSameRequestOrigin(request) || !(await hasAdminSession())) {
          throw new Error('release_upload_unauthorized');
        }

        const payload = parsePayload(clientPayload);
        const product = resolveUpdateProduct(payload.product);
        if (!product) throw new Error('unsupported_update_product');
        if (pathname !== releaseArtifactPath(product, payload.version, payload.fileName)) {
          throw new Error('release_upload_path_mismatch');
        }
        if (payload.kind === 'updater' && !payload.fileName.endsWith('.app.tar.gz')) {
          throw new Error('invalid_updater_archive');
        }
        if (payload.kind === 'dmg' && !payload.fileName.endsWith('.dmg')) {
          throw new Error('invalid_dmg_asset');
        }

        const published = await prisma.appVersion.findMany({
          where: {
            platform: 'tauri-updater',
            product: { code: product.code },
          },
          select: { version: true },
        });
        const currentVersion = newestReleaseVersion(published.map((release) => release.version));
        if (currentVersion && compareReleaseVersions(payload.version, currentVersion) <= 0) {
          throw new Error('release_version_not_newer');
        }

        return {
          allowedContentTypes:
            payload.kind === 'updater'
              ? ['application/gzip', 'application/x-gzip', 'application/octet-stream']
              : ['application/x-apple-diskimage', 'application/octet-stream'],
          maximumSizeInBytes: 1024 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 31_536_000,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async () => {
        // The authenticated publish request validates the final Blob URLs and activates the feed.
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json(
      { error: PUBLIC_UPLOAD_ERRORS.has(message) ? message : 'release_upload_failed' },
      { status: 400 },
    );
  }
}
