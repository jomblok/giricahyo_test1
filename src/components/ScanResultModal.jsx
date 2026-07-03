import { useEffect, useState } from "react";
import { X, TreeDeciduous, User, Wind, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { treeApi } from "../lib/api";
import { formatNumber } from "../lib/format";

const healthBadge = {
  baik:   { label: "Sehat",            cls: "bg-sage-100 text-sage-600" },
  sedang: { label: "Perlu Perhatian",  cls: "bg-gold-100 text-gold-600" },
  buruk:  { label: "Kritis",           cls: "bg-clay-100 text-clay-700" },
};

export default function ScanResultModal({ treeId, role, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    treeApi.get(treeId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

  const tree    = data?.tree;
  const farmer  = data?.farmer;
  const adoption = data?.adoption;
  const health  = tree ? (healthBadge[tree.health_status ?? tree.healthStatus] ?? healthBadge.baik) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-forest-900 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-cream-50/50 uppercase tracking-wider">Hasil Scan QR</p>
            <p className="font-mono-id text-gold-500 text-sm">{treeId}</p>
          </div>
          <button onClick={onClose} className="text-cream-50/50 hover:text-cream-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-sage-500" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-clay-100 text-clay-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} />{error}
            </div>
          )}

          {tree && (
            <div className="space-y-4">
              {/* Nama & status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-forest-950 text-lg">{tree.species}</p>
                  <p className="text-xs text-forest-700/55 mt-0.5">{farmer?.name} · {farmer?.group_coop}</p>
                </div>
                {health && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${health.cls}`}>
                    {health.label}
                  </span>
                )}
              </div>

              {/* Info per role */}
              {role === "admin" && (
                <div className="space-y-2">
                  <InfoRow icon={TreeDeciduous} label="DBH / Tinggi" value={`${tree.dbh_cm ?? tree.dbhCm} cm / ${tree.height_m ?? tree.heightM} m`} />
                  <InfoRow icon={Wind}          label="CO₂ Diserap"  value={`${formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 2)} kg CO₂e`} />
                  <InfoRow icon={User}          label="Tanam"        value={tree.planted_date ?? tree.plantedDate} />
                </div>
              )}

              {role === "farmer" && (
                <div className="space-y-2">
                  <InfoRow icon={Wind}   label="CO₂ Pohon Ini"  value={`${formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 2)} kg CO₂e`} />
                </div>
              )}

              {role === "buyer" && adoption && (
                <div className="space-y-2">
                  <InfoRow icon={ShieldCheck} label="Sertifikat" value={adoption.certificate_no} mono />
                  <InfoRow icon={User}        label="Adopsi"     value={adoption.adopted_date} />
                </div>
              )}

              {/* Update kesehatan (admin saja) */}
              {role === "admin" && (
                <HealthUpdater treeId={treeId} current={tree.health_status ?? tree.healthStatus} onUpdate={onClose} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 bg-cream-50 rounded-xl px-3.5 py-2.5">
      <Icon size={14} className="text-forest-700/50 shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-forest-700/45">{label}</p>
        <p className={`text-sm font-medium text-forest-950 ${mono ? "font-mono-id" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

function HealthUpdater({ treeId, current, onUpdate }) {
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (status === current) return;
    setSaving(true);
    try {
      await treeApi.updateHealth(treeId, status);
      onUpdate();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-cream-100 pt-4">
      <p className="text-xs font-semibold text-forest-700/60 mb-2">Update Status Kesehatan</p>
      <div className="flex gap-2 mb-3">
        {["baik", "sedang", "buruk"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${
              status === s
                ? s === "baik" ? "bg-sage-500 text-white border-sage-500"
                  : s === "sedang" ? "bg-gold-500 text-forest-950 border-gold-500"
                  : "bg-clay-700 text-white border-clay-700"
                : "bg-cream-50 text-forest-700/60 border-cream-100"
            }`}>
            {s}
          </button>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving || status === current}
        className="w-full flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-50 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors">
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}
