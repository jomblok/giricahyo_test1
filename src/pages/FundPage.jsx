// src/pages/FundPage.jsx — halaman fokus Dana Karbon (admin).

import AppShell from "../components/AppShell";
import CarbonFundSection from "../components/CarbonFundSection";
import SupportSummaryCard from "../components/SupportSummaryCard";
import BasicCarbonFundBreakdown from "../components/BasicCarbonFundBreakdown";
import ComputeSalaryCard from "../components/ComputeSalaryCard";
import { useApi } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { SectionHeader } from "../components/ui";

export default function FundPage() {
  const { t } = useLanguage();
  const { data: summary } = useApi(() => dashboardApi.summary());

  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_fund")} showPeriod={false}>
      <div className="gjr-stagger grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-9 space-y-4">
          <SectionHeader>{t("carbon_fund_support")}</SectionHeader>
          <CarbonFundSection />
        </div>
        <div className="xl:col-span-3 space-y-4">
          <SectionHeader>{t("external_support")}</SectionHeader>
          <SupportSummaryCard
            totalCertificates={summary?.total_certs ?? 0}
            totalBuyers={summary?.total_buyers ?? 0}
          />
          <BasicCarbonFundBreakdown />
          {/* Dana masuk dan gaji yang dibagikan darinya berada di satu halaman
              supaya hubungan keduanya terlihat: gaji dihitung dari pemasukan
              yang ada di kolom sebelah, bukan dari angka yang berdiri sendiri. */}
          <ComputeSalaryCard />
        </div>
      </div>
    </AppShell>
  );
}
