import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Printer, Download, Award, ShieldCheck, TreePine } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function CertificateModal({ isOpen, onClose, adoption }) {
  const { t, lang } = useLanguage();
  const certRef = useRef(null);

  if (!isOpen || !adoption) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white text-forest-950 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 print:my-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Action Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-200 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="text-gold-600" size={20} />
            <h3 className="font-bold text-base text-forest-950">
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
              className="p-2 text-forest-700/50 hover:text-forest-900 rounded-full hover:bg-cream-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div
          ref={certRef}
          className="print-area relative bg-[#FAF8F5] p-8 md:p-12 rounded-2xl border-8 border-double border-forest-900 overflow-hidden shadow-inner text-forest-950 font-serif"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-gold-600" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-gold-600" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-gold-600" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-gold-600" />

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

            <p className="text-xs md:text-sm text-forest-800 max-w-xl mx-auto leading-relaxed">
              Atas kontribusi aktif dalam pelestarian lingkungan dan reduksi jejak karbon melalui adopsi pohon karbon jenis{" "}
              <strong className="text-forest-950">{adoption.tree?.species || "Pohon Karbon"}</strong> beridentitas resmi{" "}
              <span className="font-mono font-bold text-gold-700">{adoption.tree_id}</span> di Hutan Giricahyo.
            </p>

            {/* Metrics Badge Box */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto my-6 bg-white/80 p-4 rounded-xl border border-cream-300 font-sans shadow-sm">
              <div>
                <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Serapan Karbon</span>
                <span className="text-sm md:text-base font-extrabold text-forest-900">
                  {adoption.tree?.co2_eq_kg ? `${adoption.tree.co2_eq_kg} kg` : "75.01 kg"} CO₂e
                </span>
              </div>
              <div>
                <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Petani Pendamping</span>
                <span className="text-xs md:text-sm font-bold text-forest-900 truncate block">
                  {adoption.tree?.farmer_name || adoption.tree?.farmer?.name || "Petani Lokal"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-forest-700/60 uppercase font-semibold block">Tanggal Adopsi</span>
                <span className="text-xs md:text-sm font-bold text-forest-900">
                  {adoption.created_at ? new Date(adoption.created_at).toLocaleDateString("id-ID") : "2026-08-11"}
                </span>
              </div>
            </div>

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
                  value={`${window.location.origin}/pohon/${adoption.tree_id}`}
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

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
            margin: 0; padding: 2rem; border-width: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
