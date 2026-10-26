// src/lib/tautanPublik.js — satu sumber alamat untuk QR yang DICETAK.
//
// KENAPA DIPUSATKAN. Alamat tujuan QR dulu ditulis di tiga tempat terpisah,
// dan ketiganya sempat melenceng satu sama lain: GenerateQrPage dan BulkQrPage
// memakai window.location.origin, sementara ScanResultModal memaku
// "https://giricahyo.id" — domain yang saat ini belum ada, jadi QR dari sana
// tidak bisa dibuka sama sekali. Tiga salinan yang harus berubah bersamaan
// PASTI akan melenceng lagi, dan di sini akibatnya mahal: labelnya benda
// fisik yang sudah dipaku ke pohon.
//
// ───────────────────────────────────────────────────────────────────────────
// WAJIB DIBACA SEBELUM DEPLOY
// ───────────────────────────────────────────────────────────────────────────
// Selama pengembangan, alamat diturunkan dari host yang sedang dibuka supaya
// QR bisa langsung diuji dari ponsel lewat alamat LAN atau terowongan HTTPS.
// Itu DISENGAJA untuk sekarang, dan itu juga yang membuatnya berbahaya nanti.
//
// Label QR adalah benda fisik: dicetak sekali, dipaku ke batang, dan harus
// tetap berfungsi bertahun-tahun. Kalau pengurus mencetak 179 label sementara
// aplikasinya dibuka dari localhost atau dari terowongan sementara, seluruh
// label itu PERMANEN RUSAK — dan tidak ada yang tahu sampai ada tamu memindai
// di kebun dan gagal. Mencetak ulang berarti mendatangi 179 pohon lagi.
//
// Jadi sebelum go-live: isi VITE_PUBLIC_BASE_URL di .env dengan domain
// produksi. Setelah terisi, nilai itu yang dipakai dan asal peramban diabaikan,
// sehingga label yang dicetak dari laptop mana pun menunjuk ke tempat yang
// sama.

/** Asal alamat untuk tautan publik yang akan dicetak atau dibagikan. */
export function asalPublik() {
  const disetel = import.meta.env.VITE_PUBLIC_BASE_URL;
  if (disetel) return String(disetel).replace(/\/+$/, "");
  return typeof window === "undefined" ? "" : window.location.origin;
}

/** Tautan kartu identitas publik sebuah pohon. */
export function tautanPohon(treeId) {
  return `${asalPublik()}/pohon/${treeId}`;
}

/**
 * Apakah alamat yang akan tercetak hanya berlaku sementara.
 *
 * localhost dan 127.0.0.1 hanya berarti "perangkat ini sendiri", jadi QR
 * berisi alamat itu tidak akan pernah bisa dibuka dari ponsel mana pun.
 * Alamat terowongan (trycloudflare, ngrok, loca.lt) mati begitu terowongannya
 * ditutup. Keduanya wajar dipakai saat menguji, dan keduanya tidak boleh
 * diam-diam terbawa ke label yang dipaku ke pohon.
 */
export function alamatSementara() {
  const asal = asalPublik();
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|\d+\.\d+\.\d+\.\d+)(:\d+)?$/i.test(asal)
    || /trycloudflare\.com|ngrok|loca\.lt/i.test(asal);
}
