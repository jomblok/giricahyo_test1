// src/components/PageFallback.jsx — tampilan sementara saat halaman lazy dimuat.

import { Leaf } from "lucide-react";

export default function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ground" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-brand-soft rounded-2xl p-3.5 animate-pulse">
          <Leaf size={24} className="text-brand" strokeWidth={2.2} />
        </div>
        <span className="sr-only">Memuat halaman…</span>
      </div>
    </div>
  );
}
