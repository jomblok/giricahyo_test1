// src/components/AppShell.jsx
//
// Kerangka aplikasi: sidebar + topbar + area konten. Menggantikan pola lama
// di mana setiap halaman memanggil <Header /> sendiri dan isinya satu kolom
// panjang tanpa navigasi.

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import HakCipta from "./HakCipta";
import { usePresentation } from "../lib/PresentationContext";

const COLLAPSE_KEY = "gjr_sidebar_collapsed";

export default function AppShell({ title, children, showPeriod = true, wide = false }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { active: presenting } = usePresentation();
  const { pathname } = useLocation();

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* mode privat */ }
  }, [collapsed]);

  // Judul halaman ikut ke tab browser — sebelumnya selalu "giricahyo-dashboard".
  useEffect(() => {
    if (title) document.title = `${title} · Giricahyo Carbon`;
  }, [title]);

  // Pindah halaman seharusnya mulai dari atas, bukan melanjutkan posisi scroll
  // halaman sebelumnya.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  // Saat presentasi, kerangka disembunyikan sepenuhnya.
  if (presenting) {
    return <div className="min-h-screen bg-ground">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-ground">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[68px]" : "lg:pl-60"}`}>
        <Topbar
          title={title}
          onOpenMobileNav={() => setMobileOpen(true)}
          showPeriod={showPeriod}
        />
        <main
          key={pathname}
          className={`gjr-page px-4 md:px-6 py-6 pb-24 lg:pb-6 ${wide ? "" : "max-w-[1600px] mx-auto"}`}
        >
          {children}
          <HakCipta className="mt-10" />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
