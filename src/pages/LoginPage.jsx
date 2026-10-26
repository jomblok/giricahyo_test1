import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { publicApi } from "../lib/api";
import { formatNumber } from "../lib/format";
import Velaris from "../components/ui/Velaris";
import GlowingEffect from "../components/ui/GlowingEffect";
import FloatingField from "../components/ui/FloatingField";
import DrawLineText from "../components/ui/DrawLineText";
import HakCipta from "../components/HakCipta";

const ROLE_DOT = {
  admin:  "bg-cream-50",
  farmer: "bg-sage-400",
  buyer:  "bg-gold-500",
};

// Akun demo untuk mengisi form dengan sekali klik.
//
// Daftar ini SENGAJA hanya memuat akun yang datanya berisi. Sebelumnya di sini
// ada tujuh petani (Slamet, Wartini, Darmaji, …) yang setelah data survei
// sungguhan diimpor ternyata tidak memiliki satu pohon pun — siapa pun yang
// mengklik salah satunya langsung mendarat di dasbor kosong dan mengira
// aplikasinya rusak. Akun-akun itu masih ada dan tetap bisa login manual;
// yang ditampilkan di sini hanya yang memang layak dipakai untuk demo.
//
// `short` dipakai sebagai label chip; nama panjangnya muncul sebagai tooltip.
// Lima chip bernama lengkap akan membungkus jadi tiga baris, dan panel demo
// kembali mendominasi form yang seharusnya jadi tokoh utama di sisi ini.
const DEMO_ACCOUNTS = [
  { short: "Admin",      name: "Koperasi Giricahyo", email: "admin@giricahyo.id", password: "admin123",  role: "admin",  desc: "Akses penuh seluruh dasbor" },
  { short: "Lokasi 1",   name: "Petani Lokasi 1",    email: "l1@giricahyo.id",    password: "petani123", role: "farmer", desc: "Petak survei Lokasi 1" },
  { short: "Lokasi 2",   name: "Petani Lokasi 2",    email: "l2@giricahyo.id",    password: "petani123", role: "farmer", desc: "Petak survei Lokasi 2" },
  { short: "Kelompok 3", name: "Kelompok 3",         email: "l3@giricahyo.id",    password: "petani123", role: "farmer", desc: "Petak survei Lokasi 3" },
  { short: "Buyer",      name: "PT Hijau Lestari",   email: "buyer@giricahyo.id", password: "buyer123",  role: "buyer",  desc: "Pendukung / pembeli karbon" },
];

// Panel akun demo: MENYALA di mode pengembangan, MATI di build produksi.
//
// Dulu kebalikannya — menyala di mana pun kecuali seseorang ingat menyetel
// VITE_SHOW_DEMO=false. Akibatnya build produksi mengirim email DAN kata sandi
// admin di atas ke setiap pengunjung, di dalam berkas JavaScript yang bisa
// dibaca siapa saja, lengkap dengan tombol sekali-klik untuk memakainya.
// Pengaman yang bergantung pada "jangan lupa" pasti suatu hari terlupa.
//
// Kini produksi harus memintanya secara sadar dengan VITE_SHOW_DEMO=true
// (misalnya deploy khusus pameran). Bila tidak diminta, Vite mengganti
// ekspresi ini dengan `false` saat build, cabang JSX-nya dibuang, dan
// DEMO_ACCOUNTS tidak ikut ke bundel sama sekali — terverifikasi dengan
// mencari "admin123" di dist/.
const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO
  ? import.meta.env.VITE_SHOW_DEMO === "true"
  : import.meta.env.DEV;

// Dibekukan di lingkup modul: kalau ditulis sebagai literal inline di JSX,
// tiap render menghasilkan array baru dan Velaris akan membangun ulang konteks
// WebGL-nya terus-menerus.
const VELARIS_COLORS = ["#2f6e51", "#3f8862", "#15392e", "#c89b3c"];

