// src/components/ReportConditionModal.jsx
//
// Petani melaporkan kondisi pohonnya dari lapangan.
//
// Ini bagian "Reporting" dari MRV yang sebelumnya tidak ada sama sekali: dari
// 36 endpoint, petani hanya punya satu aksi tulis (unggah foto). Petani yang
// melihat pohonnya tumbang harus menelepon admin.
//
// Yang dikirim dari sini TIDAK langsung mengubah data resmi — ia masuk antrean
// verifikasi admin. Kalimat penjelasnya sengaja ditampilkan di modal, bukan
// disembunyikan: petani perlu tahu kenapa laporannya belum langsung terlihat,
// kalau tidak mereka akan mengirim ulang laporan yang sama.

import { useState } from "react";
import { X, Camera, ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import { reportApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { compressImage, isMobileDevice } from "../lib/compressImage";
import { ModalPortal } from "./ui/ModalPortal";
import { Button, Select, HealthBadge, FormStep } from "./ui";

const KONDISI = ["baik", "sedang", "buruk"];

export default function ReportConditionModal({ isOpen, onClose, tree, onSent }) {
  const panelRef = useModalBehavior(isOpen, onClose);
  const { t } = useLanguage();
  const toast = useToast();

  const [kondisi, setKondisi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [foto, setFoto] = useState(null);
  const [memproses, setMemproses] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");

  if (!isOpen || !tree) return null;

  // TreeTable menormalkan barisnya ke camelCase (healthStatus, lastUpdated)
  // sebelum merender, sedangkan API mengirim snake_case. Modal ini dipanggil
  // dari keduanya, jadi kedua bentuk diterima — tanpa ini badge kondisinya
  // terbaca "health_undefined" dan tanggalnya kosong.
  const kondisiSekarang = tree.health_status ?? tree.healthStatus;
  const terakhirDiperbarui = tree.last_updated ?? tree.lastUpdated;

  async function pilihFoto(file) {
    if (!file) return;
    setGalat("");
    setMemproses(true);
    try {
      setFoto(await compressImage(file));
    } catch {
      setGalat(t("photo_process_failed") || "Gagal memproses gambar.");
    } finally {
      setMemproses(false);
    }
  }

  async function kirim(e) {
    e.preventDefault();
    setGalat("");

    if (!kondisi) {
      setGalat(t("new_condition") + " — " + t("required_field"));
      return;
    }

    setMengirim(true);
    try {
      await reportApi.create({
        type: "kondisi",
        tree_id: tree.id,
        health_status: kondisi,
        note: catatan || null,
        photo_url: foto,
      });
      toast?.success?.(t("report_sent") || "Laporan terkirim.");
      onSent?.();
      onClose();
    } catch (err) {
      // Tidak ada sinyal: laporannya TERSIMPAN, bukan gagal. Membedakan dua
      // hal ini penting — petani yang membaca "gagal" akan mengukur ulang
      // besok, padahal kirimannya sudah menunggu di antrean.
      if (err?.tertunda) {
        toast?.success?.(t("saved_offline"));
        onSent?.();
        onClose();
        return;
      }
      // Pesan dari backend sudah berbahasa Indonesia dan menyebut apa yang
      // harus dilakukan — ditampilkan apa adanya, bukan diganti pesan umum.
      setGalat(err?.message || "Laporan gagal dikirim.");
    } finally {
      setMengirim(false);
    }
  }

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-md overflow-y-auto gjr-overlay-in">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("report_condition_for")}
          className="bg-surface text-ink rounded-3xl max-w-lg w-full shadow-2xl my-8 flex flex-col max-h-[88vh] overflow-hidden gjr-panel-in"
        >
          {/* kepala */}
          <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-line">
            <div className="min-w-0">
              <h2 className="gjr-display text-lg font-bold text-ink">{t("report_condition_for")}</h2>
              <p className="text-xs text-ink-muted mt-0.5 font-mono-id">{tree.id} · {tree.species}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="shrink-0 rounded-xl p-2 text-ink-faint hover:bg-surface-hover hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* isi — panel bukan wadah gulirnya (lihat DESIGN.md §5) */}
          <form onSubmit={kirim} className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
            <FormStep n={1} label={t("current_condition")}>
              <div className="flex items-center gap-2">
                <HealthBadge status={kondisiSekarang} label={t(`health_${kondisiSekarang}`)} />
                <span className="text-xs text-ink-faint">
                  {t("last_updated")}: {terakhirDiperbarui ?? "—"}
                </span>
              </div>
            </FormStep>

            <FormStep n={2} label={t("new_condition")}>
              <Select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value)}
                placeholder="— Pilih —"
                options={KONDISI
                  .filter((k) => k !== kondisiSekarang)
                  .map((k) => ({ value: k, label: t(`health_${k}`) }))}
              />
              {/* Kondisi yang sama dengan yang tercatat sengaja tidak ada di
                  daftar: backend menolaknya, dan menolak setelah pengguna
                  menekan Kirim lebih buruk daripada tidak menawarkannya. */}
            </FormStep>

            <FormStep n={3} label={t("report_note")}>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t("report_note_ph")}
                className="w-full rounded-2xl border border-line bg-surface-sub px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
              <p className="mt-1 text-[11px] text-ink-faint text-right tabular-nums">{catatan.length}/500</p>
            </FormStep>

            <FormStep n={4} label={t("report_photo")}>
              {foto ? (
                <div className="relative">
                  <img src={foto} alt="" className="w-full rounded-2xl border border-line" />
                  <button
                    type="button"
                    onClick={() => setFoto(null)}
                    className="absolute top-2 right-2 rounded-xl bg-forest-950/70 p-1.5 text-cream-50 hover:bg-forest-950"
                    aria-label={t("remove")}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {isMobileDevice() && (
                    <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-line-strong bg-surface-sub px-3 py-4 text-center text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors">
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                             onChange={(e) => pilihFoto(e.target.files?.[0])} />
                      <Camera size={18} className="mx-auto mb-1" />
                      {t("take_photo")}
                    </label>
                  )}
                  <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-line-strong bg-surface-sub px-3 py-4 text-center text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors">
                    <input type="file" accept="image/*" className="hidden"
                           onChange={(e) => pilihFoto(e.target.files?.[0])} />
                    <ImagePlus size={18} className="mx-auto mb-1" />
                    {t("choose_photo")}
                  </label>
                </div>
              )}
              {memproses && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Loader2 size={13} className="animate-spin" /> {t("processing")}
                </p>
              )}
            </FormStep>

            <div className="flex items-start gap-2.5 rounded-2xl bg-brand-soft px-3.5 py-3">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-brand-ink" />
              <p className="text-xs leading-relaxed text-brand-ink">{t("report_will_be_verified")}</p>
            </div>
          </form>

          {/* kaki */}
          <div className="shrink-0 border-t border-line p-5 space-y-3">
            {galat && (
              <p role="alert" className="text-sm text-bad">{galat}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" type="button" onClick={onClose}>{t("cancel")}</Button>
              <Button type="button" onClick={kirim} disabled={mengirim || memproses || !kondisi}>
                {mengirim ? <Loader2 size={15} className="animate-spin" /> : null}
                {t("send_report")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
