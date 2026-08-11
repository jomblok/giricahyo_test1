import { useState, useRef, useCallback } from "react";
import { X, Camera, ImagePlus, CheckCircle2, AlertCircle, RotateCcw, ZoomIn } from "lucide-react";
import { treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";

export default function AddTreePhotoModal({ isOpen, onClose, treeId, onPhotoAdded }) {
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);  // data URL untuk preview
  const [base64Data, setBase64Data] = useState(null);  // base64 untuk disimpan
  const [caption, setCaption] = useState("");
  const [dbhCm, setDbhCm] = useState("");
  const [heightM, setHeightM] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Konversi file foto ke base64
  function handleFileChange(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(lang === "en" ? "Please select an image file." : "Harap pilih file berupa gambar.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setBase64Data(e.target.result); // simpan full base64 data URL
    };
    reader.readAsDataURL(file);
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

      if (onPhotoAdded) onPhotoAdded();
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan foto.");
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-forest-900 border border-cream-200 dark:border-forest-700/60 rounded-3xl w-full max-w-md shadow-2xl transition-colors max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-cream-100 dark:border-forest-800 sticky top-0 bg-white dark:bg-forest-900 z-10 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sage-500/10 text-sage-600 dark:text-sage-300 rounded-xl">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-forest-950 dark:text-cream-50">
                {lang === "en" ? "Add Growth Photo" : "Tambah Foto Perkembangan"}
              </h3>
              <p className="text-[11px] text-forest-700/60 dark:text-cream-50/60 font-mono">{treeId}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-forest-700/40 hover:text-forest-900 dark:text-cream-50/40 dark:hover:text-cream-50 rounded-full"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-clay-100 dark:bg-clay-950/60 text-clay-700 dark:text-clay-300 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* === AREA FOTO (Preview / Tombol Ambil Foto) === */}
          {!previewUrl ? (
            <div className="space-y-2">
              {/* Tombol kamera (buka kamera HP langsung) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-10 bg-sage-50 dark:bg-forest-950 border-2 border-dashed border-sage-300 dark:border-sage-700 rounded-2xl hover:bg-sage-100 dark:hover:bg-forest-900 transition-colors group"
              >
                <div className="p-4 bg-sage-500/10 rounded-2xl group-hover:bg-sage-500/20 transition-colors">
                  <Camera size={32} className="text-sage-600 dark:text-sage-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-forest-950 dark:text-cream-50">
                    {lang === "en" ? "Take Photo" : "📷 Ambil Foto dari Kamera"}
                  </p>
                  <p className="text-forest-700/50 dark:text-cream-50/50 text-[11px] mt-1">
                    {lang === "en" ? "Opens camera on mobile" : "Klik untuk membuka kamera HP"}
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2 text-forest-700/40 dark:text-cream-50/30">
                <div className="flex-1 h-px bg-cream-200 dark:bg-forest-800" />
                <span className="text-[11px] font-medium">{lang === "en" ? "or" : "atau"}</span>
                <div className="flex-1 h-px bg-cream-200 dark:bg-forest-800" />
              </div>

              {/* Tombol pilih dari galeri */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cream-50 dark:bg-forest-950 border border-cream-200 dark:border-forest-800 rounded-xl hover:bg-cream-100 dark:hover:bg-forest-800 transition-colors text-forest-700 dark:text-cream-50 font-semibold text-xs"
              >
                <ImagePlus size={16} />
                {lang === "en" ? "Choose from Gallery / File" : "Pilih dari Galeri / File"}
              </button>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
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
              <div className="relative rounded-2xl overflow-hidden border border-cream-200 dark:border-forest-700 shadow-sm group">
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
              <p className="text-[11px] text-sage-600 dark:text-sage-400 font-semibold text-center">
                ✅ {lang === "en" ? "Photo ready to be saved" : "Foto siap disimpan"}
              </p>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block font-semibold text-forest-700/70 dark:text-cream-50/70 mb-1">
              {lang === "en" ? "Caption / Notes (optional)" : "Catatan Perkembangan (opsional)"}
            </label>
            <input
              type="text"
              placeholder={lang === "en" ? "e.g: Tree looks healthy after fertilizing" : "Contoh: Pohon subur setelah pemupukan minggu lalu"}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-cream-50 dark:bg-forest-950 border border-cream-200 dark:border-forest-800 rounded-xl px-3 py-2.5 text-forest-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-500/40"
            />
          </div>

          {/* Tanggal */}
          <div>
            <label className="block font-semibold text-forest-700/70 dark:text-cream-50/70 mb-1">
              {lang === "en" ? "Photo Date" : "Tanggal Pengambilan Foto"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-cream-50 dark:bg-forest-950 border border-cream-200 dark:border-forest-800 rounded-xl px-3 py-2.5 text-forest-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-500/40"
            />
          </div>

          {/* DBH & Tinggi (opsional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-forest-700/70 dark:text-cream-50/70 mb-1">
                DBH Baru (cm) <span className="font-normal opacity-50">opsional</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="14.5"
                value={dbhCm}
                onChange={(e) => setDbhCm(e.target.value)}
                className="w-full bg-cream-50 dark:bg-forest-950 border border-cream-200 dark:border-forest-800 rounded-xl px-3 py-2.5 text-forest-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-500/40"
              />
            </div>
            <div>
              <label className="block font-semibold text-forest-700/70 dark:text-cream-50/70 mb-1">
                Tinggi Baru (m) <span className="font-normal opacity-50">opsional</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="7.1"
                value={heightM}
                onChange={(e) => setHeightM(e.target.value)}
                className="w-full bg-cream-50 dark:bg-forest-950 border border-cream-200 dark:border-forest-800 rounded-xl px-3 py-2.5 text-forest-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-sage-500/40"
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 bg-cream-100 dark:bg-forest-800 text-forest-900 dark:text-cream-100 font-semibold rounded-xl hover:bg-cream-200 dark:hover:bg-forest-700 transition-colors"
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
  );
}
