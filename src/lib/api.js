// src/lib/api.js
// Satu-satunya pintu masuk ke Laravel backend.
// Semua fetch ke API melewati helper ini supaya:
//   1. Base URL cukup diset di satu tempat (.env)
//   2. Authorization header otomatis disertakan
//   3. Error response otomatis di-throw sebagai object { message }

// ALAMAT API DITURUNKAN DARI HOST YANG SEDANG DIBUKA, bukan dipaku ke localhost.
//
// MASALAH YANG DIPECAHKAN. Saat menguji di ponsel lewat `vite --host 0.0.0.0`,
// halaman dibuka dari alamat LAN laptop (mis. http://192.168.18.184:5173).
// Dengan alamat API dipaku ke localhost atau 127.0.0.1, ponsel akan memanggil
// DIRINYA SENDIRI — dan di ponsel tidak ada apa pun yang mendengarkan di port
// 8000. Halaman login tampil normal, lalu setiap permintaan gagal tanpa sebab
// yang jelas.
//
// Menurunkan host saja TIDAK CUKUP, dan ini sudah terbukti menggigit: halaman
// di :5173 yang memanggil :8000 tetap DUA ORIGIN berbeda, sehingga diblokir
// connect-src di CSP (lihat vite.config.js) — dan Safari melaporkannya cuma
// sebagai "TypeError: Load failed", tanpa menyebut CSP.
//
// Jadi saat pengembangan dipakai path relatif: peramban memanggil /api di asal
// yang sama, dan proxy Vite meneruskannya ke backend. Satu asal berarti tidak
// ada CSP yang perlu dilonggarkan, tidak ada CORS, dan tidak ada port kedua
// yang perlu dibuka — ponsel bekerja sama persis seperti laptop.
//
// VITE_API_URL tetap dihormati bila diisi, karena saat dipasang sungguhan
// backend-nya memang ada di domain lain.
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

// Ambil token dari localStorage
function getToken() {
  return localStorage.getItem("gjr_token");
}

// Simpan / hapus token
//
// Keduanya ikut mengosongkan simpanan GET (lihat dedupedGet). Pergantian
// akun di peramban yang sama tanpa ini akan menyuguhkan data akun SEBELUMNYA
// sampai simpanannya kedaluwarsa — admin keluar, petani masuk, lalu petani
// melihat daftar seluruh petani yang masih tersimpan.
export function saveToken(token) {
  lupakanSimpanan();
  localStorage.setItem("gjr_token", token);
}
export function clearToken() {
  lupakanSimpanan();
  localStorage.removeItem("gjr_token");
  localStorage.removeItem("gjr_user");
}

// Akun yang sedang login, disimpan supaya halaman bisa tampil tanpa menunggu
// /auth/me (lihat AuthContext). Isinya sama dengan yang dikembalikan
// /auth/me — id, nama, email, peran, linked_id — tidak ada rahasia di
// dalamnya; tokennya sendiri sudah tersimpan di localStorage sejak dulu.
export function saveUser(user) {
  localStorage.setItem("gjr_user", JSON.stringify(user));
}
export function getSavedUser() {
  try {
    const user = JSON.parse(localStorage.getItem("gjr_user"));
    // Hanya bentuk yang utuh yang dipercaya. Isian rusak atau sisa versi
    // lama jatuh ke jalur lama: tunggu /auth/me.
    return user?.id && user?.role ? user : null;
  } catch {
    return null;
  }
}

import { antrekan, galatJaringan } from "./offlineQueue";

/**
 * Jalur tulis yang BOLEH diantrekan saat tidak ada sinyal.
 *
 * Daftar-putih, bukan daftar-hitam. Mengantre permintaan yang salah jauh
 * lebih berbahaya daripada tidak mengantre sama sekali: menghapus pohon atau
 * menerbitkan sertifikat yang tertunda berjam-jam lalu terkirim tiba-tiba
 * adalah kejutan yang tidak boleh ada.
 *
 * Yang masuk daftar ini hanya dua aksi lapangan petani — keduanya menambah
 * catatan baru, tidak menghapus apa pun, dan keduanya memang dikerjakan
 * berdiri di depan pohon di tempat yang tidak ada sinyalnya.
 */
