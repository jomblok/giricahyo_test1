// src/components/ui/Badge.jsx
//
// Badge status. Sebelumnya peta `healthBadge` ditulis dua kali dengan hasil
// berbeda — versi di TreeTable tidak punya varian gelap, versi di
// BuyerDashboardPage punya. Badge yang sama tampil beda tergantung halaman.
// Sekarang satu sumber, dan warnanya lewat token peran jadi ikut tema sendiri.

import { HEALTH_TONE } from "./healthTone";

const TONES = {
  good:    "bg-good-soft text-good",
  warn:    "bg-warn-soft text-warn",
  bad:     "bg-bad-soft text-bad",
  brand:   "bg-brand-soft text-brand-ink",
  neutral: "bg-surface-sub text-ink-muted",
};

const SIZES = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

// `capitalize` ada supaya status satu kata dari basis data ("baik", "sedang")
// tampil rapi tanpa setiap pemanggil mengubah hurufnya sendiri. Untuk isi
// yang sudah berupa frasa — "103 hari lalu" — aturan itu justru salah:
// bahasa Indonesia tidak mengapitalkan setiap kata. Pemanggil seperti itu
// mematikannya lewat capitalize={false}; bawaannya tidak berubah, jadi
// seluruh pemakaian lama tetap sama persis.
export function Badge({ tone = "neutral", size = "sm", capitalize = true, className = "", children, ...rest }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap",
        capitalize && "capitalize",
        TONES[tone] ?? TONES.neutral,
        SIZES[size] ?? SIZES.sm,
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}



export function HealthBadge({ status, label, size = "sm" }) {
  return (
    <Badge tone={HEALTH_TONE[status] ?? "neutral"} size={size}>
      {label ?? status}
    </Badge>
  );
}

export default Badge;
