// src/lib/PresentationProvider.jsx
//
// DIPISAH DARI PresentationContext.jsx supaya berkas ini hanya mengekspor komponen.
// Fast Refresh Vite hanya bisa memperbarui di tempat modul yang semua
// ekspornya komponen; berkas campuran komponen + hook dimuat ulang penuh
// setiap kali disunting, dan state halaman yang sedang diuji ikut hilang.
// Hook dan konteksnya tetap di PresentationContext.jsx, jadi impor di berkas lain tidak berubah.

import { useEffect, useMemo, useState } from "react";
import { PresentationContext } from "./PresentationContext";

export function PresentationProvider({ children }) {
  const [active, setActive] = useState(false);

  // Esc keluar dari mode presentasi.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") setActive(false); };
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("presenting");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("presenting");
    };
  }, [active]);

  const value = useMemo(() => ({
    active,
    enter: () => setActive(true),
    exit: () => setActive(false),
    toggle: () => setActive((a) => !a),
  }), [active]);

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}
