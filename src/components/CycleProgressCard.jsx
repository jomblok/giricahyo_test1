// src/components/CycleProgressCard.jsx — kemajuan periode pengukuran.
//
// Dipakai dua peran dengan cakupan berbeda: pengurus melihat kemajuan seluruh
// desa, petani melihat petaknya sendiri. Perbedaan itu ditentukan BACKEND
// (lihat MeasurementCycleController::index), bukan oleh komponen ini — supaya
// tidak mungkin ada layar yang tanpa sengaja menampilkan angka desa kepada
// petani atau sebaliknya.
//
// KENAPA KOMPONEN INI ADA. Sebelumnya sistem ini inventaris, bukan monitoring:
// 179 pohon dengan tepat satu pengukuran masing-masing, semuanya dari impor
// survei. Mencatat pengukuran baru sudah bisa sejak lama; yang tidak ada
// adalah apa pun yang menggerakkan siklusnya — tidak ada yang menyatakan
// "sekarang musim ukur", dan tidak ada yang tahu sudah sampai mana.

import { CalendarRange, CheckCircle2 } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { cycleApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatDate, formatNumber } from "../lib/format";
import { Card, CardHeader, Badge, EmptyState, SkeletonCards } from "./ui";

const NADA_STATUS = { berjalan: "brand", selesai: "good", dibatalkan: "neutral" };

export function BatangKemajuan({ persen, selesai }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-sub">
      <div
        className={`h-full rounded-full transition-[width] ${selesai ? "bg-good" : "bg-brand"}`}
        style={{ width: `${Math.min(100, Math.max(0, persen))}%` }}
      />
    </div>
  );
}

export default function CycleProgressCard({ max = 3 }) {
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => cycleApi.list());

  const siklus = (data?.cycles ?? []).slice(0, max);
  const cakupanPetani = data?.scope === "petani";

  return (
    <Card>
      <CardHeader
        icon={CalendarRange}
        title={t("measurement_cycles")}
        count={loading ? null : (data?.cycles ?? []).length}
      />

      <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={2} />}>
        {siklus.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title={t("no_cycles")}
            description={t("no_cycles_desc")}
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-ink-muted">
              {cakupanPetani ? t("cycle_scope_farmer") : t("cycle_scope_coop")}
            </p>

            <ul className="space-y-4">
              {siklus.map((c) => {
                const p = c.progress ?? {};
                const tuntas = p.sisa === 0 && p.total > 0;
                return (
                  <li key={c.id}>
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-ink">{c.name}</span>
                      <Badge capitalize={false} tone={NADA_STATUS[c.status] ?? "neutral"}>
                        {t(`cycle_${c.status}`)}
                      </Badge>
                    </div>

                    <BatangKemajuan persen={p.persen ?? 0} selesai={tuntas} />

                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-ink-faint">
                      <span className="tabular-nums">
                        {tuntas && <CheckCircle2 size={11} className="mr-1 inline text-good" />}
                        {formatNumber(p.sudah ?? 0)} / {formatNumber(p.total ?? 0)} {t("trees_label").toLowerCase()}
                        {" · "}
                        <span className="font-semibold text-ink-muted">{formatNumber(p.persen ?? 0, 1)}%</span>
                      </span>
                      <span className="tabular-nums">
                        {formatDate(c.starts_on)} — {formatDate(c.ends_on)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ApiState>
    </Card>
  );
}
