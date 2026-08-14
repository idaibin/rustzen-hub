import { releaseArtifactPath, type UpdateProductConfig } from './update-products.ts';

const MAX_RELEASE_ASSET_BYTES = 1024 * 1024 * 1024;
const MAX_RELEASE_NOTES_LENGTH = 10_000;
const MAX_SIGNATURE_LENGTH = 16_384;

export type UploadedReleaseAsset = {
  fileName: string;
  url: string;
  downloadUrl: string;
  size: number;
};

export type UploadedTauriRelease = {
  product: UpdateProductConfig;
  version: string;
  notes: string;
  updater: UploadedReleaseAsset;
  signatureFileName: string;
  signature: string;
  dmg: UploadedReleaseAsset | null;
};

export type TauriUpdateManifest = {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, { url: string; size: number; signature: string }>;
  downloads: Record<string, { url: string; size: number; type: 'dmg' }>;
};

function assertBlobAsset(
  product: UpdateProductConfig,
  version: string,
  asset: UploadedReleaseAsset,
) {
  const expectedPath = releaseArtifactPath(product, version, asset.fileName);
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > MAX_RELEASE_ASSET_BYTES) {
    throw new Error('invalid_release_asset_size');
  }

  const urls = [asset.url, asset.downloadUrl].map((value) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error('invalid_release_asset_url');
    }
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      !parsed.hostname.endsWith('.public.blob.vercel-storage.com')
    ) {
      throw new Error('invalid_release_asset_url');
    }
    if (decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) !== expectedPath) {
      throw new Error('release_asset_path_mismatch');
    }
    return parsed;
  });

  if (urls[0].origin !== urls[1].origin) throw new Error('release_asset_origin_mismatch');
  return urls[0].origin;
}

export function validateUploadedRelease(input: UploadedTauriRelease) {
  const notes = input.notes.trim();
  if (notes.length > MAX_RELEASE_NOTES_LENGTH) throw new Error('release_notes_too_long');
  if (!input.updater.fileName.endsWith('.app.tar.gz')) throw new Error('invalid_updater_archive');
  if (input.signatureFileName !== `${input.updater.fileName}.sig`) {
    throw new Error('updater_signature_file_mismatch');
  }

  const signature = input.signature.trim();
  if (
    !signature ||
    signature.length > MAX_SIGNATURE_LENGTH ||
    !/^[A-Za-z0-9+/=\r\n]+$/.test(signature)
  ) {
    throw new Error('invalid_updater_signature');
  }

  const updaterOrigin = assertBlobAsset(input.product, input.version, input.updater);
  if (input.dmg) {
    if (!input.dmg.fileName.endsWith('.dmg')) throw new Error('invalid_dmg_asset');
    const dmgOrigin = assertBlobAsset(input.product, input.version, input.dmg);
    if (dmgOrigin !== updaterOrigin) throw new Error('release_asset_origin_mismatch');
  }

  return { ...input, notes, signature };
}

export function createTauriUpdateManifest(
  input: UploadedTauriRelease,
  publicationDate = new Date().toISOString(),
): TauriUpdateManifest {
  const release = validateUploadedRelease(input);
  const updater = {
    url: release.updater.downloadUrl,
    size: release.updater.size,
    signature: release.signature,
  };

  return {
    version: release.version,
    notes: release.notes || `Release ${release.version}`,
    pub_date: publicationDate,
    platforms: {
      'darwin-aarch64': updater,
      'darwin-x86_64': updater,
      'darwin-universal': updater,
    },
    downloads: release.dmg
      ? {
          'darwin-universal': {
            url: release.dmg.downloadUrl,
            size: release.dmg.size,
            type: 'dmg',
          },
        }
      : {},
  };
}
