// src/components/ui/Button.jsx

// Apakah pemanggil sudah menentukan sendiri display-nya (tanpa awalan varian)?
//
// KENAPA PERLU DIPERIKSA. Button dan IconButton menuliskan `inline-flex` di
// daftar kelas bawaannya. Ketika pemanggil menambahkan `hidden` lewat
// className, dua utility display bertabrakan — dan yang menang BUKAN yang
// ditulis belakangan di atribut class, melainkan yang aturannya berada lebih
// akhir di berkas CSS. Tailwind selalu menempatkan `inline-flex` sesudah
// `hidden`, jadi `hidden` selalu kalah dan tombolnya tetap tampil.
//
// Akibatnya nyata dan diam: `hidden md:inline-flex` pada tombol Mode
// Presentasi tidak pernah bekerja, sehingga tombol itu ikut memenuhi topbar
// ponsel dan mendorong judul halaman keluar layar.
//
// Awalan varian TIDAK dihitung: `lg:hidden` hidup di dalam media query yang
// letaknya sudah lebih akhir, jadi ia memang menang tanpa perlu campur tangan.
const DISPLAY_SENDIRI = /(^|\s)(hidden|flex|inline-flex|block|inline-block|grid|inline-grid|contents)(\s|$)/;

const VARIANTS = {
  primary:   "bg-brand text-surface hover:opacity-90 border border-transparent",
  secondary: "bg-surface-sub text-ink hover:bg-surface-hover border border-line",
  soft:      "bg-brand-soft text-brand-ink hover:brightness-95 border border-transparent",
  ghost:     "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-hover border border-transparent",
  danger:    "bg-bad-soft text-bad hover:brightness-95 border border-transparent",
};

const SIZES = {
  sm: "text-[11px] px-2.5 py-1 gap-1 rounded-lg",
  md: "text-xs px-3 py-1.5 gap-1.5 rounded-xl",
  lg: "text-sm px-4 py-2.5 gap-2 rounded-xl",
};

export function Button({
  as: Tag = "button",
  variant = "secondary",
  size = "md",
  icon: Icon,
  className = "",
  children,
  ...rest
}) {
  const iconSize = size === "lg" ? 16 : size === "md" ? 14 : 13;
  return (
    <Tag
      className={[
        DISPLAY_SENDIRI.test(className) ? "" : "inline-flex",
        "items-center justify-center font-semibold transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant] ?? VARIANTS.secondary,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
      {...rest}
    >
      {Icon && <Icon size={iconSize} className="shrink-0" />}
      {children}
    </Tag>
  );
}

// Tombol yang isinya hanya ikon — wajib punya `label` untuk screen reader,
// karena sebelumnya di seluruh src/ cuma ada dua atribut aria-* dan nol role.
export function IconButton({ as: Tag = "button", icon: Icon, label, size = "md", variant = "ghost", className = "", ...rest }) {
  const box = size === "lg" ? "p-2.5" : size === "md" ? "p-2" : "p-1.5";
  const iconSize = size === "lg" ? 18 : size === "md" ? 15 : 13;
  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      aria-label={label}
      title={label}
      className={[
        DISPLAY_SENDIRI.test(className) ? "" : "inline-flex",
        "items-center justify-center rounded-xl transition-colors",
        VARIANTS[variant] ?? VARIANTS.ghost,
        box,
        className,
      ].join(" ")}
      {...rest}
    >
      <Icon size={iconSize} />
    </Tag>
  );
}

export default Button;
