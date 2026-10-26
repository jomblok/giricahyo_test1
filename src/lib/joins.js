// src/lib/joins.js
// Semua fungsi query/join membaca dari db.js (database in-memory reaktif),
// bukan langsung dari file data statis.

import { getAllTrees, getFarmerById, getSalaryByFarmerId, getAdoptionByTreeId } from "../data/db";

// Hanya getTreeDetail yang tersisa.
//
// Berkas ini dulu mengekspor sembilan fungsi gabungan untuk seluruh dasbor,
// dari masa sebelum ada backend. Delapan di antaranya tidak dipanggil siapa
// pun sejak API-nya jadi; yang satu ini masih dipakai PublicTreePage sebagai
// cadangan KHUSUS DEVELOPMENT (dijaga import.meta.env.DEV dan ditandai
// isSample di layar).
//
// Catatan untuk yang membaca nanti: ID di data contoh bergaya GJR-001-001,
// sedangkan data survei sungguhan GJR-L1-001. Jadi cadangan ini hanya
// mengenali sepuluh pohon fiktif, bukan 179 pohon asli — gunanya terbatas
// pada menguji tampilan saat backend mati, bukan menguji data.

// ── Detail satu pohon lengkap ─────────────────────────────────────────────────
export function getTreeDetail(treeId) {
  const trees = getAllTrees();
  const tree = trees.find((t) => t.id === treeId);
  if (!tree) return null;
  const farmer = getFarmerById(tree.farmerId);
  const salary = getSalaryByFarmerId(tree.farmerId);
  const adoption = getAdoptionByTreeId(treeId);
  return { tree, farmer, salary, adoption };
}
