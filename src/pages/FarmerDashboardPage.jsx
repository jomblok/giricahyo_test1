import { useMemo, useState } from "react";
import { Leaf, TreeDeciduous, Wind, Wallet, TrendingUp } from "lucide-react";
import AppShell from "../components/AppShell";
import TreeTable from "../components/TreeTable";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi, speciesApi } from "../lib/api";
import { formatNumber, formatRupiah } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import SalaryBreakdown from "../components/SalaryBreakdown";
import DueForCheckCard from "../components/DueForCheckCard";
import CycleProgressCard from "../components/CycleProgressCard";
import MyAdoptedTreesCard from "../components/MyAdoptedTreesCard";
import KartuJenis from "../components/KartuJenis";
import { ringkasJenis } from "../lib/ringkasJenis";
import { SectionHeader, StatCard, SkeletonCards } from "../components/ui";

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const farmerId = user?.linked_id ?? user?.linkedId ?? "F001";

  const { data, loading, error } = useApi(() => farmerApi.get(farmerId), [farmerId]);

  // Katalog jenis dimuat terpisah HANYA untuk nama Latin-nya. Dibiarkan gagal
  // diam-diam: kalau tidak terambil, kartunya tetap tampil lengkap dengan
  // jumlah dan CO2 — hanya baris nama Latin yang hilang. Menggagalkan seluruh
  // halaman karena hiasan taksonomi tidak terambil akan merugikan petani yang
  // sedang ingin melihat pohonnya.
  const { data: katalog } = useApi(() => speciesApi.list(), []);

  const [jenisDipilih, setJenisDipilih] = useState(null);
  const perJenis = useMemo(
    () => ringkasJenis(data?.trees, katalog),
    [data?.trees, katalog]
  );

  const farmer     = data?.farmer;
  const salary     = data?.salaries?.[0] ?? null;
  const totalCo2   = data?.total_co2_kg ?? 0;
  const proportion = data?.proportion_pct ?? 0;

  return (
    <AppShell title={t("nav_overview")} showPeriod={false}>
      <div className="gjr-stagger space-y-8">

        {/* Sambutan */}
        <ApiState loading={loading} error={error}>
          <div className="flex items-center gap-3">
            <div className="bg-brand-soft rounded-xl p-2.5 transition-colors">
              <Leaf size={20} className="text-brand" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-ink text-lg truncate">
                {t("welcome")} {farmer?.name ?? user?.name}
              </h2>
              {/* Baris lokasi MEMBUNGKUS, bukan dipotong. Di ponsel ia butuh
                  328px tapi hanya kebagian 291px, jadi "Gunungkidul" terpenggal
                  jadi "Gun..." — nama desa petani sendiri yang terbaca separuh. */}
              <p className="text-xs text-ink-muted">
                {farmer?.group_coop} · {farmer?.address}
              </p>
            </div>
          </div>
        </ApiState>

        {/* KPI */}
        <section>
          <SectionHeader>{t("my_contribution")}</SectionHeader>
          <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={4} />}>
            {/* auto-fit, BUKAN lg:grid-cols-4. Menu samping memakan ~220px, jadi
                patokan lebar layar memberi kartu 170px dan angka CO2-nya
                terpotong. auto-fit mengikuti ruang yang benar-benar ada. */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
              <StatCard layout="inline" icon={TreeDeciduous} label={t("my_trees")}            value={data?.trees?.length ?? 0}          sub={t("registered_trees")}       accent="sage" />
              <StatCard layout="inline" icon={Wind}          label={t("total_co2_absorbed")}  value={formatNumber(totalCo2, 1)}         sub={t("co2_from_my_trees")}      accent="forest" />
              <StatCard layout="inline" icon={TrendingUp}    label={t("co2_proportion")}      value={`${formatNumber(proportion, 1)}%`} sub={t("from_total_community")}   accent="sage" />
              <StatCard layout="inline" icon={Wallet}        label={t("carbon_salary")}       value={salary ? formatRupiah(salary.final_salary) : "—"} sub={salary ? `${t("period")} ${salary.period}` : t("none_yet")} accent="gold" />
            </div>
          </ApiState>
        </section>

        {/* Rincian gaji — komponen bersama dengan halaman Gaji Karbon */}
        {salary && (
          <section>
            <SectionHeader>{t("carbon_salary_details")}</SectionHeader>
            <SalaryBreakdown salary={salary} />
          </section>
        )}

        {/* Prioritas kerja lapangan, diletakkan SEBELUM tabel inventaris:
            tabel menjawab "apa saja pohon saya", kartu ini menjawab "mana
            yang harus saya datangi lebih dulu" — pertanyaan yang lebih
            mendesak saat petani membuka dasbor ini di kebun. */}
        {/* Periode dulu, baru daftar pohonnya: "musim ukur ini sudah sampai
            mana" adalah konteks yang menjelaskan kenapa daftar di bawahnya
            penting. */}
        <section>
          <CycleProgressCard max={2} />
        </section>

        <section>
          <DueForCheckCard />
        </section>

        <section>
          <MyAdoptedTreesCard />
        </section>

        {/* Barisan kartu jenis — DI SINI, bukan di dashboard admin.
            Petanilah yang bekerja per jenis: menyiangi Jati berbeda dari
            merawat Sirsak, dan yang ingin dia lihat adalah "berapa Jati saya".
            Admin melihat desa sebagai satu kesatuan; rincian jenis untuknya
            sudah ada di Katalog Pohon.

            Ditaruh tepat di atas tabel karena kartunya menyaring tabel itu.
            Penyaring yang akibatnya berada di luar layar terasa seperti
            tombol yang tidak melakukan apa-apa. */}
        {perJenis.length > 0 && (
          <section>
            {/* Jumlah jenis DISEBUTKAN, bukan dibiarkan ditebak. Barisan ini
                digulir mendatar sepanjang empat kali lebar layar, sehingga
                yang terlihat sekilas hanya lima kartu pertama. Tanpa angka
                ini, pembaca tidak punya cara tahu apakah ia sudah melihat
                semuanya — dan pernah memang tidak: barisannya dulu dipotong
                di 8 jenis dari 19 tanpa tanda apa pun. */}
            <SectionHeader>
              {t("by_species")} ({perJenis.length})
            </SectionHeader>
            <p className="-mt-1 mb-3 text-xs text-ink-muted">{t("tap_species_filter")}</p>
            <KartuJenis jenis={perJenis} aktif={jenisDipilih} onPilih={setJenisDipilih} />
          </section>
        )}

        {/* Tabel pohon milik petani ini */}
        <section>
          <SectionHeader>{t("my_tree_inventory")}</SectionHeader>
          <TreeTable
            farmerId={farmerId}
            jenisDipilih={jenisDipilih}
            onJenisChange={setJenisDipilih}
          />
        </section>

        <footer className="text-center text-[11px] text-ink-faint pt-4 pb-2">
          Giricahyo Carbon Dashboard — {farmer?.group_coop}
        </footer>
      </div>
    </AppShell>
  );
}
