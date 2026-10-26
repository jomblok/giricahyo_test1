// src/pages/GroupComparisonPage.jsx — kelompok tani berdampingan.
//
// Angka desa secara keseluruhan menyembunyikan sebarannya. Pada data yang ada
// sekarang, satu kelompok dengan 27 pohon menyumbang 89% seluruh CO₂ —
// kenyataan yang tidak terlihat sama sekali dari angka total, dan yang
// mengubah cara dana dibagi serta cara pengukuran diprioritaskan.
//
// SENGAJA ADMIN SAJA. Membandingkan kelompok berdampingan berguna bagi
// pengurus, tapi menampilkan peringkat antar-petani kepada petani sendiri
// mengubah alat kerja jadi papan skor — dan yang di bawah biasanya bukan yang
// paling malas, melainkan yang petaknya paling jauh atau pohonnya paling muda.

import { Users, TreeDeciduous, Wind, CalendarClock } from "lucide-react";
import AppShell from "../components/AppShell";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber } from "../lib/format";
import { Card, CardHeader, Badge, SkeletonCards, SectionHeader } from "../components/ui";

function Batang({ persen, nada = "bg-brand" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-sub">
      <div className={`h-full rounded-full ${nada}`} style={{ width: `${Math.min(100, Math.max(0, persen))}%` }} />
    </div>
  );
}

export default function GroupComparisonPage() {
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => farmerApi.perbandingan());

  const baris = data?.farmers ?? [];
  // Dasar pembanding untuk batang jumlah pohon: kelompok terbesar, bukan 100.
  // Dengan dasar 100, tiga kelompok yang semuanya di bawah 100 pohon tergambar
  // sebagai tiga batang pendek yang tidak bisa dibedakan.
  const pohonTerbanyak = Math.max(1, ...baris.map((f) => f.tree_count));

  return (
    <AppShell title={t("group_comparison")} wide showPeriod={false}>
      <div className="gjr-stagger space-y-5">
        <p className="px-1 max-w-2xl text-xs text-ink-muted">{t("group_comparison_desc")}</p>

        <SectionHeader>{t("group_comparison")}</SectionHeader>

        <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={3} />}>
          <div className="space-y-4">
            {baris.map((f) => {
              const sehat = f.tree_count > 0 ? (f.baik / f.tree_count) * 100 : 0;
              return (
                <Card key={f.farmer_id}>
                  <CardHeader
                    icon={Users}
                    title={f.name}
                    actions={
                      <span className="text-[11px] text-ink-faint">{f.group_coop}</span>
                    }
                  />

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
                    <div>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-faint">
                        <TreeDeciduous size={11} /> {t("trees_label")}
                      </p>
                      <p className="text-lg font-bold tabular-nums text-ink">{formatNumber(f.tree_count)}</p>
                      <Batang persen={(f.tree_count / pohonTerbanyak) * 100} />
                    </div>

                    <div>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-faint">
                        <Wind size={11} /> kg CO₂
                      </p>
                      <p className="text-lg font-bold tabular-nums text-ink">{formatNumber(f.co2_kg, 0)}</p>
                      {/* Porsi terhadap CO₂ desa — angka yang paling sering
                          mengejutkan, karena tidak sejalan dengan jumlah pohon. */}
                      <Batang persen={f.co2_share} nada="bg-warn" />
                      <p className="mt-0.5 text-[10px] tabular-nums text-ink-faint">
                        {formatNumber(f.co2_share, 1)}% {t("of_village")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{t("co2_per_tree")}</p>
                      <p className="text-lg font-bold tabular-nums text-ink">{formatNumber(f.co2_rata, 0)}</p>
                      <p className="mt-0.5 text-[10px] text-ink-faint">kg / {t("tree").toLowerCase()}</p>
                    </div>

                    <div>
                      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-faint">
                        <CalendarClock size={11} /> {t("overdue_trees")}
                      </p>
                      <p className={`text-lg font-bold tabular-nums ${f.tertinggal > 0 ? "text-warn" : "text-good"}`}>
                        {formatNumber(f.tertinggal)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-faint">
                        &gt; {data?.stale_days} {t("days_short")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <span className="text-[10px] uppercase tracking-wide text-ink-faint">{t("tree_condition")}</span>
                    <Badge tone="good">{formatNumber(f.baik)} {t("health_baik")}</Badge>
                    {f.sedang > 0 && <Badge tone="warn">{formatNumber(f.sedang)} {t("health_sedang")}</Badge>}
                    {f.buruk > 0 && <Badge tone="bad">{formatNumber(f.buruk)} {t("health_buruk")}</Badge>}
                    <span className="ml-auto text-[11px] tabular-nums text-ink-muted">
                      {formatNumber(sehat, 0)}% {t("healthy_share")}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </ApiState>
      </div>
    </AppShell>
  );
}
