import { existsSync, readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Content-Security-Policy untuk Giricahyo Carbon.
 *
 * CSP memberitahu peramban dari mana saja halaman ini BOLEH memuat sesuatu.
 * Gunanya bukan menambal celah tertentu, melainkan membatasi kerusakan kalau
 * suatu saat ada XSS: skrip suntikan tidak bisa memanggil server penyerang,
 * karena asalnya tidak ada di daftar ini.
 *
 * Setiap baris di bawah ditentukan dari hasil PEMERIKSAAN aplikasi ini, bukan
 * disalin dari contoh umum — daftar yang terlalu longgar tidak melindungi apa
 * pun, daftar yang terlalu ketat merusak halaman diam-diam.
 */
const csp = (asalApi) => [
  // Bawaan untuk apa pun yang tidak disebut khusus di bawah.
  "default-src 'self'",

  // Mengunci <base href>. Tanpa ini, satu suntikan <base> bisa membelokkan
  // SEMUA path relatif di halaman ke server penyerang sekaligus.
  "base-uri 'self'",

  // <object>/<embed> tidak dipakai sama sekali di aplikasi ini, jadi ditutup
  // total. Keduanya jalur pemuatan plugin yang tua dan berisiko.
  "object-src 'none'",

  // Setara X-Frame-Options: DENY, tapi versi CSP yang lebih dipatuhi peramban
  // modern. Menutup clickjacking pada tombol Hapus dan Buat Sertifikat.
  "frame-ancestors 'none'",

  // Form hanya boleh mengirim ke asal sendiri — mencegah form login palsu
  // hasil suntikan mengirim kata sandi ke luar.
  "form-action 'self'",

  // TANPA 'unsafe-inline'. Sudah diperiksa: dist/index.html hasil `npm run
  // build` berisi NOL skrip inline (semua kode masuk berkas .js terpisah),
  // jadi kebijakan seketat ini memang bisa dipakai. Ini bagian CSP yang paling
  // berharga — skrip suntikan <script>...</script> langsung tidak jalan.
  "script-src 'self'",

  // 'unsafe-inline' di sini TERPAKSA, dan ini pelemahan yang sadar.
  // Sebabnya: ada 38 penggunaan style={{ }} di src/, yang oleh React dipasang
  // sebagai atribut style="" saat runtime, dan CSP memblokir atribut style
  // kalau 'unsafe-inline' tidak ada. Risikonya jauh lebih kecil daripada
  // script inline — penyerang paling jauh bisa mengubah tampilan, bukan
  // menjalankan kode. Kalau suatu saat 38 style itu dipindah ke kelas
  // Tailwind, baris ini boleh diperketat.
  // fonts.googleapis.com dibutuhkan karena Work Sans dan JetBrains Mono
  // dimuat lewat <link> di index.html.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Berkas fontnya sendiri disajikan gstatic, bukan googleapis.
  "font-src 'self' https://fonts.gstatic.com",

  // data:  — foto pohon yang diunggah langsung disimpan sebagai data URI.
  // blob:  — pratinjau foto, unduhan QR, dan unduhan CSV memakai
  //          URL.createObjectURL (3 tempat di src/).
  // https: — ubin peta OpenStreetMap, DAN photo_url yang memang boleh berisi
  //          tautan http(s) ke gambar mana pun. Ini bagian paling longgar di
  //          seluruh kebijakan, dan itu konsekuensi langsung dari fitur
  //          "foto lewat tautan". Sisi backend sudah menyaring skemanya
  //          (lihat regex photo_url di TreeController).
  // ${asalApi} ditambahkan ketika foto pindah dari base64 di basis data ke
  // BERKAS yang dilayani backend. Tanpa ini foto baru diblokir CSP diam-diam —
  // tidak ada galat yang terlihat pengguna, gambarnya sekadar tidak muncul.
  // 'self' tidak mencakupnya: frontend di :5173, API di :8000, dan CSP
  // menganggap keduanya origin yang berbeda.
  `img-src 'self' data: blob: https: ${asalApi}`,

  // Pemindai QR (html5-qrcode) memakai kamera dan bisa membuat blob.
  "media-src 'self' blob:",
  "worker-src 'self' blob:",

  // Ke mana halaman boleh menembak permintaan jaringan.
  //
  // Diturunkan dari VITE_API_URL, BUKAN ditulis mati.
  //
  // Dulu baris ini menyebut localhost langsung, sehingga setiap deploy wajib
  // mengingat untuk mengubahnya di sini juga — dan kalau lupa, dasbor gagal
  // memuat data tanpa pesan galat yang bisa dimengerti pengguna awam: CSP
  // memblokir diam-diam. Sekarang satu-satunya tempat yang perlu diubah saat
  // deploy adalah VITE_API_URL di .env, seperti yang sudah tertulis di
  // komentarnya sendiri.
  `connect-src 'self' blob: ${asalApi}`,
].join('; ')

/**
 * Header keamanan untuk server yang menyajikan HALAMAN.
 *
 * Ini melengkapi SecurityHeaders.php di backend, yang hanya menyentuh balasan
 * API (JSON). CSP tidak berarti apa-apa di respons JSON — ia bekerja pada
 * dokumen HTML, dan dokumen HTML aplikasi ini disajikan dari sini.
 */
const headerKeamanan = (asalApi) => ({
  'Content-Security-Policy': csp(asalApi),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)',
})

