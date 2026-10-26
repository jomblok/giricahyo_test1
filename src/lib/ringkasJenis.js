// src/lib/ringkasJenis.js — merangkum daftar pohon menjadi rincian per jenis.
//
// DIHITUNG DI PERAMBAN, BUKAN DI BACKEND. Versi pertama fitur ini memakai
// endpoint ringkasan tersendiri, dan itu masuk akal untuk admin: dashboard
// admin tidak pernah memuat seluruh 179 pohon, jadi menghitung di peramban
// berarti menariknya hanya demi beberapa angka.
//
// Di halaman petani keadaannya terbalik. Halaman itu SUDAH memuat seluruh
// pohon milik petani tersebut lewat satu panggilan yang sama. Menambah
// endpoint kedua berarti menanyakan hal yang jawabannya sudah ada di tangan.
//
// Dan ada alasan yang lebih kuat daripada hemat permintaan: angka yang
// dihitung dari daftar yang sama dengan yang ditampilkan TIDAK MUNGKIN
// berbeda dengannya. Dua sumber terpisah bisa berselisih — penyaring
// berbeda, cache berbeda, satu terbarui lebih dulu — dan kartu bertuliskan
// "39 pohon" di atas tabel berisi 37 baris adalah persis jenis selisih diam
// yang merusak kepercayaan pada seluruh angka di layar.

/**
 * TANPA BATAS JUMLAH, sejalan dengan sisi admin. Versi pertama memotongnya
 * di 10 teratas. Petani membaca barisan kartu sebagai rincian dari jumlah
 * pohonnya, dan rincian yang diam-diam terpotong membuat angkanya tidak
 * pernah bisa dicocokkan — petani dengan 12 jenis akan melihat dua jenisnya
 * hilang tanpa sebab yang terlihat.
 *
 * @param {Array} pohon   daftar pohon ({ species, co2_eq_kg })
 * @param {Array} katalog isi /api/species ({ name, scientific_name })
 */
export function ringkasJenis(pohon, katalog = []) {
  const latin = new Map(
    (katalog ?? []).map((j) => [j.name, j.scientific_name ?? j.scientificName ?? null])
  );

  const per = new Map();
  for (const p of pohon ?? []) {
    const nama = p.species;
    if (!nama) continue;
    const baris = per.get(nama) ?? { nama, latin: latin.get(nama) ?? null, jumlah: 0, co2: 0 };
    baris.jumlah += 1;
    // Number(... ) || 0: co2_eq_kg bisa datang sebagai string desimal dari
    // MySQL, dan bisa null untuk pohon yang belum pernah diukur. Keduanya
    // membuat penjumlahan biasa menghasilkan NaN, yang lalu tampil di kartu
    // sebagai "NaN kg CO₂".
    baris.co2 += Number(p.co2_eq_kg ?? p.co2EqKg) || 0;
    per.set(nama, baris);
  }

  return [...per.values()].sort((a, b) => b.jumlah - a.jumlah);
}