const BOLEH_DIANTRE = [
  { method: "POST", cocok: (path) => path === "/reports" },
  { method: "POST", cocok: (path) => /^\/trees\/[^/]+\/photos$/.test(path) },
];

function bolehDiantre(method, path) {
  return BOLEH_DIANTRE.some((r) => r.method === method && r.cocok(path));
}

/** Dilempar saat permintaan masuk antrean, bukan terkirim. Bukan kegagalan. */
export class TertundaLuring extends Error {
  constructor() {
    super("TERTUNDA_LURING");
    this.name = "TertundaLuring";
    this.tertunda = true;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const token = getToken();
  const headers = { 
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
  } catch (err) {
    // Tidak ada jaringan. Untuk aksi lapangan petani, simpan dulu lalu kirim
    // saat sinyal kembali — dan BERITAHU pemanggilnya bahwa kiriman ini
    // tertunda, jangan pura-pura berhasil.
    if (galatJaringan(err) && bolehDiantre(method, path)) {
      await antrekan({
        method,
        url: `${BASE_URL}${path}`,
        body,
        label: path.includes("/photos") ? "Foto pohon" : "Laporan kondisi",
      });
      window.dispatchEvent(new CustomEvent("gjr:antrean-berubah"));
      throw new TertundaLuring();
    }

    // Permintaan yang TIDAK bisa diantre (login, pembacaan data) tetap gagal —
    // tapi jangan melempar galat mentahnya. fetch() melempar
    // "TypeError: Failed to fetch", dan kalimat itu tembus sampai ke layar:
    // petani di Gunungkidul membaca pesan galat berbahasa Inggris dari mesin,
    // yang tidak memberi tahu apa pun tentang apa yang harus dia lakukan.
    //
    // `kode` disertakan supaya antarmuka yang ingin menerjemahkan sendiri
    // punya pegangan yang stabil, tanpa mencocokkan teks pesan.
    if (galatJaringan(err)) {
      const galat = new Error(
        "Tidak ada koneksi ke server. Periksa sinyal Anda, lalu coba lagi."
      );
      galat.kode = "JARINGAN_PUTUS";
      throw galat;
    }

    throw err;
  }

  // Token kadaluarsa / tidak valid.
  //
  // Sebelumnya baris ini memanggil window.location.href = "/login" — reload
  // penuh browser yang membuang seluruh state SPA dan terasa seperti aplikasi
  // crash. Sekarang token dibersihkan lalu sebuah event disiarkan; AuthContext
  // yang menanganinya dan memindahkan halaman lewat router.
  //
  // KECUALI endpoint login: percobaan masuk yang gagal juga dijawab 401, dan
  // dulu ikut tertangkap di sini — akibatnya orang yang cuma salah ketik
  // password disuguhi tulisan "SESSION_EXPIRED", padahal tidak ada sesi yang
  // kedaluwarsa (memang belum pernah masuk). Untuk jalur ini biarkan pesan
  // asli dari backend ("Email atau password salah.") yang tampil.
  const isLoginAttempt = path === "/auth/login";

  if (res.status === 401 && !isLoginAttempt) {
    clearToken();
    window.dispatchEvent(new CustomEvent("gjr:unauthorized"));
    throw new Error("SESSION_EXPIRED");
  }

  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) {
      // Pesan 404 di sini SENGAJA umum. Versi lama menulis "Pohon dengan ID
      // ... tidak ditemukan" untuk SETIAP 404 dari endpoint mana pun, dan
      // mengambil ID-nya dari ujung path — pada /trees/GJR-X/public ujung itu
      // adalah "public", sehingga pesannya menyebut pohon berID "public".
      const galat = new Error(
        res.status === 404
          ? "Data tidak ditemukan."
          : `Respon server non-JSON (${res.status}): ${text.substring(0, 80)}`
      );
      galat.status = res.status;
      throw galat;
    }
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    let msg = data?.message || `Terjadi kesalahan (${res.status}).`;
    if (data?.errors && typeof data.errors === "object" && Object.keys(data.errors).length > 0) {
      // Pesan per-field MENGGANTI pembungkusnya, tidak ditempel di belakangnya.
      //
      // Sebelumnya hasilnya digabung jadi
      //   "Data yang dikirim tidak valid.: Pohon ini sudah punya sertifikat adopsi."
      // — kalimat generik Laravel, titik, titik dua, lalu kalimat yang
      // sebenarnya berguna. Pembungkus itu tidak pernah memberi tahu apa pun
      // yang belum dikatakan pesan di bawahnya, dan ini terlihat di SETIAP
      // galat validasi di seluruh aplikasi.
      //
      // Balasan yang pesannya memang informatif (mis. 409 "pohon masih terikat
      // sertifikat ...") tidak punya kunci `errors`, jadi tidak lewat sini.
      msg = Object.values(data.errors).flat().join(" • ");
    }
    const error = new Error(msg);
    error.errors = data?.errors || {};
    // Kode status ikut dibawa supaya pemanggil bisa membedakan "datanya memang
    // tidak ada" (404) dari kegagalan lain. Tanpa ini halaman publik pohon
    // menyebut pohon "tidak terdaftar" padahal yang gagal servernya.
    error.status = res.status;
    throw error;
  }

  return data;
}

