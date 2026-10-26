// src/lib/basicCarbon.js
//
// Basic Carbon Contribution — Package 1 dari PDF "Penguatan Manajemen Bisnis
// Karbon". Tiga tingkatan kontribusi UMUM ke carbon fund komunitas, tidak
// terikat satu pohon tertentu (beda dari Tree Adoption). Karena skema
// `tree_adoptions` tidak punya kolom nominal/harga/masa berlaku, tier & harga
// disimpan dengan cara di-encode ke `package_name` yang sudah ada
// ("Basic Carbon Contribution — Basic Standard (Rp50.000)"), dan masa
// berlaku DIHITUNG dari `adopted_date` + durasi tetap per tier — bukan
// disimpan sebagai kolom baru. Satu sumber kebenaran ini dipakai bersama
// oleh form sertifikat, halaman Dana Karbon, dashboard buyer, sertifikat
// cetak, dan notifikasi — lihat rencana lengkapnya di artifact plan.

export const BASIC_CARBON_LABEL = "Basic Carbon Contribution";

export const BASIC_CARBON_TIERS = [
  {
    key: "small",
    name: "Basic Small",
    price: 20000,
    months: 1,
    benefits: ["basic_carbon_benefit_thanks", "basic_carbon_benefit_monthly"],
  },
  {
    key: "standard",
    name: "Basic Standard",
    price: 50000,
    months: 3,
    featured: true,
    benefits: ["basic_carbon_benefit_thanks", "basic_carbon_benefit_monthly", "basic_carbon_benefit_summary"],
  },
  {
    key: "plus",
    name: "Basic Plus",
    price: 100000,
    months: 6,
    benefits: [
      "basic_carbon_benefit_thanks",
      "basic_carbon_benefit_monthly",
      "basic_carbon_benefit_summary",
      "basic_carbon_benefit_certificate",
    ],
  },
];

export function formatRupiahShort(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(months, lang) {
  if (lang === "en") return `${months} month${months > 1 ? "s" : ""}`;
  return `${months} bulan`;
}

// "Basic Carbon Contribution — Basic Standard (Rp50.000)" — dikirim sebagai
// package_name, tanpa perlu kolom baru di tree_adoptions.
export function encodeBasicCarbonPackage(tierKey) {
  const tier = BASIC_CARBON_TIERS.find((tr) => tr.key === tierKey);
  if (!tier) return BASIC_CARBON_LABEL;
  return `${BASIC_CARBON_LABEL} — ${tier.name} (${formatRupiahShort(tier.price)})`;
}

// Mengenali & mem-parsing package_name apapun bentuknya. Mengembalikan null
// untuk paket lain (Tree Adoption/Tourism/ESG) DAN untuk sertifikat Basic
// Carbon lama yang dibuat sebelum fitur tier ini ada (package_name persis
// "Basic Carbon Contribution" tanpa tingkatan) — degradasi anggun, bukan error.
export function parseBasicCarbonTier(packageName) {
  if (!packageName || !packageName.startsWith(BASIC_CARBON_LABEL)) return null;
  return BASIC_CARBON_TIERS.find((tr) => packageName.includes(tr.name)) ?? null;
}

const DAY_MS = 86_400_000;
const EXPIRING_SOON_MS = 3 * DAY_MS;

// Info masa-berlaku lengkap untuk satu sertifikat, atau null kalau bukan
// Basic Carbon / tier-nya tidak bisa dikenali (lihat parseBasicCarbonTier).
export function getCertificateLifecycle(adoption, now = Date.now()) {
  if (!adoption) return null;

  // Sumber utama: expires_at dari server, yang DITETAPKAN saat sertifikat
  // dibuat (lihat TreeAdoption::resolveExpiry di backend). Ini berlaku untuk
  // SEMUA paket — bukan hanya Basic Carbon seperti sebelumnya.
  //
  // Cadangan di bawahnya menghitung ulang dari nama paket, khusus untuk
  // sertifikat lama yang dibuat sebelum kolom expires_at ada. Cadangan itu
  // sengaja dipertahankan supaya data lama tidak mendadak kehilangan masa
  // berlakunya, tapi TIDAK dipakai kalau server sudah memberi tanggalnya.
  const raw = adoption.expires_at ?? adoption.expiresAt;
  const tier = parseBasicCarbonTier(adoption.package_name);
  let expiresAt = raw ? new Date(raw) : null;

  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    if (!tier) return null;
    const adopted = new Date(adoption.adopted_date ?? adoption.adoptedDate);
    if (Number.isNaN(adopted.getTime())) return null;
    expiresAt = new Date(adopted);
    expiresAt.setMonth(expiresAt.getMonth() + tier.months);
  }

  // Berlaku sampai AKHIR hari kedaluwarsa — sertifikat yang berakhir hari ini
  // tidak boleh mendadak tidak berlaku sejak lewat tengah malam.
  expiresAt.setHours(23, 59, 59, 999);

  const msRemaining = expiresAt.getTime() - now;
  const status = msRemaining <= 0 ? "expired" : msRemaining <= EXPIRING_SOON_MS ? "soon" : "active";

  return { tier, expiresAt, msRemaining, status };
}

