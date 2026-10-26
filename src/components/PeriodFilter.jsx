// src/components/PeriodFilter.jsx
//
// Pemilih periode global di topbar. Dibaca semua kartu, chart, dan tabel
// lewat usePeriod().

import { CalendarRange, GitCompareArrows } from "lucide-react";
import { usePeriod, PERIOD_PRESETS } from "../lib/PeriodContext";
import { Select } from "./ui";
import { useLanguage } from "../lib/LanguageContext";

export default function PeriodFilter() {
  const { preset, setPreset, compare, toggleCompare, isAll } = usePeriod();
  const { t } = useLanguage();

  return (
    <div className="hidden xl:flex items-center gap-1.5">
      <Select
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        options={PERIOD_PRESETS.map((p) => ({ value: p, label: t(`period_${p}`) }))}
        ariaLabel={t("period")}
        size="sm"
        icon={CalendarRange}
        className="w-[10.5rem]"
      />

      {/* Perbandingan hanya masuk akal kalau periodenya dibatasi */}
      <button
        type="button"
        onClick={toggleCompare}
        disabled={isAll}
        aria-pressed={compare}
        title={t("compare_mode")}
        aria-label={t("compare_mode")}
        className={`h-9 px-2.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          compare && !isAll
            ? "border-brand bg-brand-soft text-brand-ink"
            : "border-line bg-surface-sub text-ink-muted hover:text-ink"
        }`}
      >
        <GitCompareArrows size={14} />
      </button>
    </div>
  );
}
