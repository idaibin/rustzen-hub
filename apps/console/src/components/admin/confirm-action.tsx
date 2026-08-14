'use client';

import { useTransition, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogSurface } from '@/components/ui/dialog';

export type ServerAction = (formData: FormData) => Promise<void>;

/**
 * Wraps a destructive server action behind a confirmation dialog. The server
 * action is passed from a server component (it crosses the boundary as an
 * action reference); on confirm we invoke it with the supplied fields.
 */
export function ConfirmAction({
  action,
  fields,
  triggerLabel,
  triggerIcon,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const fd = new FormData();
      for (const [key, value] of Object.entries(fields)) fd.set(key, value);
      await action(fd);
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
        {triggerIcon}
        {triggerLabel}
      </Button>

      {open ? (
        <DialogSurface
          title={title}
          description={description}
          closeDisabled={pending}
          closeLabel={cancelLabel}
          onClose={() => setOpen(false)}
          showCloseButton={false}
          size="md"
        >
          <div className="flex justify-end gap-2 p-5">
            <Button variant="outline" size="sm" type="button" onClick={() => setOpen(false)} disabled={pending}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? 'destructive' : 'default'} size="sm" type="button" onClick={confirm} disabled={pending}>
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </DialogSurface>
      ) : null}
    </>
  );
}
