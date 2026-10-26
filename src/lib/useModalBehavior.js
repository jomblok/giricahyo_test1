// src/lib/useModalBehavior.js
//
// Perilaku dasar yang seharusnya dimiliki SETIAP dialog: Esc menutup, fokus
// terkunci di dalam panel selama terbuka, dan halaman di belakangnya tidak
// ikut ter-scroll. Sebelumnya modal-modal di aplikasi ini hanya bisa ditutup
// dengan klik, dan Tab bisa keluar ke elemen di belakang overlay.
//
// Pakai:
//   const panelRef = useModalBehavior(isOpen, onClose);
//   <div ref={panelRef}> … </div>

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalBehavior(isOpen, onClose) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;

    // Fokus item pertama supaya pengguna keyboard langsung berada di dalam panel.
    const first = panelRef.current?.querySelector(FOCUSABLE);
    first?.focus?.();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const items = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!items?.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Kembalikan fokus ke elemen yang membuka modal.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus?.();
    };
  }, [isOpen, onClose]);

  return panelRef;
}

export default useModalBehavior;
