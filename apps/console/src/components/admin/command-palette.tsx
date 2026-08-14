'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { adminNavigation } from '@/components/admin/admin-navigation';
import { useDialogLifecycle } from '@/components/ui/dialog';

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useDialogLifecycle(dialogRef, inputRef);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return adminNavigation;
    return adminNavigation.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-inherit backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
        <button type="button" tabIndex={-1} aria-label="Close command palette" className="absolute inset-0 bg-black/15" onClick={onClose} />
        <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              aria-label="Search dashboard destinations"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Jump to…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-80 overflow-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link href={item.href} onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      <span className="text-muted-foreground"><Icon className="h-4 w-4" /></span>
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{item.description}</span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </dialog>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => {
          if (current) return false;
          return document.querySelector('dialog[open]') ? false : true;
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Open command palette"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden md:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 text-[10px] font-medium md:inline">⌘K</kbd>
      </button>
      {open ? <PaletteDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
