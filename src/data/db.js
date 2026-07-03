// src/data/db.js
// Database in-memory untuk sesi ini.
// TODO: ganti seluruh isi file ini dengan API call ke backend.

import { trees as seedTrees } from "./trees";
import { farmers as seedFarmers } from "./farmers";
import { buyers as seedBuyers } from "./buyers";
import { carbonSalaries as seedSalaries } from "./carbonSalaries";
import { carbonFundIncome as seedIncome } from "./carbonFundIncome";
import { fundDistribution as seedDist } from "./fundDistribution";
import { treeAdoptions as seedAdoptions } from "./treeAdoptions";
import { speciesCatalog as seedSpecies } from "./speciesCatalog";

// ── Akun / Auth ──────────────────────────────────────────────────────────────
// Satu-satunya sumber kebenaran untuk akun yang bisa login.
// Akun default: hanya satu admin. Petani & buyer ditambah oleh admin.
let _accounts = [
  { id: "ACC001", email: "admin@giricahyo.id", password: "admin123", role: "admin", name: "Koperasi Giricahyo", linkedId: null },
  // Akun petani dan buyer awal — sesuai data seed
  { id: "ACC002", email: "slamet@giricahyo.id", password: "petani123", role: "farmer", name: "Pak Slamet Riyadi", linkedId: "F001" },
  { id: "ACC003", email: "wartini@giricahyo.id", password: "petani123", role: "farmer", name: "Bu Wartini", linkedId: "F002" },
  { id: "ACC004", email: "darmaji@giricahyo.id", password: "petani123", role: "farmer", name: "Pak Darmaji", linkedId: "F003" },
  { id: "ACC005", email: "suyono@giricahyo.id", password: "petani123", role: "farmer", name: "Pak Suyono", linkedId: "F004" },
  { id: "ACC006", email: "ngatinem@giricahyo.id", password: "petani123", role: "farmer", name: "Bu Ngatinem", linkedId: "F005" },
  { id: "ACC007", email: "buyer@giricahyo.id", password: "buyer123", role: "buyer", name: "PT Hijau Lestari", linkedId: "B001" },
];

// ── State in-memory ──────────────────────────────────────────────────────────
let _trees = [...seedTrees];
let _farmers = [...seedFarmers];
let _salaries = [...seedSalaries];
let _income = [...seedIncome];
let _dist = [...seedDist];
let _adoptions = [...seedAdoptions];
let _buyers = [...seedBuyers];
let _species = [...seedSpecies];

const _listeners = new Set();
function _notify() { _listeners.forEach((fn) => fn()); }

