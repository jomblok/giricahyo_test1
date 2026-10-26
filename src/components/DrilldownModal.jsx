// src/components/DrilldownModal.jsx
//
// Panel yang muncul saat batang chart atau potongan pie diklik, berisi baris
// data di balik angka itu. Sebelumnya hanya kartu kesehatan yang punya
// penelusuran seperti ini; chart tren dan pie dana tidak bisa diklik sama sekali.

import { X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { IconButton } from "./ui";
import { ModalPortal } from './ui/ModalPortal';

export default function DrilldownModal({ title, subtitle, icon: Icon, onClose, children }) {
  const { t } = useLanguage();

  return (
    <ModalPortal onClose={onClose}>
      <div className="gjr-overlay-in fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
        <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
        <div className="gjr-panel-in relative bg-surface border border-line rounded-3xl w-full max-w-3xl max-h-[82vh] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between gap-3 p-5 border-b border-line shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {Icon && <Icon size={18} className="text-brand shrink-0" />}
              <div className="min-w-0">
                <h3 className="font-bold text-ink truncate">{title}</h3>
                {subtitle && <p className="text-[11px] text-ink-faint truncate">{subtitle}</p>}
              </div>
            </div>
            <IconButton icon={X} label={t("close")} onClick={onClose} variant="secondary" autoFocus />
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
