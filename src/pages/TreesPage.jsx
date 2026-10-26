// src/pages/TreesPage.jsx — halaman fokus inventaris pohon (admin).
// Ringkasan di "/" tetap menampilkan tabel yang sama; halaman ini hanya
// memberi ruang penuh tanpa harus scroll melewati seluruh dashboard.

import AppShell from "../components/AppShell";
import TreeTable from "../components/TreeTable";
import HealthSummaryCard from "../components/HealthSummaryCard";
import { useApi } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { SectionHeader } from "../components/ui";

export default function TreesPage() {
  const { t } = useLanguage();
  const { data: summary } = useApi(() => dashboardApi.summary());

  return (
    <AppShell title={t("nav_trees")}>
      <div className="gjr-stagger grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-4 space-y-4">
          <SectionHeader>{t("health_title")}</SectionHeader>
          <HealthSummaryCard healthCounts={summary?.health_summary ?? { baik: 0, sedang: 0, buruk: 0 }} />
        </div>
        <div className="xl:col-span-8 space-y-4">
          <SectionHeader>{t("tree_inventory")}</SectionHeader>
          <TreeTable />
        </div>
      </div>
    </AppShell>
  );
}
