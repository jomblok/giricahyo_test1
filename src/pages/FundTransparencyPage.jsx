// src/pages/FundTransparencyPage.jsx — ke mana uangnya pergi, untuk petani.
//
// MASALAH YANG DIPECAHKAN. Seluruh halaman dana khusus admin, dan memang
// seharusnya: di dalamnya ada rincian per transaksi, nama pembeli, dan nominal
// yang bisa disunting. Tapi petani adalah pihak yang pohonnya dijual jasanya,
// dan sebelum ini mereka tidak punya satu pun layar yang menjawab "berapa yang
// masuk, dan ke mana pembagiannya" selain bertanya ke pengurus.
//
// Yang ditampilkan di sini hanya AGREGAT. Tidak ada nama pembeli, tidak ada
// nominal per transaksi, tidak ada data petani lain.

import { Wallet, PieChart, Info, Sprout } from "lucide-react";
import AppShell from "../components/AppShell";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { carbonFundApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatRupiah, formatNumber } from "../lib/format";
import { Card, CardHeader, StatCard, SkeletonCards, SectionHeader } from "../components/ui";

export default function FundTransparencyPage() {
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => carbonFundApi.transparansi());

  const bagian = data?.distribution ?? [];

  return (
    <AppShell title={t("nav_fund_transparency")} showPeriod={false}>
      <div className="gjr-stagger mx-auto max-w-3xl space-y-6">
        <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={3} />}>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              layout="inline"
              icon={Wallet}
              label={t("fund_income_year")}
              value={data ? formatRupiah(data.total_income) : "—"}
              sub={data ? `${data.entry_count} ${t("income_entries")} · ${data.year}` : ""}
              accent="gold"
            />
            <StatCard
              layout="inline"
              icon={Sprout}
              label={t("my_co2_contribution")}
              value={data ? `${formatNumber(data.porsi_co2_persen, 2)}%` : "—"}
              sub={data ? `${formatNumber(data.co2_saya_kg, 0)} kg ${t("of")} ${formatNumber(data.co2_total_kg, 0)} kg` : ""}
              accent="sage"
            />
            <StatCard
              layout="inline"
              icon={PieChart}
              label={t("distribution_components")}
              value={bagian.length}
              sub={t("per_cooperative_decision")}
              accent="forest"
            />
          </section>

          <section>
            <SectionHeader>{t("fund_distribution")}</SectionHeader>
            <Card>
              <CardHeader icon={PieChart} title={t("fund_distribution")} />
              <ul className="space-y-3">
                {bagian.map((b) => (
                  <li key={b.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-sm text-ink">{b.component}</span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
                        {formatNumber(b.percentage, 0)}%
                      </span>
                    </div>
                    {/* Batang proporsi, bukan diagram lingkaran: tiga pos
                        dengan satu yang dominan jauh lebih mudah dibandingkan
                        sebagai panjang daripada sebagai juring. */}
                    <div className="h-2 overflow-hidden rounded-full bg-surface-sub">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(100, Number(b.percentage) || 0)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] tabular-nums text-ink-faint">
                      {b.period} · {formatRupiah(b.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Peringatan ini WAJIB ada dan sengaja tidak dibuat kecil: tanpa
              kalimat ini, angka besar di atas mudah dibaca sebagai nominal
              yang akan diterima petani. */}
          {data?.catatan && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface-sub p-4">
              <Info size={16} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-xs leading-relaxed text-ink-muted">{data.catatan}</p>
            </div>
          )}
        </ApiState>
      </div>
    </AppShell>
  );
}
