const CLEAR_BLOB_ORIGIN = 'https://zlobtosdpjhocxfj.public.blob.vercel-storage.com';
const CLIPBOARD_BLOB_ORIGIN = 'https://yqwq1mrybgmcdbdp.public.blob.vercel-storage.com';

export type UpdateProductCode = 'rustzen-clear' | 'rustzen-clipboard' | 'rustzen-zipper';

export type UpdateProductConfig = {
  code: UpdateProductCode;
  name: string;
  description: string;
  assetPrefix: string;
  manifestName: string;
  manifestEnvironmentName:
    | 'RUSTZEN_CLEAR_UPDATE_MANIFEST_URL'
    | 'RUSTZEN_CLIPBOARD_UPDATE_MANIFEST_URL'
    | 'RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL';
  blobOriginEnvironmentName:
    | 'RUSTZEN_CLEAR_UPDATE_BLOB_ORIGIN'
    | 'RUSTZEN_CLIPBOARD_UPDATE_BLOB_ORIGIN'
    | 'RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN';
  defaultManifestUrl: string | null;
  updaterPublicKey: string;
  inferredDmgName(version: string): string;
};

const UPDATE_PRODUCTS: Record<UpdateProductCode, UpdateProductConfig> = {
  'rustzen-clear': {
    code: 'rustzen-clear',
    name: 'Zen Clear',
    description: 'A lightweight macOS cleaner for developer environments.',
    assetPrefix: 'rustzen-clear/releases',
    manifestName: 'zen-clear-updates.json',
    manifestEnvironmentName: 'RUSTZEN_CLEAR_UPDATE_MANIFEST_URL',
    blobOriginEnvironmentName: 'RUSTZEN_CLEAR_UPDATE_BLOB_ORIGIN',
    defaultManifestUrl:
      `${CLEAR_BLOB_ORIGIN}/rustzen-clear/releases/latest/zen-clear-updates.json`,
    updaterPublicKey:
      'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IERCOEM2OEMyNjAxNjIxN0MKUldSOElSWmd3bWlNMiszZElkSVplYmYwVzlIZlFpNkR3SERhTlprT0NxZGZzbUN0TmVGMFlRcHIK',
    inferredDmgName: (version) => `ZenClear_${version}_universal.dmg`,
  },
  'rustzen-clipboard': {
    code: 'rustzen-clipboard',
    name: 'Rustzen Clipboard',
    description: 'A local-first clipboard history app for macOS.',
    assetPrefix: 'rustzen-clipboard/releases',
    manifestName: 'rustzen-clipboard-updates.json',
    manifestEnvironmentName: 'RUSTZEN_CLIPBOARD_UPDATE_MANIFEST_URL',
    blobOriginEnvironmentName: 'RUSTZEN_CLIPBOARD_UPDATE_BLOB_ORIGIN',
    defaultManifestUrl:
      `${CLIPBOARD_BLOB_ORIGIN}/rustzen-clipboard/releases/latest/rustzen-clipboard-updates.json`,
    updaterPublicKey:
      'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEE4NzE4MENFNjcwQ0E3RjYKUldUMnB3eG56b0J4cUkrWkdOOEtza0oyWG9qN3ROU0wrSVhCb1k1aVVVQVhLenA0VVhzMTJBZGkK',
    inferredDmgName: (version) => `RustzenClipboard_${version}_universal.dmg`,
  },
  'rustzen-zipper': {
    code: 'rustzen-zipper',
    name: 'Rustzen Zipper',
    description: 'A native archive utility for macOS.',
    assetPrefix: 'rustzen-zipper/releases',
    manifestName: 'rustzen-zipper-updates.json',
    manifestEnvironmentName: 'RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL',
    blobOriginEnvironmentName: 'RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN',
    defaultManifestUrl: null,
    updaterPublicKey:
      'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRDMDRGMUM5NTZCOEUyREMKUldUYzRyaFd5ZkVFVEU4TE9xYVB0WWJXbzJtZVVhaHpkYWZtaUNjZDd3TFpsYVZvQUJFdzdIU1gK',
    inferredDmgName: (version) => `RustzenZipper_${version}_universal.dmg`,
  },
};

const RELEASE_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function assertReleaseVersion(version: string) {
  if (!RELEASE_VERSION_PATTERN.test(version)) throw new Error('invalid_release_version');
  return version;
}

