// src/lib/PeriodProvider.jsx
//
// DIPISAH DARI PeriodContext.jsx supaya berkas ini hanya mengekspor komponen.
// Fast Refresh Vite hanya bisa memperbarui di tempat modul yang semua
// ekspornya komponen; berkas campuran komponen + hook dimuat ulang penuh
// setiap kali disunting, dan state halaman yang sedang diuji ikut hilang.
// Hook dan konteksnya tetap di PeriodContext.jsx, jadi impor di berkas lain tidak berubah.

import { useMemo, useState } from "react";
import { PeriodContext, rangeFor, previousOf } from "./PeriodContext";

export function PeriodProvider({ children }) {
  const [preset, setPreset] = useState("all");
  const [compare, setCompare] = useState(false);

  const value = useMemo(() => {
    const range = rangeFor(preset);
    const previous = previousOf(preset);
    return {
      preset,
      setPreset,
      compare,
      setCompare,
      toggleCompare: () => setCompare((c) => !c),
      range,
      previous,
      isAll: preset === "all",
      // Dipakai langsung sebagai query param untuk endpoint yang mendukungnya.
      params: range.from ? { from: range.from, to: range.to } : {},
      // Penyaring sisi-klien untuk data yang sudah terlanjur di-fetch penuh.
      matches(dateLike) {
        if (!range.from || !dateLike) return true;
        const d = String(dateLike).slice(0, 10);
        return d >= range.from && d <= range.to;
      },
    };
  }, [preset, compare]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}
