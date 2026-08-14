import assert from 'node:assert/strict';
import test from 'node:test';
import { createTauriUpdateManifest, validateUploadedRelease } from './tauri-release.ts';
import { resolveUpdateProduct } from './update-products.ts';

const blobOrigin = 'https://release-store.public.blob.vercel-storage.com';

test('builds a signed universal Zipper updater manifest from uploaded assets', () => {
  const product = resolveUpdateProduct('rustzen-zipper');
  assert.ok(product);

  const release = validateUploadedRelease({
    product,
    version: '0.2.0',
    notes: 'Zipper 0.2.0',
    updater: {
      fileName: 'RustzenZipper.app.tar.gz',
      url: `${blobOrigin}/rustzen-zipper/releases/v0.2.0/RustzenZipper.app.tar.gz`,
      downloadUrl: `${blobOrigin}/rustzen-zipper/releases/v0.2.0/RustzenZipper.app.tar.gz?download=1`,
      size: 2048,
    },
    signatureFileName: 'RustzenZipper.app.tar.gz.sig',
    signature: 'c2lnbmVkLXppcHBlcg==',
    dmg: {
      fileName: 'RustzenZipper_0.2.0_universal.dmg',
      url: `${blobOrigin}/rustzen-zipper/releases/v0.2.0/RustzenZipper_0.2.0_universal.dmg`,
      downloadUrl: `${blobOrigin}/rustzen-zipper/releases/v0.2.0/RustzenZipper_0.2.0_universal.dmg?download=1`,
      size: 4096,
    },
  });
  const manifest = createTauriUpdateManifest(release, '2026-07-23T12:00:00.000Z');

  assert.equal(manifest.version, '0.2.0');
  assert.equal(manifest.platforms['darwin-universal'].signature, 'c2lnbmVkLXppcHBlcg==');
  assert.equal(manifest.platforms['darwin-aarch64'].size, 2048);
  assert.equal(manifest.downloads['darwin-universal']?.type, 'dmg');
});

test('rejects mismatched paths, signatures, and non-Blob upload origins', () => {
  const product = resolveUpdateProduct('rustzen-clipboard');
  assert.ok(product);

  const valid = {
    product,
    version: '0.2.0',
    notes: '',
    updater: {
      fileName: 'RustzenClipboard.app.tar.gz',
      url: `${blobOrigin}/rustzen-clipboard/releases/v0.2.0/RustzenClipboard.app.tar.gz`,
      downloadUrl: `${blobOrigin}/rustzen-clipboard/releases/v0.2.0/RustzenClipboard.app.tar.gz?download=1`,
      size: 2048,
    },
    signatureFileName: 'RustzenClipboard.app.tar.gz.sig',
    signature: 'c2lnbmVkLWNsaXBib2FyZA==',
    dmg: null,
  };

  assert.throws(() =>
    validateUploadedRelease({
      ...valid,
      signatureFileName: 'another.sig',
    }),
  );
  assert.throws(() =>
    validateUploadedRelease({
      ...valid,
      updater: { ...valid.updater, url: 'https://example.com/archive.app.tar.gz' },
    }),
  );
  assert.throws(() =>
    validateUploadedRelease({
      ...valid,
      updater: {
        ...valid.updater,
        url: `${blobOrigin}/rustzen-clear/releases/v0.2.0/RustzenClipboard.app.tar.gz`,
      },
    }),
  );
});
