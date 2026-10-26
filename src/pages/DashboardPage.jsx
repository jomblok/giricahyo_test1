import { lazy, Suspense, useState } from "react";
import { TreeDeciduous, Cloud, Wallet, Users } from "lucide-react";
import AppShell from "../components/AppShell";
import TopContributorsCard from "../components/TopContributorsCard";
import HealthSummaryCard from "../components/HealthSummaryCard";

// Dua komponen terberat di aplikasi: TrendCharts membawa Recharts, TreeMap
// membawa Leaflet. Keduanya ada di paruh bawah dashboard — pengguna belum
// tentu menggulir sampai situ, tapi dulu wajib mengunduhnya lebih dulu
// sebelum satu piksel pun tampil. Sekarang menyusul setelah halaman muncul.
const TrendCharts = lazy(() => import("../components/TrendCharts"));
const TreeMap     = lazy(() => import("../components/TreeMap"));
import SupportSummaryCard from "../components/SupportSummaryCard";
import CarbonFundSection from "../components/CarbonFundSection";
import TreeTable from "../components/TreeTable";
import KartuJenis from "../components/KartuJenis";
import FarmerTable from "../components/FarmerTable";
// Mode presentasi hanya dipakai sesekali (saat memaparkan dashboard ke
// audiens), tapi karena PresentationView mengimpor TrendCharts secara statis,
// keberadaannya membatalkan lazy-load grafik di bawah — Rolldown sampai
// memberi peringatan INEFFECTIVE_DYNAMIC_IMPORT. Dijadikan lazy juga supaya
// Recharts benar-benar baru diunduh saat grafiknya dibutuhkan.
const PresentationView = lazy(() => import("../components/PresentationView"));
import { useApi, ApiState } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";
import { formatNumber, formatRupiah } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { usePresentation } from "../lib/PresentationContext";
import { useTrendStats } from "../lib/useTrendStats";
import { SectionHeader, StatCard, SkeletonCards, SkeletonChart } from "../components/ui";

export default function DashboardPage() {
  const { data: summary, loading, error } = useApi(() => dashboardApi.summary());

  const [jenisDipilih, setJenisDipilih] = useState(null);
  const { t } = useLanguage();
  const { active: presenting } = usePresentation();
  // Sparkline & delta diturunkan dari /dashboard/trend yang sudah ada —
  // tidak menunggu endpoint baru.
  const stats = useTrendStats();
  // Jenis yang sedang dipilih lewat kartu di atas; null = semua.

  if (presenting) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-ground" />}>
        <PresentationView summary={summary} />
      </Suspense>
    );
  }

  return (
    <AppShell title={t("nav_overview")}>
      <div className="gjr-stagger space-y-6">
        {/* Baris 1 — Ringkasan cepat: 4 KPI sejajar */}
        <section>
          <SectionHeader>{t("community_summary")}</SectionHeader>
          <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={4} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={TreeDeciduous} label={t("total_registered_trees")}
                value={formatNumber(summary?.total_trees ?? 0)}
                spark={stats.trees} delta={stats.deltaTrees} deltaLabel={t("vs_previous")}
                accent="sage"
              />
              <StatCard
                icon={Cloud} label={t("total_co2_absorbed")}
                value={formatNumber(summary?.total_co2_kg ?? 0, 1)} suffix="kg"
                spark={stats.co2} delta={stats.deltaCo2} deltaLabel={t("vs_previous")}
                accent="forest"
              />
              <StatCard
                icon={Wallet} label={t("total_carbon_fund")}
                value={formatRupiah(summary?.total_income ?? 0)}
                accent="gold"
              />
              <StatCard
                icon={Users} label={t("active_farmers")}
                value={formatNumber(summary?.active_farmers ?? 0)}
                accent="sage"
              />
            </div>
          </ApiState>
        </section>

        {/* Baris 2 — Tren (besar, kiri) + Top kontributor (pendamping, kanan) */}
        <section>
          <SectionHeader>{t("trend_contribution")}</SectionHeader>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-8">
              <Suspense fallback={<SkeletonChart height="h-72" />}><TrendCharts /></Suspense>
            </div>
            <div className="xl:col-span-4">
              <TopContributorsCard topFarmers={summary?.top_farmers ?? []} />
            </div>
          </div>
        </section>

        {/* Baris 3 — Kesehatan pohon (pendamping, kiri) + Peta (besar, kanan) */}
        <section>
          <SectionHeader>{t("tree_condition_location")}</SectionHeader>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-4">
              <HealthSummaryCard healthCounts={summary?.health_summary ?? { baik: 0, sedang: 0, buruk: 0 }} />
            </div>
            <div className="xl:col-span-8">
              <Suspense fallback={<SkeletonChart height="h-80" />}><TreeMap /></Suspense>
            </div>
          </div>
        </section>

        {/* Baris 4 — Dukungan eksternal (pendamping, kiri) + Carbon Fund (besar, kanan) */}
        <section>
          <SectionHeader>{t("carbon_fund_support")}</SectionHeader>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            <div className="xl:col-span-4">
              <SupportSummaryCard
                totalCertificates={summary?.total_certs ?? 0}
                totalBuyers={summary?.total_buyers ?? 0}
              />
            </div>
            <div className="xl:col-span-8"><CarbonFundSection /></div>
          </div>
        </section>

        {/* Baris 5 — Barisan kartu jenis, se-desa.
            Angkanya BEDA DENGAN DI HALAMAN PETANI, dan memang seharusnya:
            di sini "Jati 86" berarti 86 pohon jati di seluruh Giricahyo,
            sedangkan di dashboard petani angka yang sama berarti jati milik
            petani itu sendiri. Keduanya memakai komponen kartu yang sama;
            yang berbeda hanya sumber angkanya.

            Ditaruh tepat di atas tabel karena kartunya menyaring tabel itu. */}
        {summary?.by_species?.length > 0 && (
          <section>
            {/* Jumlah jenis DISEBUTKAN, bukan dibiarkan ditebak. Barisan ini
                digulir mendatar sepanjang empat kali lebar layar, sehingga
                yang terlihat sekilas hanya lima kartu pertama. Tanpa angka
                ini, pembaca tidak punya cara tahu apakah ia sudah melihat
                semuanya — dan pernah memang tidak: barisannya dulu dipotong
                di 8 jenis dari 19 tanpa tanda apa pun. */}
            <SectionHeader>
              {t("by_species")} ({summary.by_species.length})
            </SectionHeader>
            <p className="-mt-1 mb-3 text-xs text-ink-muted">{t("tap_species_filter")}</p>
            <KartuJenis jenis={summary.by_species} aktif={jenisDipilih} onPilih={setJenisDipilih} />
          </section>
        )}

        {/* Baris 6 — Tabel besar — tetap full-width, butuh ruang horizontal penuh */}
        <section>
          <SectionHeader>{t("tree_inventory")}</SectionHeader>
          <TreeTable jenisDipilih={jenisDipilih} onJenisChange={setJenisDipilih} />
        </section>

        <section>
          <SectionHeader>{t("farmer_data_salary")}</SectionHeader>
          <FarmerTable />
        </section>

        <footer className="text-center text-[11px] text-ink-faint pt-4 pb-2">
          {t("dashboard_footer")}
        </footer>
      </div>
    </AppShell>
  );
}
