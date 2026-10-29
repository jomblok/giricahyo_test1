import { memo, Fragment, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, ArrowDownToLine, Filter, Calendar, Plus, Pencil, Trash2, FileCheck, ChevronDown } from "lucide-react";
import DrilldownModal from "./DrilldownModal";
import IncomeFormModal from "./IncomeFormModal";
import { useToast } from "../lib/ToastContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { carbonFundApi } from "../lib/api";
import { formatRupiah, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, EmptyState, Skeleton, Badge, IconButton, CHART_SERIES, ANIMASI_SERI, ConfirmDialog, Select } from "./ui";

function CarbonFundSection() {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [drillComponent, setDrillComponent] = useState(null);
  const [incomeForm, setIncomeForm] = useState(null); // { mode: "create" } | { mode: "edit", income }

  // Nama bulan dibangkitkan dari locale aktif — sebelumnya ditulis literal
  // dalam Bahasa Indonesia, jadi tidak ikut berubah saat menekan tombol EN.
  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "id-ID", { month: "long" });
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: fmt.format(new Date(2000, i, 1)),
    }));
  }, [lang]);

  // Daftar tahun dihitung dari tahun berjalan — sebelumnya di-hardcode
  // ["2026","2025","2024"] dan akan salah diam-diam begitu ganti tahun.
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => String(now - i));
  }, []);

  const params = {};
  if (selectedMonth) params.month = selectedMonth;
  if (selectedYear) params.year = selectedYear;

  const { data: summary, loading, error, refetch: refetchSummary } = useApi(
    () => carbonFundApi.summary(params),
    [selectedMonth, selectedYear]
  );

  const distribution = summary?.distribution ?? [];

  // Dana masuk dikelompokkan menurut PAKET asalnya. Dihitung backend lewat
  // tautan tree_adoption_id -> package_name, bukan dengan mencocokkan teks
  // kolom `source` yang bentuknya berbeda-beda antar paket.
  const byPackage = summary?.by_package ?? [];
  const totalPaket = byPackage.reduce((a, x) => a + Number(x.total || 0), 0);
  const totalFund = summary?.total_income ?? 0;

  // Data pemasukan raw untuk tabel — fetch terpisah dengan filter
  const { data: incomeRows, refetch: refetchIncome } = useApi(
    () => carbonFundApi.income(params),
    [selectedMonth, selectedYear]
  );

  // ── Pengelompokan Dana Masuk berdasarkan sumber ───────────────────────────
  //
  // Satu sertifikat menulis satu baris pemasukan. Untuk paket berulang seperti
  // Basic Small, daftarnya cepat berubah jadi belasan baris yang tulisannya
  // persis sama dan hanya beda tanggal — dan pertanyaan yang sebenarnya ingin
  // dijawab admin ("paket ini sudah terjual berapa, dapat berapa") justru harus
  // dijumlah sendiri dengan mata.
  //
  // Jadi barisnya digabung per sumber: qty dijumlah, total dijumlah. Yang
  // TIDAK dilakukan adalah menggabung datanya di database — tiap baris tetap
  // utuh dan tetap tertaut ke sertifikatnya masing-masing lewat
  // tree_adoption_id, karena baris manual masih harus bisa diubah/dihapus satu
  // per satu dan penelusuran audit butuh tanggal aslinya. Penggabungan ini
  // murni tampilan; rinciannya tinggal dibuka.
  const incomeGroups = useMemo(() => {
    const peta = new Map();
    for (const row of incomeRows ?? []) {
      const kunci = row.source ?? "";
      let g = peta.get(kunci);
      if (!g) {
        g = { kunci, source: row.source, qty: 0, total: 0, entri: [] };
        peta.set(kunci, g);
      }
      // Number(): qty datang sebagai integer tapi total_amount sebagai string
      // desimal dari MySQL ("20000.00"). Tanpa konversi, "+" menyambung teks
      // dan totalnya jadi "020000.0020000.00".
      g.qty   += Number(row.qty ?? 0);
      g.total += Number(row.total_amount ?? row.totalAmount ?? 0);
      g.entri.push(row);
    }

    const urutTanggal = (a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""));
    return [...peta.values()]
      .map((g) => {
        const entri = [...g.entri].sort(urutTanggal);
        const tanggal = entri.map((e) => e.date).filter(Boolean).sort();
        return {
          ...g,
          entri,
          tanggalAwal: tanggal[0] ?? null,
          tanggalAkhir: tanggal[tanggal.length - 1] ?? null,
        };
      })
      // Kelompok dengan aktivitas terbaru muncul lebih dulu — urutan yang sama
      // seperti daftar sebelum digabung.
      .sort((a, b) => String(b.tanggalAkhir ?? "").localeCompare(String(a.tanggalAkhir ?? "")));
  }, [incomeRows]);

  // Kelompok mana yang sedang dibuka rinciannya. Set, bukan satu nilai, supaya
  // beberapa kelompok bisa terbuka bersamaan saat admin membandingkan.
  const [rincianTerbuka, setRincianTerbuka] = useState(() => new Set());

  function toggleRincian(kunci) {
    setRincianTerbuka((sebelum) => {
      const berikut = new Set(sebelum);
      if (berikut.has(kunci)) berikut.delete(kunci);
      else berikut.add(kunci);
      return berikut;
    });
  }

  function refetchAll() {
    refetchIncome();
    refetchSummary();
  }

  // window.confirm() diganti ConfirmDialog supaya konfirmasi penghapusan di
  // seluruh aplikasi berperilaku dan tampil sama — lihat catatan di
  // ui/ConfirmDialog.jsx.
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [deletingIncome, setDeletingIncome] = useState(false);

  async function handleDeleteIncome() {
    if (!incomeToDelete) return;
    setDeletingIncome(true);
    try {
      await carbonFundApi.deleteIncome(incomeToDelete.id);
      toast.success(t("toast_income_deleted"));
      setIncomeToDelete(null);
      refetchAll();
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setDeletingIncome(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter bulan & tahun */}
      <Card padded={false} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
          <Filter size={15} className="text-brand" />
          <span>{t("filter_carbon_fund")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            options={[{ value: "", label: t("all_months") }, ...monthOptions.map((m) => ({ value: m.value, label: m.label }))]}
            ariaLabel={t("all_months")}
            size="sm"
            icon={Calendar}
            className="w-40"
          />

          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            options={[{ value: "", label: t("all_years") }, ...yearOptions.map((y) => ({ value: y, label: y }))]}
            ariaLabel={t("all_years")}
            size="sm"
            className="w-32"
          />
        </div>
      </Card>

      <ApiState loading={loading} error={error} skeleton={<Skeleton className="h-48 rounded-2xl" />}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Dana masuk */}
          <Card className="lg:col-span-3">
            <CardHeader
              icon={ArrowDownToLine}
              title={t("income_fund_records")}
              actions={
                <>
                  <span className="text-xs font-bold text-warn tabular">{formatRupiah(totalFund)}</span>
                  <IconButton icon={Plus} label={t("add_income")} variant="secondary"
                    onClick={() => setIncomeForm({ mode: "create" })} />
                </>
              }
            />
            {(incomeRows ?? []).length === 0 ? (
              <EmptyState icon={ArrowDownToLine} title={t("no_income_records")} compact />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
                      <th scope="col" className="py-2 px-2 font-semibold">{t("date")}</th>
                      <th scope="col" className="py-2 px-2 font-semibold">{t("source")}</th>
                      <th scope="col" className="py-2 px-2 font-semibold text-right">{t("qty")}</th>
                      <th scope="col" className="py-2 px-2 font-semibold text-right">{t("total")}</th>
                      <th scope="col" className="py-2 px-2 font-semibold text-right">{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeGroups.map((g) => {
                      const banyak = g.entri.length > 1;
                      const terbuka = rincianTerbuka.has(g.kunci);
                      const satu = g.entri[0];
                      return (
                        <Fragment key={g.kunci}>
                          <tr className="border-b border-line/60 last:border-0">
                            <td className="py-2 px-2 text-xs text-ink-faint align-top">
                              {/* Satu tanggal kalau semuanya sehari; rentang
                                  kalau tidak — supaya tetap jelas periode mana
                                  yang sedang dijumlahkan. */}
                              {banyak && g.tanggalAwal !== g.tanggalAkhir ? (
                                <>
                                  {formatDate(g.tanggalAwal)}
                                  <span className="mx-1 text-ink-faint/60">–</span>
                                  {formatDate(g.tanggalAkhir)}
                                </>
                              ) : (
                                formatDate(g.tanggalAkhir ?? satu.date)
                              )}
                            </td>
                            <td className="py-2 px-2 text-ink font-medium align-top">{g.source}</td>
                            <td className="py-2 px-2 text-right tabular text-ink-muted align-top">{g.qty}</td>
                            <td className="py-2 px-2 text-right tabular font-medium text-ink align-top">
                              {formatRupiah(g.total)}
                            </td>
                            <td className="py-2 px-2 text-right align-top">
                              {banyak ? (
                                <button
                                  type="button"
                                  onClick={() => toggleRincian(g.kunci)}
                                  aria-expanded={terbuka}
                                  title={terbuka ? t("income_hide_entries") : t("income_show_entries")}
                                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                                >
                                  <ChevronDown
                                    size={12}
                                    className={`shrink-0 transition-transform duration-200 ${terbuka ? "rotate-180" : ""}`}
                                  />
                                  {g.entri.length} {t("income_entries")}
                                </button>
                              ) : satu.tree_adoption_id ? (
                                <span
                                  title={t("income_locked_note")}
                                  className="inline-flex items-center gap-1 text-[10px] text-ink-faint"
                                >
                                  <FileCheck size={11} className="shrink-0" />
                                  {t("linked_to_certificate")}
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <IconButton icon={Pencil} label={t("edit_income")} size="sm" variant="secondary"
                                    onClick={() => setIncomeForm({ mode: "edit", income: satu })} />
                                  <IconButton icon={Trash2} label={t("delete_income")} size="sm" variant="secondary"
                                    onClick={() => setIncomeToDelete(satu)} />
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Rincian per tanggal. Baris manual tetap bisa diubah
                              dan dihapus dari sini — itu sebabnya kelompoknya
                              dibuat bisa dibuka, bukan sekadar dijumlah lalu
                              aslinya disembunyikan. */}
                          {banyak && terbuka && g.entri.map((row) => (
                            <tr key={row.id} className="border-b border-line/60 bg-surface-sub/60 last:border-0">
                              <td className="py-1.5 pl-5 pr-2 text-xs text-ink-faint">{formatDate(row.date)}</td>
                              <td className="py-1.5 px-2 text-xs text-ink-faint">
                                {row.tree_adoption_id ? t("linked_to_certificate") : "—"}
                              </td>
                              <td className="py-1.5 px-2 text-right tabular text-xs text-ink-muted">{row.qty}</td>
                              <td className="py-1.5 px-2 text-right tabular text-xs text-ink-muted">
                                {formatRupiah(row.total_amount ?? row.totalAmount)}
                              </td>
                              <td className="py-1.5 px-2 text-right">
                                {row.tree_adoption_id ? (
                                  <FileCheck size={11} className="ml-auto shrink-0 text-ink-faint" aria-label={t("income_locked_note")} />
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <IconButton icon={Pencil} label={t("edit_income")} size="sm" variant="secondary"
                                      onClick={() => setIncomeForm({ mode: "edit", income: row })} />
                                    <IconButton icon={Trash2} label={t("delete_income")} size="sm" variant="secondary"
                                      onClick={() => setIncomeToDelete(row)} />
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Distribusi */}
          <Card className="lg:col-span-2">
            {/* Pertanyaan pertama seorang pengurus bukan "dana ini dibagi ke
                mana" melainkan "dana ini DATANG dari mana" — paket mana yang
                benar-benar menghasilkan. Jadi asal dana naik jadi bagian utama
                kartu ini, dan pembagiannya turun jadi rincian di bawahnya.
                Keduanya tetap ada; yang berubah urutan kepentingannya. */}
            <CardHeader icon={ArrowDownToLine} title={t("income_by_package")} />
            {byPackage.length === 0 ? (
              <EmptyState icon={ArrowDownToLine} title={t("no_income_records")} compact />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      {...ANIMASI_SERI}
                      data={byPackage}
                      dataKey="total"
                      nameKey="package"
                      cx="50%" cy="50%"
                      outerRadius={65}
                      innerRadius={35}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    >
                      {byPackage.map((_, i) => (
                        <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatRupiah(v)}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: "8px",
                        color: "var(--ink)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 space-y-2">
                  {byPackage.map((x, i) => (
                    <div key={x.package} className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: CHART_SERIES[i % CHART_SERIES.length] }}
                        />
                        <span className="text-xs text-ink-muted">{x.package}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-xs font-semibold tabular text-ink">
                          {formatRupiah(x.total)}
                        </span>
                        {/* Jumlah transaksi ikut ditulis: Rp 60.000 dari tiga
                            sertifikat kecil berbeda artinya dengan Rp 60.000
                            dari satu sertifikat besar. */}
                        <span className="block text-[10px] tabular text-ink-faint">
                          {x.count}&times; &middot; {totalPaket > 0 ? Math.round((x.total / totalPaket) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pembagian dana. Rupiahnya sekarang dihitung dari dana masuk
                    yang sesungguhnya — sebelumnya diambil apa adanya dari kolom
                    `amount` tabel fund_distribution, yang berisi angka contoh
                    seeder (Rp 15.000.000) dan tidak pernah ikut berubah saat
                    filter bulan/tahun diganti. */}
                {distribution.length > 0 && (
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      {t("fund_distribution")}
                    </p>
                    <div className="space-y-1.5">
                      {distribution.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDrillComponent(d)}
                          className="-mx-2 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-hover"
                        >
                          <span className="truncate text-xs text-ink-muted">{d.component}</span>
                          <span className="shrink-0 text-xs tabular text-ink-faint">
                            {d.percentage}% &middot;{" "}
                            <span className="font-semibold text-ink">{formatRupiah(d.amount)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </ApiState>

      {drillComponent && (
        <DrilldownModal
          title={drillComponent.component}
          subtitle={`${t("drilldown_component")} · ${drillComponent.percentage}% · ${formatRupiah(drillComponent.amount ?? 0)}`}
          icon={Wallet}
          onClose={() => setDrillComponent(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-sub rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1">{t("total")}</p>
                <p className="text-xl font-bold text-ink tabular">{formatRupiah(drillComponent.amount ?? 0)}</p>
              </div>
              <div className="bg-surface-sub rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1">{t("fund_distribution")}</p>
                <p className="text-xl font-bold text-ink tabular">{drillComponent.percentage}%</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">
                {t("income_fund_records")}
              </p>
              {(incomeRows ?? []).length === 0 ? (
                <EmptyState icon={ArrowDownToLine} title={t("no_income_records")} compact />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
                        <th scope="col" className="py-2 px-2 font-semibold">{t("date")}</th>
                        <th scope="col" className="py-2 px-2 font-semibold">{t("source")}</th>
                        <th scope="col" className="py-2 px-2 font-semibold text-right">{t("total")}</th>
                        <th scope="col" className="py-2 px-2 font-semibold text-right">{drillComponent.percentage}%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(incomeRows ?? []).map((row) => {
                        const total = Number(row.total_amount ?? row.totalAmount ?? 0);
                        const share = total * (Number(drillComponent.percentage) / 100);
                        return (
                          <tr key={row.id} className="border-b border-line/60 last:border-0">
                            <td className="py-2 px-2 text-xs text-ink-faint">{formatDate(row.date)}</td>
                            <td className="py-2 px-2 text-ink font-medium">{row.source}</td>
                            <td className="py-2 px-2 text-right tabular text-ink-muted">{formatRupiah(total)}</td>
                            <td className="py-2 px-2 text-right"><Badge tone="warn">{formatRupiah(share)}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-ink-faint mt-3">
                Kolom terakhir adalah porsi tiap pemasukan yang jatuh ke komponen ini,
                dihitung dari persentase distribusi yang berlaku.
              </p>
            </div>
          </div>
        </DrilldownModal>
      )}

      {incomeForm && (
        <IncomeFormModal
          income={incomeForm.mode === "edit" ? incomeForm.income : null}
          onClose={() => setIncomeForm(null)}
          onSuccess={() => { setIncomeForm(null); refetchAll(); }}
        />
      )}

      {incomeToDelete && (
        <ConfirmDialog
          title={t("delete_income")}
          message={`${incomeToDelete.source} — ${formatRupiah(incomeToDelete.total_amount ?? incomeToDelete.totalAmount ?? 0)}, ${formatDate(incomeToDelete.date)}.`}
          consequences={["Total Carbon Fund dan porsi distribusinya ikut berkurang."]}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          loading={deletingIncome}
          onConfirm={handleDeleteIncome}
          onClose={() => setIncomeToDelete(null)}
        />
      )}
    </div>
  );
}

// memo: Ringkasan merender ulang seluruh isinya setiap kali salah satu
// datanya tiba (terukur: 6 kali per kunjungan). Komponen ini tidak memakai
// props yang berubah pada saat itu, jadi render ulang tersebut sia-sia.
export default memo(CarbonFundSection);
