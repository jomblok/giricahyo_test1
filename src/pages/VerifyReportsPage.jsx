// src/pages/VerifyReportsPage.jsx — antrean verifikasi laporan petani (admin).
//
// Pasangan dari ReportConditionModal dan RegisterTreePage. Menyetujui di sini
// mengubah data karbon RESMI: kondisi pohon diperbarui, atau pohon baru terbit
// beserta perhitungan CO2-nya. Karena itu halaman ini menampilkan isi laporan
// apa adanya dan tidak menyembunyikan apa pun di balik ringkasan.
//
// Urutannya "menunggu dulu, terlama di atas" — datang dari backend, bukan
// disortir di sini. Terbaru-dulu akan membuat laporan lama terdorong makin ke
// bawah setiap ada laporan baru dan tidak pernah tertangani.

import { useState } from "react";
import {
  ClipboardCheck, Check, X, Sprout, HeartPulse, MapPin, Calendar, Loader2,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { reportApi } from "../lib/api";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { formatNumber } from "../lib/format";
import {
  Card, CardHeader, Badge, Button, EmptyState, SkeletonTable, SectionHeader,
} from "../components/ui";

const NADA = { menunggu: "warn", disetujui: "good", ditolak: "bad" };

export default function VerifyReportsPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [saring, setSaring] = useState("menunggu");

  const { data, loading, error, refetch } = useApi(() => reportApi.list(saring), [saring]);
  const laporan = data?.reports ?? [];

  return (
    <AppShell title={t("nav_verify")} showPeriod={false}>
      <div className="space-y-6">
        <div>
          <SectionHeader>{t("verify_queue")}</SectionHeader>
          <p className="text-sm text-ink-muted max-w-2xl">{t("verify_queue_desc")}</p>
        </div>

        {/* Penyaring status. Tombol biasa, bukan Select: cuma tiga pilihan dan
            semuanya ingin terlihat sekaligus beserta jumlah yang menunggu. */}
        <div className="flex flex-wrap gap-2">
          {["menunggu", "disetujui", "ditolak"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSaring(s)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                saring === s
                  ? "bg-brand text-cream-50 dark:text-forest-950"
                  : "bg-surface-sub text-ink-muted hover:bg-surface-hover hover:text-ink"
              }`}
            >
              {t(`status_${s}`)}
              {s === "menunggu" && data?.menunggu > 0 && (
                <span className="ml-1.5 tabular-nums">({data.menunggu})</span>
              )}
            </button>
          ))}
        </div>

        <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={4} />}>
          {laporan.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={saring === "menunggu" ? t("no_pending") : t("no_reports")}
              description={saring === "menunggu" ? t("no_pending_desc") : t("no_reports_desc")}
            />
          ) : (
            <div className="space-y-4">
              {laporan.map((r) => (
                <KartuLaporan key={r.id} laporan={r} onSelesai={refetch} t={t} toast={toast} />
              ))}
            </div>
          )}
        </ApiState>
      </div>
    </AppShell>
  );
}

function KartuLaporan({ laporan, onSelesai, t, toast }) {
  const [menolak, setMenolak] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [rho, setRho] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  const p = laporan.payload ?? {};
  const pohonBaru = laporan.type === "pohon_baru";
  const menunggu = laporan.status === "menunggu";

  // Jenis yang belum ada di katalog tidak punya kerapatan kayu, dan tanpa itu
  // CO2-nya tidak bisa dihitung. Admin mengisinya di sini, karena dialah yang
  // punya akses ke tabel rujukan.
  const perluRho = pohonBaru && !p.density_rho;

  async function putuskan(keputusan) {
    setGalat("");
    if (keputusan === "tolak" && !alasan.trim()) {
      setGalat(t("reject_reason") + " — " + t("required_field"));
      return;
    }
    setSibuk(true);
    try {
      const res = await reportApi.review(laporan.id, {
        keputusan,
        review_note: keputusan === "tolak" ? alasan : null,
        density_rho: perluRho && rho ? Number(rho) : undefined,
      });
      toast.success(res?.message ?? t("saved"));
      onSelesai();
    } catch (err) {
      setGalat(err?.message ?? "Gagal menyimpan keputusan.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={pohonBaru ? Sprout : HeartPulse}
        title={pohonBaru ? t("register_tree") : t("report_condition_for")}
        actions={<Badge tone={NADA[laporan.status]}>{t(`status_${laporan.status}`)}</Badge>}
      />

      <div className="px-5 pb-5 space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-muted">
          <span>
            {t("reported_by")}: <strong className="text-ink">{laporan.farmer?.name ?? laporan.farmer_id}</strong>
          </span>
          {laporan.tree_id && <span className="font-mono-id">{laporan.tree_id}</span>}
          <span>{new Date(laporan.created_at).toLocaleString("id-ID")}</span>
        </div>

        {/* Isi laporan */}
        <div className="rounded-2xl bg-surface-sub p-4">
          {pohonBaru ? (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-sm">
              <Baris label={t("species")} nilai={p.species} />
              <Baris label="DBH" nilai={`${formatNumber(p.dbh_cm)} cm`} />
              <Baris label={t("height")} nilai={`${formatNumber(p.height_m)} m`} />
              <Baris label="ρ" nilai={p.density_rho ? formatNumber(p.density_rho) : "—"} />
              <Baris
                label={<><MapPin size={11} className="inline" /> {t("coordinates")}</>}
                nilai={`${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`}
              />
              <Baris
                label={<><Calendar size={11} className="inline" /> {t("planted_date")}</>}
                nilai={p.planted_date}
              />
            </dl>
          ) : (
            <p className="text-sm text-ink">
              {t("new_condition")}: <strong>{t(`health_${p.health_status}`)}</strong>
            </p>
          )}

          {laporan.note && (
            <p className="mt-3 border-t border-line pt-3 text-sm text-ink-muted italic">
              &ldquo;{laporan.note}&rdquo;
            </p>
          )}
        </div>

        {laporan.photo_url && (
          <img
            src={laporan.photo_url}
            alt=""
            className="max-h-64 w-full rounded-2xl border border-line object-cover"
          />
        )}

        {perluRho && menunggu && (
          <div className="rounded-2xl border border-warn/40 bg-warn-soft px-4 py-3">
            <label className="block text-xs font-semibold text-ink mb-1.5">
              {t("rho_unknown")}
            </label>
            <input
              type="number" step="0.01" min="0.1" max="1.5"
              value={rho}
              onChange={(e) => setRho(e.target.value)}
              placeholder="0.60"
              className="w-28 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>
        )}

        {laporan.status === "ditolak" && laporan.review_note && (
          <p className="rounded-2xl bg-bad-soft px-4 py-3 text-sm text-bad">
            {laporan.review_note}
          </p>
        )}

        {menunggu && (
          <div className="space-y-3 border-t border-line pt-4">
            {menolak && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">{t("reject_reason")}</label>
                <textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  rows={2} maxLength={500}
                  placeholder={t("reject_reason_ph")}
                  className="w-full rounded-2xl border border-line bg-surface-sub px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                />
              </div>
            )}

            {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}

            <div className="flex flex-wrap gap-2 justify-end">
              {menolak ? (
                <>
                  <Button variant="ghost" type="button" onClick={() => { setMenolak(false); setAlasan(""); setGalat(""); }}>
                    {t("cancel")}
                  </Button>
                  <Button variant="danger" type="button" disabled={sibuk} onClick={() => putuskan("tolak")}>
                    {sibuk ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                    {t("reject")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" type="button" onClick={() => setMenolak(true)}>
                    <X size={15} /> {t("reject")}
                  </Button>
                  <Button type="button" disabled={sibuk || (perluRho && !rho)} onClick={() => putuskan("setuju")}>
                    {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {t("approve")}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Baris({ label, nilai }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="truncate text-ink tabular-nums">{nilai}</dd>
    </div>
  );
}
