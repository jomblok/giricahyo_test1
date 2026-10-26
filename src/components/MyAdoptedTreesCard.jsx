// src/components/MyAdoptedTreesCard.jsx — pohon petani yang sudah punya pendukung.
//
// Bagian paling memotivasi dari seluruh program ini — bahwa ada orang di luar
// sana yang membayar untuk pohon yang Anda rawat — selama ini hanya terlihat
// oleh pengurus. Petani yang merawatnya tidak punya satu pun layar yang
// menunjukkannya.
//
// Yang ditampilkan sengaja sempit: nama pendukung dan tanggalnya, TANPA harga
// dan tanpa nomor sertifikat. Berapa yang dibayar adalah urusan koperasi
// dengan pembeli; yang menjadi hak petani adalah tahu pohonnya didukung.

import { HeartHandshake } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { adoptionApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatDate, formatNumber } from "../lib/format";
import { Card, CardHeader, HealthBadge, EmptyState, SkeletonTable } from "./ui";

export default function MyAdoptedTreesCard() {
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => adoptionApi.pohonSaya());

  const daftar = data?.adoptions ?? [];

  return (
    <Card>
      <CardHeader
        icon={HeartHandshake}
        title={t("my_supported_trees")}
        count={loading ? null : `${data?.sudah_diadopsi ?? 0} / ${data?.total_pohon ?? 0}`}
      />

      <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={3} cols={3} />}>
        {daftar.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title={t("no_supported_trees")}
            description={t("no_supported_trees_desc")}
          />
        ) : (
          <ul className="divide-y divide-line">
            {daftar.map((a) => (
              <li key={a.tree_id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono-id text-xs text-brand">{a.tree_id}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {a.species}
                    {a.co2_eq_kg != null && ` · ${formatNumber(a.co2_eq_kg, 1)} kg CO₂`}
                  </p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="truncate text-xs font-semibold text-ink">{a.buyer_name}</p>
                  <p className="text-[11px] tabular-nums text-ink-faint">{formatDate(a.adopted_date)}</p>
                </div>
                {a.health_status && (
                  <HealthBadge status={a.health_status} label={t(`health_${a.health_status}`)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </ApiState>
    </Card>
  );
}
