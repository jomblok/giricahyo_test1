// src/components/FarmerProfileDrawer.jsx
//
// Panel samping berisi profil petani, dibuka dari baris tabel. Dipakai supaya
// admin bisa melihat rincian tanpa berpindah halaman dan kehilangan posisi
// scroll serta filter yang sedang aktif.

import { X, MapPin, Users, TreeDeciduous, Wallet, Wind } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { farmerApi } from "../lib/api";
import { formatNumber, formatRupiah, formatDate } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { IconButton, Badge, HealthBadge, EmptyState, Skeleton } from "./ui";
import { ModalPortal } from './ui/ModalPortal';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface-sub rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-ink-faint mb-1">
        <Icon size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-ink tabular leading-tight">{value}</p>
    </div>
  );
}

export default function FarmerProfileDrawer({ farmerId, onClose }) {
  const { t } = useLanguage();
  const panelRef = useModalBehavior(true, onClose);
  const { data, loading, error } = useApi(() => farmerApi.get(farmerId), [farmerId]);

  const farmer = data?.farmer;
  const salary = data?.salaries?.[0] ?? null;
  const trees = data?.trees ?? [];

  return (
    <ModalPortal onClose={onClose}>
      <div className="gjr-overlay-in fixed inset-0 z-[95] flex justify-end" role="dialog" aria-modal="true" aria-label={t("farmer_profile")}>
        <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
        <aside ref={panelRef} className="gjr-drawer-r relative w-full max-w-md bg-surface border-l border-line shadow-2xl flex flex-col">
          <div className="flex items-center justify-between gap-3 p-5 border-b border-line shrink-0">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{t("farmer_profile")}</p>
              <h3 className="font-bold text-ink truncate">{farmer?.name ?? farmerId}</h3>
            </div>
            <IconButton icon={X} label={t("close")} onClick={onClose} variant="secondary" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <ApiState
              loading={loading}
              error={error}
              skeleton={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
            >
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-ink-muted">
                  <Users size={13} className="text-ink-faint shrink-0" />
                  {farmer?.group_coop ?? farmer?.groupCoop ?? "—"}
                </p>
                <p className="flex items-center gap-2 text-ink-muted">
                  <MapPin size={13} className="text-ink-faint shrink-0" />
                  {farmer?.address ?? "—"}
                </p>
                <p className="font-mono-id text-[11px] text-ink-faint pt-1">{farmer?.id ?? farmerId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Stat icon={TreeDeciduous} label={t("trees_label")} value={trees.length} />
                <Stat icon={Wind} label="CO₂ (kg)" value={formatNumber(data?.total_co2_kg ?? 0, 1)} />
                <Stat icon={Wallet} label={t("final_salary")} value={salary ? formatRupiah(salary.final_salary) : "—"} />
                <Stat icon={Users} label={t("co2_proportion")} value={`${formatNumber(data?.proportion_pct ?? 0, 1)}%`} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">
                  {t("my_tree_inventory")}
                </p>
                {trees.length === 0 ? (
                  <EmptyState icon={TreeDeciduous} title={t("no_trees_found")} compact />
                ) : (
                  <div className="space-y-2">
                    {trees.map((tr) => {
                      const status = tr.health_status ?? tr.healthStatus;
                      return (
                        <div key={tr.id} className="flex items-center justify-between gap-3 bg-surface-sub rounded-xl px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="font-mono-id text-[12px] font-bold text-ink">{tr.id}</p>
                            <p className="text-[11px] text-ink-muted truncate">
                              {tr.species} · {formatDate(tr.last_updated ?? tr.lastUpdated)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <HealthBadge status={status} label={t(`health_${status}`)} />
                            <Badge tone="neutral">{formatNumber(tr.co2_eq_kg ?? tr.co2EqKg ?? 0, 1)} kg</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ApiState>
          </div>
        </aside>
      </div>
    </ModalPortal>
  );
}