export function subscribeDb(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Accounts ─────────────────────────────────────────────────────────────────
export function getAllAccounts() { return _accounts; }

export function findAccountByEmail(email) {
  return _accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
}

// Tambah akun baru — dipanggil oleh admin dari halaman Kelola Pengguna
// linkedId: farmerId (untuk farmer) atau buyerId (untuk buyer), null untuk admin
export function addAccount({ name, email, password, role, linkedId = null }) {
  if (findAccountByEmail(email)) {
    return { ok: false, error: `Email ${email} sudah terdaftar.` };
  }
  const id = `ACC${String(_accounts.length + 1).padStart(3, "0")}`;
  const acc = { id, email, password, role, name, linkedId };
  _accounts = [..._accounts, acc];
  _notify();
  return { ok: true, account: acc };
}

export function updateAccountPassword(accountId, newPassword) {
  _accounts = _accounts.map((a) =>
    a.id === accountId ? { ...a, password: newPassword } : a
  );
  _notify();
  return { ok: true };
}

// Set status aktif/nonaktif akun (dua arah, bisa diaktifkan kembali).
export function setAccountDeactivated(accountId, deactivated) {
  _accounts = _accounts.map((a) =>
    a.id === accountId ? { ...a, deactivated } : a
  );
  _notify();
  return { ok: true };
}

// Cari akun berdasarkan linkedId (farmerId/buyerId) — dipakai saat admin
// menonaktifkan petani/buyer dari sisi data petani, supaya akun login-nya
// ikut diblokir secara konsisten.
export function findAccountByLinkedId(linkedId) {
  return _accounts.find((a) => a.linkedId === linkedId) || null;
}

// ── Farmers ──────────────────────────────────────────────────────────────────
export function getAllFarmers() { return _farmers; }
export function getFarmerById(id) { return _farmers.find((f) => f.id === id) || null; }

export function addFarmer({ name, groupCoop, address }) {
  const nextNum = _farmers.length + 1;
  const id = `F${String(nextNum).padStart(3, "0")}`;
  const farmer = { id, name, groupCoop, address, status: "active" };
  _farmers = [..._farmers, farmer];
  _notify();
  return { ok: true, farmer };
}

// Ubah status aktif/nonaktif petani. Ini SATU-SATUNYA cara mengubah status
// petani — sebelumnya status hanya bisa diset saat petani dibuat, tidak
// bisa diubah lagi setelahnya.
// Status ini mempengaruhi: (1) KPI "Petani Aktif" di dashboard admin,
// (2) apakah petani dihitung dalam distribusi gaji karbon
// (lihat getFarmersWithSalary di joins.js), dan (3) login petani tersebut
// ikut diblokir/dibuka otomatis lewat akun yang terhubung (linkedId).
export function updateFarmerStatus(farmerId, status) {
  const idx = _farmers.findIndex((f) => f.id === farmerId);
  if (idx === -1) return { ok: false, error: `Petani ${farmerId} tidak ditemukan.` };
  _farmers = _farmers.map((f, i) => (i === idx ? { ...f, status } : f));

  // Sinkronkan ke akun login terkait, supaya satu aksi admin konsisten:
  // nonaktifkan petani = petani itu juga tidak bisa login lagi.
  const account = findAccountByLinkedId(farmerId);
  if (account) {
    _accounts = _accounts.map((a) =>
      a.id === account.id ? { ...a, deactivated: status === "inactive" } : a
    );
  }

  _notify();
  return { ok: true };
}

// ── Trees ────────────────────────────────────────────────────────────────────
export function getAllTrees() { return _trees; }
export function getTreeById(id) { return _trees.find((t) => t.id === id) || null; }

export function addTree(treeData) {
  if (_trees.find((t) => t.id === treeData.id)) {
    return { ok: false, error: `ID pohon ${treeData.id} sudah ada di sistem.` };
  }
  _trees = [..._trees, { ...treeData, lastUpdated: new Date().toISOString().split("T")[0] }];
  _notify();
  return { ok: true, tree: _trees[_trees.length - 1] };
}

export function updateTreeHealth(treeId, healthStatus) {
  const idx = _trees.findIndex((t) => t.id === treeId);
  if (idx === -1) return { ok: false, error: `Pohon ${treeId} tidak ditemukan.` };
  _trees = _trees.map((t, i) =>
    i === idx ? { ...t, healthStatus, lastUpdated: new Date().toISOString().split("T")[0] } : t
  );
  _notify();
  return { ok: true };
}

// ── Salaries ─────────────────────────────────────────────────────────────────
export function getAllSalaries() { return _salaries; }
export function getSalaryByFarmerId(farmerId) {
  return _salaries.find((s) => s.farmerId === farmerId) || null;
}

// ── Carbon Fund ──────────────────────────────────────────────────────────────
export function getAllIncome() { return _income; }
export function getAllDistribution() { return _dist; }

// ── Buyers ───────────────────────────────────────────────────────────────────
export function getAllBuyers() { return _buyers; }
export function getBuyerById(id) { return _buyers.find((b) => b.id === id) || null; }

export function addBuyer({ name, email = "", phone = "" }) {
  const nextNum = _buyers.length + 1;
  const id = `B${String(nextNum).padStart(3, "0")}`;
  const buyer = { id, name, email, phone };
  _buyers = [..._buyers, buyer];
  _notify();
  return { ok: true, buyer };
}

// ── Species Catalog ──────────────────────────────────────────────────────────
export function getAllSpecies() { return _species; }

export function addSpecies({ name, densityRho }) {
  if (_species.find((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Jenis pohon "${name}" sudah ada di katalog.` };
  }
  _species = [..._species, { name, densityRho: Number(densityRho) }];
  _notify();
  return { ok: true };
}

// ── Tree Adoptions / Sertifikat ───────────────────────────────────────────────
export function getAllAdoptions() { return _adoptions; }
export function getAdoptionByTreeId(treeId) {
  return _adoptions.find((a) => a.treeId === treeId) || null;
}
export function getAdoptionsByBuyerId(buyerId) {
  return _adoptions.filter((a) => a.buyerId === buyerId);
}

function generateCertificateNo() {
  const year = new Date().getFullYear();
  const countThisYear = _adoptions.filter((a) => a.certificateNo?.includes(`-${year}-`)).length;
  const seq = String(countThisYear + 1).padStart(4, "0");
  return `GJR-CERT-${year}-${seq}`;
}

export function addAdoption({ treeId, buyerId, packageName }) {
  const tree = getTreeById(treeId);
  if (!tree) return { ok: false, error: `Pohon ${treeId} tidak ditemukan.` };
  const buyer = getBuyerById(buyerId);
  if (!buyer) return { ok: false, error: `Buyer ${buyerId} tidak ditemukan.` };

  const adoption = {
    id: _adoptions.length + 1,
    treeId,
    buyerId,
    buyerName: buyer.name,
    adoptedDate: new Date().toISOString().split("T")[0],
    packageName,
    certificateNo: generateCertificateNo(),
  };
  _adoptions = [..._adoptions, adoption];
  _notify();
  return { ok: true, adoption };
}
