// src/lib/PresentationContext.jsx
//
// Mode presentasi: sembunyikan kerangka aplikasi, perbesar tipografi, dan
// tampilkan ringkasan sebagai layar penuh. Dibuat untuk demo ke dosen/mitra.

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PresentationContext = createContext(null);

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

export function usePresentation() {
  return useContext(PresentationContext) ?? { active: false, enter: () => {}, exit: () => {}, toggle: () => {} };
}
