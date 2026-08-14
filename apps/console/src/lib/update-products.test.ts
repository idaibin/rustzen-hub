import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareReleaseVersions,
  newestReleaseVersion,
  isAllowedUpdateAssetPath,
  isPublishedManifestUrl,
  releaseArtifactPath,
  resolveUpdateProduct,
  updateBlobOrigin,
  updateManifestUrl,
  updateProductForAssetPath,
  versionManifestPath,
} from './update-products.ts';

test('accepts strict SemVer and orders prereleases before stable versions', () => {
  assert.equal(compareReleaseVersions('1.2.3', '1.2.2'), 1);
  assert.equal(compareReleaseVersions('1.2.3-beta.2', '1.2.3-beta.1'), 1);
  assert.equal(compareReleaseVersions('1.2.3', '1.2.3-rc.1'), 1);
  assert.equal(compareReleaseVersions('1.2.3+build.2', '1.2.3+build.1'), 0);
  assert.equal(newestReleaseVersion(['1.2.0', 'invalid', '1.3.0-beta.1', '1.2.9']), '1.3.0-beta.1');

  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(zipper);
  assert.throws(() => releaseArtifactPath(zipper, '01.2.3', 'Zipper.app.tar.gz'));
  assert.throws(() => releaseArtifactPath(zipper, '1.2.3-alpha..1', 'Zipper.app.tar.gz'));
});

test('keeps Clear as the backward-compatible default and resolves all desktop products', () => {
  assert.equal(resolveUpdateProduct(null)?.code, 'rustzen-clear');
  assert.equal(resolveUpdateProduct('rustzen-clear')?.code, 'rustzen-clear');
  assert.equal(resolveUpdateProduct('rustzen-clipboard')?.code, 'rustzen-clipboard');
  assert.equal(resolveUpdateProduct('rustzen-zipper')?.code, 'rustzen-zipper');
  assert.equal(resolveUpdateProduct('unknown-product'), null);
});

test('keeps existing Clear and Clipboard feeds on their separate Blob stores', () => {
  const clear = resolveUpdateProduct('rustzen-clear');
  const clipboard = resolveUpdateProduct('rustzen-clipboard');
  assert.ok(clear);
  assert.ok(clipboard);

  assert.match(updateManifestUrl(clear) ?? '', /zlobtosdpjhocxfj\.public\.blob/);
  assert.match(updateManifestUrl(clipboard) ?? '', /yqwq1mrybgmcdbdp\.public\.blob/);
  assert.notEqual(updateBlobOrigin(clear), updateBlobOrigin(clipboard));
});

test('requires a configured Zipper feed until the first dashboard release is published', () => {
  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(zipper);

  const manifestUrl = process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL;
  const blobOrigin = process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN;
  delete process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL;
  delete process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN;
  try {
    assert.equal(updateManifestUrl(zipper), null);
    assert.equal(updateBlobOrigin(zipper), null);
  } finally {
    if (manifestUrl !== undefined) process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL = manifestUrl;
    if (blobOrigin !== undefined) process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN = blobOrigin;
  }
});

test('isolates release artifact paths by product and version', () => {
  const clipboard = resolveUpdateProduct('rustzen-clipboard');
  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(clipboard);
  assert.ok(zipper);

  const clipboardPath = releaseArtifactPath(
    clipboard,
    '0.2.0',
    'RustzenClipboard.app.tar.gz',
  );
  assert.equal(
    clipboardPath,
    'rustzen-clipboard/releases/v0.2.0/RustzenClipboard.app.tar.gz',
  );
  assert.equal(isAllowedUpdateAssetPath(clipboardPath, clipboard), true);
  assert.equal(isAllowedUpdateAssetPath(clipboardPath, zipper), false);
  assert.equal(updateProductForAssetPath(clipboardPath)?.code, 'rustzen-clipboard');
});

test('rejects traversal and unsupported update assets', () => {
  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(zipper);

  assert.throws(() => releaseArtifactPath(zipper, '../0.2.0', 'Zipper.app.tar.gz'));
  assert.throws(() => releaseArtifactPath(zipper, '0.2.0', '../Zipper.app.tar.gz'));
  assert.equal(
    isAllowedUpdateAssetPath('rustzen-zipper/releases/v0.2.0/notes.txt', zipper),
    false,
  );
});

test('accepts only the product latest path as a dashboard-published manifest', () => {
  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(zipper);

  assert.equal(
    isPublishedManifestUrl(
      zipper,
      'https://store.public.blob.vercel-storage.com/rustzen-zipper/releases/latest/rustzen-zipper-updates.json',
    ),
    true,
  );
  assert.equal(
    isPublishedManifestUrl(
      zipper,
      `https://store.public.blob.vercel-storage.com/${versionManifestPath(zipper, '1.2.3')}`,
    ),
    true,
  );
  assert.equal(
    isPublishedManifestUrl(
      zipper,
      'https://store.public.blob.vercel-storage.com/rustzen-clear/releases/latest/zen-clear-updates.json',
    ),
    false,
  );
  assert.equal(isPublishedManifestUrl(zipper, 'https://example.com/updates.json'), false);
});

test('uses product-specific environment overrides and derives an origin from the feed', () => {
  const zipper = resolveUpdateProduct('rustzen-zipper');
  assert.ok(zipper);

  const manifestUrl = process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL;
  const blobOrigin = process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN;
  process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL =
    ' https://zipper.example/rustzen-zipper/releases/latest/rustzen-zipper-updates.json ';
  delete process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN;
  try {
    assert.equal(
      updateManifestUrl(zipper),
      'https://zipper.example/rustzen-zipper/releases/latest/rustzen-zipper-updates.json',
    );
    assert.equal(updateBlobOrigin(zipper), 'https://zipper.example');
  } finally {
    if (manifestUrl === undefined) delete process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL;
    else process.env.RUSTZEN_ZIPPER_UPDATE_MANIFEST_URL = manifestUrl;
    if (blobOrigin === undefined) delete process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN;
    else process.env.RUSTZEN_ZIPPER_UPDATE_BLOB_ORIGIN = blobOrigin;
  }
});