/**
 * Menuliskan header di atas ke dalam dist/ saat `npm run build`.
 *
 * Alasan ini dibuat sebagai plugin, bukan berkas public/_headers yang diketik
 * manual: kebijakan CSP akan berubah seiring aplikasi bertambah, dan dua
 * salinan yang harus diubah bersamaan PASTI akan melenceng suatu hari —
 * biasanya diam-diam, dan baru ketahuan setelah produksi rusak. Dengan cara
 * ini konstanta CSP di atas adalah satu-satunya sumber kebenaran.
 *
 * Berkas `_headers` dikenali Netlify dan Cloudflare Pages — TIDAK oleh Vercel.
 * Catatan ini dulu menyebut Vercel juga, padahal Vercel hanya membaca header
 * dari vercel.json. Akibatnya frontend yang di-deploy ke Vercel berjalan tanpa
 * satu pun header di bawah. Untuk Vercel lihat periksaHeaderVercel(); untuk
 * nginx atau Apache, salin nilainya dari SECURITY.md.
 */
function tulisHeaderKeamanan(HEADER_KEAMANAN) {
  return {
    name: 'giricahyo-tulis-header-keamanan',
    apply: 'build',
    generateBundle() {
      const baris = ['/*'].concat(
        Object.entries(HEADER_KEAMANAN).map(([k, v]) => `  ${k}: ${v}`),
        '',
      )
      this.emitFile({ type: 'asset', fileName: '_headers', source: baris.join('\n') })
    },
  }
}

/**
 * Menggagalkan build kalau vercel.json melenceng dari header di atas.
 *
 * vercel.json tidak bisa ditulis oleh build — Vercel membacanya SEBELUM build
 * dimulai — jadi ia terpaksa jadi salinan kedua yang diketik tangan. Salinan
 * kedua pasti melenceng suatu hari; pemeriksa ini mengubah "melenceng diam-diam"
 * menjadi build yang gagal dengan pesan jelas, di laptop maupun di Vercel.
 *
 * CSP SENGAJA TIDAK DIPERIKSA dan belum ada di vercel.json. connect-src-nya
 * harus memuat asal API produksi, yang baru diketahui saat deploy. CSP dengan
 * asal yang salah memblokir SEMUA panggilan API tanpa galat yang terlihat —
 * lebih buruk daripada tanpa CSP. Saat deploy: tambahkan header
 * Content-Security-Policy ke vercel.json dengan nilai yang dicetak
 * `npm run build` ke dist/_headers, setelah VITE_API_URL diisi alamat produksi.
 */
function periksaHeaderVercel(HEADER_KEAMANAN) {
  return {
    name: 'giricahyo-periksa-header-vercel',
    apply: 'build',
    buildStart() {
      if (!existsSync('vercel.json')) return
      // Sengaja tanpa try/catch: vercel.json yang rusak harus menggagalkan build.
      const konfig = JSON.parse(readFileSync('vercel.json', 'utf8'))
      const terpasang = {}
      for (const blok of konfig.headers ?? []) {
        for (const h of blok.headers ?? []) terpasang[h.key] = h.value
      }
      const beda = Object.entries(HEADER_KEAMANAN)
        .filter(([kunci]) => kunci !== 'Content-Security-Policy')
        .filter(([kunci, nilai]) => terpasang[kunci] !== nilai)
        .map(([kunci]) => kunci)
      if (beda.length) {
        this.error(
          `vercel.json tidak sama dengan headerKeamanan() di vite.config.js untuk: ${beda.join(', ')}. ` +
          'Samakan keduanya — Vercel hanya membaca header dari vercel.json.'
        )
      }
    },
  }
}

/**
 * Varian untuk server `dev`.
 *
 * Vite dev menyuntikkan skrip inline untuk HMR dan React Refresh, jadi
 * script-src HARUS dilonggarkan di sini — kalau tidak, halaman tidak akan
 * jalan sama sekali saat pengembangan. Pelonggaran itu SATU-SATUNYA perbedaan
 * dari kebijakan produksi.
 *
 * Kenapa tetap dipasang, bukan dimatikan saja: direktif yang paling sering
 * merusak aplikasi diam-diam bukan script-src, melainkan img-src, font-src,
 * style-src, dan connect-src. Keempatnya di sini SAMA PERSIS dengan produksi,
 * jadi kalau nanti ada yang menambahkan sumber baru (CDN gambar, endpoint
 * analitik, font lain), pelanggarannya muncul di konsol saat itu juga —
 * bukan setelah rilis.
 *
 * Konsekuensi yang harus disadari: karena script-src longgar di dev, skrip
 * inline yang tidak sengaja ditambahkan TIDAK akan tertangkap di sini. Itu
 * hanya ketahuan pada build produksi.
 */
