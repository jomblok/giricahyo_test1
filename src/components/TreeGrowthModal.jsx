// src/components/TreeGrowthModal.jsx — pembungkus modal untuk TreeGrowthChart.
//
// Grafiknya sendiri dibuat sebagai panel yang bisa dilipat, karena di dasbor
// buyer ia duduk di dalam kartu pohon. Di tabel pohon tidak ada tempat untuk
// panel seperti itu, jadi di sana ia dibuka sebagai modal — komponen grafik
// yang sama persis, cuma wadahnya berbeda.

import { X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { ModalPortal } from "./ui/ModalPortal";
import TreeGrowthChart from "./TreeGrowthChart";

export default function TreeGrowthModal({ treeId, onClose }) {
  const panelRef = useModalBehavior(true, onClose);
  const { t } = useLanguage();

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-md gjr-overlay-in">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${t("growth_history")} ${treeId}`}
          className="my-8 w-full max-w-lg overflow-hidden rounded-3xl bg-surface text-ink shadow-2xl gjr-panel-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line p-5">
            <div className="min-w-0">
              <h2 className="gjr-display text-lg font-bold text-ink">{t("growth_history")}</h2>
              <p className="mt-0.5 font-mono-id text-xs text-ink-muted">{treeId}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="shrink-0 rounded-xl p-2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {/* defaultOpen: di modal tidak masuk akal menyembunyikan satu-satunya
                isi di balik panel lipat \u2014 pengguna sudah menyatakan niatnya
                dengan membuka modal ini. */}
            <TreeGrowthChart treeId={treeId} defaultOpen />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
