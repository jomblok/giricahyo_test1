// src/components/SearchPalette.jsx
//
// Pencarian global (Ctrl / ⌘ + K). Mencari pohon, petani, buyer, dan halaman
// dari data yang sudah di-fetch — tidak butuh endpoint /search baru.

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, TreeDeciduous, Users, Building2, FileText, Award, X } from "lucide-react";
import { useApi } from "../lib/useApi.jsx";
import { treeApi, farmerApi, buyerApi, adoptionApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useAuth } from "../lib/AuthContext";
import { navFor } from "../lib/navConfig";

const GROUP_ICON = {
  pages:        FileText,
  trees:        TreeDeciduous,
  farmers:      Users,
  buyers:       Building2,
  certificates: Award,
};

export default function SearchPalette({ open, onClose }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const isAdmin = user?.role === "admin";
  // Data hanya diambil saat palet dibuka, dan hanya yang boleh dilihat role ini.
  const { data: trees }   = useApi(() => (open ? treeApi.list()   : Promise.resolve([])), [open]);
  const { data: farmers } = useApi(() => (open && isAdmin ? farmerApi.list() : Promise.resolve([])), [open, isAdmin]);
  const { data: buyers }  = useApi(() => (open && isAdmin ? buyerApi.list()  : Promise.resolve([])), [open, isAdmin]);
  const { data: adoptions } = useApi(() => (open && isAdmin ? adoptionApi.list() : Promise.resolve([])), [open, isAdmin]);

  useEffect(() => {
    if (open) {
      setQ(""); setCursor(0);
      // fokus setelah paint supaya keyboard mobile ikut terbuka
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = [];

    const pages = navFor(user?.role)
      .filter((i) => !needle || t(i.key).toLowerCase().includes(needle))
      .map((i) => ({ group: "pages", id: i.to, label: t(i.key), sub: i.to, to: i.to }));
    if (pages.length) out.push({ group: "pages", items: pages.slice(0, 5) });

    if (needle) {
      const tr = (trees ?? [])
        .filter((x) =>
          String(x.id).toLowerCase().includes(needle) ||
          String(x.species ?? "").toLowerCase().includes(needle) ||
          String(x.farmer_name ?? x.farmerName ?? "").toLowerCase().includes(needle))
        .slice(0, 6)
        .map((x) => ({
          group: "trees", id: x.id, label: x.id, mono: true,
          sub: `${x.species} · ${x.farmer_name ?? x.farmerName ?? "—"}`,
          to: `/pohon/${x.id}`,
        }));
      if (tr.length) out.push({ group: "trees", items: tr });

      const fm = (farmers ?? [])
        .filter((x) => String(x.name ?? "").toLowerCase().includes(needle) ||
                       String(x.id ?? "").toLowerCase().includes(needle))
        .slice(0, 4)
        .map((x) => ({
          group: "farmers", id: x.id, label: x.name,
          sub: x.group_coop ?? x.groupCoop ?? x.id, to: "/petani",
        }));
      if (fm.length) out.push({ group: "farmers", items: fm });

      const by = (buyers ?? [])
        .filter((x) => String(x.name ?? "").toLowerCase().includes(needle) ||
                       String(x.id ?? "").toLowerCase().includes(needle))
        .slice(0, 4)
        .map((x) => ({ group: "buyers", id: x.id, label: x.name, sub: x.id, to: "/sertifikat" }));
      if (by.length) out.push({ group: "buyers", items: by });

      // Nomor sertifikat sering jadi satu-satunya petunjuk yang dipegang orang
      // saat menanyakan sebuah dukungan.
      const cert = (adoptions ?? [])
        .filter((x) =>
          String(x.certificate_no ?? "").toLowerCase().includes(needle) ||
          String(x.buyer_name ?? "").toLowerCase().includes(needle) ||
          String(x.tree_id ?? "").toLowerCase().includes(needle))
        .slice(0, 5)
        .map((x) => ({
          group: "certificates", id: x.id ?? x.certificate_no,
          label: x.certificate_no ?? "—", mono: true,
          sub: `${x.buyer_name ?? "—"} · ${x.tree_id ?? "—"}`,
          to: "/sertifikat",
        }));
      if (cert.length) out.push({ group: "certificates", items: cert });
    }

    return out;
  }, [q, trees, farmers, buyers, adoptions, user?.role, t]);

  const flat = useMemo(() => results.flatMap((g) => g.items), [results]);

  useEffect(() => { setCursor(0); }, [q]);

  const go = (item) => { if (!item) return; onClose(); navigate(item.to); };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); go(flat[cursor]); }
  };

  // Jaga item terpilih tetap terlihat saat navigasi keyboard.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  let running = -1;

  // Diportal ke document.body: dipicu dari <header> Topbar yang punya
  // backdrop-blur, dan backdrop-filter membuat elemen itu jadi containing
  // block baru untuk descendant position:fixed — lihat komentar penuh di
  // CameraScanModal.jsx.
  return createPortal(
    <div className="gjr-overlay-in fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t("search_global")}>
      <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />

      <div className="gjr-panel-in relative w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <Search size={17} className="text-ink-faint shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            className="flex-1 bg-transparent py-3.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button type="button" onClick={onClose} aria-label={t("close")} className="p-1 text-ink-faint hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="text-center text-sm text-ink-faint py-10 px-4">
              {q.trim() ? `${t("search_no_result")} "${q.trim()}"` : t("search_hint")}
            </p>
          ) : (
            results.map((group) => {
              const Icon = GROUP_ICON[group.group] ?? FileText;
              return (
                <div key={group.group} className="px-2 pb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint px-3 pt-2 pb-1">
                    {t(`search_group_${group.group}`)}
                  </p>
                  {group.items.map((item) => {
                    running += 1;
                    const active = running === cursor;
                    const myIndex = running;
                    return (
                      <button
                        key={`${group.group}-${item.id}`}
                        type="button"
                        data-active={active}
                        onMouseEnter={() => setCursor(myIndex)}
                        onClick={() => go(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                          active ? "bg-brand-soft" : "hover:bg-surface-hover"
                        }`}
                      >
                        <Icon size={15} className={active ? "text-brand-ink shrink-0" : "text-ink-faint shrink-0"} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] font-semibold text-ink truncate ${item.mono ? "font-mono-id" : ""}`}>
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-ink-faint truncate">{item.sub}</span>
                        </span>
                        {active && <CornerDownLeft size={13} className="text-ink-faint shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-line text-[10px] text-ink-faint">
          <span><kbd className="font-mono-id">↑↓</kbd> {t("search_nav_hint")}</span>
          <span><kbd className="font-mono-id">↵</kbd> {t("search_open_hint")}</span>
          <span className="ml-auto"><kbd className="font-mono-id">esc</kbd></span>
        </div>
      </div>
    </div>,
    document.body
  );
}