export function compareReleaseVersions(left: string, right: string) {
  assertReleaseVersion(left);
  assertReleaseVersion(right);

  const parse = (value: string) => {
    const [withoutBuild] = value.split('+');
    const prereleaseIndex = withoutBuild.indexOf('-');
    const core = prereleaseIndex === -1 ? withoutBuild : withoutBuild.slice(0, prereleaseIndex);
    const prerelease = prereleaseIndex === -1 ? '' : withoutBuild.slice(prereleaseIndex + 1);
    return {
      core: core.split('.').map(Number),
      prerelease: prerelease ? prerelease.split('.') : [],
    };
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length ? -1 : 1;
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index];
    const rightPart = b.prerelease[index];
    if (leftPart === undefined || rightPart === undefined) return leftPart === undefined ? -1 : 1;
    if (leftPart === rightPart) continue;
    const leftNumber = /^\d+$/.test(leftPart);
    const rightNumber = /^\d+$/.test(rightPart);
    if (leftNumber && rightNumber) return Number(leftPart) > Number(rightPart) ? 1 : -1;
    if (leftNumber !== rightNumber) return leftNumber ? -1 : 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

export function newestReleaseVersion(versions: string[]) {
  return versions.reduce<string | null>((newest, version) => {
    try {
      return !newest || compareReleaseVersions(version, newest) > 0 ? version : newest;
    } catch {
      return newest;
    }
  }, null);
}

export function listUpdateProducts() {
  return Object.values(UPDATE_PRODUCTS);
}

export function resolveUpdateProduct(value: string | null) {
  if (!value) return UPDATE_PRODUCTS['rustzen-clear'];
  return UPDATE_PRODUCTS[value as UpdateProductCode] ?? null;
}

export function updateProductForAssetPath(path: string) {
  return listUpdateProducts().find((product) => path.startsWith(`${product.assetPrefix}/`)) ?? null;
}

export function updateManifestUrl(product: UpdateProductConfig) {
  return process.env[product.manifestEnvironmentName]?.trim() || product.defaultManifestUrl;
}

export function updateBlobOrigin(product: UpdateProductConfig, manifestUrl = updateManifestUrl(product)) {
  const configuredOrigin = process.env[product.blobOriginEnvironmentName]?.trim().replace(/\/+$/, '');
  if (configuredOrigin) return configuredOrigin;
  if (!manifestUrl) return null;

  try {
    return new URL(manifestUrl).origin;
  } catch {
    return null;
  }
}

export function releaseArtifactPath(
  product: UpdateProductConfig,
  version: string,
  fileName: string,
) {
  assertReleaseVersion(version);
  if (
    !fileName ||
    fileName !== fileName.trim() ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName === '.' ||
    fileName === '..'
  ) {
    throw new Error('invalid_release_file_name');
  }
  if (!/\.(?:app\.tar\.gz|dmg)$/.test(fileName)) {
    throw new Error('unsupported_release_file');
  }

  return `${product.assetPrefix}/v${version}/${fileName}`;
}

export function latestManifestPath(product: UpdateProductConfig) {
  return `${product.assetPrefix}/latest/${product.manifestName}`;
}

export function versionManifestPath(product: UpdateProductConfig, version: string) {
  assertReleaseVersion(version);
  return `${product.assetPrefix}/v${version}/${product.manifestName}`;
}

export function isPublishedManifestUrl(product: UpdateProductConfig, value: string) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      parsed.hostname.endsWith('.public.blob.vercel-storage.com') &&
      (() => {
        const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
        if (path === latestManifestPath(product)) return true;
        const prefix = `${product.assetPrefix}/v`;
        if (!path.startsWith(prefix) || !path.endsWith(`/${product.manifestName}`)) return false;
        const version = path.slice(prefix.length, -`/${product.manifestName}`.length);
        try {
          assertReleaseVersion(version);
          return true;
        } catch {
          return false;
        }
      })()
    );
  } catch {
    return false;
  }
}

export function isAllowedUpdateAssetPath(path: string, product: UpdateProductConfig) {
  const match = path.match(/^(.+)\/v([^/]+)\/([^/]+)$/);
  if (!match || match[1] !== product.assetPrefix) return false;

  try {
    return releaseArtifactPath(product, match[2], match[3]) === path;
  } catch {
    return false;
  }
}
