import { useModalBehavior } from "../lib/useModalBehavior";
import { useToast } from "../lib/ToastContext";
import { useState, useRef } from "react";
import { X, Camera, ImagePlus, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { ModalPortal } from './ui/ModalPortal';
import DateField from "./ui/DateField";
// Diangkat ke lib bersama: tiga tempat sekarang mengirim foto.
import { compressImage, isMobileDevice } from "../lib/compressImage";

export default function AddTreePhotoModal({ isOpen, onClose, treeId, onPhotoAdded }) {
  const panelRef = useModalBehavior(isOpen, onClose);
  const toast = useToast();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isMobile = isMobileDevice();

  const [previewUrl, setPreviewUrl] = useState(null);  // data URL untuk preview
  const [base64Data, setBase64Data] = useState(null);  // base64 untuk disimpan
  const [caption, setCaption] = useState("");
  const [dbhCm, setDbhCm] = useState("");
  const [heightM, setHeightM] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Kompres foto lalu jadikan base64
  async function handleFileChange(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "en" ? "Please select an image file." : "Harap pilih file berupa gambar.");
      return;
    }
    setError("");
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
      setBase64Data(compressed);
    } catch {
      setError(lang === "en" ? "Failed to process image." : "Gagal memproses gambar.");
    } finally {
      setCompressing(false);
    }
  }

  function handleReset() {
    setPreviewUrl(null);
    setBase64Data(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!base64Data) {
      setError(lang === "en" ? "Please take or choose a photo first." : "Harap ambil atau pilih foto terlebih dahulu.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      await treeApi.addPhoto(treeId, {
        photo_url: base64Data,
        caption: caption.trim() || "Update foto pertumbuhan pohon",
        measurement_date: date,
        dbh_cm: dbhCm ? Number(dbhCm) : undefined,
        height_m: heightM ? Number(heightM) : undefined,
      });

      toast.success(`${t("toast_photo_saved")} — ${treeId}`);
      if (onPhotoAdded) onPhotoAdded();
      onClose();
    } catch (err) {
      // Tidak ada sinyal: foto TERSIMPAN di ponsel, bukan gagal.
      if (err?.tertunda) {
        toast.success(t("saved_offline"));
        if (onPhotoAdded) onPhotoAdded();
        onClose();
        return;
      }
      setError(err.message || "Gagal menyimpan foto.");
      toast.error(`${t("toast_failed")}: ${err.message ?? ""}`);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setPreviewUrl(null);
    setBase64Data(null);
    setCaption("");
    setDbhCm("");
    setHeightM("");
    setError("");
    onClose();
  }

  return (
    <ModalPortal onClose={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm gjr-overlay-in">
        <div className="bg-surface border border-line rounded-3xl w-full max-w-md shadow-2xl transition-colors max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line sticky top-0 bg-surface z-10 rounded-t-3xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-soft text-brand rounded-xl">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">
                  {lang === "en" ? "Add Growth Photo" : "Tambah Foto Perkembangan"}
                </h3>
                <p className="text-[11px] text-ink-muted font-mono">{treeId}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label={t("close")}
              title={t("close")}
              className="p-1.5 text-ink-faint hover:text-ink transition-colors rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-bad-soft text-bad rounded-xl flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* === AREA FOTO (Preview / Tombol Ambil Foto) === */}
            {compressing ? (
              /* Sedang mengompresi */
              <div className="flex flex-col items-center justify-center gap-3 py-14 bg-brand-soft rounded-2xl border-2 border-dashed border-brand/40">
                <Loader2 size={30} className="text-brand animate-spin" />
                <p className="text-sm font-semibold text-ink">
                  {lang === "en" ? "Compressing photo…" : "Mengompresi foto…"}
                </p>
                <p className="text-[11px] text-ink-faint">
                  {lang === "en" ? "Reducing file size for upload" : "Mengecilkan ukuran file agar cepat tersimpan"}
                </p>
              </div>
            ) : !previewUrl ? (
              <div className="space-y-2">
                {/* Tombol kamera — hanya tampil di perangkat mobile */}
                {isMobile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 py-10 bg-brand-soft border-2 border-dashed border-brand/40 rounded-2xl hover:brightness-95 transition-colors group"
                    >
                      <div className="p-4 bg-brand-soft rounded-2xl group-hover:brightness-95 transition-colors">
                        <Camera size={32} className="text-brand" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-ink flex items-center justify-center gap-1.5">
                          <Camera size={14} className="text-brand shrink-0" />
                          {lang === "en" ? "Take Photo" : "Ambil Foto dari Kamera"}
                        </p>
                        <p className="text-ink-faint text-[11px] mt-1">
                          {lang === "en" ? "Opens camera directly" : "Klik untuk membuka kamera HP"}
                        </p>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-2 text-ink-faint">
                      <div className="flex-1 h-px bg-line" />
                      <span className="text-[11px] font-medium">{lang === "en" ? "or" : "atau"}</span>
                      <div className="flex-1 h-px bg-line" />
                    </div>
                  </>
                ) : null}

                {/* Tombol pilih dari galeri — tampil di semua perangkat */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex flex-col items-center justify-center gap-3 ${
                    isMobile
                      ? "py-3 bg-surface-sub border border-line rounded-xl hover:bg-surface-hover"
                      : "py-10 bg-brand-soft border-2 border-dashed border-brand/40 rounded-2xl hover:brightness-95 group"
                  } transition-colors text-ink font-semibold text-xs`}
                >
                  {!isMobile && (
                    <div className="p-4 bg-brand-soft rounded-2xl group-hover:brightness-95 transition-colors">
                      <ImagePlus size={32} className="text-brand" />
                    </div>
                  )}
                  <div className={`flex items-center gap-2 ${!isMobile ? "flex-col text-center" : ""}`}>
                    {isMobile && <ImagePlus size={16} />}
                    <span>
                      {isMobile
                        ? (lang === "en" ? "Choose from Gallery / File" : "Pilih dari Galeri / File")
                        : (lang === "en" ? "Choose Photo from File" : "Pilih Foto dari File")
                      }
                    </span>
                    {!isMobile && (
                      <p className="text-ink-faint text-[11px] mt-1 font-normal">
                        {lang === "en" ? "Browse files from your computer" : "Pilih dari file di komputer Anda"}
                      </p>
                    )}
                  </div>
                </button>

                {/* Hidden inputs */}
                {isMobile && (
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="camera"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </div>
            ) : (
              /* Preview Foto */
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-line shadow-sm group">
                  <img
                    src={previewUrl}
                    alt="Preview foto"
                    className="w-full max-h-56 object-cover"
                  />
                  {/* Tombol ganti foto */}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-2 bg-forest-950/70 hover:bg-forest-950/90 text-cream-50 rounded-xl backdrop-blur-sm transition-colors flex items-center gap-1.5 text-[11px] font-semibold"
                  >
                    <RotateCcw size={13} />
                    <span>{lang === "en" ? "Retake" : "Ganti Foto"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-brand font-semibold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0" />
                  {lang === "en" ? "Photo ready to be saved" : "Foto siap disimpan"}
                </p>
              </div>
            )}

            {/* Catatan */}
            <div>
              <label className="block font-semibold text-ink-muted mb-1">
                {lang === "en" ? "Caption / Notes (optional)" : "Catatan Perkembangan (opsional)"}
              </label>
              <input
                type="text"
                placeholder={lang === "en" ? "e.g: Tree looks healthy after fertilizing" : "Contoh: Pohon subur setelah pemupukan minggu lalu"}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-surface-sub border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block font-semibold text-ink-muted mb-1">
                {lang === "en" ? "Photo Date" : "Tanggal Pengambilan Foto"}
              </label>
              <DateField value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* DBH & Tinggi (opsional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-ink-muted mb-1">
                  DBH Baru (cm) <span className="font-normal opacity-50">opsional</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="14.5"
                  value={dbhCm}
                  onChange={(e) => setDbhCm(e.target.value)}
                  className="w-full bg-surface-sub border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-muted mb-1">
                  Tinggi Baru (m) <span className="font-normal opacity-50">opsional</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="7.1"
                  value={heightM}
                  onChange={(e) => setHeightM(e.target.value)}
                  className="w-full bg-surface-sub border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 bg-surface-sub text-ink font-semibold rounded-xl hover:bg-surface-hover transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={saving || !base64Data}
                className="flex-1 py-3 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {saving ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Save Photo" : "Simpan Foto")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
