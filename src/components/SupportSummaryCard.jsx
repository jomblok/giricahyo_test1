import { FileCheck, Building2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader } from "./ui";

function MiniStat({ icon: Icon, value, label, accent }) {
  return (
    <div className="bg-surface-sub rounded-xl p-4 text-center transition-colors">
      <Icon size={18} className={`${accent} mx-auto mb-1.5`} />
      <p className="text-2xl font-bold text-ink tabular">{value}</p>
      <p className="text-[11px] text-ink-faint">{label}</p>
    </div>
  );
}

export default function SupportSummaryCard({ totalCertificates = 0, totalBuyers = 0 }) {
  const { t } = useLanguage();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader icon={FileCheck} title={t("external_support")} />
      <div className="grid grid-cols-2 gap-3">
        <MiniStat
          icon={FileCheck}
          value={totalCertificates}
          label={t("active_certificates_summary")}
          accent="text-warn"
        />
        <MiniStat
          icon={Building2}
          value={totalBuyers}
          label={t("buyer_donor")}
          accent="text-brand"
        />
      </div>
      <div className="flex-1" />
      <p className="text-[11px] text-ink-faint mt-4">
        {t("manage_certificates_text")}{" "}
        <span className="font-medium text-ink-muted">{t("manage_certificates_menu")}</span>{" "}
        {t("above_text")}
      </p>
    </Card>
  );
}
