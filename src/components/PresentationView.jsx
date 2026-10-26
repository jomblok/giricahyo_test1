// src/components/PresentationView.jsx
//
// Mode presentasi: ringkasan komunitas sebagai rangkaian slide layar penuh,
// tipografi diperbesar, kerangka aplikasi disembunyikan. Untuk demo ke dosen
// atau mitra tanpa harus menjelaskan menu.

import { useState, useEffect, useCallback } from "react";
import {
  TreeDeciduous, Cloud, Wallet, Users, X, ChevronLeft, ChevronRight, Leaf,
} from "lucide-react";
import { usePresentation } from "../lib/PresentationContext";
import { useLanguage } from "../lib/LanguageContext";
import { useTrendStats } from "../lib/useTrendStats";
import { formatNumber, formatRupiah } from "../lib/format";
import TrendCharts from "./TrendCharts";
import TreeMap from "./TreeMap";
import HealthSummaryCard from "./HealthSummaryCard";
import TopContributorsCard from "./TopContributorsCard";
import { Sparkline, IconButton } from "./ui";

function BigStat({ icon: Icon, label, value, suffix, spark, color }) {
  return (
    <div className="bg-surface border border-line rounded-3xl p-7 flex flex-col gap-3">
      <div className="flex items-center gap-2.5 text-ink-faint">
        <Icon size={20} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-4xl xl:text-5xl font-bold text-ink tabular leading-none">
        {value}
        {suffix && <span className="text-lg font-medium text-ink-muted ml-1.5">{suffix}</span>}
      </p>
      {spark?.length >= 2 && (
        <Sparkline values={spark} width={150} height={40} color={color} strokeWidth={2} label={label} />
      )}
    </div>
  );
}

export default function PresentationView({ summary }) {
  const { active, exit } = usePresentation();
  const { t } = useLanguage();
  const stats = useTrendStats();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: t("community_summary"),
      body: (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <BigStat icon={TreeDeciduous} label={t("total_registered_trees")} value={formatNumber(summary?.total_trees ?? 0)}       spark={stats.trees}        color="var(--chart-1)" />
          <BigStat icon={Cloud}         label={t("total_co2_absorbed")}     value={formatNumber(summary?.total_co2_kg ?? 0, 1)} suffix="kg" spark={stats.co2} color="var(--chart-4)" />
          <BigStat icon={Wallet}        label={t("total_carbon_fund")}      value={formatRupiah(summary?.total_income ?? 0)} />
          <BigStat icon={Users}         label={t("active_farmers")}         value={formatNumber(summary?.active_farmers ?? 0)} />
        </div>
      ),
    },
    { title: t("trend_contribution"),      body: <div className="space-y-5"><TrendCharts /></div> },
    {
      title: t("tree_condition_location"),
      body: (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-4">
            <HealthSummaryCard healthCounts={summary?.health_summary ?? { baik: 0, sedang: 0, buruk: 0 }} />
          </div>
          <div className="xl:col-span-8"><TreeMap height={460} /></div>
        </div>
      ),
    },
    {
      title: t("top_co2_contributors"),
      body: <div className="max-w-xl"><TopContributorsCard topFarmers={summary?.top_farmers ?? []} /></div>,
    },
  ];

  const go = useCallback((dir) => {
    setSlide((s) => Math.min(Math.max(s + dir, 0), slides.length - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft"  || e.key === "PageUp")   { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  // Kembali ke slide pertama setiap kali presentasi dibuka — disesuaikan SAAT
  // RENDER, bukan di effect. Effect baru berjalan sesudah layar digambar, jadi
  // slide terakhir dari presentasi sebelumnya sempat tampil satu frame sebelum
  // melompat ke awal. Pola "simpan nilai prop sebelumnya, bandingkan saat
  // render" adalah cara yang dianjurkan React untuk mereset state ketika
  // sebuah prop berubah.
  const [aktifSebelumnya, setAktifSebelumnya] = useState(active);
  if (active !== aktifSebelumnya) {
    setAktifSebelumnya(active);
    if (active) setSlide(0);
  }

  if (!active) return null;
  const current = slides[slide];

  return (
    <div className="min-h-screen flex flex-col bg-ground">
      <header className="flex items-center gap-4 px-6 md:px-10 py-5 border-b border-line">
        <div className="bg-brand-soft rounded-xl p-2">
          <Leaf size={20} className="text-brand" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Giricahyo Carbon</p>
          <h1 className="text-xl md:text-2xl font-bold text-ink truncate">{current.title}</h1>
        </div>
        <IconButton icon={X} label={t("exit_presentation")} onClick={exit} variant="secondary" size="lg" className="ml-auto" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">{current.body}</div>

      <footer className="flex items-center justify-center gap-4 px-6 py-4 border-t border-line">
        <IconButton icon={ChevronLeft} label={t("prev_page")} onClick={() => go(-1)} variant="secondary" disabled={slide === 0} />
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`${i + 1} ${t("slide_of")} ${slides.length}`}
              aria-current={i === slide}
              className={`h-1.5 rounded-full transition-all ${i === slide ? "w-7 bg-brand" : "w-1.5 bg-line-strong hover:bg-ink-faint"}`}
            />
          ))}
        </div>
        <IconButton icon={ChevronRight} label={t("next_page")} onClick={() => go(1)} variant="secondary" disabled={slide === slides.length - 1} />
        <span className="text-[11px] text-ink-faint tabular ml-2">{slide + 1} {t("slide_of")} {slides.length}</span>
      </footer>
    </div>
  );
}
