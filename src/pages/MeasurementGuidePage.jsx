// src/pages/MeasurementGuidePage.jsx — panduan mengukur, untuk dibaca di kebun.
//
// MASALAH YANG DIPECAHKAN. Seluruh angka karbon di sistem ini berasal dari dua
// bilangan yang diukur tangan di lapangan: diameter setinggi dada dan tinggi
// pohon. Rumus Chave et al. 2014 memangkatkan D kuadrat — artinya salah ukur
// diameter 10% menggeser angka karbonnya sekitar 20%, dan kesalahan itu masuk
// ke sertifikat yang dijual tanpa ada yang bisa mendeteksinya belakangan.
//
// Sampai sekarang tidak ada satu pun keterangan di aplikasi tentang CARA
// mengukurnya. Formulirnya meminta "DBH (cm)" dan menganggap pembacanya sudah
// tahu bahwa itu diukur pada 1,3 m, bahwa pohon bercabang di bawah itu
// diperlakukan berbeda, dan bahwa yang diukur keliling harus dibagi pi.
//
// Halaman ini sengaja TIDAK memakai gambar: ia harus terbuka di lapangan
// dengan sinyal seadanya, dan teks yang bisa dibaca mengalahkan ilustrasi
// yang gagal dimuat.

import { Ruler, TriangleAlert, Scissors, Trees, Calculator } from "lucide-react";
import AppShell from "../components/AppShell";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, SectionHeader } from "../components/ui";

function Langkah({ n, judul, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-ink">
        {n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{judul}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{children}</p>
      </div>
    </li>
  );
}

export default function MeasurementGuidePage() {
  const { t } = useLanguage();

  return (
    <AppShell title={t("nav_guide")} showPeriod={false}>
      <div className="gjr-stagger mx-auto max-w-2xl space-y-5">
        <p className="px-1 text-xs text-ink-muted">{t("guide_intro")}</p>

        <SectionHeader>{t("guide_dbh_title")}</SectionHeader>
        <Card>
          <CardHeader icon={Ruler} title={t("guide_dbh_title")} />
          <ol className="space-y-3">
            <Langkah n={1} judul={t("guide_dbh_1_t")}>{t("guide_dbh_1_d")}</Langkah>
            <Langkah n={2} judul={t("guide_dbh_2_t")}>{t("guide_dbh_2_d")}</Langkah>
            <Langkah n={3} judul={t("guide_dbh_3_t")}>{t("guide_dbh_3_d")}</Langkah>
          </ol>

          {/* Rumus keliling → diameter ditulis apa adanya. Banyak petugas
              lapangan hanya punya meteran kain, bukan kaliper, dan tanpa
              baris ini angka keliling masuk ke kolom diameter. */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-sub p-3.5">
            <Calculator size={15} className="mt-0.5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{t("guide_circumference_t")}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{t("guide_circumference_d")}</p>
              <p className="mt-1.5 font-mono-id text-xs text-ink">diameter = keliling ÷ 3,14</p>
            </div>
          </div>
        </Card>

        <SectionHeader>{t("guide_special_title")}</SectionHeader>
        <Card>
          <CardHeader icon={Trees} title={t("guide_special_title")} />
          <ul className="space-y-3">
            <li className="flex gap-2.5">
              <Scissors size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">{t("guide_branched_t")}</span> — {t("guide_branched_d")}
              </p>
            </li>
            <li className="flex gap-2.5">
              <Trees size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">{t("guide_slope_t")}</span> — {t("guide_slope_d")}
              </p>
            </li>
            <li className="flex gap-2.5">
              <Ruler size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">{t("guide_buttress_t")}</span> — {t("guide_buttress_d")}
              </p>
            </li>
          </ul>
        </Card>

        <SectionHeader>{t("guide_height_title")}</SectionHeader>
        <Card>
          <CardHeader icon={Ruler} title={t("guide_height_title")} />
          <ol className="space-y-3">
            <Langkah n={1} judul={t("guide_height_1_t")}>{t("guide_height_1_d")}</Langkah>
            <Langkah n={2} judul={t("guide_height_2_t")}>{t("guide_height_2_d")}</Langkah>
          </ol>
        </Card>

        {/* Peringatan diletakkan TERAKHIR, bukan pertama: dibaca setelah
            langkahnya dipahami, saat pembacanya sudah tahu apa yang bisa
            salah. */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-warn/30 bg-warn-soft p-4">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink">{t("guide_why_matters_t")}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("guide_why_matters_d")}</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
