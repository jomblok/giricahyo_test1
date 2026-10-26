// src/lib/ToastContext.jsx
//
// Notifikasi singkat untuk aksi yang sebelumnya terjadi diam-diam: simpan,
// hapus, unggah foto, salin tautan.

import { createContext, useContext } from "react";

// Provider-nya, beserta komponen Toast, di ToastProvider.jsx.
export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext) ?? {
    push: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {},
  };
}
