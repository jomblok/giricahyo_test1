// src/dev/audit/pemeriksa.js — daftar pemeriksaan tampilan.
//
// MENAMBAH PEMERIKSAAN BARU: tulis satu objek dengan { id, nama, jalankan },
// lalu masukkan ke array PEMERIKSA di bawah. `jalankan` mengembalikan array
// temuan — pakai helper temuan() supaya bentuknya seragam. Tidak ada yang
// perlu diubah di panelnya.
//
// ATURAN YANG MEMBUAT PEMERIKSA BERGUNA: lebih baik melewatkan satu masalah
// daripada melaporkan sepuluh yang palsu. Daftar temuan yang separuhnya palsu
// akan diabaikan seluruhnya, dan yang hilang justru masalah yang sungguhan.
// Setiap pengecualian di bawah ada karena sebuah temuan palsu yang nyata.

import {
  PARAH,
  dalamWadahTerkendali,
  elemenTeks,
  rasioKontras,
  temuan,
  terlihat,
} from "./inti";

const MIN_SENTUH = 44; // Apple HIG & WCAG 2.2 AAA
const MIN_TEKS = 11;

/* ───────────────────────────── warna ───────────────────────────── */

const kontras = {
  id: "kontras",
  nama: "Kontras teks",
  keterangan: "Rasio kontras WCAG AA: 4,5:1 untuk teks biasa, 3:1 untuk teks besar.",
  jalankan() {
    const hasil = [];
    for (const el of elemenTeks()) {
      const s = getComputedStyle(el);
      const px = parseFloat(s.fontSize);
      const tebal = (parseInt(s.fontWeight) || 400) >= 700;
      const besar = px >= 24 || (px >= 18.66 && tebal);
      const ambang = besar ? 3 : 4.5;
      const { rasio, depan, latar } = rasioKontras(el);
      if (rasio < ambang) {
        hasil.push(
          temuan({
            el,
            pesan: `Kontras ${rasio.toFixed(2)} (butuh ${ambang})`,
            detail: `${depan} di atas ${latar}, ${px}px`,
            parah: rasio < 3 ? PARAH.tinggi : PARAH.sedang,
          })
        );
      }
    }
    return hasil;
  },
};

/* ──────────────────────────── tata letak ──────────────────────────── */

const geserMendatar = {
  id: "geser",
  nama: "Geser mendatar",
  keterangan: "Halaman yang bisa digeser ke samping — isi di tepi kanan jadi tak terlihat.",
  jalankan() {
    // Diuji dengan BENAR-BENAR menggeser. Membandingkan scrollWidth dengan
    // clientWidth ikut menghitung lebar bilah gulir dan sering berbohong —
    // kesalahan itu sempat membuat dua "temuan" palsu di proyek ini.
    const d = document.documentElement;
    const awal = d.scrollLeft;
    d.scrollLeft = 9999;
    const sejauh = d.scrollLeft - awal;
    d.scrollLeft = awal;
    return sejauh > 0
      ? [
          temuan({
            el: document.body,
            pesan: `Halaman bisa digeser ${sejauh}px ke samping`,
            detail: `lebar dokumen ${d.scrollWidth}px, layar ${d.clientWidth}px`,
            parah: PARAH.tinggi,
          }),
        ]
      : [];
  },
};

const teksTerpotong = {
  id: "terpotong",
  nama: "Teks terpotong",
  keterangan: "Teks yang terpenggal, baik mendatar (truncate) maupun menurun (line-clamp).",
  jalankan() {
    // DUA ARAH, bukan satu.
    //
    // Semula pemeriksa ini hanya membandingkan lebar, sehingga hanya melihat
    // `truncate`. Itu meninggalkan lubang: `line-clamp-N` memenggal secara
    // MENURUN — teksnya membungkus beberapa baris lalu dipotong di baris ke-N
    // — dan lebarnya tidak pernah melampaui kotaknya. Audit melaporkan bersih
    // pada kartu bertuliskan "Johar (belum teridentifikasi…", yang justru
    // kehilangan keterangan bahwa jenisnya belum dipastikan.
    //
    // Ambang tingginya 2px, bukan 1: tinggi baris pecahan membuat scrollHeight
    // kerap lebih besar satu piksel dari clientHeight tanpa ada yang terpenggal.
    return elemenTeks()
      .map((el) => {
        const mendatar = el.scrollWidth > el.clientWidth + 1;
        const menurun  = el.scrollHeight > el.clientHeight + 2;
        if (!mendatar && !menurun) return null;
        return temuan({
          el,
          pesan: "Teks terpotong",
          detail: mendatar
            ? `butuh ${el.scrollWidth}px, tersedia ${el.clientWidth}px`
            : `terpenggal menurun: butuh ${el.scrollHeight}px, tersedia ${el.clientHeight}px`,
          parah: PARAH.sedang,
        });
      })
      .filter(Boolean);
  },
};

