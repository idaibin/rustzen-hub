import { prisma } from '@/lib/prisma';
import {
  isPublishedManifestUrl,
  newestReleaseVersion,
  updateManifestUrl,
  type UpdateProductConfig,
} from '@/lib/update-products';

export async function resolvePublishedUpdateManifestUrl(product: UpdateProductConfig) {
  if (!process.env.POSTGRES_URL) return updateManifestUrl(product);

  try {
    const published = await prisma.appVersion.findMany({
      where: {
        platform: 'tauri-updater',
        downloadUrl: { not: null },
        product: { code: product.code },
      },
      select: { downloadUrl: true, version: true },
    });
    const candidates = published.filter(
        (release): release is { version: string; downloadUrl: string } =>
          Boolean(release.downloadUrl && isPublishedManifestUrl(product, release.downloadUrl)),
      );
    const activeVersion = newestReleaseVersion(candidates.map((release) => release.version));
    const active = candidates.find((release) => release.version === activeVersion);
    if (active) {
      return active.downloadUrl;
    }
  } catch {
    // Static product feeds remain available when release metadata storage is unavailable.
  }

  return updateManifestUrl(product);
}
