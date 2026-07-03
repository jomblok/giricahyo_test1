// Sesuai tabel SQL: trees (id, farmer_id, species, dbh_cm, height_m,
// density_rho, latitude, longitude, health_status, planted_date,
// last_updated, co2_eq_kg)
// TODO: ganti dengan fetch('/api/trees') saat backend siap

// Koordinat dummy berpusat di sekitar Giricahyo, Purwosari, Gunungkidul, DIY
const BASE_LAT = -7.9847;
const BASE_LNG = 110.4734;

export const trees = [
  { id: "GJR-001-001", farmerId: "F001", species: "Jati", dbhCm: 13, heightM: 6.2, densityRho: 0.65, latitude: BASE_LAT + 0.004, longitude: BASE_LNG + 0.002, healthStatus: "baik", plantedDate: "2022-03-10", lastUpdated: "2026-05-01", co2EqKg: 87.71 },
  { id: "GJR-002-001", farmerId: "F002", species: "Jati", dbhCm: 13, heightM: 6.0, densityRho: 0.65, latitude: BASE_LAT + 0.006, longitude: BASE_LNG - 0.003, healthStatus: "baik", plantedDate: "2022-03-12", lastUpdated: "2026-05-01", co2EqKg: 87.71 },
  { id: "GJR-003-001", farmerId: "F003", species: "Mahoni", dbhCm: 16, heightM: 7.5, densityRho: 0.62, latitude: BASE_LAT - 0.003, longitude: BASE_LNG + 0.005, healthStatus: "baik", plantedDate: "2021-11-20", lastUpdated: "2026-05-03", co2EqKg: 147.42 },
  { id: "GJR-004-001", farmerId: "F004", species: "Nyamplung", dbhCm: 19, heightM: 8.0, densityRho: 0.60, latitude: BASE_LAT - 0.005, longitude: BASE_LNG - 0.002, healthStatus: "sedang", plantedDate: "2021-09-15", lastUpdated: "2026-04-28", co2EqKg: 225.91 },
  { id: "GJR-005-001", farmerId: "F005", species: "Nyamplung", dbhCm: 21, heightM: 8.4, densityRho: 0.60, latitude: BASE_LAT + 0.008, longitude: BASE_LNG + 0.006, healthStatus: "baik", plantedDate: "2021-08-02", lastUpdated: "2026-05-02", co2EqKg: 290.88 },
  { id: "GJR-001-002", farmerId: "F001", species: "Akasia", dbhCm: 11, heightM: 5.4, densityRho: 0.55, latitude: BASE_LAT + 0.0035, longitude: BASE_LNG + 0.0025, healthStatus: "baik", plantedDate: "2022-05-18", lastUpdated: "2026-05-01", co2EqKg: 57.77 },
  { id: "GJR-006-001", farmerId: "F006", species: "Kayu Putih", dbhCm: 9, heightM: 4.1, densityRho: 0.50, latitude: BASE_LAT - 0.007, longitude: BASE_LNG + 0.004, healthStatus: "buruk", plantedDate: "2023-01-10", lastUpdated: "2026-03-15", co2EqKg: 31.20 },
  { id: "GJR-007-001", farmerId: "F007", species: "Jambu Mete", dbhCm: 14, heightM: 6.6, densityRho: 0.58, latitude: BASE_LAT + 0.002, longitude: BASE_LNG - 0.005, healthStatus: "baik", plantedDate: "2022-07-22", lastUpdated: "2026-05-04", co2EqKg: 94.30 },
  { id: "GJR-008-001", farmerId: "F008", species: "Lamtoro", dbhCm: 12, heightM: 5.8, densityRho: 0.52, latitude: BASE_LAT - 0.002, longitude: BASE_LNG - 0.006, healthStatus: "sedang", plantedDate: "2022-09-05", lastUpdated: "2026-04-20", co2EqKg: 71.40 },
  { id: "GJR-003-002", farmerId: "F003", species: "Jati", dbhCm: 10, heightM: 5.0, densityRho: 0.65, latitude: BASE_LAT - 0.0025, longitude: BASE_LNG + 0.0035, healthStatus: "baik", plantedDate: "2023-02-14", lastUpdated: "2026-05-03", co2EqKg: 52.10 },
];
