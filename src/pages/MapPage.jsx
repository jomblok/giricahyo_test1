// src/pages/MapPage.jsx — peta sebaran ukuran penuh, dengan filter status
// dan tombol fokus ke pohon kritis.

import AppShell from "../components/AppShell";
import TreeMap from "../components/TreeMap";
import { useLanguage } from "../lib/LanguageContext";

export default function MapPage() {
  const { t } = useLanguage();
  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_map")} wide showPeriod={false}>
      <TreeMap height="calc(100vh - 15rem)" showControls />
    </AppShell>
  );
}
