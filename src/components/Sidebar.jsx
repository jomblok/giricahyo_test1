// src/components/Sidebar.jsx
//
// Sidebar persisten yang bisa diciutkan jadi ikon-saja. Di layar kecil ia
// berubah jadi drawer yang dipanggil dari topbar.

import { NavLink } from "react-router-dom";
import { Leaf, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { navFor } from "../lib/navConfig";
import { pramuat } from "../lib/halaman";
import { IconButton } from "./ui";
import { ModalPortal } from './ui/ModalPortal';

function NavItem({ item, collapsed, onNavigate }) {
  const { t } = useLanguage();
  const label = t(item.key);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      // Berkas halamannya mulai diunduh begitu kursor tiba atau menu disentuh
      // (lihat lib/halaman.js), bukan setelah diklik.
      onMouseEnter={() => pramuat(item.to)}
      onFocus={() => pramuat(item.to)}
      onTouchStart={() => pramuat(item.to)}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          isActive
            ? "bg-sidebar-active text-sidebar-active-ink font-semibold"
            : "text-sidebar-ink-muted hover:text-sidebar-ink hover:bg-sidebar-active/50",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Penanda aktif di tepi kiri — terbaca juga saat menu diciutkan */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full transition-all ${
              isActive ? "h-5 bg-sidebar-active-ink" : "h-0 bg-transparent"
            }`}
          />
          <item.icon size={17} className="shrink-0" strokeWidth={isActive ? 2.3 : 2} />
          {/* Tanpa `truncate`: "Perbandingan Kelompok" butuh 166px sementara
              kolomnya 158px, jadi label menu terpotong 8px. Label navigasi
              yang terpotong membuat pengguna menebak isi halamannya — lebih
              baik membungkus dua baris. leading-snug menjaga jaraknya tetap
              rapat saat itu terjadi. */}
          {!collapsed && <span className="leading-snug">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();


  const { t } = useLanguage();
  const items = navFor(user?.role);

  const main = items.filter((i) => i.group === "main");
  const manage = items.filter((i) => i.group === "manage");

  const inner = (isMobile) => {
    const isCollapsed = isMobile ? false : collapsed;
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center gap-2.5 h-16 shrink-0 ${isCollapsed ? "justify-center px-2" : "px-4"}`}>
          <div className="bg-sidebar-active rounded-xl p-2 shrink-0">
            <Leaf size={20} className="text-sidebar-ink" strokeWidth={2.2} />
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0">
              <p className="font-bold text-sm text-sidebar-ink truncate">Giricahyo Carbon</p>
              <p className="text-[10px] text-sidebar-ink-muted truncate">Manajemen Bisnis Karbon</p>
            </div>
          )}
          {isMobile && (
            <IconButton icon={X} label={t("close_menu")} onClick={onCloseMobile} className="ml-auto" />
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1" aria-label="Menu utama">
          {!isCollapsed && main.length > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-ink-muted px-3 pt-2 pb-1.5">
              {t("nav_group_main")}
            </p>
          )}
          {main.map((item) => (
            <NavItem key={item.to} item={item} collapsed={isCollapsed} onNavigate={isMobile ? onCloseMobile : undefined} />
          ))}

          {manage.length > 0 && (
            <>
              {!isCollapsed ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-ink-muted px-3 pt-4 pb-1.5">
                  {t("nav_group_manage")}
                </p>
              ) : (
                <div className="h-px bg-sidebar-line my-3 mx-2" />
              )}
              {manage.map((item) => (
                <NavItem key={item.to} item={item} collapsed={isCollapsed} onNavigate={isMobile ? onCloseMobile : undefined} />
              ))}
            </>
          )}
        </nav>

        {/* Tombol ciutkan — hanya di desktop */}
        {!isMobile && (
          <div className="shrink-0 border-t border-sidebar-line p-2.5">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
              title={collapsed ? t("expand_sidebar") : t("collapse_sidebar")}
              className={`flex items-center gap-3 w-full rounded-xl px-3 py-2 text-xs font-medium text-sidebar-ink-muted hover:text-sidebar-ink hover:bg-sidebar-active/50 transition-colors ${
                collapsed ? "justify-center px-2" : ""
              }`}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              {!collapsed && <span>{t("collapse_sidebar")}</span>}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-line transition-[width] duration-200 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        {inner(false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <ModalPortal onClose={onCloseMobile}>
          <div className="gjr-overlay-in lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onCloseMobile} />
            <aside className="gjr-drawer-l absolute inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-line shadow-2xl">
              {inner(true)}
            </aside>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