// ── Penggabungan GET yang identik & bersamaan ────────────────────────────────
//
// Satu halaman dashboard memanggil GET /trees lima kali sekaligus, karena
// TreeTable, TreeMap, TrendCharts, HealthSummaryCard, dan lonceng notifikasi
// masing-masing mengambil datanya sendiri-sendiri. Kelimanya meminta URL yang
// sama pada saat yang sama, jadi lima kali balasan berisi 179 pohon + join
// petani + sertifikat dikirim untuk satu layar.
//
// Di sini kelimanya digabung menjadi SATU request: pemanggil pertama membuat
// permintaan, sisanya ikut menunggu Promise yang sama.
//
// Balasan yang berhasil juga DISIMPAN sebentar (SIMPAN_MS). Penggabungan saja
// tidak menolong saat pindah menu: setiap halaman memasang AppShell-nya
// sendiri, sehingga lonceng notifikasi di Topbar ikut lahir ulang dan menarik
// empat endpoint lagi, dan halaman tujuan menarik ulang data yang baru saja
// diambil halaman sebelumnya. Terukur di klik Ringkasan → Petani: enam
// permintaan, empat di antaranya milik lonceng dan mengantre di depan data
// halamannya. Di server, setiap permintaan yang menyentuh basis data butuh
// ±1,8 detik.
//
// Umur simpanan menentukan perlakuannya:
//   < SEGAR_MS     langsung dipakai, tidak ada permintaan ke server.
//   < BASI_MAKS_MS langsung dipakai JUGA, tapi sambil diminta ulang di latar
//                  belakang; begitu jawabannya tiba, "gjr:simpanan-diperbarui"
//                  disiarkan dan useApi menyegarkan layarnya sendiri. Halaman
//                  yang pernah dibuka tampil seketika alih-alih menunggu ±2
//                  detik, dan angka terbarunya menyusul.
//   lebih tua      diperlakukan seperti belum pernah diambil.
//
// Data basi dibatasi dari dua sisi: setiap perubahan lewat api ini, login,
// dan logout mengosongkan simpanan seketika; perubahan oleh PENGGUNA LAIN
// terlihat begitu permintaan latar belakangnya kembali.
const SEGAR_MS = 30_000;
const BASI_MAKS_MS = 5 * 60_000;
const inflight = new Map();
const simpanan = new Map(); // path -> { kapan, data }

// Naik setiap kali simpanan dikosongkan. Balasan yang diminta SEBELUM
// pengosongan tidak boleh masuk simpanan begitu tiba sesudahnya — ia memuat
// keadaan sebelum perubahan, dan akan disajikan sebagai data terbaru.
let generasi = 0;

