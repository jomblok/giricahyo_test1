// src/components/DueForCheckCard.jsx — pohon yang paling lama tidak diukur.
//
// MASALAH YANG DIPECAHKAN. Kolom `last_updated` sudah lama terisi dan punya
// sebaran nyata (sebagian petak terakhir diukur Juni, sebagian Juli), tapi
// tidak satu pun layar memakainya. Petani melihat daftar pohonnya urut ID,
// jadi tidak ada cara mengetahui petak mana yang paling tertinggal selain
// membandingkan tanggal satu per satu.
//
// Kartu ini membalik urutannya: yang paling lama tidak disentuh naik ke atas.
//
// Ambangnya 90 hari — satu musim. Angka ini keputusan tampilan, bukan aturan
// MRV: tidak ada dokumen proyek yang menetapkan selang pengukuran, jadi
// ambang ini sengaja dibuat satu konstanta yang mudah diubah, bukan disebar
// sebagai angka ajaib.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ArrowRight } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatDate } from "../lib/format";
import { Card, CardHeader, Badge, EmptyState, SkeletonTable } from "./ui";

const AMBANG_HARI = 90;
const TAMPIL = 6;

function hariSejak(tanggal) {
  if (!tanggal) return null;
  const lalu = new Date(tanggal);
  if (Number.isNaN(lalu.getTime())) return null;
  return Math.floor((Date.now() - lalu.getTime()) / 86_400_000);
}

// `linkTo` dan `descKey` ada karena kartu ini dipakai dua peran dengan
// tindak lanjut yang berbeda: petani menuju daftar pohonnya sendiri untuk
// melapor, admin menuju inventaris penuh. Tanpa itu, kartu di dasbor admin
// akan menunjuk /pohon-saya — rute yang khusus petani, jadi admin ditolak
// penjaga perannya sendiri.
export default function DueForCheckCard({
  linkTo = "/pohon-saya",
  descKey = "due_for_check_desc",
}) {
  const { t } = useLanguage();
  // treeApi.map() sudah disaring backend ke farmer_id akun yang masuk,
  // jadi tidak ada penyaringan per petani di sisi ini.
  const { data, loading, error } = useApi(() => treeApi.map());

  const tertinggal = useMemo(() => {
    const semua = data ?? [];
    return semua
      .map((p) => ({ ...p, umur: hariSejak(p.last_updated ?? p.lastUpdated) }))
      // Pohon tanpa tanggal ikut ditampilkan, bukan disembunyikan: tidak
      // pernah diukur sama sekali lebih mendesak daripada telat 90 hari.
      .filter((p) => p.umur == null || p.umur >= AMBANG_HARI)
      .sort((a, b) => (b.umur ?? Infinity) - (a.umur ?? Infinity))
      .slice(0, TAMPIL);
  }, [data]);

  const total = (data ?? []).filter((p) => {
    const u = hariSejak(p.last_updated ?? p.lastUpdated);
    return u == null || u >= AMBANG_HARI;
  }).length;

  return (
    <Card>
      <CardHeader
        icon={CalendarClock}
        title={t("due_for_check")}
        count={loading ? null : total}
        actions={
          total > TAMPIL ? (
            <Link
              to={linkTo}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              {t("see_all")} <ArrowRight size={13} />
            </Link>
          ) : null
        }
      />

      <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={4} />}>
        {tertinggal.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={t("all_trees_recently_checked")}
            description={t("all_trees_recently_checked_desc")}
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-ink-muted">
              {t(descKey)}
            </p>
            <ul className="divide-y divide-line">
              {tertinggal.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono-id text-xs text-brand">{p.id}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {p.species}
                      {p.last_updated && ` \u00b7 ${formatDate(p.last_updated)}`}
                    </p>
                  </div>
                  <Badge capitalize={false} tone={p.umur == null || p.umur >= 180 ? "bad" : "warn"}>
                    {p.umur == null ? t("never_measured") : `${p.umur} ${t("days_ago_short")}`}
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </ApiState>
    </Card>
  );
}
