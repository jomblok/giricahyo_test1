import { useParams, Link } from "react-router-dom";
import { Leaf, MapPin, User, Cloud, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useApi } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { formatNumber } from "../lib/format";

const healthLabel = {
  baik:   { text: "Sehat",           color: "text-sage-600 bg-sage-100" },
  sedang: { text: "Perlu Perhatian", color: "text-gold-600 bg-gold-100" },
  buruk:  { text: "Kritis",          color: "text-clay-700 bg-clay-100" },
};

export default function PublicTreePage() {
  const { id } = useParams();
  const { data, loading, error } = useApi(() => treeApi.getPublic(id), [id]);

  const tree   = data?.tree;
  const farmer = data?.farmer;
  const health = tree ? (healthLabel[tree.health_status] ?? healthLabel.baik) : null;

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-sage-500/20 rounded-lg p-1.5"><Leaf size={16} className="text-sage-400" /></div>
          <span className="text-cream-50/70 text-xs font-semibold uppercase tracking-wider">Giricahyo Carbon</span>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-sage-400" />
          </div>
        )}

        {error && (
          <div className="bg-forest-900 rounded-3xl p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-clay-400" />
            <p className="font-semibold text-cream-50 mb-1">Pohon tidak ditemukan</p>
            <p className="text-sm text-cream-50/60">ID pohon <span className="font-mono-id">{id}</span> tidak terdaftar.</p>
          </div>
        )}

        {tree && (
          <div className="bg-cream-50 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-forest-900 px-6 py-5 text-center">
              <p className="text-[11px] uppercase tracking-wider text-cream-50/50 mb-1">Kartu Identitas Pohon</p>
              <p className="font-mono-id text-gold-500 text-sm">{tree.id}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center pb-4 border-b border-cream-100">
                <h1 className="text-2xl font-bold text-forest-950">{tree.species}</h1>
                <span className={`inline-block mt-2 text-[11px] font-medium px-2.5 py-1 rounded-full ${health.color}`}>
                  {health.text}
                </span>
              </div>
              <InfoRow icon={User}   label="Petani Pemilik"         value={farmer?.name ?? "—"} />
              <InfoRow icon={MapPin} label="Lokasi Koordinat"       value={`${Number(tree.latitude).toFixed(5)}, ${Number(tree.longitude).toFixed(5)}`} mono />
              <InfoRow icon={Cloud}  label="Estimasi Serapan Karbon" value={`${formatNumber(tree.co2_eq_kg, 2)} kg CO₂e`} highlight />
            </div>
            <div className="bg-cream-100 px-6 py-3 text-center">
              <p className="text-[11px] text-forest-700/50">Dukung petani penjaga pohon ini melalui Koperasi Griya Jati Rasa</p>
            </div>
          </div>
        )}

        <Link to="/" className="flex items-center justify-center gap-1.5 text-cream-50/40 text-xs mt-6 hover:text-cream-50/70 transition-colors">
          <ArrowLeft size={12} />Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, highlight }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-sage-100 rounded-lg p-2 shrink-0"><Icon size={15} className="text-sage-600" /></div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-forest-700/45 mb-0.5">{label}</p>
        <p className={`text-sm break-words ${mono ? "font-mono-id" : ""} ${highlight ? "font-bold text-gold-600 text-base" : "font-medium text-forest-950"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
