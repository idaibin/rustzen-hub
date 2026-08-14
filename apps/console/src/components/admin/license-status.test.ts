import assert from 'node:assert/strict';
import test from 'node:test';
import { effectiveLicenseStatus, licenseStatusTone } from './license-status.ts';

test('expired active licenses use caution semantics in every consumer', () => {
  const status = effectiveLicenseStatus(
    { status: 'ACTIVE', expiresAt: new Date('2026-07-01T00:00:00.000Z') },
    new Date('2026-07-02T00:00:00.000Z').getTime(),
  );

  assert.equal(status, 'EXPIRED');
  assert.equal(licenseStatusTone(status), 'caution');
});

test('non-active persisted states remain authoritative', () => {
  assert.equal(
    effectiveLicenseStatus({ status: 'REVOKED', expiresAt: new Date('2026-07-01T00:00:00.000Z') }),
    'REVOKED',
  );
});
