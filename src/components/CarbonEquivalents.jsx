// src/components/CarbonEquivalents.jsx
//
// "Setara dengan X km berkendara / Y bulan listrik / Z bulan motor" — dipakai
// MyImpactPage (buyer) dan BuyerDashboardPage. Sebelumnya dua implementasi
// berbeda hidup berdampingan: MyImpactPage pakai token + lucide-react,
// BuyerDashboardPage pakai warna hardcode + emoji (✈️🏍️💡). Sekarang satu
// sumber kebenaran untuk kartu ini.

import { Wind, Car, Zap, Bike } from "lucide-react";
import { Card, CardHeader } from "./ui";
import { formatNumber } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";

// Faktor konversi kasar, dipakai hanya untuk memberi rasa skala.
const EQUIVALENTS = [
  { icon: Car,  key: "km_driving", divide: 0.192, decimals: 0 },   // ~192 g CO2 per km mobil
  { icon: Zap,  key: "eq_electric", divide: 50,   decimals: 1, unitKey: "eq_electric_unit" },
  { icon: Bike, key: "eq_motor",    divide: 30,   decimals: 1, unitKey: "eq_motor_unit" },
];

export function CarbonEquivalents({ totalCo2, className = "" }) {
  const { t } = useLanguage();
  return (
    <Card className={className}>
      <CardHeader icon={Wind} title={t("equivalent_to")} />
      {/* auto-fit + minmax, BUKAN sm:grid-cols-3.

          `sm:` memutuskan jumlah kolom dari lebar VIEWPORT, padahal komponen
          ini dipakai di tiga tempat dengan lebar WADAH yang berbeda-beda. Di
          dasbor buyer ia duduk dalam kolom selebar 235px sementara viewport
          1016px, jadi aturan `sm:` tetap memaksa tiga kolom — setiap sel jadi
          70px, angka beserta satuannya tidak muat, dan seluruh halaman ikut
          bisa digulir mendatar (terukur meluber 17px).

          minmax(9rem,1fr) membuat trek punya lebar minimum nyata, dan auto-fit
          menurunkan jumlah kolomnya sendiri saat ruangnya tidak cukup —
          mengikuti wadah, bukan layar. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
        {EQUIVALENTS.map(({ icon: Icon, key, divide, decimals, unitKey }) => (
          // min-w-0 pada SEL GRID, bukan cuma pada anak di dalamnya.
          //
          // Trek `1fr` punya min-width: auto secara bawaan, jadi sel menolak
          // menyusut di bawah lebar isinya. Angka besar + satuan ("1.234,5"
          // + "bulan") membuat sel melebar melampaui tiga kolomnya, dan
          // seluruh halaman ikut bisa digulir mendatar — terukur meluber
          // 17px pada lebar 1016px.
          <div key={key} className="min-w-0 bg-surface-sub rounded-xl p-4 flex items-start gap-3">
            <div className="rounded-lg bg-brand-soft text-brand p-2 shrink-0">
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-ink tabular leading-tight">
                {formatNumber(totalCo2 / divide, decimals)}
                {unitKey && <span className="text-xs font-medium text-ink-muted ml-1">{t(unitKey)}</span>}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">{t(key)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ink-faint mt-4">{t("equivalents_disclaimer")}</p>
    </Card>
  );
}

export default CarbonEquivalents;