/**
 * Latar lingkaran tahun pohon — DIGAMBAR DARI DATA, bukan dari pola buatan.
 *
 * Lingkaran tahun adalah rekaman pertumbuhan sebuah pohon, dan pertumbuhan
 * itulah yang diukur aplikasi ini (diameter → biomassa → karbon). Jadi kalau
 * latar ini berbentuk lingkaran tahun, jaraknya seharusnya berarti sesuatu.
 *
 * Versi sebelumnya memakai `Math.sin(i * 1.7)` — pola yang terlihat organik
 * tetapi tidak menyatakan apa pun; cincin yang sama akan muncul untuk desa mana
 * pun, dengan data apa pun, bahkan tanpa data sama sekali.
 *
 * Sekarang: SATU CINCIN = SATU SPESIES, dan jarak antarcincin mengikuti porsi
 * spesies itu terhadap total CO₂ komunitas. Jumlah cincinnya sama dengan angka
 * "SPESIES" yang tertulis di bawahnya, dan cincin paling tebal di luar adalah
 * penyumbang karbon terbesar. Latar ini berhenti jadi hiasan dan menjadi
 * potret hutannya sendiri — kalau datanya berubah, gambarnya ikut berubah.
 *
 * KENAPA AKAR KUADRAT, bukan porsi langsung. Sebaran karbonnya sangat timpang:
 * satu spesies (Beringin) memegang 61% sementara sembilan spesies terkecil
 * bersama-sama tidak sampai 2%. Dipetakan apa adanya, hasilnya satu cincin
 * raksasa dan delapan belas garis rambut yang saling menempel — datanya benar
 * tapi gambarnya tidak terbaca sebagai penampang kayu. Akar kuadrat memampatkan
 * ujung atasnya sambil MEMPERTAHANKAN URUTAN dan perbandingan kasarnya, jadi
 * yang besar tetap terlihat besar tanpa menelan yang lain. Ini pilihan
 * penyajian yang disengaja, bukan pembulatan yang menyembunyikan sesuatu.
 *
 * Selama data belum tiba (atau gagal diambil), dipakai pola cadangan yang
 * jaraknya tidak seragam — lingkaran tahun asli memang melebar di musim basah
 * dan merapat di musim kering, dan cincin berjarak sama justru terbaca sebagai
 * grafis buatan.
 */
function GrowthRings({ shares }) {
  const rings = [];
  const daftar = Array.isArray(shares) && shares.length > 1 ? shares : null;
  const maksimum = daftar ? Math.max(...daftar) : 1;

  // Jumlah cincin: sebanyak spesies yang ada, atau 26 untuk pola cadangan.
  const jumlah = daftar ? daftar.length : 26;

  let r = 26;
  for (let i = 0; i < jumlah; i += 1) {
    // 12px jarak dasar supaya cincin paling tipis pun tetap terpisah, ditambah
    // sampai 30px menurut porsinya. Rentang 12–42px kira-kira sama dengan pola
    // lama (8–25px) tapi dengan sumber yang bermakna.
    const step = daftar
      ? 12 + 30 * Math.sqrt(daftar[i] / maksimum)
      : 13 + Math.sin(i * 1.7) * 5 + (i % 4) * 2.5;
    r += step;
    rings.push(
      <circle
        key={i}
        cx="0"
        cy="0"
        r={r}
        fill="none"
        stroke="currentColor"
        // Cincin yang porsinya besar digambar lebih tebal — di penampang kayu
        // sungguhan, tahun yang subur memang meninggalkan garis lebih tegas.
        strokeWidth={daftar ? 0.8 + 1.6 * Math.sqrt(daftar[i] / maksimum) : (i % 5 === 0 ? 1.5 : 0.8)}
        // Makin ke luar makin samar supaya menyatu dengan latar, tidak
        // membentuk lingkaran tegas yang merebut perhatian dari teks.
        strokeOpacity={Math.max(0.04, 0.34 - i * (0.3 / jumlah))}
      />
    );
  }
  return <g className="gjr-rings">{rings}</g>;
}

