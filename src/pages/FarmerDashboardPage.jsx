import { Leaf, TreeDeciduous, Wind, Wallet, TrendingUp, Award } from "lucide-react";
import Header from "../components/Header";
import TreeTable from "../components/TreeTable";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { formatNumber, formatRupiah } from "../lib/format";

function SectionLabel({ children }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-forest-700/45 mb-3 px-1">{children}</h2>;
}

function StatCard({ icon: Icon, label, value, sub, accent = "sage" }) {
  const accents = { sage: "text-sage-600 bg-sage-100", gold: "text-gold-600 bg-gold-100", forest: "text-forest-700 bg-cream-100" };
  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`rounded-xl p-2.5 shrink-0 ${accents[accent]}`}><Icon size={20} /></div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-forest-700/50 font-semibold mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-forest-950 tabular">{value}</p>
        {sub && <p className="text-xs text-forest-700/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const farmerId = user?.linked_id ?? user?.linkedId ?? "F001";

  const { data, loading, error } = useApi(() => farmerApi.get(farmerId), [farmerId]);

  const farmer  = data?.farmer;
  const salary  = data?.salaries?.[0] ?? null;
  const totalCo2    = data?.total_co2_kg ?? 0;
  const proportion  = data?.proportion_pct ?? 0;
  const totalIncentivePct = salary
    ? (salary.social_incentive_pct + salary.ecological_incentive_pct + salary.participation_incentive_pct)
    : 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 space-y-8">

        {/* Sambutan */}
        <ApiState loading={loading} error={error}>
          <div className="flex items-center gap-3">
            <div className="bg-sage-100 rounded-xl p-2.5"><Leaf size={20} className="text-sage-600" /></div>
            <div>
              <h2 className="font-bold text-forest-950 text-lg">Selamat datang, {farmer?.name ?? user?.name}</h2>
              <p className="text-xs text-forest-700/55">{farmer?.group_coop} · {farmer?.address}</p>
            </div>
          </div>
        </ApiState>

        {/* KPI */}
        <section>
          <SectionLabel>Kontribusi Saya</SectionLabel>
          <ApiState loading={loading} error={error}
            skeleton={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-28 bg-cream-100 rounded-2xl animate-pulse"/>)}</div>}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={TreeDeciduous} label="Pohon Saya"       value={data?.trees?.length ?? 0}           sub="pohon terdaftar"                 accent="sage" />
              <StatCard icon={Wind}          label="Total CO₂ Diserap" value={formatNumber(totalCo2, 1)}          sub="kg CO₂e dari pohon saya"          accent="forest" />
              <StatCard icon={TrendingUp}    label="Proporsi CO₂"     value={`${formatNumber(proportion, 1)}%`}  sub="dari total komunitas"             accent="sage" />
              <StatCard icon={Wallet}        label="Gaji Karbon"       value={salary ? formatRupiah(salary.final_salary) : "—"} sub={salary ? `Periode ${salary.period}` : "Belum ada"} accent="gold" />
            </div>
          </ApiState>
        </section>

        {/* Rincian gaji */}
        {salary && (
          <section>
            <SectionLabel>Rincian Gaji Karbon</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={17} className="text-sage-600" />
                  <h3 className="font-semibold text-forest-950 text-sm">Perhitungan Gaji</h3>
                  <span className="text-[11px] text-forest-700/40">{salary.period}</span>
                </div>
                <div className="space-y-3">
                  {[
                    ["CO₂ dari pohon saya",            `${formatNumber(salary.total_co2_kg, 2)} kg`],
                    ["Proporsi dari total komunitas",   `${formatNumber(salary.co2_proportion_pct, 1)}%`],
                    ["Gaji dasar karbon",               formatRupiah(salary.base_salary)],
                    ["Total insentif",                  `+${totalIncentivePct}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-cream-50">
                      <span className="text-xs text-forest-700/60">{label}</span>
                      <span className="text-sm font-semibold text-forest-900 tabular">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-baseline py-3 bg-gold-50 rounded-xl px-3">
                    <span className="text-sm font-bold text-forest-900">Gaji Final Diterima</span>
                    <span className="text-lg font-bold text-gold-600 tabular">{formatRupiah(salary.final_salary)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={17} className="text-sage-600" />
                  <h3 className="font-semibold text-forest-950 text-sm">Rincian Insentif</h3>
                </div>
                <div className="space-y-4">
                  {[
                    ["Insentif Sosial",       salary.social_incentive_pct,        "bg-sage-400"],
                    ["Insentif Ekologis",     salary.ecological_incentive_pct,    "bg-forest-700"],
                    ["Insentif Partisipasi",  salary.participation_incentive_pct, "bg-gold-500"],
                  ].map(([label, pct, color]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-forest-700/60 w-36 shrink-0">{label}</span>
                      <div className="flex-1 bg-cream-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(pct * 5, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-forest-900 tabular w-8 text-right">+{pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-cream-100 flex justify-between">
                  <span className="text-xs text-forest-700/60">Total penambahan dari insentif</span>
                  <span className="text-sm font-bold text-sage-600">+{totalIncentivePct}%</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabel pohon milik petani ini */}
        <section>
          <SectionLabel>Pohon Milik Saya</SectionLabel>
          <TreeTable farmerId={farmerId} />
        </section>

        <footer className="text-center text-[11px] text-forest-700/40 pt-4 pb-2">
          Giricahyo Carbon Dashboard — {farmer?.group_coop}
        </footer>
      </main>
    </div>
  );
}
