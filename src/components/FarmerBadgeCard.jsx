// src/components/FarmerBadgeCard.jsx — siapa yang merawat pohon ini.
//
// Paket adopsi menjanjikan "menghubungkan pendukung dengan pohon, petani, dan
// dampak lokal", tapi sebelum ini satu-satunya yang buyer lihat tentang
// petaninya adalah namanya sebagai teks di pojok kartu.
//
// Datanya datang dari endpoint sempit yang dibuat khusus untuk ini
// (GET /farmers/{id}/profil-publik), BUKAN dari /farmers/{id} yang memuat
// seluruh inventaris dan riwayat gaji petani \u2014 endpoint itu memang menolak
// buyer, dan sudah seharusnya begitu.

import { useState } from "react";
import { User, ChevronDown, ChevronUp, TreeDeciduous, Wind, Sprout } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber } from "../lib/format";
import { Skeleton } from "./ui";

export default function FarmerBadgeCard({ farmerId, farmerName }) {
  const { t } = useLanguage();
  const [buka, setBuka] = useState(false);

  // Diambil saat dibuka saja: kartu ini muncul sekali per pohon yang didukung,
  // dan beberapa pohon bisa dirawat petani yang sama.
  const { data, loading, error } = useApi(
    () => (buka && farmerId ? farmerApi.profilPublik(farmerId) : Promise.resolve(null)),
    [buka, farmerId]
  );

  if (!farmerId) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface-sub">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <User size={15} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{t("supported_by_farmer")}</span>
          <span className="block truncate text-[11px] text-ink-muted">{farmerName ?? farmerId}</span>
        </span>
        {buka ? <ChevronUp size={15} className="text-ink-faint" /> : <ChevronDown size={15} className="text-ink-faint" />}
      </button>

      {buka && (
        <div className="px-4 pb-4">
          <ApiState loading={loading} error={error} skeleton={<Skeleton className="h-20 w-full rounded-xl" />}>
            {data && (
              <div className="rounded-xl bg-surface p-3.5">
                <p className="text-sm font-semibold text-ink">{data.name}</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {data.group_coop}
                  {data.address ? ` \u00b7 ${data.address}` : ""}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { icon: TreeDeciduous, label: t("trees_tended"), value: formatNumber(data.tree_count) },
                    { icon: Sprout, label: t("species_count"), value: formatNumber(data.species_count) },
                    { icon: Wind, label: "kg CO\u2082", value: formatNumber(data.total_co2_kg, 0) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-lg bg-surface-sub p-2 text-center">
                      <Icon size={13} className="mx-auto mb-1 text-ink-faint" />
                      <p className="text-sm font-bold tabular-nums text-ink">{value}</p>
                      <p className="text-[10px] leading-tight text-ink-faint">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ApiState>
        </div>
      )}
    </div>
  );
}
