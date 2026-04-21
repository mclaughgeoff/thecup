'use client';

import { useEffect } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl pb-safe shadow-elev animate-slide-up"
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-ink-3" aria-hidden="true" />
        </div>
        {title ? (
          <h2 className="px-5 pt-3 pb-2 text-base font-semibold text-fg-1">{title}</h2>
        ) : null}
        <div className="px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}
