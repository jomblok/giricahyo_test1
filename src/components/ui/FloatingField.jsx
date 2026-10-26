// src/components/ui/FloatingField.jsx
//
// Isian dengan label mengambang + ikon kiri. Idenya dari "Floating Input"
// (ruixen.ui, 21st.dev), tapi kodenya ditulis ulang — bukan sekadar di-port.
//
// Versi aslinya menyimpan nilainya sendiri di useState dan tidak memiliki prop
// `value` maupun `onChange`, sehingga tidak mungkin disambungkan ke state form
// yang sudah ada; ia juga bergantung pada <Input>/<Label> shadcn,
// @radix-ui/react-label, dan cva. Yang benar-benar dipakai dari sana adalah
// gagasannya: label yang naik menjadi keterangan begitu kolomnya terisi.
//
// Perbedaan penting dari versi 21st.dev: label di sini BERUBAH BENTUK, tidak
// cuma mengecil. Saat kosong ia tampil seperti placeholder (sans, 16px, huruf
// biasa); setelah naik ia menjadi label sungguhan (mono, 10px, kapital,
// berjarak) — mengikuti perlakuan label di seluruh halaman login.

import { useState } from "react";

export default function FloatingField({
  id,
  label,
  type = "text",
  value,
  onChange,
  icon: Icon,
  autoComplete,
  autoFocus,
  invalid,
  trailing,
  inputMode,
}) {
  const [focused, setFocused] = useState(false);
  const floating = focused || String(value ?? "").length > 0;

  return (
    <div className="relative">
      {Icon && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 transition-colors duration-200 ${
            focused ? "text-sage-400" : "text-cream-50/60"
          }`}
        >
          <Icon size={18} strokeWidth={1.9} />
        </span>
      )}

      {/* placeholder=" " (satu spasi, bukan kosong): membuat :placeholder-shown
          tetap berlaku sehingga peramban tidak memunculkan teks bawaannya
          sendiri di belakang label yang sedang mengambang. */}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        inputMode={inputMode}
        aria-invalid={invalid ? "true" : undefined}
        // text-base (16px) wajib: di bawah itu Safari iOS otomatis men-zoom
        // halaman saat kolom difokuskan, dan petugas lapangan memakai ponsel.
        // pt-6 menyisakan ruang untuk label yang naik agar tidak menimpa teks.
        className={`h-14 w-full rounded-lg border bg-ink-950/60 pb-2 pt-6 text-base text-cream-50 outline-none transition-all duration-200 focus:bg-ink-950/80 focus:ring-4 ${
          Icon ? "pl-12" : "pl-4"
        } ${trailing ? "pr-12" : "pr-4"} ${
          invalid
            ? "border-clay-400/60 focus:border-clay-400 focus:ring-clay-400/15"
            : "border-cream-50/12 hover:border-cream-50/22 focus:border-sage-400/70 focus:ring-sage-400/15"
        }`}
      />

      <label
        htmlFor={id}
        className={`pointer-events-none absolute transition-all duration-200 motion-reduce:transition-none ${
          Icon ? "left-12" : "left-4"
        } ${
          floating
            ? "top-2 font-mono text-[10px] uppercase tracking-[0.14em] " +
              (invalid ? "text-clay-300" : focused ? "text-sage-400" : "text-cream-50/65")
            : "top-1/2 -translate-y-1/2 text-base text-cream-50/60"
        }`}
      >
        {label}
      </label>

      {trailing && (
        <div className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2">{trailing}</div>
      )}

      {/* Garis cahaya tipis di bawah kolom saat difokuskan. Ini perubahan
          opasitas, bukan gerakan, jadi tetap berlaku pada prefers-reduced-motion
          — justru di situ ia berguna: ia satu-satunya penanda fokus yang tidak
          bergantung pada animasi apa pun. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-sage-400/70 to-transparent transition-opacity duration-300 ${
          focused ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
