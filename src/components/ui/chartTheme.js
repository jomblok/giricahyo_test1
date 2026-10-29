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

// Animasi seri grafik (Line, Bar, Pie) — disebarkan ke setiap seri:
//   <Line {...ANIMASI_SERI} ... />
//
// Bawaan Recharts menganimasikan seri selama 1,5 detik, dan selama itu React
// merender ulang garis beserta SETIAP titiknya di tiap frame. Terekam di
// Performance panel saat membuka Ringkasan: ±1,4 detik jalur "Blocking"
// berisi JavascriptAnimate → StaticCurve → Dots → DotItem berulang-ulang,
// CPU penuh, dan halaman tersendat saat digulir. 400 ms masih terbaca
// sebagai gerak, dengan beban sekitar seperempatnya.
//
// Pengguna yang meminta gerak dikurangi di setelan perangkatnya tidak
// mendapat animasi sama sekali — pola yang sama dengan GlowingEffect.
const kurangiGerak = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ANIMASI_SERI = {
  isAnimationActive: !kurangiGerak,
  animationDuration: 400,
};

export const AXIS_PROPS = {
  tick: { fontSize: 11, fill: CHART.axis },
  axisLine: false,
  tickLine: false,
};
