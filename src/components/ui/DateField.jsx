// src/components/ui/DateField.jsx
//
// Kolom tanggal LENGKAP dengan kalendernya sendiri.
//
// KENAPA KALENDERNYA DITULIS SENDIRI, bukan mengandalkan <input type="date">:
// popup kalender pada input tanggal bawaan digambar oleh PERAMBAN, di luar
// dokumen, dan tidak bisa disentuh CSS sama sekali — tidak ada selector untuk
// itu, tidak di Chrome, tidak di Edge, tidak di Firefox. Jadi sebagus apa pun
// kotak isiannya ditata, begitu diklik yang muncul tetap kalender biru khas
// sistem, berbahasa Inggris, berpola mm/dd/yyyy, dengan tombol "Clear" dan
// "Today". Itulah yang terlihat di tangkapan layar, dan itu sebabnya penataan
// warna sebelumnya tidak pernah berpengaruh: yang ditata memang bukan bagian
// yang dikeluhkan.
//
// Satu-satunya cara membuatnya seragam dengan sisa aplikasi adalah berhenti
// memakai popup bawaan dan menggambar kalendernya sendiri. Itu isi berkas ini.
//
// Yang diambil dari komponen rujukan (MultiStepForm, 21st.dev): proporsinya —
// kolom setinggi 56px, teks 16px, sudut membulat, peralihan fokus yang halus,
// dan gagasan "satu kolom besar yang nyaman disentuh" alih-alih kolom kecil
// yang padat. Yang TIDAK diambil: token warnanya (background/border/foreground
// milik shadcn) — proyek ini punya token perannya sendiri (surface / line /
// brand / ink / bad) yang sudah otomatis membalik saat tema gelap dinyalakan.
//
// API-nya sengaja tidak berubah dari versi sebelumnya: `onChange` tetap
// menerima objek ber-`e.target.value` berisi tanggal ISO (yyyy-mm-dd), persis
// seperti <input type="date">, sehingga keempat pemakainya (Generate QR, Foto
// Pohon, Pemasukan Dana, Sertifikat) tidak perlu disentuh.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { useAnchoredPopup } from "../../lib/useAnchoredPopup";

// Nama bulan/hari ditaruh di sini, bukan di LanguageContext, karena 24 nama
// bulan + 14 nama hari hanya dipakai oleh berkas ini — memasukkannya ke kamus
// bersama membuat kamus itu membengkak tanpa ada yang ikut memakainya.
const BULAN = {
  id: ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
};
const BULAN_SINGKAT = {
  id: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
// Pekan dimulai SENIN — itu yang berlaku di kalender Indonesia. Kalender
// bawaan peramban memulainya Minggu karena mengikuti locale sistem (yang di
// sini hampir selalu en-US), dan itu salah satu hal yang terasa asing.
const HARI = {
  id: ["Sen","Sel","Rab","Kam","Jum","Sab","Min"],
  en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
};
const TEKS = {
  id: {
    buka: "Buka kalender", bulanLalu: "Bulan sebelumnya", bulanDepan: "Bulan berikutnya",
    tahunLalu: "Tahun sebelumnya", tahunDepan: "Tahun berikutnya",
    pilihBulan: "Pilih bulan dan tahun", hariIni: "Hari ini", hapus: "Hapus",
    petunjuk: "Ketik dd/mm/yyyy atau pilih dari kalender",
  },
  en: {
    buka: "Open calendar", bulanLalu: "Previous month", bulanDepan: "Next month",
    tahunLalu: "Previous year", tahunDepan: "Next year",
    pilihBulan: "Choose month and year", hariIni: "Today", hapus: "Clear",
    petunjuk: "Type dd/mm/yyyy or pick from the calendar",
  },
};

// ── Konversi tanggal ────────────────────────────────────────────────────────
// Sengaja TIDAK memakai new Date("2026-08-27"). String ISO polos ditafsirkan
// sebagai UTC oleh spesifikasi JavaScript, lalu dicetak kembali dalam zona
// waktu lokal — di zona sebelah barat Greenwich tanggalnya mundur satu hari.
// Konstruktor (tahun, bulan, tanggal) selalu lokal, jadi tidak ada pergeseran.
function uraiIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const y = +m[1];
  const bl = +m[2];
  const tg = +m[3];
  const d = new Date(y, bl - 1, tg);
  // Menangkal tanggal yang "membulat" sendiri: 31/02 menjadi 3 Maret di
  // konstruktor Date, dan tanpa pemeriksaan ini ketikan salah itu diterima
  // diam-diam sebagai tanggal lain.
  if (d.getFullYear() !== y || d.getMonth() !== bl - 1 || d.getDate() !== tg) return null;
  return d;
}

