// src/components/ShareImpactCard.jsx — buyer menerbitkan tautan dampak publik.
//
// Tombolnya berkata "Terbitkan ulang", bukan "Buat tautan", saat tautannya
// sudah ada — karena itulah yang terjadi: menerbitkan ulang MEMATIKAN tautan
// lama. Tanpa kata itu, buyer yang menekan dua kali akan mengira punya dua
// tautan, padahal yang pertama sudah mati di tangan orang yang dikiriminya.
//
// Tokennya sendiri tidak pernah ikut di muatan /buyers/{id} (disembunyikan di
// model), jadi ia hanya terlihat sekali saat diterbitkan. Karena itu kartunya
// menampilkan tautan utuh dan tombol salin, bukan sekadar pesan sukses.

import { useState } from "react";
import { Share2, Copy, Trash2, Loader2, ExternalLink } from "lucide-react";
import { buyerApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { Card, CardHeader, Button } from "./ui";

export default function ShareImpactCard({ buyerId }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [tautan, setTautan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function terbitkan() {
    setSibuk(true);
    try {
      const res = await buyerApi.terbitkanShare(buyerId);
      setTautan(`${window.location.origin}/dampak-publik/${res.token}`);
      toast.success(t("toast_share_created"));
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setSibuk(false);
    }
  }

  async function cabut() {
    setSibuk(true);
    try {
      await buyerApi.cabutShare(buyerId);
      setTautan("");
      toast.success(t("toast_share_revoked"));
    } catch (e) {
      toast.error(e.message || t("toast_failed"));
    } finally {
      setSibuk(false);
    }
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(tautan);
      toast.success(t("share_copied"));
    } catch {
      // clipboard ditolak (konteks tidak aman / izin). Tautannya tetap
      // terlihat di layar, jadi masih bisa disalin manual.
      toast.error(t("toast_failed"));
    }
  }

  return (
    <Card>
      <CardHeader icon={Share2} title={t("share_impact")} />
      <p className="mb-4 text-xs leading-relaxed text-ink-muted">{t("share_impact_desc")}</p>

      {tautan && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface-sub p-2.5">
          <code className="min-w-0 flex-1 truncate font-mono-id text-[11px] text-ink">{tautan}</code>
          <button type="button" onClick={salin} aria-label={t("copy_link")} title={t("copy_link")}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink">
            <Copy size={14} />
          </button>
          <a href={tautan} target="_blank" rel="noopener noreferrer" aria-label={t("open_link")} title={t("open_link")}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink">
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={terbitkan} disabled={sibuk}>
          {sibuk ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
          {tautan ? t("share_renew") : t("share_create")}
        </Button>
        <Button variant="ghost" type="button" onClick={cabut} disabled={sibuk}>
          <Trash2 size={15} /> {t("share_revoke")}
        </Button>
      </div>
    </Card>
  );
}
