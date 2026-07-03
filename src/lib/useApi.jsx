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
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-sage-400/30 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 bg-clay-100 text-clay-700 text-sm rounded-xl px-4 py-3 border border-clay-200">
        <span className="shrink-0">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }
  return children;
}
