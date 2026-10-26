import { useModalBehavior } from "../lib/useModalBehavior";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, Award, ShieldCheck, TreePine, Sprout } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { parseBasicCarbonTier, getCertificateLifecycle, formatRupiahShort, formatDuration } from "../lib/basicCarbon";
import { formatDate } from "../lib/format";
import { ModalPortal } from './ui/ModalPortal';
import { tautanPohon, asalPublik } from "../lib/tautanPublik";

export default function CertificateModal({ isOpen, onClose, adoption }) {
  const panelRef = useModalBehavior(isOpen, onClose);
  const { t, lang } = useLanguage();
  const certRef = useRef(null);

  if (!isOpen || !adoption) return null;

  const basicTier = parseBasicCarbonTier(adoption.package_name);
  // Masa berlaku TIDAK lagi dibatasi ke paket Basic Carbon: sekarang server
  // menyimpan expires_at untuk semua paket yang memang berbatas waktu.
  const lifecycle = getCertificateLifecycle(adoption);
  const kedaluwarsa = lifecycle?.status === "expired";

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalPortal onClose={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white gjr-overlay-in">
        <div className="bg-surface text-ink rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 print:my-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
          {/* Action Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-line print:hidden">
            <div className="flex items-center gap-2">
              <Award className="text-warn" size={20} />
              <h3 className="font-bold text-base text-ink">
                {lang === "en" ? "Official Carbon Credit Certificate" : "Sertifikat Adopsi Karbon Resmi"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                <Printer size={15} />
                <span>{t("download_pdf")}</span>
              </button>
              <button
                onClick={onClose}
                aria-label={t("close")}
                title={t("close")}
                className="p-2 text-ink-faint hover:text-ink rounded-full hover:bg-surface-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Certificate Frame */}
          <div
            ref={certRef}
            className={`print-area print-area--certificate relative p-8 md:p-12 rounded-2xl border-8 border-double overflow-hidden shadow-inner font-serif ${
              kedaluwarsa
                // Sertifikat kedaluwarsa dibuat REDUP dan berbingkai abu, bukan
                // sekadar diberi label. Warnanya sendiri yang memberi tahu —
                // orang menilai dokumen dari rupanya sebelum membaca hurufnya,
                // dan versi cetaknya pun ikut berbeda tanpa perlu dibaca.
                ? "bg-[#F2F1EE] border-neutral-400 text-neutral-600"
                : "bg-[#FAF8F5] border-forest-900 text-forest-950"
            }`}
          >
            {/* Cap kedaluwarsa — melintang di tengah dokumen.
                Sengaja BUKAN sekadar baris teks di pojok: sertifikat dicetak
                dan diedarkan, jadi tandanya harus terbaca sekilas oleh orang
                yang memegang kertasnya, bukan hanya oleh yang membaca teliti.
                Ditaruh di bawah teks (z-0) supaya isinya tetap terbaca. */}
            {kedaluwarsa && (
              <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div className="-rotate-[18deg] border-[6px] border-red-700/35 rounded-xl px-10 py-4">
                  <p className="text-4xl md:text-6xl font-extrabold tracking-[0.15em] text-red-700/35">
                    TIDAK BERLAKU
                  </p>
                  <p className="text-center text-sm md:text-base font-bold tracking-widest text-red-700/35 mt-1">
                    MASA ADOPSI TELAH BERAKHIR
                  </p>
                </div>
              </div>
            )}

            {/* Decorative Corner Ornaments */}
            <div className={`absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 ${kedaluwarsa ? "border-neutral-400" : "border-gold-600"}`} />
            <div className={`absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 ${kedaluwarsa ? "border-neutral-400" : "border-gold-600"}`} />
            <div className={`absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 ${kedaluwarsa ? "border-neutral-400" : "border-gold-600"}`} />
            <div className={`absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 ${kedaluwarsa ? "border-neutral-400" : "border-gold-600"}`} />

            {/* Background Watermark Seal */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <TreePine size={320} className="text-forest-900" />
            </div>

            {/* Certificate Content */}
            <div className="relative z-10 text-center space-y-6">
              {/* Header / Crest */}
              <div className="flex justify-center items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-forest-900 text-gold-400 flex items-center justify-center shadow-md">
                  <ShieldCheck size={28} />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-forest-700 font-sans font-bold">
                  Giricahyo Carbon Offset Program
                </p>
                <h1 className="text-2xl md:text-4xl font-extrabold text-forest-950 mt-1 uppercase tracking-wider">
                  CERTIFICATE OF ADOPTION
                </h1>
                <p className="text-xs font-mono text-gold-700 mt-1 font-bold">
                  NO: {adoption.certificate_no || `GJR-CERT-${adoption.id}`}
                </p>
              </div>

              <div className="w-24 h-0.5 bg-gold-600 mx-auto" />

              <p className="text-sm italic text-forest-800">Dengan bangga dianugerahkan kepada:</p>

              <h2 className="text-2xl md:text-3xl font-extrabold text-forest-900 border-b border-gold-400/40 inline-block pb-1 px-8">
                {adoption.buyer_name || adoption.buyer?.name || "Mitra Keberlanjutan"}
              </h2>

              {basicTier ? (
                <p className="text-xs md:text-sm text-forest-800 max-w-xl mx-auto leading-relaxed">
                  Atas kontribusi aktif mendukung carbon fund komunitas Giricahyo melalui tingkat{" "}
                  <strong className="text-forest-950">{basicTier.name}</strong> senilai{" "}
                  <span className="font-mono font-bold text-gold-700">{formatRupiahShort(basicTier.price)}</span> — mendukung
                  petani penjaga pohon dan program karbon di Hutan Giricahyo.
                </p>
              ) : (
                <p className="text-xs md:text-sm text-forest-800 max-w-xl mx-auto leading-relaxed">
                  Atas kontribusi aktif dalam pelestarian lingkungan dan reduksi jejak karbon melalui adopsi pohon karbon jenis{" "}
                  <strong className="text-forest-950">{adoption.tree?.species || "Pohon Karbon"}</strong> beridentitas resmi{" "}
                  <span className="font-mono font-bold text-gold-700">{adoption.tree_id}</span> di Hutan Giricahyo.
                </p>
              )}

              {/* Metrics Badge Box */}
              {basicTier ? (
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-6 bg-white/80 p-4 rounded-xl border border-cream-300 font-sans shadow-sm">
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block flex items-center justify-center gap-1">
                      <Sprout size={11} />Tingkat
                    </span>
                    <span className="text-sm md:text-base font-extrabold text-forest-900">{basicTier.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Masa Berlaku</span>
                    <span className="text-xs md:text-sm font-bold text-forest-900">
                      {formatDuration(basicTier.months, lang)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Berlaku Hingga</span>
                    <span className="text-xs md:text-sm font-bold text-forest-900">
                      {lifecycle ? formatDate(lifecycle.expiresAt) : "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-6 bg-white/80 p-4 rounded-xl border border-cream-300 font-sans shadow-sm">
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Serapan Karbon</span>
                    <span className="text-sm md:text-base font-extrabold text-forest-900">
                      {adoption.tree?.co2_eq_kg ? `${adoption.tree.co2_eq_kg} kg CO₂e` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Petani Pendamping</span>
                    <span className="text-xs md:text-sm font-bold text-forest-900 truncate block">
                      {adoption.tree?.farmer_name || adoption.tree?.farmer?.name || "Petani Lokal"}
                    </span>
                  </div>
                  {/* Paket non-Basic-Carbon kini juga punya masa berlaku
                      (expires_at dari server), jadi tanggal berakhirnya ikut
                      dicetak. Kalau paketnya memang tanpa batas waktu,
                      kolom ini kembali menampilkan tanggal adopsi. */}
                  <div>
                    <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">
                      {lifecycle ? "Berlaku Hingga" : "Tanggal Adopsi"}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-forest-900">
                      {lifecycle
                        ? formatDate(lifecycle.expiresAt)
                        : adoption.created_at ? new Date(adoption.created_at).toLocaleDateString("id-ID") : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer / Signatures & QR */}
              <div className="pt-6 border-t border-cream-300 flex items-center justify-between text-left font-sans text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-forest-700/60 font-semibold">Diotorisasi Oleh:</p>
                  <div className="h-10 border-b border-forest-900 w-36 flex items-end pb-1 font-semibold italic text-forest-900">
                    Tim Karbon Giricahyo
                  </div>
                  <p className="text-[10px] font-bold text-forest-900">Ketiga Pengelola Program</p>
                </div>

                {/* QR Verification Code */}
                <div className="flex flex-col items-center gap-1">
                  <QRCodeSVG
                    value={basicTier ? asalPublik() : tautanPohon(adoption.tree_id)}
                    size={64}
                    fgColor="#15392e"
                    bgColor="#FAF8F5"
                  />
                  <span className="text-[9px] font-mono text-forest-700/60">Verifikasi QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
