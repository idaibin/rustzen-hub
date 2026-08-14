import { BlobNotFoundError, head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/auth';
import { isSameRequestOrigin } from '@/lib/request-origin';
import { releaseArtifactPath, resolveUpdateProduct } from '@/lib/update-products';

export const runtime = 'nodejs';

type ResolveAssetBody = {
  product?: unknown;
  version?: unknown;
  kind?: unknown;
  fileName?: unknown;
  size?: unknown;
};

export async function POST(request: NextRequest) {
  if (!isSameRequestOrigin(request) || !(await hasAdminSession())) {
    return NextResponse.json({ error: 'release_asset_resolve_unauthorized' }, { status: 401 });
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'blob_store_not_configured' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as ResolveAssetBody;
    const product = resolveUpdateProduct(typeof body.product === 'string' ? body.product : null);
    if (!product || body.product !== product.code) {
      return NextResponse.json({ error: 'unsupported_update_product' }, { status: 404 });
    }
    if (
      typeof body.version !== 'string' ||
      typeof body.fileName !== 'string' ||
      body.kind !== 'updater' ||
      !Number.isSafeInteger(body.size) ||
      (body.size as number) <= 0
    ) {
      throw new Error('invalid_release_asset');
    }
    if (body.kind === 'updater' && !body.fileName.endsWith('.app.tar.gz')) {
      throw new Error('invalid_updater_archive');
    }
    const stored = await head(releaseArtifactPath(product, body.version, body.fileName), { token });
    if (stored.size !== body.size) {
      return NextResponse.json({ error: 'release_asset_metadata_mismatch' }, { status: 409 });
    }
    return NextResponse.json({
      asset: {
        fileName: body.fileName,
        url: stored.url,
        downloadUrl: stored.downloadUrl,
        size: stored.size,
      },
    });
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return NextResponse.json({ error: 'release_asset_not_found' }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : '';
    const publicError = new Set([
      'invalid_release_asset',
      'invalid_release_version',
      'invalid_release_file_name',
      'unsupported_release_file',
      'invalid_updater_archive',
    ]).has(message);
    return NextResponse.json(
      { error: publicError ? message : 'release_asset_resolve_failed' },
      { status: publicError ? 400 : 500 },
    );
  }
}
