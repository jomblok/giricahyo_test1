import { useState } from "react";
import { Search, TreeDeciduous } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";
import ScanResultModal from "./ScanResultModal";
import { useAuth } from "../lib/AuthContext";

const healthBadge = {
  baik:   "bg-sage-100 text-sage-600",
  sedang: "bg-gold-100 text-gold-600",
  buruk:  "bg-clay-100 text-clay-700",
};

// Props:
//   trees      — opsional, array pohon dari parent (misal dashboard petani)
//                Kalau tidak ada, fetch sendiri dari API
//   farmerId   — opsional, filter pohon milik petani tertentu
export default function TreeTable({ trees: propTrees, farmerId }) {
  const { user } = useAuth();
  const [query, setQuery]             = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("semua");
  const [selectedTreeId, setSelectedTreeId] = useState(null);

  // Fetch dari API hanya kalau trees tidak di-pass dari parent
  const { data: apiTrees, loading, error, refetch } = useApi(
    () => treeApi.list(farmerId ? { farmer_id: farmerId } : {}),
    [farmerId]
  );

  const allTrees = propTrees ?? apiTrees ?? [];

  // Normalisasi field snake_case → camelCase (dari API)
  const normalized = allTrees.map((t) => ({
    id:           t.id,
    farmerId:     t.farmer_id     ?? t.farmerId,
    farmerName:   t.farmer_name   ?? t.farmerName   ?? t.farmer?.name ?? "—",
    species:      t.species,
    dbhCm:        t.dbh_cm        ?? t.dbhCm,
    heightM:      t.height_m      ?? t.heightM,
    healthStatus: t.health_status ?? t.healthStatus,
    plantedDate:  t.planted_date  ?? t.plantedDate,
    lastUpdated:  t.last_updated  ?? t.lastUpdated,
    co2EqKg:      t.co2_eq_kg     ?? t.co2EqKg,
  }));

  const speciesList = ["semua", ...new Set(normalized.map((t) => t.species))];

  const filtered = normalized.filter((t) => {
    const matchQ = t.id.toLowerCase().includes(query.toLowerCase()) ||
                   t.farmerName.toLowerCase().includes(query.toLowerCase());
    const matchS = speciesFilter === "semua" || t.species === speciesFilter;
    return matchQ && matchS;
  });

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TreeDeciduous size={17} className="text-sage-600" />
          <h3 className="font-semibold text-forest-950 text-sm">Daftar Pohon</h3>
          {!loading && (
            <span className="text-[11px] text-forest-700/45 tabular">
              ({filtered.length} dari {normalized.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/40" />
            <input type="text" placeholder="Cari ID / petani..." value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-xs bg-cream-50 border border-cream-100 rounded-lg pl-8 pr-3 py-2 w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-sage-400/40" />
          </div>
          <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}
            className="text-xs bg-cream-50 border border-cream-100 rounded-lg px-2.5 py-2 focus:outline-none">
            {speciesList.map((s) => <option key={s} value={s}>{s === "semua" ? "Semua jenis" : s}</option>)}
          </select>
        </div>
      </div>

      <ApiState loading={loading} error={error}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-forest-700/50 text-left border-b border-cream-100">
                <th className="py-2.5 px-3 font-semibold">ID Pohon</th>
                <th className="py-2.5 px-3 font-semibold">Jenis</th>
                {!farmerId && <th className="py-2.5 px-3 font-semibold">Petani</th>}
                <th className="py-2.5 px-3 font-semibold text-right">DBH (cm)</th>
                <th className="py-2.5 px-3 font-semibold">Kesehatan</th>
                <th className="py-2.5 px-3 font-semibold text-right">CO₂ (kg)</th>
                <th className="py-2.5 px-3 font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tree) => (
                <tr key={tree.id} onClick={() => setSelectedTreeId(tree.id)}
                  className="border-b border-cream-50 last:border-0 hover:bg-cream-50/60 transition-colors cursor-pointer">
                  <td className="py-2.5 px-3 font-mono-id text-[12px] text-forest-900">{tree.id}</td>
                  <td className="py-2.5 px-3 text-forest-950">{tree.species}</td>
                  {!farmerId && <td className="py-2.5 px-3 text-forest-700/80">{tree.farmerName}</td>}
                  <td className="py-2.5 px-3 text-right tabular text-forest-700/80">{tree.dbhCm}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${healthBadge[tree.healthStatus]}`}>
                      {tree.healthStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular font-medium text-forest-950">
                    {formatNumber(tree.co2EqKg, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-forest-700/60 text-xs">{formatDate(tree.lastUpdated)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-forest-700/40 text-sm">Tidak ada pohon ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-forest-700/40 mt-3 px-1">Klik baris untuk melihat detail pohon.</p>
      </ApiState>

      {selectedTreeId && (
        <ScanResultModal treeId={selectedTreeId} role={user?.role ?? "admin"}
          onClose={() => { setSelectedTreeId(null); refetch(); }} />
      )}
    </div>
  );
}
