'use client';

import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ReleaseProduct = {
  code: string;
  name: string;
};

type UploadedAsset = {
  fileName: string;
  url: string;
  downloadUrl: string;
  size: number;
};

type UploadProgress = {
  updater: number;
  dmg: number;
};

type PendingRelease = {
  product: string;
  version: string;
  notes: string;
  updater: UploadedAsset;
  signatureFileName: string;
  signature: string;
  dmgFileName: string | null;
  dmg: UploadedAsset | null;
};

const PENDING_RELEASE_KEY = 'rustzen.pending-release';

function isUploadedAsset(value: unknown): value is UploadedAsset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<UploadedAsset>;
  return (
    typeof asset.fileName === 'string' &&
    typeof asset.url === 'string' &&
    typeof asset.downloadUrl === 'string' &&
    typeof asset.size === 'number'
  );
}

function readPendingRelease(): PendingRelease | null {
  try {
    const raw = sessionStorage.getItem(PENDING_RELEASE_KEY);
    if (!raw) return null;
    const release = JSON.parse(raw) as Partial<PendingRelease>;
    if (
      typeof release.product !== 'string' ||
      typeof release.version !== 'string' ||
      typeof release.notes !== 'string' ||
      !isUploadedAsset(release.updater) ||
      typeof release.signatureFileName !== 'string' ||
      typeof release.signature !== 'string' ||
      (release.dmgFileName !== null && typeof release.dmgFileName !== 'string') ||
      (release.dmg !== null && !isUploadedAsset(release.dmg))
    ) {
      throw new Error('invalid pending release');
    }
    return release as PendingRelease;
  } catch {
    sessionStorage.removeItem(PENDING_RELEASE_KEY);
    return null;
  }
}

const STRICT_SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function requiredFile(formData: FormData, name: string) {
  const value = formData.get(name);
  if (!(value instanceof File) || value.size === 0) throw new Error(`${name}_required`);
  return value;
}

