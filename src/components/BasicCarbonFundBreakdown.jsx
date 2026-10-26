// src/components/BasicCarbonFundBreakdown.jsx
//
// Rekap "Basic Carbon Contribution" per tingkatan — dihitung dari sertifikat
// (adoptionApi.list()), BUKAN dari carbonFundApi.income() yang jadi sumber
// pie distribusi utama di CarbonFundSection. Dua ledger data yang berbeda;
// kartu ini murni tambahan di sampingnya, diberi label jelas supaya tidak
// tercampur dengan angka dana yang sudah diaudit koperasi.

import { Sprout } from "lucide-react";
import { Card, CardHeader, EmptyState, Skeleton } from "./ui";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { adoptionApi } from "../lib/api";
import { formatRupiahShort, BASIC_CARBON_TIERS, parseBasicCarbonTier } from "../lib/basicCarbon";
import { useLanguage } from "../lib/LanguageContext";

export default function BasicCarbonFundBreakdown() {
  const { t } = useLanguage();
  const { data: adoptions, loading, error } = useApi(() => adoptionApi.list());

  const rows = BASIC_CARBON_TIERS.map((tier) => {
    const matches = (adoptions ?? []).filter((a) => parseBasicCarbonTier(a.package_name)?.key === tier.key);
    return { tier, count: matches.length, total: matches.length * tier.price };
  });
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const grandCount = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <Card>
      <CardHeader
        icon={Sprout}
        title={t("basic_carbon_fund_breakdown")}
        actions={grandCount > 0 && <span className="text-xs font-bold text-warn tabular">{formatRupiahShort(grandTotal)}</span>}
      />
      <ApiState loading={loading} error={error} skeleton={<Skeleton className="h-32 rounded-xl" />}>
        {grandCount === 0 ? (
          <EmptyState icon={Sprout} title={t("no_basic_carbon_contributions")} compact />
        ) : (
          <div className="space-y-2">
            {rows.map(({ tier, count, total }) => (
              <div key={tier.key} className="flex items-center justify-between gap-3 bg-surface-sub rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{tier.name}</p>
                  <p className="text-[11px] text-ink-faint tabular">{count} × {formatRupiahShort(tier.price)}</p>
                </div>
                <p className="text-sm font-bold text-ink tabular shrink-0">{formatRupiahShort(total)}</p>
              </div>
            ))}
          </div>
        )}
      </ApiState>
      <p className="text-[11px] text-ink-faint mt-3">{t("basic_carbon_fund_breakdown_note")}</p>
    </Card>
  );
}
