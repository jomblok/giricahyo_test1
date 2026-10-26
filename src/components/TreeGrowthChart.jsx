// src/components/TreeGrowthChart.jsx — riwayat serapan karbon satu pohon.
//
// Dipakai dua peran: petani melihat pohon yang dirawatnya tumbuh, buyer
// melihat pohon yang didukungnya tumbuh. Keduanya membaca deret yang sama
// dari carbon_measurements, jadi tidak ada dua versi angka yang bisa
// berbeda.
//
// KENAPA ADA KEADAAN "BELUM CUKUP". Saat ini setiap pohon baru punya SATU
// pengukuran — garis dasar dari survei lapangan. Satu titik bukan
// pertumbuhan. Menggambarnya sebagai grafik garis akan terlihat seperti
// bukti padahal tidak membuktikan apa pun, dan itu jenis kebohongan yang
// paling mudah lolos karena bentuknya meyakinkan.
//
// Jadi di bawah dua titik, komponen ini menolak menggambar dan mengatakan
// apa yang kurang. Begitu pengukuran kedua masuk, grafiknya muncul sendiri.

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import CarbonChainCard from "./CarbonChainCard";
import { formatNumber, formatDate } from "../lib/format";
import { CHART, AXIS_PROPS, SkeletonChart } from "./ui";

// Gaya tooltip mengikuti ChartTooltip di TrendCharts — satu tampilan untuk
// semua grafik, bukan dua yang mirip tapi tidak persis.
function GrowthTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs text-ink shadow-lg">
      <p className="mb-0.5 font-semibold">{formatDate(label)}</p>
      <p className="tabular-nums text-ink-muted">
        {formatNumber(payload[0].value, 2)} kg CO₂ · {t("co2_absorbed")}
      </p>
      {/* Masukan yang melahirkan angka itu, bukan cuma hasilnya — inilah yang
          membuat klaim karbonnya bisa ditelusuri, bukan sekadar dipercaya. */}
      {payload[0].payload?.dbh != null && (
        <p className="mt-0.5 tabular-nums text-[11px] text-ink-faint">
          DBH {formatNumber(payload[0].payload.dbh, 1)} cm ·{" "}
          {formatNumber(payload[0].payload.tinggi, 1)} m · ρ{" "}
          {formatNumber(payload[0].payload.rho, 2)}
        </p>
      )}
    </div>
  );
}

