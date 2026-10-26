// src/components/ui/Velaris.jsx
//
// Latar gradien WebGL beranimasi (simplex noise + vignette + grain).
// Diadaptasi dari komponen "Velaris" (aslinya TSX + shadcn) agar cocok dengan
// proyek ini: JSX biasa, tanpa `cn()`/clsx, tanpa alias `@/`.
//
// Selain porting, beberapa hal diperbaiki dari versi aslinya — masing-masing
// dijelaskan di tempatnya:
//   1. shader yang gagal dikompilasi kini melapor, tidak diam-diam hitam
//   2. sumber daya WebGL benar-benar dilepas saat unmount
//   3. prop `colors` tidak lagi memicu pembuatan ulang konteks tiap render
//   4. menghormati prefers-reduced-motion
//   5. beban render ditekan untuk ponsel kelas bawah
//   6. presisi shader punya cadangan untuk GPU yang tidak mendukung highp

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Tidak semua GPU ponsel mendukung highp di fragment shader. Kalau dipaksa,
// shader gagal dikompilasi dan layarnya kosong — jadi presisinya dipilih saat
// runtime sesuai kemampuan perangkat.
const FRAG = (precision) => `
precision ${precision} float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;

  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;

  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Palet bawaan aslinya hijau terang di atas hitam. Di sini diganti ke palet
// merek Giricahyo (forest / sage / gold) supaya menyatu dengan sisa aplikasi.
const DEFAULT_COLORS = ["#2f6e51", "#3f8862", "#15392e", "#c89b3c"];

function hexToRgb(hex) {
  let h = String(hex).replace("#", "").trim();
  // Bentuk singkat (#abc) ikut diterima — versi aslinya diam-diam menghasilkan
  // NaN untuk ini, dan NaN pada uniform membuat seluruh kanvas jadi hitam.
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function Velaris({
  bg = "#0e2a21",
  colors = DEFAULT_COLORS,
  speed = 2.0,
  grain = 0.3,
  height = "100vh",
  className = "",
  children,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // `colors` biasanya dioper sebagai literal array baru tiap render. Kalau
  // array itu dipakai langsung sebagai dependency (seperti versi aslinya),
  // useEffect menganggapnya selalu berubah → konteks WebGL dibuat ulang pada
  // SETIAP render. Browser membatasi jumlah konteks aktif (± 16), jadi lama
  // kelamaan kanvasnya berhenti tampil. Dibandingkan sebagai string saja.
  const colorKey = colors.join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    // Kalau WebGL tidak tersedia, komponen ini diam saja dan kanvasnya tetap
    // transparan — lapisan CSS di belakangnya yang tampil. Halaman tidak boleh
    // bergantung pada WebGL untuk bisa dibaca.
    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "low-power" }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return undefined;

    const precision =
      gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision > 0
        ? "highp"
        : "mediump";

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      // Versi aslinya tidak memeriksa ini sama sekali: shader yang gagal
      // dikompilasi tetap dipasang, dan hasilnya layar hitam tanpa satu pun
      // petunjuk di console.
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Velaris — shader gagal dikompilasi:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG(precision));
    if (!vs || !fs) return undefined;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Velaris — program gagal di-link:", gl.getProgramInfoLog(program));
      return undefined;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const locs = {
      res: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      grain: gl.getUniformLocation(program, "u_grain"),
      colors: gl.getUniformLocation(program, "u_colors"),
      bg: gl.getUniformLocation(program, "u_bg"),
    };

    // Dihitung sekali, bukan tiap frame. Versi aslinya membuat Float32Array
    // baru 60 kali per detik hanya untuk 12 angka yang tidak pernah berubah.
    const colorBuf = new Float32Array(colors.slice(0, 4).flatMap(hexToRgb));
    const bgRgb = hexToRgb(bg);

    // Shader ini menghitung tiga simplex noise untuk SETIAP piksel. Pada layar
    // retina, DPR 2 berarti empat kali lipat piksel yang harus dihitung — di
    // ponsel kelas bawah (yang justru dipakai petugas di lapangan) itu terasa
    // sebagai panas dan baterai terkuras. Karena gambarnya memang kabur dan
    // tidak punya detail tajam, 1.5 sudah tidak terbedakan mata.
    const maxDpr = window.matchMedia("(max-width: 768px)").matches ? 1 : 1.5;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.max(1, Math.floor(container.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(container.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (timeSeconds) => {
      gl.uniform2f(locs.res, canvas.width, canvas.height);
      gl.uniform1f(locs.time, timeSeconds);
      gl.uniform1f(locs.grain, grain);
      gl.uniform3f(locs.bg, bgRgb[0], bgRgb[1], bgRgb[2]);
      gl.uniform3fv(locs.colors, colorBuf);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let raf = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      // Tetap tampil indah, hanya tidak bergerak — satu frame diam. Latar yang
      // beranimasi tanpa henti persis yang dihindari orang dengan vertigo atau
      // mabuk gerak, dan mereka tidak seharusnya kehilangan tampilannya.
      draw(12.0);
    } else {
      const loop = (t) => {
        draw(t * 0.001 * speed);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      // Versi aslinya hanya menghentikan rAF dan ResizeObserver — program,
      // shader, dan buffer-nya dibiarkan menggantung. Konteks WebGL jumlahnya
      // dibatasi browser, jadi mount/unmount berulang (pindah halaman bolak-
      // balik) lama-lama membuat kanvasnya menyerah tanpa error apa pun.
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // TIDAK memanggil loseContext() di sini. canvas.getContext() selalu
      // mengembalikan konteks YANG SAMA untuk satu elemen kanvas, sedangkan
      // React StrictMode menjalankan effect dua kali saat development
      // (pasang → bersihkan → pasang lagi). Konteks yang sudah "hilang" tidak
      // bisa dihidupkan lagi, jadi pemanggilan itu membunuh kanvasnya sendiri
      // pada pemasangan kedua — terbukti: isContextLost() true dan seluruh
      // piksel kosong. Menghapus program/shader/buffer sudah cukup; sisa
      // konteksnya ikut dilepas saat elemen kanvasnya dibuang.
    };
    // colorKey menggantikan `colors` — lihat penjelasan di atas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg, colorKey, speed, grain]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={["relative w-full overflow-hidden", className].filter(Boolean).join(" ")}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
