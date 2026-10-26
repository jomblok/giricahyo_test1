// src/lib/PeriodContext.jsx
//
// Filter periode global. Sebelumnya satu-satunya filter waktu ada di dalam
// CarbonFundSection, dengan daftar tahun di-hardcode ["2026","2025","2024"]
// yang akan salah diam-diam begitu ganti tahun.
//
// Di sini rentangnya dihitung dari tahun berjalan, dan disediakan sekaligus
// rentang periode SEBELUMNYA supaya kartu KPI bisa menghitung delta.

import { createContext, useContext } from "react";

// Provider-nya di PeriodProvider.jsx.
export const PeriodContext = createContext(null);

export const PERIOD_PRESETS = ["all", "this_year", "last_year", "last_3y"];

export function rangeFor(preset, now = new Date()) {
  const y = now.getFullYear();
  switch (preset) {
    case "this_year": return { from: `${y}-01-01`,     to: `${y}-12-31`,     year: y };
    case "last_year": return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31`, year: y - 1 };
    case "last_3y":   return { from: `${y - 2}-01-01`, to: `${y}-12-31`,     year: null };
    default:          return { from: null, to: null, year: null };
  }
}

// Periode pembanding: satu langkah ke belakang dengan panjang yang sama.
export function previousOf(preset, now = new Date()) {
  const y = now.getFullYear();
  switch (preset) {
    case "this_year": return rangeFor("last_year", now);
    case "last_year": return { from: `${y - 2}-01-01`, to: `${y - 2}-12-31`, year: y - 2 };
    case "last_3y":   return { from: `${y - 5}-01-01`, to: `${y - 3}-12-31`, year: null };
    default:          return { from: null, to: null, year: null };
  }
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