export default function TreeGrowthChart({ treeId, defaultOpen = false }) {
  const { t } = useLanguage();
  const [buka, setBuka] = useState(defaultOpen);

  // Deret hanya diambil saat panelnya dibuka. Grafik ini duduk di dalam kartu
  // pohon yang jumlahnya bisa puluhan di satu layar; mengambil deret untuk
  // semuanya di muka berarti puluhan permintaan untuk satu yang dilihat.
  const { data, loading, error } = useApi(
    () => (buka ? treeApi.growth(treeId) : Promise.resolve(null)),
    [buka, treeId]
  );

  const titik = (data?.measurements ?? []).map((m) => ({
    tanggal: m.measurement_date,
    co2: Number(m.co2_eq_kg),
    dbh: m.dbh_cm != null ? Number(m.dbh_cm) : null,
    tinggi: m.height_m != null ? Number(m.height_m) : null,
    rho: m.density_rho != null ? Number(m.density_rho) : null,
    sumber: m.source,
    pencatat: m.recorded_by_name,
  }));

  // Rantai hitung memakai pengukuran TERAKHIR, bukan yang pertama: itulah
  // angka yang sedang dipakai di seluruh sistem. Deretnya sudah diurutkan
  // naik berdasarkan tanggal di sisi server.
  const terakhir = (data?.measurements ?? []).at(-1) ?? null;

  const selisih = titik.length >= 2 ? titik[titik.length - 1].co2 - titik[0].co2 : 0;

  return (
    <div className="rounded-2xl border border-line bg-surface-sub">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <TrendingUp size={15} className="shrink-0 text-brand" />
        <span className="flex-1 text-sm font-semibold text-ink">{t("growth_history")}</span>
        {buka ? (
          <ChevronUp size={15} className="text-ink-faint" />
        ) : (
          <ChevronDown size={15} className="text-ink-faint" />
        )}
      </button>

      {buka && (
        <div className="px-4 pb-4">
          <ApiState loading={loading} error={error} skeleton={<SkeletonChart />}>
            {!data ? null : !data.cukup_untuk_grafik ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-surface p-3.5">
                <Info size={15} className="mt-0.5 shrink-0 text-ink-faint" />
                <div className="min-w-0">
                  <p className="text-xs text-ink">{t("growth_not_enough")}</p>
                  {titik.length === 1 && (
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {t("growth_baseline")}: {formatDate(titik[0].tanggal)} ·{" "}
                      <span className="tabular-nums">{formatNumber(titik[0].co2, 2)} kg CO₂</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={titik} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                      <XAxis
                        dataKey="tanggal"
                        {...AXIS_PROPS}
                        tickFormatter={(v) => formatDate(v)}
                      />
                      {/* Sumbu Y mengikuti rentang DATA, bukan mulai dari 0.
                          Dengan basis 0, pertumbuhan 196 -> 237 kg tergambar
                          sebagai garis nyaris datar di sepertiga atas — benar
                          secara angka, tapi grafik pertumbuhan yang tidak
                          memperlihatkan pertumbuhan gagal pada tujuannya.

                          Supaya besarannya tidak hilang, nilai mutlaknya tetap
                          terbaca di sumbu, di tooltip, dan di keterangan bawah
                          yang menyebut selisihnya. */}
                      <YAxis
                        {...AXIS_PROPS}
                        domain={[
                          (min) => Math.max(0, min - Math.max(1, (min || 1) * 0.04)),
                          (max) => max + Math.max(1, (max || 1) * 0.04),
                        ]}
                        tickFormatter={(v) => formatNumber(v, 0)}
                      />
                      <Tooltip content={<GrowthTooltip t={t} />} />
                      <Line
                        type="monotone"
                        dataKey="co2"
                        stroke={CHART.c1}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[11px] text-ink-faint">
                  {titik.length} {t("measurements_count")} · {formatDate(titik[0].tanggal)} →{" "}
                  {formatDate(titik[titik.length - 1].tanggal)}
                  {" · "}
                  {/* Selisihnya dieja, bukan diserahkan ke mata pembaca:
                      sumbu yang tidak mulai dari 0 bisa membesar-besarkan
                      kemiringan, jadi angkanya harus tetap terbaca. */}
                  <span className={selisih >= 0 ? "font-semibold text-good" : "font-semibold text-bad"}>
                    {selisih >= 0 ? "+" : "−"}
                    {formatNumber(Math.abs(selisih), 2)} kg CO₂
                  </span>{" "}
                  {t("since_baseline")}
                </p>

                {/* Tabel asal-usul. Grafik menjawab "berapa"; tabel ini
                    menjawab "dari mana angkanya" — pertanyaan yang justru
                    ditanyakan penguji dan calon pembeli. */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-medium text-brand">
                    {t("measurement_provenance")}
                  </summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-line text-[10px] uppercase tracking-wide text-ink-faint">
                          <th className="py-1.5 pr-2 font-semibold">{t("date")}</th>
                          <th className="py-1.5 pr-2 text-right font-semibold">DBH</th>
                          <th className="py-1.5 pr-2 text-right font-semibold">{t("height")}</th>
                          <th className="py-1.5 pr-2 text-right font-semibold">ρ</th>
                          <th className="py-1.5 pr-2 text-right font-semibold">kg CO₂</th>
                          <th className="py-1.5 font-semibold">{t("source_label")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {titik.map((p, i) => (
                          <tr key={i}>
                            <td className="py-1.5 pr-2 whitespace-nowrap text-ink-muted">{formatDate(p.tanggal)}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-ink">{p.dbh != null ? formatNumber(p.dbh, 1) : "—"}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-ink">{p.tinggi != null ? formatNumber(p.tinggi, 1) : "—"}</td>
                            <td className="py-1.5 pr-2 text-right tabular-nums text-ink-muted">{p.rho != null ? formatNumber(p.rho, 2) : "—"}</td>
                            <td className="py-1.5 pr-2 text-right font-semibold tabular-nums text-ink">{formatNumber(p.co2, 2)}</td>
                            <td className="py-1.5 text-ink-faint">
                              {p.sumber ? t(`src_${p.sumber}`) : "—"}
                              {p.pencatat ? ` · ${p.pencatat}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}

            {/* DI LUAR percabangan di atas, bukan di dalamnya. Cabang itu
                hanya jalan kalau pengukurannya dua atau lebih, sedangkan
                rantai hitung justru paling dibutuhkan pada pohon yang baru
                diukur SEKALI — di situ belum ada grafik apa pun yang bisa
                menjelaskan angkanya. */}
            {terakhir && (
              <div className="mt-3">
                <CarbonChainCard measurement={terakhir} />
              </div>
            )}
          </ApiState>
        </div>
      )}
    </div>
  );
}
