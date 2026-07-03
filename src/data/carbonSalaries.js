// Sesuai tabel SQL: carbon_salaries (id, farmer_id, period, total_co2_kg,
// co2_proportion_pct, base_salary, social_incentive_pct,
// ecological_incentive_pct, participation_incentive_pct, final_salary)
// TODO: ganti dengan fetch('/api/carbon-salaries') saat backend siap
//
// Formula (sesuai PDF "Penguatan Manajemen Bisnis Karbon"):
// baseSalary_i = (co2_i / totalCo2) * netFundForFarmers
// finalSalary  = baseSalary * (1 + sum of incentive percentages)

export const carbonSalaries = [
  { id: 1, farmerId: "F001", period: "2026-Q2", totalCo2Kg: 145.48, co2ProportionPct: 12.7, baseSalary: 1524000, socialIncentivePct: 5, ecologicalIncentivePct: 7, participationIncentivePct: 3, finalSalary: 1752600 },
  { id: 2, farmerId: "F002", period: "2026-Q2", totalCo2Kg: 87.71, co2ProportionPct: 7.6, baseSalary: 912000, socialIncentivePct: 4, ecologicalIncentivePct: 5, participationIncentivePct: 2, finalSalary: 1005120 },
  { id: 3, farmerId: "F003", period: "2026-Q2", totalCo2Kg: 199.52, co2ProportionPct: 17.4, baseSalary: 2088000, socialIncentivePct: 6, ecologicalIncentivePct: 8, participationIncentivePct: 4, finalSalary: 2463840 },
  { id: 4, farmerId: "F004", period: "2026-Q2", totalCo2Kg: 225.91, co2ProportionPct: 19.7, baseSalary: 2364000, socialIncentivePct: 8, ecologicalIncentivePct: 8, participationIncentivePct: 4, finalSalary: 2789520 },
  { id: 5, farmerId: "F005", period: "2026-Q2", totalCo2Kg: 290.88, co2ProportionPct: 25.4, baseSalary: 3048000, socialIncentivePct: 7, ecologicalIncentivePct: 9, participationIncentivePct: 5, finalSalary: 3686040 },
  { id: 6, farmerId: "F007", period: "2026-Q2", totalCo2Kg: 94.30, co2ProportionPct: 8.2, baseSalary: 984000, socialIncentivePct: 5, ecologicalIncentivePct: 6, participationIncentivePct: 3, finalSalary: 1121760 },
  { id: 7, farmerId: "F008", period: "2026-Q2", totalCo2Kg: 71.40, co2ProportionPct: 6.2, baseSalary: 744000, socialIncentivePct: 3, ecologicalIncentivePct: 5, participationIncentivePct: 2, finalSalary: 818400 },
];
