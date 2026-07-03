import { HeartPulse, Trophy, FileCheck, Building2 } from "lucide-react";
import { useDb } from "../lib/useDb";
import { getAdminInsights } from "../lib/joins";
import { formatNumber } from "../lib/format";

const healthMeta = {
  baik: { label: "Sehat", color: "bg-sage-500", text: "text-sage-600" },
  sedang: { label: "Perlu Perhatian", color: "bg-gold-500", text: "text-gold-600" },
  buruk: { label: "Kritis", color: "bg-clay-700", text: "text-clay-700" },
};

export default function AdminInsightCards() {
  const { healthCounts, topFarmers, totalCertificates, totalBuyers } = useDb(() =>
    getAdminInsights()
  );

  const totalTrees = healthCounts.baik + healthCounts.sedang + healthCounts.buruk;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Kesehatan pohon — actionable, bukan cuma angka */}
      <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse size={17} className="text-sage-600" />
          <h3 className="font-semibold text-forest-950 text-sm">Kesehatan Pohon</h3>
        </div>

        {/* Stacked bar proporsional */}
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

        {healthCounts.buruk > 0 && (
          <p className="text-[11px] text-clay-700 bg-clay-100 rounded-lg px-3 py-2 mt-4">
            {healthCounts.buruk} pohon berstatus kritis dan butuh perhatian
            segera dari petani pemiliknya.
          </p>
        )}
      </div>

      {/* Top kontributor */}
      <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={17} className="text-gold-600" />
          <h3 className="font-semibold text-forest-950 text-sm">Top Kontributor CO₂</h3>
        </div>
        <div className="space-y-3">
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

      {/* Ringkasan sertifikat/dukungan */}
      <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck size={17} className="text-sage-600" />
          <h3 className="font-semibold text-forest-950 text-sm">Dukungan Eksternal</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream-50 rounded-xl p-4 text-center">
            <FileCheck size={18} className="text-gold-600 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-forest-950 tabular">{totalCertificates}</p>
            <p className="text-[11px] text-forest-700/50">Sertifikat Aktif</p>
          </div>
          <div className="bg-cream-50 rounded-xl p-4 text-center">
            <Building2 size={18} className="text-sage-600 mx-auto mb-1.5" />
            <p className="text-2xl font-bold text-forest-950 tabular">{totalBuyers}</p>
            <p className="text-[11px] text-forest-700/50">Buyer/Donor</p>
          </div>
        </div>
        <p className="text-[11px] text-forest-700/45 mt-4">
          Kelola sertifikat dukungan baru lewat menu{" "}
          <span className="font-medium text-forest-700">Kelola Sertifikat</span> di atas.
        </p>
      </div>
    </div>
  );
}
