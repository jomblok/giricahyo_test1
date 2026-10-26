// src/components/ErrorBoundary.jsx
//
// Sebelumnya satu komponen yang melempar error membuat seluruh halaman jadi
// putih polos — tanpa pesan, tanpa jalan kembali. Risiko nyata saat demo.
//
// Komponen ini harus class component: React belum menyediakan hook untuk
// menangkap error render.

import { Component } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Ditulis ke console supaya masih bisa ditelusuri saat development.
    console.error("[Giricahyo] Render error:", error, info?.componentStack);
  }

  handleReload = () => window.location.reload();
  handleHome = () => { window.location.href = "/"; };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground">
        <div className="bg-surface border border-line rounded-3xl shadow-sm max-w-md w-full p-7 text-center">
          <div className="inline-flex rounded-2xl bg-bad-soft p-3.5 mb-4">
            <AlertTriangle size={26} className="text-bad" strokeWidth={1.8} />
          </div>

          <h1 className="text-lg font-bold text-ink mb-1.5">
            Ada bagian halaman yang gagal dimuat
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            Sisa aplikasi masih aman. Coba muat ulang halaman ini — kalau masih
            terjadi, catat pesan di bawah dan laporkan.
          </p>

          {import.meta.env.DEV && (
            <pre className="mt-4 text-left text-[11px] font-mono-id bg-surface-sub border border-line rounded-xl p-3 overflow-x-auto text-bad">
              {/* BUKAN error.message begitu saja. JavaScript mengizinkan apa
                  pun dilempar, bukan hanya Error — dan html5-qrcode, misalnya,
                  melempar STRING. Nilai seperti itu tidak punya .message, jadi
                  kotak ini tampil KOSONG: layar galat yang tidak memberi tahu
                  apa-apa, justru di saat pengguna diminta melaporkan isinya. */}
              {error?.message || (typeof error === "string" ? error : null) || String(error ?? "Galat tanpa keterangan")}
            </pre>
          )}

          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-brand text-surface hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={15} />
              Muat ulang
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-surface-sub text-ink border border-line hover:bg-surface-hover transition-colors"
            >
              <Home size={15} />
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
