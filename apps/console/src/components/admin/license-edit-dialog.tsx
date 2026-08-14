'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogSurface } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { ServerAction } from './confirm-action';

type LicenseEditDialogProps = {
  license: {
    id: string;
    key: string;
    plan: string;
    rawStatus: string;
    maxDevices: number;
    expiresAtInput: string;
  };
  updateLicense: ServerAction;
};

function SubmitButton({ onPendingChange }: { onPendingChange: (pending: boolean) => void }) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <Button type="submit" disabled={pending}>
      <Pencil className="h-4 w-4" />
      {pending ? 'Saving' : 'Save'}
    </Button>
  );
}

export function LicenseEditDialog({ license, updateLicense }: LicenseEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isRevoked = license.rawStatus === 'REVOKED';

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>

      {open ? (
        <DialogSurface
          title="Edit license"
          description={<span className="break-all font-mono text-xs">{license.key}</span>}
          closeLabel="Close edit license dialog"
          closeDisabled={submitting}
          onClose={() => setOpen(false)}
        >
          <form
            action={updateLicense}
            className="grid gap-4 p-5 sm:grid-cols-2"
            onSubmit={() => setSubmitting(true)}
          >
              <input type="hidden" name="id" value={license.id} />

              <div className="space-y-2">
                <Label htmlFor={`edit-license-plan-${license.id}`}>Plan</Label>
                <Input
                  id={`edit-license-plan-${license.id}`}
                  name="plan"
                  defaultValue={license.plan}
                  placeholder="pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-license-status-${license.id}`}>Status</Label>
                {isRevoked ? (
                  <>
                    <input type="hidden" name="status" value="REVOKED" />
                    <Input id={`edit-license-status-${license.id}`} value="REVOKED" disabled />
                  </>
                ) : (
                  <Select id={`edit-license-status-${license.id}`} name="status" defaultValue={license.rawStatus}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-license-max-devices-${license.id}`}>Max devices</Label>
                <Input
                  id={`edit-license-max-devices-${license.id}`}
                  name="maxDevices"
                  defaultValue={String(license.maxDevices)}
                  min="1"
                  placeholder="3"
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-license-expires-at-${license.id}`}>Expires</Label>
                <Input
                  id={`edit-license-expires-at-${license.id}`}
                  name="expiresAt"
                  defaultValue={license.expiresAtInput}
                  type="datetime-local"
                />
              </div>

              <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">
                Empty expiration means permanent. Revoked licenses cannot be restored here; create a new
                license when access needs to be reissued.
              </p>

              <div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <SubmitButton onPendingChange={setSubmitting} />
              </div>
          </form>
        </DialogSurface>
      ) : null}
    </>
  );
}
