// src/lib/fotoTidakAda.js — pengganti untuk foto pohon yang gagal dimuat.
//
// ───────────────────────────────────────────────────────────────────────────
// KENAPA BUKAN FOTO STOK
// ───────────────────────────────────────────────────────────────────────────
// Sebelum berkas ini ada, keempat tempat yang menampilkan foto pohon jatuh ke
// satu URL Unsplash saat fotonya gagal dimuat. Itu cacat serius, bukan soal
// selera.
//
// Bayangkan pemeriksa memindai QR pohon GJR-L2-003 di kebun. Fotonya gagal
// dimuat — jaringan desa, berkas terhapus, apa pun. Yang muncul adalah foto
// pohon milik orang lain, di tempat lain, DI BAWAH JUDUL "GJR-L2-003",
// berdampingan dengan DBH, tinggi, dan serapan CO2 pohon itu. Tidak ada
// satu pun isyarat bahwa gambarnya bukan pohon tersebut.
//
// Di sistem MRV, gambar di sebelah angka terbaca sebagai bukti yang
// mendukung angka itu. Foto stok di posisi itu adalah klaim palsu tentang
// pohon nyata — dan paling berbahaya justru pada dua layar terpenting:
// hasil pindai QR di lapangan, dan bukti pertumbuhan yang dilihat pembeli
// karbon atas pohon yang mereka danai.
//
// Kotak kosong yang jujur jauh lebih baik daripada gambar yang meyakinkan
// tapi salah. Kegagalan yang terlihat bisa diperbaiki; kegagalan yang
// tersamar akan ikut tercetak di laporan.
//
// ───────────────────────────────────────────────────────────────────────────
// LATAR TEMBUS PANDANG, DISENGAJA
// ───────────────────────────────────────────────────────────────────────────
// Tanpa latar, gambar ini mengambil warna kartu di belakangnya, sehingga satu
// berkas cocok untuk tema terang maupun gelap. Abu-abu 55% dipilih karena
// cukup terlihat di atas keduanya tanpa menjerit.

const ABU = "hsl(150 6% 55%)";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
<rect x="34" y="28" width="92" height="66" rx="8" fill="none" stroke="${ABU}" stroke-width="4"/>
<circle cx="58" cy="50" r="7" fill="${ABU}"/>
<path d="M40 86 L66 58 L84 76 L98 64 L120 86 Z" fill="${ABU}"/>
<path d="M30 24 L130 98" stroke="${ABU}" stroke-width="5" stroke-linecap="round"/>
</svg>`;

/** Data URI. Tanpa permintaan jaringan — penting, karena ini dipakai justru
 *  ketika jaringan sedang bermasalah. */
export const FOTO_TIDAK_ADA = `data:image/svg+xml,${encodeURIComponent(SVG)}`;

/**
 * Penangan onError untuk <img> foto pohon.
 *
 * Mengganti `alt` juga, bukan hanya `src`. Pembaca layar harus ikut diberi
 * tahu bahwa fotonya tidak ada; keterangan lama ("Foto pohon GJR-L2-003")
 * yang tertinggal pada gambar pengganti mengulangi persis kebohongan yang
 * berkas ini hindari.
 *
 * Penjaga `dataset.pengganti` mencegah putaran tak berujung bila data URI-nya
 * sendiri gagal — onError yang memicu dirinya sendiri akan membekukan tab.
 */
export function pakaiFotoTidakAda(e, keterangan = "Foto tidak tersedia") {
  const img = e.currentTarget;
  if (img.dataset.pengganti === "1") return;
  img.dataset.pengganti = "1";
  img.src = FOTO_TIDAK_ADA;
  img.alt = keterangan;
  img.style.objectFit = "contain";
}
