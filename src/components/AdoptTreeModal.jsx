// src/components/AdoptTreeModal.jsx — buyer memilih paket sebelum mengadopsi.
//
// MASALAH YANG DIPECAHKAN. Sebelum ini tombol "Adopsi" di dasbor buyer langsung
// mengirim paket yang dipatok di kode: `package_name: "Tree Adoption — 1 Pohon"`
// tanpa tingkat sama sekali. Akibatnya, dari 13 tingkatan yang ada di katalog,
// buyer hanya bisa menjangkau SATU — paket 5 pohon (Rp 700.000) dan 10 pohon
// (Rp 1.300.000) tidak bisa dibeli dari aplikasi, meskipun keduanya ada di PDF
// dan bisa diterbitkan admin.
//
// Dan harganya tidak pernah ditampilkan: buyer menekan sebuah tombol, lalu
// tertagih Rp 150.000. Komponen pemilih tingkatannya sudah lama ada
// (TreeAdoptionTierPicker) tapi hanya dipakai halaman admin.
//
// Modal ini memakai komponen yang sama, jadi buyer dan admin melihat paket,
// harga, dan manfaat yang persis sama — bukan dua daftar yang bisa melenceng.

import { useState } from "react";
import { X, Loader2, Leaf, MapPin, HeartPulse } from "lucide-react";
import { adoptionApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { TREE_ADOPTION_TIERS, TREE_ADOPTION_LABEL } from "../lib/packageCatalog";
import { formatRupiah, formatNumber } from "../lib/format";
import { ModalPortal } from "./ui/ModalPortal";
import TreeAdoptionTierPicker from "./TreeAdoptionTierPicker";
import { Button, HealthBadge, FormStep } from "./ui";

export default function AdoptTreeModal({ isOpen, onClose, tree, onAdopted }) {
  const panelRef = useModalBehavior(isOpen, onClose);
  const { t } = useLanguage();
  const toast = useToast();

  const [tier, setTier] = useState("tree_1");
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");

  if (!isOpen || !tree) return null;

  // Endpoint asli memakai snake_case; fallback mock lokal memakai camelCase.
  // Keduanya dibaca, sama seperti kartu pohon yang memanggil modal ini.
  const kondisi = tree.health_status ?? tree.healthStatus ?? "baik";
  const co2 = tree.co2_eq_kg ?? tree.co2EqKg;
  const petani = tree.farmer_name ?? tree.farmer?.name;

  const terpilih = TREE_ADOPTION_TIERS.find((x) => x.key === tier);

  async function adopsi() {
    setGalat("");
    if (!terpilih) {
      setGalat(t("choose_package_first") || "Pilih paket lebih dulu.");
      return;
    }

    setMengirim(true);
    try {
      await adoptionApi.create({
        tree_id: tree.id,
        package_name: TREE_ADOPTION_LABEL,
        package_tier: tier,
        adopted_date: new Date().toISOString().split("T")[0],
      });
      toast.success(t("toast_adoption_created"));
      onAdopted?.();
      onClose();
    } catch (err) {
      // Pesan backend sudah berbahasa Indonesia dan menyebut langkah
      // berikutnya — ditampilkan apa adanya.
      setGalat(err?.message ?? t("toast_failed"));
    } finally {
      setMengirim(false);
    }
  }

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/70 backdrop-blur-md overflow-y-auto gjr-overlay-in">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("adopt_now")}
          className="bg-surface text-ink rounded-3xl max-w-3xl w-full shadow-2xl my-8 flex flex-col max-h-[88vh] overflow-hidden gjr-panel-in"
        >
          {/* kepala */}
          <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-line">
            <div className="min-w-0">
              <h2 className="gjr-display text-lg font-bold text-ink">{t("adopt_now")}</h2>
              <p className="mt-0.5 font-mono-id text-xs text-ink-muted">
                {tree.id} · {tree.species}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="shrink-0 rounded-xl p-2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* isi — panel bukan wadah gulirnya (DESIGN.md §5) */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <FormStep n={1} label={t("tree_id")}>
              <div className="rounded-2xl bg-surface-sub p-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <span className="flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-ink-faint" />
                    <HealthBadge status={kondisi} label={t(`health_${kondisi}`)} />
                  </span>
                  {petani && (
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <Leaf size={14} className="text-ink-faint" /> {petani}
                    </span>
                  )}
                  {co2 != null && (
                    <span className="tabular-nums text-ink">
                      {formatNumber(co2, 2)} kg CO₂
                    </span>
                  )}
                  {tree.latitude != null && (
                    <span className="flex items-center gap-1.5 tabular-nums text-ink-faint">
                      <MapPin size={13} /> {Number(tree.latitude).toFixed(4)}, {Number(tree.longitude).toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </FormStep>

            {/* Keputusan terbesar diletakkan terakhir, tepat di atas tombol —
                aturan siapa → kapan → apa dari DESIGN.md §5. */}
            <FormStep n={2} label={t("adoption_package")} wajib>
              <TreeAdoptionTierPicker value={tier} onChange={setTier} />
            </FormStep>
          </div>

          {/* kaki — harga SELALU terlihat sebelum tombol ditekan */}
          <div className="shrink-0 space-y-3 border-t border-line p-5">
            {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                  {t("total_payment")}
                </p>
                <p className="text-xl font-bold tabular-nums text-warn">
                  {terpilih ? formatRupiah(terpilih.price) : "—"}
                </p>
                {terpilih && (
                  <p className="text-xs text-ink-muted">
                    {terpilih.name}
                  </p>
                )}
                {/* Masa berlaku SENGAJA tidak ditampilkan di sini: katalog
                    frontend tidak memuatnya, dan durasinya ditentukan backend
                    (TreeAdoption::resolveMonths). Menuliskan angka tebakan di
                    layar pembayaran lebih buruk daripada tidak menuliskannya.
                    Tanggal habisnya muncul di sertifikat setelah terbit. */}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={onClose}>
                  {t("cancel")}
                </Button>
                <Button type="button" onClick={adopsi} disabled={mengirim || !terpilih}>
                  {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Leaf size={15} />}
                  {t("adopt_now")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
