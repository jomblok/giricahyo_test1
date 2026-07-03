import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { dashboardApi } from "../lib/api";

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forest-900 text-cream-50 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-sage-400 tabular">{payload[0].value} {unit}</p>
    </div>
  );
}

export default function TrendCharts() {
  const { data: raw, loading, error } = useApi(() => dashboardApi.trend());

  // Normalisasi field dari backend (snake_case) ke format chart
  const data = (raw ?? []).map((d) => ({
    year:             d.year,
    totalCo2Ton:      d.total_co2_ton,
    certificatesSold: d.certificates_sold,
    totalTrees:       d.total_trees,
  }));

  return (
    <ApiState loading={loading} error={error}
      skeleton={<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="h-48 bg-cream-100 rounded-2xl animate-pulse"/><div className="h-48 bg-cream-100 rounded-2xl animate-pulse"/></div>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-forest-700/50 uppercase tracking-wide mb-4">CO₂ Terserap (ton/tahun)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit="ton" />} />
              <Bar dataKey="totalCo2Ton" fill="#2f6e51" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-forest-700/50 uppercase tracking-wide mb-4">Sertifikat Terjual (kumulatif)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e4d9" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit="sertifikat" />} />
              <Line dataKey="certificatesSold" stroke="#c89b3c" strokeWidth={2.5} dot={{ r: 4, fill: "#c89b3c" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ApiState>
  );
}
