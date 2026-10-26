// src/lib/useTrendStats.js
//
// Menurunkan sparkline dan delta antar periode dari endpoint /dashboard/trend
// yang SUDAH ada. Jadi kartu KPI bisa punya konteks perbandingan tanpa
// menunggu endpoint baru dari backend.
//
// Kalau nanti backend menyediakan /dashboard/timeseries yang lebih rinci
// (bulanan, bukan tahunan), cukup tukar sumbernya di sini.

import { useMemo } from "react";
import { useApi } from "./useApi.jsx";
import { dashboardApi } from "./api";
import { usePeriod } from "./PeriodContext";

function pct(now, before) {
  if (before == null || before === 0 || now == null) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

export function useTrendStats() {
  const { data: raw, loading, error } = useApi(() => dashboardApi.trend());
  const { range } = usePeriod();

  return useMemo(() => {
    const rows = [...(raw ?? [])].sort((a, b) => Number(a.year) - Number(b.year));

    // Hormati filter periode global saat memilih baris yang dihitung.
    const inRange = range.from
      ? rows.filter((r) => {
          const y = Number(r.year);
          return y >= Number(range.from.slice(0, 4)) && y <= Number(range.to.slice(0, 4));
        })
      : rows;

    const series = (key) => inRange.map((r) => Number(r[key] ?? 0));
    const deltaOf = (key) => {
      const s = series(key);
      return s.length >= 2 ? pct(s[s.length - 1], s[s.length - 2]) : null;
    };

    return {
      loading,
      error,
      rows: inRange,
      years: inRange.map((r) => r.year),
      co2:          series("total_co2_ton"),
      certificates: series("certificates_sold"),
      trees:        series("total_trees"),
      deltaCo2:          deltaOf("total_co2_ton"),
      deltaCertificates: deltaOf("certificates_sold"),
      deltaTrees:        deltaOf("total_trees"),
      // true kalau memang ada dua titik untuk dibandingkan
      hasComparison: inRange.length >= 2,
    };
  }, [raw, loading, error, range.from, range.to]);
}
