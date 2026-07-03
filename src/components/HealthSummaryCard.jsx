import { HeartPulse } from "lucide-react";
import { useDb } from "../lib/useDb";
import { getAdminInsights } from "../lib/joins";

const healthMeta = {
  baik: { label: "Sehat", color: "bg-sage-500", text: "text-sage-600" },
  sedang: { label: "Perlu Perhatian", color: "bg-gold-500", text: "text-gold-600" },
  buruk: { label: "Kritis", color: "bg-clay-700", text: "text-clay-700" },
};

export default function HealthSummaryCard() {
  const { healthCounts } = useDb(() => getAdminInsights());
  const totalTrees = healthCounts.baik + healthCounts.sedang + healthCounts.buruk;

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <HeartPulse size={17} className="text-sage-600" />
        <h3 className="font-semibold text-forest-950 text-sm">Kesehatan Pohon</h3>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-cream-100">
        {(["baik", "sedang", "buruk"]).map((key) =>
          healthCounts[key] > 0 ? (
            <div
              key={key}
              className={healthMeta[key].color}
              style={{ width: `${(healthCounts[key] / totalTrees) * 100}%` }}
            />
          ) : null
        )}
      </div>

      <div className="space-y-2.5">
        {(["baik", "sedang", "buruk"]).map((key) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-forest-700/70">
              <span className={`w-2 h-2 rounded-full ${healthMeta[key].color}`} />
              {healthMeta[key].label}
            </span>
            <span className={`font-semibold tabular ${healthMeta[key].text}`}>
              {healthCounts[key]} pohon
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {healthCounts.buruk > 0 && (
        <p className="text-[11px] text-clay-700 bg-clay-100 rounded-lg px-3 py-2 mt-4">
          {healthCounts.buruk} pohon berstatus kritis dan butuh perhatian
          segera dari petani pemiliknya.
        </p>
      )}
    </div>
  );
}