export function lupakanSimpanan() {
  generasi += 1;
  inflight.clear();
  simpanan.clear();
}

function dedupedGet(path) {
  const ada = simpanan.get(path);
  const umur = ada ? Date.now() - ada.kapan : Infinity;

  if (umur < SEGAR_MS) return Promise.resolve(ada.data);

  if (umur < BASI_MAKS_MS) {
    if (!inflight.has(path)) {
      ambilBaru(path)
        .then(siarkanPembaruan)
        // Gagal di latar belakang tidak diumumkan: yang tampil tetap data
        // terakhir yang berhasil, dan 401 sudah ditangani di request().
        .catch(() => {});
    }
    return Promise.resolve(ada.data);
  }

  return inflight.get(path) ?? ambilBaru(path);
}

// Dashboard memperbarui belasan path sekaligus, dan jawabannya tiba hampir
// bersamaan. Satu siaran untuk satu rombongan, bukan satu per path — setiap
// siaran membuat semua useApi yang terpasang menjalankan ulang pengambilnya.
let siaranTertunda = false;
function siarkanPembaruan() {
  if (siaranTertunda) return;
  siaranTertunda = true;
  setTimeout(() => {
    siaranTertunda = false;
    window.dispatchEvent(new CustomEvent("gjr:simpanan-diperbarui"));
  }, 50);
}

function ambilBaru(path) {
  const gen = generasi;
  const p = request("GET", path)
    .then((data) => {
      if (gen === generasi) simpanan.set(path, { kapan: Date.now(), data });
      return data;
    })
    .finally(() => {
      if (inflight.get(path) === p) inflight.delete(path);
    });
  inflight.set(path, p);
  return p;
}

// Setiap perubahan data mengosongkan simpanan dan seluruh GET yang sedang
// terbang, supaya refetch() setelah menyimpan benar-benar meminta ke server —
// bukan menerima balasan yang terlanjur diminta SEBELUM perubahan itu terjadi.
function afterMutation(promise) {
  return promise.finally(lupakanSimpanan);
}

export const api = {
  get:    (path)        => dedupedGet(path),
  post:   (path, body)  => afterMutation(request("POST",   path, body)),
  patch:  (path, body)  => afterMutation(request("PATCH",  path, body)),
  delete: (path)        => afterMutation(request("DELETE", path)),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (email, password) => api.post("/auth/login", { email, password }),
  logout: ()                => api.post("/auth/logout"),
  me:     ()                => api.get("/auth/me"),
};

// ── Publik (tanpa login) ──────────────────────────────────────────────────────
// Dipakai halaman login untuk menampilkan angka sungguhan. Hanya agregat —
// lihat PublicController di backend untuk batasan datanya.
export const publicApi = {
  stats: () => api.get("/public/stats"),
};

// ── Dashboard (admin) ─────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get("/dashboard/summary"),
  trend:   () => api.get("/dashboard/trend"),
};

