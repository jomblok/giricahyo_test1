// src/components/CertificateExpiryCard.jsx — sertifikat yang akan habis.
//
// Kolom `expires_at` sudah ada di tabel dan sudah ditampilkan CertificateModal,
// tapi TIDAK ADA YANG MENGAWASINYA: sertifikat kedaluwarsa diam-diam, dan itu
// pendapatan berulang yang hilang tanpa seorang pun tahu.
//
// Dipakai dua peran dengan data yang berbeda — backend menyaringnya: admin
// melihat semua sertifikat yang mendekati jatuh tempo, buyer hanya miliknya
// sendiri. Tombol perpanjang hanya muncul untuk buyer, karena membayar
// perpanjangan adalah keputusan pembeli, bukan koperasi.

import { useState } from "react";
import { Clock, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { adoptionApi } from "../lib/api";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { formatDate } from "../lib/format";
import { Card, CardHeader, Badge, Button, EmptyState, SkeletonTable } from "./ui";

function sisaHari(tanggal) {
  const ms = new Date(tanggal) - new Date();
  return Math.ceil(ms / 86400000);
}

// `level` diteruskan ke CardHeader: kartu ini dipakai di halaman yang punya
// SectionHeader (h2) dan di halaman yang tidak, jadi tingkat judulnya
// ditentukan pemanggil. Lihat CardHeader di ui/Card.jsx.
export default function CertificateExpiryCard({ bisaPerpanjang = false, days = 90, level = 3 }) {
  const { t } = useLanguage();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi(() => adoptionApi.expiring(days), [days]);
  const [sibukId, setSibukId] = useState(null);

  const daftar = data?.adoptions ?? [];

  async function perpanjang(id) {
    setSibukId(id);
    try {
      const res = await adoptionApi.renew(id);
      toast.success(res?.message ?? t("renew_success"));
      refetch();
    } catch (err) {
      toast.error(err?.message ?? "Perpanjangan gagal.");
    } finally {
      setSibukId(null);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={Clock}
        title={t("expiring_soon")}
        level={level}
        count={daftar.length || undefined}
        actions={
          data?.expired > 0 ? (
            <Badge tone="bad">
              {data.expired} {t("expired").toLowerCase()}
            </Badge>
          ) : null
        }
      />

      <div className="px-5 pb-5">
        <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={3} cols={4} />}>
          {daftar.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t("none_yet")}
              // no_reports_desc pernah dipakai di sini dan berbunyi "Laporan
              // yang Anda kirim dari lapangan akan muncul di sini" — kalimat
              // tentang laporan petani, di kartu tentang sertifikat.
              description={`${t("no_expiring_certificates_desc")} ${days} ${t("days_short")}.`}
            />
          ) : (
            <ul className="space-y-2.5">
              {daftar.map((a) => {
                const sisa = sisaHari(a.expires_at);
                const habis = sisa < 0;
                // 30 hari: di bawah itu perpanjangan perlu dibicarakan
                // sekarang, bukan "nanti". Di atasnya masih terasa jauh dan
                // peringatan merah hanya jadi kebisingan.
                const mendesak = sisa >= 0 && sisa <= 30;

                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-surface-sub px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono-id text-sm text-ink">{a.certificate_no}</p>
                      <p className="text-xs text-ink-muted">
                        {a.tree?.species ?? a.tree_id} · {a.buyer_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                        {t("expires_on")}
                      </p>
                      <p className="text-sm tabular-nums text-ink">{formatDate(a.expires_at)}</p>
                    </div>

                    {habis ? (
                      <Badge tone="bad">
                        <AlertTriangle size={11} /> {t("expired")}
                      </Badge>
                    ) : (
                      <Badge tone={mendesak ? "warn" : "neutral"}>
                        {sisa} {t("days_short")}
                      </Badge>
                    )}

                    {bisaPerpanjang && (
                      <Button
                        size="sm"
                        type="button"
                        variant={habis || mendesak ? "primary" : "ghost"}
                        disabled={sibukId === a.id}
                        onClick={() => perpanjang(a.id)}
                      >
                        {sibukId === a.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <RefreshCw size={14} />}
                        {t("renew_certificate")}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ApiState>
      </div>
    </Card>
  );
}
