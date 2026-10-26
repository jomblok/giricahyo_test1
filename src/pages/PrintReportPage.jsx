// src/pages/PrintReportPage.jsx — laporan tercetak untuk koperasi.
//
// Sebelum ini seluruh isi sistem hanya ada di layar. Koperasi butuh lembar
// yang bisa dibawa ke rapat anggota, dan laporan PKM butuhnya sebagai lampiran
// — keduanya tidak bisa dijawab dengan tangkapan layar dasbor.
//
// Mencetak memakai window.print() dan aturan @media print yang sudah ada di
// index.css (pola yang sama dipakai CertificateModal), bukan pustaka PDF:
// menambah pustaka ~300 KB untuk satu halaman yang dicetak sesekali tidak
// sepadan, dan dialog cetak peramban sudah bisa menyimpan sebagai PDF.

import { useMemo } from "react";
import { Printer, TreeDeciduous, Wind, Wallet, Users } from "lucide-react";
import AppShell from "../components/AppShell";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { dashboardApi, treeApi, farmerApi, carbonFundApi, salaryApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber, formatRupiah, formatDate } from "../lib/format";
import { Button, SkeletonCards } from "../components/ui";

export default function PrintReportPage() {
  const { t } = useLanguage();

  const { loading: l1, error: e1 } = useApi(() => dashboardApi.summary());
  const { data: pohon,     loading: l2 } = useApi(() => treeApi.list());
  const { data: petani,    loading: l3 } = useApi(() => farmerApi.list());
  const { data: dana,      loading: l4 } = useApi(() => carbonFundApi.income());
  const { data: gaji,      loading: l5 } = useApi(() => salaryApi.list());

  const memuat = l1 || l2 || l3 || l4 || l5;

  const rekap = useMemo(() => {
    const daftar = pohon ?? [];
    const sehat = daftar.filter((p) => (p.health_status ?? p.healthStatus) === "baik").length;
    const sedang = daftar.filter((p) => (p.health_status ?? p.healthStatus) === "sedang").length;
    const buruk = daftar.filter((p) => (p.health_status ?? p.healthStatus) === "buruk").length;

    // Per jenis, diurutkan dari penyerap terbesar — itu urutan yang dicari
    // pembaca laporan, bukan abjad.
    const perJenis = {};
    for (const p of daftar) {
      const j = p.species ?? "—";
      perJenis[j] ??= { jenis: j, jumlah: 0, co2: 0 };
      perJenis[j].jumlah += 1;
      perJenis[j].co2 += Number(p.co2_eq_kg ?? 0);
    }

    return {
      total: daftar.length,
      sehat, sedang, buruk,
      co2: daftar.reduce((a, p) => a + Number(p.co2_eq_kg ?? 0), 0),
      perJenis: Object.values(perJenis).sort((a, b) => b.co2 - a.co2),
    };
  }, [pohon]);

  const totalDana = (dana ?? []).reduce((a, r) => a + Number(r.total_amount ?? 0), 0);
  const gajiTerakhir = (gaji?.salaries ?? []).filter(
    (s) => s.period === (gaji?.periods ?? [])[0]
  );

  return (
    <AppShell title={t("nav_print_report")} showPeriod={false}>
      <div className="space-y-5">
        {/* Kendali — disembunyikan saat mencetak */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-ink-muted">{t("print_report_desc")}</p>
          <Button type="button" onClick={() => window.print()}>
            <Printer size={15} /> {t("print_now")}
          </Button>
        </div>

        <ApiState loading={memuat} error={e1} skeleton={<SkeletonCards count={3} />}>
          {/* print-area: kelas yang sudah dipakai CertificateModal untuk
              menandai bagian yang ikut tercetak. */}
          <div className="print-area rounded-3xl border border-line bg-surface p-8 print:border-0 print:p-0">

            <header className="border-b border-line pb-5">
              <h1 className="gjr-display text-2xl font-normal text-ink">Giricahyo Carbon</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Koperasi Griya Jati Rasa · Desa Giricahyo, Purwosari, Gunungkidul
              </p>
              <p className="mt-2 text-xs text-ink-faint">
                {t("report_generated")} {formatDate(new Date().toISOString())}
              </p>
            </header>

            {/* Angka utama */}
            <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Angka ikon={TreeDeciduous} label={t("total_trees")} nilai={formatNumber(rekap.total, 0)} />
              <Angka ikon={Wind} label="CO₂ (kg)" nilai={formatNumber(rekap.co2, 0)} />
              <Angka ikon={Wallet} label={t("carbon_fund")} nilai={formatRupiah(totalDana)} />
              <Angka ikon={Users} label={t("nav_farmers")} nilai={formatNumber((petani ?? []).length, 0)} />
            </section>

            {/* Kondisi pohon */}
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
                {t("tree_health")}
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  <BarisTabel label={t("health_baik")} nilai={rekap.sehat} total={rekap.total} />
                  <BarisTabel label={t("health_sedang")} nilai={rekap.sedang} total={rekap.total} />
                  <BarisTabel label={t("health_buruk")} nilai={rekap.buruk} total={rekap.total} />
                </tbody>
              </table>
            </section>

            {/* Per jenis */}
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
                {t("species")}
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-ink-faint">
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("species")}</th>
                    <th scope="col" className="py-2 px-3 text-right font-semibold">{t("total_trees")}</th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">CO₂ (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.perJenis.map((j) => (
                    <tr key={j.jenis} className="border-b border-line/60 last:border-0">
                      <td className="py-1.5 pr-3 text-ink">{j.jenis}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-ink-muted">{j.jumlah}</td>
                      <td className="py-1.5 pl-3 text-right tabular-nums text-ink">{formatNumber(j.co2, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Gaji periode terakhir */}
            {gajiTerakhir.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
                  {t("salary_history")} — {(gaji?.periods ?? [])[0]}
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-ink-faint">
                      <th scope="col" className="py-2 pr-3 font-semibold">{t("nav_farmers")}</th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold">CO₂ (kg)</th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold">{t("salary_proportion")}</th>
                      <th scope="col" className="py-2 pl-3 text-right font-semibold">{t("salary_final")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gajiTerakhir.map((s) => (
                      <tr key={s.id} className="border-b border-line/60 last:border-0">
                        <td className="py-1.5 pr-3 font-mono-id text-ink">{s.farmer_id}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-ink-muted">{formatNumber(s.total_co2_kg, 0)}</td>
                        <td className="py-1.5 px-3 text-right tabular-nums text-ink-muted">{formatNumber(s.co2_proportion_pct, 2)}%</td>
                        <td className="py-1.5 pl-3 text-right tabular-nums font-bold text-ink">{formatRupiah(s.final_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <footer className="mt-10 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-faint">
              Serapan CO₂ dihitung dengan rumus alometrik Chave et al. 2014:
              AGB = 0,0673 × (ρ × D² × H)^0,976, BGB = AGB × 0,24, C = TB × 0,47,
              CO₂ = C × 3,67. Angka di atas berasal langsung dari basis data pada
              tanggal cetak.
            </footer>
          </div>
        </ApiState>
      </div>
    </AppShell>
  );
}

function Angka({ ikon: Ikon, label, nilai }) {
  return (
    <div className="rounded-2xl bg-surface-sub p-4 print:bg-transparent print:border print:border-line">
      <Ikon size={16} className="mb-1.5 text-brand" />
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">{nilai}</p>
    </div>
  );
}

function BarisTabel({ label, nilai, total }) {
  const persen = total > 0 ? (nilai / total) * 100 : 0;
  return (
    <tr className="border-b border-line/60 last:border-0">
      <td className="py-1.5 pr-3 text-ink">{label}</td>
      <td className="py-1.5 px-3 text-right tabular-nums text-ink">{nilai}</td>
      <td className="py-1.5 pl-3 text-right tabular-nums text-ink-muted">{formatNumber(persen, 1)}%</td>
    </tr>
  );
}
