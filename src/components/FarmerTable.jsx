import { memo, useState, useMemo } from "react";
import { Users } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { formatRupiah, formatNumber } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import FarmerProfileDrawer from "./FarmerProfileDrawer";
import { Card, CardHeader, EmptyState, SkeletonTable, DataTable } from "./ui";

function FarmerTable() {
  const { t } = useLanguage();
  const { data: farmers, loading, error } = useApi(() => farmerApi.list());
  const [openFarmerId, setOpenFarmerId] = useState(null);
  const rows = farmers ?? [];

  const columns = useMemo(() => [
    {
      key: "name", header: t("farmer"), value: (r) => r.name,
      render: (r) => (
        <>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="font-mono-id text-[10px] text-ink-faint">{r.id}</p>
        </>
      ),
    },
    { key: "group", header: t("group"),
      value: (r) => r.group_coop ?? r.groupCoop ?? "",
      cellClass: "text-ink-muted text-xs" },
    { key: "trees", header: t("trees_label"), align: "right",
      value: (r) => r.tree_count ?? r.treeCount ?? 0,
      cellClass: "text-ink-muted" },
    { key: "co2", header: "CO₂ (kg)", align: "right",
      value: (r) => r.total_co2_kg ?? r.totalCo2Kg ?? 0,
      render: (r) => formatNumber(r.total_co2_kg ?? r.totalCo2Kg ?? 0, 1),
      cellClass: "text-ink-muted" },
    // gold-700 lewat token --warn: gold-500 lama hanya ~2.6:1 di atas putih
    { key: "salary", header: t("final_salary"), align: "right",
      value: (r) => r.final_salary ?? r.finalSalary ?? 0,
      render: (r) => formatRupiah(r.final_salary ?? r.finalSalary ?? 0),
      cellClass: "font-bold text-warn" },
  ], [t]);

  return (
    <Card>
      <CardHeader icon={Users} title={t("farmers_carbon_salary")} count={!loading ? rows.length : undefined} />

      <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={5} cols={5} />}>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(r) => r.id}
          onRowClick={(r) => setOpenFarmerId(r.id)}
          rowLabel={(r) => `${t("farmer_profile")}: ${r.name}`}
          initialSort={{ key: "salary", dir: "desc" }}
          exportName="petani"
          empty={<EmptyState icon={Users} title={t("no_data_yet")} compact />}
        />
      </ApiState>

      {openFarmerId && (
        <FarmerProfileDrawer farmerId={openFarmerId} onClose={() => setOpenFarmerId(null)} />
      )}
    </Card>
  );
}

// memo: Ringkasan merender ulang seluruh isinya setiap kali salah satu
// datanya tiba (terukur: 6 kali per kunjungan). Komponen ini tidak memakai
// props yang berubah pada saat itu, jadi render ulang tersebut sia-sia.
export default memo(FarmerTable);
