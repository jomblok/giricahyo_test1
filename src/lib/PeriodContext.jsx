// src/lib/PeriodContext.jsx
//
// Filter periode global. Sebelumnya satu-satunya filter waktu ada di dalam
// CarbonFundSection, dengan daftar tahun di-hardcode ["2026","2025","2024"]
// yang akan salah diam-diam begitu ganti tahun.
//
// Di sini rentangnya dihitung dari tahun berjalan, dan disediakan sekaligus
// rentang periode SEBELUMNYA supaya kartu KPI bisa menghitung delta.

import { createContext, useContext, useMemo, useState } from "react";

const PeriodContext = createContext(null);

export const PERIOD_PRESETS = ["all", "this_year", "last_year", "last_3y"];

function rangeFor(preset, now = new Date()) {
  const y = now.getFullYear();
  switch (preset) {
    case "this_year": return { from: `${y}-01-01`,     to: `${y}-12-31`,     year: y };
    case "last_year": return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, year: y - 1 };
    case "last_3y":   return { from: `${y - 2}-01-01`, to: `${y}-12-31`,     year: null };
    default:          return { from: null, to: null, year: null };
  }
}

// Periode pembanding: satu langkah ke belakang dengan panjang yang sama.
function previousOf(preset, now = new Date()) {
  const y = now.getFullYear();
  switch (preset) {
    case "this_year": return rangeFor("last_year", now);
    case "last_year": return { from: `${y - 2}-01-01`, to: `${y - 2}-12-31`, year: y - 2 };
    case "last_3y":   return { from: `${y - 5}-01-01`, to: `${y - 3}-12-31`, year: null };
    default:          return { from: null, to: null, year: null };
  }
}

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

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  // Sengaja tidak melempar error: komponen seperti halaman publik pohon
  // dirender di luar provider dan tetap harus jalan.
  return ctx ?? {
    preset: "all", setPreset: () => {}, compare: false, setCompare: () => {},
    toggleCompare: () => {}, range: { from: null, to: null, year: null },
    previous: { from: null, to: null, year: null }, isAll: true, params: {},
    matches: () => true,
  };
}
