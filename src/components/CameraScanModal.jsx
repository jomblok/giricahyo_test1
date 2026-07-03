import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, XCircle, ScanLine } from "lucide-react";

const SCANNER_ELEMENT_ID = "camera-scan-region";

// Ambil ID pohon dari URL hasil decode QR, contoh:
// "https://giricahyo.id/pohon/GJR-002-001" -> "GJR-002-001"
// Juga menerima kasus orang scan ID mentah (tanpa URL) untuk jaga-jaga.
function extractTreeId(decodedText) {
  if (!decodedText) return null;
  if (decodedText.includes("/pohon/")) {
    return decodedText.split("/pohon/")[1]?.split(/[?#]/)[0] || null;
  }
  return decodedText.trim();
}

// "facingMode: environment" itu konsep kamera HP (depan/belakang).
// Laptop/desktop tidak punya kamera depan-belakang — memaksa constraint
// ini di beberapa browser/webcam membuat pemilihan device jadi tidak
// stabil dan video yang dirender bisa terlihat tidak presisi/terpotong.
// Deteksi device secara kasar lewat user agent supaya constraint kamera
// yang dikirim ke getUserMedia sesuai jenis perangkatnya.
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function CameraScanModal({ onResult, onClose }) {
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = instance;

    const containerWidth = containerRef.current?.clientWidth ?? 280;
    const qrboxSize = Math.floor(Math.min(containerWidth, 280) * 0.7);

    // Kamera HP: minta facingMode belakang secara spesifik.
    // Kamera laptop/desktop: jangan kirim facingMode sama sekali —
    // biarkan browser pilih webcam default-nya tanpa constraint yang
    // tidak relevan untuk perangkat itu.
    const videoConstraints = isMobileDevice()
      ? { facingMode: "environment" }
      : true;

    instance
      .start(
        videoConstraints,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
          // Memaksa aspect ratio 1:1 supaya video selalu dirender persegi,
          // konsisten di HP (potret) maupun laptop (webcam 16:9) — tanpa
          // ini, webcam laptop dirender lebar penuh tapi tinggi otomatis
          // mengikuti aspect ratio aslinya, sehingga terlihat sangat pipih
          // di dalam container yang dirancang persegi.
          aspectRatio: 1,
        },
        (decodedText) => {
          if (isCancelled) return;
          const treeId = extractTreeId(decodedText);
          if (treeId) onResult(treeId);
        },
        () => {
          // Frame tanpa QR terbaca — bukan error, diabaikan saja.
        }
      )
      .catch((err) => {
        if (isCancelled) return;
        setError(
          "Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan, dan halaman ini diakses lewat HTTPS atau localhost."
        );
        console.error(err);
      });

    return () => {
      isCancelled = true;
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    if (scannerRef.current?.isScanning) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-forest-900 text-cream-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={16} className="text-gold-500" />
            <span className="text-sm font-semibold">Scan Barcode Pohon</span>
          </div>
          <button
            onClick={handleClose}
            className="text-cream-50/60 hover:text-cream-50 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-forest-700/60 mb-3">
            Arahkan kamera ke QR code yang tertempel pada pohon.
          </p>

          {/* Container persegi (aspect-square) supaya video 1:1 yang
              diminta dari getUserMedia pas mengisi penuh tanpa distorsi,
              baik untuk webcam laptop (16:9 asli) maupun kamera HP. */}
          <div
            ref={containerRef}
            id={SCANNER_ELEMENT_ID}
            className="rounded-xl overflow-hidden border border-cream-100 bg-forest-950 aspect-square w-full flex items-center justify-center [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-clay-100 text-clay-700 text-xs rounded-lg p-3">
              <XCircle size={15} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
