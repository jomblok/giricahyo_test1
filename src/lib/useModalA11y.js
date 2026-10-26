// src/lib/useModalA11y.js
//
// Perilaku dasar sebuah dialog yang selama ini tidak dimiliki modal-modal di
// proyek ini. Audit sebelum berkas ini dibuat, atas 10 modal yang ada:
//
//   Escape untuk menutup :  2 / 10
//   focus trap           :  0 / 10
//   kunci scroll latar   :  2 / 10
//   kembalikan fokus     :  1 / 10
//
// Yang paling merugikan adalah focus trap: tanpa itu, menekan Tab di dalam
// modal memindahkan fokus ke tombol-tombol halaman DI BELAKANG lapisan gelap.
// Tombolnya tidak terlihat tapi tetap bisa ditekan Enter — pengguna keyboard
// bisa memicu aksi yang sama sekali tidak ia lihat. Dan karena fokus tidak
// pernah dikembalikan setelah modal ditutup, ia lalu terlempar ke awal
// dokumen dan harus meniti ulang seluruh halaman.
//
// Ditulis sebagai hook tersendiri, bukan diambil dari pustaka dialog, karena
// satu-satunya bagian shadcn/ui yang benar-benar dibutuhkan proyek ini adalah
// perilaku ini — sementara ongkosnya (components.json, TypeScript, cn(), dan
// token semantik yang akan meratakan palet forest/sage/gold) tidak sebanding.

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

// ── Kunci scroll, dihitung bertingkat ───────────────────────────────────────
// Modal bisa bertumpuk (mis. Drilldown terbuka di atas dasbor, lalu Sertifikat
// di atasnya). Kalau tiap modal menulis dan mengembalikan style <body> sendiri,
// yang tutup duluan akan membuka kunci untuk yang masih terbuka. Karena itu
// yang disimpan cuma satu nilai asli, dan kuncinya dibuka hanya ketika modal
// terakhir sudah pergi.
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll() {
  if (lockCount === 0) {
    const body = document.body;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;

    // Menyembunyikan scrollbar membuat halaman melebar selebar scrollbar itu,
    // dan seluruh isi di baliknya tersentak ke kanan tepat saat modal muncul.
    // Lebarnya diganti jadi padding supaya lebar halaman tidak berubah.
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    if (sbw > 0) {
      const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + sbw}px`;
    }
    body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

// ── Tumpukan modal aktif ────────────────────────────────────────────────────
// Escape hanya boleh menutup modal PALING ATAS. Tanpa ini, satu tekan Escape
// menutup seluruh tumpukan sekaligus karena semua pendengarnya ikut menyala.
const stack = [];

/**
 * @param {{current: HTMLElement|null}} containerRef  pembungkus isi modal
 * @param {() => void} [onClose]  dipanggil saat Escape; kalau tidak diberikan,
 *        Escape diabaikan (modal yang memang tidak boleh ditutup begitu saja)
 * @param {boolean} [active=true]
 */
export function useModalA11y(containerRef, onClose, active = true) {
  // onClose disimpan di ref dan TIDAK dijadikan dependency efek.
  //
  // Hampir semua pemanggil menuliskannya sebagai arrow inline
  // (`onClose={() => setOpen(false)}`), yang menghasilkan fungsi baru pada
  // setiap render. Kalau ia masuk daftar dependency, seluruh efek ini dibongkar
  // dan dipasang ulang setiap kali komponennya render — artinya fokus dilempar
  // balik ke elemen pertama pada SETIAP ketikan di dalam form modal, dan
  // hitungan kunci scroll naik-turun terus-menerus. Ref-nya diperbarui tiap
  // render sehingga pemanggilnya tetap selalu mendapat fungsi terbaru.
  //
  // Penugasannya diletakkan di dalam efek tanpa daftar dependency (jalan
  // setelah SETIAP render), bukan langsung di badan komponen: menulis ke
  // ref selama render adalah efek samping yang bisa terjadi dua kali atau
  // dibuang oleh React saat render diulang.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!active || !node) return undefined;

    // Disimpan SEBELUM fokus dipindahkan ke dalam modal.
    const previouslyFocused = document.activeElement;
    const token = {};
    stack.push(token);
    lockScroll();

    // getClientRects(), BUKAN offsetParent: untuk elemen `position: fixed`
    // offsetParent selalu null, sehingga pemeriksaan "terlihat" gaya lama
    // akan membuang seluruh isi modal — yang justru selalu fixed di sini.
    const visibleFocusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE))
        .filter((el) => el.getClientRects().length > 0);

    // Fokus awal masuk ke dalam modal. Tanpa ini pembaca layar tetap membaca
    // halaman di belakangnya dan pengguna keyboard tidak tahu ada yang terbuka.
    const first = node.querySelector("[data-autofocus]") || visibleFocusables()[0];
    if (first) {
      first.focus();
    } else {
      node.tabIndex = -1;
      node.focus();
    }

    function handleKeyDown(e) {
      // Hanya modal teratas yang menanggapi.
      if (stack[stack.length - 1] !== token) return;

      if (e.key === "Escape" && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const items = visibleFocusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = items[0];
      const lastEl  = items[items.length - 1];

      // Kalau fokus entah bagaimana sudah di luar modal (mis. diklik ke latar),
      // tarik kembali ke dalam alih-alih membiarkannya melanjutkan ke halaman.
      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        firstEl.focus();
        return;
      }

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      const i = stack.indexOf(token);
      if (i !== -1) stack.splice(i, 1);
      unlockScroll();

      // Kembalikan fokus ke tempat asalnya — tombol yang tadi membuka modal —
      // supaya pengguna keyboard melanjutkan dari posisi yang sama, bukan dari
      // awal dokumen. isConnected: elemennya bisa saja sudah dilepas dari DOM
      // (mis. baris tabel yang terhapus oleh aksi di dalam modal itu sendiri).
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, active]);
}

export default useModalA11y;
