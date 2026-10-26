// src/components/ui/GlowingEffect.jsx
//
// Cahaya tepi yang mengikuti kursor. Diadaptasi dari GlowingEffect karya
// Aceternity (21st.dev), yang dipakai di situs Cursor.
//
// Tiga hal diubah dari aslinya, semuanya karena proyek ini bukan proyek shadcn:
//
//   1. TypeScript → JSX biasa, dan `cn()` diganti gabungan string. Proyek ini
//      tidak memasang clsx/tailwind-merge dan tidak akan memasangnya hanya
//      untuk satu berkas.
//   2. `animate()` dari `motion/react` diganti tween requestAnimationFrame
//      buatan sendiri. Menambah `motion` berarti ~50 kB gzip masuk ke bundel
//      hanya demi menganimasikan SATU angka sudut — tidak sepadan.
//   3. Warna gradiennya diganti dari merah muda/biru bawaan ke palet
//      sage + gold proyek ini. Warna aslinya cantik tapi milik merek lain.
//
// Seluruh CSS mask-nya ada di index.css §11, bukan sebagai arbitrary-variant
// Tailwind sepanjang ratusan karakter seperti versi aslinya.

import { memo, useCallback, useEffect, useRef } from "react";

// Empat sumber cahaya dalam satu putaran. Warnanya sengaja yang terang di
// palet — sage-300, gold-400, sage-500, sage-400 — karena ia harus terbaca di
// atas ink-950 dan forest-900 yang keduanya nyaris gelap.
const GRADIENT = `
  radial-gradient(circle, #8ec4a0 10%, #8ec4a000 20%),
  radial-gradient(circle at 40% 40%, #d4ae5a 5%, #d4ae5a00 15%),
  radial-gradient(circle at 60% 60%, #3f8862 10%, #3f886200 20%),
  radial-gradient(circle at 40% 60%, #6aab82 10%, #6aab8200 20%),
  repeating-conic-gradient(
    from 236.84deg at 50% 50%,
    #8ec4a0 0%,
    #d4ae5a 5%,
    #3f8862 10%,
    #6aab82 15%,
    #8ec4a0 20%
  )
`;

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * @param {number}  [spread=40]        lebar juring cahaya, dalam derajat
 * @param {number}  [proximity=64]     seberapa jauh di luar kotak kursor masih dianggap dekat
 * @param {number}  [inactiveZone=0.2] radius mati di tengah, 0–1 dari sisi terpendek
 * @param {number}  [borderWidth=1.5]  tebal cincin, px
 * @param {number}  [duration=900]     lama tween sudut, ms
 * @param {boolean} [disabled=false]
 */
export const GlowingEffect = memo(function GlowingEffect({
  spread = 40,
  proximity = 64,
  inactiveZone = 0.2,
  borderWidth = 1.5,
  duration = 900,
  disabled = false,
  className = "",
}) {
  const ref     = useRef(null);
  const rafRef  = useRef(0);
  const tweenRef = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });

  // Tween sudut sendiri, pengganti animate() dari motion.
  // easeOutExpo: cepat di awal lalu melambat panjang — kurva yang sama
  // rasanya dengan cubic-bezier(.16,1,.3,1) yang dipakai versi aslinya.
  const tweenTo = useCallback((el, from, to) => {
    cancelAnimationFrame(tweenRef.current);

    if (duration <= 0 || prefersReducedMotion()) {
      el.style.setProperty("--gjr-glow-start", String(to));
      return;
    }

    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.style.setProperty("--gjr-glow-start", String(from + (to - from) * eased));
      if (p < 1) tweenRef.current = requestAnimationFrame(step);
    };
    tweenRef.current = requestAnimationFrame(step);
  }, [duration]);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const node = ref.current;
      if (!node) return;

      const { left, top, width, height } = node.getBoundingClientRect();
      // Kartu yang sedang tidak tampil (mis. di tab tersembunyi) memberi kotak
      // 0×0; menghitung sudut dari situ menghasilkan NaN yang lalu menempel di
      // CSS variable dan cahayanya mati permanen sampai halaman dimuat ulang.
      if (width === 0 || height === 0) return;

      const x = e?.clientX ?? lastPos.current.x;
      const y = e?.clientY ?? lastPos.current.y;
      if (e) lastPos.current = { x, y };

      const cx = left + width / 2;
      const cy = top + height / 2;

      // Zona mati di tengah: tanpa ini, sudutnya berputar liar saat kursor
      // melintas tepat di titik pusat, karena atan2 di dekat nol sangat peka.
      if (Math.hypot(x - cx, y - cy) < 0.5 * Math.min(width, height) * inactiveZone) {
        node.style.setProperty("--gjr-glow-active", "0");
        return;
      }

      const near =
        x > left - proximity && x < left + width + proximity &&
        y > top - proximity && y < top + height + proximity;

      node.style.setProperty("--gjr-glow-active", near ? "1" : "0");
      if (!near) return;

      const current = parseFloat(node.style.getPropertyValue("--gjr-glow-start")) || 0;
      const target  = (180 * Math.atan2(y - cy, x - cx)) / Math.PI + 90;

      // Ambil jalur terpendek melewati 0°/360°. Tanpa ini, berpindah dari 350°
      // ke 10° membuat juringnya berputar hampir satu lingkaran penuh ke arah
      // yang salah alih-alih bergeser 20°.
      const delta = ((target - current + 180) % 360) - 180;
      tweenTo(node, current, current + delta);
    });
  }, [inactiveZone, proximity, tweenTo]);

  useEffect(() => {
    if (disabled) return undefined;

    const onScroll = () => handleMove();
    const onPointer = (e) => handleMove(e);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.body.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(tweenRef.current);
      window.removeEventListener("scroll", onScroll);
      document.body.removeEventListener("pointermove", onPointer);
    };
  }, [handleMove, disabled]);

  if (disabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`gjr-glow ${className}`}
      style={{
        "--gjr-glow-spread": spread,
        "--gjr-glow-width": `${borderWidth}px`,
        "--gjr-glow-start": "0",
        "--gjr-glow-active": "0",
        "--gjr-glow-gradient": GRADIENT,
      }}
    />
  );
});

export default GlowingEffect;
