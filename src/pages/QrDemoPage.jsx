import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Leaf,
} from "lucide-react";
import { trees } from "../data/trees";
import { getTreeDetail } from "../lib/joins";
import { formatNumber } from "../lib/format";

const SCANNER_ELEMENT_ID = "qr-scanner-region";

// URL dasar tujuan QR code. Di pilot sungguhan ini akan jadi domain asli,
// contoh: https://giricahyo.id — untuk sekarang dipakai origin halaman ini
// sendiri supaya hasil scan langsung bisa diverifikasi di app yang sama.
function buildTreeUrl(treeId) {
  return `${window.location.origin}/pohon/${treeId}`;
}

export default function QrDemoPage() {
  const [step, setStep] = useState("generate"); // generate -> scan -> result
  const [selectedTreeId, setSelectedTreeId] = useState(trees[0].id);
  const [scanError, setScanError] = useState(null);
  const [scannedRaw, setScannedRaw] = useState(null);

  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  const qrValue = buildTreeUrl(selectedTreeId);

  // Kelola lifecycle kamera: nyalakan saat masuk step "scan",
  // matikan otomatis saat pindah step lain atau halaman ditutup.
  useEffect(() => {
    if (step !== "scan") return;

    let isCancelled = false;
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = instance;
    setScanError(null);

    instance
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (isCancelled) return;
          setScannedRaw(decodedText);
          setStep("result");
        },
        () => {
          // Dipanggil terus-menerus tiap frame yang belum ketemu QR —
          // bukan error fatal, jadi sengaja tidak ditampilkan ke user.
        }
      )
      .catch((err) => {
        if (isCancelled) return;
        setScanError(
          "Tidak bisa mengakses kamera. Pastikan kamu memberi izin akses kamera di browser, dan situs ini dibuka lewat HTTPS atau localhost."
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
  }, [step]);

  function handleStartScan() {
    setScannedRaw(null);
    setScanError(null);
    setStep("scan");
  }

  function handleReset() {
    setStep("generate");
    setScannedRaw(null);
    setScanError(null);
  }

  // Cocokkan hasil decode QR ke ID pohon di data kita.
  const scannedTreeId = scannedRaw
    ? scannedRaw.split("/pohon/")[1]?.split(/[?#]/)[0]
    : null;
  const detail = scannedTreeId ? getTreeDetail(scannedTreeId) : null;

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-forest-900 text-cream-50 px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sage-500/20 rounded-lg p-1.5">
              <Leaf size={18} className="text-sage-400" />
            </div>
            <span className="font-semibold text-sm">Demo Alur QR Pohon</span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-cream-50/60 text-xs hover:text-cream-50 transition-colors"
          >
            <ArrowLeft size={13} />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 px-1">
          <StepDot active={step === "generate"} done={step !== "generate"} label="1. Buat QR" />
          <StepLine />
          <StepDot active={step === "scan"} done={step === "result"} label="2. Scan" />
          <StepLine />
          <StepDot active={step === "result"} done={false} label="3. Hasil" />
        </div>

        {step === "generate" && (
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-sage-600" />
              <h2 className="font-semibold text-forest-950">
                Langkah 1 — Pilih Pohon &amp; Buat QR Code
              </h2>
            </div>

            <label className="block text-xs font-medium text-forest-700/60 mb-1.5">
              Pilih pohon dummy untuk disimulasikan
            </label>
            <select
              value={selectedTreeId}
              onChange={(e) => setSelectedTreeId(e.target.value)}
              className="w-full text-sm bg-cream-50 border border-cream-100 rounded-lg px-3 py-2.5 mb-6 focus:outline-none focus:ring-2 focus:ring-sage-400/40"
            >
              {trees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.species}
                </option>
              ))}
            </select>

            <div className="flex flex-col items-center gap-4 py-6 bg-cream-50 rounded-xl">
              <QRCodeSVG
                value={qrValue}
                size={208}
                fgColor="#15392e"
                bgColor="#f6f3ea"
                level="M"
                marginSize={2}
              />
              <p className="font-mono-id text-[11px] text-forest-700/50 break-all px-6 text-center">
                {qrValue}
              </p>
            </div>

            <p className="text-xs text-forest-700/50 mt-4">
              QR ini berisi URL kartu identitas pohon. Pada implementasi
              sungguhan, QR seperti ini akan di-print dan ditempel langsung
              ke batang pohon.
            </p>

            <button
              onClick={handleStartScan}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors"
            >
              <Camera size={16} />
              Lanjut ke Langkah 2: Scan QR Ini
            </button>
          </div>
        )}

        {step === "scan" && (
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Camera size={18} className="text-sage-600" />
              <h2 className="font-semibold text-forest-950">
                Langkah 2 — Arahkan Kamera ke QR Code
              </h2>
            </div>

            <p className="text-xs text-forest-700/60 mb-4">
              Tampilkan QR dari Langkah 1 di layar lain (HP/laptop lain), atau
              cetak di kertas, lalu arahkan kamera ini ke sana. Browser akan
              meminta izin akses kamera.
            </p>

            <div
              id={SCANNER_ELEMENT_ID}
              ref={containerRef}
              className="rounded-xl overflow-hidden border border-cream-100 bg-forest-950 min-h-[280px]"
            />

            {scanError && (
              <div className="mt-4 flex items-start gap-2 bg-clay-100 text-clay-700 text-xs rounded-lg p-3">
                <XCircle size={15} className="shrink-0 mt-0.5" />
                <p>{scanError}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-cream-100 hover:bg-cream-100/70 text-forest-900 font-medium text-sm rounded-xl py-2.5 transition-colors"
            >
              <RotateCcw size={14} />
              Batal, Kembali ke Langkah 1
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-sage-600">
              <CheckCircle2 size={18} />
              <h2 className="font-semibold text-forest-950">
                Langkah 3 — Scan Berhasil
              </h2>
            </div>

            {detail ? (
              <>
                <div className="bg-sage-100 text-sage-600 text-xs rounded-lg p-3 mb-4">
                  Barcode berhasil dibaca dan dicocokkan ke data pohon di
                  sistem.
                </div>

                <div className="border border-cream-100 rounded-xl p-4 space-y-3">
                  <p className="font-mono-id text-gold-600 text-xs">
                    {detail.tree.id}
                  </p>
                  <h3 className="text-lg font-bold text-forest-950">
                    {detail.tree.species}
                  </h3>
                  <Row label="Petani Pemilik" value={detail.farmer?.name || "—"} />
                  <Row
                    label="Lokasi Koordinat"
                    value={`${detail.tree.latitude.toFixed(5)}, ${detail.tree.longitude.toFixed(5)}`}
                    mono
                  />
                  <Row
                    label="Estimasi Serapan Karbon"
                    value={`${formatNumber(detail.tree.co2EqKg, 2)} kg CO₂e`}
                    highlight
                  />
                </div>

                <Link
                  to={`/pohon/${detail.tree.id}`}
                  className="block text-center w-full mt-4 text-xs text-sage-600 hover:text-sage-500 font-medium"
                >
                  Lihat halaman publik kartu identitas pohon ini →
                </Link>
              </>
            ) : (
              <div className="bg-clay-100 text-clay-700 text-xs rounded-lg p-3">
                QR terbaca ({scannedRaw}), tapi ID pohon tidak ditemukan di
                data. Coba scan ulang QR yang dibuat dari Langkah 1.
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors"
            >
              <RotateCcw size={14} />
              Coba Lagi dengan Pohon Lain
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
          done
            ? "bg-sage-500 text-white"
            : active
            ? "bg-gold-500 text-forest-950"
            : "bg-cream-100 text-forest-700/40"
        }`}
      >
        {done ? <CheckCircle2 size={13} /> : label[0]}
      </div>
      <span
        className={`text-[11px] font-medium hidden sm:inline ${
          active ? "text-forest-950" : "text-forest-700/40"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="flex-1 h-px bg-cream-100" />;
}

function Row({ label, value, mono, highlight }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-forest-700/45 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm break-words ${mono ? "font-mono-id" : ""} ${
          highlight ? "font-bold text-gold-600 text-base" : "font-medium text-forest-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
