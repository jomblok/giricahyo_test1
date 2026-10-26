// src/components/ui/Sparkline.jsx
//
// Grafik mini di dalam kartu KPI. Digambar sebagai SVG inline — tidak perlu
// Recharts untuk sesuatu sekecil ini, dan warnanya ikut token tema.

import { useId } from "react";

export function Sparkline({
  values = [],
  width = 92,
  height = 28,
  color = "var(--chart-1)",
  strokeWidth = 1.6,
  label,
}) {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  // Dipanggil sebelum early return: urutan panggilan hook harus sama di
  // setiap render, jadi ia tidak boleh berada di belakang percabangan.
  const idUnik = useId().replace(/:/g, "");
  if (nums.length < 2) return null;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (nums.length - 1);

  const pts = nums.map((v, i) => [
    pad + i * stepX,
    pad + (height - pad * 2) * (1 - (v - min) / span),
  ]);

  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`;
  const [lastX, lastY] = pts[pts.length - 1];
  // useId(), BUKAN turunan dari datanya. Id lama dibentuk dari titik
  // pertama dan panjang deret, jadi dua sparkline dengan nilai awal dan
  // jumlah titik yang sama menghasilkan id yang SAMA — dan di SVG,
  // url(#id) memakai yang pertama ditemukan. Akibatnya kedua grafik
  // berbagi satu gradien, dan yang kedua tampil dengan warna milik yang
  // pertama tanpa galat apa pun. Benar-benar terjadi di dashboard admin,
  // dan baru ketahuan lewat pemeriksaan id ganda.
  const gradId = `spark-${idUnik}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="overflow-visible shrink-0"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Titik akhir ditegaskan supaya mata langsung ke nilai terbaru */}
      <circle cx={lastX} cy={lastY} r={strokeWidth + 0.9} fill={color} />
    </svg>
  );
}

export default Sparkline;
