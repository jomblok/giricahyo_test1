// src/components/SalaryBreakdown.jsx
//
// Rincian gaji karbon + insentif. Diangkat keluar dari FarmerDashboardPage
// supaya bisa dipakai bersama oleh halaman Ringkasan dan halaman Gaji Karbon
// tanpa disalin dua kali.

import { Award, TrendingUp } from "lucide-react";
import { formatNumber, formatRupiah } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader } from "./ui";

export default function SalaryBreakdown({ salary }) {
  const { t } = useLanguage();
  if (!salary) return null;

  const totalIncentivePct =
    salary.social_incentive_pct + salary.ecological_incentive_pct + salary.participation_incentive_pct;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader
          icon={Award}
          title={t("salary_calculation")}
          actions={<span className="text-[11px] text-ink-faint">{salary.period}</span>}
        />
        <div className="space-y-3">
          {[
            [t("co2_from_my_trees_label"),   `${formatNumber(salary.total_co2_kg, 2)} kg`],
            [t("proportion_from_community"), `${formatNumber(salary.co2_proportion_pct, 1)}%`],
            [t("base_carbon_salary"),        formatRupiah(salary.base_salary)],
            [t("total_incentive"),           `+${totalIncentivePct}%`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center gap-3 py-2 border-b border-line">
              <span className="text-xs text-ink-muted">{label}</span>
              <span className="text-sm font-semibold text-ink tabular">{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-baseline gap-3 py-3 bg-warn-soft rounded-xl px-3 transition-colors">
            <span className="text-sm font-bold text-ink">{t("final_salary_received")}</span>
            <span className="text-lg font-bold text-warn tabular">{formatRupiah(salary.final_salary)}</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader icon={TrendingUp} title={t("incentive_details")} />
        <div className="space-y-4">
          {[
            [t("social_incentive"),        salary.social_incentive_pct,        "bg-[var(--chart-3)]"],
            [t("ecological_incentive"),    salary.ecological_incentive_pct,    "bg-[var(--chart-1)]"],
            [t("participation_incentive"), salary.participation_incentive_pct, "bg-[var(--chart-2)]"],
          ].map(([label, pct, color]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-ink-muted w-36 shrink-0">{label}</span>
              <div className="flex-1 bg-surface-sub rounded-full h-2 transition-colors">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(pct * 5, 100)}%` }} />
              </div>
              <span className="text-xs font-semibold text-ink tabular w-9 text-right">+{pct}%</span>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-line flex justify-between">
          <span className="text-xs text-ink-muted">{t("total_incentive_addition")}</span>
          <span className="text-sm font-bold text-brand tabular">+{totalIncentivePct}%</span>
        </div>
      </Card>
    </div>
  );
}
