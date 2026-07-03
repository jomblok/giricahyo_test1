// src/lib/joins.js
// Semua fungsi query/join membaca dari db.js (database in-memory reaktif),
// bukan langsung dari file data statis.

import {
  getAllTrees, getAllFarmers,
  getAllIncome, getAdoptionByTreeId, getFarmerById, getSalaryByFarmerId,
  getAdoptionsByBuyerId, getAllAdoptions, getBuyerById,
} from "../data/db";

// ── JOIN trees + farmers ──────────────────────────────────────────────────────
export function getTreesWithFarmer() {
  return getAllTrees().map((tree) => {
    const farmer = getFarmerById(tree.farmerId);
    return { ...tree, farmerName: farmer ? farmer.name : "Tidak diketahui" };
  });
}

// ── Pohon milik satu petani ───────────────────────────────────────────────────
export function getTreesByFarmerId(farmerId) {
  return getAllTrees()
    .filter((t) => t.farmerId === farmerId)
    .map((tree) => ({ ...tree, farmerName: getFarmerById(farmerId)?.name ?? "—" }));
}

// ── JOIN farmers + salaries + jumlah pohon ────────────────────────────────────
export function getFarmersWithSalary() {
  return getAllFarmers()
    .filter((f) => f.status === "active")
    .map((farmer) => {
      const salary = getSalaryByFarmerId(farmer.id);
      const treeCount = getAllTrees().filter((t) => t.farmerId === farmer.id).length;
      return {
        ...farmer,
        treeCount,
        totalCo2Kg: salary?.totalCo2Kg ?? 0,
        co2ProportionPct: salary?.co2ProportionPct ?? 0,
        baseSalary: salary?.baseSalary ?? 0,
        totalIncentivePct: salary
          ? salary.socialIncentivePct + salary.ecologicalIncentivePct + salary.participationIncentivePct
          : 0,
        finalSalary: salary?.finalSalary ?? 0,
      };
    })
    .sort((a, b) => b.finalSalary - a.finalSalary);
}

// ── KPI global (untuk admin) ──────────────────────────────────────────────────
export function getKpiSummary() {
  const trees = getAllTrees();
  const farmers = getAllFarmers();
  return {
    totalTrees: trees.length,
    totalCo2: trees.reduce((s, t) => s + t.co2EqKg, 0),
    activeFarmers: farmers.filter((f) => f.status === "active").length,
    totalIncome: getAllIncome().reduce((s, i) => s + i.totalAmount, 0),
  };
}

// ── Insight tambahan untuk dashboard admin ────────────────────────────────────
// Bukan sekadar angka KPI, tapi data yang langsung bisa ditindaklanjuti:
// pohon mana yang butuh perhatian, dan siapa kontributor CO2 terbesar.
export function getAdminInsights() {
  const trees = getAllTrees();
  const farmersWithSalary = getFarmersWithSalary();

  const healthCounts = {
    baik: trees.filter((t) => t.healthStatus === "baik").length,
    sedang: trees.filter((t) => t.healthStatus === "sedang").length,
    buruk: trees.filter((t) => t.healthStatus === "buruk").length,
  };

  const topFarmers = [...farmersWithSalary]
    .sort((a, b) => b.totalCo2Kg - a.totalCo2Kg)
    .slice(0, 3);

  const totalCertificates = getAllAdoptions().length;
  const totalBuyers = new Set(getAllAdoptions().map((a) => a.buyerId)).size;

  return { healthCounts, topFarmers, totalCertificates, totalBuyers };
}

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

// ── Data untuk dashboard Petani ───────────────────────────────────────────────
export function getFarmerDashboard(farmerId) {
  const farmer = getFarmerById(farmerId);
  const trees = getAllTrees().filter((t) => t.farmerId === farmerId);
  const salary = getSalaryByFarmerId(farmerId);
  const totalCo2 = trees.reduce((s, t) => s + t.co2EqKg, 0);
  const allCo2 = getAllTrees().reduce((s, t) => s + t.co2EqKg, 0);
  const proportion = allCo2 > 0 ? (totalCo2 / allCo2) * 100 : 0;
  return { farmer, trees, salary, totalCo2, proportion };
}

// ── Data untuk dashboard Buyer ────────────────────────────────────────────────
export function getBuyerDashboard(buyerId) {
  const adoptions = getAdoptionsByBuyerId(buyerId);
  const trees = adoptions.map((a) => {
    const tree = getAllTrees().find((t) => t.id === a.treeId);
    const farmer = tree ? getFarmerById(tree.farmerId) : null;
    return { ...a, tree, farmer };
  });
  const totalCo2 = trees.reduce((s, t) => s + (t.tree?.co2EqKg ?? 0), 0);
  return { adoptions: trees, totalCo2 };
}

// ── Semua sertifikat/adopsi + detail pohon, petani, buyer ────────────────────
// Dipakai oleh halaman admin "Kelola Sertifikat" — menunjukkan siapa membeli
// pohon siapa, untuk transparansi yang sama juga dilihat petani & buyer terkait.
export function getAllAdoptionsDetailed() {
  return getAllAdoptions()
    .map((a) => {
      const tree = getAllTrees().find((t) => t.id === a.treeId) || null;
      const farmer = tree ? getFarmerById(tree.farmerId) : null;
      const buyer = getBuyerById(a.buyerId);
      return { ...a, tree, farmer, buyer };
    })
    .sort((a, b) => new Date(b.adoptedDate) - new Date(a.adoptedDate));
}
