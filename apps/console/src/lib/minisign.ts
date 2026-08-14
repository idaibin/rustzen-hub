import { createHash, createPublicKey, verify } from 'node:crypto';

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const MINISIGN_PUBLIC_KEY_BYTES = 42;
const MINISIGN_SIGNATURE_BYTES = 74;

function decodeBase64(value: string, error: string) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error(error);
  const decoded = Buffer.from(normalized, 'base64');
  if (decoded.toString('base64').replace(/=+$/, '') !== normalized.replace(/=+$/, '')) {
    throw new Error(error);
  }
  return decoded;
}

function decodePublicKeyEnvelope(value: string) {
  const envelope = decodeBase64(value, 'invalid_updater_public_key').toString('utf8');
  const lines = envelope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 2 || !lines[0].startsWith('untrusted comment: ')) {
    throw new Error('invalid_updater_public_key');
  }
  return decodeBase64(lines[1], 'invalid_updater_public_key');
}

function decodeSignatureEnvelope(value: string) {
  const envelope = decodeBase64(value, 'invalid_updater_signature').toString('utf8');
  const lines = envelope.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (
    lines.length !== 4 ||
    !lines[0].startsWith('untrusted comment: ') ||
    !lines[2].startsWith('trusted comment: ')
  ) {
    throw new Error('invalid_updater_signature');
  }
  const globalSignature = decodeBase64(lines[3], 'invalid_updater_signature');
  if (globalSignature.length !== 64) throw new Error('invalid_updater_signature');
  return {
    packet: decodeBase64(lines[1], 'invalid_updater_signature'),
    trustedComment: lines[2].slice('trusted comment: '.length),
    globalSignature,
  };
}

export function verifyTauriUpdaterSignature(
  artifact: Uint8Array,
  encodedSignature: string,
  encodedPublicKey: string,
) {
  const digest = createHash('blake2b512').update(artifact).digest();
  verifyTauriUpdaterDigest(digest, encodedSignature, encodedPublicKey);
}

export function verifyTauriUpdaterDigest(
  digest: Uint8Array,
  encodedSignature: string,
  encodedPublicKey: string,
) {
  if (digest.byteLength !== 64) throw new Error('invalid_updater_digest');
  const publicKeyPacket = decodePublicKeyEnvelope(encodedPublicKey);
  const signatureEnvelope = decodeSignatureEnvelope(encodedSignature);
  const signaturePacket = signatureEnvelope.packet;
  if (
    publicKeyPacket.length !== MINISIGN_PUBLIC_KEY_BYTES ||
    signaturePacket.length !== MINISIGN_SIGNATURE_BYTES
  ) {
    throw new Error('invalid_updater_signature');
  }

  const publicAlgorithm = publicKeyPacket.subarray(0, 2).toString('ascii');
  const signatureAlgorithm = signaturePacket.subarray(0, 2).toString('ascii');
  if (publicAlgorithm !== 'Ed' || signatureAlgorithm !== 'ED') {
    throw new Error('unsupported_updater_signature_algorithm');
  }
  if (!publicKeyPacket.subarray(2, 10).equals(signaturePacket.subarray(2, 10))) {
    throw new Error('updater_signature_key_mismatch');
  }

  const publicKey = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, publicKeyPacket.subarray(10)]),
    format: 'der',
    type: 'spki',
  });
  if (!verify(null, digest, publicKey, signaturePacket.subarray(10))) {
    throw new Error('updater_signature_verification_failed');
  }
  const globalMessage = Buffer.concat([
    signaturePacket.subarray(10),
    Buffer.from(signatureEnvelope.trustedComment),
  ]);
  if (!verify(null, globalMessage, publicKey, signatureEnvelope.globalSignature)) {
    throw new Error('updater_global_signature_verification_failed');
  }
}
