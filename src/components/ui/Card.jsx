// src/components/ui/Card.jsx
//
// Satu tempat untuk gaya kartu. Sebelumnya string
//   "bg-white dark:bg-forest-900 rounded-2xl border border-cream-100 dark:border-forest-800 p-5 shadow-sm"
// ditulis ulang 34 kali di 16 file — setiap perubahan gaya berarti 34 suntingan,
// dan itulah sumber semua inkonsistensi tema. Sekarang cukup di sini.

export function Card({
  as: Tag = "div",
  padded = true,
  hoverable = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={[
        "bg-surface border border-line rounded-2xl shadow-sm transition-colors",
        padded && "p-5",
        hoverable && "hover:border-line-strong",
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Judul di dalam kartu: ikon + teks + hitungan opsional + aksi di kanan.
//
// `level` ADA KARENA KEDALAMANNYA BERBEDA-BEDA. Semula tingkatnya dipatok h3,
// yang benar hanya bila kartunya berada di bawah SectionHeader (h2). Pada
// halaman yang menaruh kartu langsung di bawah judul halaman (h1), hasilnya
// lompatan h1->h3: pengguna pembaca layar kehilangan satu tingkat dan mengira
// ada bagian yang terlewat. Memperbaikinya di satu halaman saja akan membuat
// cacat yang sama muncul lagi di halaman berikutnya, jadi tingkatnya
// dijadikan pilihan di sini.
export function CardHeader({ icon: Icon, title, count, actions, level = 3, className = "" }) {
  const Judul = `h${level}`;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={17} className="text-brand shrink-0" />}
        <Judul className="font-semibold text-ink text-sm truncate">{title}</Judul>
        {count != null && (
          <span className="text-[11px] text-ink-faint tabular shrink-0">({count})</span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default Card;
