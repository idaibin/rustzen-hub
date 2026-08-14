import { get, head, put, type HeadBlobResult } from '@vercel/blob';
import { createHash } from 'node:crypto';
import { verifyTauriUpdaterDigest } from './minisign.ts';
import { releaseArtifactPath } from './update-products.ts';
import type {
  TauriUpdateManifest,
  UploadedReleaseAsset,
  UploadedTauriRelease,
} from './tauri-release.ts';

const MAX_MANIFEST_BYTES = 1024 * 1024;

function assertStoredMetadata(asset: UploadedReleaseAsset, stored: HeadBlobResult) {
  if (
    stored.url !== asset.url ||
    stored.downloadUrl !== asset.downloadUrl ||
    stored.size !== asset.size
  ) {
    throw new Error('release_asset_metadata_mismatch');
  }
}

export async function verifyStoredReleaseAssets(
  release: UploadedTauriRelease,
  token: string,
) {
  const updaterPath = releaseArtifactPath(
    release.product,
    release.version,
    release.updater.fileName,
  );
  const updater = await get(updaterPath, {
    access: 'public',
    token,
    useCache: false,
  });
  if (!updater || updater.statusCode !== 200) throw new Error('release_asset_not_found');
  assertStoredMetadata(release.updater, updater.blob);

  const digest = createHash('blake2b512');
  const reader = updater.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    digest.update(value);
  }
  verifyTauriUpdaterDigest(digest.digest(), release.signature, release.product.updaterPublicKey);

  if (release.dmg) {
    const dmgPath = releaseArtifactPath(release.product, release.version, release.dmg.fileName);
    const dmg = await head(dmgPath, { token });
    assertStoredMetadata(release.dmg, dmg);
  }
}

function equivalentManifest(left: unknown, right: TauriUpdateManifest) {
  if (!left || typeof left !== 'object') return false;
  const { pub_date: _existingDate, ...existing } = left as Partial<TauriUpdateManifest>;
  const { pub_date: _newDate, ...candidate } = right;
  return JSON.stringify(existing) === JSON.stringify(candidate);
}

async function existingManifest(path: string, manifest: TauriUpdateManifest, token: string) {
  const stored = await get(path, { access: 'public', token, useCache: false });
  if (!stored || stored.statusCode !== 200) return null;
  if (stored.blob.size > MAX_MANIFEST_BYTES) throw new Error('release_manifest_conflict');
  const body = await new Response(stored.stream).json().catch(() => null);
  if (!equivalentManifest(body, manifest)) throw new Error('release_manifest_conflict');
  return stored.blob;
}

export async function publishImmutableManifest(
  path: string,
  manifest: TauriUpdateManifest,
  token: string,
) {
  const reusable = await existingManifest(path, manifest, token);
  if (reusable) return reusable;

  try {
    return await put(path, `${JSON.stringify(manifest, null, 2)}\n`, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31_536_000,
      contentType: 'application/json',
      token,
    });
  } catch (error) {
    const raced = await existingManifest(path, manifest, token);
    if (raced) return raced;
    throw error;
  }
}