export const LIFECYCLE_TONE = { active: "good", soon: "warn", expired: "neutral" };
export const LIFECYCLE_LABEL_KEY = { active: "status_active", soon: "status_expiring_soon", expired: "status_expired" };

// "23 hari lagi" · "14 jam lagi" · "5 hari lalu" — hari selagi sisa ≥ 1 hari,
// pindah ke jam begitu sisa < 1 hari, dan "X hari lalu" begitu sudah berakhir.
export function formatCountdown(msRemaining, t) {
  const abs = Math.abs(msRemaining);
  if (msRemaining <= 0) {
    const days = Math.max(1, Math.round(abs / DAY_MS));
    return `${days} ${t("days_ago_suffix")}`;
  }
  if (abs >= DAY_MS) {
    const days = Math.ceil(abs / DAY_MS);
    return `${days} ${t("days_left_suffix")}`;
  }
  const hours = Math.max(1, Math.ceil(abs / 3_600_000));
  return `${hours} ${t("hours_left_suffix")}`;
}

// Basic Carbon = kontribusi umum, tidak terikat 1 pohon. Karena tree_id di
// tree_adoptions wajib terisi (foreign key), frontend memilihkan satu pohon
// di balik layar — pengguna tidak melihat/memilih ini. Solusi sisi-frontend
// murni untuk memenuhi batasan skema yang ada sekarang; lihat "Asumsi
// teknis" di plan.
//
// PENTING (ditemukan lewat percobaan nyata ke backend, bukan lewat sandbox):
// kolom tree_id di tabel tree_adoptions itu UNIK secara GLOBAL — migration-nya
// literal `$table->string('tree_id', 20)->unique(); // 1 pohon hanya 1 adopsi
// aktif`, dan divalidasi lagi di TreeAdoptionController@store dengan
// `unique:tree_adoptions,tree_id`. Artinya satu pohon cuma boleh muncul SATU
// KALI di seluruh tabel, APAPUN jenis paketnya — bukan cuma dibatasi sesama
// Basic Carbon. Versi sebelumnya (`pickLeastAssignedTree`) cuma menghitung
// sertifikat Basic Carbon sebagai "terpakai", jadi pohon yang sudah dipakai
// Tree Adoption/Tourism/ESG masih dianggap "kosong" dan dipilih lagi ->
// ditolak backend: "The tree id has already been taken." Diperbaiki: pilih
// pohon yang BELUM PERNAH punya adopsi SAMA SEKALI (paket apapun). Kalau
// semua pohon terdaftar sudah punya adopsi, mengembalikan null — pemanggil
// WAJIB menampilkan pesan jelas ke admin (bukan biarkan submit lalu gagal
// dengan error mentah dari backend).
export function pickAvailableTree(trees, adoptions) {
  if (!trees || trees.length === 0) return null;
  const used = new Set((adoptions ?? []).map((a) => a?.tree_id));
  return trees.find((tr) => !used.has(tr.id)) ?? null;
}
