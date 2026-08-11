import { useState } from "react";
import { Leaf, PlusSquare, Award, LogOut, Users, Globe, Sun, Moon, TreePine } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ScanBarcodeButton from "./ScanBarcodeButton";
import SpeciesDetailModal from "./SpeciesDetailModal";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { useTheme } from "../lib/ThemeContext";

const ROLE_BADGE = {
  admin: "bg-forest-700 text-cream-50/80 dark:bg-forest-800 dark:text-cream-100",
  farmer: "bg-sage-500/30 text-sage-400 dark:bg-sage-500/40 dark:text-sage-300",
  buyer: "bg-gold-500/20 text-gold-500 dark:bg-gold-500/30 dark:text-gold-400",
};
const ROLE_LABEL = { admin: "Admin", farmer: "Petani", buyer: "Buyer" };

const ADMIN_NAV = [
  { to: "/generate-qr", label: "Generate QR", icon: PlusSquare },
  { to: "/sertifikat",  label: "Kelola Sertifikat", icon: Award },
  { to: "/pengguna",    label: "Kelola Pengguna", icon: Users },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const { lang, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);

  return (
    <>
      <header className="bg-forest-900 dark:bg-forest-950 text-cream-50 transition-colors shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <div className="bg-sage-500/20 rounded-xl p-2 shrink-0 group-hover:bg-sage-500/30 transition-colors">
              <Leaf size={22} className="text-sage-400" strokeWidth={2.2} />
            </div>
            <div className="leading-tight min-w-0">
              <h1 className="font-bold text-base md:text-lg tracking-tight">Giricahyo Carbon</h1>
              <p className="text-[11px] text-cream-50/55 hidden sm:block">Manajemen Bisnis Karbon Komunitas</p>
            </div>
          </Link>

          {/* Controls: Scan, Species Modal, Lang, Theme, User */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Catalog Modal Trigger */}
            <button
              onClick={() => setIsSpeciesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-800/80 hover:bg-forest-800 text-cream-50/90 text-xs font-semibold rounded-xl border border-cream-50/10 transition-colors"
              title={t("species_catalog")}
            >
              <TreePine size={14} className="text-gold-400" />
              <span className="hidden md:inline">{t("species_catalog")}</span>
            </button>

            <ScanBarcodeButton />

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-forest-800/80 hover:bg-forest-800 text-xs font-bold text-cream-50/90 rounded-xl border border-cream-50/10 transition-colors"
              title="Ganti Bahasa (ID / EN)"
            >
              <Globe size={13} className="text-sage-400" />
              <span>{lang === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-forest-800/80 hover:bg-forest-800 text-gold-400 rounded-xl border border-cream-50/10 transition-colors"
              title="Ganti Tema (Gelap / Terang)"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* User Badge & Logout */}
            <div className="flex items-center gap-2 pl-3 border-l border-cream-50/15">
              <div className="hidden lg:block leading-tight text-right">
                <p className="text-sm font-semibold">{user?.name}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE[user?.role]}`}>
                  {ROLE_LABEL[user?.role]}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-sage-500 flex items-center justify-center text-xs font-bold text-forest-950 shrink-0">
                {user?.name?.[0] ?? "?"}
              </div>
              <button
                onClick={logout}
                title={t("logout")}
                className="text-cream-50/40 hover:text-cream-50 transition-colors p-1"
                aria-label={t("logout")}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Baris navigasi khusus admin */}
        {user?.role === "admin" && (
          <div className="border-t border-cream-50/10">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center gap-1 overflow-x-auto">
              {ADMIN_NAV.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                      active
                        ? "border-gold-500 text-cream-50"
                        : "border-transparent text-cream-50/55 hover:text-cream-50/85"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Species Detail Modal */}
      <SpeciesDetailModal
        isOpen={isSpeciesModalOpen}
        onClose={() => setIsSpeciesModalOpen(false)}
      />
    </>
  );
}
