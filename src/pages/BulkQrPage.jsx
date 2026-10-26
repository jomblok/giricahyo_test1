// src/pages/BulkQrPage.jsx — cetak label QR banyak pohon sekaligus.
//
// MASALAH YANG DIPECAHKAN. Satu-satunya jalan ke QR sebelum ini adalah
// GenerateQrPage, dan halaman itu bukan pencetak label: ia wizard PENDAFTARAN
// pohon baru yang kebetulan menampilkan QR di langkah terakhir. Untuk
// mencetak label pohon yang sudah terdata, pengurus harus membuka kartu tiap
// pohon satu per satu — 179 kali buka, 179 kali print, 179 lembar.
//
// Halaman ini memilih dari pohon yang SUDAH ada, lalu menatanya sebagai
// lembar label. Nilai QR-nya dibentuk persis seperti di GenerateQrPage
// (`${origin}/pohon/${id}`) supaya label lama dan baru memindai ke halaman
// yang sama; kalau rumusnya berbeda, label cetakan lama diam-diam jadi mati.

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, QrCode, Search, CheckSquare, Square, AlertTriangle } from "lucide-react";
import AppShell from "../components/AppShell";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi, farmerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, Button, Select, EmptyState, SkeletonTable } from "../components/ui";
import { tautanPohon, alamatSementara, asalPublik } from "../lib/tautanPublik";

