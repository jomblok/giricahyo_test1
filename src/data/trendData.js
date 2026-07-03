// Data agregat tahunan untuk grafik tren (CO2 terserap & sertifikat terjual)
// TODO: ganti dengan fetch('/api/trend') — kemungkinan hasil agregasi query
// dari tabel carbon_measurements per tahun

export const trendData = [
  { year: 2022, totalCo2Ton: 18, certificatesSold: 0, totalTrees: 1240 },
  { year: 2023, totalCo2Ton: 34, certificatesSold: 12, totalTrees: 1480 },
  { year: 2024, totalCo2Ton: 52, certificatesSold: 31, totalTrees: 1680 },
  { year: 2025, totalCo2Ton: 71, certificatesSold: 58, totalTrees: 1810 },
  { year: 2026, totalCo2Ton: 89, certificatesSold: 73, totalTrees: 1935 },
];
