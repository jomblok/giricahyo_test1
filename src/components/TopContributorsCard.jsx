import { Trophy } from "lucide-react";
import { useDb } from "../lib/useDb";
import { getAdminInsights } from "../lib/joins";
import { formatNumber } from "../lib/format";

export default function TopContributorsCard() {
  const { topFarmers } = useDb(() => getAdminInsights());

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={17} className="text-gold-600" />
        <h3 className="font-semibold text-forest-950 text-sm">Top Kontributor CO₂</h3>
      </div>
      <div className="space-y-3 flex-1">
        {topFarmers.map((f, i) => (
          <div key={f.id} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? "bg-gold-500 text-forest-950" : "bg-cream-100 text-forest-700/50"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-forest-950 truncate">{f.name}</p>
              <p className="text-[11px] text-forest-700/45">{f.groupCoop}</p>
            </div>
            <span className="text-sm font-bold text-forest-900 tabular shrink-0">
              {formatNumber(f.totalCo2Kg, 1)} kg
            </span>
          </div>
        ))}
        {topFarmers.length === 0 && (
          <p className="text-sm text-forest-700/40 text-center py-4">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
