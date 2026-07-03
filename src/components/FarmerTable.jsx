import { Users } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { formatRupiah, formatNumber } from "../lib/format";

export default function FarmerTable() {
  const { data: farmers, loading, error } = useApi(() => farmerApi.list());

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users size={17} className="text-sage-600" />
        <h3 className="font-semibold text-forest-950 text-sm">Petani &amp; Gaji Karbon</h3>
        {!loading && <span className="text-[11px] text-forest-700/45 tabular">({farmers?.length ?? 0})</span>}
      </div>

      <ApiState loading={loading} error={error}>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-forest-700/50 text-left border-b border-cream-100">
                <th className="py-2.5 px-3 font-semibold">Petani</th>
                <th className="py-2.5 px-3 font-semibold">Kelompok</th>
                <th className="py-2.5 px-3 font-semibold text-right">Pohon</th>
                <th className="py-2.5 px-3 font-semibold text-right">CO₂ (kg)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Gaji Final</th>
              </tr>
            </thead>
            <tbody>
              {(farmers ?? []).map((f) => (
                <tr key={f.id} className="border-b border-cream-50 last:border-0 hover:bg-cream-50/60 transition-colors">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-forest-950">{f.name}</p>
                    <p className="font-mono-id text-[10px] text-forest-700/40">{f.id}</p>
                  </td>
                  <td className="py-2.5 px-3 text-forest-700/70 text-xs">{f.group_coop ?? f.groupCoop}</td>
                  <td className="py-2.5 px-3 text-right tabular text-forest-700/80">{f.tree_count ?? f.treeCount ?? 0}</td>
                  <td className="py-2.5 px-3 text-right tabular text-forest-700/80">
                    {formatNumber(f.total_co2_kg ?? f.totalCo2Kg ?? 0, 1)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular font-bold text-gold-600">
                    {formatRupiah(f.final_salary ?? f.finalSalary ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ApiState>
    </div>
  );
}
