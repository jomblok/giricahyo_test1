// src/dev/audit/inti.js — alat bersama untuk semua pemeriksa tampilan.
//
// Seluruh isi folder src/dev/ HANYA berjalan saat pengembangan. Pemanggilnya
// dijaga `import.meta.env.DEV`, yang diganti konstanta saat build sehingga
// Rollup membuang seluruh cabangnya dari bundel produksi. Pastikan tetap
// begitu: jangan pernah mengimpor berkas di folder ini dari kode yang ikut
// terkirim ke pengguna.
//
// Fungsi di sini lahir dari kesalahan nyata saat menyisir aplikasi ini, dan
// masing-masing komentarnya menyimpan alasan itu — supaya pemeriksa berikutnya
// tidak mengulanginya.

/* ─────────────────────────── warna ─────────────────────────── */

const kanvas = document.createElement("canvas");
kanvas.width = kanvas.height = 1;
const ctx = kanvas.getContext("2d", { willReadFrequently: true });

/**
 * Menerjemahkan sintaks warna CSS APA PUN ke [r, g, b, a].
 *
 * Membiarkan peramban yang menghitung, bukan mengurai sendiri dengan regex.
 * Tailwind v4 menghasilkan `oklab(0.96 -0.0003 0.012 / 0.7)` untuk kelas
 * beropasitas, dan mengambil angkanya mentah-mentah memperlakukan 0,96 sebagai
 * nilai RGB — audit pertama proyek ini melaporkan belasan temuan palsu persis
 * karena itu.
 */
export function keRgba(css) {
  const s = String(css ?? "").trim();
  if (!s || s === "transparent" || s === "rgba(0, 0, 0, 0)") return [0, 0, 0, 0];
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;

  // Alfa tidak ikut terbaca dari kanvas, jadi diambil dari teks aslinya.
  // Pola koma dibatasi ke bentuk rgba() berempat: tanpa itu, `rgb(246,243,234)`
  // membuat kanal biru terbaca sebagai alfa 234.
  let a = 1;
  const garis = s.match(/\/\s*([\d.]+%?)\s*\)/);
  const koma = s.match(/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/);
  if (garis) a = garis[1].endsWith("%") ? parseFloat(garis[1]) / 100 : parseFloat(garis[1]);
  else if (koma) a = parseFloat(koma[1]);
  return [d[0], d[1], d[2], a];
}

export const luminansi = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const campur = (depan, latar) => {
  const a = depan[3];
  return [0, 1, 2].map((i) => depan[i] * a + latar[i] * (1 - a));
};

/**
 * Warna latar yang BENAR-BENAR terlihat di belakang sebuah elemen.
 *
 * Latar sebuah teks sering transparan, dan yang tampak adalah warna induknya —
 * kadang beberapa tingkat ke atas, dengan beberapa lapis semi-transparan di
 * antaranya. Membaca backgroundColor elemen itu saja justru melewatkan kasus
 * terburuk, karena kasus terburuk biasanya memang yang latarnya diwarisi.
 */
export function latarEfektif(el) {
  let n = el;
  const tumpuk = [];
  while (n && n !== document.documentElement) {
    const c = keRgba(getComputedStyle(n).backgroundColor);
    if (c[3] > 0) {
      tumpuk.push(c);
      if (c[3] >= 0.999) break;
    }
    n = n.parentElement;
  }
  let hasil = [255, 255, 255];
  for (let i = tumpuk.length - 1; i >= 0; i--) hasil = campur(tumpuk[i], hasil);
  return hasil;
}

export function rasioKontras(el) {
  const latar = latarEfektif(el);
  const depan = campur(keRgba(getComputedStyle(el).color), latar);
  const l1 = luminansi(depan);
  const l2 = luminansi(latar);
  return {
    rasio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
    depan: `rgb(${depan.map(Math.round).join(",")})`,
    latar: `rgb(${latar.map(Math.round).join(",")})`,
  };
}

/* ─────────────────────────── elemen ─────────────────────────── */

/** Apakah elemen ini benar-benar terlihat pengguna. */
export function terlihat(el) {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return (
    s.display !== "none" &&
    s.visibility !== "hidden" &&
    +s.opacity > 0.05 &&
    r.width > 0 &&
    r.height > 0 &&
    !/sr-only/.test((el.className || "").toString()) &&
    !el.closest("[data-audit-abaikan]")
  );
}

/** Elemen daun yang membawa teks — sasaran sebagian besar pemeriksaan. */
export function elemenTeks() {
  return [...document.querySelectorAll("*")].filter(
    (e) => e.children.length === 0 && (e.textContent || "").trim() && terlihat(e)
  );
}

/**
 * Apakah elemen berada di dalam wadah yang menggulir atau memotong.
 *
 * Isi tabel bergulir memang lebih panjang dari kotaknya, dan ubin peta memang
 * meluber di dalam wadah overflow:hidden. Keduanya normal di layar. Tanpa
 * pengecualian ini, satu tabel 179 baris menghasilkan puluhan "temuan" yang
 * semuanya palsu — dan itu benar-benar terjadi saat pemeriksa ini pertama
 * dijalankan.
 */
export function dalamWadahTerkendali(el) {
  let n = el.parentElement;
  while (n && n !== document.body) {
    const s = getComputedStyle(n);
    if (/(auto|scroll|hidden)/.test(s.overflowX) || /(auto|scroll|hidden)/.test(s.overflowY)) {
      return true;
    }
    n = n.parentElement;
  }
  return false;
}

/** Nama pendek untuk ditampilkan di daftar temuan. */
export function label(el) {
  const t =
    (el.innerText || el.getAttribute("aria-label") || el.getAttribute("alt") || "").trim() ||
    `<${el.tagName.toLowerCase()}>`;
  return t.replace(/\s+/g, " ").slice(0, 44);
}

/** Jalur CSS ringkas, untuk menemukan kembali elemennya di kode. */
export function jalur(el) {
  const bagian = [];
  let n = el;
  for (let i = 0; i < 3 && n && n !== document.body; i++) {
    const kelas = (n.className || "")
      .toString()
      .split(" ")
      .filter((c) => c && !c.startsWith("gjr-"))
      .slice(0, 2)
      .join(".");
    bagian.unshift(n.tagName.toLowerCase() + (kelas ? "." + kelas : ""));
    n = n.parentElement;
  }
  return bagian.join(" > ");
}

/* ─────────────────────────── temuan ─────────────────────────── */

export const PARAH = { tinggi: "tinggi", sedang: "sedang", rendah: "rendah" };

export function temuan({ el, pesan, detail, parah = PARAH.sedang }) {
  return { el, pesan, detail, parah, nama: el ? label(el) : "", jalur: el ? jalur(el) : "" };
}
