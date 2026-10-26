// src/data/db.js — sisa data contoh, dipangkas ke yang benar-benar terpakai.
//
// Berkas ini dulu adalah "basis data in-memory" lengkap dari masa sebelum
// backend ada: 28 fungsi untuk akun, pohon, petani, buyer, jenis, gaji, dana,
// dan adopsi, beserta sistem langganan perubahannya sendiri.
//
// Setelah API jadi, 24 di antaranya tidak dipanggil siapa pun. Yang tersisa
// hanya empat, dan hanya untuk SATU pemakai: cadangan khusus-development di
// PublicTreePage (dijaga `import.meta.env.DEV` dan ditandai `isSample` di
// layar), lewat getTreeDetail() di lib/joins.js.
//
// DUA HAL YANG IKUT DIBUANG, dan alasannya:
//
//   1. Array `_accounts` berisi email dan KATA SANDI demo dalam teks biasa.
//      Berkas ini ikut terbundel ke browser, jadi kata sandi itu tersaji ke
//      siapa pun yang membuka berkas JS-nya. Halaman login memang menampilkan
//      akun demo dengan sengaja, tapi tidak ada alasan menyimpan salinan
//      KEDUA di tempat yang tidak dipakai apa-apa.
//
//   2. Fungsi tulis (addTree, updateTreeHealth, addAccount, dan seterusnya).
//      Semuanya menulis ke array in-memory yang hilang saat halaman dimuat
//      ulang. Membiarkannya ada mengundang pemakaian yang menyangka datanya
//      tersimpan.
//
// CATATAN PENTING untuk yang membaca nanti: ID di data contoh bergaya
// GJR-001-001, sedangkan data survei sungguhan GJR-L1-001. Jadi cadangan ini
// hanya mengenali sepuluh pohon fiktif, bukan 179 pohon asli. Gunanya terbatas
// pada memeriksa TAMPILAN saat backend mati — bukan memeriksa data.

import { trees as seedTrees } from "./trees";
import { farmers as seedFarmers } from "./farmers";
import { carbonSalaries as seedSalaries } from "./carbonSalaries";
import { treeAdoptions as seedAdoptions } from "./treeAdoptions";

const _trees = [...seedTrees];
const _farmers = [...seedFarmers];
const _salaries = [...seedSalaries];
const _adoptions = [...seedAdoptions];

export function getAllTrees() {
  return _trees;
}

export function getFarmerById(id) {
  return _farmers.find((f) => f.id === id) || null;
}

export function getSalaryByFarmerId(farmerId) {
  return _salaries.find((s) => s.farmerId === farmerId) || null;
}

export function getAdoptionByTreeId(treeId) {
  return _adoptions.find((a) => a.treeId === treeId) || null;
}
