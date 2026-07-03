import { Leaf, Wind, Award, TreeDeciduous, Globe, FileCheck } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { formatNumber, formatDate } from "../lib/format";

const healthBadge = { baik: "bg-sage-100 text-sage-600", sedang: "bg-gold-100 text-gold-600", buruk: "bg-clay-100 text-clay-700" };

function ImpactCard({ icon: Icon, label, value, sub, accent = "sage" }) {
  const accents = { sage: "text-sage-600 bg-sage-100", gold: "text-gold-600 bg-gold-100", forest: "text-forest-700 bg-cream-100" };
  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`rounded-xl p-2.5 shrink-0 ${accents[accent]}`}><Icon size={20} /></div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-forest-700/50 font-semibold mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-forest-950 tabular">{value}</p>
        {sub && <p className="text-xs text-forest-700/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";

  const { data, loading, error } = useApi(() => buyerApi.get(buyerId), [buyerId]);

  const adoptions = data?.adoptions ?? [];
  const totalCo2  = data?.total_co2_kg ?? 0;

  if (!loading && !error && adoptions.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-[900px] mx-auto px-4 md:px-8 py-16 flex flex-col items-center text-center gap-4">
          <div className="bg-cream-100 rounded-2xl p-5"><TreeDeciduous size={40} className="text-forest-700/30 mx-auto" /></div>
          <h2 className="font-bold text-forest-950 text-lg">Belum Ada Pohon yang Didukung</h2>
          <p className="text-sm text-forest-700/60 max-w-xs">Hubungi Koperasi Giricahyo untuk memilih paket dukungan.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 space-y-8">

        <div className="flex items-center gap-3">
          <div className="bg-gold-100 rounded-xl p-2.5"><Leaf size={20} className="text-gold-600" /></div>
          <div>
            <h2 className="font-bold text-forest-950 text-lg">Halo, {user?.name}</h2>
            <p className="text-xs text-forest-700/55">Terima kasih telah mendukung program karbon komunitas Giricahyo.</p>
          </div>
        </div>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 mb-3 px-1">Dampak Dukungan Anda</h2>
          <ApiState loading={loading} error={error}
            skeleton={<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[...Array(3)].map((_,i)=><div key={i} className="h-28 bg-cream-100 rounded-2xl animate-pulse"/>)}</div>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ImpactCard icon={TreeDeciduous} label="Pohon Didukung"   value={adoptions.length}                    sub="pohon karbon aktif"          accent="sage" />
              <ImpactCard icon={Wind}          label="Total CO₂ Diserap" value={`${formatNumber(totalCo2, 1)} kg`} sub="CO₂ terserap dari pohon Anda" accent="forest" />
              <ImpactCard icon={Award}         label="Sertifikat Aktif"  value={adoptions.length}                   sub="karbon kredit terverifikasi"  accent="gold" />
            </div>
          </ApiState>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 mb-3 px-1">Pohon yang Anda Dukung</h2>
            <ApiState loading={loading} error={error}>
              <div className="space-y-3">
                {adoptions.map((a) => {
                  const tree   = a.tree;
                  const farmer = a.farmer;
                  const hs     = tree?.health_status ?? tree?.healthStatus;
                  return (
                    <div key={a.id} className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-mono-id text-gold-600 text-xs mb-1">{a.tree_id}</p>
                          <p className="font-bold text-forest-950">{tree?.species ?? "—"}</p>
                          <p className="text-xs text-forest-700/55 mt-0.5">Petani: {farmer?.name ?? "—"} · {farmer?.group_coop}</p>
                        </div>
                        {hs && <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${healthBadge[hs]}`}>{hs}</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          ["CO₂ Diserap",   `${tree ? formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 1) : "—"} kg`],
                          ["Adopsi",        a.adopted_date ? formatDate(a.adopted_date) : "—"],
                          ["Paket",         a.package_name?.replace("Tree Adoption — ","") ?? "—"],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-cream-50 rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-forest-700/45 mb-1">{lbl}</p>
                            <p className="text-xs font-bold text-forest-950 leading-tight">{val}</p>
                          </div>
                        ))}
                      </div>
                      {a.certificate_no && (
                        <div className="mt-3 flex items-center gap-2 bg-gold-100/50 border border-gold-100 rounded-xl px-3 py-2">
                          <FileCheck size={14} className="text-gold-600 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gold-600/70 uppercase tracking-wide">No. Sertifikat</p>
                            <p className="font-mono-id text-xs font-semibold text-gold-700">{a.certificate_no}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ApiState>
          </div>

          {/* Dampak ekuivalen */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 mb-3 px-1">Kontribusi Lingkungan</h2>
            <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={17} className="text-sage-600" />
                <h3 className="font-semibold text-forest-950 text-sm">Dampak Nyata CO₂ yang Diserap</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "✈️", label: "Setara penerbangan Jakarta–Bali (PP)", unit: "perjalanan", val: totalCo2 / 120 },
                  { icon: "🏍️", label: "Setara emisi kendaraan bermotor selama", unit: "bulan",     val: totalCo2 / 30 },
                  { icon: "💡", label: "Setara listrik rumah tangga selama",    unit: "bulan",     val: totalCo2 / 50 },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 bg-cream-50 rounded-xl px-4 py-3">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-xs text-forest-700/70">{f.label}</p>
                      <p className="text-sm font-bold text-forest-950 tabular mt-0.5">{formatNumber(f.val, 1)} {f.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-[11px] text-forest-700/40 pt-4 pb-2">
          Giricahyo Carbon Dashboard · Terima kasih atas dukungan Anda
        </footer>
      </main>
    </div>
  );
}
