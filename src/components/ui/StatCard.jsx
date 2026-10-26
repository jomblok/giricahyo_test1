// src/components/ui/StatCard.jsx
//
// Satu kartu angka untuk seluruh aplikasi. Menggantikan tiga komponen yang
// hampir identik: KpiCard (dashboard admin), StatCard (dashboard petani),
// dan ImpactCard (dashboard buyer) — bedanya cuma peta warna aksen dan
// ada-tidaknya baris keterangan.
//
//   layout="split"  → ikon di kanan, label di atas angka  (gaya KpiCard lama)
//   layout="inline" → ikon di kiri                        (gaya StatCard/ImpactCard lama)

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

const ACCENTS = {
  sage:   "text-brand bg-brand-soft",
  gold:   "text-warn bg-warn-soft",
  forest: "text-ink bg-surface-sub",
  clay:   "text-bad bg-bad-soft",
};

function Delta({ value, label }) {
  if (value == null) return null;
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const tone = flat ? "text-ink-faint" : up ? "text-good" : "text-bad";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
      <Icon size={12} strokeWidth={2.4} />
      <span className="tabular">
        {up ? "+" : ""}{value}%
      </span>
      {label && <span className="text-ink-faint font-normal">{label}</span>}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  delta,
  deltaLabel,
  spark,
  sparkColor,
  accent = "sage",
  layout = "split",
  className = "",
}) {
  const accentClass = ACCENTS[accent] ?? ACCENTS.sage;

  const SPARK_COLOR = { sage: "var(--chart-1)", gold: "var(--chart-2)", forest: "var(--chart-4)", clay: "var(--chart-5)" };

  const badge = Icon && (
    <div className={`shrink-0 rounded-xl p-2 @[15rem]:p-2.5 transition-colors ${accentClass}`}>
      <Icon size={20} strokeWidth={2} />
    </div>
  );

  // Sparkline SENGAJA disembunyikan pada kartu sempit. Ia hiasan pendukung,
  // sedangkan angkanya adalah isi kartu — dan sebelum ini keduanya berebut
  // lebar yang sama sampai angkanya kalah dan terpotong.
  const trend = spark?.length >= 2 && (
    <Sparkline
      values={spark}
      color={sparkColor ?? SPARK_COLOR[accent] ?? SPARK_COLOR.sage}
      label={`${label}: tren ${spark.length} periode terakhir`}
    />
  );

  const body = (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      {/* Ukuran mengikuti lebar KARTU (@container), bukan lebar layar.
          Dengan md: angkanya besar walau kartunya sempit, lalu terpotong —
          dan angka terpotong lebih buruk daripada angka kecil. */}
      <span className="text-xl @[11rem]:text-2xl @[16rem]:text-3xl font-bold text-ink tabular leading-tight">
        {value}
        {suffix && (
          <span className="text-sm font-medium text-ink-muted ml-1">{suffix}</span>
        )}
      </span>
      {(sub || delta != null) && (
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <Delta value={delta} label={deltaLabel} />
          {sub && <span className="text-xs text-ink-muted">{sub}</span>}
        </div>
      )}
    </div>
  );

  return (
    // Kartu sempit BERGANTI SUSUNAN, bukan sekadar mengecil: ikon naik ke
    // atas dan angkanya mendapat seluruh lebar kartu. Sebelumnya ikon dan
    // angka selalu berdampingan, jadi di kartu 170px angkanya cuma kebagian
    // 56px lalu terpotong. Patokannya lebar KARTU (@container) — kartu yang
    // sama bisa sempit di ponsel dan lebar di layar besar.
    <Card className={`@container ${className}`}>
      <div
        className={`flex flex-col @[13rem]:flex-row items-start gap-2.5 @[13rem]:gap-3 ${
          layout === "split" ? "@[13rem]:justify-between" : ""
        }`}
      >
        {layout === "inline" && badge}

        <div className="order-2 w-full min-w-0 @[13rem]:order-none @[13rem]:w-auto">{body}</div>

        <div className="order-1 flex shrink-0 items-center gap-2 @[13rem]:order-none @[13rem]:flex-col @[13rem]:items-end">
          {layout === "split" && badge}
          <span className="hidden @[18rem]:block">{trend}</span>
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
