"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(variant: ToastVariant, title: string, description?: string) {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, title, description, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description) => pushToast("success", title, description),
      error: (title, description) => pushToast("error", title, description)
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toast.variant === "success" ? CheckCircle2 : XCircle;
          return (
            <div
              key={toast.id}
              className="pointer-events-auto rounded-lg border bg-card p-4 shadow-lg ring-1 ring-black/5"
            >
              <div className="flex gap-3">
                <Icon
                  className={
                    toast.variant === "success"
                      ? "mt-0.5 h-5 w-5 text-emerald-600"
                      : "mt-0.5 h-5 w-5 text-red-600"
                  }
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}
