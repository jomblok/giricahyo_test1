// src/pages/AuditLogPage.jsx — siapa melakukan apa, kapan.
//
// MASALAH YANG DIPECAHKAN. Tidak ada catatan sama sekali tentang siapa
// menghapus pohon, siapa mengubah pemasukan dana, atau siapa menyetel ulang
// kata sandi orang lain — satu-satunya jejak yang pernah ada adalah kolom
// verified_by pada sertifikat.
//
// Untuk sistem MRV yang sertifikat karbonnya dijual ke pihak luar, itu bukan
// soal kenyamanan: kalau ada yang mempertanyakan satu angka, tidak ada cara
// menjawab siapa yang terakhir menyentuhnya.
//
// Halaman ini hanya membaca. Catatan audit tidak pernah bisa disunting atau
// dihapus dari antarmuka — kalau bisa, ia berhenti menjadi bukti.

import { useMemo, useState } from "react";
import { ScrollText, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { auditApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatDateTime } from "../lib/format";
import { Card, CardHeader, Badge, Select, EmptyState, SkeletonTable } from "../components/ui";

// Warna per kelompok aksi. Menghapus dan hal yang menyangkut uang menonjol,
// karena itulah yang paling sering perlu ditelusuri ulang.
function nadaAksi(action) {
  if (action.endsWith(".delete") || action.endsWith(".reject")) return "bad";
  if (action.startsWith("income.") || action.startsWith("adoption.")) return "warn";
  if (action.startsWith("account.")) return "brand";
  return "neutral";
}

export default function AuditLogPage() {
  const { t } = useLanguage();

  const [aksi, setAksi] = useState("");
  const [halaman, setHalaman] = useState(1);

  const { data, loading, error } = useApi(
    () => auditApi.list({ action: aksi || undefined, page: halaman }),
    [aksi, halaman]
  );

  const logs = data?.logs ?? [];
  const totalHalaman = data?.pages ?? 1;

  const pilihanAksi = useMemo(
    () => [
      { value: "", label: t("all_actions") },
      ...(data?.actions ?? []).map((a) => ({ value: a, label: a })),
    ],
    [data, t]
  );

  return (
    <AppShell title={t("nav_audit")} wide showPeriod={false}>
      <div className="gjr-stagger space-y-5">
        <p className="px-1 text-xs text-ink-muted max-w-2xl">{t("audit_desc")}</p>

        <Card>
          {/* level=2: halaman ini tidak punya SectionHeader, jadi kartunya
                berada langsung di bawah judul halaman (h1). */}
              <CardHeader
            level={2}
            icon={ScrollText}
            title={t("nav_audit")}
            count={loading ? null : data?.total}
            actions={
              <div className="w-56">
                <Select
                  value={aksi}
                  icon={Filter}
                  onChange={(e) => {
                    setAksi(e.target.value);
                    // Halaman dikembalikan ke 1: saringan baru hampir pasti
                    // punya jumlah halaman yang berbeda, dan bertahan di
                    // halaman 7 dari hasil yang cuma 2 halaman menampilkan
                    // layar kosong yang terlihat seperti galat.
                    setHalaman(1);
                  }}
                  options={pilihanAksi}
                />
              </div>
            }
          />

          <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={8} cols={4} />}>
            {logs.length === 0 ? (
              <EmptyState icon={ScrollText} title={t("audit_empty")} description={t("audit_empty_desc")} />
            ) : (
              <ul className="divide-y divide-line">
                {logs.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3">
                    <Badge capitalize={false} tone={nadaAksi(l.action)}>
                      {l.action}
                    </Badge>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{l.summary}</p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {l.account_name ?? "—"}
                        {l.account_role ? ` · ${l.account_role}` : ""}
                        {l.ip ? ` · ${l.ip}` : ""}
                      </p>
                    </div>

                    <time className="shrink-0 text-[11px] tabular-nums text-ink-muted">
                      {formatDateTime(l.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </ApiState>

          {totalHalaman > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <button
                type="button"
                onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                disabled={halaman <= 1}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-40"
              >
                <ChevronLeft size={14} /> {t("prev_page")}
              </button>

              <span className="text-xs tabular-nums text-ink-faint">
                {halaman} / {totalHalaman}
              </span>

              <button
                type="button"
                onClick={() => setHalaman((h) => Math.min(totalHalaman, h + 1))}
                disabled={halaman >= totalHalaman}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-40"
              >
                {t("next_page")} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
