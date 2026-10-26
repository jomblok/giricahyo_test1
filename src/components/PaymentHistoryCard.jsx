// src/components/PaymentHistoryCard.jsx — riwayat pembayaran seorang buyer.
//
// MASALAH YANG DIPECAHKAN. Buyer bisa melihat pohon yang didukungnya dan
// sertifikat yang terbit, tapi tidak pernah bisa melihat BERAPA yang sudah
// dibayarkan dan kapan. Padahal angkanya sudah lama tersimpan — `price` dan
// `adopted_date` ada di setiap baris adopsi — hanya tidak pernah ditampilkan.
//
// Untuk pendukung korporat yang harus mempertanggungjawabkan pengeluaran CSR,
// ini bukan hiasan: tanpa daftar ini mereka harus mengarsipkan sendiri setiap
// sertifikat untuk tahu total yang sudah dikeluarkan.
//
// Tidak ada endpoint baru: seluruh datanya sudah ikut di GET /buyers/{id}.

import { useMemo } from "react";
import { Receipt, Download } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { formatRupiah, formatDate } from "../lib/format";
import { labelPaketAdopsi } from "../lib/packageCatalog";
import { Card, CardHeader, EmptyState } from "./ui";

export default function PaymentHistoryCard({ adoptions = [] }) {
  const { t } = useLanguage();

  // Terbaru di atas: pertanyaan yang paling sering diajukan ke daftar seperti
  // ini adalah "yang terakhir kapan", bukan "yang pertama kapan".
  const baris = useMemo(
    () =>
      [...adoptions]
        .filter((a) => a.price != null)
        .sort((a, b) => String(b.adopted_date).localeCompare(String(a.adopted_date))),
    [adoptions]
  );

  const total = useMemo(
    () => baris.reduce((n, a) => n + Number(a.price || 0), 0),
    [baris]
  );

  function unduhCsv() {
    const kolom = [t("date"), t("adoption_package"), t("tree_id"), t("certificate_no"), t("amount")];
    const isi = baris.map((a) => [
      a.adopted_date,
      labelPaketAdopsi(a.package_name, a.package_tier),
      a.tree_id ?? "",
      a.certificate_no ?? "",
      a.price,
    ]);
    // Dibungkus tanda kutip dan tanda kutip di dalamnya digandakan — nama
    // paket memuat koma dan tanpa ini kolomnya bergeser di Excel.
    const csv = [kolom, ...isi]
      .map((r) => r.map((sel) => `"${String(sel ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    // BOM: tanpa ini Excel di Windows membaca UTF-8 sebagai ANSI dan "CO₂"
    // beserta huruf beraksen jadi rusak.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `riwayat-pembayaran-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Card>
      <CardHeader
        icon={Receipt}
        title={t("payment_history")}
        count={baris.length}
        actions={
          baris.length > 0 ? (
            <button
              type="button"
              onClick={unduhCsv}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-sub px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <Download size={13} /> {t("export_csv")}
            </button>
          ) : null
        }
      />

      {baris.length === 0 ? (
        <EmptyState icon={Receipt} title={t("no_payments")} description={t("no_payments_desc")} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="py-2 pr-3 font-semibold">{t("date")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("adoption_package")}</th>
                  <th className="py-2 pr-3 font-semibold">{t("certificate_no")}</th>
                  <th className="py-2 text-right font-semibold">{t("amount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {baris.map((a) => (
                  <tr key={a.id ?? a.certificate_no}>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-ink-muted">
                      {formatDate(a.adopted_date)}
                    </td>
                    <td className="py-2.5 pr-3 text-ink">
                      {labelPaketAdopsi(a.package_name, a.package_tier)}
                      {a.tree_id && (
                        <span className="ml-1.5 font-mono-id text-[10px] text-ink-faint">{a.tree_id}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 font-mono-id text-[10px] text-brand">
                      {a.certificate_no ?? "—"}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-ink">
                      {formatRupiah(a.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs font-semibold text-ink-muted">{t("total_paid")}</span>
            <span className="text-base font-bold tabular-nums text-warn">{formatRupiah(total)}</span>
          </div>
        </>
      )}
    </Card>
  );
}
