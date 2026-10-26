// src/components/ui/SectionHeader.jsx
//
// Label kecil di atas tiap baris dashboard. Sebelumnya fungsi `SectionLabel`
// yang sama disalin ke DashboardPage dan FarmerDashboardPage.

export function SectionHeader({ children, actions }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {children}
      </h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default SectionHeader;
