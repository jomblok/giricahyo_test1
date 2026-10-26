// src/lib/draf.js — menyelamatkan isian yang BELUM sempat dikirim.
//
// MASALAH YANG DIPECAHKAN. Antrean luring di lib/offlineQueue.js baru bekerja
// SETELAH tombol kirim ditekan: tugasnya menjaga kiriman yang sudah jadi.
// Yang belum terjaga adalah isian yang masih setengah jalan. Petani berdiri di
// depan pohon, sudah mengetik diameter dan tinggi, lalu baterai habis, tab
// tertutup tidak sengaja, atau peramban membuang halaman di latar belakang —
// semuanya hilang, dan dia harus berjalan balik ke pohon itu untuk mengukur
// ulang. Jarak itu yang membuat kehilangan data di sini mahal, bukan jumlah
// ketikannya.
//
// FOTO SENGAJA TIDAK IKUT DISIMPAN. Walau sudah lewat compressImage(), satu
// foto base64 masih puluhan sampai ratusan KB, sedangkan localStorage dibatasi
// sekitar 5 MB untuk SELURUH origin. Menyimpannya berisiko memenuhi kuota,
// dan kuota yang penuh membuat penulisan draf berikutnya gagal diam-diam —
// persis kegagalan yang modul ini dibuat untuk mencegah. Jadi foto harus
// dipilih ulang, dan banner pemulihan WAJIB mengatakannya.
//
// Memakai localStorage, bukan IndexedDB seperti antrean luring. Alasannya
// bukan ukuran melainkan waktu: draf dibaca sekali saat komponen lahir, dan
// localStorage sinkron sehingga nilainya sudah ada ketika useState pertama
// kali dipanggil. IndexedDB asinkron, yang berarti form tampil kosong dulu
// lalu berkedip terisi — dan pengguna yang keburu mengetik akan bertabrakan
// dengan pemulihan yang datang terlambat.

import { useEffect } from "react";

const AWALAN = "gjr_draf_";

// Ditunda supaya tidak menulis pada tiap ketukan tombol. 400 ms cukup pendek
// untuk tidak kehilangan apa pun pada penutupan tab yang wajar, dan cukup
// panjang untuk tidak menulis belasan kali saat satu angka diketik.
const JEDA_MS = 400;

/**
 * Membaca draf tersimpan. Selalu mengembalikan objek, tidak pernah melempar:
 * dipanggil dari initializer useState, dan galat di sana merusak seluruh
 * halaman — padahal draf hanyalah kenyamanan.
 */
export function bacaDraf(kunci) {
  try {
    const mentah = localStorage.getItem(AWALAN + kunci);
    if (!mentah) return {};
    const isi = JSON.parse(mentah);
    return isi && typeof isi === "object" ? isi : {};
  } catch {
    // Mode penyamaran, penyimpanan diblokir, atau JSON rusak dari versi lama.
    return {};
  }
}

export function hapusDraf(kunci) {
  try {
    localStorage.removeItem(AWALAN + kunci);
  } catch {
    // Tidak ada yang bisa dilakukan, dan tidak ada yang perlu dilakukan.
  }
}

/** Apakah objek ini punya setidaknya satu isian yang benar-benar terisi. */
export function adaIsinya(nilai) {
  return Object.values(nilai ?? {}).some((v) => v !== "" && v != null);
}

/**
 * Menulis `nilai` ke draf setiap kali isinya berubah.
 *
 * Draf kosong DIHAPUS, bukan ditulis sebagai objek kosong. Kalau tidak,
 * mengosongkan form lalu membukanya lagi akan memunculkan banner "draf
 * dipulihkan" untuk draf yang sebenarnya tidak berisi apa-apa.
 *
 * Seluruh dependensinya primitif (string dan boolean), bukan objek `nilai`
 * yang lahir baru tiap render — kalau objeknya yang jadi dependensi, efek ini
 * berjalan pada SETIAP render dan jam tundanya disetel ulang terus, sehingga
 * pada komponen yang sering render tulisannya tidak pernah mendarat.
 */
export function useSimpanDraf(kunci, nilai) {
  const sidik = JSON.stringify(nilai);
  const berisi = adaIsinya(nilai);

  useEffect(() => {
    const jam = setTimeout(() => {
      try {
        if (berisi) localStorage.setItem(AWALAN + kunci, sidik);
        else localStorage.removeItem(AWALAN + kunci);
      } catch {
        // Kuota penuh atau penyimpanan diblokir. Form tetap berjalan normal;
        // yang hilang hanya jaring pengamannya.
      }
    }, JEDA_MS);
    return () => clearTimeout(jam);
  }, [kunci, sidik, berisi]);
}
