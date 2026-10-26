import { useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { TreeDeciduous } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { dashboardApi, treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { usePeriod } from "../lib/PeriodContext";
import { formatNumber, formatDate } from "../lib/format";
import DrilldownModal from "./DrilldownModal";
import { Card, SkeletonChart, EmptyState, HealthBadge, CHART, AXIS_PROPS } from "./ui";

// Tooltip membaca SELURUH payload, bukan payload[0] saja — supaya siap untuk
// mode perbandingan dua periode dan chart bertumpuk.
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line-strong text-ink rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      <div className="space-y-0.5">
        {payload.map((entry) => (
          <p key={entry.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="tabular font-semibold ml-auto">{entry.value} {unit}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// Daftar pohon di balik satu batang tahun.
function YearDrilldown({ year, onClose }) {
  const { t } = useLanguage();
  const { data: trees, loading, error } = useApi(() => treeApi.list());

  const rows = (trees ?? []).filter((tr) => {
    const d = tr.planted_date ?? tr.plantedDate ?? tr.last_updated ?? tr.lastUpdated;
    return d && String(d).slice(0, 4) === String(year);
  });

  return (
    <DrilldownModal
      title={`${t("drilldown_year")} ${year}`}
      subtitle={`${rows.length} ${t("trees_label")}`}
      icon={TreeDeciduous}
      onClose={onClose}
    >
      <ApiState loading={loading} error={error}>
        {rows.length === 0 ? (
          <EmptyState icon={TreeDeciduous} title={t("no_trees_found")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
                  <th scope="col" className="py-2 px-3 font-semibold">{t("tree_id")}</th>
                  <th scope="col" className="py-2 px-3 font-semibold">{t("species")}</th>
                  <th scope="col" className="py-2 px-3 font-semibold">{t("farmer")}</th>
                  <th scope="col" className="py-2 px-3 font-semibold">{t("health")}</th>
                  <th scope="col" className="py-2 px-3 font-semibold text-right">CO₂ (kg)</th>
                  <th scope="col" className="py-2 px-3 font-semibold">{t("planted_date")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((tr) => {
                  const status = tr.health_status ?? tr.healthStatus;
                  return (
                    <tr key={tr.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 px-3 font-mono-id text-[12px] text-ink">{tr.id}</td>
                      <td className="py-2 px-3 text-ink">{tr.species}</td>
                      <td className="py-2 px-3 text-ink-muted">{tr.farmer_name ?? tr.farmerName ?? "—"}</td>
                      <td className="py-2 px-3"><HealthBadge status={status} label={t(`health_${status}`)} /></td>
                      <td className="py-2 px-3 text-right tabular text-ink">{formatNumber(tr.co2_eq_kg ?? tr.co2EqKg ?? 0, 2)}</td>
                      <td className="py-2 px-3 text-ink-faint text-xs">{formatDate(tr.planted_date ?? tr.plantedDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ApiState>
    </DrilldownModal>
  );
}

export default function TrendCharts() {
  const { t, lang } = useLanguage();
  const { compare, range } = usePeriod();
  const { data: raw, loading, error } = useApi(() => dashboardApi.trend());
  const [drillYear, setDrillYear] = useState(null);

  const all = (raw ?? []).map((d) => ({
    year:             d.year,
    totalCo2Ton:      d.total_co2_ton,
    certificatesSold: d.certificates_sold,
    totalTrees:       d.total_trees,
  })).sort((a, b) => Number(a.year) - Number(b.year));

  // Filter periode global juga berlaku untuk chart.
  const data = range.from
    ? all.filter((d) => Number(d.year) >= Number(range.from.slice(0, 4)) &&
                        Number(d.year) <= Number(range.to.slice(0, 4)))
    : all;

  // Mode perbandingan: tambahkan nilai tahun sebelumnya sebagai seri kedua.
  const withPrev = data.map((d, i) => ({
    ...d,
    prevCo2Ton: i > 0 ? data[i - 1].totalCo2Ton : null,
    prevCerts:  i > 0 ? data[i - 1].certificatesSold : null,
  }));
  const rows = compare ? withPrev : data;

  const onBarClick = (payload) => {
    const year = payload?.activePayload?.[0]?.payload?.year;
    if (year) setDrillYear(year);
  };

  return (
    <>
      <ApiState loading={loading} error={error}
        skeleton={<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SkeletonChart /><SkeletonChart /></div>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-4">
              {t("co2_absorbed_ton_year")}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={rows} barSize={compare ? 14 : 28} onClick={onBarClick} className="cursor-pointer">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="year" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip cursor={{ fill: "var(--surface-hover)" }} content={<ChartTooltip unit={t("unit_ton")} />} />
                {compare && <Legend wrapperStyle={{ fontSize: 10, color: "var(--ink-faint)" }} iconType="circle" iconSize={7} />}
                {compare && <Bar dataKey="prevCo2Ton" name={t("vs_previous")} fill={CHART.grid} radius={[4, 4, 0, 0]} />}
                <Bar dataKey="totalCo2Ton" name={t("co2_absorbed_ton_year")} fill={CHART.c1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-ink-faint mt-2">{lang === "en" ? "Click a bar to see the trees behind it." : "Klik batang untuk melihat pohon di baliknya."}</p>
          </Card>

          <Card>
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-4">
              {t("certificates_sold_cumulative")}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="year" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip cursor={{ stroke: "var(--line-strong)" }} content={<ChartTooltip unit={t("unit_certificate")} />} />
                {compare && <Legend wrapperStyle={{ fontSize: 10, color: "var(--ink-faint)" }} iconType="circle" iconSize={7} />}
                {compare && (
                  <Line dataKey="prevCerts" name={t("vs_previous")} stroke={CHART.axis}
                        strokeWidth={1.6} strokeDasharray="4 3" dot={false} />
                )}
                <Line dataKey="certificatesSold" name={t("certificates_sold_cumulative")}
                      stroke={CHART.c2} strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART.c2, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </ApiState>

      {drillYear && <YearDrilldown year={drillYear} onClose={() => setDrillYear(null)} />}
    </>
  );
}
