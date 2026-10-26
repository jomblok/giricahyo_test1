// src/components/ui/Skeleton.jsx
//
// Placeholder loading. Sebelumnya semua skeleton memakai `bg-cream-100` tanpa
// varian dark: — di tema gelap kotak krem terang berkedip sebelum konten muncul.
// `bg-surface-hover` ikut tema, jadi masalah itu selesai di satu tempat.

export function Skeleton({ className = "", rounded = "rounded-xl" }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface-hover animate-pulse ${rounded} ${className}`}
    />
  );
}

// Skeleton yang meniru bentuk kontennya, bukan sekadar kotak abu-abu.
export function SkeletonCards({ count = 4, height = "h-28", cols = "grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]" }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${height} rounded-2xl`} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = "h-48" }) {
  return <Skeleton className={`${height} rounded-2xl`} />;
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="flex gap-3 pb-2 border-b border-line">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 py-1.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-4 flex-1 rounded"
              // baris makin ke bawah makin samar, meniru daftar yang memudar
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
