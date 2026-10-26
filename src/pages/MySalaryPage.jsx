// src/pages/MySalaryPage.jsx — halaman fokus gaji karbon petani, termasuk
// riwayat semua periode (bukan hanya periode terakhir seperti di Ringkasan).

import { Wallet, History } from "lucide-react";
import AppShell from "../components/AppShell";
import SalaryBreakdown from "../components/SalaryBreakdown";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { formatNumber, formatRupiah } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, SectionHeader, EmptyState, SkeletonCards } from "../components/ui";

export default function MySalaryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const farmerId = user?.linked_id ?? user?.linkedId ?? "F001";
  const { data, loading, error } = useApi(() => farmerApi.get(farmerId), [farmerId]);

  const salaries = data?.salaries ?? [];
  const latest = salaries[0] ?? null;

  return (
    <AppShell title={t("nav_my_salary")} showPeriod={false}>
      <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={2} cols="grid-cols-1 lg:grid-cols-2" height="h-64" />}>
        {!latest ? (
          <EmptyState icon={Wallet} title={t("no_salary_yet")} description={t("no_salary_yet_desc")} />
        ) : (
          <div className="gjr-stagger space-y-6">
            <section>
              <SectionHeader>{t("carbon_salary_details")}</SectionHeader>
              <SalaryBreakdown salary={latest} />
            </section>

            {salaries.length > 1 && (
              <section>
                <SectionHeader>{t("period")}</SectionHeader>
                <Card>
                  <CardHeader icon={History} title={t("carbon_salary")} count={salaries.length} />
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
                          <th scope="col" className="py-2.5 px-3 font-semibold">{t("period")}</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold text-right">CO₂ (kg)</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold text-right">{t("co2_proportion")}</th>
                          <th scope="col" className="py-2.5 px-3 font-semibold text-right">{t("final_salary")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaries.map((s) => (
                          <tr key={s.period} className="border-b border-line/60 last:border-0 hover:bg-surface-hover transition-colors">
                            <td className="py-2.5 px-3 font-medium text-ink">{s.period}</td>
                            <td className="py-2.5 px-3 text-right tabular text-ink-muted">{formatNumber(s.total_co2_kg, 2)}</td>
                            <td className="py-2.5 px-3 text-right tabular text-ink-muted">{formatNumber(s.co2_proportion_pct, 1)}%</td>
                            <td className="py-2.5 px-3 text-right tabular font-bold text-warn">{formatRupiah(s.final_salary)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>
            )}
          </div>
        )}
      </ApiState>
    </AppShell>
  );
}