const luberLayar = {
  id: "luber",
  nama: "Luber keluar layar",
  keterangan: "Elemen yang tepi kanannya melewati lebar layar.",
  jalankan() {
    const lebar = document.documentElement.clientWidth;
    return [...document.querySelectorAll("*")]
      .filter(terlihat)
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.right > lebar + 1 && r.width < lebar * 3 && !dalamWadahTerkendali(e);
      })
      .map((el) =>
        temuan({
          el,
          pesan: "Luber keluar layar",
          detail: `tepi kanan ${Math.round(el.getBoundingClientRect().right)}px, layar ${lebar}px`,
          parah: PARAH.tinggi,
        })
      );
  },
};

const targetSentuh = {
  id: "sentuh",
  nama: "Target sentuh",
  keterangan: `Tombol dan tautan di bawah ${MIN_SENTUH}px — patokan jari, hanya diperiksa di layar sentuh.`,
  jalankan() {
    // Hanya relevan untuk jari. Di layar dengan tetikus, tombol padat justru
    // yang diinginkan, jadi memeriksanya di sana hanya menghasilkan kebisingan.
    if (!matchMedia("(pointer: coarse)").matches) return [];
    return [...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')]
      .filter(terlihat)
      .filter((e) => !e.closest(".leaflet-control-attribution"))
      .filter((e) => e.getBoundingClientRect().height < MIN_SENTUH)
      .map((el) =>
        temuan({
          el,
          pesan: `Target sentuh ${Math.round(el.getBoundingClientRect().height)}px`,
          detail: `minimal ${MIN_SENTUH}px untuk jari`,
          parah: PARAH.sedang,
        })
      );
  },
};

const teksKecil = {
  id: "teks-kecil",
  nama: "Teks terlalu kecil",
  keterangan: `Di bawah ${MIN_TEKS}px sulit dibaca di ponsel, apalagi di bawah sinar matahari.`,
  jalankan() {
    if (!matchMedia("(max-width: 640px)").matches) return [];
    return elemenTeks()
      .filter((e) => (e.textContent || "").trim().length > 2)
      .filter((e) => !e.closest(".leaflet-control-attribution"))
      .filter((e) => parseFloat(getComputedStyle(e).fontSize) < MIN_TEKS)
      .map((el) =>
        temuan({
          el,
          pesan: `Teks ${parseFloat(getComputedStyle(el).fontSize)}px`,
          detail: `minimal ${MIN_TEKS}px di ponsel`,
          parah: PARAH.rendah,
        })
      );
  },
};

const tertutupNav = {
  id: "tertutup-nav",
  nama: "Tertutup navigasi bawah",
  keterangan: "Isi yang tertimbun bilah navigasi melayang dan tidak bisa dijangkau.",
  jalankan() {
    const nav = [...document.querySelectorAll("nav,div")].find((e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return s.position === "fixed" && r.bottom >= innerHeight - 2 && r.height > 30;
    });
    if (!nav) return [];
    const atas = nav.getBoundingClientRect().top;
    const d = document.documentElement;
    const gulirAwal = d.scrollTop;
    d.scrollTop = d.scrollHeight; // periksa pada keadaan tergulir paling bawah
    const hasil = [...document.querySelectorAll('button,a[href],td,input,[role="button"]')]
      .filter(terlihat)
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > atas && !nav.contains(e) && !dalamWadahTerkendali(e);
      })
      .map((el) =>
        temuan({
          el,
          pesan: "Tertimbun navigasi bawah",
          detail: `tepi bawah ${Math.round(el.getBoundingClientRect().bottom)}px, nav mulai ${Math.round(atas)}px`,
          parah: PARAH.tinggi,
        })
      );
    d.scrollTop = gulirAwal;
    return hasil;
  },
};

/* ────────────────────────── aksesibilitas ────────────────────────── */

const gambarTanpaAlt = {
  id: "alt",
  nama: "Gambar tanpa keterangan",
  keterangan: "Gambar tanpa alt tidak terbaca pembaca layar, dan kosong saat gagal dimuat.",
  jalankan() {
    return [...document.querySelectorAll("img")]
      .filter(terlihat)
      // Ubin peta dan ikon hias memang tidak perlu keterangan.
      .filter((e) => !e.closest(".leaflet-container") && e.getAttribute("alt") === null)
      .map((el) =>
        temuan({
          el,
          pesan: "Gambar tanpa atribut alt",
          detail: (el.getAttribute("src") || "").slice(-50),
          parah: PARAH.sedang,
        })
      );
  },
};

