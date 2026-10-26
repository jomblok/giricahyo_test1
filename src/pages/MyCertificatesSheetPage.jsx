// src/pages/MyCertificatesSheetPage.jsx — semua sertifikat buyer dalam satu lembar.
//
// MASALAH YANG DIPECAHKAN. Sertifikat hanya bisa dilihat dan dicetak satu per
// satu, lewat modal di kartu pohon masing-masing. Pendukung korporat dengan
// sepuluh pohon harus membuka sepuluh modal dan menekan cetak sepuluh kali,
// menghasilkan sepuluh berkas terpisah yang harus digabung sendiri sebelum
// bisa dilampirkan ke laporan CSR.
//
// Halaman ini meringkas seluruhnya jadi satu lembar yang bisa dicetak sekali.
// Bukan pengganti sertifikat resmi per pohon — itu tetap ada, dengan QR dan
// nomornya sendiri — melainkan daftar ringkas untuk lampiran dan arsip.

import { Printer, Award } from "lucide-react";
import AppShell from "../components/AppShell";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { formatDate, formatNumber, formatRupiah } from "../lib/format";
import { labelPaketAdopsi } from "../lib/packageCatalog";
import { Card, Button, EmptyState, SkeletonTable } from "../components/ui";

export default function MyCertificatesSheetPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";

  const { data, loading, error } = useApi(() => buyerApi.get(buyerId), [buyerId]);

  const adopsi = data?.adoptions ?? [];
  const totalCo2 = data?.total_co2_kg ?? 0;
  const totalBayar = adopsi.reduce((n, a) => n + Number(a.price || 0), 0);

  return (
    <AppShell title={t("certificates_sheet")} showPeriod={false}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="max-w-xl text-xs text-ink-muted">{t("certificates_sheet_desc")}</p>
          <Button type="button" onClick={() => window.print()} disabled={adopsi.length === 0}>
            <Printer size={15} /> {t("print_now")}
          </Button>
        </div>

        <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={5} cols={4} />}>
          {adopsi.length === 0 ? (
            <Card>
              <EmptyState icon={Award} title={t("no_certificates_yet")} description={t("no_certificates_yet_desc")} />
            </Card>
          ) : (
            // print-area: aturan di index.css menyembunyikan sisa halaman saat
            // dicetak, jadi hasil cetaknya hanya lembar ini tanpa menu samping.
            <Card className="print-area print-area--sheet-list">
              <header className="mb-4 border-b border-line pb-3">
                <h2 className="gjr-display text-lg font-bold text-ink">{t("certificates_sheet")}</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {data?.buyer?.name ?? "—"} · {t("printed_on")} {formatDate(new Date().toISOString())}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  Koperasi Griya Jati Rasa · Desa Giricahyo, Purwosari, Gunungkidul
                </p>
              </header>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wide text-ink-faint">
                      <th className="py-2 pr-3 font-semibold">{t("certificate_no")}</th>
                      <th className="py-2 pr-3 font-semibold">{t("tree_id")}</th>
                      <th className="py-2 pr-3 font-semibold">{t("adoption_package")}</th>
                      <th className="py-2 pr-3 font-semibold">{t("date")}</th>
                      <th className="py-2 pr-3 text-right font-semibold">kg CO₂</th>
                      <th className="py-2 text-right font-semibold">{t("amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {adopsi.map((a) => (
                      <tr key={a.certificate_no ?? a.id}>
                        <td className="py-2 pr-3 font-mono-id text-[10px] text-brand">{a.certificate_no ?? "—"}</td>
                        <td className="py-2 pr-3 font-mono-id text-[10px] text-ink">{a.tree_id ?? "—"}</td>
                        <td className="py-2 pr-3 text-ink">{labelPaketAdopsi(a.package_name, a.package_tier)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-ink-muted">{formatDate(a.adopted_date)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-ink">
                          {formatNumber(a.tree?.co2_eq_kg ?? 0, 1)}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums text-ink">
                          {a.price != null ? formatRupiah(a.price) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line-strong font-bold">
                      <td className="py-2.5 pr-3 text-ink" colSpan={4}>
                        {t("total")} · {adopsi.length} {t("certificates").toLowerCase()}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-ink">{formatNumber(totalCo2, 1)}</td>
                      <td className="py-2.5 text-right tabular-nums text-warn">{formatRupiah(totalBayar)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Keterangan metodologi ikut tercetak. Lembar yang dilampirkan ke
                  laporan CSR dibaca orang yang tidak membuka aplikasi ini, dan
                  angka karbon tanpa rumusnya adalah klaim tanpa dasar. */}
              <p className="mt-4 border-t border-line pt-3 text-[10px] leading-relaxed text-ink-faint">
                {t("sheet_methodology")}
              </p>
            </Card>
          )}
        </ApiState>
      </div>
    </AppShell>
  );
}
