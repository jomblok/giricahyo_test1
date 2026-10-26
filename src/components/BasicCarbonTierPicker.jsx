// src/components/BasicCarbonTierPicker.jsx
//
// Kartu pemilih 3 tingkat "Basic Carbon Contribution" (Package 1, PDF
// Penguatan Manajemen Bisnis Karbon). Dipakai di NewCertificateModal — saat
// tier dipilih, package_name yang dikirim ke server sudah ter-encode
// (lib/basicCarbon.js) berikut harga & tingkatannya.

import { Check } from "lucide-react";
import { BASIC_CARBON_TIERS, formatRupiahShort, formatDuration } from "../lib/basicCarbon";
import { useLanguage } from "../lib/LanguageContext";

export default function BasicCarbonTierPicker({ value, onChange }) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] leading-relaxed text-brand-ink bg-brand-soft rounded-lg p-2.5">
        {t("basic_carbon_general_note")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {BASIC_CARBON_TIERS.map((tier) => {
          const selected = value === tier.key;
          return (
            // flex flex-col: <button> bawaannya memusatkan isi secara vertikal
            // (align-items: center dari browser). Begitu grid meregangkan semua
            // kartu ke tinggi yang sama, kartu dengan lebih sedikit manfaat
            // isinya melorot ke tengah sehingga nama dan harganya tidak sebaris
            // dengan kartu sebelahnya. Dengan flex-col, isi menumpuk dari atas.
            <button
              key={tier.key}
              type="button"
              onClick={() => onChange(tier.key)}
              aria-pressed={selected}
              className={`relative flex flex-col text-left rounded-2xl border-2 p-3.5 transition-colors ${
                selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand text-surface flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              {/* min-h dua baris: nama tingkat yang panjang ("Basic Standard")
                  membungkus jadi dua baris sementara tetangganya cukup satu,
                  sehingga harga dan keterangan di bawahnya turun tidak sejajar
                  antar kartu. Dengan ruang nama dipatok setinggi dua baris,
                  semua yang di bawahnya mulai dari garis yang sama.

                  Sempat dicoba dimatikan di layar lebar (lg:min-h-0) dengan
                  alasan modal Sertifikat kini 768px sehingga namanya muat satu
                  baris. Diukur di peramban, ternyata tidak: pada kartu selebar
                  233px "Carbon Village Experience" tetap patah dua baris, dan
                  harga ketiga kartu langsung tidak sejajar lagi (427px lawan
                  440px). Cadangan ini tetap diperlukan.

                  Angkanya 1,75rem, bukan 1,6rem: 1,6rem dulu dihitung untuk
                  nama berukuran 10px (2 x 12,5px = 25px). Setelah ukurannya
                  dinaikkan ke 11px, dua baris jadi 27,5px — melewati cadangan
                  lama, dan kartu yang namanya patah tetap menggeser harganya
                  turun 2px. Kalau ukuran nama diubah lagi, hitung ulang:
                  2 x ukuran x 1,25 (leading-tight). */}
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-brand-ink pr-6 leading-tight min-h-[1.75rem]">{tier.name}</p>
              <p className="text-lg font-bold text-ink tabular mt-0.5">{formatRupiahShort(tier.price)}</p>
              <p className="text-[11px] text-ink-faint mt-1">
                {t("basic_carbon_validity")} · {formatDuration(tier.months, lang)}
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {tier.benefits.map((bKey) => (
                  <li key={bKey} className="text-[11.5px] leading-snug text-ink flex items-start gap-1.5">
                    <Check size={11} className="text-brand shrink-0 mt-[3px]" />
                    <span>{t(bKey)}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
