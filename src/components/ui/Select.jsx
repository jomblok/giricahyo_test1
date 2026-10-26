// src/components/ui/Select.jsx
//
// Pemilih daftar, menggantikan <select> bawaan.
//
// KENAPA DITULIS SENDIRI: sama persis dengan alasan DateField. Daftar <option>
// yang terbuka digambar oleh SISTEM OPERASI, di luar dokumen, dan CSS tidak
// punya cara menyentuhnya — tidak ada selector untuknya di peramban mana pun.
// Jadi sebagus apa pun kotaknya ditata, yang muncul saat diklik tetap daftar
// putih bersorot biru khas Windows, dengan huruf sistem, sudut siku, dan
// bayangan yang tidak ada hubungannya dengan sisa aplikasi. Di mode gelap ia
// bahkan menyilaukan.
//
// Tambalan `className="dark:bg-forest-900"` pada <option> yang tersebar di
// beberapa berkas adalah jejak dari usaha menambalnya; itu hanya bekerja
// sebagian di Firefox dan tidak sama sekali di Chrome/Edge.
//
// Bahasa visualnya sengaja dibuat identik dengan popup kalender: kotak
// rounded-2xl, border-line, bayangan yang sama, baris tersorot memakai
// brand-soft, baris terpilih memakai brand. Dua popup di aplikasi yang sama
// tidak boleh terlihat seperti berasal dari dua aplikasi berbeda.
//
// API-nya meniru <select>: `onChange` menerima objek ber-`e.target.value`,
// jadi pemanggil yang sudah menulis `(e) => setX(e.target.value)` tidak perlu
// diubah sama sekali.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAnchoredPopup } from "../../lib/useAnchoredPopup";

const UKURAN = {
  sm: { pemicu: "h-9 px-2.5 text-xs", baris: "px-2.5 py-1.5 text-xs" },
  md: { pemicu: "h-10 px-3 text-sm", baris: "px-3 py-2 text-sm" },
  lg: { pemicu: "h-14 px-3.5 text-base", baris: "px-3 py-2.5 text-sm" },
};

/**
 * @param {string} value
 * @param {(e: {target: {value: string}}) => void} onChange
 * @param {Array<{value: string, label: string, hint?: string}>} options
 * @param {string} [placeholder]  ditampilkan saat value tidak cocok satu pun
 * @param {"sm"|"md"|"lg"} [size]
 * @param {boolean} [error]       memberi border merah, seperti DateField
 * @param {boolean} [bare]        pemicu tanpa border/latar — untuk yang sudah
 *                                punya pembungkus sendiri (mis. PeriodFilter)
 */
