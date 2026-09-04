"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Blocking confirmation modal used before every destructive admin action
 * (delete product/category/user, clear a cart, etc.) so a stray click never
 * silently deletes real data.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-paper p-6 shadow-card">
        <h2 id="confirm-dialog-title" className="font-display text-lg text-ink">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-ink/60">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={isDestructive ? "border border-ember/30" : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