const headerKeamananDev = (asalApi) => ({
  ...headerKeamanan(asalApi),
  'Content-Security-Policy': csp(asalApi).replace(
    "script-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  ),
})

export default defineConfig(({ mode }) => {
  // Asal API diambil dari VITE_API_URL dan dipangkas jadi origin saja
  // (skema + host + port). CSP connect-src memang hanya menerima origin;
  // menyertakan path "/api" membuat seluruh direktif itu diabaikan diam-diam.
  // '.' dan bukan process.cwd(): konfigurasi eslint proyek ini memperlakukan
  // berkas ini sebagai kode peramban, tempat `process` memang tidak ada.
  // loadEnv menerima path relatif dan menyelesaikannya dari direktori kerja,
  // jadi hasilnya sama persis.
  const env = loadEnv(mode, '.', 'VITE_');
  let asalApi = 'http://127.0.0.1:8000';
  try {
    asalApi = new URL(env.VITE_API_URL ?? asalApi).origin;
  } catch {
    // VITE_API_URL kosong atau tidak bisa diurai — pakai bawaan dan biarkan
    // build tetap jalan, karena menggagalkannya di sini tidak membantu siapa
    // pun: yang salah ada di .env, bukan di kode.
  }

  // localhost dan 127.0.0.1 adalah ORIGIN YANG BERBEDA bagi CSP, meski
  // menunjuk mesin yang sama. Ini sudah menggigit sekali: foto dilayani dari
  // http://localhost:8000 (mengikuti APP_URL backend) sementara CSP hanya
  // mengizinkan http://127.0.0.1:8000 (mengikuti VITE_API_URL), jadi setiap
  // gambar diblokir TANPA galat yang terlihat pengguna — gambarnya sekadar
  // tidak muncul.
  //
  // Backend dan frontend punya berkas .env sendiri-sendiri, jadi keduanya akan
  // melenceng lagi suatu hari. Kedua ejaan diizinkan sekaligus, dan HANYA
  // untuk alamat lokal — di produksi keduanya nama domain yang sama, jadi
  // tidak ada pelonggaran apa pun yang terbawa ke sana.
  const asalLokal = (u) => {
    try {
      const { protocol, hostname, port } = new URL(u);
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') return [u];
      const lain = hostname === 'localhost' ? '127.0.0.1' : 'localhost';
      return [u, protocol + '//' + lain + (port ? ':' + port : '')];
    } catch {
      return [u];
    }
  };

  const asalApiSemua = asalLokal(asalApi).join(' ');

  const HEADER_KEAMANAN = headerKeamanan(asalApiSemua);

  return {
  plugins: [
    react(),
    tailwindcss(),
    tulisHeaderKeamanan(HEADER_KEAMANAN),
    periksaHeaderVercel(HEADER_KEAMANAN),
  ],

  server: {
    headers: headerKeamananDev(asalApiSemua),

    // Host yang boleh menyajikan server dev ini. Tanpa daftar ini, Vite
    // menolak permintaan yang datang lewat terowongan dengan "Blocked request.
    // This host is not allowed" — pemeriksaan anti-rebinding DNS bawaannya.
    //
    // Terowongan dibutuhkan karena KAMERA menuntut secure context. Peramban
    // hanya mengecualikan localhost; alamat LAN lewat http:// dianggap tidak
    // aman, sehingga navigator.mediaDevices tidak disediakan sama sekali —
    // pemindai QR mati total di ponsel, bukan karena izin ditolak melainkan
    // karena API-nya tidak ada.
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],

    // PROXY /api KE BACKEND, supaya halaman dan API berbagi satu asal.
    //
    // MASALAH YANG DIPECAHKAN. Saat menguji di ponsel (`vite --host 0.0.0.0`),
    // halaman dibuka dari http://192.168.x.x:5173 sementara API ada di
    // http://192.168.x.x:8000. Itu DUA ORIGIN berbeda, dan connect-src di CSP
    // atas hanya menyebut asal dari VITE_API_URL — yang saat pengembangan
    // menunjuk localhost. Akibatnya setiap permintaan dari ponsel diblokir
    // kebijakan kita sendiri, dan Safari melaporkannya hanya sebagai
    // "TypeError: Load failed" tanpa menyebut CSP sama sekali.
    //
    // Dengan proxy ini, peramban cukup memanggil /api di asal yang sama, lalu
    // Vite yang meneruskannya ke backend dari sisi server. Yang ikut hilang:
    //   - lintas-origin, jadi 'self' di connect-src sudah cukup
    //   - CORS dan preflight, karena tidak ada lagi permintaan lintas asal
    //   - kebutuhan membuka port 8000 di firewall untuk perangkat lain
    //   - pembatasan akses jaringan lokal di iOS, yang memandang permintaan
    //     ke port lain sebagai akses jaringan oleh situs
    //
    // Backend tetap dipanggil lewat 127.0.0.1: penerusan terjadi di dalam
    // laptop, bukan lewat jaringan.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },

  // `preview` menyajikan hasil build yang sesungguhnya, jadi di sinilah
  // kebijakan produksi berlaku utuh — termasuk script-src 'self' tanpa
  // pelonggaran apa pun.
  preview: { headers: HEADER_KEAMANAN },
  };
})
