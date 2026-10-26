// src/pages/MeasurementCyclesPage.jsx — pengurus membuka dan menutup musim ukur.
//
// Tanpa halaman ini, endpoint periode pengukuran akan bernasib sama dengan
// tiga endpoint pengelolaan akun yang sempat ditemukan: ada di backend,
// berfungsi, tapi tidak pernah bisa dipanggil siapa pun karena tidak ada
// tombolnya.
//
// Rincian per petani sengaja hanya di sini, bukan di dasbor petani: kemajuan
// kelompok lain bukan urusan satu petani terhadap petani lainnya.

import { useState } from "react";
import { CalendarRange, Plus, X, Loader2, Users, CheckCircle2 } from "lucide-react";
import AppShell from "../components/AppShell";
import { BatangKemajuan } from "../components/CycleProgressCard";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { cycleApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { formatDate, formatNumber } from "../lib/format";
import { Card, CardHeader, Button, Badge, EmptyState, SkeletonCards, FormStep, SectionHeader } from "../components/ui";

const NADA = { berjalan: "brand", selesai: "good", dibatalkan: "neutral" };

function FormPeriode({ onSimpan, onBatal, menyimpan }) {
  const { t } = useLanguage();
  const [f, setF] = useState({ name: "", period: "", starts_on: "", ends_on: "", notes: "" });
  const [galat, setGalat] = useState("");

  const isi = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  function kirim() {
    setGalat("");
    if (!f.name.trim() || !f.period.trim() || !f.starts_on || !f.ends_on) {
      setGalat(t("fill_required_fields"));
      return;
    }
    // Diperiksa di sini JUGA, bukan hanya di server: galat yang bisa
    // diketahui tanpa perjalanan jaringan sebaiknya ditampilkan seketika.
    if (f.ends_on < f.starts_on) {
      setGalat(t("cycle_end_before_start"));
      return;
    }
    onSimpan({ ...f, notes: f.notes.trim() || null });
  }

  const kelasInput =
    "w-full rounded-xl border border-line bg-surface-sub px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none";

  return (
    <Card className="border-brand/30 bg-brand-soft">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Plus size={14} className="text-brand" /> {t("new_cycle")}
        </span>
        <button type="button" onClick={onBatal} aria-label={t("cancel")} className="text-ink-faint hover:text-ink-muted">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <FormStep n={1} label={t("cycle_name")} wajib>
          <input className={kelasInput} value={f.name} onChange={isi("name")} placeholder="Pengukuran Semester 2 2026" />
        </FormStep>

        <FormStep n={2} label={t("cycle_period_code")} wajib>
          <input className={kelasInput} value={f.period} onChange={isi("period")} placeholder="2026-S2" />
          <p className="mt-1.5 text-[11px] text-ink-faint">{t("cycle_period_hint")}</p>
        </FormStep>

        <FormStep n={3} label={`${t("cycle_starts")} — ${t("cycle_ends")}`} wajib>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input type="date" className={kelasInput} value={f.starts_on} onChange={isi("starts_on")} />
            <input type="date" className={kelasInput} value={f.ends_on} onChange={isi("ends_on")} />
          </div>
        </FormStep>

        <FormStep n={4} label={t("cycle_notes")}>
          <textarea rows={2} className={kelasInput} value={f.notes} onChange={isi("notes")} />
        </FormStep>

        {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onBatal}>{t("cancel")}</Button>
          <Button type="button" onClick={kirim} disabled={menyimpan}>
            {menyimpan ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {t("save")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RincianPetani({ cycleId }) {
  const { data, loading, error } = useApi(() => cycleApi.breakdown(cycleId), [cycleId]);

  return (
    <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={2} />}>
      <ul className="mt-3 space-y-3 border-t border-line pt-3">
        {(data?.farmers ?? []).map((f) => (
          <li key={f.farmer_id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs text-ink">
                {f.name} <span className="text-ink-faint">· {f.group_coop}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                {formatNumber(f.sudah)} / {formatNumber(f.total)}
              </span>
            </div>
            <BatangKemajuan persen={f.persen} selesai={f.sisa === 0 && f.total > 0} />
          </li>
        ))}
      </ul>
    </ApiState>
  );
}

export default function MeasurementCyclesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi(() => cycleApi.list());

  const [bukaForm, setBukaForm] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [rincianUntuk, setRincianUntuk] = useState(null);

  async function simpan(payload) {
    setMenyimpan(true);
    try {
      await cycleApi.create(payload);
      toast.success(t("toast_cycle_created"));
      setBukaForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setMenyimpan(false);
    }
  }

  async function tutup(c) {
    try {
      await cycleApi.update(c.id, { status: "selesai" });
      toast.success(t("toast_cycle_updated"));
      refetch();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    }
  }

  const siklus = data?.cycles ?? [];

  return (
    <AppShell title={t("measurement_cycles")} showPeriod={false}>
      <div className="gjr-stagger mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-xs text-ink-muted">{t("cycles_page_desc")}</p>
          <Button type="button" onClick={() => setBukaForm((v) => !v)}>
            <Plus size={15} /> {t("new_cycle")}
          </Button>
        </div>

        {bukaForm && <FormPeriode onSimpan={simpan} onBatal={() => setBukaForm(false)} menyimpan={menyimpan} />}

        <SectionHeader>{t("measurement_cycles")}</SectionHeader>

        <ApiState loading={loading} error={error} skeleton={<SkeletonCards count={3} />}>
          {siklus.length === 0 ? (
            <Card>
              <EmptyState icon={CalendarRange} title={t("no_cycles")} description={t("no_cycles_desc")} />
            </Card>
          ) : (
            <div className="space-y-4">
              {siklus.map((c) => {
                const p = c.progress ?? {};
                const tuntas = p.sisa === 0 && p.total > 0;
                return (
                  <Card key={c.id}>
                    <CardHeader
                      icon={CalendarRange}
                      title={c.name}
                      actions={
                        <div className="flex items-center gap-2">
                          <Badge capitalize={false} tone={NADA[c.status] ?? "neutral"}>
                            {t(`cycle_${c.status}`)}
                          </Badge>
                          {c.status === "berjalan" && (
                            <Button variant="ghost" type="button" onClick={() => tutup(c)}>
                              <CheckCircle2 size={14} /> {t("mark_done")}
                            </Button>
                          )}
                        </div>
                      }
                    />

                    <BatangKemajuan persen={p.persen ?? 0} selesai={tuntas} />

                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-ink-faint">
                      <span className="tabular-nums">
                        {formatNumber(p.sudah ?? 0)} / {formatNumber(p.total ?? 0)} ·{" "}
                        <span className="font-semibold text-ink-muted">{formatNumber(p.persen ?? 0, 1)}%</span>
                        {" · "}
                        <span className="font-mono-id">{c.period}</span>
                      </span>
                      <span className="tabular-nums">
                        {formatDate(c.starts_on)} — {formatDate(c.ends_on)}
                      </span>
                    </div>

                    {c.notes && <p className="mt-2 text-xs text-ink-muted">{c.notes}</p>}

                    <button
                      type="button"
                      onClick={() => setRincianUntuk(rincianUntuk === c.id ? null : c.id)}
                      aria-expanded={rincianUntuk === c.id}
                      className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-brand hover:underline"
                    >
                      <Users size={13} /> {t("cycle_breakdown")}
                    </button>

                    {rincianUntuk === c.id && <RincianPetani cycleId={c.id} />}
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
