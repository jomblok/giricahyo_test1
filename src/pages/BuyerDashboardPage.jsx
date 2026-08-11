import { useState } from "react";
import { Leaf, Wind, Award, TreeDeciduous, Globe, FileCheck, Camera, Eye, ImageOff } from "lucide-react";
import Header from "../components/Header";
import CertificateModal from "../components/CertificateModal";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { formatNumber, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";

const healthBadge = {
  baik:   "bg-sage-100 dark:bg-sage-950/60 text-sage-600 dark:text-sage-400",
  sedang: "bg-gold-100 dark:bg-gold-950/60 text-gold-600 dark:text-gold-400",
  buruk:  "bg-clay-100 dark:bg-clay-950/60 text-clay-700 dark:text-clay-400",
};

function ImpactCard({ icon: Icon, label, value, sub, accent = "sage" }) {
  const accents = {
    sage: "text-sage-600 dark:text-sage-400 bg-sage-100 dark:bg-sage-950/60",
    gold: "text-gold-600 dark:text-gold-400 bg-gold-100 dark:bg-gold-950/60",
    forest: "text-forest-700 dark:text-cream-100 bg-cream-100 dark:bg-forest-800",
  };
  return (
    <div className="bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm flex items-start gap-4 transition-colors">
      <div className={`rounded-xl p-2.5 shrink-0 ${accents[accent]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-forest-700/50 dark:text-cream-50/50 font-semibold mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-forest-950 dark:text-cream-50 tabular">{value}</p>
        {sub && <p className="text-xs text-forest-700/50 dark:text-cream-50/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Komponen Timeline Foto Pohon
function PhotoTimeline({ photos = [] }) {
  const [expanded, setExpanded] = useState(null);

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 text-[11px] text-forest-700/50 dark:text-cream-50/50 italic">
        <ImageOff size={14} className="shrink-0" />
        <span>Belum ada foto perkembangan pohon yang diunggah.</span>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Thumbnail row (scrollable) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className={`shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all ${
              expanded === idx
                ? "border-sage-500 shadow-md scale-105"
                : "border-cream-200 dark:border-forest-700 hover:border-sage-400 hover:scale-105"
            }`}
          >
            <img
              src={p.photo_url}
              alt={p.caption || "Foto pohon"}
              className="w-full h-14 object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200";
              }}
            />
            <div className="px-1.5 py-1 bg-white dark:bg-forest-900">
              <p className="text-[9px] text-forest-700/60 dark:text-cream-50/60 truncate">{p.measurement_date}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Expanded View */}
      {expanded !== null && photos[expanded] && (
        <div className="bg-white dark:bg-forest-900 border border-cream-200 dark:border-forest-700 rounded-2xl p-4 space-y-3 shadow-sm animate-in slide-in-from-top-1 duration-200">
          <img
            src={photos[expanded].photo_url}
            alt={photos[expanded].caption || "Foto pohon"}
            className="w-full max-h-64 object-cover rounded-xl"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600";
            }}
          />
          <div>
            <p className="font-semibold text-sm text-forest-950 dark:text-cream-50">
              {photos[expanded].caption || "Foto Perkembangan Pohon"}
            </p>
            <div className="flex gap-4 mt-1 text-xs text-forest-700/60 dark:text-cream-50/60">
              <span>📅 {photos[expanded].measurement_date}</span>
              {photos[expanded].dbh_cm && <span>📏 DBH: {photos[expanded].dbh_cm} cm</span>}
              {photos[expanded].height_m && <span>🌳 Tinggi: {photos[expanded].height_m} m</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";

  const [selectedAdoption, setSelectedAdoption] = useState(null);

  const { data, loading, error } = useApi(() => buyerApi.get(buyerId), [buyerId]);

  const adoptions = data?.adoptions ?? [];
  const totalCo2 = data?.total_co2_kg ?? 0;

  if (!loading && !error && adoptions.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-forest-950 transition-colors">
        <Header />
        <main className="max-w-[900px] mx-auto px-4 md:px-8 py-16 flex flex-col items-center text-center gap-4">
          <div className="bg-cream-100 dark:bg-forest-900 rounded-2xl p-5">
            <TreeDeciduous size={40} className="text-forest-700/30 dark:text-cream-50/30 mx-auto" />
          </div>
          <h2 className="font-bold text-forest-950 dark:text-cream-50 text-lg">Belum Ada Pohon yang Didukung</h2>
          <p className="text-sm text-forest-700/60 dark:text-cream-50/60 max-w-xs">
            Hubungi Koperasi Giricahyo untuk memilih paket dukungan.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-forest-950 text-forest-950 dark:text-cream-50 transition-colors">
      <Header />
      <main className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 space-y-8">

        {/* Welcome */}
        <div className="flex items-center gap-3">
          <div className="bg-gold-100 dark:bg-gold-950/60 rounded-xl p-2.5">
            <Leaf size={20} className="text-gold-600 dark:text-gold-400" />
          </div>
          <div>
            <h2 className="font-bold text-forest-950 dark:text-cream-50 text-lg">
              {lang === "en" ? `Hello, ${user?.name}` : `Halo, ${user?.name}`}
            </h2>
            <p className="text-xs text-forest-700/55 dark:text-cream-50/55">
              {lang === "en"
                ? "Thank you for supporting Giricahyo community carbon sequestration."
                : "Terima kasih telah mendukung program karbon komunitas Giricahyo."}
            </p>
          </div>
        </div>

        {/* Impact Cards */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 dark:text-cream-50/45 mb-3 px-1">
            {lang === "en" ? "Your Support Impact" : "Dampak Dukungan Anda"}
          </h2>
          <ApiState
            loading={loading}
            error={error}
            skeleton={
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-cream-100 dark:bg-forest-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ImpactCard
                icon={TreeDeciduous}
                label={lang === "en" ? "Trees Supported" : "Pohon Didukung"}
                value={adoptions.length}
                sub={lang === "en" ? "Active carbon trees" : "pohon karbon aktif"}
                accent="sage"
              />
              <ImpactCard
                icon={Wind}
                label={lang === "en" ? "Total CO₂ Absorbed" : "Total CO₂ Diserap"}
                value={`${formatNumber(totalCo2, 1)} kg`}
                sub={lang === "en" ? "Absorbed from your trees" : "CO₂ terserap dari pohon Anda"}
                accent="forest"
              />
              <ImpactCard
                icon={Award}
                label={lang === "en" ? "Active Certificates" : "Sertifikat Aktif"}
                value={adoptions.length}
                sub={lang === "en" ? "Verified carbon credits" : "karbon kredit terverifikasi"}
                accent="gold"
              />
            </div>
          </ApiState>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Tree List with Photo Timeline */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 dark:text-cream-50/45 px-1">
              {lang === "en" ? "Trees You Support & Growth Timeline" : "Pohon yang Anda Dukung & Perkembangannya"}
            </h2>

            <ApiState loading={loading} error={error}>
              <div className="space-y-4">
                {adoptions.map((a) => {
                  const tree = a.tree;
                  const farmer = a.farmer;
                  const hs = tree?.health_status ?? tree?.healthStatus;
                  const photos = a.photos ?? tree?.photos ?? [];

                  return (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm space-y-4 transition-colors"
                    >
                      {/* Tree Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono-id text-gold-600 dark:text-gold-400 text-xs font-bold mb-1">{a.tree_id}</p>
                          <p className="font-bold text-forest-950 dark:text-cream-50 text-base">{tree?.species ?? "—"}</p>
                          <p className="text-xs text-forest-700/55 dark:text-cream-50/55 mt-0.5">
                            {lang === "en" ? "Farmer" : "Petani"}: {farmer?.name ?? "—"} · {farmer?.group_coop}
                          </p>
                        </div>
                        {hs && (
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 ${healthBadge[hs]}`}>
                            {hs}
                          </span>
                        )}
                      </div>

                      {/* Tree Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          ["CO₂ Diserap", `${tree ? formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 1) : "—"} kg`],
                          [lang === "en" ? "Adoption" : "Adopsi", a.adopted_date ? formatDate(a.adopted_date) : "—"],
                          [lang === "en" ? "Package" : "Paket", a.package_name?.replace("Tree Adoption — ", "") ?? "—"],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="bg-cream-50 dark:bg-forest-950 rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-forest-700/45 dark:text-cream-50/45 mb-1">{lbl}</p>
                            <p className="text-xs font-bold text-forest-950 dark:text-cream-50 leading-tight">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* === FOTO PERKEMBANGAN POHON (Bisa Dilihat Buyer) === */}
                      <div className="bg-sage-50/60 dark:bg-forest-950/60 rounded-2xl p-4 border border-sage-100 dark:border-forest-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera size={15} className="text-sage-600 dark:text-sage-400 shrink-0" />
                          <h4 className="font-semibold text-sm text-forest-950 dark:text-cream-50">
                            {lang === "en" ? "Tree Growth Photo Timeline" : "Timeline Foto Perkembangan Pohon"}
                          </h4>
                          {photos.length > 0 && (
                            <span className="ml-auto text-[11px] bg-sage-500/20 text-sage-700 dark:text-sage-300 px-2 py-0.5 rounded-full font-semibold">
                              {photos.length} foto
                            </span>
                          )}
                        </div>
                        <PhotoTimeline photos={photos} />
                      </div>

                      {/* Certificate */}
                      {a.certificate_no && (
                        <div className="flex items-center justify-between bg-gold-50 dark:bg-forest-950 border border-gold-200 dark:border-forest-800 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <FileCheck size={16} className="text-gold-600 dark:text-gold-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-gold-700 dark:text-gold-400 uppercase tracking-wide font-semibold">
                                {lang === "en" ? "Official Certificate" : "Sertifikat Resmi"}
                              </p>
                              <p className="font-mono-id text-xs font-bold text-forest-950 dark:text-cream-50">{a.certificate_no}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedAdoption(a)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
                          >
                            <Eye size={13} />
                            <span>{t("view_certificate")}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ApiState>
          </div>

          {/* Environmental Impact */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 dark:text-cream-50/45 px-1">
              {lang === "en" ? "Environmental Equivalents" : "Kontribusi Lingkungan"}
            </h2>
            <div className="bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={17} className="text-sage-600 dark:text-sage-400" />
                <h3 className="font-semibold text-forest-950 dark:text-cream-50 text-sm">
                  {lang === "en" ? "Real World CO₂ Impact" : "Dampak Nyata CO₂ yang Diserap"}
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "✈️", label: "Setara penerbangan Jakarta–Bali (PP)", unit: "perjalanan", val: totalCo2 / 120 },
                  { icon: "🏍️", label: "Setara emisi kendaraan bermotor selama", unit: "bulan", val: totalCo2 / 30 },
                  { icon: "💡", label: "Setara listrik rumah tangga selama", unit: "bulan", val: totalCo2 / 50 },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3 bg-cream-50 dark:bg-forest-950 rounded-xl px-4 py-3">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-xs text-forest-700/70 dark:text-cream-50/70">{f.label}</p>
                      <p className="text-sm font-bold text-forest-950 dark:text-cream-50 tabular mt-0.5">
                        {formatNumber(f.val, 1)} {f.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center text-[11px] text-forest-700/40 dark:text-cream-50/40 pt-4 pb-2">
          Giricahyo Carbon Dashboard · Terima kasih atas dukungan Anda
        </footer>
      </main>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={Boolean(selectedAdoption)}
        onClose={() => setSelectedAdoption(null)}
        adoption={selectedAdoption}
      />
    </div>
  );
}
