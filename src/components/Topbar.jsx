// src/components/Topbar.jsx
//
// Menggantikan Header.jsx lama. Semua tombol yang dulu ada tetap ada —
// katalog jenis pohon, scan barcode, bahasa, tema, profil, logout — ditambah
// pencarian global, notifikasi, filter periode, dan mode presentasi.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Globe, LogOut, TreePine, Presentation } from "lucide-react";
import ScanBarcodeButton from "./ScanBarcodeButton";
import SearchPalette from "./SearchPalette";
import NotificationsBell from "./NotificationsBell";
import OfflineIndicator from "./OfflineIndicator";
import PeriodFilter from "./PeriodFilter";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { usePresentation } from "../lib/PresentationContext";
import { ROLE_LABEL, ROLE_TONE } from "../lib/navConfig";
import { Badge, IconButton, ThemeSwitch } from "./ui";
import ProfileMenu from "./ProfileMenu";

export default function Topbar({ title, onOpenMobileNav, showPeriod = true }) {
  const { user, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { enter: enterPresentation } = usePresentation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl/⌘ + K membuka pencarian dari mana pun.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur border-b border-line">
        {/* ANGGARAN LEBAR — baca sebelum menambah kontrol ke baris ini.
            Lebar yang tersedia BUKAN lebar layar: sejak lg, sidebar memakan
            240px. Pada 1024px baris ini cuma punya ~784px; pada 1280px ~1040px.
            Judul halaman satu-satunya item yang bisa menyusut, jadi setiap
            kelebihan langsung diserap olehnya sampai 0px — tanpa peringatan
            apa pun. Karena itu kontrol yang boros ruang dinyalakan bertahap:
              sm  (640)  ikon Katalog, ikon Scan
              lg  (1024) bahasa, tema, blok profil
              xl  (1280) PeriodFilter, label Scan
              2xl (1536) label Katalog, nama pengguna
            Setiap kali menambah sesuatu, ukur ulang sisa ruangnya di 1024,
            1280, dan 1440 — bukan cuma di layar sendiri. */}
        <div className="h-16 flex items-center gap-2 px-4 md:px-6">
          <IconButton icon={Menu} label={t("open_menu")} onClick={onOpenMobileNav} className="lg:hidden" />

          {/* Judul halaman: satu-satunya momen editorial di kerangka aplikasi,
              jadi memakai serif display yang sama dengan halaman login —
              mengikat keduanya sebagai satu identitas. Ukurannya dinaikkan dari
              16px (kekecilan untuk sebuah H1) ke 20px.
              SENGAJA tidak diterapkan ke angka, tabel, atau label: di alat
              kerja berbasis data, serif yang berkarakter justru memperlambat
              pembacaan. Kemewahan di sini datang dari menahan diri. */}
          {/* Judul MEMBUNGKUS dua baris di layar sempit, bukan dipotong.
              Di ponsel bilah atas hanya menyisakan ~116px untuk judul setelah
              menu, cari, pindai, notifikasi, dan profil — dan "Daftarkan
              Pohon" butuh 158px. Dipotong jadi "Daftarkan ...", yang tidak
              memberi tahu apa pun; dua baris memberi judul utuh. */}
          <h1 className="gjr-display text-base sm:text-xl font-bold text-ink leading-tight line-clamp-2 mr-auto">{title}</h1>

          {/* Pemicu pencarian: kotak di layar lebar, ikon saja di layar sempit */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label={t("search_global")}
            className="hidden md:flex items-center gap-2 h-9 pl-3 pr-2 rounded-xl border border-line bg-surface-sub text-ink-faint hover:text-ink-muted hover:border-line-strong transition-colors w-40 2xl:w-52"
          >
            <Search size={14} className="shrink-0" />
            <span className="text-xs truncate">{t("search_global")}…</span>
            <kbd className="ml-auto text-[10px] font-mono-id bg-surface border border-line rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
          </button>
          <IconButton icon={Search} label={t("search_global")} onClick={() => setSearchOpen(true)} className="md:hidden" />

          {showPeriod && <PeriodFilter />}

          {user?.role === "admin" && (
          <Link
            to="/jenis-pohon"
            title={t("species_catalog")}
            className="hidden 2xl:inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-line bg-surface-sub text-ink-muted hover:text-ink text-xs font-semibold transition-colors"
          >
            <TreePine size={14} className="text-warn" />
            <span>{t("species_catalog")}</span>
          </Link>
          )}
          {/* Hanya admin. Rutenya memang admin-saja (lihat App.jsx), tapi
              tautannya dulu tampil untuk semua peran — petani atau buyer yang
              menekannya langsung ditolak. Di ponsel disembunyikan juga karena
              admin sudah punya Katalog Pohon di navigasi bawah, dan 41px yang
              dihemat itulah yang mengembalikan judul halaman ke ukuran terbaca. */}
          {user?.role === "admin" && (
            <IconButton as={Link} to="/jenis-pohon" icon={TreePine} label={t("species_catalog")} className="hidden sm:inline-flex 2xl:hidden" />
          )}

          <ScanBarcodeButton />

          {/* Sebelum lonceng: status jaringan lebih mendesak daripada
              notifikasi. Komponennya menyembunyikan diri saat daring dan
              antrean kosong, jadi tidak menambah kebisingan. */}
          <OfflineIndicator />
          <NotificationsBell />

          {user?.role === "admin" && (
            <IconButton
              icon={Presentation}
              label={t("presentation_mode")}
              onClick={enterPresentation}
              className="hidden md:inline-flex"
            />
          )}

          <button
            type="button"
            onClick={toggleLanguage}
            title={t("language")}
            aria-label={t("language")}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 h-9 rounded-xl border border-line bg-surface-sub text-ink-muted hover:text-ink text-xs font-bold transition-colors"
          >
            <Globe size={13} className="text-brand" />
            <span>{lang === "id" ? "ID" : "EN"}</span>
          </button>

          {/* Dibungkus <span>, BUKAN diberi className="hidden".
              ThemeSwitch menuliskan `inline-flex` di daftar kelasnya sendiri,
              dan dua utility display yang bertabrakan tidak diputuskan oleh
              urutan penulisan di atribut class melainkan oleh urutan aturannya
              di berkas CSS — jadi `hidden` kalah dan tombolnya tetap tampil,
              tergencet jadi 19px. Pembungkus memisahkan keduanya. */}
          <span className="hidden lg:inline-flex">
            <ThemeSwitch label={t("theme")} />
          </span>

          {/* Di ponsel keempat kontrol ini (nama, bahasa, tema, keluar) pindah
              ke ProfileMenu — lihat catatan pengukurannya di berkas itu. */}
          <ProfileMenu className="lg:hidden" />

          {/* Profil & logout */}
          <div className="hidden lg:flex items-center gap-2 pl-2 ml-1 border-l border-line">
            {/* Nama + peran baru muncul di 2xl (>=1536px), bukan xl (>=1280).
                Terukur di 1440px: baris topbar cuma 1200px (sidebar memakan
                240px) sementara isinya butuh 1196px — sisa 4px, dan judul
                halaman ikut tergencet jadi 107px dari 136px yang dibutuhkan.
                Blok ini 209px dengan nama, 77px tanpanya; memindahkannya satu
                breakpoint mengembalikan 132px ke judul. Di bawah 2xl identitas
                penggunanya tetap terbaca dari inisial pada avatar. */}
              <div className="hidden 2xl:block leading-tight text-right">
              <p className="text-[13px] font-semibold text-ink truncate max-w-[10rem]">{user?.name}</p>
              <Badge tone={ROLE_TONE[user?.role] ?? "neutral"}>
                {ROLE_LABEL[user?.role]?.[lang] ?? user?.role}
              </Badge>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-surface shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <IconButton icon={LogOut} label={t("logout")} onClick={logout} />
          </div>
        </div>
      </header>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
