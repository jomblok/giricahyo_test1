// src/components/ui/ThemeSwitch.jsx
//
// Tombol ganti tema dengan sapuan lingkaran (View Transitions API).
// Animasi ikonnya diadaptasi dari komponen "theme-switch-button" (aslinya TSX
// + shadcn); pengelolaan temanya TIDAK diambil — lihat catatan di bawah.
//
// KENAPA TIDAK MEMAKAI STATE SENDIRI seperti versi aslinya: proyek ini sudah
// punya ThemeContext dengan kunci "gjr_theme". Dua pengelola tema sekaligus
// membuat (1) preferensi tersimpan pengguna terabaikan karena kuncinya beda,
// dan (2) TreeMap.jsx yang membaca `theme` dari useTheme() tetap di tema lama
// saat sisa halaman berganti. Jadi sumber kebenarannya tetap satu.

import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";

export function ThemeSwitch({ className = "", label = "Tema" }) {
  const { theme, toggleTheme } = useTheme();
  const btnRef = useRef(null);
  const isDark = theme === "dark";

  const handleClick = useCallback(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // View transition hanya bisa memotret dokumen yang sedang dirender. Kalau
    // tabnya di latar belakang atau jendelanya tersembunyi, browser
    // menggugurkannya dengan InvalidStateError — dan karena kegagalan itu baru
    // diketahui setelah temanya terlanjur berganti, tidak ada lagi kesempatan
    // menganimasikan apa pun: pengguna dapat kedipan kasar. Jadi kondisinya
    // diperiksa DI DEPAN, lalu dialihkan ke jalur pudar yang tetap halus.
    const bisaSapuan =
      typeof document.startViewTransition === "function" &&
      document.visibilityState === "visible";

    // Browser tanpa View Transitions (Firefox lama, Safari < 18) tetap dapat
    // perpindahan warna yang halus lewat class sementara di <html>; yang hilang
    // hanya sapuan lingkarannya, bukan kehalusannya.
    if (reduceMotion || !bisaSapuan) {
      // CATATAN: pengguna dengan prefers-reduced-motion TETAP mendapat pudar
      // warna, hanya sapuan lingkarannya yang dilewati.
      //
      // Preferensi itu soal GERAK — geseran, zoom, parallax — yang memicu
      // vertigo dan mabuk gerak. Pudar warna tidak menggerakkan apa pun.
      // Sebaliknya, kedipan satu layar penuh yang mendadak justru lebih
      // berisiko bagi pengguna sensitif cahaya. Versi sebelumnya di sini
      // langsung membalik tanpa apa pun, dan hasilnya persis keluhan yang
      // ingin diperbaiki: pergantian yang terasa kasar.
      const root = document.documentElement;
      root.classList.add("gjr-theme-fading");
      // Sedikit lebih lama dari durasi transisi (500ms) supaya class-nya tidak
      // dilepas saat animasi masih berjalan — kalau itu terjadi, warnanya
      // meloncat ke nilai akhir di tengah jalan.
      window.setTimeout(() => root.classList.remove("gjr-theme-fading"), 560);
      toggleTheme();
      return;
    }

    // Titik pusat diambil dari posisi TOMBOL, bukan dari koordinat kursor.
    // Kalau memakai event.clientX, pengguna keyboard yang menekan Enter/Spasi
    // mendapat koordinat (0,0) dan lingkarannya menyapu dari pojok kiri atas —
    // terlihat seperti kesalahan, bukan animasi.
    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Radius akhir = jarak ke sudut layar TERJAUH dari titik itu. Kalau kurang,
    // sapuannya berhenti sebelum menutupi layar dan menyisakan potongan tema
    // lama di sudut.
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      // flushSync memaksa React menyelesaikan render + layout effect secara
      // sinkron di dalam callback ini. Tanpa itu, potret "sesudah" diambil
      // sebelum class `dark` sempat terpasang, dan animasinya menampilkan dua
      // keadaan yang identik — terlihat seperti tidak terjadi apa-apa.
      // (ThemeContext sengaja memakai useLayoutEffect agar ini bekerja.)
      flushSync(() => toggleTheme());
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 620,
            // Cepat di awal lalu melambat — terbaca sebagai sapuan yang
            // "mendarat", bukan lingkaran yang membesar dengan laju tetap.
            easing: "cubic-bezier(.22, .61, .36, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      // Kalau transisinya dibatalkan (mis. pengguna mengklik cepat dua kali),
      // temanya sudah terlanjur berganti dan itu tidak apa-apa — yang batal
      // hanya animasinya. Ditangkap supaya tidak jadi unhandled rejection.
      .catch(() => {});
  }, [toggleTheme]);

  // Kedua ikon selalu ada di DOM dan ditumpuk; yang berganti skala, rotasi,
  // dan opasitasnya. Kalau ikonnya dibongkar-pasang (render bersyarat), tidak
  // ada yang bisa dianimasikan — kekurangan tombol tema yang lama.
  const iconCls = (active) =>
    "absolute h-[18px] w-[18px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
    (active
      ? "scale-100 rotate-0 opacity-100"
      : "scale-50 -rotate-90 opacity-0");

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      aria-label={label}
      // aria-pressed memberi tahu pembaca layar ini sakelar dua keadaan,
      // bukan tombol aksi biasa.
      aria-pressed={isDark}
      title={label}
      className={[
        // Disamakan dengan IconButton di toolbar yang sama supaya tidak
        // berdiri sendiri sebagai lingkaran di antara tombol persegi.
        "relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl",
        "border border-transparent bg-transparent text-ink-muted",
        "transition-colors hover:bg-surface-hover hover:text-ink",
        className,
      ].filter(Boolean).join(" ")}
    >
      <Sun className={iconCls(!isDark)} strokeWidth={2} />
      <Moon className={iconCls(isDark)} strokeWidth={2} />
    </button>
  );
}

export default ThemeSwitch;
