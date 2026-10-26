// src/lib/packageCatalog.js
//
// Tingkat/tier untuk Package 3 (Carbon Tourism Experience) dan Package 4
// (ESG/CSR Partnership) dari PDF "Penguatan Manajemen Bisnis Karbon" — dua
// paket yang sebelumnya cuma bisa dipilih labelnya saja tanpa tingkat/harga,
// beda dengan Basic Carbon (lib/basicCarbon.js) dan Tree Adoption yang sudah
// punya pilihan tingkat. Mengikuti bentuk & konvensi basicCarbon.js persis
// supaya UI-nya konsisten.
//
// PDF memberi RENTANG harga per tingkat (mis. "Rp250.000 – Rp350.000"), tapi
// form perlu satu angka pasti untuk dikirim ke server — dipakai BATAS BAWAH
// tiap rentang, sama seperti angka yang disimpan di
// TreeAdoption::TIER_PRICES di backend. Kunci tier (key) HARUS sama persis
// dengan tabel itu.

export const CARBON_TOURISM_LABEL = "Carbon Tourism Experience";

export const CARBON_TOURISM_TIERS = [
  {
    key: "half_day",
    name: "Carbon Discovery",
    duration: "half_day_duration",
    price: 250000,
    benefits: ["tourism_benefit_visit", "tourism_benefit_dbh", "tourism_benefit_cert"],
  },
  {
    key: "full_day",
    name: "Carbon Village Experience",
    duration: "full_day_duration",
    price: 500000,
    featured: true,
    benefits: ["tourism_benefit_visit", "tourism_benefit_mrv", "tourism_benefit_workshop", "tourism_benefit_cert"],
  },
  {
    key: "premium",
    name: "Impact Experience",
    duration: "premium_duration",
    price: 1000000,
    benefits: ["tourism_benefit_adoption", "tourism_benefit_guide", "tourism_benefit_dashboard", "tourism_benefit_cert"],
  },
];

export const TREE_ADOPTION_LABEL = "Tree Adoption Package";

// Package 2 — Tree Adoption, halaman 13 PDF ("PILIH PAKET ADOPSI ANDA").
//
// Sebelumnya ketiga ukuran ini muncul sebagai TIGA baris terpisah di daftar
// paket ("Tree Adoption — 1 Pohon", "— 5 Pohon", "— 10 Pohon"), padahal PDF
// menempatkannya sebagai SATU paket dengan tiga tingkatan — persis seperti
// Basic Carbon, Carbon Tourism, dan ESG. Akibatnya daftar paket berisi enam
// baris untuk empat paket, dan Tree Adoption jadi satu-satunya paket tanpa
// kartu tingkat sehingga harga dan manfaatnya tidak pernah terlihat sebelum
// sertifikat dibuat.
//
// Harganya angka pasti (bukan rentang seperti Tourism/ESG), langsung dari PDF.
export const TREE_ADOPTION_TIERS = [
  {
    key: "tree_1",
    name: "1 Pohon",
    trees: 1,
    subtitle: "tree_adoption_1_subtitle",
    price: 150000,
    benefits: [
      "tree_adoption_benefit_registered_1",
      "tree_adoption_benefit_qr",
      "tree_adoption_benefit_growth",
      "tree_adoption_benefit_cert",
      "tree_adoption_benefit_farmer",
    ],
  },
  {
    key: "tree_5",
    name: "5 Pohon",
    trees: 5,
    subtitle: "tree_adoption_5_subtitle",
    price: 700000,
    featured: true,
    benefits: [
      "tree_adoption_benefit_registered_5",
      "tree_adoption_benefit_qr",
      "tree_adoption_benefit_growth",
      "tree_adoption_benefit_cert",
      "tree_adoption_benefit_impact_wider",
    ],
  },
  {
    key: "tree_10",
    name: "10 Pohon",
    trees: 10,
    subtitle: "tree_adoption_10_subtitle",
    price: 1300000,
    benefits: [
      "tree_adoption_benefit_registered_10",
      "tree_adoption_benefit_qr",
      "tree_adoption_benefit_growth",
      "tree_adoption_benefit_cert_premium",
      "tree_adoption_benefit_wall",
    ],
  },
];

export const ESG_LABEL = "ESG/CSR Partnership";

export const ESG_TIERS = [
  {
    key: "bronze",
    name: "Bronze",
    subtitle: "esg_bronze_subtitle",
    price: 5000000,
    benefits: ["esg_benefit_cert", "esg_benefit_summary_report", "esg_benefit_impact_small"],
  },
  {
    key: "silver",
    name: "Silver",
    subtitle: "esg_silver_subtitle",
    price: 25000000,
    featured: true,
    benefits: ["esg_benefit_cert", "esg_benefit_dashboard", "esg_benefit_report", "esg_benefit_impact_medium"],
  },
  {
    key: "gold",
    name: "Gold",
    subtitle: "esg_gold_subtitle",
    price: 100000000,
    benefits: ["esg_benefit_annual_report", "esg_benefit_sroi", "esg_benefit_impact_large", "esg_benefit_visit"],
  },
  {
    key: "platinum",
    name: "Platinum",
    subtitle: "esg_platinum_subtitle",
    price: 500000000,
    benefits: ["esg_benefit_dashboard_khusus", "esg_benefit_scaling", "esg_benefit_publication"],
  },
];

export function formatRupiahShort(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Cari definisi tier dari kuncinya, lintas kedua katalog — dipakai untuk
// menampilkan nama tingkat yang manusiawi dari package_tier (yang di
// database cuma menyimpan kuncinya, mis. "half_day").
export function findTier(tierKey) {
  if (!tierKey) return null;
  return (
    CARBON_TOURISM_TIERS.find((t) => t.key === tierKey) ??
    TREE_ADOPTION_TIERS.find((t) => t.key === tierKey) ??
    ESG_TIERS.find((t) => t.key === tierKey) ??
    null
  );
}

// Label paket adopsi untuk ditampilkan ke buyer.
//
// Ada dua bentuk nama di basis data. Yang lama menaruh tingkatnya di dalam
// nama ("Tree Adoption — 1 Pohon"), yang baru memakai satu nama untuk
// ketiganya ("Tree Adoption Package") dan menyimpan tingkat di kolom
// tersendiri. Tanpa fungsi ini kartu adopsi menampilkan nama mentah
// berbahasa Inggris untuk paket baru, padahal paket lama tampil rapi.
export function labelPaketAdopsi(packageName, packageTier) {
  if (packageName === TREE_ADOPTION_LABEL) {
    const tingkat = TREE_ADOPTION_TIERS.find((x) => x.key === packageTier);
    if (tingkat) return tingkat.name;
  }
  return packageName?.replace("Tree Adoption — ", "") ?? "—";
}
