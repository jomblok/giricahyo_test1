// src/components/ui/chartTheme.js
//
// Warna chart sebelumnya ditulis literal (#2f6e51, #c89b3c) di TrendCharts,
// CarbonFundSection, dan TreeMap — jadi tidak pernah ikut berganti tema, dan
// batang hijau tua menumpuk di atas kartu hijau tua di dark mode.
//
// SVG menerima var() pada atribut fill/stroke, jadi Recharts cukup diberi
// string di bawah ini dan warnanya ikut token peran di index.css.

export const CHART = {
  c1:   "var(--chart-1)",
  c2:   "var(--chart-2)",
  c3:   "var(--chart-3)",
  c4:   "var(--chart-4)",
  c5:   "var(--chart-5)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
};

export const CHART_SERIES = [CHART.c1, CHART.c2, CHART.c3, CHART.c4, CHART.c5];

// Untuk Leaflet & tempat lain yang butuh warna nyata (bukan atribut SVG),
// var() tidak bisa dipakai — nilainya harus dibaca dari computed style.
export function readVar(name, fallback = "#2f6e51") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v?.trim() || fallback;
}

export const AXIS_PROPS = {
  tick: { fontSize: 11, fill: CHART.axis },
  axisLine: false,
  tickLine: false,
};
