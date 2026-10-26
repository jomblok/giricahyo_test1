// src/pages/MyGardenMapPage.jsx — peta sebaran pohon milik petani sendiri.
//
// Sebelumnya peta hanya ada di peran admin (/peta). Petani, yang justru
// berjalan ke petaknya setiap kali mengukur, tidak punya satu pun tampilan
// spasial: daftar "Pohon Saya" menampilkan koordinat sebagai angka desimal,
// yang tidak membantu siapa pun mencari pohon di lapangan.
//
// Tidak ada endpoint baru yang dibutuhkan. TreeController@index sudah
// menyaring `where('farmer_id', $account->linked_id)` untuk peran petani,
// jadi TreeMap yang sama persis dengan milik admin otomatis hanya memuat
// pohon petani yang sedang masuk — bukan karena halaman ini menyaringnya,
// tapi karena backend tidak pernah mengirim yang lain.

import AppShell from "../components/AppShell";
import TreeMap from "../components/TreeMap";
import { useLanguage } from "../lib/LanguageContext";

export default function MyGardenMapPage() {
  const { t } = useLanguage();

  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_my_map")} wide showPeriod={false}>
      <p className="mb-3 px-1 text-xs text-ink-muted max-w-2xl">
        {t("my_garden_map_desc")}
      </p>
      <TreeMap height="calc(100vh - 17rem)" showControls />
    </AppShell>
  );
}
