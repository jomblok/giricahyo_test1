// src/pages/FarmersPage.jsx — halaman fokus data petani & gaji karbon (admin).

import AppShell from "../components/AppShell";
import FarmerTable from "../components/FarmerTable";
import TopContributorsCard from "../components/TopContributorsCard";
import { useApi } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { SectionHeader } from "../components/ui";

export default function FarmersPage() {
  const { t } = useLanguage();
  const { data: summary } = useApi(() => dashboardApi.summary());

  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_farmers")} showPeriod={false}>
      <div className="gjr-stagger grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionHeader>{t("farmer_data_salary")}</SectionHeader>
          <FarmerTable />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <SectionHeader>{t("top_co2_contributors")}</SectionHeader>
          <TopContributorsCard topFarmers={summary?.top_farmers ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
