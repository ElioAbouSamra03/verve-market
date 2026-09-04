"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

type ToastVariant = "success" | "error";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide feedback channel for admin mutations (create/update/delete).
 * Reusable across every admin page instead of each screen rolling its own
 * success/error banner.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message: string) => push(message, "success"),
      showError: (message: string) => push(message, "error"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-card ${
              toast.variant === "success"
                ? "border-moss-300 bg-moss-50 text-moss-900"
                : "border-ember/30 bg-ember/10 text-ember"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-xs font-medium opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
