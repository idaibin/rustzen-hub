export type Locale = 'en' | 'zh';

const ZH_PREFIX = '/zh';

/** Slugs (relative to locale root) that have a /zh mirror. '' === home. */
const MIRRORED = new Set([
  '',
  'products',
  'products/clear',
  'download',
  'docs',
  'about',
  'pricing',
  'help',
  'contact',
]);

export function getLocale(pathname: string): Locale {
  return pathname === ZH_PREFIX || pathname.startsWith(`${ZH_PREFIX}/`) ? 'zh' : 'en';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'zh' ? 'en' : 'zh';
}

/** Pick the value for the given locale. */
export function pick<T>(locale: Locale, en: T, zh: T): T {
  return locale === 'zh' ? zh : en;
}

/** Path to the same logical page in a target locale. Falls back to that locale's home. */
export function altPath(pathname: string, target: Locale): string {
  const cleaned = pathname.replace(/\/$/, '') || '/';
  const isZh = cleaned.startsWith(ZH_PREFIX);
  const base = isZh ? cleaned.slice(ZH_PREFIX.length) || '/' : cleaned;
  const slug = base === '/' ? '' : base.replace(/^\//, '');
  const hasMirror = MIRRORED.has(slug);
  if (target === 'zh') {
    return hasMirror && slug ? `/zh/${slug}` : '/zh';
  }
  return hasMirror && slug ? `/${slug}` : '/';
}

/** Whether the current page has a real /zh equivalent (for hreflang). */
export function hasZhMirror(pathname: string): boolean {
  const cleaned = pathname.replace(/\/$/, '') || '/';
  const isZh = cleaned.startsWith(ZH_PREFIX);
  const base = isZh ? cleaned.slice(ZH_PREFIX.length) || '/' : cleaned;
  const slug = base === '/' ? '' : base.replace(/^\//, '');
  return MIRRORED.has(slug);
}

/** Resolve a nav/page slug + optional anchor to a locale-correct href. */
export function localeHref(locale: Locale, slug: string, anchor?: string): string {
  const base = locale === 'zh' ? (slug ? `/zh/${slug}` : '/zh') : slug ? `/${slug}` : '/';
  return anchor ? `${base}#${anchor}` : base;
}
