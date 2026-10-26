// src/pages/NotFoundPage.jsx
//
// Sebelumnya route "*" langsung redirect ke "/", jadi salah ketik URL dan
// tautan rusak tidak pernah ketahuan — halaman diam-diam melempar ke dashboard.

import { Link, useLocation } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const { lang } = useLanguage();
  const id = lang !== "en";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ground">
      <div className="text-center max-w-md">
        <div className="inline-flex rounded-2xl bg-surface border border-line p-4 mb-5 shadow-sm">
          <Compass size={28} className="text-ink-faint" strokeWidth={1.6} />
        </div>

        {/* text-ink-faint, bukan text-line-strong. Semula memakai warna GARIS
            sebagai warna teks, yang terukur 1,23 — jauh di bawah ambang 3,0
            untuk teks besar, dan praktis tidak terbaca. Angka ini satu-satunya
            yang memberi tahu JENIS kesalahannya; judul di bawahnya hanya
            bilang halamannya tidak ada. Orang yang melaporkan masalah ini ke
            pengurus perlu bisa menyebut angkanya. */}
        <p className="font-mono-id text-5xl font-bold text-ink-faint mb-3 tabular">404</p>

        <h1 className="text-lg font-bold text-ink mb-2">
          {id ? "Halaman ini tidak ada" : "This page doesn't exist"}
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          {id
            ? "Alamat yang kamu buka tidak cocok dengan halaman mana pun."
            : "The address you opened doesn't match any page."}
        </p>

        <p className="mt-3 inline-block font-mono-id text-[11px] text-ink-faint bg-surface-sub border border-line rounded-lg px-2.5 py-1 max-w-full truncate">
          {pathname}
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-brand text-surface hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={15} />
            {id ? "Kembali ke Dashboard" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}