/**
 * Angka sungguhan dari basis data, diambil lewat GET /api/public/stats.
 *
 * Menggantikan tiga baris "fitur" ikon+judul+deskripsi yang dulu mengisi panel
 * ini. Daftar fitur semacam itu bisa ditulis siapa saja tentang aplikasi apa
 * saja; tiga angka yang benar-benar berasal dari survei lapangan tidak bisa.
 *
 * Kalau permintaannya gagal — API mati, jaringan putus — baris ini TIDAK
 * dirender sama sekali. Sengaja tidak menampilkan nol atau tanda hubung:
 * halaman login adalah wajah publik sistem ini, dan "0 POHON" adalah
 * pernyataan yang salah, bukan sekadar tampilan yang kosong.
 */
function LiveStats({ stats, className = "" }) {
  if (!stats) return null;

  const items = [
    { value: formatNumber(stats.total_trees),         label: "Pohon terdata" },
    { value: formatNumber(stats.total_co2_kg / 1000), label: "Ton CO₂e" },
    { value: formatNumber(stats.total_species),       label: "Spesies" },
  ];

  return (
    <dl className={`flex gap-10 ${className}`}>
      {items.map(({ value, label }) => (
        <div key={label}>
          {/* tabular-nums: tanpa ini lebar tiap digit berbeda-beda dan ketiga
              angka tidak pernah benar-benar sejajar satu sama lain. */}
          <dd className="font-mono text-3xl font-medium tabular-nums text-cream-50 xl:text-[2.5rem]">
            {value}
          </dd>
          <dt className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-50/70">
            {label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [stats, setStats]       = useState(null);
  const artRef = useRef(null);

  // Angka publik diambil sekali saat halaman dibuka. Kegagalannya sengaja
  // ditelan: ini hiasan informatif, bukan syarat untuk bisa masuk — kalau
  // endpoint-nya bermasalah, form login harus tetap berfungsi seperti biasa.
  useEffect(() => {
    let alive = true;
    publicApi.stats()
      .then((d) => { if (alive) setStats(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Parallax halus mengikuti kursor. Nilainya ditulis sebagai CSS variable
  // langsung ke DOM, bukan lewat state — supaya gerakan mouse tidak memicu
  // render ulang React puluhan kali per detik hanya untuk menggeser latar.
  const handlePointer = useCallback((e) => {
    const el = artRef.current;
    if (!el) return;
    // Penjaga reduced-motion di index.css hanya menjangkau animasi CSS.
    // Parallax ini digerakkan JavaScript, jadi harus memeriksa preferensinya
    // sendiri — kalau tidak, orang yang mematikan animasi karena vertigo atau
    // mabuk gerak tetap kena latar yang bergeser mengikuti kursornya.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width - 0.5;
    const y = (e.clientY - b.top) / b.height - 0.5;
    el.style.setProperty("--px", `${x * 22}px`);
    el.style.setProperty("--py", `${y * 22}px`);
  }, []);

  const resetPointer = useCallback(() => {
    const el = artRef.current;
    if (!el) return;
    el.style.setProperty("--px", "0px");
    el.style.setProperty("--py", "0px");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Isi email dan password terlebih dahulu."); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  }

  function fillAccount(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  return (
    // Dua bidang dengan tingkat terang yang BEDA JAUH: ink-950 (#070c0a) di
    // kiri, forest-900 (#15392e) di kanan. Versi sebelumnya memakai forest-950
    // dan forest-900/40 — dua nada hijau yang nyaris sama gelapnya, sehingga
    // layarnya melebur jadi satu bidang datar tanpa pegangan untuk mata.
    <div className="min-h-screen bg-forest-900 text-cream-50 lg:grid lg:grid-cols-[1.1fr_1fr]">

      {/* ── Kiri: panel merek ───────────────────────────────────────────── */}
      <aside
        ref={artRef}
        onPointerMove={handlePointer}
        onPointerLeave={resetPointer}
        className="gjr-grain relative hidden overflow-hidden bg-ink-950 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16"
      >
        {/* Lapisan latar: lingkaran tahun + shader + vignette */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg
            className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 text-sage-300/70"
            style={{ transform: "translate(calc(-50% + var(--px, 0px)), calc(-50% + var(--py, 0px)))" }}
            viewBox="-460 -460 920 920"
          >
            <GrowthRings shares={stats?.species_co2_share} />
          </svg>

          {/* Opasitas shader diturunkan dari 55% ke 38%. Di atas latar yang
              kini nyaris hitam, gradien yang sama tampak jauh lebih kuat
              daripada ketika dulu duduk di atas forest-950 — pada 55% ia
              mengembalikan panel ini ke hijau rata yang justru ingin
              dihindari. Kalau WebGL tidak tersedia, kanvasnya tetap transparan
              dan warna ink-950 di bawahnya yang tampil: halaman tidak pernah
              bergantung pada WebGL untuk bisa dibaca. */}
          <Velaris
            height="100%"
            speed={0.45}
            grain={0.22}
            bg="#070c0a"
            colors={VELARIS_COLORS}
            className="absolute inset-0 opacity-[0.38]"
          />

          {/* Vignette: menggelapkan tepi supaya mata jatuh ke tengah */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgb(7_12_10/0.85)_100%)]" />
        </div>

        {/* Kop */}
        <div className="gjr-rise relative flex items-center gap-3" style={{ "--d": "60ms" }}>
          <div className="rounded-lg border border-sage-500/25 bg-sage-500/15 p-2.5 backdrop-blur-sm">
            <Leaf size={22} className="text-sage-300" strokeWidth={2} />
          </div>
          <div>
            <p className="gjr-display text-lg font-bold leading-tight">Giricahyo Carbon</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-50/70">
              Koperasi Griya Jati Rasa
            </p>
          </div>
        </div>

        {/* Isi utama — hanya judul, satu kalimat, dan tiga angka.
            Daftar tiga "fitur" berikut ikon dan deskripsinya dihapus: pola
            ikon-judul-deskripsi adalah isian template pemasaran paling umum
            yang ada, dan tiga blok teks tambahan membuat sisi ini penuh tanpa
            menambah satu pun informasi yang tidak bisa ditebak sendiri oleh
            orang yang sudah berdiri di halaman login. */}
        <div className="relative max-w-2xl">
          <p
            className="gjr-rise mb-7 font-mono text-[11px] uppercase tracking-[0.22em] text-sage-400"
            style={{ "--d": "160ms" }}
          >
            Sistem MRV Karbon Komunitas
          </p>

          {/* Kontras ukuran yang ekstrem — judul raksasa bersanding dengan
              label mono 10px — adalah yang sebenarnya membuat sebuah halaman
              terasa dikerjakan sungguhan. Ukuran-ukuran menengah yang aman
              justru yang membuatnya terbaca biasa saja. */}
          {/* Baris pertama naik seperti biasa; baris kedua MENGGAMBAR DIRINYA.
              Sengaja tidak keduanya: menumpuk dua efek masuk pada satu judul
              membuat keduanya saling menutupi, dan gjr-rise memakai blur yang
              akan mengaburkan garis yang sedang ditarik.

              Frasa yang digambar dipindah ke barisnya sendiri — semula
              "menjadi pendapatan desa." satu baris. Efek tarik-garis butuh
              huruf besar dan teks pendek: pada 48 karakter judul penuh ia jadi
              lambat dan berantakan, pada 16 karakter di ukuran ~4rem ia jelas.
              Kebetulan pemenggalannya juga lebih baik — frasa kuncinya berdiri
              sendiri. */}
          {/* SELURUH judul menggambar dirinya, satu komponen per baris.
              SVG-nya satu baris datar dan tidak bisa membungkus teks sendiri,
              jadi pemenggalan barisnya ditentukan di sini — bukan oleh lebar
              kotak seperti teks HTML biasa.

              stagger 40ms + durasi 800ms dipilih bersama, bukan sendiri-sendiri:
              hasil baginya (800/40 = 20) adalah jumlah huruf yang tergambar
              BERSAMAAN pada satu waktu. stroke-dashoffset tidak ditangani
              compositor, jadi tiap huruf yang sedang bergerak berarti satu
              penggambaran ulang per frame. Dengan stagger rapat 25ms dan durasi
              1,1s, ke-50 huruf akan bergerak serentak — dan di ponsel kelas
              bawah itu tersendat. Angka sekarang menahannya di ~20, sekaligus
              membuat gerakannya terbaca seperti tangan yang menulis alih-alih
              seluruh kalimat memudar masuk sekaligus. */}
          {/* TIGA baris pendek, bukan dua baris panjang — dan batas ukurannya
              3,6rem, bukan 4rem.
              DrawLineText menggambar satu baris lurus tanpa pernah melipat
              kata: lebar SVG-nya adalah jumlah lebar tiap huruf, apa pun
              lebar wadahnya. Kalau kalimatnya lebih panjang dari wadah, sisanya
              dipotong diam-diam oleh `overflow-hidden` milik <aside>, dan
              judulnya putus di tengah kata tanpa peringatan apa pun.
              Terukur: "Mengubah pohon yang tumbuh" perlu 1009px pada 64px,
              sementara wadahnya cuma 626px — 338px hilang. (Susunan dua baris
              sebelumnya sudah terpotong juga, sekitar 156px, cuma kurang
              kentara karena Fraunces lebih sempit.)
              Angka 3,6rem bukan tebakan: baris terpanjang di bawah ("yang
              tumbuh menjadi") memakan 11,0 × ukuran huruf, dan wadahnya
              mentok di max-w-2xl = 672px. 11,0 x 57,6px = 634px, masih muat
              dengan sisa ruang. Kalau kalimatnya diubah, hitung ulang. */}
          <h2 className="gjr-display text-[clamp(2rem,3.7vw,3.6rem)] font-normal leading-[1.06] tracking-[-0.02em]">
            <DrawLineText
              text="Mengubah pohon"
              strokeWidth={1}
              delay={220}
              stagger={40}
              drawDuration={800}
            />
            <DrawLineText
              text="yang tumbuh menjadi"
              strokeWidth={1}
              // Tiap baris mulai sebelum baris sebelumnya benar-benar selesai —
              // kalau menunggu tuntas, ada jeda mati yang membuat kalimatnya
              // terasa terputus-putus, bukan satu tarikan.
              delay={700}
              stagger={40}
              drawDuration={800}
            />
            <DrawLineText
              text="pendapatan desa."
              className="text-sage-300"
              strokeWidth={1}
              delay={1380}
              stagger={40}
              drawDuration={800}
            />
          </h2>

          <p
            className="gjr-rise mt-6 max-w-md text-[15px] leading-relaxed text-cream-50/50"
            style={{ "--d": "1300ms" }}
          >
            Satu sistem untuk mencatat pohon, menghitung serapan karbonnya, dan
            memastikan hasilnya kembali ke petani yang merawatnya.
          </p>

          <div className="gjr-rise mt-12 border-t border-cream-50/10 pt-8" style={{ "--d": "1700ms" }}>
            <LiveStats stats={stats} />
          </div>
        </div>

        <p
          className="gjr-rise relative font-mono text-[10px] uppercase tracking-[0.16em] text-cream-50/65"
          style={{ "--d": "2050ms" }}
        >
          Desa Giricahyo · Purwosari · Gunungkidul · D.I. Yogyakarta
        </p>
      </aside>

      {/* ── Kanan: form masuk, di dalam kartu yang timbul ────────────────── */}
      {/* Kartu ini pernah dibuang karena terbaca sebagai bingkai di dalam
          bingkai: ia duduk di atas panel forest-900 yang sendirinya sudah
          menjadi bidang tersendiri, sehingga tidak ada yang tampak terangkat.
          Sekarang penyebabnya yang diperbaiki, bukan kartunya yang dihapus —
          BIDANG DI BELAKANGNYA DITURUNKAN ke ink-900. Tangga terangnya jadi:

              ink-950 (#070c0a) panel kiri
              ink-900 (#0b1310) bidang form   ← sekadar latar, bukan panel
              forest-900 (#15392e) kartu      ← satu-satunya yang terangkat

          Sesuatu terbaca "timbul" karena permukaan di bawahnya jelas-jelas
          bukan permukaan — bukan karena bayangannya ditebalkan. */}
      <main className="relative flex flex-col items-center justify-center bg-ink-900 px-4 py-14 sm:px-8">
        {/* Sekarang cahaya tepi punya tepi sungguhan untuk ditelusuri. Di versi
            tanpa kartu ia menelusuri bidang tak terlihat — efeknya benar, tapi
            tidak ada apa pun yang ia peluk. */}
        <div className="gjr-lift relative w-full max-w-[27rem] rounded-2xl border border-cream-50/10 bg-forest-900 p-6 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.85)] sm:p-7">
          <GlowingEffect spread={38} proximity={90} inactiveZone={0.12} borderWidth={1.5} />

          {/* Kop ringkas — hanya saat panel kiri disembunyikan */}
          <div className="gjr-rise mb-10 lg:hidden">
            <div className="mb-5 inline-flex rounded-lg border border-sage-500/25 bg-sage-500/15 p-3">
              <Leaf size={26} className="text-sage-300" strokeWidth={2} />
            </div>
            <h1 className="gjr-display text-3xl font-bold leading-tight">Giricahyo Carbon</h1>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cream-50/70">
              Manajemen Bisnis Karbon Komunitas
            </p>
            <LiveStats stats={stats} className="mt-8 border-t border-cream-50/10 pt-6" />
          </div>

          {/* PENTING — kolom isian dan tombol Masuk SENGAJA tidak ikut
              dianimasikan.
              Animasi masuk memakai animation-fill-mode: both, yang menahan
              keadaan awal (opacity 0 + blur) SAMPAI animasinya benar-benar
              berjalan. Kalau karena alasan apa pun animasi itu tidak jalan —
              tab dibuka di latar belakang, browser membatasi animasi, jendela
              sedang diminimalkan saat halaman dimuat — form-nya tinggal tak
              terlihat dan pengguna terkunci di luar aplikasinya sendiri.
              Hiasan tidak boleh menjadi syarat untuk bisa masuk. Judul dan
              subjudul di bawah aman dianimasikan: kalaupun tidak muncul, tidak
              ada yang terhalang. */}
          {/* Kapital penuh perlu DUA penyesuaian, bukan sekadar uppercase:

              1. Jarak huruf POSITIF. Huruf besar dirancang untuk berdiri
                 sendiri-sendiri; dirapatkan seperti huruf kecil, ia berdesakan
                 dan justru lebih lambat dibaca. .gjr-display memberi
                 letter-spacing -0.02em (bagus untuk judul huruf kecil, salah
                 untuk kapital), jadi di sini ditimpa lewat style inline —
                 kelas Tailwind tidak cukup karena .gjr-display berada di luar
                 layer utility dan selalu menang.

              2. TIDAK ada kompensasi text-indent.
                 Resep yang lazim beredar: jarak huruf ikut ditambahkan sesudah
                 huruf terakhir, jadi teks yang di-center perlu digeser balik
                 dengan text-indent. Itu diuji di sini dan ternyata SALAH untuk
                 peramban sekarang — ia sudah memangkas jarak huruf di ujung
                 baris sendiri. Diukur dari tepi huruf pertama dan terakhir:
                   indent 0      → selisih 0,00px  (seimbang)
                   indent 0,045em → selisih 1,25px ke kanan
                   indent 0,09em  → selisih 2,50px ke kanan
                   indent 0,18em  → selisih 5,00px ke kanan
                 Jadi menambahkannya justru merusak keseimbangan. Dibiarkan
                 kosong. */}
          <h2
            className="gjr-rise gjr-display text-center text-[1.75rem] font-normal uppercase leading-tight"
            style={{ "--d": "260ms", letterSpacing: "0.18em" }}
          >
            Login
          </h2>
          <p className="gjr-rise mb-9 mt-3 text-center text-sm text-cream-50/75" style={{ "--d": "320ms" }}>
            Gunakan akun yang diberikan pengurus koperasi.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* htmlFor/id ditangani FloatingField: sebelumnya <label> tidak
                tertaut ke input mana pun, jadi mengklik teks labelnya tidak
                memindahkan fokus dan pembaca layar tidak bisa menyebutkan nama
                isiannya. */}
            <FloatingField
              id="login-email"
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoComplete="email"
              autoFocus
              invalid={Boolean(error)}
            />

            <FloatingField
              id="login-password"
              label="Password"
              type={showPw ? "text" : "password"}
              icon={Lock}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              autoComplete="current-password"
              invalid={Boolean(error)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  className="rounded p-1 text-cream-50/70 transition-colors hover:text-cream-50/70"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {error && (
              <div
                role="alert"
                className="gjr-expand flex items-start gap-2.5 rounded-lg border border-clay-700/40 bg-clay-700/25 px-4 py-3 text-sm text-clay-100"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Satu-satunya unsur hangat di layar yang seluruhnya hijau, jadi
                mata menemukannya tanpa perlu dicari. Emas sengaja dipakai HANYA
                di sini — sebelumnya ia juga mengisi gradien judul, dan aksen
                yang muncul di dua tempat berhenti berfungsi sebagai aksen.
                Teks forest-950 di atas gold-500 ≈ 5,9:1, lolos WCAG AA. */}
            <button
              type="submit"
              disabled={loading}
              className="gjr-sheen group relative w-full overflow-hidden rounded-lg bg-gold-500 py-4 text-[15px] font-bold uppercase tracking-[0.09em] text-forest-950 transition-all duration-200 hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
            >
              <span className="relative flex items-center justify-center gap-2.5">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-950/30 border-t-forest-950" />
                    Memeriksa…
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Akun demo sebagai satu baris chip, bukan panel lipat.
              Bentuk lamanya — kotak bergaris sendiri, menggantung di bawah
              kartu, dengan tombol pembuka dan lima baris berukuran penuh di
              dalamnya — punya bobot visual setara form login itu sendiri,
              padahal ia cuma alat bantu demo. */}
          {SHOW_DEMO && (
            <div className="gjr-rise mt-10 border-t border-cream-50/10 pt-6" style={{ "--d": "600ms" }}>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cream-50/65">
                Akun demo — klik untuk mengisi
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillAccount(acc)}
                    title={`${acc.name} — ${acc.desc}`}
                    className="group flex items-center gap-2 rounded-lg border border-cream-50/12 bg-ink-950/40 px-3 py-2 text-xs font-medium text-cream-50/65 transition-all duration-200 hover:border-sage-400/40 hover:bg-ink-950/70 hover:text-cream-50"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${ROLE_DOT[acc.role]}`} />
                    {acc.short}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <HakCipta gelap className="relative mt-8 max-w-[27rem]" />
      </main>
    </div>
  );
}
