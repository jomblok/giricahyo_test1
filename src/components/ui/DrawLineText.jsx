// src/components/ui/DrawLineText.jsx
//
// Teks yang menggambar dirinya sendiri: garis luar tiap huruf ditarik dulu,
// baru isinya diwarnai. Diadaptasi dari DrawLineText (21st.dev).
//
// Aslinya memakai GSAP + @gsap/react. Di sini tidak: seluruh efeknya cuma
// stroke-dashoffset dan fill-opacity, dua properti yang sudah bisa dianimasikan
// Web Animations API bawaan peramban. Menambah ~90 kB gzip untuk satu judul
// tidak sepadan — pertimbangan yang sama dipakai saat menolak `motion` untuk
// tween GlowingEffect.
//
// Empat perbedaan penting dari versi aslinya, semuanya karena versi aslinya
// akan rusak di halaman ini:
//
//   1. MENUNGGU FONT SIAP sebelum mengukur. Fraunces dimuat dari Google Fonts
//      dengan display=swap, jadi render pertama PASTI memakai serif cadangan.
//      Versi asli mengukur saat mount, mendapat lebar font cadangan, lalu font
//      aslinya masuk dan teksnya tidak lagi muat di kotak SVG yang terlanjur
//      dihitung — terpotong atau menggantung keluar.
//
//   2. UKURAN HURUF DIBACA DARI CSS, bukan dari prop angka. Judul halaman login
//      memakai clamp(2.5rem, 4.4vw, 4rem) sehingga ikut lebar layar; angka
//      tetap seperti di versi asli tidak akan pernah responsif. Diukur ulang
//      saat jendela berubah ukuran.
//
//   3. TERBACA OLEH PEMBACA LAYAR. Versi asli memecah teks menjadi satu <text>
//      per karakter tanpa nama aksesibilitas apa pun — judul utama halaman
//      berubah jadi 48 simpul tak bermakna. Di sini SVG-nya diberi role="img"
//      dan aria-label berisi kalimat utuh, dan pecahan hurufnya disembunyikan.
//
//   4. GAGAL DALAM KEADAAN TERBACA. Teksnya dirender TERISI PENUH sejak awal;
//      keadaan "belum digambar" baru dipasang JavaScript sesaat sebelum
//      animasinya benar-benar berjalan. Kalau pengukuran gagal, font tidak
//      pernah siap, atau peramban membatasi animasi di tab latar belakang,
//      yang tersisa adalah judul biasa yang terbaca — bukan judul tak terlihat.
//      Pelajaran ini mahal di proyek ini: animasi masuk yang menahan opacity 0
//      pernah membuat form login lenyap sama sekali.

import { useLayoutEffect, useRef, useState } from "react";

