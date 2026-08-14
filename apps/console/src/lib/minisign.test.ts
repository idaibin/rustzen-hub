import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';
import test from 'node:test';
import { verifyTauriUpdaterSignature } from './minisign.ts';

function publicKeyEnvelope(packet: Buffer) {
  return Buffer.from(
    `untrusted comment: minisign public key\n${packet.toString('base64')}\n`,
  ).toString('base64');
}

function signatureEnvelope(packet: Buffer, privateKey: KeyObject) {
  const trustedComment = 'timestamp:1783994887\tfile:Updater.app.tar.gz';
  const globalSignature = sign(
    null,
    Buffer.concat([packet.subarray(10), Buffer.from(trustedComment)]),
    privateKey,
  );
  return Buffer.from(
    `untrusted comment: signature from tauri secret key\n${packet.toString('base64')}\ntrusted comment: ${trustedComment}\n${globalSignature.toString('base64')}\n`,
  ).toString('base64');
}

test('verifies the prehashed minisign packets emitted for Tauri updater artifacts', () => {
  const artifact = Buffer.from('signed updater artifact');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const rawPublicKey = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  const keyId = Buffer.from('0123456789abcdef', 'hex');
  const publicPacket = Buffer.concat([Buffer.from('Ed'), keyId, rawPublicKey]);
  const digest = createHash('blake2b512').update(artifact).digest();
  const signaturePacket = Buffer.concat([Buffer.from('ED'), keyId, sign(null, digest, privateKey)]);

  const encodedPublicKey = publicKeyEnvelope(publicPacket);
  const encodedSignature = signatureEnvelope(signaturePacket, privateKey);
  assert.doesNotThrow(() =>
    verifyTauriUpdaterSignature(artifact, encodedSignature, encodedPublicKey),
  );
  assert.throws(() =>
    verifyTauriUpdaterSignature(Buffer.from('tampered'), encodedSignature, encodedPublicKey),
    /updater_signature_verification_failed/,
  );
  const truncated = Buffer.from(encodedSignature, 'base64').toString('utf8').split('\n').slice(0, 2).join('\n');
  assert.throws(
    () => verifyTauriUpdaterSignature(artifact, Buffer.from(truncated).toString('base64'), encodedPublicKey),
    /invalid_updater_signature/,
  );
  const tamperedComment = Buffer.from(encodedSignature, 'base64')
    .toString('utf8')
    .replace('Updater.app.tar.gz', 'Tampered.app.tar.gz');
  assert.throws(
    () => verifyTauriUpdaterSignature(artifact, Buffer.from(tamperedComment).toString('base64'), encodedPublicKey),
    /updater_global_signature_verification_failed/,
  );
});
