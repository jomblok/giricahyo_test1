// Sesuai tabel SQL: carbon_fund_income (id, date, source, qty, unit_price, total_amount)
// TODO: ganti dengan fetch('/api/carbon-fund-income') saat backend siap

export const carbonFundIncome = [
  { id: 1, date: "2026-05-01", source: "Guest Contribution", qty: 10, unitPrice: 200000, totalAmount: 2000000 },
  { id: 2, date: "2026-05-07", source: "ESG Fund", qty: 1, unitPrice: 5000000, totalAmount: 5000000 },
  { id: 3, date: "2026-05-12", source: "Carbon Tourism", qty: 6, unitPrice: 500000, totalAmount: 3000000 },
  { id: 4, date: "2026-05-18", source: "CSR", qty: 1, unitPrice: 4000000, totalAmount: 4000000 },
  { id: 5, date: "2026-05-25", source: "Donor", qty: 1, unitPrice: 1000000, totalAmount: 1000000 },
];
