import { useState } from "react";
import { X, TreePine, Wind, ShieldCheck, Info } from "lucide-react";
import { speciesApi } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useLanguage } from "../lib/LanguageContext";

export default function SpeciesDetailModal({ isOpen, onClose }) {
  const { t, lang } = useLanguage();
  const { data: speciesList, loading } = useApi(() => speciesApi.list());
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  if (!isOpen) return null;

  const current = selectedSpecies || (speciesList && speciesList[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-forest-900 border border-cream-200 dark:border-forest-700/60 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-100 dark:border-forest-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sage-500/10 dark:bg-sage-400/20 text-sage-600 dark:text-sage-300 rounded-xl">
              <TreePine size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-forest-950 dark:text-cream-50">
                {lang === "en" ? "Tree Species Catalog" : "Katalog & Detail Jenis Pohon"}
              </h3>
              <p className="text-xs text-forest-700/60 dark:text-cream-50/60">
                {lang === "en" ? "Spesifikasi teknis & densitas serapan karbon" : "Spesifikasi teknis & densitas serapan karbon kayu"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-forest-700/40 hover:text-forest-900 dark:text-cream-50/40 dark:hover:text-cream-50 rounded-full hover:bg-cream-100 dark:hover:bg-forest-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-forest-700/50 dark:text-cream-50/50">
            {lang === "en" ? "Loading species list..." : "Memuat data jenis pohon..."}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* List Sidebar */}
            <div className="md:col-span-5 space-y-2 max-h-64 md:max-h-80 overflow-y-auto pr-1">
              {(speciesList || []).map((sp) => {
                const name = sp.name || sp;
                const active = (current?.name || current) === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedSpecies(sp)}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      active
                        ? "bg-forest-900 text-gold-400 border-forest-800 shadow-sm dark:bg-forest-800 dark:border-forest-700"
                        : "bg-cream-50 text-forest-800 border-cream-100 hover:bg-cream-100 dark:bg-forest-950/40 dark:text-cream-100 dark:border-forest-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TreePine size={14} className={active ? "text-gold-400" : "text-sage-600"} />
                      <span>{name}</span>
                    </div>
                    <span className="text-[10px] opacity-70 font-mono">ρ {sp.density_rho || sp.densityRho || 0.6}</span>
                  </button>
                );
              })}
            </div>

            {/* Detail View */}
            <div className="md:col-span-7 bg-cream-50/80 dark:bg-forest-950/60 rounded-2xl p-5 border border-cream-100 dark:border-forest-800 flex flex-col justify-between">
              {current ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sage-600 dark:text-sage-400">
                      Spesifikasi Kayu
                    </span>
                    <h4 className="text-xl font-bold text-forest-950 dark:text-cream-50">
                      {current.name || current}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-forest-900 p-3 rounded-xl border border-cream-200 dark:border-forest-800">
                      <span className="text-[10px] text-forest-700/60 dark:text-cream-50/60 block mb-1">
                        Densitas Kayu (ρ)
                      </span>
                      <span className="text-base font-bold font-mono text-forest-900 dark:text-gold-400">
                        {current.density_rho || current.densityRho || 0.6} g/cm³
                      </span>
                    </div>

                    <div className="bg-white dark:bg-forest-900 p-3 rounded-xl border border-cream-200 dark:border-forest-800">
                      <span className="text-[10px] text-forest-700/60 dark:text-cream-50/60 block mb-1">
                        Potensi CO₂ (avg)
                      </span>
                      <span className="text-base font-bold text-sage-600 dark:text-sage-400">
                        High Sequestration
                      </span>
                    </div>
                  </div>

                  <div className="bg-sage-50 dark:bg-forest-900/80 p-3 rounded-xl border border-sage-200/50 dark:border-forest-700 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sage-700 dark:text-sage-300 font-semibold">
                      <Wind size={14} />
                      <span>{lang === "en" ? "Allometric Biomass Formula" : "Formula Biomassa Alometrik"}</span>
                    </div>
                    <p className="text-[11px] text-forest-700/70 dark:text-cream-50/70 font-mono">
                      AGB = 0.0673 × (ρ × DBH² × H)^0.976
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-forest-700/50">Pilih jenis pohon di samping</div>
              )}

              <button
                onClick={onClose}
                className="w-full mt-4 py-2.5 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
