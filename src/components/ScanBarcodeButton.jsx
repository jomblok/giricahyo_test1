import { useState, lazy, Suspense } from "react";
import { ScanLine } from "lucide-react";
import ScanResultModal from "./ScanResultModal";
import { useAuth } from "../lib/AuthContext";

// Tombol ini hidup di Topbar, jadi ikut termuat di SETIAP halaman — padahal
// pustaka pemindai (html5-qrcode) hanya terpakai kalau kamera benar-benar
// dibuka. Sebelumnya modalnya memang baru di-render saat diklik, tapi
// import-nya statis sehingga pustakanya tetap ikut ke bundel awal semua orang.
const CameraScanModal = lazy(() => import("./CameraScanModal"));

export default function ScanBarcodeButton() {
  const { user } = useAuth();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannedTreeId, setScannedTreeId] = useState(null);

  function handleScanResult(treeId) {
    // Tutup kamera dulu, lalu tampilkan hasil
    setCameraOpen(false);
    setScannedTreeId(treeId);
  }

  return (
    <>
      <button
        id="btn-scan-barcode"
        onClick={() => setCameraOpen(true)}
        title="Scan Barcode"
        aria-label="Scan Barcode"
        // Teksnya disembunyikan di layar ponsel. Dengan label, tombol ini
        // memakan 107px dari 375px yang tersedia — hampir sepertiga topbar —
        // dan mendorong judul halaman serta tombol Keluar keluar layar.
        // Ikon barcode-nya sudah cukup dikenali, dan aksinya tetap satu klik.
        className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 active:scale-95 text-forest-950 text-sm font-semibold rounded-lg px-2.5 xl:px-3.5 py-2 transition-all duration-150"
      >
        <ScanLine size={15} className="shrink-0" />
        <span className="hidden xl:inline">Scan Barcode</span>
      </button>

      {/* Modal kamera — hanya di-mount saat dibutuhkan supaya kamera
          tidak aktif terus dan lifecycle Html5Qrcode bersih */}
      {cameraOpen && (
        <Suspense fallback={null}>
          <CameraScanModal
            onResult={handleScanResult}
            onClose={() => setCameraOpen(false)}
          />
        </Suspense>
      )}

      {scannedTreeId && (
        <ScanResultModal
          treeId={scannedTreeId}
          role={user?.role ?? "admin"}
          onClose={() => setScannedTreeId(null)}
        />
      )}
    </>
  );
}