function optionalFile(formData: FormData, name: string) {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function releasePath(product: string, version: string, fileName: string) {
  return `${product}/releases/v${version}/${fileName}`;
}

export function TauriReleaseUpload({ products }: { products: ReleaseProduct[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ updater: 0, dmg: 0 });
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRelease, setPendingRelease] = useState<PendingRelease | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPendingRelease(readPendingRelease());
      setRecoveryReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function savePendingRelease(release: PendingRelease | null) {
    setPendingRelease(release);
    if (release) sessionStorage.setItem(PENDING_RELEASE_KEY, JSON.stringify(release));
    else sessionStorage.removeItem(PENDING_RELEASE_KEY);
  }

  async function publishRelease(release: PendingRelease) {
    const response = await fetch('/api/releases/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(release),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; update_url?: string } | null;
    if (!response.ok) throw new Error(payload?.error || 'release_publish_failed');
    return payload?.update_url || 'Release published.';
  }

  async function resumePendingRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stored = pendingRelease;
    if (!stored) return;
    setSubmitting(true);
    setError(null);
    try {
      let release = stored;
      if (stored.dmgFileName && !stored.dmg) {
        const formData = new FormData(event.currentTarget);
        const dmgFile = requiredFile(formData, 'pendingReleaseDmg');
        if (dmgFile.name !== stored.dmgFileName) throw new Error('pending_dmg_file_mismatch');
        release = {
          ...stored,
          dmg: await uploadAsset(stored.product, stored.version, 'dmg', dmgFile),
        };
        savePendingRelease(release);
      }

      setResult(await publishRelease(release));
      savePendingRelease(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'release_publish_failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadAsset(
    product: string,
    version: string,
    kind: 'updater' | 'dmg',
    file: File,
  ): Promise<UploadedAsset> {
    // The signed updater can be identified again during publish by its Minisign
    // digest. A DMG has no equivalent content identity, so never reuse one from
    // only its deterministic path and byte length after a lost client response.
    if (kind === 'updater') {
      const resolved = await fetch('/api/releases/assets/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ product, version, kind, fileName: file.name, size: file.size }),
      });
      if (resolved.ok) {
        const payload = (await resolved.json()) as { asset: UploadedAsset };
        setProgress((current) => ({ ...current, [kind]: 100 }));
        return payload.asset;
      }
      if (resolved.status !== 404) {
        const payload = (await resolved.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'release_asset_resolve_failed');
      }
    }

    const blob = await upload(releasePath(product, version, file.name), file, {
      access: 'public',
      handleUploadUrl: '/api/releases/upload',
      clientPayload: JSON.stringify({ product, version, kind, fileName: file.name }),
      contentType: kind === 'updater' ? 'application/gzip' : 'application/x-apple-diskimage',
      multipart: true,
      onUploadProgress: ({ percentage }) => {
        setProgress((current) => ({ ...current, [kind]: Math.round(percentage) }));
      },
    });

    return {
      fileName: file.name,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: file.size,
    };
  }

  async function submitRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setProgress({ updater: 0, dmg: 0 });
    setResult(null);
    setError(null);

    try {
      const formData = new FormData(form);
      const product = String(formData.get('releaseProduct') ?? '');
      const version = String(formData.get('releaseVersion') ?? '').trim();
      const notes = String(formData.get('releaseNotes') ?? '');
      const updaterFile = requiredFile(formData, 'updaterArchive');
      const signatureFile = requiredFile(formData, 'updaterSignature');
      const dmgFile = optionalFile(formData, 'releaseDmg');

      if (!STRICT_SEMVER_PATTERN.test(version)) {
        throw new Error('invalid_release_version');
      }
      if (!updaterFile.name.endsWith('.app.tar.gz')) throw new Error('invalid_updater_archive');
      if (signatureFile.name !== `${updaterFile.name}.sig`) {
        throw new Error('updater_signature_file_mismatch');
      }
      if (dmgFile && !dmgFile.name.endsWith('.dmg')) throw new Error('invalid_dmg_asset');

      const signature = await signatureFile.text();
      let release: PendingRelease = {
        product,
        version,
        notes,
        updater: await uploadAsset(product, version, 'updater', updaterFile),
        signatureFileName: signatureFile.name,
        signature,
        dmgFileName: dmgFile?.name ?? null,
        dmg: null,
      };
      // Persist each successful immutable upload immediately. A later upload or
      // publish failure can then resume without attempting to overwrite it.
      savePendingRelease(release);
      if (dmgFile) {
        release = {
          ...release,
          dmg: await uploadAsset(product, version, 'dmg', dmgFile),
        };
        savePendingRelease(release);
      }
      setResult(await publishRelease(release));
      savePendingRelease(null);
      form.reset();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'release_upload_failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (!recoveryReady) {
    return <p role="status" className="text-sm text-muted-foreground">Checking for an unfinished release…</p>;
  }

  if (pendingRelease) {
    const needsDmg = Boolean(pendingRelease.dmgFileName && !pendingRelease.dmg);
    return (
      <form onSubmit={resumePendingRelease} className="space-y-4">
        <Alert>
          <AlertTitle>Release awaiting publication</AlertTitle>
          <AlertDescription>
            Uploaded assets for {pendingRelease.product} {pendingRelease.version} are saved for recovery and must be resolved before starting another release.
          </AlertDescription>
        </Alert>
        {needsDmg ? (
          <div className="space-y-2">
            <Label htmlFor="pendingReleaseDmg">Resume DMG upload</Label>
            <Input
              id="pendingReleaseDmg"
              name="pendingReleaseDmg"
              type="file"
              accept=".dmg,application/x-apple-diskimage"
              required
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              Select {pendingRelease.dmgFileName} to continue without re-uploading the updater archive.
            </p>
          </div>
        ) : null}
        {error ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
            <AlertTitle>Release publication failed</AlertTitle>
            <AlertDescription className="text-destructive/80">{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Resuming release…' : needsDmg ? 'Upload DMG and publish' : 'Retry publication'}
          </Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => savePendingRelease(null)}>
            Discard local recovery state
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Discarding only clears this browser recovery record; it does not delete uploaded Blob assets.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submitRelease} className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="releaseProduct">Product</Label>
        <Select id="releaseProduct" name="releaseProduct" required disabled={submitting}>
          {products.map((product) => (
            <option key={product.code} value={product.code}>
              {product.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="releaseVersion">Version</Label>
        <Input
          id="releaseVersion"
          name="releaseVersion"
          placeholder="0.2.0"
          pattern="(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?"
          required
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="updaterArchive">Signed updater archive</Label>
        <Input
          id="updaterArchive"
          name="updaterArchive"
          type="file"
          accept=".app.tar.gz,application/gzip,application/x-gzip"
          required
          disabled={submitting}
        />
        {submitting ? <p className="text-xs text-muted-foreground">Upload {progress.updater}%</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="updaterSignature">Updater signature</Label>
        <Input
          id="updaterSignature"
          name="updaterSignature"
          type="file"
          accept=".sig,text/plain"
          required
          disabled={submitting}
        />
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="releaseDmg">Universal DMG (optional)</Label>
        <Input
          id="releaseDmg"
          name="releaseDmg"
          type="file"
          accept=".dmg,application/x-apple-diskimage"
          disabled={submitting}
        />
        {submitting && progress.dmg > 0 ? (
          <p className="text-xs text-muted-foreground">DMG upload {progress.dmg}%</p>
        ) : null}
      </div>
      <div className="space-y-2 xl:col-span-2">
        <Label htmlFor="releaseNotes">Release notes</Label>
        <Textarea
          id="releaseNotes"
          name="releaseNotes"
          placeholder="Fixes and compatibility notes."
          rows={4}
          maxLength={10_000}
          disabled={submitting}
        />
      </div>
      <div className="space-y-3 xl:col-span-2">
        <Button type="submit" disabled={submitting || products.length === 0}>
          <Upload className="h-4 w-4" />
          {submitting ? 'Uploading release…' : 'Upload and publish updater'}
        </Button>
        {error ? (
          <Alert className="border-destructive/30 bg-destructive/5 text-destructive">
            <AlertTitle>Release upload failed</AlertTitle>
            <AlertDescription className="space-y-3 text-destructive/80">
              <span className="block">{error}</span>
            </AlertDescription>
          </Alert>
        ) : null}
        {result ? (
          <Alert>
            <AlertTitle>Updater published</AlertTitle>
            <AlertDescription className="break-all">{result}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
