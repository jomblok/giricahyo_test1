// src/components/ui/ModalPortal.jsx
//
// Memindahkan isinya ke <body>, keluar dari pohon DOM tempat ia ditulis.
//
// KENAPA PERLU: overlay `position: fixed` seharusnya mengukur diri terhadap
// layar — tapi itu hanya berlaku kalau TIDAK ada satu pun leluhurnya yang
// memiliki `transform`, `filter`, `backdrop-filter`, `perspective`, atau
// `contain` non-`none`. Salah satu saja dari properti itu mengubah leluhur
// tersebut menjadi containing block baru, dan overlay-nya mendadak mengukur
// diri terhadap kotak leluhur itu: latar gelapnya cuma menutupi sebagian
// layar dan panelnya melenceng.
//
// Ini bukan bahaya teoretis. Sudah terjadi dua kali di proyek ini:
//   1. <header> Topbar yang ber-backdrop-blur mengurung modal kamera
//   2. Animasi transisi halaman (translateY 6px) pada <main> mengurung modal
//      di halaman Sertifikat
//
// Keduanya sudah diperbaiki di sumbernya, tapi perbaikan semacam itu rapuh —
// cukup seseorang menambahkan `backdrop-blur` pada satu pembungkus dan
// seluruh modal di bawahnya rusak lagi, tanpa peringatan apa pun. Dengan
// diportal ke <body>, modal tidak punya leluhur selain <body> sehingga
// kebal terhadap apa pun yang terjadi di dalam pohon halaman.

import { useRef } from "react";
import { createPortal } from "react-dom";
import { useModalA11y } from "../../lib/useModalA11y";

// Perilaku dialog (Escape, focus trap, kunci scroll, kembalikan fokus)
// dipasang DI SINI, bukan di masing-masing modal, karena setiap modal di
// proyek ini sudah melewati komponen ini. Satu tempat, sepuluh modal — dan
// modal berikutnya ikut mendapatkannya tanpa perlu diingat-ingat.
//
// `onClose` opsional: kalau tidak diberikan, Escape diabaikan tapi jebakan
// fokus dan kunci scroll tetap berlaku.
export function ModalPortal({ children, onClose }) {
  const containerRef = useRef(null);
  useModalA11y(containerRef, onClose);

  if (typeof document === "undefined") return null;

  // Pembungkus <div> ini diperlukan sebagai batas jebakan fokus — harus ada
  // satu simpul yang bisa ditanyai "apakah elemen yang sedang fokus ada di
  // dalammu?". Ia sengaja tanpa kelas apa pun: begitu ia punya `transform`
  // atau `backdrop-filter`, ia sendiri berubah jadi containing block dan
  // merusak persis hal yang dijelaskan panjang lebar di atas.
  return createPortal(<div ref={containerRef}>{children}</div>, document.body);
}

export default ModalPortal;
