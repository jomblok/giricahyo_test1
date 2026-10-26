// src/components/IncomeFormModal.jsx
//
// Tambah / ubah satu baris Dana Masuk carbon fund yang dicatat manual oleh
// admin (mis. Donor, CSR, ESG Fund langsung — di luar sertifikat). Baris yang
// dibuat otomatis dari sertifikat (tree_adoption_id terisi) tidak pernah
// dibuka lewat modal ini — ditolak di backend, dan di UI tombolnya memang
// tidak ditampilkan untuk baris seperti itu (lihat CarbonFundSection.jsx).

import { useState } from "react";
import { Wallet, AlertCircle, X } from "lucide-react";
import { useToast } from "../lib/ToastContext";
import { useLanguage } from "../lib/LanguageContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { carbonFundApi } from "../lib/api";
import { IconButton } from "./ui";
import { ModalPortal } from './ui/ModalPortal';
import DateField from "./ui/DateField";
import { FormStep } from "./ui";

export default function IncomeFormModal({ income, onClose, onSuccess }) {
  const { t } = useLanguage();
  const toast = useToast();
  const panelRef = useModalBehavior(true, onClose);
  const isEdit = Boolean(income);

  const [date, setDate] = useState(income?.date ?? new Date().toISOString().split("T")[0]);
  const [source, setSource] = useState(income?.source ?? "");
  const [qty, setQty] = useState(income?.qty ?? 1);
  const [unitPrice, setUnitPrice] = useState(income?.unit_price ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!date || !source.trim() || !qty || unitPrice === "") {
      setError(t("toast_failed") + ".");
      return;
    }
    setLoading(true);
    try {
      const payload = { date, source: source.trim(), qty: Number(qty), unit_price: Number(unitPrice) };
      if (isEdit) {
        await carbonFundApi.updateIncome(income.id, payload);
        toast.success(t("toast_income_updated"));
      } else {
        await carbonFundApi.addIncome(payload);
        toast.success(t("toast_income_added"));
      }
      onSuccess?.();
    } catch (e2) {
      setError(e2.message || t("toast_failed"));
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full text-sm bg-surface-sub border border-line rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 text-ink";

  return (
    <ModalPortal onClose={onClose}>
      <div className="gjr-overlay-in fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div ref={panelRef} className="gjr-panel-in bg-surface rounded-3xl max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-forest-900 text-cream-50 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={17} className="text-warn" />
              <span className="font-semibold text-sm">{isEdit ? t("edit_income") : t("add_income")}</span>
            </div>
            <IconButton icon={X} label={t("close")} onClick={onClose} className="text-cream-50/60 hover:text-cream-50" />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Sumber lebih dulu, baru tanggal — dulu terbalik. Yang pertama
                diketahui petugas saat mencatat dana masuk adalah dananya dari
                mana; tanggalnya menyusul dan hampir selalu hari ini (kolomnya
                pun sudah terisi otomatis). Menaruh tanggal di depan berarti
                meminta hal yang paling tidak perlu dipikirkan lebih dulu. */}
            <FormStep n={1} label={t("source")} wajib>
              <input type="text" placeholder="Donor, CSR, ESG Fund, Carbon Tourism..." value={source}
                onChange={(e) => setSource(e.target.value)} maxLength={120} className={inputCls} />
            </FormStep>

            <FormStep n={2} label={t("date")}>
              <DateField value={date} onChange={(e) => setDate(e.target.value)} />
            </FormStep>

            <FormStep n={3} label={t("amount_step_label")}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-ink-faint mb-1">{t("qty")}</label>
                  <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-faint mb-1">{t("unit_price_label")}</label>
                  <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputCls} />
                </div>
              </div>
            </FormStep>

            {error && (
              <div className="flex items-center gap-2 bg-bad-soft text-bad text-xs rounded-lg p-3">
                <AlertCircle size={13} className="shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors">
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? "Menyimpan..." : t("save")}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
