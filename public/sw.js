/* Service worker Giricahyo Carbon — ditulis tangan, tanpa dependensi.
 *
 * KENAPA TANPA PUSTAKA. Menambah vite-plugin-pwa berarti menambah satu pohon
 * dependensi baru beserta transitifnya ke proyek yang justru sedang dijaga
 * rantai pasoknya. Yang dibutuhkan di sini cukup kecil untuk ditulis utuh dan
 * dibaca utuh — dan service worker adalah kode yang berjalan di luar halaman,
 * jadi lebih baik tidak ada baris di dalamnya yang tidak dimengerti.
 *
 * YANG DILAKUKAN:
 *   1. Menyimpan cangkang aplikasi supaya dasbor tetap terbuka tanpa sinyal.
 *   2. Menyajikan berkas statis dari cache lebih dulu (aset Vite ber-hash,
 *      jadi aman: nama berubah setiap kali isinya berubah).
 *
 * YANG SENGAJA TIDAK DILAKUKAN: menyimpan jawaban API. Angka karbon, daftar
 * pohon, dan status sertifikat tidak boleh ditampilkan dari cache tanpa
 * penanda — pengurus yang melihat "1.422.172 kg" tidak punya cara tahu itu
 * angka hari ini atau angka minggu lalu. Data luring ditangani di lapisan
 * aplikasi, yang bisa menyertakan keterangan kapan terakhir diperbarui.
 */

const VERSI = 'gjr-v1';
const CACHE_CANGKANG = `${VERSI}-cangkang`;

// Hanya yang pasti ada pada build apa pun. Aset ber-hash tidak bisa ditulis
// di sini karena namanya berubah tiap build; mereka masuk cache saat diminta.
const CANGKANG = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_CANGKANG)
      // addAll gagal seluruhnya kalau SATU berkas gagal, dan itu membuat
      // pemasangan SW batal total hanya karena satu ikon hilang. Jadi tiap
      // berkas ditambahkan sendiri-sendiri dan kegagalannya diabaikan.
      .then((cache) => Promise.allSettled(CANGKANG.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((kunci) => Promise.all(
        kunci.filter((k) => !k.startsWith(VERSI)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya GET. Permintaan tulis TIDAK pernah disentuh service worker ini:
  // antrean luring untuk tulis ditangani di lapisan aplikasi, yang tahu
  // konteksnya dan bisa memberi tahu pengguna bahwa kirimannya tertunda.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Permintaan ke API dilewatkan apa adanya — lihat alasannya di kepala berkas.
  if (url.pathname.startsWith('/api/')) return;

  // Lintas-origin (ubin peta, font) dibiarkan ke jaringan: menyimpannya
  // membengkakkan cache tanpa batas dan sebagian tidak boleh disimpan.
  if (url.origin !== self.location.origin) return;

  // Navigasi: jaringan dulu, cache sebagai jaring pengaman. Urutan ini penting
  // — cache-dulu untuk HTML berarti pengguna bisa terjebak di versi lama
  // selamanya meski sinyalnya penuh.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const salinan = res.clone();
          caches.open(CACHE_CANGKANG).then((c) => c.put('/index.html', salinan));
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    );
    return;
  }

  // Aset: cache dulu. Vite memberi nama ber-hash, jadi isi yang berubah selalu
  // punya URL baru dan tidak mungkin tersaji versi basi.
  event.respondWith(
    caches.match(request).then((tersimpan) => {
      if (tersimpan) return tersimpan;
      return fetch(request).then((res) => {
        // Hanya jawaban yang benar-benar berhasil yang disimpan; menyimpan
        // 404 atau 500 berarti kesalahan sesaat jadi permanen.
        if (res && res.ok && res.type === 'basic') {
          const salinan = res.clone();
          caches.open(CACHE_CANGKANG).then((c) => c.put(request, salinan));
        }
        return res;
      });
    })
  );
});