const tombolTanpaNama = {
  id: "nama-tombol",
  nama: "Tombol tanpa nama",
  keterangan: "Tombol berisi ikon saja tanpa aria-label — pembaca layar hanya menyebut 'tombol'.",
  jalankan() {
    return [...document.querySelectorAll('button,[role="button"]')]
      .filter(terlihat)
      .filter((e) => {
        const teks = (e.innerText || "").trim();
        const nama = e.getAttribute("aria-label") || e.getAttribute("title") || "";
        return !teks && !nama && !e.getAttribute("aria-labelledby");
      })
      .map((el) =>
        temuan({ el, pesan: "Tombol tanpa nama yang bisa dibaca", parah: PARAH.sedang })
      );
  },
};

const isianTanpaLabel = {
  id: "label-isian",
  nama: "Isian tanpa label",
  keterangan: "Kolom isian tanpa label, aria-label, atau placeholder.",
  jalankan() {
    return [...document.querySelectorAll("input,select,textarea")]
      .filter(terlihat)
      .filter((e) => !["hidden", "submit", "button"].includes(e.type))
      .filter((e) => {
        if (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby")) return false;
        if (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) return false;
        if (e.closest("label")) return false;
        if (e.getAttribute("placeholder")) return false;
        return true;
      })
      .map((el) => temuan({ el, pesan: "Isian tanpa label", parah: PARAH.sedang }));
  },
};

const urutanJudul = {
  id: "urutan-judul",
  nama: "Lompatan tingkat judul",
  keterangan: "Judul yang melompat (h1 langsung ke h3) merusak kerangka halaman.",
  jalankan() {
    const judul = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(terlihat);
    const hasil = [];
    let sebelum = 0;
    for (const h of judul) {
      const tingkat = +h.tagName[1];
      if (sebelum && tingkat > sebelum + 1) {
        hasil.push(
          temuan({
            el: h,
            pesan: `Judul melompat h${sebelum} ke h${tingkat}`,
            parah: PARAH.rendah,
          })
        );
      }
      sebelum = tingkat;
    }
    return hasil;
  },
};

const idGanda = {
  id: "id-ganda",
  nama: "ID ganda",
  keterangan: "Dua elemen dengan id sama — label dan skrip bisa menunjuk elemen yang keliru.",
  jalankan() {
    const peta = new Map();
    for (const e of document.querySelectorAll("[id]")) {
      peta.set(e.id, (peta.get(e.id) || 0) + 1);
    }
    return [...peta.entries()]
      .filter(([, n]) => n > 1)
      .map(([id, n]) =>
        temuan({
          el: document.getElementById(id),
          pesan: `id "${id}" dipakai ${n} kali`,
          parah: PARAH.sedang,
        })
      );
  },
};

const tautanLuarTakAman = {
  id: "tautan-luar",
  nama: "Tautan luar tanpa pengaman",
  keterangan:
    'target="_blank" tanpa rel="noopener" memberi halaman tujuan akses ke jendela kita.',
  jalankan() {
    return [...document.querySelectorAll('a[target="_blank"]')]
      .filter(terlihat)
      .filter((e) => !/noopener/.test(e.getAttribute("rel") || ""))
      .map((el) =>
        temuan({ el, pesan: 'target="_blank" tanpa rel="noopener"', detail: el.href, parah: PARAH.sedang })
      );
  },
};

export const PEMERIKSA = [
  geserMendatar,
  luberLayar,
  tertutupNav,
  teksTerpotong,
  kontras,
  targetSentuh,
  teksKecil,
  gambarTanpaAlt,
  tombolTanpaNama,
  isianTanpaLabel,
  idGanda,
  tautanLuarTakAman,
  urutanJudul,
];

/** Menjalankan semua pemeriksa (atau sebagian, lewat daftar id). */
export function jalankanSemua(idTerpilih) {
  const dipakai = idTerpilih?.length
    ? PEMERIKSA.filter((p) => idTerpilih.includes(p.id))
    : PEMERIKSA;
  return dipakai.map((p) => {
    let temuanP = [];
    let galat = null;
    try {
      temuanP = p.jalankan() ?? [];
    } catch (e) {
      // Satu pemeriksa yang gagal tidak boleh menjatuhkan seluruh laporan.
      galat = e?.message ?? String(e);
    }
    return { id: p.id, nama: p.nama, keterangan: p.keterangan, temuan: temuanP, galat };
  });
}
