// src/lib/useApi.js
// Hook universal untuk fetch data dari API.
//
// Contoh pakai:
//   const { data: trees, loading, error, refetch } = useApi(() => treeApi.list());
//
// - Otomatis fetch saat komponen mount
// - `refetch()` untuk refresh manual (misal setelah tambah data baru)
// - `loading` true selama fetch berlangsung
// - `error` berisi pesan string jika gagal, null jika sukses

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { AlertTriangle } from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export function useApi(fetcher, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef            = useRef(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      // Sebagai transition: React boleh memecah render yang dipicu data ini
      // menjadi potongan kecil dan menyela di antaranya untuk klik atau
      // ketikan. Tanpa itu, membuka Ringkasan dengan data dari simpanan
      // merender seluruh isinya dalam satu blok — terukur 64–105 ms di
      // laptop, dan selama itu halaman tidak bisa disentuh.
      if (mountedRef.current) {
        startTransition(() => {
          setData(result);
          setLoading(false);
        });
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e.message || "Gagal memuat data.");
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch_();
    return () => { mountedRef.current = false; };
  }, [fetch_]);

  // Data yang tampil bisa berasal dari simpanan yang sudah agak lama; api.js
  // memintanya ulang di latar belakang lalu menyiarkan gjr:simpanan-diperbarui.
  // Saat itu pengambil dijalankan ulang DIAM-DIAM — tanpa spinner, karena
  // datanya sudah di layar — dan kali ini ia menerima jawaban terbaru dari
  // simpanan, tanpa permintaan baru ke server. Jawaban yang tidak berubah
  // adalah objek yang sama, jadi setData tidak memicu render ulang.
  const segarkan = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        startTransition(() => {
          setData(result);
          setError(null);
        });
      }
    } catch {
      // Gagal menyegarkan tidak menimpa data yang sudah tampil.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    window.addEventListener("gjr:simpanan-diperbarui", segarkan);
    return () => window.removeEventListener("gjr:simpanan-diperbarui", segarkan);
  }, [segarkan]);

  return { data, loading, error, refetch: fetch_ };
}

// ── Komponen helper untuk tampilkan loading / error ───────────────────────────
export function ApiState({ loading, error, children, skeleton = null }) {
  if (loading) {
    return skeleton || (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Memuat">
        <div className="w-6 h-6 border-2 border-brand/25 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }
  // Sesi habis ditangani AuthContext (pindah ke /login lewat router);
  // di sini cukup jangan tampilkan kode teknisnya ke pengguna.
  if (error === "SESSION_EXPIRED") return null;

  if (error) {
    // Sebelumnya kotak ini memakai bg-clay-100/text-clay-700 tanpa varian dark:,
    // jadi muncul sebagai blok terang di tengah halaman gelap.
    return (
      <div
        role="alert"
        className="flex items-start gap-2.5 bg-bad-soft text-bad text-sm rounded-xl px-4 py-3 border border-bad/25"
      >
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <p className="min-w-0">{error}</p>
      </div>
    );
  }
  return children;
}
