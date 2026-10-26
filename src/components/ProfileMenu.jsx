// src/components/ProfileMenu.jsx
//
// Menu profil untuk layar ponsel — menampung kontrol yang di layar lebar
// berdiri sendiri di topbar: nama & peran, bahasa, tema, dan keluar.
//
// KENAPA PERLU. Diukur di layar 375px, baris topbar membutuhkan 534px untuk
// isinya. Kelebihan 159px itu tidak menggulir dan tidak melipat — ia mendorong
// isinya keluar layar, dan tiga hal ikut hilang sekaligus:
//
//   • judul halaman (<h1>) tergencet menjadi selebar 0px — tidak terbaca
//   • tombol tema tersisa 2px — praktis tidak bisa ditekan
//   • blok profil berada di 417–499px, seluruhnya di luar layar
//
// Yang terakhir itu bukan soal tampilan: tombol KELUAR ada di dalamnya, dan
// Sidebar maupun BottomNav tidak punya tombol keluar sama sekali. Artinya di
// ponsel tidak ada satu pun cara untuk logout.
//
// Menggantinya dengan satu tombol avatar menghemat sekitar 130px — cukup untuk
// mengembalikan judul halaman dan seluruh tombol ke dalam layar.
//
// Di layar >= sm menu ini disembunyikan dan topbar kembali memakai susunan
// aslinya, karena di sana ruangnya memang cukup dan kontrol yang langsung
// terlihat lebih cepat dijangkau daripada yang harus dibuka dulu.

import { useEffect, useRef, useState } from "react";
import { Globe, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { useTheme } from "../lib/ThemeContext";
import { useAnchoredPopup } from "../lib/useAnchoredPopup";
import { Badge } from "./ui";

const ROLE_LABEL = {
  admin:  { id: "Admin",  en: "Admin" },
  farmer: { id: "Petani", en: "Farmer" },
  buyer:  { id: "Buyer",  en: "Buyer" },
};
const ROLE_TONE = { admin: "brand", farmer: "good", buyer: "warn" };

export default function ProfileMenu({ className = "" }) {
  const { user, logout } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [terbuka, setTerbuka] = useState(false);
  const pemicuRef = useRef(null);
  const popupRef = useRef(null);
  const gelap = theme === "dark";

  useAnchoredPopup({ open: terbuka, anchorRef: pemicuRef, popupRef });

  useEffect(() => {
    if (!terbuka) return undefined;
    function tekanTombol(e) {
      if (e.key !== "Escape") return;
      // window + capture, sama alasannya seperti Select dan DateField: fase
      // capture berjalan dari luar ke dalam, jadi ini berjalan sebelum
      // penangkap Escape milik useModalA11y di document.
      e.stopPropagation();
      setTerbuka(false);
      pemicuRef.current?.focus();
    }
    function tekanTetikus(e) {
      if (pemicuRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }
    window.addEventListener("keydown", tekanTombol, true);
    document.addEventListener("mousedown", tekanTetikus);
    return () => {
      window.removeEventListener("keydown", tekanTombol, true);
      document.removeEventListener("mousedown", tekanTetikus);
    };
  }, [terbuka]);

  const barisKelas =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-brand-soft hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

  return (
    <div className={className}>
      <button
        ref={pemicuRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={terbuka}
        aria-label={user?.name ?? t("logout")}
        onClick={() => setTerbuka((v) => !v)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-surface transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        {user?.name?.[0]?.toUpperCase() ?? "?"}
      </button>

      {terbuka && (
        <div ref={popupRef} style={{ position: "fixed", top: 0, left: 0, zIndex: 70 }}>
          <div
            role="menu"
            className="gjr-pop-in w-56 rounded-2xl border border-line bg-surface p-1.5 shadow-2xl shadow-forest-950/15"
          >
            <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "—"}</p>
              <div className="mt-1">
                <Badge tone={ROLE_TONE[user?.role] ?? "neutral"}>
                  {ROLE_LABEL[user?.role]?.[lang] ?? user?.role}
                </Badge>
              </div>
            </div>

            <div className="pt-1.5">
              <button type="button" role="menuitem" className={barisKelas}
                onClick={() => { toggleLanguage(); setTerbuka(false); }}>
                <Globe size={15} className="shrink-0 text-brand" />
                <span className="flex-1 text-left">{t("language")}</span>
                <span className="font-mono-id text-xs font-bold text-ink-faint">
                  {lang === "id" ? "ID" : "EN"}
                </span>
              </button>

              <button type="button" role="menuitem" className={barisKelas}
                onClick={() => { toggleTheme(); setTerbuka(false); }}>
                {gelap ? <Sun size={15} className="shrink-0 text-warn" /> : <Moon size={15} className="shrink-0 text-brand" />}
                <span className="flex-1 text-left">{t("theme")}</span>
                <span className="text-xs text-ink-faint">
                  {gelap ? t("light_mode") : t("dark_mode")}
                </span>
              </button>

              <button type="button" role="menuitem"
                className={`${barisKelas} hover:bg-bad-soft hover:text-bad`}
                onClick={() => { setTerbuka(false); logout(); }}>
                <LogOut size={15} className="shrink-0" />
                <span className="flex-1 text-left">{t("logout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
