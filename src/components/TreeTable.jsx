import { useState } from "react";
import { Search, TreeDeciduous, Camera } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";
import ScanResultModal from "./ScanResultModal";
import AddTreePhotoModal from "./AddTreePhotoModal";
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
  const [photoTreeId, setPhotoTreeId] = useState(null);

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

  // Hanya admin & farmer yang bisa upload foto
  const canUploadPhoto = user?.role === "admin" || user?.role === "farmer";

  return (
    <div className="bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TreeDeciduous size={17} className="text-sage-600 dark:text-sage-400" />
          <h3 className="font-semibold text-forest-950 dark:text-cream-50 text-sm">Daftar Pohon</h3>
          {!loading && (
            <span className="text-[11px] text-forest-700/45 dark:text-cream-50/45 tabular">
              ({filtered.length} dari {normalized.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/40 dark:text-cream-50/40" />
            <input type="text" placeholder="Cari ID / petani..." value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-xs bg-cream-50 dark:bg-forest-950 border border-cream-100 dark:border-forest-800 rounded-lg pl-8 pr-3 py-2 w-full sm:w-52 focus:outline-none focus:ring-2 focus:ring-sage-400/40 text-forest-900 dark:text-cream-50" />
          </div>
          <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}
            className="text-xs bg-cream-50 dark:bg-forest-950 border border-cream-100 dark:border-forest-800 rounded-lg px-2.5 py-2 focus:outline-none text-forest-900 dark:text-cream-50">
            {speciesList.map((s) => <option key={s} value={s} className="dark:bg-forest-900">{s === "semua" ? "Semua jenis" : s}</option>)}
          </select>
        </div>
      </div>

      <ApiState loading={loading} error={error}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-forest-700/50 dark:text-cream-50/50 text-left border-b border-cream-100 dark:border-forest-800">
                <th className="py-2.5 px-3 font-semibold">ID Pohon</th>
                <th className="py-2.5 px-3 font-semibold">Jenis</th>
                {!farmerId && <th className="py-2.5 px-3 font-semibold">Petani</th>}
                <th className="py-2.5 px-3 font-semibold text-right">DBH (cm)</th>
                <th className="py-2.5 px-3 font-semibold">Kesehatan</th>
                <th className="py-2.5 px-3 font-semibold text-right">CO₂ (kg)</th>
                <th className="py-2.5 px-3 font-semibold">Update</th>
                {canUploadPhoto && (
                  <th className="py-2.5 px-3 font-semibold text-center">Foto</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tree) => (
                <tr key={tree.id}
                  className="border-b border-cream-50 dark:border-forest-800/60 last:border-0 hover:bg-cream-50/60 dark:hover:bg-forest-800/40 transition-colors">
                  <td
                    className="py-2.5 px-3 font-mono-id text-[12px] text-forest-900 dark:text-cream-50 cursor-pointer hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                    onClick={() => setSelectedTreeId(tree.id)}
                  >
                    {tree.id}
                  </td>
                  <td className="py-2.5 px-3 text-forest-950 dark:text-cream-50 cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>{tree.species}</td>
                  {!farmerId && <td className="py-2.5 px-3 text-forest-700/80 dark:text-cream-50/70 cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>{tree.farmerName}</td>}
                  <td className="py-2.5 px-3 text-right tabular text-forest-700/80 dark:text-cream-50/70 cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>{tree.dbhCm}</td>
                  <td className="py-2.5 px-3 cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${healthBadge[tree.healthStatus]}`}>
                      {tree.healthStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular font-medium text-forest-950 dark:text-cream-50 cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>
                    {formatNumber(tree.co2EqKg, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-forest-700/60 dark:text-cream-50/50 text-xs cursor-pointer" onClick={() => setSelectedTreeId(tree.id)}>{formatDate(tree.lastUpdated)}</td>

                  {/* Tombol Upload Foto — hanya untuk admin & farmer */}
                  {canUploadPhoto && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoTreeId(tree.id);
                        }}
                        title={`Tambah foto untuk pohon ${tree.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-sage-500/10 hover:bg-sage-500/20 text-sage-600 dark:text-sage-400 font-semibold text-[11px] rounded-lg border border-sage-200/60 dark:border-sage-700/40 transition-colors"
                      >
                        <Camera size={13} />
                        <span className="hidden sm:inline">Foto</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canUploadPhoto ? 8 : 7} className="py-8 text-center text-forest-700/40 dark:text-cream-50/40 text-sm">
                    Tidak ada pohon ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-forest-700/40 dark:text-cream-50/40 mt-3 px-1">
          Klik baris untuk melihat detail pohon.
          {canUploadPhoto && " · Klik tombol 📷 untuk menambah foto perkembangan."}
        </p>
      </ApiState>

      {/* Modal Detail Pohon (saat klik baris) */}
      {selectedTreeId && (
        <ScanResultModal
          treeId={selectedTreeId}
          role={user?.role ?? "admin"}
          onClose={() => { setSelectedTreeId(null); refetch(); }}
        />
      )}

      {/* Modal Upload Foto Pohon (saat klik tombol Foto) */}
      {photoTreeId && (
        <AddTreePhotoModal
          isOpen={true}
          treeId={photoTreeId}
          onClose={() => setPhotoTreeId(null)}
          onPhotoAdded={() => {
            setPhotoTreeId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
