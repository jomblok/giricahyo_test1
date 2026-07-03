import { FileCheck, Building2 } from "lucide-react";
import { useDb } from "../lib/useDb";
import { getAdminInsights } from "../lib/joins";

export default function SupportSummaryCard() {
  const { totalCertificates, totalBuyers } = useDb(() => getAdminInsights());

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <FileCheck size={17} className="text-sage-600" />
        <h3 className="font-semibold text-forest-950 text-sm">Dukungan Eksternal</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cream-50 rounded-xl p-4 text-center">
          <FileCheck size={18} className="text-gold-600 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-forest-950 tabular">{totalCertificates}</p>
          <p className="text-[11px] text-forest-700/50">Sertifikat Aktif</p>
        </div>
        <div className="bg-cream-50 rounded-xl p-4 text-center">
          <Building2 size={18} className="text-sage-600 mx-auto mb-1.5" />
          <p className="text-2xl font-bold text-forest-950 tabular">{totalBuyers}</p>
          <p className="text-[11px] text-forest-700/50">Buyer/Donor</p>
        </div>
      </div>
      <div className="flex-1" />
      <p className="text-[11px] text-forest-700/45 mt-4">
        Kelola sertifikat dukungan baru lewat menu{" "}
        <span className="font-medium text-forest-700">Kelola Sertifikat</span> di atas.
      </p>
    </div>
  );
}
