// src/pages/MyReportsPage.jsx — riwayat laporan lapangan milik petani.
//
// Alasan halaman ini ada, dan bukan sekadar notifikasi: petani perlu melihat
// laporan mana yang masih menggantung sebelum mengirim laporan baru untuk
// pohon yang sama (backend memang menolaknya), dan perlu membaca ULANG alasan
// penolakan setelah notifikasinya terlewat.

import { ClipboardList, Sprout, HeartPulse } from "lucide-react";
import AppShell from "../components/AppShell";
import { reportApi } from "../lib/api";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber } from "../lib/format";
import { Card, Badge, EmptyState, SkeletonTable, SectionHeader } from "../components/ui";

const NADA = { menunggu: "warn", disetujui: "good", ditolak: "bad" };

export default function MyReportsPage() {
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => reportApi.list(), []);
  const laporan = data?.reports ?? [];

  return (
    <AppShell title={t("nav_my_reports")} showPeriod={false}>
      <div className="space-y-6">
        <SectionHeader>{t("my_reports")}</SectionHeader>

        <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={3} />}>
          {laporan.length === 0 ? (
            <EmptyState icon={ClipboardList} title={t("no_reports")} description={t("no_reports_desc")} />
          ) : (
            <div className="space-y-3">
              {laporan.map((r) => {
                const p = r.payload ?? {};
                const pohonBaru = r.type === "pohon_baru";
                const Ikon = pohonBaru ? Sprout : HeartPulse;

                return (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-xl bg-brand-soft p-2">
                        <Ikon size={16} className="text-brand-ink" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink text-sm">
                            {pohonBaru ? t("register_tree") : t("report_condition_for")}
                          </span>
                          <Badge tone={NADA[r.status]}>{t(`status_${r.status}`)}</Badge>
                          {r.tree_id && (
                            <span className="font-mono-id text-xs text-ink-faint">{r.tree_id}</span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-ink-muted">
                          {pohonBaru
                            ? `${p.species} · DBH ${formatNumber(p.dbh_cm)} cm · ${formatNumber(p.height_m)} m`
                            : `${t("new_condition")}: ${t(`health_${p.health_status}`)}`}
                        </p>

                        {r.note && (
                          <p className="mt-1.5 text-sm text-ink-faint italic">&ldquo;{r.note}&rdquo;</p>
                        )}

                        {/* Alasan penolakan ditampilkan menonjol: inilah
                            satu-satunya cara petani tahu apa yang harus
                            diperbaiki setelah notifikasinya terlewat. */}
                        {r.status === "ditolak" && r.review_note && (
                          <p className="mt-2 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
                            {r.review_note}
                          </p>
                        )}

                        <p className="mt-2 text-[11px] text-ink-faint tabular-nums">
                          {new Date(r.created_at).toLocaleString("id-ID")}
                          {r.reviewed_at && ` · ${t("reviewed_at")} ${new Date(r.reviewed_at).toLocaleDateString("id-ID")}`}
                        </p>
                      </div>

                      {r.photo_url && (
                        <img
                          src={r.photo_url}
                          alt=""
                          className="hidden sm:block h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ApiState>
      </div>
    </AppShell>
  );
}
