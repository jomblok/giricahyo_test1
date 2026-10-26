// src/components/CarbonChainCard.jsx — rantai hitung dari ukuran ke CO2.
//
// MASALAH YANG DIPECAHKAN. Seluruh sistem ini berdiri di atas satu angka per
// pohon: kilogram CO2. Angka itu tampil di dashboard, di sertifikat, dan di
// halaman publik yang dibagikan ke luar — tapi sampai sekarang ia tampil
// SENDIRIAN. Pengurus yang ditanya "dari mana 1.772,7 kg ini?" tidak punya
// jawaban selain "dari sistem", dan jawaban itu tidak cukup untuk siapa pun
// yang berhak menguji: penilai PKM, auditor koperasi, atau pembeli karbon.
//
// INI MURNI CELAH TAMPILAN, bukan celah data. Setiap masukan dan setiap hasil
// antara sudah tersimpan di carbon_measurements sejak lama — dbh_cm, height_m,
// density_rho, agb_kg, bgb_kg, total_biomass_kg, carbon_stock_kg — beserta
// siapa yang mencatat dan dari mana asalnya. Yang belum ada hanyalah tempat
// untuk melihatnya.
//
// ANGKANYA DIBACA, BUKAN DIHITUNG ULANG DI SINI. Itu keputusan yang penting:
// kalau komponen ini menghitung sendiri AGB dari DBH, yang ditampilkan adalah
// hitungan peramban, bukan angka yang benar-benar tersimpan dan dipakai di
// seluruh sistem. Keduanya seharusnya sama — dan kalau suatu saat berbeda,
// justru perbedaan itulah yang perlu terlihat, bukan tertutup oleh hitungan
// ulang yang selalu cocok dengan dirinya sendiri.

import { Microscope } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { formatNumber, formatDate } from "../lib/format";

/** Satu baris rantai: rumus di kiri, hasil tersimpan di kanan. */
function Langkah({ label, rumus, nilai, satuan, tebal }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className={`text-xs ${tebal ? "font-semibold text-ink" : "text-ink-muted"}`}>{label}</p>
        <p className="font-mono-id text-[10px] leading-snug text-ink-faint">{rumus}</p>
      </div>
      <p className={`shrink-0 tabular-nums text-sm ${tebal ? "font-bold text-brand" : "text-ink"}`}>
        {nilai == null ? "—" : formatNumber(Number(nilai), 2)}
        <span className="ml-1 text-[10px] font-normal text-ink-faint">{satuan}</span>
      </p>
    </div>
  );
}

export default function CarbonChainCard({ measurement }) {
  const { t } = useLanguage();
  if (!measurement) return null;

  const m = measurement;
  const rho = m.density_rho != null ? Number(m.density_rho) : null;
  const d = m.dbh_cm != null ? Number(m.dbh_cm) : null;
  const h = m.height_m != null ? Number(m.height_m) : null;

  // Tanpa ketiga masukan ini rantainya tidak bisa dibaca sebagai bukti —
  // yang tersisa hanya deretan hasil tanpa titik berangkat. Lebih baik tidak
  // menampilkan apa pun daripada menampilkan rantai yang menggantung.
  if (d == null || h == null || rho == null) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <header className="mb-3 flex items-start gap-2">
        <Microscope size={16} className="mt-0.5 shrink-0 text-brand" />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-ink">{t("carbon_chain")}</h4>
          <p className="text-[11px] leading-relaxed text-ink-muted">{t("carbon_chain_desc")}</p>
        </div>
      </header>

      <div className="rounded-xl bg-surface-sub px-3 py-2.5">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {t("measured_inputs")}
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
          <div className="min-w-0">
            <p className="tabular-nums text-sm font-bold text-ink">{formatNumber(d, 1)}<span className="ml-0.5 text-[10px] font-normal text-ink-faint">cm</span></p>
            <p className="text-[10px] text-ink-muted">DBH (D)</p>
          </div>
          <div className="min-w-0">
            <p className="tabular-nums text-sm font-bold text-ink">{formatNumber(h, 1)}<span className="ml-0.5 text-[10px] font-normal text-ink-faint">m</span></p>
            <p className="text-[10px] text-ink-muted">{t("height")} (H)</p>
          </div>
          <div className="min-w-0">
            {/* Kerapatan kayu TIDAK diukur di lapangan — ia dibaca dari katalog
                jenis. Ditandai begitu supaya tidak terbaca sebagai hasil ukur. */}
            <p className="tabular-nums text-sm font-bold text-ink">{formatNumber(rho, 2)}<span className="ml-0.5 text-[10px] font-normal text-ink-faint">g/cm³</span></p>
            <p className="text-[10px] text-ink-muted">ρ · {t("species_catalog")}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 divide-y divide-line">
        <Langkah label="Biomassa atas permukaan" rumus="AGB = 0,0673 × (ρ·D²·H)^0,976" nilai={m.agb_kg} satuan="kg" />
        <Langkah label="Biomassa bawah tanah" rumus="BGB = AGB × 0,24" nilai={m.bgb_kg} satuan="kg" />
        <Langkah label="Biomassa total" rumus="TB = AGB + BGB" nilai={m.total_biomass_kg} satuan="kg" />
        <Langkah label="Simpanan karbon" rumus="C = TB × 0,47" nilai={m.carbon_stock_kg} satuan="kg" />
        <Langkah label="Setara CO₂" rumus="CO₂ = C × 3,67" nilai={m.co2_eq_kg} satuan="kg" tebal />
      </div>

      {/* Rantai tanpa penanggung jawab masih bisa dibantah. Baris ini yang
          mengubahnya dari hitungan jadi catatan yang bisa ditelusuri. */}
      {/* Baris pencatat DILEWATI kalau namanya kosong, bukan diisi tanda pisah.
          Pengukuran hasil impor survei memang tidak punya pencatat manusia —
          menulis "Dicatat oleh —" membuatnya terbaca seperti data yang hilang,
          padahal sumbernya sudah disebut tepat di sebelahnya. */}
      <p className="mt-3 border-t border-line pt-2.5 text-[10px] leading-relaxed text-ink-faint">
        {m.recorded_by_name && (
          <>
            {t("chain_recorded")} <span className="font-semibold text-ink-muted">{m.recorded_by_name}</span>
            {" · "}
          </>
        )}
        {m.measurement_date ? formatDate(m.measurement_date) : ""}
        {m.source ? ` · ${t("source_label")}: ${t(`src_${m.source}`)}` : ""}
      </p>
    </div>
  );
}
