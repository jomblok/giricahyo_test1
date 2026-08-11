import { useState } from "react";
import { ScanLine } from "lucide-react";
import ScanResultModal from "./ScanResultModal";
import CameraScanModal from "./CameraScanModal";
import { useAuth } from "../lib/AuthContext";

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
        className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 active:scale-95 text-forest-950 text-sm font-semibold rounded-lg px-3.5 py-2 transition-all duration-150"
      >
        <ScanLine size={15} />
        Scan Barcode
      </button>

      {/* Modal kamera — hanya di-mount saat dibutuhkan supaya kamera
          tidak aktif terus dan lifecycle Html5Qrcode bersih */}
      {cameraOpen && (
        <CameraScanModal
          onResult={handleScanResult}
          onClose={() => setCameraOpen(false)}
        />
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
