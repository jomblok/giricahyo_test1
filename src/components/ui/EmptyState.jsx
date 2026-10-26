// src/components/ui/EmptyState.jsx
//
// Keadaan kosong yang menjelaskan dan menawarkan jalan keluar, bukan sekadar
// baris "Tidak ada data" di tengah tabel.

import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-14"} px-4`}
    >
      <div className="rounded-2xl bg-surface-sub border border-line p-3.5 mb-3.5">
        <Icon size={compact ? 20 : 26} className="text-ink-faint" strokeWidth={1.6} />
      </div>
      {/* Serif display di sini karena keadaan kosong adalah momen bicara ke
          pengguna, bukan menyajikan data — nada hangatnya membantu. */}
      <p className="gjr-display text-base font-bold text-ink">{title}</p>
      {description && (
        <p className="text-xs text-ink-muted mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