export default function BulkQrPage() {
  const { t } = useLanguage();
  const { data: trees, loading, error } = useApi(() => treeApi.list());
  const { data: farmers } = useApi(() => farmerApi.list());

  const [petani, setPetani] = useState("");
  const [cari, setCari] = useState("");
  const [terpilih, setTerpilih] = useState(() => new Set());

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return (trees ?? []).filter((p) => {
      if (petani && p.farmer_id !== petani) return false;
      if (!q) return true;
      return `${p.id} ${p.species ?? ""}`.toLowerCase().includes(q);
    });
  }, [trees, petani, cari]);

  // Memilih "semua" hanya berlaku pada yang TERSARING, bukan seluruh
  // inventaris — kalau tidak, menyaring lalu menekan "pilih semua" akan
  // diam-diam memilih pohon yang tidak terlihat di layar.
  const semuaTerpilih = tersaring.length > 0 && tersaring.every((p) => terpilih.has(p.id));

  function alihkan(id) {
    setTerpilih((s) => {
      const b = new Set(s);
      if (b.has(id)) b.delete(id);
      else b.add(id);
      return b;
    });
  }

  function alihkanSemua() {
    setTerpilih((s) => {
      const b = new Set(s);
      if (semuaTerpilih) tersaring.forEach((p) => b.delete(p.id));
      else tersaring.forEach((p) => b.add(p.id));
      return b;
    });
  }

  const untukDicetak = useMemo(
    () => (trees ?? []).filter((p) => terpilih.has(p.id)),
    [trees, terpilih]
  );

  const namaPetani = useMemo(() => {
    const m = new Map();
    (farmers ?? []).forEach((f) => m.set(f.id, f.name));
    return m;
  }, [farmers]);

  // showPeriod={false}: hanya TreeTable dan TrendCharts yang membaca
  // PeriodContext, dan halaman ini tidak memakai keduanya. Sebelumnya filter
  // periodenya tetap tampil di topbar tapi tidak mengubah apa pun — kontrol
  // mati yang tampak seperti saringan. Kalau halaman ini memang perlu
  // disaring per periode, yang dibutuhkan adalah menyambungkannya, bukan
  // menampilkan kembali tombolnya.
  return (
    <AppShell title={t("nav_bulk_qr")} wide showPeriod={false}>
      <div className="space-y-5 print:hidden">
            {alamatSementara() && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn-soft px-4 py-3 print:hidden">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0 text-xs leading-relaxed text-ink">
                  <p className="font-semibold">Alamat ini sementara — jangan dipakai untuk label yang dipaku ke pohon.</p>
                  <p className="mt-0.5 text-ink-muted">
                    QR akan menunjuk ke <span className="font-mono-id break-all">{asalPublik()}</span>, yang hanya
                    berlaku selama sesi pengembangan ini. Untuk label permanen, isi dulu{" "}
                    <span className="font-mono-id">VITE_PUBLIC_BASE_URL</span> dengan domain produksi.
                  </p>
                </div>
              </div>
            )}
        <Card>
          {/* level=2: halaman ini tidak punya SectionHeader, jadi kartunya
                berada langsung di bawah judul halaman (h1). */}
              <CardHeader
            level={2}
            icon={QrCode}
            title={t("bulk_qr_pick")}
            count={`${terpilih.size} / ${tersaring.length}`}
            actions={
              <Button type="button" onClick={() => window.print()} disabled={terpilih.size === 0}>
                <Printer size={15} />
                {t("print_labels")} ({terpilih.size})
              </Button>
            }
          />

          <p className="mb-4 max-w-2xl text-xs text-ink-muted">{t("bulk_qr_desc")}</p>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[13rem] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder={t("search_tree_placeholder")}
                className="w-full rounded-xl border border-line bg-surface-sub py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
              />
            </div>

            <div className="min-w-[13rem]">
              <Select
                value={petani}
                // Select meniru <select>: argumennya objek ber-e.target.value,
                // bukan nilainya langsung.
                onChange={(e) => setPetani(e.target.value)}
                options={[
                  { value: "", label: t("all_farmers") },
                  ...(farmers ?? []).map((f) => ({ value: f.id, label: f.name, hint: f.group_coop })),
                ]}
              />
            </div>

            <button
              type="button"
              onClick={alihkanSemua}
              disabled={tersaring.length === 0}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface-sub px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              {semuaTerpilih ? <CheckSquare size={14} /> : <Square size={14} />}
              {semuaTerpilih ? t("clear_selection") : t("select_all_filtered")}
            </button>
          </div>

          <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={6} cols={3} />}>
            {tersaring.length === 0 ? (
              <EmptyState icon={QrCode} title={t("no_trees_match")} description={t("adjust_filters")} />
            ) : (
              <div className="grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                {tersaring.map((p) => {
                  const dipilih = terpilih.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => alihkan(p.id)}
                      aria-pressed={dipilih}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors ${
                        dipilih ? "border-brand bg-brand-soft" : "border-line bg-surface-sub hover:border-line-strong"
                      }`}
                    >
                      {dipilih ? (
                        <CheckSquare size={15} className="shrink-0 text-brand" />
                      ) : (
                        <Square size={15} className="shrink-0 text-ink-faint" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-mono-id text-[11px] text-ink">{p.id}</span>
                        {/* Membungkus dua baris, tidak dipotong. Daftar ini
                            memilih pohon yang labelnya akan DICETAK, dan label
                            cetak sulit ditarik kembali. "Johar (belum
                            teridentifikasi pasti)" yang terpotong jadi "Johar
                            (belum ter…" menyembunyikan justru peringatan yang
                            seharusnya menahan operator sebelum mencetak. */}
                        <span className="block line-clamp-2 leading-tight text-[10px] text-ink-muted">{p.species}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ApiState>
        </Card>
      </div>

      {/* Lembar cetak. Hanya terlihat saat dicetak — aturan .print-area di
          index.css menyembunyikan sisa halaman — jadi tidak perlu dialog
          pratinjau tersendiri. */}
      <div className="print-area print-area--sheet hidden print:block">
        {untukDicetak.map((p) => (
          <div key={p.id} className="gjr-qr-label">
            <QRCodeSVG
              value={tautanPohon(p.id)}
              size={104}
              fgColor="#15392e"
              bgColor="#ffffff"
              level="M"
              marginSize={1}
            />
            <p className="gjr-qr-label__id">{p.id}</p>
            <p className="gjr-qr-label__sub">
              {p.species}
              {namaPetani.get(p.farmer_id) ? ` · ${namaPetani.get(p.farmer_id)}` : ""}
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
