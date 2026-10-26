// src/components/CertificateLifecycleBadge.jsx
//
// Badge "Aktif / Segera Berakhir / Berakhir" + hitung mundur untuk satu
// sertifikat Basic Carbon. Dipakai di ManageCertificatesPage, BuyerDashboard,
// dan CertificateModal supaya statusnya selalu tampil identik di mana pun.
// Tidak merender apa-apa kalau sertifikatnya bukan Basic Carbon (Tree
// Adoption/Tourism/ESG tidak punya konsep masa berlaku).

import { Clock } from "lucide-react";
import { Badge } from "./ui";
import { getCertificateLifecycle, LIFECYCLE_TONE, LIFECYCLE_LABEL_KEY, formatCountdown } from "../lib/basicCarbon";
import { useLanguage } from "../lib/LanguageContext";

export default function CertificateLifecycleBadge({ adoption, size = "sm" }) {
  const { t } = useLanguage();
  const lifecycle = getCertificateLifecycle(adoption);
  if (!lifecycle) return null;

  const { status, msRemaining } = lifecycle;

  return (
    // Badge menerapkan `capitalize` secara default (cocok untuk status
    // satu-kata seperti HealthBadge), tapi di sini isinya punya bagian
    // hitung mundur multi-kata ("23 hari lagi") yang tidak boleh ikut
    // dikapital tiap katanya. style inline dipakai (bukan class
    // "normal-case") supaya override-nya pasti menang terlepas urutan
    // pembangkitan utility Tailwind — tidak bergantung pada asumsi cascade.
    <Badge tone={LIFECYCLE_TONE[status]} size={size} style={{ textTransform: "none" }}>
      <Clock size={size === "md" ? 12 : 10} className="shrink-0" />
      {t(LIFECYCLE_LABEL_KEY[status])} · {formatCountdown(msRemaining, t)}
    </Badge>
  );
}
