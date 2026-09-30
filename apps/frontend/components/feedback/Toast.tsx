"use client";

import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ToastType = "info" | "success" | "error" | "warning";

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "message" | "type">> {
  id: string;
  title?: string;
}

type ToastApi = {
  show: (options: ToastOptions) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
};

const noopApi: ToastApi = {
  show: () => "",
  success: () => "",
  error: () => "",
  info: () => "",
  warning: () => "",
  dismiss: () => undefined,
};

let activeApi: ToastApi = noopApi;

export const toast = {
  success: (message: string, title?: string) => activeApi.success(message, title),
  error: (message: string, title?: string) => activeApi.error(message, title),
  info: (message: string, title?: string) => activeApi.info(message, title),
  warning: (message: string, title?: string) => activeApi.warning(message, title),
  dismiss: (id: string) => activeApi.dismiss(id),
};

const ToastContext = createContext<ToastApi>(noopApi);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const type = options.type || "info";
    setItems((current) => [...current, { id, message: options.message, title: options.title, type }]);
    window.setTimeout(() => dismiss(id), options.duration ?? 4200);
    return id;
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    show,
    dismiss,
    success: (message, title) => show({ message, title, type: "success" }),
    error: (message, title) => show({ message, title, type: "error", duration: 6200 }),
    info: (message, title) => show({ message, title, type: "info" }),
    warning: (message, title) => show({ message, title, type: "warning", duration: 5200 }),
  }), [dismiss, show]);

  useEffect(() => {
    activeApi = api;
    return () => {
      if (activeApi === api) activeApi = noopApi;
    };
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions removals">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.type === "success"
    ? CheckCircle2
    : item.type === "error"
      ? CircleAlert
      : item.type === "warning"
        ? TriangleAlert
        : Info;

  return (
    <div className={`toast toast-${item.type}`} role={item.type === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" />
      <div className="toast-content">
        {item.title && <div className="toast-title">{item.title}</div>}
        <div className="toast-message">{item.message}</div>
      </div>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
