// src/pages/MyImpactPage.jsx — ringkasan dampak buyer dalam satuan yang mudah
// dipahami orang awam, bukan hanya angka kilogram.

import { Wind, TreeDeciduous, Award } from "lucide-react";
import AppShell from "../components/AppShell";
import CarbonEquivalents from "../components/CarbonEquivalents";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { formatNumber } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { SectionHeader, StatCard, SkeletonCards } from "../components/ui";
import PaymentHistoryCard from "../components/PaymentHistoryCard";
import ShareImpactCard from "../components/ShareImpactCard";

export default function MyImpactPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";
  const { data, loading, error } = useApi(() => buyerApi.get(buyerId), [buyerId]);

  const adoptions = data?.adoptions ?? [];
  const totalCo2 = data?.total_co2_kg ?? 0;
  const certCount = adoptions.filter((a) => a.certificate_no).length;

  return (
    <AppShell title={t("nav_my_impact")} showPeriod={false}>
      <div className="gjr-stagger space-y-6">
        <section>
          <SectionHeader>{t("support_impact")}</SectionHeader>
          <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={3} cols="grid-cols-1 sm:grid-cols-3" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard layout="inline" icon={TreeDeciduous} label={t("trees_supported")}      value={adoptions.length}                sub={t("active_carbon_trees")}        accent="sage" />
              <StatCard layout="inline" icon={Wind}          label={t("total_co2_absorbed")}   value={formatNumber(totalCo2, 1)} suffix="kg" sub={t("absorbed_from_your_trees")} accent="forest" />
              <StatCard layout="inline" icon={Award}         label={t("certificates")}          value={certCount}                       sub={t("active_certificates_summary")} accent="gold" />
            </div>
          </ApiState>
        </section>

        {/* Riwayat pembayaran: angkanya sudah lama ada di payload

            (price, adopted_date) tapi tidak pernah ditampilkan. */}

        <section>

          <SectionHeader>{t("share_impact")}</SectionHeader>

          <ShareImpactCard buyerId={buyerId} />

        </section>


        <section>

          <SectionHeader>{t("payment_history")}</SectionHeader>

          <PaymentHistoryCard adoptions={adoptions} />

        </section>


        <section>
          <SectionHeader>{t("carbon_impact")}</SectionHeader>
          <CarbonEquivalents totalCo2={totalCo2} />
        </section>
      </div>
    </AppShell>
  );
}
