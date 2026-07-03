// src/data/speciesCatalog.js
// Katalog jenis pohon beserta kerapatan kayu (ρ) untuk formula AGB.
// Admin bisa menambah jenis baru langsung dari halaman Generate QR —
// data akan masuk ke sini (in-memory) lewat addSpecies() di db.js.
// TODO: ganti dengan fetch('/api/species') saat backend siap

export const speciesCatalog = [
  { name: "Jati", densityRho: 0.65 },
  { name: "Mahoni", densityRho: 0.62 },
  { name: "Nyamplung", densityRho: 0.60 },
  { name: "Akasia", densityRho: 0.55 },
  { name: "Kayu Putih", densityRho: 0.50 },
  { name: "Jambu Mete", densityRho: 0.58 },
  { name: "Lamtoro", densityRho: 0.52 },
  { name: "Sono Keling", densityRho: 0.70 },
  { name: "Trembesi", densityRho: 0.40 },
];
