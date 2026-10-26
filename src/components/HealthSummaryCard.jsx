import { useState } from "react";
import { HeartPulse, X, TreeDeciduous, AlertTriangle } from "lucide-react";
import { useApi } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { Card, CardHeader, Badge, EmptyState, Skeleton, IconButton } from "./ui";
import { ModalPortal } from './ui/ModalPortal';

const ORDER = ["baik", "sedang", "buruk"];

// Warna batang & titik memakai token peran, jadi ikut tema tanpa pasangan dark:.
const META = {
  baik:   { bar: "bg-good", text: "text-good", key: "health_good" },
  sedang: { bar: "bg-warn", text: "text-warn", key: "health_fair" },
  buruk:  { bar: "bg-bad",  text: "text-bad",  key: "health_poor" },
};

export default function HealthSummaryCard({ healthCounts = {} }) {
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState(null);

  const counts = {
    baik:   Number(healthCounts.baik ?? 0),
    sedang: Number(healthCounts.sedang ?? 0),
    buruk:  Number(healthCounts.buruk ?? 0),
  };
  const totalTrees = counts.baik + counts.sedang + counts.buruk;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader icon={HeartPulse} title={t("health_title")} />

      {/* Batang proporsi */}
      <div
        className="flex h-3 rounded-full overflow-hidden mb-4 bg-surface-sub"
        role="img"
        aria-label={`${counts.baik} ${t("health_good")}, ${counts.sedang} ${t("health_fair")}, ${counts.buruk} ${t("health_poor")}`}
      >
        {ORDER.map((key) =>
          counts[key] > 0 && totalTrees > 0 ? (
            <div
              key={key}
              className={META[key].bar}
              style={{ width: `${(counts[key] / totalTrees) * 100}%` }}
            />
          ) : null
        )}
      </div>

      <div className="space-y-1">
        {ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => counts[key] > 0 && setSelectedStatus(key)}
            disabled={counts[key] === 0}
            className="w-full flex items-center justify-between text-sm p-2 -mx-2 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <span className="flex items-center gap-2 text-ink-muted group-hover:text-ink transition-colors">
              <span className={`w-2 h-2 rounded-full ${META[key].bar}`} />
              {t(META[key].key)}
            </span>
            <span className={`font-semibold tabular ${META[key].text}`}>
              {counts[key]} {t("trees_label")}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {counts.buruk > 0 && (
        <p className="flex items-start gap-2 text-[11px] text-bad bg-bad-soft rounded-lg px-3 py-2 mt-4">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>{counts.buruk} {t("critical_trees_warning")}</span>
        </p>
      )}

      {selectedStatus && (
        <TreeListModal status={selectedStatus} onClose={() => setSelectedStatus(null)} />
      )}
    </Card>
  );
}

function TreeListModal({ status, onClose }) {
  const { t } = useLanguage();
  const panelRef = useModalBehavior(true, onClose);
  const { data: apiTrees, loading, error } = useApi(() => treeApi.list());

  const trees = (apiTrees || []).filter(
    (tree) => (tree.health_status ?? tree.healthStatus) === status
  );

  return (
    <ModalPortal onClose={onClose}>
      <div
        className="gjr-overlay-in fixed inset-0 z-[9999] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${t("tree_list")} ${t(META[status].key)}`}
      >
        <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
        <div ref={panelRef} className="gjr-panel-in relative bg-surface border border-line rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-line shrink-0">
            <div className="flex items-center gap-2">
              <TreeDeciduous size={18} className={META[status].text} />
              <h3 className="font-bold text-ink">
                {t("tree_list")} {t(META[status].key)}
              </h3>
              <Badge tone={status === "baik" ? "good" : status === "sedang" ? "warn" : "bad"}>
                {trees.length}
              </Badge>
            </div>
            <IconButton icon={X} label={t("close")} onClick={onClose} variant="secondary" />
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[68px] rounded-2xl" />
                ))}
              </div>
            )}
            {error && (
              <div role="alert" className="text-sm text-bad bg-bad-soft p-4 rounded-xl">
                {t("failed_load")} {error}
              </div>
            )}
            {!loading && !error && trees.length === 0 && (
              <EmptyState icon={TreeDeciduous} title={t("no_trees_status")} />
            )}
            {!loading && !error && trees.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trees.map((tree) => (
                  <div
                    key={tree.id}
                    className="flex items-center justify-between gap-3 bg-surface-sub p-3.5 rounded-2xl border border-line hover:border-line-strong transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-mono-id font-bold text-[13px] text-ink">{tree.id}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5 truncate">
                        {tree.species} • {tree.farmer_name ?? tree.farmerName ?? tree.farmer?.name ?? t("unnamed")}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      <span className="text-[10px] text-ink-faint uppercase tracking-wider mb-0.5 tabular">
                        DBH {tree.dbh_cm ?? tree.dbhCm}cm
                      </span>
                      <Badge tone="brand">{tree.co2_eq_kg ?? tree.co2EqKg} kg CO₂</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
