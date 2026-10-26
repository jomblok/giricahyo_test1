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

import { useState, useEffect, useCallback, useRef } from "react";
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
      if (mountedRef.current) setData(result);
    } catch (e) {
      if (mountedRef.current) setError(e.message || "Gagal memuat data.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch_();
    return () => { mountedRef.current = false; };
  }, [fetch_]);

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
