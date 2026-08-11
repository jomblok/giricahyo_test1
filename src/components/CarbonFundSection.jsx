import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, ArrowDownToLine, Filter, Calendar } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { carbonFundApi } from "../lib/api";
import { formatRupiah, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";

const DISTRIBUTION_COLORS = ["#c89b3c", "#2f6e51", "#6aab82"];

const MONTH_OPTIONS = [
  { value: "", label: "Semua Bulan" },
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const YEAR_OPTIONS = ["", "2026", "2025", "2024"];

export default function CarbonFundSection() {
  const { t, lang } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const params = {};
  if (selectedMonth) params.month = selectedMonth;
  if (selectedYear) params.year = selectedYear;

  const { data: summary, loading, error } = useApi(
    () => carbonFundApi.summary(params),
    [selectedMonth, selectedYear]
  );

  const distribution = summary?.distribution ?? [];
  const totalFund = summary?.total_income ?? 0;

  // Data pemasukan raw untuk tabel — fetch terpisah dengan filter
  const { data: incomeRows } = useApi(
    () => carbonFundApi.income(params),
    [selectedMonth, selectedYear]
  );

  return (
    <div className="space-y-4">
      {/* Month & Year Filter Bar */}
      <div className="bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2 text-xs font-semibold text-forest-950 dark:text-cream-50">
          <Filter size={15} className="text-sage-600 dark:text-sage-400" />
          <span>{lang === "en" ? "Filter Carbon Fund:" : "Filter Pendanaan Karbon:"}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-cream-50 dark:bg-forest-950 px-3 py-1.5 rounded-xl border border-cream-200 dark:border-forest-800">
            <Calendar size={13} className="text-forest-700/50 dark:text-cream-50/50" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-forest-900 dark:text-cream-50 font-medium focus:outline-none cursor-pointer"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value} className="dark:bg-forest-900 text-forest-900 dark:text-cream-50">
                  {m.value === "" && lang === "en" ? "All Months" : m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-cream-50 dark:bg-forest-950 px-3 py-1.5 rounded-xl border border-cream-200 dark:border-forest-800">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-forest-900 dark:text-cream-50 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-forest-900">
                {lang === "en" ? "All Years" : "Semua Tahun"}
              </option>
              {YEAR_OPTIONS.filter(Boolean).map((y) => (
                <option key={y} value={y} className="dark:bg-forest-900 text-forest-900 dark:text-cream-50">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ApiState
        loading={loading}
        error={error}
        skeleton={<div className="h-48 bg-cream-100 dark:bg-forest-800 rounded-2xl animate-pulse" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Dana masuk */}
          <div className="lg:col-span-3 bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownToLine size={17} className="text-sage-600 dark:text-sage-400" />
                <h3 className="font-semibold text-forest-950 dark:text-cream-50 text-sm">
                  {lang === "en" ? "Income Fund Records" : "Dana Masuk"}
                </h3>
              </div>
              <span className="text-xs font-bold text-gold-600 dark:text-gold-400">{formatRupiah(totalFund)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-forest-700/50 dark:text-cream-50/50 text-left border-b border-cream-100 dark:border-forest-800">
                    <th className="py-2 px-2 font-semibold">{lang === "en" ? "Date" : "Tanggal"}</th>
                    <th className="py-2 px-2 font-semibold">{lang === "en" ? "Source" : "Sumber"}</th>
                    <th className="py-2 px-2 font-semibold text-right">Qty</th>
                    <th className="py-2 px-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(incomeRows ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-forest-700/40 dark:text-cream-50/40">
                        {lang === "en" ? "No income records found for selected period." : "Tidak ada catatan dana untuk periode ini."}
                      </td>
                    </tr>
                  ) : (
                    (incomeRows ?? []).map((row) => (
                      <tr key={row.id} className="border-b border-cream-50 dark:border-forest-800/60 last:border-0">
                        <td className="py-2 px-2 text-xs text-forest-700/60 dark:text-cream-50/60">{formatDate(row.date)}</td>
                        <td className="py-2 px-2 text-forest-950 dark:text-cream-50 font-medium">{row.source}</td>
                        <td className="py-2 px-2 text-right tabular text-forest-700/70 dark:text-cream-50/70">{row.qty}</td>
                        <td className="py-2 px-2 text-right tabular font-medium text-forest-950 dark:text-cream-50">
                          {formatRupiah(row.total_amount ?? row.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Distribusi */}
          <div className="lg:col-span-2 bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={17} className="text-gold-600 dark:text-gold-400" />
              <h3 className="font-semibold text-forest-950 dark:text-cream-50 text-sm">
                {lang === "en" ? "Fund Distribution" : "Distribusi Dana"}
              </h3>
            </div>
            {distribution.length > 0 && (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={distribution} dataKey="amount" nameKey="component" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
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
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: DISTRIBUTION_COLORS[i % DISTRIBUTION_COLORS.length] }}
                    />
                    <span className="text-xs text-forest-700/70 dark:text-cream-50/70">{d.component}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-forest-950 dark:text-cream-50">{d.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ApiState>
    </div>
  );
}
