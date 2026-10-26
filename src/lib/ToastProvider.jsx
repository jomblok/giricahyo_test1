// src/lib/ToastProvider.jsx
//
// DIPISAH DARI ToastContext.jsx supaya berkas ini hanya mengekspor komponen.
// Fast Refresh Vite hanya bisa memperbarui di tempat modul yang semua
// ekspornya komponen; berkas campuran komponen + hook dimuat ulang penuh
// setiap kali disunting, dan state halaman yang sedang diuji ikut hilang.
// Hook dan konteksnya tetap di ToastContext.jsx, jadi impor di berkas lain tidak berubah.

import { useCallback, useMemo, useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { ToastContext } from "./ToastContext";

const TONE = {
  success: { icon: CheckCircle2,  cls: "bg-good-soft text-good" },
  error:   { icon: AlertTriangle, cls: "bg-bad-soft text-bad" },
  info:    { icon: Info,          cls: "bg-brand-soft text-brand-ink" },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((tt) => tt.id !== id));
  }, []);

  const push = useCallback((message, tone = "success", ms = 3500) => {
    const id = nextId++;
    setToasts((list) => [...list, { id, message, tone, ms }]);
    return id;
  }, []);

  const value = useMemo(() => ({
    push,
    success: (m) => push(m, "success"),
    error:   (m) => push(m, "error", 6000),
    info:    (m) => push(m, "info"),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((tt) => <Toast key={tt.id} toast={tt} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const { icon: Icon, cls } = TONE[toast.tone] ?? TONE.info;

  useEffect(() => {
    const id = setTimeout(() => onDismiss(toast.id), toast.ms);
    return () => clearTimeout(id);
  }, [toast.id, toast.ms, onDismiss]);

  return (
    <div
      role="status"
      className="gjr-toast-in pointer-events-auto flex items-start gap-2.5 bg-surface border border-line rounded-xl shadow-lg px-3.5 py-2.5 max-w-[min(22rem,calc(100vw-2rem))]"
    >
      <span className={`rounded-lg p-1.5 shrink-0 ${cls}`}><Icon size={14} /></span>
      <p className="text-[13px] text-ink leading-snug min-w-0 flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup"
        className="text-ink-faint hover:text-ink transition-colors shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}
