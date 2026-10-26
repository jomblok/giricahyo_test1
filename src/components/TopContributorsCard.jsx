import { Trophy } from "lucide-react";
import { formatNumber } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, EmptyState } from "./ui";

export default function TopContributorsCard({ topFarmers = [] }) {
  const { t } = useLanguage();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader icon={Trophy} title={t("top_co2_contributors")} />
      <div className="space-y-3 flex-1">
        {topFarmers.map((f, i) => (
          // GET /dashboard/summary mengembalikan `farmer_id`, bukan `id` —
          // sebelumnya key-nya undefined untuk SEMUA baris, jadi React tidak
          // bisa membedakan satu petani dari yang lain saat daftarnya berubah
          // urutan (mis. setelah ganti periode) dan bisa memasangkan ulang
          // baris ke data yang salah.
          <div key={f.farmer_id} className="flex items-center gap-3">
            {/* Peringkat 1 ditandai emas, sisanya netral — supaya peringkat
                terbaca sekilas tanpa harus membaca angkanya. */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 tabular ${
                i === 0 ? "bg-warn-soft text-warn" : "bg-surface-sub text-ink-faint"
              }`}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink truncate">{f.name}</p>
              <p className="text-[10px] text-ink-faint truncate">{f.group_coop ?? f.groupCoop}</p>
            </div>
            <p className="text-[13px] font-bold text-ink tabular shrink-0">
              {formatNumber(f.total_co2_kg ?? f.totalCo2Kg ?? 0, 1)}
              <span className="text-[10px] font-medium text-ink-faint ml-0.5">kg</span>
            </p>
          </div>
        ))}
        {topFarmers.length === 0 && (
          <EmptyState icon={Trophy} title={t("no_data_yet")} compact />
        )}
      </div>
    </Card>
  );
}
