// src/pages/SupportedTreesPage.jsx — daftar ringkas pohon yang didukung buyer.
// Halaman Ringkasan tetap menampilkan kartu lengkap dengan linimasa foto;
// halaman ini memberi tampilan tabel yang lebih cepat dipindai.

import { Leaf, TreeDeciduous, Award } from "lucide-react";
import AppShell from "../components/AppShell";
import CertificateModal from "../components/CertificateModal";
import CertificateExpiryCard from "../components/CertificateExpiryCard";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { buyerApi } from "../lib/api";
import { formatNumber, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { Card, CardHeader, HealthBadge, Badge, Button, EmptyState, SkeletonTable } from "../components/ui";

export default function SupportedTreesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const buyerId = user?.linked_id ?? user?.linkedId ?? "B001";
  const { data, loading, error } = useApi(() => buyerApi.get(buyerId), [buyerId]);
  const [certFor, setCertFor] = useState(null);

  const adoptions = data?.adoptions ?? [];

  return (
    <AppShell title={t("nav_my_support")} showPeriod={false}>
      <div className="space-y-4">
      {/* Sertifikat yang mendekati habis diletakkan DI ATAS daftar, bukan di
          bawahnya: kolom expires_at sudah lama ada tapi tidak ada yang
          mengawasinya, dan sertifikat yang kedaluwarsa diam-diam adalah
          pendapatan berulang yang hilang tanpa ada yang tahu. */}
      {/* level=2: halaman ini tidak punya SectionHeader, jadi kartunya
          berada langsung di bawah judul halaman (h1). */}
      <CertificateExpiryCard bisaPerpanjang days={120} level={2} />
      <Card>
        <CardHeader icon={Leaf} title={t("trees_supported")} count={!loading ? adoptions.length : undefined} />
        <ApiState loading={loading} error={error} skeleton={<SkeletonTable rows={5} cols={6} />}>
          {adoptions.length === 0 ? (
            <EmptyState
              icon={TreeDeciduous}
              title={t("no_adopted_trees")}
              description={t("contact_coop_for_adoption")}
            />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
                    <th scope="col" className="py-2.5 px-3 font-semibold">{t("tree_id")}</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">{t("species")}</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">{t("health")}</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">CO₂ (kg)</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">{t("adoption_date")}</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">{t("certificates")}</th>
                  </tr>
                </thead>
                <tbody>
                  {adoptions.map((a) => {
                    const tree = a.tree ?? {};
                    const status = tree.health_status ?? tree.healthStatus;
                    return (
                      <tr key={a.id ?? a.certificate_no ?? tree.id} className="border-b border-line/60 last:border-0 hover:bg-surface-hover transition-colors">
                        <td className="py-2.5 px-3 font-mono-id text-[12px] text-ink">{tree.id ?? "—"}</td>
                        <td className="py-2.5 px-3 text-ink">{tree.species ?? "—"}</td>
                        <td className="py-2.5 px-3">
                          {status ? <HealthBadge status={status} label={t(`health_${status}`)} /> : <span className="text-ink-faint">—</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular font-medium text-ink">
                          {tree.co2_eq_kg != null || tree.co2EqKg != null
                            ? formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 1)
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-ink-muted text-xs">
                          {a.adopted_date ? formatDate(a.adopted_date) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {a.certificate_no ? (
                            <Button size="sm" variant="soft" icon={Award} onClick={() => setCertFor(a)}>
                              <span className="font-mono-id">{a.certificate_no}</span>
                            </Button>
                          ) : (
                            <Badge>—</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ApiState>
      </Card>
      </div>

      {certFor && (
        <CertificateModal
          isOpen={true}
          adoption={certFor}
          onClose={() => setCertFor(null)}
        />
      )}
    </AppShell>
  );
}
