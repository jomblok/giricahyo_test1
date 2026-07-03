export default function KpiCard({ icon: Icon, label, value, suffix, accent = "sage" }) {
  const accentMap = {
    sage: "text-sage-600 bg-sage-100",
    gold: "text-gold-600 bg-gold-100",
    forest: "text-forest-900 bg-cream-100",
  };

  return (
    <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-700/60">
          {label}
        </span>
        <span className="text-2xl md:text-3xl font-bold text-forest-950 tabular leading-tight">
          {value}
          {suffix && (
            <span className="text-sm font-medium text-forest-700/50 ml-1">
              {suffix}
            </span>
          )}
        </span>
      </div>
      <div className={`shrink-0 rounded-xl p-2.5 ${accentMap[accent]}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
    </div>
  );
}
