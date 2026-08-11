import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, XCircle, ScanLine, Camera, Loader2, RefreshCw } from "lucide-react";

const SCANNER_ELEMENT_ID = "camera-scan-region";

// Ambil ID pohon dari URL hasil decode QR.
// Contoh: "https://giricahyo.id/pohon/GJR-002-001" -> "GJR-002-001"
// Juga menerima ID mentah tanpa URL.
function extractTreeId(raw) {
  if (!raw) return null;
  if (raw.includes("/pohon/")) {
    return raw.split("/pohon/")[1]?.split(/[?#]/)[0]?.trim() || null;
  }
  return raw.trim();
}

// Pilih kamera terbaik dari daftar yang tersedia:
// - HP/tablet : prefer kamera belakang ("back" / "environment" / "rear")
// - Laptop    : ambil kamera pertama yang ada (biasanya satu-satunya)
function pickCamera(cameras) {
  if (!cameras || cameras.length === 0) return null;
  const backCamera = cameras.find((c) =>
    /back|environment|rear/i.test(c.label)
  );
  return backCamera ?? cameras[0];
}

// Terjemahkan pesan error teknis browser ke bahasa yang mudah dipahami
function friendlyError(err) {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  if (msg.includes("notallowed") || msg.includes("permission denied")) {
    return "Izin kamera ditolak. Klik ikon kunci/kamera di address bar browser → pilih 'Izinkan' → tutup modal dan coba lagi.";
  }
  if (msg.includes("notfound") || msg.includes("device not found") || msg.includes("no cameras")) {
    return "Kamera tidak ditemukan di perangkat ini. Pastikan kamera terpasang dan tidak digunakan aplikasi lain.";
  }
  if (msg.includes("notreadable") || msg.includes("could not start video")) {
    return "Kamera sedang dipakai aplikasi lain (misal: Zoom, Teams, atau tab browser lain). Tutup aplikasi tersebut, lalu coba lagi.";
  }
  if (msg.includes("overconstrained") || msg.includes("constraint")) {
    return "Konfigurasi kamera tidak didukung perangkat ini. Coba klik Coba Lagi.";
  }
  return "Tidak bisa membuka kamera. Pastikan izin kamera sudah diberikan di browser.";
}

export default function CameraScanModal({ onResult, onClose }) {
  // "starting" → sedang enumerate/inisialisasi
  // "scanning" → kamera aktif, sedang scan
  // "error"    → gagal, tampilkan pesan + tombol retry
  const [phase, setPhase]     = useState("starting");
  const [errMsg, setErrMsg]   = useState("");
  const [retryKey, setRetryKey] = useState(0); // increment = mount ulang effect

  const scannerRef   = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    setPhase("starting");
    setErrMsg("");

    async function startCamera() {
      // ── 1. Enumerate semua kamera yang tersedia ──────────────────────────
      let cameras;
      try {
        cameras = await Html5Qrcode.getCameras();
      } catch (err) {
        if (cancelled) return;
        setErrMsg(friendlyError(err));
        setPhase("error");
        return;
      }

      if (!cameras || cameras.length === 0) {
        if (cancelled) return;
        setErrMsg(friendlyError(new Error("no cameras found")));
        setPhase("error");
        return;
      }

      const chosen = pickCamera(cameras);

      // ── 2. Hitung ukuran qrbox proporsional dengan lebar container ──────
      const containerW = containerRef.current?.clientWidth ?? 280;
      const qrboxSize  = Math.floor(Math.min(containerW, 280) * 0.68);

      // ── 3. Buat instance dan mulai scan dengan device ID konkret ─────────
      //   Menggunakan device ID (bukan facingMode constraint) adalah cara
      //   paling aman — tidak ada constraint yang bisa ditolak browser.
      const instance = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
      scannerRef.current = instance;

      try {
        await instance.start(
          chosen.id,
          {
            fps: 10,
            qrbox: { width: qrboxSize, height: qrboxSize },
            // Paksa 1:1 agar video persegi di dalam container persegi
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (cancelled) return;
            const treeId = extractTreeId(decodedText);
            if (treeId) onResult(treeId);
          },
          () => {
            // Tiap frame yang belum ada QR-nya — bukan error, abaikan.
          }
        );

        if (!cancelled) setPhase("scanning");
      } catch (err) {
        if (cancelled) return;
        setErrMsg(friendlyError(err));
        setPhase("error");
        console.error("[CameraScanModal] Gagal start kamera:", err);
      }
    }

    startCamera();

    // Cleanup: matikan kamera saat modal ditutup atau retry
    return () => {
      cancelled = true;
      const inst = scannerRef.current;
      if (inst?.isScanning) {
        inst.stop().then(() => inst.clear()).catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    const inst = scannerRef.current;
    if (inst?.isScanning) {
      inst.stop().then(() => inst.clear()).catch(() => {});
    }
    onClose();
  }

  function handleRetry() {
    // Bersihkan instance lama sebelum mount ulang
    const inst = scannerRef.current;
    if (inst?.isScanning) {
      inst.stop().then(() => inst.clear()).catch(() => {});
    }
    scannerRef.current = null;
    setRetryKey((k) => k + 1);
  }

  return (
    <div
      className="fixed inset-0 bg-forest-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-forest-900 text-cream-50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gold-500/20 rounded-lg p-1.5">
              <ScanLine size={14} className="text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Scan Barcode Pohon</p>
              <p className="text-[10px] text-cream-50/45 leading-tight mt-0.5">
                {phase === "starting" && "Menginisialisasi kamera…"}
                {phase === "scanning" && "Kamera aktif — arahkan ke QR code"}
                {phase === "error"    && "Kamera tidak dapat diakses"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-cream-50/50 hover:text-cream-50 transition-colors p-1 -mr-1 rounded-lg hover:bg-cream-50/10"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-forest-700/60 mb-3 leading-relaxed">
            Arahkan kamera ke QR code yang tertempel pada pohon.
            Browser akan meminta izin akses kamera saat pertama kali.
          </p>

          {/* ── Area kamera ──────────────────────────────────────────────── */}
          {/* PENTING: div ini TIDAK boleh punya overflow-hidden karena      */}
          {/* html5-qrcode menginject elemen video yang perlu visible.       */}
          {/* Gunakan rounded + clip-path jika mau efek rounded corner.      */}
          <div
            ref={containerRef}
            className="relative bg-forest-950 aspect-square w-full rounded-xl"
            style={{ overflow: "hidden" }}
          >
            {/* Target html5-qrcode — ID harus match SCANNER_ELEMENT_ID     */}
            {/* dan harus sudah ada di DOM sebelum .start() dipanggil.       */}
            <div
              key={retryKey}
              id={SCANNER_ELEMENT_ID}
              className="w-full h-full"
              style={{
                // Video yang diinject html5-qrcode harus mengisi penuh
                contain: "strict",
              }}
            />

            {/* Overlay: Spinner saat starting */}
            {phase === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-forest-950 pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <Camera size={32} className="text-forest-600" />
                  <Loader2
                    size={56}
                    className="absolute text-gold-500/50 animate-spin"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-cream-50/50 text-xs">Memulai kamera…</p>
              </div>
            )}

            {/* Overlay: Error */}
            {phase === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-forest-950 px-5 text-center pointer-events-none">
                <XCircle size={32} className="text-clay-500 shrink-0" />
                <p className="text-cream-50/70 text-xs leading-relaxed">{errMsg}</p>
              </div>
            )}

            {/* Corner guides — hanya tampil saat scan aktif */}
            {phase === "scanning" && (
              <>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-gold-400 rounded-tl pointer-events-none" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-gold-400 rounded-tr pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-gold-400 rounded-bl pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-gold-400 rounded-br pointer-events-none" />
                {/* Garis scan animasi */}
                <div
                  className="absolute inset-x-8 h-0.5 bg-gold-400/60 rounded-full pointer-events-none"
                  style={{ animation: "scanline 2s ease-in-out infinite" }}
                />
              </>
            )}
          </div>

          {/* Pesan error + tombol retry di bawah area kamera */}
          {phase === "error" && (
            <div className="mt-4 flex items-start gap-2 bg-clay-100/80 text-clay-700 text-xs rounded-xl p-3 leading-relaxed">
              <XCircle size={14} className="shrink-0 mt-0.5" />
              <p>{errMsg}</p>
            </div>
          )}

          {/* Tombol aksi */}
          <div className="mt-4 flex gap-2">
            {phase === "error" && (
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-forest-900 hover:bg-forest-800 text-cream-50 transition-colors"
              >
                <RefreshCw size={13} />
                Coba Lagi
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium text-forest-700/70 bg-cream-50 hover:bg-cream-100 transition-colors border border-cream-100"
            >
              Batal
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animasi garis scan */}
      <style>{`
        @keyframes scanline {
          0%   { top: 18%; }
          50%  { top: 76%; }
          100% { top: 18%; }
        }
      `}</style>
    </div>
  );
}
