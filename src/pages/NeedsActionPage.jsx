// src/pages/NeedsActionPage.jsx — satu layar berisi semua yang menunggu admin.
//
// MASALAH YANG DIPECAHKAN. Hal-hal yang butuh tindakan pengurus tersebar di
// empat halaman: laporan petani menunggu di /laporan, sertifikat hampir habis
// di /sertifikat, pohon kondisi buruk di /pohon, pohon yang lama tidak diukur
// tidak di mana-mana. Tidak ada satu tempat pun yang menjawab "hari ini saya
// harus mengerjakan apa" — jadi jawabannya bergantung pada halaman mana yang
// kebetulan dibuka.
//
// Halaman ini tidak menghitung apa pun yang baru. Ia memanggil endpoint yang
// sudah ada dan menyusunnya menurut tindakan, bukan menurut entitas.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, HeartCrack, Award, ArrowRight, CheckCircle2 } from "lucide-react";
import AppShell from "../components/AppShell";
import CertificateExpiryCard from "../components/CertificateExpiryCard";
import CycleProgressCard from "../components/CycleProgressCard";
import DueForCheckCard from "../components/DueForCheckCard";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { reportApi, treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, HealthBadge, EmptyState, SkeletonTable, StatCard } from "../components/ui";

export default function NeedsActionPage() {
  const { t } = useLanguage();

  // Statusnya "menunggu", bukan "pending": TreeReportController@index
  // menyaringnya lewat in_array terhadap daftar bahasa Indonesia, jadi nilai
  // asing TIDAK ditolak — ia diabaikan diam-diam dan seluruh laporan ikut
  // terbawa, termasuk yang sudah selesai.
  const { data: dataLaporan, loading: muatLaporan, error: galatLaporan } = useApi(() => reportApi.list("menunggu"));
  const { data: pohon, loading: muatPohon, error: galatPohon } = useApi(() => treeApi.list());

  const buruk = useMemo(
    () => (pohon ?? []).filter((p) => (p.health_status ?? p.healthStatus) === "buruk"),
    [pohon]
  );

  // Balasannya objek {reports, menunggu}, bukan larik. `menunggu` dihitung
  // backend tanpa batas 200 baris, jadi ia dipakai untuk angka; daftar di
  // bawah tetap dari reports.
  const laporan = dataLaporan?.reports ?? [];
  const jumlahLaporan = dataLaporan?.menunggu ?? laporan.length;

  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_needs_action")} wide showPeriod={false}>
      <div className="gjr-stagger space-y-6">
        <p className="px-1 text-xs text-ink-muted max-w-2xl">{t("needs_action_desc")}</p>

        {/* Tiga angka yang menentukan apakah halaman ini perlu dibuka sama
            sekali. Masing-masing menautkan ke tempat tindakannya dilakukan,
            bukan ke tempat angkanya dihitung. */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link to="/laporan">
            <StatCard
              layout="inline"
              icon={ClipboardCheck}
              label={t("reports_waiting")}
              value={muatLaporan ? "—" : jumlahLaporan}
              sub={t("waiting_your_review")}
              accent={jumlahLaporan > 0 ? "gold" : "sage"}
            />
          </Link>
          <Link to="/pohon">
            <StatCard
              layout="inline"
              icon={HeartCrack}
              label={t("trees_in_bad_condition")}
              value={muatPohon ? "—" : buruk.length}
              sub={t("needs_field_visit")}
              accent={buruk.length > 0 ? "gold" : "sage"}
            />
          </Link>
          <Link to="/sertifikat">
            <StatCard
              layout="inline"
              icon={Award}
              label={t("certificates_expiring")}
              value={t("see_card_below")}
              sub={t("within_60_days")}
              accent="sage"
            />
          </Link>
        </section>

        {/* Antrean verifikasi — isinya, bukan cuma jumlahnya. Pengurus bisa
            menilai mendesak atau tidak tanpa pindah halaman. */}
        <section>
          <Card>
            {/* level=2: halaman ini tidak punya SectionHeader, jadi kartunya
                berada langsung di bawah judul halaman (h1). */}
            <CardHeader
              level={2}
              icon={ClipboardCheck}
              title={t("reports_waiting")}
              count={muatLaporan ? null : jumlahLaporan}
              actions={
                jumlahLaporan > 0 ? (
                  <Link to="/laporan" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                    {t("open_queue")} <ArrowRight size={13} />
                  </Link>
                ) : null
              }
            />
            <ApiState loading={muatLaporan} error={galatLaporan} skeleton={<SkeletonTable rows={3} cols={3} />}>
              {jumlahLaporan === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={t("queue_clear")}
                  description={t("queue_clear_desc")}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {laporan.slice(0, 5).map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-mono-id text-xs text-brand">{l.tree_id}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {l.farmer?.name ?? l.farmer_id}
                          {l.tree?.species ? ` · ${l.tree.species}` : ""}
                        </p>
                      </div>
                      {/* Kondisi yang dilaporkan ada di dalam payload, bukan
                          kolom tersendiri — sama seperti dibaca VerifyReportsPage. */}
                      {l.payload?.health_status && (
                        <HealthBadge
                          status={l.payload.health_status}
                          label={t(`health_${l.payload.health_status}`)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ApiState>
          </Card>
        </section>

        {/* Pohon kondisi buruk: daftar pendek, karena tindakannya kunjungan
            lapangan dan yang dibutuhkan hanya ID-nya. */}
        <section>
          <Card>
            <CardHeader level={2} icon={HeartCrack} title={t("trees_in_bad_condition")} count={muatPohon ? null : buruk.length} />
            <ApiState loading={muatPohon} error={galatPohon} skeleton={<SkeletonTable rows={3} cols={3} />}>
              {buruk.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={t("no_bad_trees")}
                  description={t("no_bad_trees_desc")}
                />
              ) : (
                <ul className="divide-y divide-line">
                  {buruk.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-mono-id text-xs text-brand">{p.id}</p>
                        <p className="truncate text-xs text-ink-muted">
                          {p.species}
                          {p.farmer_name ? ` · ${p.farmer_name}` : ""}
                        </p>
                      </div>
                      <HealthBadge status="buruk" label={t("health_buruk")} />
                    </li>
                  ))}
                </ul>
              )}
            </ApiState>
          </Card>
        </section>

        <section>
          <CycleProgressCard max={3} />
        </section>

        <section>
          <CertificateExpiryCard days={60} level={2} />
        </section>

        <section>
          {/* Admin diarahkan ke inventaris penuh, bukan /pohon-saya yang
              khusus petani. */}
          <DueForCheckCard linkTo="/pohon" descKey="due_for_check_desc_admin" />
        </section>
      </div>
    </AppShell>
  );
}