// ── Pohon ─────────────────────────────────────────────────────────────────────
export const treeApi = {
  list:          (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/trees${qs ? "?" + qs : ""}`);
  },
  get:           (id)          => api.get(`/trees/${id}`),
  getPublic:     (id)          => api.get(`/trees/${id}/public`),
  create:        (data)        => api.post("/trees", data),
  updateHealth:  (id, status)  => api.patch(`/trees/${id}/health`, { health_status: status }),
  addPhoto:      (id, data)    => api.post(`/trees/${id}/photos`, data),
  // Varian ringan khusus peta: 7 kolom, bukan 12.
  // Peta tidak bisa dipaginasi — satu titik hilang berarti petanya berbohong
  // soal sebaran — jadi muatannya ditekan lewat jumlah KOLOM. Terukur
  // 53.350 B -> 27.857 B pada 179 pohon, dengan penyaringan peran yang sama.
  map:   ()   => api.get("/trees/map"),
  // Deret pengukuran satu pohon. Diambil saat grafiknya dibuka saja.
  growth: (id) => api.get(`/trees/${id}/growth`),
  available:     ()            => api.get(`/trees/available`),
  // Ditolak backend (409) kalau pohonnya masih terikat sertifikat — pesannya
  // sudah menyebut sertifikat mana, jadi cukup ditampilkan apa adanya.
  remove:        (id)          => api.delete(`/trees/${id}`),
};

// ── Petani ────────────────────────────────────────────────────────────────────
export const farmerApi = {
  list:  ()   => api.get("/farmers"),
  get:   (id) => api.get(`/farmers/${id}`),
  // Profil sempit yang boleh dibaca pendukung; /farmers/{id} menolak buyer.
  profilPublik: (id) => api.get(`/farmers/${id}/profil-publik`),
  // Kelompok tani berdampingan. Admin saja — lihat alasannya di controller.
  perbandingan: () => api.get("/farmers/perbandingan"),
};

// ── Buyer ─────────────────────────────────────────────────────────────────────
export const buyerApi = {
  list:  ()   => api.get("/buyers"),
  get:   (id) => api.get(`/buyers/${id}`),
  // Halaman dampak yang dibagikan. Tanpa login — token acak yang memutus
  // hubungan antara tautan dan ID buyer yang berurutan.
  dampakPublik: (token) => api.get(`/dampak-publik/${token}`),
  terbitkanShare: (id) => api.post(`/buyers/${id}/share`),
  cabutShare: (id) => api.delete(`/buyers/${id}/share`),
};

// ── Jenis pohon ───────────────────────────────────────────────────────────────
export const speciesApi = {
  list:   ()     => api.get("/species"),
  create: (data) => api.post("/species", data),
  update: (id, data) => api.patch(`/species/${id}`, data),
  // Ditolak backend (409) kalau jenisnya masih dipakai pohon.
  remove: (id)   => api.delete(`/species/${id}`),
};

// ── Akun / User management ────────────────────────────────────────────────────
export const accountApi = {
  // termasukNonaktif: akun yang sudah dinonaktifkan ikut dikirim. Tanpa ini
  // mereka hilang dari layar dan tidak bisa diaktifkan lagi lewat aplikasi.
  list:           (termasukNonaktif = false) =>
    api.get(termasukNonaktif ? "/accounts?termasuk_nonaktif=1" : "/accounts"),
  create:         (data)       => api.post("/accounts", data),
  deactivate:     (id)         => api.patch(`/accounts/${id}/deactivate`),
  activate:       (id)         => api.patch(`/accounts/${id}/activate`),
  // current_password WAJIB kalau yang diubah adalah akun sendiri — tanpa itu
  // siapa pun yang menemukan layar admin terbuka bisa mengunci pemiliknya.
  updatePassword: (id, password, currentPassword) =>
    api.patch(`/accounts/${id}/password`, currentPassword ? { password, current_password: currentPassword } : { password }),
};

// ── Carbon Fund ───────────────────────────────────────────────────────────────
export const carbonFundApi = {
  income:       (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/income${qs ? "?" + qs : ""}`);
  },
  addIncome:    (data) => api.post("/carbon-fund/income", data),
  updateIncome: (id, data) => api.patch(`/carbon-fund/income/${id}`, data),
  deleteIncome: (id) => api.delete(`/carbon-fund/income/${id}`),
  distribution: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/distribution${qs ? "?" + qs : ""}`);
  },
  // Agregat untuk petani: tanpa rincian transaksi dan tanpa nama pembeli.
  transparansi: () => api.get("/carbon-fund/transparansi"),
  summary:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/carbon-fund/summary${qs ? "?" + qs : ""}`);
  },
};

