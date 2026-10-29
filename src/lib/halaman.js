// src/lib/halaman.js
//
// Satu tempat untuk pemuat berkas setiap halaman yang ada di menu. App.jsx
// memakainya untuk lazy(), dan menu (Sidebar, BottomNav) memakainya untuk
// MEMUAT DULUAN saat kursor diarahkan atau jari menyentuh sebuah menu.
//
// Kenapa: setiap halaman adalah berkas JS terpisah yang baru diunduh setelah
// menunya diklik, lalu barulah halaman itu meminta datanya. Jeda antara
// kursor tiba di menu dan tombol mouse dilepas biasanya ratusan milidetik —
// cukup untuk mengunduh berkas halamannya lebih dulu, sehingga saat diklik
// yang tersisa hanya menunggu data.
//
// Pemuatnya disimpan di sini, bukan disalin ke menu, supaya tidak ada dua
// daftar jalur berkas yang bisa saling menyimpang.

export const HALAMAN = {
  // Admin
  "/pohon":          () => import("../pages/TreesPage"),
  "/jenis-pohon":    () => import("../pages/SpeciesCatalogPage"),
  "/petani":         () => import("../pages/FarmersPage"),
  "/peta":           () => import("../pages/MapPage"),
  "/dana":           () => import("../pages/FundPage"),
  "/sertifikat":     () => import("../pages/ManageCertificatesPage"),
  "/pengguna":       () => import("../pages/ManageUsersPage"),
  "/generate-qr":    () => import("../pages/GenerateQrPage"),
  "/qr-massal":      () => import("../pages/BulkQrPage"),
  "/laporan":        () => import("../pages/VerifyReportsPage"),
  "/perlu-tindakan": () => import("../pages/NeedsActionPage"),
  "/audit":          () => import("../pages/AuditLogPage"),
  "/periode-ukur":   () => import("../pages/MeasurementCyclesPage"),
  "/perbandingan":   () => import("../pages/GroupComparisonPage"),
  "/laporan-cetak":  () => import("../pages/PrintReportPage"),
  // Petani
  "/pohon-saya":     () => import("../pages/MyTreesPage"),
  "/gaji":           () => import("../pages/MySalaryPage"),
  "/daftar-pohon":   () => import("../pages/RegisterTreePage"),
  "/laporan-saya":   () => import("../pages/MyReportsPage"),
  "/peta-kebun":     () => import("../pages/MyGardenMapPage"),
  "/dana-desa":      () => import("../pages/FundTransparencyPage"),
  "/cara-ukur":      () => import("../pages/MeasurementGuidePage"),
  // Pembeli
  "/dukungan":        () => import("../pages/SupportedTreesPage"),
  "/dampak":          () => import("../pages/MyImpactPage"),
  "/sertifikat-saya": () => import("../pages/MyCertificatesSheetPage"),
};

/**
 * Mulai mengunduh berkas halaman `path` tanpa menampilkannya. Aman dipanggil
 * berulang: import() yang sama hanya mengunduh sekali. Kegagalan diabaikan —
 * klik sesungguhnya akan mencoba lagi dan menampilkan galatnya di tempat
 * yang semestinya.
 */
export function pramuat(path) {
  HALAMAN[path]?.().catch(() => {});
}
