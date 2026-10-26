// src/components/ComputeSalaryCard.jsx — admin menghitung gaji karbon.
//
// KENAPA KOMPONEN INI ADA. Tabel `carbon_salaries` dulunya hanya berisi data
// seeder dan tidak ada satu baris kode pun yang menghitungnya: tujuh baris gaji
// tercatat untuk petani yang hampir tidak punya pohon, sementara tiga petani
// pemilik seluruh 179 pohon survei tidak punya baris gaji sama sekali.
// Halaman Gaji Karbon menampilkan angka fiksi, dan tidak ada tombol di mana pun
// untuk memperbaikinya.
//
// RUMUSNYA (dipulihkan dari angka seeder lalu dicocokkan ulang):
//   proporsi   = CO2 petani / CO2 seluruh petani
//   gaji pokok = proporsi x dana yang dialokasikan untuk gaji
//   gaji akhir = gaji pokok x (1 + insentif sosial + ekologis + partisipasi)
//
// Ketiga insentif TIDAK dihitung sistem — itu penilaian terhadap orangnya
// (kehadiran, keterlibatan menjaga lahan), bukan data pohon. Bawaannya 0 supaya
// angka yang muncul tanpa penilaian apa pun adalah gaji pokok murni, bukan
// tebakan. Admin mengisinya di sini kalau koperasi sudah memutuskan.

import { useState } from "react";
import { Calculator, Loader2, AlertTriangle } from "lucide-react";
import { salaryApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { formatNumber, formatRupiah } from "../lib/format";
import { Card, CardHeader, Button, Select } from "./ui";

// Periode berjalan dan tiga sebelumnya. Lebih dari itu tidak berguna: gaji
// dihitung maju, bukan mundur bertahun-tahun.
function periodeTersedia() {
  const kini = new Date();
  const out = [];
  let tahun = kini.getFullYear();
  let kuartal = Math.floor(kini.getMonth() / 3) + 1;

  for (let i = 0; i < 4; i += 1) {
    out.push(`${tahun}-Q${kuartal}`);
    kuartal -= 1;
    if (kuartal === 0) { kuartal = 4; tahun -= 1; }
  }
  return out;
}

export default function ComputeSalaryCard() {
  const { t } = useLanguage();
  const toast = useToast();
  const pilihan = periodeTersedia();

  const [periode, setPeriode] = useState(pilihan[0]);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [galat, setGalat] = useState("");

  async function hitung() {
    setGalat("");
    setSibuk(true);
    try {
      const res = await salaryApi.compute(periode);
      setHasil(res);
      toast.success(res?.message ?? t("saved"));
    } catch (err) {
      setGalat(err?.message ?? "Perhitungan gagal.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <Card>
      <CardHeader icon={Calculator} title={t("compute_salary")} />

      <div className="px-5 pb-5 space-y-4">
        <p className="text-xs leading-relaxed text-ink-muted">{t("salary_computed_from")}</p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[9rem] flex-1">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wide text-ink-faint">
              {t("salary_period")}
            </label>
            <Select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              options={pilihan.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <Button type="button" onClick={hitung} disabled={sibuk}>
            {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
            {t("compute_salary")}
          </Button>
        </div>

        {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}

        {hasil && (
          <div className="space-y-3 border-t border-line pt-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-faint">CO₂ total</dt>
                <dd className="tabular-nums text-ink">{formatNumber(hasil.total_co2, 0)} kg</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-faint">
                  Dana gaji ({hasil.persen}%)
                </dt>
                <dd className="tabular-nums font-bold text-warn">{formatRupiah(hasil.dana_gaji)}</dd>
              </div>
            </dl>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-ink-faint">
                    <th scope="col" className="py-2 pr-3 font-semibold">Petani</th>
                    <th scope="col" className="py-2 px-3 font-semibold text-right">{t("salary_proportion")}</th>
                    <th scope="col" className="py-2 pl-3 font-semibold text-right">{t("salary_final")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(hasil.salaries ?? []).map((s) => (
                    <tr key={s.farmer_id} className="border-b border-line/60 last:border-0">
                      <td className="py-2 pr-3 font-mono-id text-ink">{s.farmer_id}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-ink-muted">
                        {formatNumber(s.co2_proportion_pct, 2)}%
                      </td>
                      <td className="py-2 pl-3 text-right tabular-nums font-bold text-warn">
                        {formatRupiah(s.final_salary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Peringatan konsentrasi. Bukan hiasan: 13 dari 180 pohon
                menghasilkan 88% total CO2, semuanya di Lokasi 3 dengan DBH
                rata-rata 174 cm sementara dua lokasi lain 28 cm. Selama itu
                belum diverifikasi ke berkas survei asli, satu petani bisa
                menerima hampir seluruh dana karena data yang belum dipastikan. */}
            {(hasil.salaries ?? []).some((s) => Number(s.co2_proportion_pct) > 60) && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-warn-soft px-3.5 py-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                <p className="text-xs leading-relaxed text-ink">
                  Satu petani menerima lebih dari 60% dana. Itu mengikuti sebaran CO₂ yang
                  tercatat — periksa dulu data DBH-nya sebelum gaji ini dibayarkan.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
