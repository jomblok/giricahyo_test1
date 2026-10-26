// src/components/OfflineIndicator.jsx — status jaringan dan kiriman tertunda.
//
// Ini bagian yang membuat antrean luring boleh ada sama sekali. Menyimpan
// kiriman diam-diam saat tidak ada sinyal berbahaya: petani menekan "Kirim",
// melihat pesan, lalu pulang dengan keyakinan laporannya sudah sampai —
// padahal masih di ponselnya. Kalau ponselnya hilang atau cache-nya dibersihkan,
// pengukuran itu hilang tanpa ada yang tahu.
//
// Jadi jumlah yang menunggu harus selalu terlihat, dan harus bisa dikirim
// ulang dengan sengaja, bukan hanya otomatis.

import { useCallback, useEffect, useState } from "react";
import { WifiOff, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { daftarAntrean, kirimUlangAntrean } from "../lib/offlineQueue";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";

export default function OfflineIndicator() {
  const { t } = useLanguage();
  const toast = useToast();

  const [luring, setLuring] = useState(() => !navigator.onLine);
  const [tertunda, setTertunda] = useState(0);
  const [mengirim, setMengirim] = useState(false);

  const hitung = useCallback(async () => {
    try {
      setTertunda((await daftarAntrean()).length);
    } catch {
      // IndexedDB bisa ditolak di mode privat. Indikator yang gagal tidak
      // boleh menjatuhkan topbar.
      setTertunda(0);
    }
  }, []);

  const kirim = useCallback(async () => {
    setMengirim(true);
    try {
      const hasil = await kirimUlangAntrean(async (item) => {
        const token = localStorage.getItem("gjr_token");
        return fetch(item.url, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: item.body ? JSON.stringify(item.body) : null,
        });
      });

      if (hasil.terkirim) toast.success(`${hasil.terkirim} ${t("queue_sent")}`);
      // Yang ditolak server DIBERITAHU, tidak dibuang diam-diam: isinya hilang
      // dari antrean, dan pengguna berhak tahu kirimannya tidak diterima.
      if (hasil.ditolak) toast.error(`${hasil.ditolak} ${t("queue_rejected")}`);
      await hitung();
    } catch {
      toast.error(t("toast_failed"));
    } finally {
      setMengirim(false);
    }
  }, [hitung, t, toast]);

  // Penangan didefinisikan DI LUAR efek. Bukan sekadar menyenangkan linter:
  // fungsi yang lahir ulang tiap render membuat addEventListener dan
  // removeEventListener memakai referensi berbeda, sehingga pendengarnya
  // menumpuk tanpa pernah benar-benar dilepas.
  const saatDaring = useCallback(() => {
    setLuring(false);
    // Begitu sinyal kembali, antrean dikirim sendiri — tanpa menunggu
    // pengguna ingat. Tombolnya tetap ada untuk yang ingin memaksa.
    kirim();
  }, [kirim]);

  const saatLuring = useCallback(() => setLuring(true), []);

  useEffect(() => {
    // Dijalankan lewat microtask, bukan langsung di badan efek: hitung()
    // menyetel state, dan menyetel state serentak saat efek berjalan memicu
    // render berantai. Isinya tidak mendesak sampai satu tick pun.
    queueMicrotask(hitung);

    window.addEventListener("online", saatDaring);
    window.addEventListener("offline", saatLuring);
    window.addEventListener("gjr:antrean-berubah", hitung);
    return () => {
      window.removeEventListener("online", saatDaring);
      window.removeEventListener("offline", saatLuring);
      window.removeEventListener("gjr:antrean-berubah", hitung);
    };
  }, [hitung, saatDaring, saatLuring]);

  // Tidak ada yang perlu dikatakan saat daring dan antrean kosong.
  if (!luring && tertunda === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${
        luring ? "bg-warn-soft text-warn" : "bg-brand-soft text-brand-ink"
      }`}
    >
      {luring ? <WifiOff size={13} /> : <UploadCloud size={13} />}
      <span className="hidden sm:inline">{luring ? t("offline") : t("queue_pending")}</span>

      {tertunda > 0 && (
        <>
          <span className="tabular-nums">{tertunda}</span>
          <button
            type="button"
            onClick={kirim}
            disabled={mengirim || luring}
            title={t("queue_send_now")}
            aria-label={t("queue_send_now")}
            className="ml-0.5 rounded-lg p-0.5 transition-opacity hover:opacity-70 disabled:opacity-40"
          >
            {mengirim ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          </button>
        </>
      )}
    </div>
  );
}
