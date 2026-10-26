// src/components/ui/healthTone.js
//
// Dipisah dari Badge.jsx karena aturan react-refresh/only-export-components:
// berkas yang mengekspor komponen DAN nilai biasa membuat Vite melakukan
// muat-ulang penuh setiap kali berkas itu disunting, bukan hot reload.
// Konstanta ini satu-satunya ekspor non-komponen di sana, jadi memindahkannya
// menghilangkan galatnya tanpa menyentuh satu pun komponen.
//
// Pemetaan status kesehatan pohon ke tone warna. Dipakai TreeTable,
// HealthSummaryCard, ScanResultModal, dan dasbor buyer supaya keempatnya
// tidak pernah berbeda lagi.

export const HEALTH_TONE = {
  baik: "good",
  sedang: "warn",
  buruk: "bad",
};