// ── Sertifikat / Adopsi ───────────────────────────────────────────────────────
export const adoptionApi = {
  list:   ()     => api.get("/adoptions"),
  create: (data) => api.post("/adoptions", data),
  verify: (id)   => api.patch(`/adoptions/${id}/verify`),
  // Perpanjangan: menyambung expires_at dari tanggal habis LAMA, bukan dari
  // hari ini — buyer yang memperpanjang lebih awal tidak kehilangan sisa masa
  // yang sudah dibayarnya. Boleh dipanggil buyer pemiliknya sendiri.
  renew:  (id)   => api.post(`/adoptions/${id}/renew`),
  // days: ambang berapa hari ke depan. Admin melihat semua, buyer hanya
  // miliknya — penyaringannya di backend, bukan di sini.
  expiring: (days = 60) => api.get(`/adoptions/expiring?days=${days}`),
  // Pohon milik petani ini yang sudah diadopsi. Sempit: tanpa harga, tanpa
  // nomor sertifikat.
  pohonSaya: () => api.get("/adoptions/pohon-saya"),
  // Baris dana masuk yang tertaut ikut terhapus di backend; balasannya
  // menyertakan income_removed supaya bisa disebut di notifikasi.
  remove: (id)   => api.delete(`/adoptions/${id}`),
};

// ── Laporan lapangan petani ───────────────────────────────────────────────
//
// Satu endpoint untuk dua jenis laporan (kondisi pohon & pendaftaran pohon
// baru), dan satu endpoint untuk melihatnya. Yang terlihat BERBEDA per peran:
// admin menerima seluruh antrean, petani hanya laporannya sendiri. Penyaringan
// itu dilakukan backend berdasarkan peran di dalam token, jadi tidak ada
// parameter peran yang perlu dikirim dari sini — dan memang tidak boleh ada.
export const reportApi = {
  list:   (status)  => api.get(status ? `/reports?status=${status}` : "/reports"),
  create: (data)    => api.post("/reports", data),
  // keputusan: "setuju" | "tolak". Menolak WAJIB menyertakan review_note —
  // petani yang laporannya ditolak tanpa alasan tidak tahu apa yang harus
  // diperbaiki, lalu berhenti melapor sama sekali.
  review: (id, data) => api.patch(`/reports/${id}/review`, data),
};

// ── Pemberitahuan ─────────────────────────────────────────────────────────
//
// Selalu milik akun yang sedang login; tidak ada parameter id akun sama sekali,
// dan itu disengaja — endpoint yang menerimanya dari luar akan langsung jadi
// jalur membaca pemberitahuan orang lain.
export const notificationApi = {
  list:    ()   => api.get("/notifications"),
  read:    (id) => api.patch(`/notifications/${id}/read`),
  readAll: ()   => api.patch("/notifications/read-all"),
};

// ── Gaji karbon ───────────────────────────────────────────────────────────
export const salaryApi = {
  list:    (period) => api.get(period ? `/carbon-salaries?period=${period}` : "/carbon-salaries"),
  // Idempoten: menjalankan ulang periode yang sama menimpa barisnya, tidak
  // menumpuk. Insentif opsional, berbentuk { F009: { social, ecological,
  // participation } } — sistem tidak bisa menghitungnya sendiri karena itu
  // penilaian terhadap orangnya, bukan data pohon.
  compute: (period, incentives) =>
    api.post("/carbon-salaries/compute", { period, incentives }),
};

// ── Jejak audit ───────────────────────────────────────────────────────────────
export const auditApi = {
  // Dipaginasi di server: tabel ini tumbuh paling cepat di antara semua tabel,
  // karena bertambah setiap kali ada yang menyentuh uang, sertifikat, pohon,
  // atau akun.
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    ).toString();
    return api.get(qs ? `/audit-logs?${qs}` : "/audit-logs");
  },
};

// ── Periode pengukuran ────────────────────────────────────────────────────────
export const cycleApi = {
  // Cakupannya ditentukan backend: petani menerima kemajuan petaknya sendiri,
  // pengurus menerima kemajuan seluruh desa. Klien tidak memilih.
  list:      ()        => api.get("/measurement-cycles"),
  create:    (data)    => api.post("/measurement-cycles", data),
  update:    (id, d)   => api.patch(`/measurement-cycles/${id}`, d),
  breakdown: (id)      => api.get(`/measurement-cycles/${id}/breakdown`),
};
