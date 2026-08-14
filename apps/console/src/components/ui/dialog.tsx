'use client';

import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DialogSurfaceProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  closeLabel?: string;
  showCloseButton?: boolean;
  size?: 'md' | '2xl';
};

const activeDialogLocks = new Set<HTMLDialogElement>();
let unlockedBodyOverflow = '';

function acquireDialogLock(dialog: HTMLDialogElement) {
  if (activeDialogLocks.size === 0) {
    unlockedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeDialogLocks.add(dialog);
}

function releaseDialogLock(dialog: HTMLDialogElement) {
  activeDialogLocks.delete(dialog);
  if (activeDialogLocks.size === 0) {
    document.body.style.overflow = unlockedBodyOverflow;
    unlockedBodyOverflow = '';
  }
}

/** Shared native-dialog lifecycle for every console overlay. */
export function useDialogLifecycle(
  dialogRef: RefObject<HTMLDialogElement | null>,
  initialFocusRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    acquireDialogLock(dialog);
    initialFocusRef?.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      releaseDialogLock(dialog);
      if (!document.querySelector('dialog[open]') && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [dialogRef, initialFocusRef]);
}

export function DialogSurface({
  title,
  description,
  children,
  onClose,
  closeDisabled = false,
  closeLabel = 'Close dialog',
  showCloseButton = true,
  size = '2xl',
}: DialogSurfaceProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useDialogLifecycle(dialogRef);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>(
      '[data-dialog-initial-focus], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    )?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-inherit backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabledRef.current) onCloseRef.current();
      }}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
        <button
          type="button"
          tabIndex={-1}
          aria-label={closeLabel}
          className="absolute inset-0 bg-black/15"
          disabled={closeDisabled}
          onClick={onClose}
        />
        <div
          ref={panelRef}
          className={cn(
            'relative max-h-[calc(100dvh-3rem)] w-full overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-2xl',
            size === 'md' ? 'max-w-md' : 'max-w-2xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-normal">
                {title}
              </h2>
              {description ? (
                <div id={descriptionId} className="mt-1 text-sm leading-6 text-muted-foreground">
                  {description}
                </div>
              ) : null}
            </div>
            {showCloseButton ? (
              <Button
                aria-label={closeLabel}
                data-dialog-initial-focus
                size="icon"
                type="button"
                variant="ghost"
                disabled={closeDisabled}
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </dialog>
  );
}
