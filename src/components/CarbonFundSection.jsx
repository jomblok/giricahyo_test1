import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, ArrowDownToLine } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { carbonFundApi } from "../lib/api";
import { formatRupiah, formatDate } from "../lib/format";

const DISTRIBUTION_COLORS = ["#c89b3c", "#2f6e51", "#6aab82"];

export default function CarbonFundSection() {
  const { data: summary, loading, error } = useApi(() => carbonFundApi.summary());

  const distribution = summary?.distribution ?? [];
  const totalFund    = summary?.total_income ?? 0;

  // Data pemasukan raw untuk tabel — fetch terpisah
  const { data: incomeRows } = useApi(() => carbonFundApi.income());

  return (
    <ApiState loading={loading} error={error}
      skeleton={<div className="h-48 bg-cream-100 rounded-2xl animate-pulse"/>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Dana masuk */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={17} className="text-sage-600" />
              <h3 className="font-semibold text-forest-950 text-sm">Dana Masuk</h3>
            </div>
            <span className="text-xs font-bold text-gold-600">{formatRupiah(totalFund)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-forest-700/50 text-left border-b border-cream-100">
                  <th className="py-2 px-2 font-semibold">Tanggal</th>
                  <th className="py-2 px-2 font-semibold">Sumber</th>
                  <th className="py-2 px-2 font-semibold text-right">Qty</th>
                  <th className="py-2 px-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(incomeRows ?? []).map((row) => (
                  <tr key={row.id} className="border-b border-cream-50 last:border-0">
                    <td className="py-2 px-2 text-xs text-forest-700/60">{formatDate(row.date)}</td>
                    <td className="py-2 px-2 text-forest-950">{row.source}</td>
                    <td className="py-2 px-2 text-right tabular text-forest-700/70">{row.qty}</td>
                    <td className="py-2 px-2 text-right tabular font-medium text-forest-950">
                      {formatRupiah(row.total_amount ?? row.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribusi */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={17} className="text-gold-600" />
            <h3 className="font-semibold text-forest-950 text-sm">Distribusi Dana</h3>
          </div>
          {distribution.length > 0 && (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={distribution} dataKey="amount" nameKey="component"
                  cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {distribution.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length] }} />
                  <span className="text-xs text-forest-700/70">{d.component}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-forest-950">{d.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ApiState>
  );
}
