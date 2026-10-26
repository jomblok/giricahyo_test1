// src/pages/PublicImpactPage.jsx — halaman dampak yang dibagikan pendukung.
//
// Dibuka TANPA LOGIN, lewat token acak yang diterbitkan buyer sendiri. Alasan
// kenapa bukan /dampak/{id} ada di migrasi add_share_token_to_buyers: ID buyer
// berurutan, jadi halaman publik ber-ID memungkinkan siapa pun memanen nama
// seluruh pendukung koperasi.
//
// Isinya sengaja sempit — nama pendukung, jumlah pohon, total CO₂, jenis
// pohon. Tidak ada harga, nomor sertifikat, nama petani, atau koordinat:
// tautan ini bisa diteruskan ke siapa saja oleh siapa saja yang menerimanya.

import { useParams } from "react-router-dom";
import { Leaf, TreeDeciduous, Wind, MapPin } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber, formatDate } from "../lib/format";
import CarbonEquivalents from "../components/CarbonEquivalents";

export default function PublicImpactPage() {
  const { token } = useParams();
  const { t } = useLanguage();
  const { data, loading, error } = useApi(() => buyerApi.dampakPublik(token), [token]);

  return (
    <div className="min-h-screen bg-surface-sub">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-6 flex items-center gap-2 text-brand">
          <Leaf size={18} />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">Giricahyo Carbon</span>
        </header>

        <ApiState
          loading={loading}
          error={error}
          skeleton={<div className="h-64 animate-pulse rounded-3xl bg-surface" />}
        >
          {!data ? null : (
            <>
              <div className="rounded-3xl border border-line bg-surface p-7 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-ink-faint">{t("public_impact_of")}</p>
                <h1 className="gjr-display mt-1 text-2xl font-bold text-ink">{data.buyer_name}</h1>

                {data.since && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("supporting_since")} {formatDate(data.since)}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-sub p-4">
                    <TreeDeciduous size={16} className="mb-1.5 text-brand" />
                    <p className="text-2xl font-bold tabular-nums text-ink">{formatNumber(data.tree_count)}</p>
                    <p className="text-[11px] text-ink-muted">{t("trees_supported")}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-sub p-4">
                    <Wind size={16} className="mb-1.5 text-brand" />
                    <p className="text-2xl font-bold tabular-nums text-ink">{formatNumber(data.total_co2_kg, 1)}</p>
                    <p className="text-[11px] text-ink-muted">kg CO₂</p>
                  </div>
                </div>

                {data.species?.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-ink-faint">
                      {t("species_supported")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.species.map((s) => (
                        <span key={s} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-ink">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-[11px] text-ink-muted">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                  <span>
                    {data.cooperative} · {data.village}
                  </span>
                </div>
              </div>

              {/* Komponennya sudah membawa <Card> sendiri, jadi tidak
                  dibungkus lagi — pembungkus kedua menghasilkan kartu di
                  dalam kartu. Propnya `totalCo2`, bukan `kg`: salah nama
                  membuat seluruh angkanya NaN tanpa galat apa pun. */}
              <div className="mt-4">
                <CarbonEquivalents totalCo2={data.total_co2_kg} />
              </div>

              {/* Metodologi ikut ditampilkan di halaman publik. Angka karbon
                  yang dibagikan ke luar tanpa rumusnya adalah klaim tanpa
                  dasar, dan halaman ini justru dibuat untuk dibagikan. */}
              <p className="mt-4 px-1 text-[10px] leading-relaxed text-ink-faint">
                {t("sheet_methodology")}
              </p>
            </>
          )}
        </ApiState>
      </div>
    </div>
  );
}
