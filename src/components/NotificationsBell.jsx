// src/components/NotificationsBell.jsx

import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, Clock, Activity, Check, Wallet, FileClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";
import { useNotifications } from "../lib/useNotifications";
import { Badge, EmptyState } from "./ui";

const ICONS = { critical: AlertTriangle, stale: Clock, attention: Activity, income: Wallet, certExpiring: FileClock };

// Grup turunan memakai kunci kamus (notif_critical, ...); baris dari server
// membawa judulnya sendiri sebagai teks jadi. Dibedakan di sini supaya
// keduanya bisa dirender komponen yang sama.

export default function NotificationsBell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { groups, unreadCount, isRead, markRead, markAllRead } = useNotifications();

  // Tutup saat klik di luar atau tekan Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${t("notifications")}${unreadCount ? ` — ${unreadCount} ${t("notif_unread")}` : ""}`}
        aria-expanded={open}
        title={t("notifications")}
        className="relative p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-bad text-[9px] font-bold text-surface flex items-center justify-center tabular">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-surface border border-line rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="text-sm font-bold text-ink">{t("notifications")}</p>
            {groups.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-brand hover:underline inline-flex items-center gap-1"
              >
                <Check size={12} />
                {t("notif_mark_read")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {groups.length === 0 ? (
              <EmptyState icon={Bell} title={t("notif_empty")} compact />
            ) : (
              groups.map((g) => {
                const Icon = ICONS[g.id] ?? Bell;
                const read = isRead(g);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { markRead(g); setOpen(false); navigate(g.to ?? "/pohon"); }}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-line last:border-0 hover:bg-surface-hover transition-colors ${read ? "opacity-55" : ""}`}
                  >
                    <div className={`rounded-lg p-1.5 shrink-0 ${
                      g.tone === "bad" ? "bg-bad-soft text-bad"
                      : g.tone === "good" ? "bg-good-soft text-good"
                      : "bg-warn-soft text-warn"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink flex items-center gap-2">
                        {g.title ?? t(`notif_${g.id}`)}
                        <Badge tone={g.tone}>{g.count}</Badge>
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">{g.desc ?? t(`notif_${g.id}_desc`)}</p>
                      <p className="text-[10px] text-ink-faint mt-1 font-mono-id truncate">
                        {g.preview ?? (
                          g.trees.slice(0, 3).map((tr) => tr.id).join(" · ") +
                          (g.trees.length > 3 ? ` +${g.trees.length - 3}` : "")
                        )}
                      </p>
                    </div>
                    {!read && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