const pad = (n) => String(n).padStart(2, "0");

function keIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isoKeTeks(iso) {
  const d = uraiIso(iso);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "";
}

function teksKeIso(teks) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(teks);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return uraiIso(iso) ? iso : null;
}

// Merapikan ketikan menjadi dd/mm/yyyy sambil diketik.
//
// Selalu dibangun ulang dari ANGKA-nya saja, dan pemisah "/" baru ditambahkan
// ketika sudah ada angka sesudahnya. Cara ini penting supaya Backspace tidak
// terjebak: kalau "/" ditambahkan segera setelah dua angka, menghapus satu
// karakter dari "27/" langsung memunculkan "/" itu lagi dan kolomnya tidak
// pernah bisa dikosongkan.
function rapikanKetikan(mentah) {
  const a = (mentah || "").replace(/\D/g, "").slice(0, 8);
  if (a.length <= 2) return a;
  if (a.length <= 4) return `${a.slice(0, 2)}/${a.slice(2)}`;
  return `${a.slice(0, 2)}/${a.slice(2, 4)}/${a.slice(4)}`;
}

const LEBAR_POPUP = 300;

export default function DateField({
  id,
  value,
  onChange,
  error,
  min,
  max,
  required,
  className = "",
}) {
  const ctxBahasa = useLanguage();
  const lang = ctxBahasa?.lang === "en" ? "en" : "id";
  const T = TEKS[lang];
  const idOtomatis = useId();
  const idInput = id || `tgl-${idOtomatis}`;

  const hariIniIso = useMemo(() => keIso(new Date()), []);

  const [terbuka, setTerbuka] = useState(false);
  const [tampilan, setTampilan] = useState("hari"); // hari | bulan | tahun
  const [teks, setTeks] = useState(() => isoKeTeks(value));
  const [kursor, setKursor] = useState(() => uraiIso(value) || new Date());
  const [sorot, setSorot] = useState(() => (uraiIso(value) ? value : hariIniIso));

  // Menyelaraskan teks ketika `value` diubah dari LUAR (mis. tombol reset di
  // Generate QR). Dilakukan saat render, bukan di dalam useEffect: ini pola
  // resmi React untuk "state yang menyesuaikan prop", dan menghindari satu
  // render tambahan yang membuat kolomnya berkedip menampilkan nilai lama.
  const [valueTerakhir, setValueTerakhir] = useState(value);
  if (value !== valueTerakhir) {
    setValueTerakhir(value);
    setTeks(isoKeTeks(value));
    const d = uraiIso(value);
    if (d) {
      setKursor(d);
      setSorot(value);
    }
  }

  const bungkusRef = useRef(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const gridRef = useRef(null);
  const mintaFokusGrid = useRef(false);

  const dalamRentang = useCallback(
    (iso) => !((min && iso < min) || (max && iso > max)),
    [min, max]
  );

  const kirim = useCallback(
    (iso) => {
      setValueTerakhir(iso);
      onChange?.({ target: { value: iso } });
    },
    [onChange]
  );

  // Penempatan popup dipegang hook bersama — perhitungan yang sama dipakai
  // Select. `revision` diisi `tampilan` karena tampilan bulan dan tahun lebih
  // pendek daripada tampilan hari: tanpa itu, popup yang tadi dibalik ke atas
  // kolom akan meninggalkan celah menganga di bawahnya setelah berganti
  // tampilan.
  useAnchoredPopup({ open: terbuka, anchorRef: bungkusRef, popupRef, revision: tampilan });

  // ── Escape & klik di luar ─────────────────────────────────────────────────
  useEffect(() => {
    if (!terbuka) return undefined;

    function tekanTombol(e) {
      if (e.key !== "Escape") return;
      // Pendengar dipasang di WINDOW dengan capture, bukan di document.
      //
      // useModalA11y memasang penangkap Escape-nya di document (capture) untuk
      // menutup modal. Fase capture berjalan dari luar ke dalam — window lebih
      // luar daripada document — sehingga pendengar ini berjalan lebih dulu dan
      // bisa menghentikan rambatannya. Tanpa itu, menekan Escape saat kalender
      // terbuka akan menutup SELURUH modal beserta isian yang sedang diketik,
      // bukan sekadar menutup kalendernya.
      e.stopPropagation();
      setTerbuka(false);
      inputRef.current?.focus();
    }

    function tekanTetikus(e) {
      if (bungkusRef.current?.contains(e.target)) return;
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

  // Memindahkan fokus ke sel yang sedang disorot. Hanya berlaku kalau kalender
  // memang dibuka lewat papan ketik, atau fokusnya sudah berada di dalam grid —
  // supaya membuka dengan tetikus tidak merebut kursor teks dari kolom isian.
  useLayoutEffect(() => {
    if (!terbuka) return;
    const g = gridRef.current;
    if (!g) return;
    const perluFokus = mintaFokusGrid.current || g.contains(document.activeElement);
    if (!perluFokus) return;
    mintaFokusGrid.current = false;
    g.querySelector('[data-aktif="true"]')?.focus();
  }, [terbuka, sorot, tampilan, kursor]);

  // ── Aksi ──────────────────────────────────────────────────────────────────
  function buka(fokusKeGrid = false) {
    mintaFokusGrid.current = fokusKeGrid;
    setTampilan("hari");
    const d = uraiIso(value);
    if (d) {
      setKursor(d);
      setSorot(value);
    }
    setTerbuka(true);
  }

  function pilih(iso) {
    if (!dalamRentang(iso)) return;
    setTeks(isoKeTeks(iso));
    setSorot(iso);
    setKursor(uraiIso(iso));
    kirim(iso);
    setTerbuka(false);
    inputRef.current?.focus();
  }

  function ubahTeks(e) {
    const berikut = rapikanKetikan(e.target.value);
    setTeks(berikut);
    if (berikut === "") {
      kirim("");
      return;
    }
    const iso = teksKeIso(berikut);
    if (iso && dalamRentang(iso)) {
      setSorot(iso);
      setKursor(uraiIso(iso));
      kirim(iso);
    }
  }

  // Ketikan yang tidak pernah selesai (mis. "27/0" lalu pindah kolom) tidak
  // boleh ditinggalkan menggantung di layar seolah tersimpan — dikembalikan ke
  // nilai yang benar-benar tersimpan.
  function lepasFokus() {
    if (teks === "") return;
    const iso = teksKeIso(teks);
    if (iso && dalamRentang(iso)) return;
    setTeks(isoKeTeks(value));
  }

  function tombolDiInput(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      buka(true);
    } else if (e.key === "Enter" && terbuka) {
      e.preventDefault();
      setTerbuka(false);
    }
  }

  function geser(hari) {
    const d = uraiIso(sorot) || new Date();
    const b = new Date(d.getFullYear(), d.getMonth(), d.getDate() + hari);
    setSorot(keIso(b));
    setKursor(b);
  }

  function geserBulan(n) {
    const d = uraiIso(sorot) || new Date();
    // Hari ke-0 bulan berikutnya = hari terakhir bulan yang dituju. Dipakai
    // untuk menjepit tanggal 31 saat pindah ke bulan yang cuma punya 30 hari —
    // tanpa ini, 31 Januari + 1 bulan melompat ke 3 Maret.
    const akhir = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    const b = new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), akhir));
    setSorot(keIso(b));
    setKursor(b);
  }

  function tombolDiGrid(e) {
    const peta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in peta) {
      e.preventDefault();
      geser(peta[e.key]);
      return;
    }
    if (e.key === "PageUp") {
      e.preventDefault();
      geserBulan(e.shiftKey ? -12 : -1);
      return;
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      geserBulan(e.shiftKey ? 12 : 1);
      return;
    }
    // (getDay() + 6) % 7 memutar Minggu=0 menjadi Senin=0, jadi Home/End
    // melompat ke Senin/Minggu pada baris yang sama.
    if (e.key === "Home") {
      e.preventDefault();
      geser(-(((uraiIso(sorot) || new Date()).getDay() + 6) % 7));
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      geser(6 - (((uraiIso(sorot) || new Date()).getDay() + 6) % 7));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pilih(sorot);
    }
  }

  // ── Turunan tampilan ──────────────────────────────────────────────────────
  const selSatuBulan = useMemo(() => {
    const y = kursor.getFullYear();
    const b = kursor.getMonth();
    const geserAwal = (new Date(y, b, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(y, b, 1 - geserAwal + i));
  }, [kursor]);

  const halamanTahun = useMemo(() => {
    const awal = Math.floor(kursor.getFullYear() / 12) * 12;
    return Array.from({ length: 12 }, (_, i) => awal + i);
  }, [kursor]);

  const tglTerpilih = uraiIso(value);
  const gema = tglTerpilih
    ? tglTerpilih.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // ── Kelas ─────────────────────────────────────────────────────────────────
  const kelasNav =
    "flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

  function kelasSel(terpilih, redup, mati, hariIni) {
    return [
      "relative flex h-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
      mati
        ? "cursor-not-allowed text-ink-faint/30"
        : terpilih
          ? "cursor-pointer bg-brand font-semibold text-cream-50 dark:text-forest-950"
          : `cursor-pointer hover:bg-brand-soft hover:text-brand-ink ${redup ? "text-ink-faint/45" : "text-ink"}`,
      // Titik penanda hari ini. Hanya digambar kalau selnya BELUM terpilih —
      // di atas bidang hijau titiknya tidak terbaca dan cuma jadi noda.
      !terpilih && hariIni && !mati
        ? "after:absolute after:bottom-1 after:h-1 after:w-1 after:rounded-full after:bg-brand"
        : "",
    ].join(" ");
  }

  return (
    <div className={className}>
      <div ref={bungkusRef} className="relative">
        <Calendar
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
        />
        <input
          ref={inputRef}
          id={idInput}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          value={teks}
          onChange={ubahTeks}
          onBlur={lepasFokus}
          onKeyDown={tombolDiInput}
          onClick={() => !terbuka && buka(false)}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-haspopup="dialog"
          aria-expanded={terbuka}
          aria-describedby={`${idInput}-petunjuk`}
          // h-14 mengikuti proporsi komponen rujukan. Di kolom tanggal ini
          // bukan cuma soal rasa: seluruh kolom adalah pemicu kalender, dan
          // kolom setinggi 44px membuat sasaran sentuhnya sempit di ponsel.
          className={`h-14 w-full rounded-xl border bg-surface-sub pl-11 pr-12 text-base tabular-nums text-ink transition-colors duration-200 placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-brand/40 ${
            error ? "border-bad/50" : "border-line hover:border-line-strong focus:border-brand/50"
          }`}
        />
        {/* tabIndex -1: tombol ini cuma jalan pintas tetikus. Kolom isiannya
            sendiri sudah membuka kalender lewat ArrowDown, jadi kalau tombol
            ini ikut bisa di-Tab, pengguna papan ketik melewati dua perhentian
            yang melakukan hal yang persis sama. */}
        <button
          type="button"
          aria-label={T.buka}
          tabIndex={-1}
          onClick={() => (terbuka ? setTerbuka(false) : buka(false))}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-brand-soft hover:text-brand-ink"
        >
          <ChevronDown
            size={17}
            className={`transition-transform duration-300 ${terbuka ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <p id={`${idInput}-petunjuk`} className="sr-only">{T.petunjuk}</p>

      {/* Baris gema: menuliskan bulannya dengan huruf. Kolom angka dd/mm/yyyy
          tetap ambigu bagi orang yang terbiasa mm/dd — baris ini membuat salah
          pilih langsung ketahuan tanpa perlu membuka kalendernya lagi. */}
      {gema && !error && <p className="mt-1.5 text-xs text-ink-faint">{gema}</p>}

      {terbuka && (
        /* Dua lapis dengan tugas terpisah: yang LUAR hanya menempatkan (tanpa
           transform apa pun, supaya pengukurannya jujur — lihat catatan di
           tempatkan()), yang DALAM yang beranimasi dan menggambar kotaknya. */
        <div
          ref={popupRef}
          style={{ position: "fixed", top: 0, left: 0, width: LEBAR_POPUP, zIndex: 70 }}
        >
          <div
            role="dialog"
            aria-label={T.pilihBulan}
            className="gjr-pop-in rounded-2xl border border-line bg-surface p-3 shadow-2xl shadow-forest-950/15"
          >
            {/* Kepala */}
            <div className="mb-2 flex items-center justify-between gap-1">
              <button
                type="button"
                aria-label={tampilan === "tahun" ? T.tahunLalu : T.bulanLalu}
                className={kelasNav}
                onClick={() =>
                  setKursor((k) =>
                    tampilan === "hari"
                      ? new Date(k.getFullYear(), k.getMonth() - 1, 1)
                      : new Date(k.getFullYear() - (tampilan === "tahun" ? 12 : 1), k.getMonth(), 1)
                  )
                }
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setTampilan((v) => (v === "hari" ? "bulan" : v === "bulan" ? "tahun" : "hari"))
                }
                className="flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {tampilan === "hari"
                  ? `${BULAN[lang][kursor.getMonth()]} ${kursor.getFullYear()}`
                  : tampilan === "bulan"
                    ? kursor.getFullYear()
                    : `${halamanTahun[0]} – ${halamanTahun[11]}`}
              </button>

              <button
                type="button"
                aria-label={tampilan === "tahun" ? T.tahunDepan : T.bulanDepan}
                className={kelasNav}
                onClick={() =>
                  setKursor((k) =>
                    tampilan === "hari"
                      ? new Date(k.getFullYear(), k.getMonth() + 1, 1)
                      : new Date(k.getFullYear() + (tampilan === "tahun" ? 12 : 1), k.getMonth(), 1)
                  )
                }
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Isi */}
            {tampilan === "hari" && (
              <>
                <div className="mb-1 grid grid-cols-7 gap-0.5">
                  {HARI[lang].map((h) => (
                    <div
                      key={h}
                      className="flex h-7 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* role=grid + tabindex berpindah (roving): seluruh kalender cuma
                    satu perhentian Tab, dan tanda panah yang berpindah antar
                    tanggal. Kalau ke-42 selnya masing-masing bisa di-Tab, keluar
                    dari kolom tanggal saja perlu 42 ketukan.

                    Selnya <div role="gridcell">, bukan <button>, justru karena
                    itu: focus trap di useModalA11y mengumpulkan SEMUA <button>
                    tanpa melihat tabindex, jadi 42 tombol akan mengacaukan
                    perhitungan elemen pertama/terakhirnya. */}
                <div ref={gridRef} role="grid" onKeyDown={tombolDiGrid} className="grid grid-cols-7 gap-0.5">
                  {selSatuBulan.map((d) => {
                    const iso = keIso(d);
                    const redup = d.getMonth() !== kursor.getMonth();
                    const mati = !dalamRentang(iso);
                    const terpilih = iso === value;
                    const aktif = iso === sorot;
                    return (
                      <div
                        key={iso}
                        role="gridcell"
                        data-aktif={aktif}
                        tabIndex={aktif ? 0 : -1}
                        aria-selected={terpilih}
                        aria-disabled={mati || undefined}
                        aria-label={`${d.getDate()} ${BULAN[lang][d.getMonth()]} ${d.getFullYear()}`}
                        onClick={() => pilih(iso)}
                        className={kelasSel(terpilih, redup, mati, iso === hariIniIso)}
                      >
                        {d.getDate()}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tampilan === "bulan" && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {BULAN_SINGKAT[lang].map((nama, i) => {
                  const terpilih =
                    tglTerpilih?.getMonth() === i && tglTerpilih?.getFullYear() === kursor.getFullYear();
                  return (
                    <button
                      key={nama}
                      type="button"
                      onClick={() => {
                        setKursor(new Date(kursor.getFullYear(), i, 1));
                        setTampilan("hari");
                      }}
                      className={`h-11 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                        terpilih
                          ? "bg-brand text-cream-50 dark:text-forest-950"
                          : "text-ink hover:bg-brand-soft hover:text-brand-ink"
                      }`}
                    >
                      {nama}
                    </button>
                  );
                })}
              </div>
            )}

            {tampilan === "tahun" && (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {halamanTahun.map((th) => {
                  const terpilih = tglTerpilih?.getFullYear() === th;
                  return (
                    <button
                      key={th}
                      type="button"
                      onClick={() => {
                        setKursor(new Date(th, kursor.getMonth(), 1));
                        setTampilan("bulan");
                      }}
                      className={`h-11 rounded-lg text-sm font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
                        terpilih
                          ? "bg-brand text-cream-50 dark:text-forest-950"
                          : "text-ink hover:bg-brand-soft hover:text-brand-ink"
                      }`}
                    >
                      {th}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Kaki */}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={() => pilih(hariIniIso)}
                disabled={!dalamRentang(hariIniIso)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {T.hariIni}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTeks("");
                  kirim("");
                  setTerbuka(false);
                  inputRef.current?.focus();
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {T.hapus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
