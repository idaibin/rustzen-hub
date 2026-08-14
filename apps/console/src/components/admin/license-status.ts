import type { BadgeProps } from '@/components/ui/badge';
import type { LicenseStatus } from '@prisma/client';

export type LicenseStatusTone = NonNullable<BadgeProps['variant']>;

export function licenseStatusTone(status: string): LicenseStatusTone {
  if (status === 'ACTIVE') return 'safe';
  if (status === 'EXPIRED') return 'caution';
  if (status === 'REVOKED') return 'danger';
  return 'muted';
}

/**
 * Temporal license policy shared by every dashboard representation. Persisted
 * status remains authoritative for revocation/inactivation; an active license
 * becomes effectively expired once its expiration instant has passed.
 */
export function effectiveLicenseStatus(
  license: Pick<{ status: LicenseStatus; expiresAt: Date | null }, 'status' | 'expiresAt'>,
  now = Date.now(),
): LicenseStatus {
  if (license.status === 'ACTIVE' && license.expiresAt && license.expiresAt.getTime() <= now) {
    return 'EXPIRED';
  }

  return license.status;
}