export function Select({
  value,
  onChange,
  options = [],
  placeholder = "— Pilih —",
  size = "md",
  icon: Icon,
  error = false,
  disabled = false,
  bare = false,
  ariaLabel,
  className = "",
  triggerClassName = "",
}) {
  const uid = useId();
  const [terbuka, setTerbuka] = useState(false);
  const [aktif, setAktif] = useState(0);

  const pemicuRef = useRef(null);
  const popupRef = useRef(null);
  const daftarRef = useRef(null);
  const ketikan = useRef({ teks: "", waktu: 0 });

  const terpilihIdx = useMemo(
    () => options.findIndex((o) => String(o.value) === String(value)),
    [options, value]
  );
  const terpilih = terpilihIdx >= 0 ? options[terpilihIdx] : null;

  useAnchoredPopup({
    open: terbuka,
    anchorRef: pemicuRef,
    popupRef,
    matchAnchorWidth: true,
  });

  const buka = useCallback(() => {
    if (disabled) return;
    setAktif(terpilihIdx >= 0 ? terpilihIdx : 0);
    setTerbuka(true);
  }, [disabled, terpilihIdx]);

  const pilih = useCallback(
    (i) => {
      const o = options[i];
      if (!o) return;
      onChange?.({ target: { value: o.value } });
      setTerbuka(false);
      pemicuRef.current?.focus();
    },
    [options, onChange]
  );

  // ── Escape & klik di luar ─────────────────────────────────────────────────
  useEffect(() => {
    if (!terbuka) return undefined;

    function tekanTombol(e) {
      if (e.key !== "Escape") return;
      // Dipasang di WINDOW dengan capture, bukan document. useModalA11y
      // memasang penangkap Escape-nya di document (capture) untuk menutup
      // modal; fase capture berjalan dari luar ke dalam, jadi window lebih
      // dulu. Tanpa ini, menekan Escape saat daftar terbuka akan menutup
      // SELURUH modal beserta isian yang sedang diketik.
      e.stopPropagation();
      setTerbuka(false);
      pemicuRef.current?.focus();
    }
    function tekanTetikus(e) {
      if (pemicuRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setTerbuka(false);
    }

    window.addEventListener("keydown", tekanTombol, true);
    document.addEventListener("mousedown", tekanTetikus);
    return () => {
      window.removeEventListener("keydown", tekanTombol, true);
      document.removeEventListener("mousedown", tekanTetikus);
    };
  }, [terbuka]);

  // Fokus pindah ke daftarnya saat terbuka, dan baris aktif digulir agar
  // terlihat. Fokus dipegang oleh WADAH daftar (bukan tiap barisnya) lalu
  // barisnya ditunjuk dengan aria-activedescendant — pola baku ARIA untuk
  // listbox, dan sekaligus menjaga jebakan fokus modal tetap waras: kalau tiap
  // baris jadi elemen yang bisa difokus, daftar 26 jenis pohon menambah 26
  // perhentian Tab ke dalam modal.
  useEffect(() => {
    if (!terbuka) return;
    daftarRef.current?.focus();
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    const el = document.getElementById(`${uid}-opt-${aktif}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [terbuka, aktif, uid]);

  function tombolDiDaftar(e) {
    const akhir = options.length - 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setAktif((i) => Math.min(akhir, i + 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setAktif((i) => Math.max(0, i - 1)); return; }
    if (e.key === "Home")      { e.preventDefault(); setAktif(0); return; }
    if (e.key === "End")       { e.preventDefault(); setAktif(akhir); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pilih(aktif); return; }
    if (e.key === "Tab") { setTerbuka(false); return; }

    // Ketik-untuk-melompat. Daftar jenis pohon punya 26 isi dan katalog paket
    // punya 6 — menekan "n" untuk sampai ke "Nangka" jauh lebih cepat daripada
    // menekan panah bawah belasan kali. Jeda 700ms mengelompokkan ketikan
    // beruntun jadi satu kata, seperti <select> bawaan.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      ketikan.current.teks = now - ketikan.current.waktu > 700 ? e.key : ketikan.current.teks + e.key;
      ketikan.current.waktu = now;
      const cari = ketikan.current.teks.toLowerCase();
      const idx = options.findIndex((o) => String(o.label).toLowerCase().startsWith(cari));
      if (idx >= 0) setAktif(idx);
    }
  }

  function tombolDiPemicu(e) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      buka();
    }
  }

  const u = UKURAN[size] ?? UKURAN.md;

  const kelasPemicu = bare
    ? "flex w-full items-center gap-1.5 bg-transparent text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-lg"
    : [
        "flex w-full items-center gap-2 rounded-xl border bg-surface-sub text-left transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-brand/40",
        u.pemicu,
        disabled
          ? "cursor-not-allowed opacity-60"
          : error
            ? "cursor-pointer border-bad/50"
            : "cursor-pointer border-line hover:border-line-strong focus:border-brand/50",
      ].join(" ");

  return (
    <div className={className}>
      <button
        ref={pemicuRef}
        type="button"
        role="combobox"
        aria-expanded={terbuka}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-invalid={error ? "true" : undefined}
        disabled={disabled}
        onClick={() => (terbuka ? setTerbuka(false) : buka())}
        onKeyDown={tombolDiPemicu}
        className={`${kelasPemicu} ${triggerClassName}`}
      >
        {Icon && <Icon size={size === "sm" ? 13 : 15} className="shrink-0 text-ink-faint" />}
        <span className={`min-w-0 flex-1 truncate ${terpilih ? "text-ink font-medium" : "text-ink-faint"}`}>
          {terpilih ? terpilih.label : placeholder}
        </span>
        <ChevronDown
          size={size === "sm" ? 13 : 15}
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${terbuka ? "rotate-180" : ""}`}
        />
      </button>

      {terbuka && (
        /* Dua lapis: yang LUAR hanya menempatkan (tanpa transform sendiri,
           supaya pengukuran di useAnchoredPopup jujur), yang DALAM beranimasi
           dan menggambar kotaknya. */
        <div ref={popupRef} style={{ position: "fixed", top: 0, left: 0, zIndex: 70 }}>
          <div className="gjr-pop-in overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-forest-950/15">
            <div
              ref={daftarRef}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={`${uid}-opt-${aktif}`}
              aria-label={ariaLabel}
              onKeyDown={tombolDiDaftar}
              className="max-h-64 overflow-y-auto p-1.5 focus:outline-none"
            >
              {options.length === 0 && (
                <p className="px-3 py-2 text-xs text-ink-faint">Tidak ada pilihan.</p>
              )}
              {options.map((o, i) => {
                const dipilih = i === terpilihIdx;
                const disorot = i === aktif;
                return (
                  <div
                    key={o.value}
                    id={`${uid}-opt-${i}`}
                    role="option"
                    aria-selected={dipilih}
                    onClick={() => pilih(i)}
                    onMouseEnter={() => setAktif(i)}
                    className={[
                      "flex cursor-pointer items-baseline gap-2 rounded-lg transition-colors duration-100",
                      u.baris,
                      dipilih
                        ? "bg-brand font-semibold text-cream-50 dark:text-forest-950"
                        : disorot
                          ? "bg-brand-soft text-brand-ink"
                          : "text-ink",
                    ].join(" ")}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint && (
                      <span className={`shrink-0 text-[11px] tabular-nums ${dipilih ? "opacity-80" : "text-ink-faint"}`}>
                        {o.hint}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Select;
