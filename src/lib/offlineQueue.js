// src/lib/offlineQueue.js — antrean kiriman saat tidak ada sinyal.
//
// MASALAH YANG DIPECAHKAN. Petani berdiri di depan pohon di Gunungkidul. Tanpa
// sinyal, setiap tombol kirim gagal dan apa yang sudah diukur hilang — harus
// diingat sampai pulang, lalu dimasukkan ulang dari memori. Itu persis cara
// angka lapangan berubah di perjalanan.
//
// ATURAN YANG TIDAK BOLEH DILANGGAR: antrean ini TIDAK PERNAH diam-diam.
// Pengguna yang menekan "Kirim" dan melihat pesan sukses akan percaya
// kiriman itu sudah sampai. Jadi setiap jalur yang mengantre WAJIB mengatakan
// bahwa kirimannya tertunda, dan jumlah yang menunggu harus terlihat terus.
//
// Memakai IndexedDB, bukan localStorage: satu laporan bisa membawa foto
// base64 beberapa ratus KB, dan localStorage dibatasi ~5 MB untuk seluruh
// origin — penuh diam-diam, lalu melempar galat di tempat yang tidak terduga.

const DB_NAMA = "gjr_luring";
const DB_VERSI = 1;
const TOKO = "antrean";

function bukaDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAMA, DB_VERSI);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TOKO)) {
        db.createObjectStore(TOKO, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function transaksi(mode, fn) {
  const db = await bukaDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TOKO, mode);
    const hasil = fn(tx.objectStore(TOKO));
    tx.oncomplete = () => resolve(hasil?.result ?? hasil);
    tx.onerror = () => reject(tx.error);
  });
}

/** Menambahkan satu kiriman ke antrean. `label` dibaca manusia di daftar tunggu. */
export async function antrekan({ method, url, body, label }) {
  return transaksi("readwrite", (toko) =>
    toko.add({ method, url, body, label, dibuat: Date.now(), percobaan: 0 })
  );
}

export async function daftarAntrean() {
  return transaksi("readonly", (toko) => toko.getAll());
}

export async function hapusDariAntrean(id) {
  return transaksi("readwrite", (toko) => toko.delete(id));
}


/**
 * Mengirim ulang seluruh antrean.
 *
 * Dipanggil saat koneksi kembali dan saat pengguna menekan kirim ulang.
 *
 * KEGAGALAN DIBEDAKAN, bukan disamakan:
 *   - Gagal jaringan  -> biarkan di antrean, coba lagi nanti.
 *   - Ditolak server (4xx) -> BUANG dari antrean. Permintaan yang ditolak
 *     karena datanya tidak valid akan ditolak selamanya; mengulangnya tiap
 *     kali online hanya membuat antrean macet permanen.
 *   - Galat server (5xx) -> biarkan, itu bisa sementara.
 */
export async function kirimUlangAntrean(fetcher) {
  const semua = await daftarAntrean();
  const hasil = { terkirim: 0, ditolak: 0, tertunda: 0 };

  for (const item of semua) {
    try {
      const res = await fetcher(item);
      if (res.ok) {
        await hapusDariAntrean(item.id);
        hasil.terkirim += 1;
      } else if (res.status >= 400 && res.status < 500) {
        await hapusDariAntrean(item.id);
        hasil.ditolak += 1;
      } else {
        hasil.tertunda += 1;
      }
    } catch {
      // Masih tidak ada jaringan. Dibiarkan di antrean.
      hasil.tertunda += 1;
    }
  }

  return hasil;
}

/** Apakah kegagalan ini karena jaringan, bukan karena server menolak. */
export function galatJaringan(err) {
  // fetch() melempar TypeError saat tidak ada koneksi. Pemeriksaan
  // navigator.onLine saja tidak cukup: ia bisa true sementara jaringannya
  // tersambung tapi tidak sampai ke mana-mana (hotspot desa yang menuntut
  // login, misalnya).
  return err instanceof TypeError || !navigator.onLine;
}
