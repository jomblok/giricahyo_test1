// src/lib/useAnchoredPopup.js
//
// Menempelkan sebuah popup pada elemen pemicunya, di koordinat layar.
//
// Diangkat dari DateField setelah pemilih daftar (Select) membutuhkan
// perhitungan yang persis sama. Bukan sekadar menghindari salin-tempel: bagian
// tersulitnya — koreksi blok penampung di bawah — ditemukan lewat pengukuran
// yang memakan waktu, dan menggandakannya berarti perbaikan berikutnya harus
// diingat untuk dikerjakan dua kali.
//
// Semua penulisan gaya dilakukan langsung ke node lewat ref, bukan lewat
// useState: fungsi ini dipanggil pada setiap gulir, dan menyimpan hasilnya di
// state berarti komponennya di-render ulang puluhan kali per detik hanya untuk
// menggeser satu kotak.

import { useCallback, useLayoutEffect } from "react";

const RENGGANG = 8;

/**
 * @param {object}  opsi
 * @param {boolean} opsi.open
 * @param {{current: HTMLElement|null}} opsi.anchorRef  elemen pemicu
 * @param {{current: HTMLElement|null}} opsi.popupRef   pembungkus LUAR popup —
 *        harus tanpa transform sendiri (lihat catatan koreksi di bawah)
 * @param {boolean} [opsi.matchAnchorWidth]  popup minimal selebar pemicunya
 * @param {*}       [opsi.revision]  nilai apa pun yang berubah ketika ISI popup
 *        berganti tinggi (mis. tampilan hari→bulan pada kalender), supaya
 *        posisinya dihitung ulang
 */
export function useAnchoredPopup({
  open,
  anchorRef,
  popupRef,
  matchAnchorWidth = false,
  revision = null,
}) {
  const tempatkan = useCallback(() => {
    const jangkar = anchorRef.current;
    const pop = popupRef.current;
    if (!jangkar || !pop) return;

    const r = jangkar.getBoundingClientRect();
    if (matchAnchorWidth) pop.style.minWidth = `${Math.round(r.width)}px`;

    // DIUKUR, bukan angka tetap: tinggi popup berubah menurut isinya (jumlah
    // pilihan, tampilan kalender yang sedang aktif), dan angka tetap apa pun
    // akan basi begitu isinya diubah sedikit. offsetHeight/offsetWidth dipakai
    // — bukan getBoundingClientRect — karena keduanya nilai tata letak murni
    // yang tidak ikut mengecil selagi animasi scale(.97) masih berjalan.
    const tinggi = pop.offsetHeight || 0;
    const lebar = pop.offsetWidth || 0;
    const layarT = window.innerHeight;
    const layarL = window.innerWidth;

    const ruangBawah = layarT - r.bottom - RENGGANG * 2;
    const ruangAtas = r.top - RENGGANG * 2;

    let atas;
    if (tinggi <= ruangBawah) {
      atas = r.bottom + RENGGANG;              // muat di bawah — pilihan utama
    } else if (tinggi <= ruangAtas) {
      atas = r.top - RENGGANG - tinggi;        // tidak muat di bawah, muat di atas
    } else {
      // Tidak muat di kedua sisi. Ditempel ke sisi yang lebih lega lalu dijepit
      // ke dalam layar: menutupi sebagian pemicunya lebih baik daripada
      // separuh isinya terpotong keluar layar.
      atas = ruangBawah >= ruangAtas ? r.bottom + RENGGANG : r.top - RENGGANG - tinggi;
      atas = Math.max(RENGGANG, Math.min(atas, layarT - tinggi - RENGGANG));
    }

    const kiri = Math.max(RENGGANG, Math.min(r.left, layarL - lebar - RENGGANG));

    pop.style.top = `${Math.round(atas)}px`;
    pop.style.left = `${Math.round(kiri)}px`;

    // ── Koreksi blok penampung ────────────────────────────────────────────
    // `position: fixed` seharusnya diukur terhadap layar, TAPI hanya selama
    // tidak ada satu pun leluhur yang punya transform / filter /
    // backdrop-filter / perspective / contain. Begitu ada, leluhur itu jadi
    // blok penampung baru dan koordinat yang barusan ditulis diukur dari
    // pojoknya, bukan dari pojok layar.
    //
    // Ini bukan kemungkinan teoretis di proyek ini: panel modal memakai
    // animasi ber-transform selama 0,28 detik pertama, dan membuka modal lalu
    // langsung mengklik kolomnya membuat popup melompat ratusan piksel
    // (terukur: selisih 442px mendatar di modal Pemasukan Dana).
    // ModalPortal.jsx mencatat dua kejadian sejenis sebelumnya.
    //
    // Daripada menambal satu per satu, selisihnya diukur langsung lalu
    // dikurangi. Berlaku untuk blok penampung APA PUN, termasuk yang belum ada
    // hari ini. Diulang beberapa kali karena blok penampung bisa ikut
    // MENSKALA: di dalam kotak scale(.98), menggeser sejauh X hanya
    // memindahkan 0,98·X di layar, jadi satu koreksi menyisakan sekitar 2%.
    // Tiga putaran membuat sisanya di bawah setengah piksel, dan putarannya
    // berhenti lebih awal begitu sudah pas — pada keadaan normal (tanpa blok
    // penampung sama sekali) putaran pertama langsung berhenti.
    let sisaX = 0;
    let sisaY = 0;
    for (let i = 0; i < 3; i += 1) {
      const nyata = pop.getBoundingClientRect();
      const dy = nyata.top - atas;
      const dx = nyata.left - kiri;
      if (Math.abs(dy) < 0.5 && Math.abs(dx) < 0.5) break;
      sisaY += dy;
      sisaX += dx;
      pop.style.top = `${atas - sisaY}px`;
      pop.style.left = `${kiri - sisaX}px`;
    }
  }, [anchorRef, popupRef, matchAnchorWidth]);

  // useLayoutEffect, bukan useEffect: penempatan harus selesai SEBELUM lukisan
  // pertama, kalau tidak popupnya sempat tergambar di pojok kiri atas layar.
  useLayoutEffect(() => {
    if (!open) return undefined;
    tempatkan();
    // capture: true supaya gulir di dalam panel modal (yang tidak menggelembung
    // sampai ke window) tetap tertangkap.
    window.addEventListener("scroll", tempatkan, true);
    window.addEventListener("resize", tempatkan);
    return () => {
      window.removeEventListener("scroll", tempatkan, true);
      window.removeEventListener("resize", tempatkan);
    };
  }, [open, tempatkan, revision]);
}

export default useAnchoredPopup;
