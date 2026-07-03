import { useState } from "react";
import { ScanLine, Loader2 } from "lucide-react";
import { treeApi } from "../lib/api";
import ScanResultModal from "./ScanResultModal";
import { useAuth } from "../lib/AuthContext";

export default function ScanBarcodeButton() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scannedTreeId, setScannedTreeId] = useState(null);

  async function handleScan() {
    setScanning(true);
    try {
      // TODO: ganti dengan html5-qrcode (lihat QrDemoPage.jsx)
      // Sementara: ambil pohon random dari API
      const trees = await treeApi.list();
      const random = trees[Math.floor(Math.random() * trees.length)];
      setScannedTreeId(random.id);
    } catch (e) {
      alert("Gagal memuat data pohon: " + e.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <button onClick={handleScan} disabled={scanning}
        className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-forest-950 text-sm font-semibold rounded-lg px-3.5 py-2 transition-colors disabled:opacity-70">
        {scanning ? <><Loader2 size={15} className="animate-spin"/>Memindai...</> : <><ScanLine size={15}/>Scan Barcode</>}
      </button>
      {scannedTreeId && (
        <ScanResultModal treeId={scannedTreeId} role={user?.role ?? "admin"}
          onClose={() => setScannedTreeId(null)} />
      )}
    </>
  );
}