function reduced() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function DrawLineText({
  text,
  color = "currentColor",
  strokeWidth = 1,
  letterSpacing = 0,
  wordSpacing = 0.28,   // dikali ukuran huruf
  drawDuration = 1600,
  stagger = 55,
  fillDuration = 520,
  delay = 0,
  className = "",
  ...props
}) {
  const svgRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const chars = Array.from(text);

  // Pengukuran + animasi. useLayoutEffect supaya penempatan huruf terjadi
  // sebelum cat pertama; kalau tidak, hurufnya sempat tampak bertumpuk di
  // pojok kiri sebelum ditata.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    let cancelled = false;
    const animations = [];

    // Menata + mengukur. Aman dipanggil berkali-kali, dan TIDAK menyentuh
    // animasi — dipisahkan dari play() justru karena harus dijalankan segera
    // (sebelum cat pertama) sementara play() harus menunggu font siap.
    // Tanpa pemisahan ini, seluruh huruf menumpuk di x=0 selama menunggu
    // document.fonts.ready yang asinkron.
    function layout() {
      if (cancelled || !svgRef.current) return null;
      const node = svgRef.current;
      const items = Array.from(node.querySelectorAll("text"));
      if (items.length === 0) return null;

      // Ukuran huruf diambil dari CSS yang berlaku pada SVG-nya, sehingga
      // clamp()/vw di kelas Tailwind tetap bekerja.
      const fs = parseFloat(getComputedStyle(node).fontSize) || 16;

      let x = 0;
      let maxH = 0;
      items.forEach((el, i) => {
        el.setAttribute("x", `${x}`);
        el.setAttribute("y", `${fs}`);
        el.style.fontSize = `${fs}px`;
        el.style.strokeWidth = `${strokeWidth}px`;

        const r = el.getBoundingClientRect();
        if (r.height > maxH) maxH = r.height;

        // getComputedTextLength(), BUKAN getBoundingClientRect().width.
        //
        // Keduanya terdengar sama tapi mengukur hal yang berbeda:
        //   getBoundingClientRect  → kotak TINTA, seluas huruf itu terlihat
        //   getComputedTextLength  → lebar MAJU, sejauh mana pena bergeser
        //
        // Untuk huruf yang tintanya menjulur keluar dari kotak majunya, dua
        // angka itu berbeda jauh — dan huruf berikutnya diletakkan di tempat
        // yang salah. Terukur pada kata "menjadi" berhuruf Libre Baskerville:
        // ekor huruf j menjulur ~8px ke KIRI dari titik penanya, sehingga
        //   n → j  berjarak  -8px  (j menabrak n)
        //   j → a  berjarak  +8px  (menganga sesudah j)
        // dan kata itu terbaca "men j adi". Seluruh pasangan huruf lain
        // berjarak 0px, jadi cacatnya hanya muncul pada huruf berekor —
        // itulah kenapa ia lolos sekian lama.
        //
        // Lebar maju juga yang dipakai peramban untuk menata teks biasa, jadi
        // hasilnya sekarang sama dengan kalau kalimat ini ditulis sebagai satu
        // <text> utuh (dikurangi kerning, yang memang hilang begitu tiap huruf
        // jadi elemennya sendiri — harga yang harus dibayar animasi per-huruf).
        //
        // Spasi tetap perlu jalur sendiri: elemen <text> yang isinya hanya
        // spasi dipangkas peramban dan panjangnya jadi 0.
        const maju = el.getComputedTextLength();
        x += (maju === 0 ? wordSpacing * fs : maju)
           + (i === items.length - 1 ? 0 : letterSpacing);
      });

      setBox({ width: x, height: maxH || fs * 1.2 });
      return items;
    }

    function play() {
      const items = layout();
      if (!items) return;

      const visible = items.filter((el) => el.getBoundingClientRect().width !== 0);
      if (reduced() || visible.length === 0) return;

      // Keadaan "belum digambar" BARU dipasang di sini — sepersekian detik
      // sebelum animasinya jalan. Sebelum titik ini teksnya terisi penuh dan
      // terbaca, sehingga tidak ada jalur kode yang bisa meninggalkannya kosong.
      visible.forEach((el, i) => {
        // getComputedTextLength() memberi lebar maju teks, bukan panjang jalur
        // garis luarnya yang berliku — untuk serif seperti Fraunces jalurnya
        // jauh lebih panjang. Dikali 8 supaya garis putusnya pasti lebih
        // panjang dari jalurnya; kalau kurang, hurufnya tampak sudah tergambar
        // sejak awal. Angka ini memang perkiraan, bukan hasil ukur.
        const len = el.getComputedTextLength() * 8;
        el.style.strokeDasharray = `${len}px`;
        el.style.strokeDashoffset = `${len}px`;
        el.style.fillOpacity = "0";

        animations.push(el.animate(
          [{ strokeDashoffset: `${len}px` }, { strokeDashoffset: "0px" }],
          { duration: drawDuration, delay: delay + i * stagger, easing: "linear", fill: "forwards" },
        ));
      });

      const drawEnds = delay + (visible.length - 1) * stagger + drawDuration;
      visible.forEach((el, i) => {
        animations.push(el.animate(
          [{ fillOpacity: 0 }, { fillOpacity: 1 }],
          {
            duration: fillDuration,
            // Isian menyusul dari tengah ke tepi, bukan berurutan dari kiri:
            // urutan kiri-ke-kanan yang kedua kalinya terbaca sebagai
            // pengulangan, sedangkan dari tengah terasa seperti penutup.
            delay: drawEnds - drawDuration * 0.35
                 + Math.abs(i - (visible.length - 1) / 2) * 14,
            easing: "cubic-bezier(.7,0,.84,0)",
            fill: "forwards",
          },
        ));
      });
    }

    // Tata SEGERA dengan font apa pun yang sedang berlaku — supaya huruf tidak
    // pernah terlihat menumpuk, meski sesaat.
    layout();

    // Lalu tata ulang dan mainkan setelah font sungguhan tiba.
    // document.fonts.ready menunggu SEMUA font selesai dimuat. Kalau API-nya
    // tidak ada (peramban lama), langsung mainkan — geometrinya mungkin
    // memakai font cadangan, tapi teksnya tetap tampil dan terbaca.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(play);
    } else {
      play();
    }

    // Ukuran huruf ikut lebar layar (clamp/vw), jadi tata letaknya harus
    // dihitung ulang saat jendela berubah. Animasinya tidak diputar ulang —
    // yang sudah selesai tetap dalam keadaan akhirnya.
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      animations.forEach((a) => a.cancel());
    };
  }, [text, strokeWidth, letterSpacing, wordSpacing, drawDuration, stagger, fillDuration, delay]);

  return (
    // role="img" + aria-label: pembaca layar menyebut kalimatnya sekali, utuh,
    // alih-alih mengeja pecahan <text> satu per satu.
    <svg
      {...props}
      ref={svgRef}
      role="img"
      aria-label={text}
      className={className}
      style={{
        userSelect: "none",
        overflow: "visible",
        display: "block",
        width: box.width ? `${box.width}px` : "100%",
        height: box.height ? `${box.height * 1.03}px` : "1.1em",
        ...props.style,
      }}
    >
      {chars.map((char, i) => (
        <text
          key={`${char}-${i}`}
          aria-hidden="true"
          style={{
            stroke: color,
            fill: color,
            // Terisi penuh sejak awal. Lihat catatan nomor 4 di kepala berkas.
            fillOpacity: 1,
            strokeWidth: `${strokeWidth}px`,
          }}
        >
          {char}
        </text>
      ))}
    </svg>
  );
}
