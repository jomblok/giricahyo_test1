// Mock data relasi buyer (tamu/donor) yang mengadopsi/mendukung pohon tertentu.
// Sesuai PDF "Tree Adoption Package" — bukan kepemilikan, melainkan dukungan
// jasa lingkungan karbon.
// TODO: ganti dengan fetch('/api/tree-adoptions') saat backend siap

export const treeAdoptions = [
  {
    id: 1,
    treeId: "GJR-002-001",
    buyerName: "PT Hijau Lestari",
    buyerId: "B001",
    adoptedDate: "2024-12-05",
    packageName: "Tree Adoption — 1 Pohon",
    certificateNo: "GJR-CERT-2024-0001",
  },
  {
    id: 2,
    treeId: "GJR-005-001",
    buyerName: "PT Hijau Lestari",
    buyerId: "B001",
    adoptedDate: "2024-12-05",
    packageName: "Tree Adoption — 1 Pohon",
    certificateNo: "GJR-CERT-2024-0002",
  },
];
