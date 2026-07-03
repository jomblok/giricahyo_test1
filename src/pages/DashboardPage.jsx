import { TreeDeciduous, Cloud, Wallet, Users } from "lucide-react";
import Header from "../components/Header";
import KpiCard from "../components/KpiCard";
import TrendCharts from "../components/TrendCharts";
import TopContributorsCard from "../components/TopContributorsCard";
import HealthSummaryCard from "../components/HealthSummaryCard";
import TreeMap from "../components/TreeMap";
import SupportSummaryCard from "../components/SupportSummaryCard";
import CarbonFundSection from "../components/CarbonFundSection";
import TreeTable from "../components/TreeTable";
import FarmerTable from "../components/FarmerTable";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";
import { formatNumber, formatRupiah } from "../lib/format";

function SectionLabel({ children }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 mb-3 px-1">
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  const { data: summary, loading, error } = useApi(() => dashboardApi.summary());

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Baris 1 — Ringkasan cepat: 4 KPI sejajar */}
        <section>
          <SectionLabel>Ringkasan Komunitas</SectionLabel>
          <ApiState loading={loading} error={error}
            skeleton={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-28 bg-cream-100 rounded-2xl animate-pulse" />)}</div>}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={TreeDeciduous} label="Total Pohon Terdaftar"  value={formatNumber(summary?.total_trees    ?? 0)} accent="sage" />
              <KpiCard icon={Cloud}         label="Total CO₂ Terserap"     value={formatNumber(summary?.total_co2_kg  ?? 0, 1)} suffix="kg" accent="forest" />
              <KpiCard icon={Wallet}        label="Total Carbon Fund"      value={formatRupiah(summary?.total_income  ?? 0)} accent="gold" />
              <KpiCard icon={Users}         label="Petani Aktif"           value={formatNumber(summary?.active_farmers ?? 0)} accent="sage" />
            </div>
          </ApiState>
        </section>

        {/* Baris 2 — Tren (besar, kiri) + Top kontributor (pendamping, kanan) */}
        <section>
          <SectionLabel>Tren &amp; Kontribusi</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8">
              <TrendCharts />
            </div>
            <div className="lg:col-span-4">
              <TopContributorsCard />
            </div>
          </div>
        </section>

        {/* Baris 3 — Kesehatan pohon (pendamping, kiri) + Peta (besar, kanan) */}
        <section>
          <SectionLabel>Kondisi &amp; Lokasi Pohon</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-4">
              <HealthSummaryCard />
            </div>
            <div className="lg:col-span-8">
              <TreeMap />
            </div>
          </div>
        </section>

        {/* Baris 4 — Dukungan eksternal (pendamping, kiri) + Carbon Fund (besar, kanan) */}
        <section>
          <SectionLabel>Carbon Fund &amp; Dukungan</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-4">
              <SupportSummaryCard />
            </div>
            <div className="lg:col-span-8">
              <CarbonFundSection />
            </div>
          </div>
        </section>

        {/* Tabel besar — tetap full-width, butuh ruang horizontal penuh */}
        <section>
          <SectionLabel>Inventarisasi Pohon</SectionLabel>
          <TreeTable />
        </section>

        <section>
          <SectionLabel>Data Petani &amp; Gaji Karbon</SectionLabel>
          <FarmerTable />
        </section>

        <footer className="text-center text-[11px] text-forest-700/40 pt-4 pb-2">
          Giricahyo Carbon Dashboard — Koperasi Griya Jati Rasa, Desa Giricahyo
        </footer>
      </main>
    </div>
  );
}
