# Panduan Desain — Giricahyo Carbon

Dokumen arah desain dasbor. Isinya keputusan yang sudah diambil beserta
alasannya, bukan daftar keinginan. Sebagian besar aturan di sini lahir dari
sesuatu yang **pernah rusak dan terukur** — angka pengukurannya ikut ditulis
supaya tidak ada yang "memperbaiki"-nya kembali ke keadaan semula.

Sumber kebenarannya tetap kode: `src/index.css` untuk token, `src/components/ui/`
untuk komponen. Kalau dokumen ini berbeda dengan kode, kodenya yang benar —
perbarui dokumen ini.

---

## 1. Prinsip

Empat hal yang menentukan setiap keputusan di bawah.

**Alat kerja, bukan brosur.** Ini dipakai berjam-jam oleh petugas koperasi untuk
mencatat pohon dan uang. Keterbacaan angka mengalahkan kemewahan. Kemewahan
diizinkan di satu tempat saja: halaman login, yang memang wajah publik.

**Angka harus bisa dibandingkan.** Setiap kolom angka memakai
`font-variant-numeric: tabular-nums`. Tanpa itu lebar tiap digit berbeda dan
mata tidak bisa membandingkan dua baris tanpa membacanya satu per satu.

**Tidak ada kontrol bawaan peramban yang dipakai apa adanya.** Daftar `<option>`
dan kalender `<input type="date">` digambar sistem operasi, di luar dokumen, dan
CSS tidak punya cara menyentuhnya. Sebagus apa pun kotaknya ditata, yang muncul
saat diklik tetap kotak putih bersorot biru khas Windows. Karena itu ada
`Select` dan `DateField` sendiri.

**Yang bergerak harus punya alasan.** Animasi dipakai untuk menjelaskan asal
sesuatu (popup keluar dari kolomnya, panel maju ke depan), bukan untuk ramai.

---

## 2. Warna

### Palet mentah — `@theme` di `index.css`

Ini "cat"-nya. Tidak berubah antar tema, dan **jangan dipakai langsung** di
komponen kecuali untuk hal yang memang tidak punya versi gelap (mis. kartu
sertifikat yang selalu berlatar kertas).

| Keluarga | Rentang | Untuk |
|---|---|---|
| `forest` | 950 `#0e2a21` → 50 `#eef3f0` | bidang gelap, header, tombol utama |
| `sage` | 950 `#0f2619` → 50 `#f0f6f2` | aksen hidup, status sehat |
| `gold` | 950 `#241a08` → 50 `#faf3e4` | uang, sertifikat, satu-satunya kehangatan |
| `cream` | 300 `#d4caaf` → 50 `#f6f3ea` | kertas, garis, latar terang |
| `clay` | 950 `#3d0f0a` → 100 `#f4ddd8` | bahaya, kritis, penghapusan |
| `ink` | 950 `#070c0a`, 900 `#0b1310` | bidang paling gelap (panel login) |

### Token peran — yang dipakai sehari-hari

**Selalu pakai ini, bukan palet mentah.** Token peran otomatis membalik saat
tema gelap dinyalakan; menulis `bg-white dark:bg-forest-900` di setiap komponen
adalah cara lama yang sudah dibuang.

| Token | Terang | Gelap | Untuk |
|---|---|---|---|
| `ground` | `#f6f3ea` | `#0e2a21` | latar halaman |
| `surface` | `#ffffff` | `#15392e` | latar kartu |
| `surface-sub` | `#f6f3ea` | `#0e2a21` | kotak di dalam kartu, isian form |
| `surface-hover` | `#f1ece0` | `#1d4a3b` | baris tabel saat disorot |
| `line` | `#efe9d8` | `#1d4a3b` | garis & border halus |
| `line-strong` | `#e4dcc8` | `#275c49` | border yang lebih tegas |
| `ink` | `#0e2a21` | `#f6f3ea` | teks utama |
| `ink-muted` | `#4c6156` | `#b6c4ba` | teks sekunder |
| `ink-faint` | `#7d8d84` | `#8ba093` | label, keterangan kecil |
| `brand` | `#2f6e51` | `#6aab82` | aksen utama |
| `brand-soft` | `#e1eade` | `#1a3d2a` | latar lembut aksen |
| `brand-ink` | `#1d4a3b` | `#8ec4a0` | teks di atas `brand-soft` |
| `good` / `warn` / `bad` | + pasangan `-soft` | | status |

**Jebakan kontras yang sudah kena sekali.** `gold-500` di atas putih hanya
≈2,6:1 — gagal WCAG AA. Karena itu ada `gold-700` (`#85631f`, ≈5,5:1) khusus
untuk **teks**; `gold-500` hanya untuk isian dan ikon. Token `warn` menunjuk ke
`gold-700`, bukan `gold-500`.

**Teks di atas `brand`.** Di tema terang `brand` gelap → teks `cream-50`. Di tema
gelap `brand` terang → teks `forest-950`. Selalu tulis
`text-cream-50 dark:text-forest-950`; salah satunya saja membuat teks hilang di
satu tema.

### Warna chart

`--chart-1` … `--chart-5` plus `--chart-grid` dan `--chart-axis`, dibaca Recharts
lewat `chartTheme.js`. Di tema gelap semuanya dicerahkan supaya tidak hilang di
latar hijau tua. Jangan menulis warna chart langsung di komponen.

---

## 3. Tipografi

Tiga huruf, tiga tugas. Dipilih setelah pengukuran, bukan selera — rinciannya di
bawah.

| Peran | Huruf | Dipakai untuk |
|---|---|---|
| `--font-display` | **Libre Baskerville** 400/700 | judul halaman, judul login |
| `--font-sans` | **Work Sans** 400–800 | seluruh antarmuka & angka |
| `--font-mono` | **JetBrains Mono** 400/500 | label kapital kecil, ID, kode |

Dimuat lewat `<link>` di `index.html`, **bukan** `@import` di CSS — `@import`
memaksa peramban mengunduh dan mengurai CSS dulu sebelum tahu ada font yang
harus diambil. Dasbor ini dibuka dari lapangan di Gunungkidul, bukan kantor
berserat optik.

### Kenapa Work Sans

Diukur langsung di peramban terhadap 16 kandidat:

- tinggi-x **0,758** — tertinggi dari semua kandidat, di atas Inter (0,753).
  Penting karena tabel pohon penuh teks 12–13px.
- lebar digit **0,604em** lawan 0,648em milik Inter → kolom angka lebih rapat
- angka tabularnya **berfungsi**. Ini syarat mati: Urbanist dan Albert Sans —
  dua font yang sering dipuji untuk dasbor — ternyata **tidak punya** angka
  tabular sama sekali, dan `tabular-nums` diabaikan diam-diam.

Inter dipertahankan sebagai cadangan pertama di `--font-sans`: kalau Google
Fonts gagal dimuat, tampilannya jatuh ke huruf yang metriknya paling mirip,
bukan langsung ke Arial yang jauh lebih lebar.

### Aturan Libre Baskerville

Font ini **statis** — hanya punya bobot **400 dan 700**.

> **Jangan pernah memakai `font-medium`, `font-semibold`, atau `font-extrabold`
> bersamanya.** Bobot itu tidak ada, dan peramban akan memalsukannya dengan
> mencoreng huruf 400 (*faux bold*). Hasilnya kotor, paling kelihatan di judul
> besar halaman login.

Pemakaian yang benar:
- judul besar (≥ 2rem) → `font-normal`
- judul kecil (logo, judul topbar, EmptyState) → `font-bold`

### Kapital

Huruf besar dirancang berdiri sendiri-sendiri. Dirapatkan seperti huruf kecil, ia
berdesakan dan justru lebih lambat dibaca.

- teks kapital **wajib** diberi jarak huruf positif: `0,09em` untuk tombol,
  `0,16–0,20em` untuk label mono kecil, `0,18em` untuk judul display
- `.gjr-display` memberi jarak **negatif** (−0,02em) — bagus untuk judul huruf
  kecil, salah untuk kapital. Timpa lewat **style inline**, bukan kelas
  Tailwind (alasannya di §7)
- **jangan** menambahkan `text-indent` sebagai kompensasi teks yang di-center.
  Resep itu beredar luas tapi salah untuk peramban sekarang — ia sudah memangkas
  jarak huruf di ujung baris sendiri. Terukur: indent 0 → selisih kiri-kanan
  **0,00px**; indent 0,18em → meleset **5,00px** ke kanan.

Yang **tidak** dikapitalkan: label form yang mengambang (kapital di situ jadi
berteriak dan memperlambat) dan nama merek "Giricahyo Carbon".

---

## 4. Komponen

Semua diekspor dari `src/components/ui/index.js`. Impor lewat satu pintu:
`import { Card, Select, ConfirmDialog } from "./ui";`

### Isian

| Komponen | Untuk | Catatan |
|---|---|---|
| `Select` | pengganti `<select>` | ARIA listbox, panah, Home/End, ketik-untuk-melompat |
| `DateField` | pengganti `<input type="date">` | kalender sendiri, Senin-dulu, dd/mm/yyyy |
| `FloatingField` | isian login | label mengambang |
| `FormStep` | membungkus satu langkah form | nomor + label, lihat §5 |

**Kontrak `onChange` seragam.** `Select` dan `DateField` mengirim objek
ber-`e.target.value` persis seperti elemen bawaan, jadi pemanggil yang sudah
menulis `(e) => setX(e.target.value)` tidak perlu diubah.

### Tampilan

`Card` · `CardHeader` · `Badge` · `HealthBadge` · `StatCard` · `DataTable` ·
`EmptyState` · `Skeleton` · `Sparkline` · `SectionHeader`

### Overlay

| Komponen | Untuk |
|---|---|
| `ModalPortal` | pembungkus wajib setiap modal — memberi Escape, jebakan fokus, kunci gulir, kembalikan fokus |
| `ConfirmDialog` | konfirmasi tindakan yang tidak bisa dibatalkan |
| `ProfileMenu` | menu profil di layar ponsel |

### Hook

`useAnchoredPopup` — menempelkan popup pada pemicunya di koordinat layar.
Dipakai `Select`, `DateField`, `ProfileMenu`. **Jangan menulis penempatan popup
sendiri**; alasannya di §7.

---

## 5. Pola

### Kerangka modal

Tiga bagian, dan **panel bukan wadah gulirnya**:

```
panel   → flex flex-col  max-h-[88vh]  overflow-hidden  rounded-3xl
├ kepala → shrink-0
├ isi    → min-h-0  flex-1  overflow-y-auto
└ kaki   → shrink-0  border-t   (galat + tombol simpan)
```

Kalau `overflow-y-auto` dipasang di panel yang ber-`rounded-3xl`, batang
gulirnya terpotong sudut membulat dan menempel di lengkungan, **dan** tombol
simpan ikut hanyut ke bawah sehingga harus dicari dengan menggulir.

`min-h-0` wajib: tanpa itu anak fleks menolak menyusut lebih kecil daripada
isinya dan panel melewati batas `88vh`.

Lebar: `max-w-3xl` (768px) untuk form berisi kartu pilihan; `max-w-sm/md` untuk
form pendek. Pada 448px, tiga kartu tingkatan hanya kebagian ~120px masing-masing
dan judul sependek "CARBON DISCOVERY" pun patah dua baris.

### Alur pengisian form — **siapa → kapan → apa**

Urutan ini berlaku untuk setiap form baru:

1. **Siapa** — buyer, petani, pemilik
2. **Kapan** — tanggal
3. **Apa** — paket, jenis, keputusan besar yang paling banyak makan ruang

Keputusan terbesar diletakkan terakhir, tepat di atas tombol simpan.

> **Aturan mati:** kolom yang kemunculannya bergantung pada pilihan lain harus
> berada **DI BAWAH** pilihan itu, tidak pernah di atasnya. Kalau di atas,
> memilih sesuatu di bawah membuat kolom baru menyembul di luar arah pandang —
> dan itulah yang membuat form terasa membingungkan.

Bungkus tiap langkah dengan `FormStep`. Nomornya bukan hiasan: form yang
kolomnya muncul-hilang berubah-ubah tingginya, dan nomor tetap memberi titik
pegangan.

### Konfirmasi penghapusan

`window.confirm()` **tidak boleh dipakai**. Ia hanya bisa satu baris teks polos,
tidak mengikuti tema, dan berbeda-beda di tiap peramban.

Pakai `ConfirmDialog`, dan isi `consequences` dengan **akibat yang nyata beserta
angkanya**, bukan peringatan umum:

> - Dana masuk **Rp 100.000** dari sertifikat ini ikut dihapus dari Carbon Fund.
> - Pohon **GJR-L1-003** kembali bebas dan bisa disertifikatkan lagi.

Yang perlu diketahui petugas sebelum menekan "Hapus" bukan *"yakin?"* melainkan
*apa saja yang ikut hilang.* Tombol Batal yang mendapat fokus pertama — menekan
Enter karena refleks membatalkan, bukan menghapus.

### Kartu yang menampilkan uang

Pertanyaan pertama seorang pengurus bukan *"dana ini dibagi ke mana"* melainkan
*"dana ini datang dari mana"*. Asal dana naik jadi bagian utama; pembagiannya
turun jadi rincian.

Dua aturan yang lahir dari cacat nyata:

- **Kelompokkan lewat relasi, bukan lewat teks.** Dana masuk dikelompokkan per
  paket dengan menelusuri `tree_adoption_id → package_name`, bukan dengan
  mencocokkan isi kolom `source` — string itu bentuknya berbeda-beda antar paket
  dan akan pecah begitu nama paketnya diubah sedikit.
- **Jangan menampilkan angka yang tidak dihitung dari data hidup.** Kartu
  Distribusi Dana sempat menampilkan pembagian atas Rp 15.000.000 (angka contoh
  seeder) sementara dana masuk sungguhan Rp 210.000 — dan tidak ikut berubah
  saat filter bulan/tahun diganti. Persentasenya boleh disimpan (itu kebijakan
  koperasi); rupiahnya harus dihitung dari pemasukan yang sesungguhnya.

Sertakan **jumlah transaksi** di samping nominal: Rp 60.000 dari tiga sertifikat
kecil berbeda artinya dengan Rp 60.000 dari satu sertifikat besar.

### Tabel

- header `text-[10px] uppercase tracking-wide text-ink-faint`
- kolom angka `text-right` + `tabular-nums`
- pembungkus `overflow-x-auto` sendiri — badan halaman tidak boleh menggulir
  mendatar
- baris identik berturut-turut sebaiknya **dikelompokkan** (lihat Dana Masuk):
  qty dan total dijumlah, rinciannya bisa dibuka. Datanya tetap utuh di
  database — penggabungan murni tampilan, karena baris manual masih harus bisa
  diubah satu per satu.

---

## 6. Gerak

Kosakata di `index.css`. Jangan membuat keyframe baru sebelum memastikan tidak
ada yang cocok.

| Kelas | Durasi | Untuk |
|---|---|---|
| `gjr-fade-in` | .3s | konten menggantikan skeleton |
| `gjr-overlay-in` | .2s | latar gelap modal |
| `gjr-panel-in` | .28s | panel modal (naik 10px + skala 98%) |
| `gjr-pop-in` | .18s | popup Select / DateField / menu |
| `gjr-toast-in` | .26s | notifikasi |
| `gjr-drawer-l/r` | .3s | laci samping |
| `gjr-stagger` | 55ms/anak | daftar masuk berurutan |
| `gjr-rise` | .75s | masuk berurutan halaman login |

`gjr-pop-in` paling pendek (.18s) karena pemilih tanggal dan daftar sering
dibuka-tutup berkali-kali dalam satu pengisian form; animasi panjang berubah jadi
hambatan setelah pemakaian ketiga.

**`prefers-reduced-motion`.** Aturan menyeluruh di atas berkas mematikan semua
animasi jadi 0,01ms — itu terlalu kasar. Preferensi ini soal **gerak** (geseran,
zoom, parallax) yang memicu vertigo; pudar opasitas tidak menggerakkan apa pun,
dan antarmuka yang meloncat tanpa peralihan justru lebih sulit diikuti. Jadi
animasi milik proyek dikecualikan dan yang mengandung gerak ditukar jadi pudar
murni. Gerak yang digerakkan JavaScript (parallax login) harus memeriksa
`matchMedia` sendiri — penjaga CSS tidak menjangkaunya.

**`animation-fill-mode: both` jangan dipasang pada antarmuka kritis.** Ia menahan
keadaan awal (`opacity: 0`) sampai animasinya benar-benar berjalan. Kalau
animasi tidak jalan — tab dibuka di latar belakang, jendela diminimalkan saat
halaman dimuat — elemennya tinggal tak terlihat. Kolom isian dan tombol Masuk di
halaman login **sengaja tidak dianimasikan** karena ini: hiasan tidak boleh jadi
syarat untuk bisa masuk.

---

## 7. Jebakan yang sudah memakan korban

Bagian terpenting dokumen ini. Semua sudah pernah terjadi, terukur, dan
diperbaiki.

### Blok penampung merusak `position: fixed`

`position: fixed` diukur terhadap layar — **hanya** selama tidak ada leluhur yang
punya `transform`, `filter`, `backdrop-filter`, `perspective`, atau `contain`.
Begitu ada, leluhur itu jadi blok penampung baru dan koordinatnya diukur dari
pojok leluhur.

Terukur: membuka modal lalu langsung mengklik kolom tanggal dalam 0,28 detik
pertama (selagi animasi panel ber-`transform` berjalan) membuat popup melompat
**442px mendatar**.

**Karena itu jangan menulis penempatan popup sendiri — pakai `useAnchoredPopup`.**
Hook itu mengukur selisihnya langsung lalu menguranginya, jadi berlaku untuk blok
penampung apa pun termasuk yang belum ada hari ini. Diulang tiga kali karena blok
penampung bisa ikut menskala. Untuk modal, `ModalPortal` sudah memindahkan isinya
ke `<body>`.

### Dua utility display bertabrakan → yang menang bukan yang ditulis belakangan

`Button` dan `IconButton` menuliskan `inline-flex` sendiri. Menambahkan `hidden`
lewat `className` **tidak bekerja**: pemenangnya ditentukan urutan aturan di
berkas CSS, dan Tailwind selalu menempatkan `inline-flex` sesudah `hidden`.

Akibatnya `hidden md:inline-flex` pada tombol Mode Presentasi tidak pernah
berfungsi. Sudah diperbaiki di `Button.jsx` — kelas bawaannya dilepas kalau
pemanggil menentukan display sendiri. Untuk komponen lain (mis. `ThemeSwitch`),
**bungkus dengan `<span>`**, jangan kirim kelas `hidden`.

Awalan varian aman: `lg:hidden` hidup di dalam media query yang letaknya sudah
lebih akhir.

### Kelas kustom mengalahkan utility Tailwind

`.gjr-display` berada di luar layer utility, jadi `letter-spacing`-nya selalu
menang atas `tracking-*`. Untuk menimpanya pakai **style inline**.

### Escape harus ditangkap di `window`, bukan `document`

`useModalA11y` memasang penangkap Escape di `document` (capture) untuk menutup
modal. Popup di dalam modal harus memasang penangkapnya di **`window`** dengan
capture — fase capture berjalan dari luar ke dalam, jadi window lebih dulu dan
bisa menghentikan rambatannya.

Tanpa itu, menekan Escape saat kalender terbuka menutup **seluruh modal beserta
isian yang sedang diketik**.

### Cadangan tinggi harus cocok dengan ukuran hurufnya

Kartu tingkatan memakai `min-h` agar harga sejajar walau salah satu namanya
patah dua baris. Angkanya = **2 × ukuran huruf × 1,25** (`leading-tight`).
`min-h-[1.6rem]` dihitung untuk 10px; setelah huruf dinaikkan ke 11px dua baris
jadi 27,5px dan cadangannya jebol — harga meleset 2px. Sekarang `1.75rem`.
**Kalau ukuran nama diubah, hitung ulang.**

### Teks per-huruf: pakai lebar maju, bukan lebar tinta

`getBoundingClientRect().width` memberi kotak **tinta**;
`getComputedTextLength()` memberi lebar **maju**. Untuk huruf berekor keduanya
berbeda jauh. Terukur di `DrawLineText`: ekor huruf **j** Libre Baskerville
menjulur ~8px ke kiri dari titik penanya, sehingga "menjadi" terbaca
"men j adi".

### `color-scheme` tetap diperlukan

`:root { color-scheme: light }` / `.dark { color-scheme: dark }` masih dibutuhkan
untuk kontrol bawaan yang tersisa: daftar `<select>` asli yang belum diganti,
tombol putar `<input type="number">`, batang gulir, dan warna sorotan teks.

---

## 8. Responsif

Breakpoint Tailwind bawaan: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

Diaudit di **375px** dan **768px** untuk ketiga peran dan seluruh halaman.
Badan halaman bersih; satu-satunya masalah ada di topbar.

### Anggaran topbar

**Lebar yang tersedia bukan lebar layar.** Sejak `lg`, sidebar memakan 240px.
Pada layar 1024px baris topbar cuma punya ~784px; pada 1280px ~1040px.

Judul halaman satu-satunya item yang bisa menyusut, jadi **setiap kelebihan
langsung diserap olehnya sampai 0px — tanpa peringatan apa pun.** Itu yang
membuat cacat ini lolos berkali-kali: tidak ada yang meluber, tidak ada gulir
mendatar, judulnya hanya lenyap.

Karena itu kontrol dinyalakan bertahap, bukan sekaligus:

| Breakpoint | Yang menyala |
|---|---|
| `sm` 640 | ikon Katalog, ikon Scan |
| `lg` 1024 | bahasa, tema, blok profil |
| `xl` 1280 | PeriodFilter, label Scan |
| `2xl` 1536 | label Katalog, nama pengguna, kotak cari lebar |

Di bawah `lg`, bahasa/tema/profil/keluar hidup di `ProfileMenu` — satu tombol
avatar. Itu juga yang mengembalikan tombol **Keluar** ke dalam layar; `Sidebar`
dan `BottomNav` tidak punya logout sama sekali, jadi sebelumnya di ponsel tidak
ada satu pun cara untuk keluar.

Sisa ruang setelah penyetelan, terukur:

| Layar | Sisa | Judul |
|---|---|---|
| 375 | +31px | utuh |
| 768 | +191px | utuh |
| 1024 | +47px | utuh |
| 1280 | +23px | utuh |
| 1600 | +70px | utuh |

> **Setiap kali menambah kontrol ke topbar, ukur ulang sisa ruangnya di 1024,
> 1280, dan 1440 — bukan cuma di layar sendiri.** Menguji di satu lebar saja
> adalah cara cacat ini lolos tiga kali berturut-turut.

### Aturan umum

- badan halaman **tidak boleh** menggulir mendatar; tabel dan diagram lebar
  dibungkus `overflow-x-auto` sendiri
- grid form `md:grid-cols-2` — jatuh jadi satu kolom di layar sempit
- jangan menampilkan tautan yang perannya tidak boleh membukanya (Katalog Pohon
  pernah tampil untuk semua peran padahal rutenya admin-saja)

---

## 9. Aksesibilitas

Bukan tambahan, bagian dari selesai.

- setiap modal lewat `ModalPortal` → Escape, jebakan fokus, kunci gulir,
  kembalikan fokus ke tombol pemicunya
- setiap tombol ikon wajib punya `label` (`IconButton` memaksanya jadi
  `aria-label`)
- fokus papan ketik terlihat di seluruh aplikasi: `:focus-visible` diberi
  `outline: 2px solid var(--brand)` di `index.css`
- daftar panjang memakai **tabindex berpindah** (roving), bukan satu perhentian
  Tab per baris. Kalender 42 sel dan daftar 26 jenis pohon masing-masing hanya
  satu perhentian Tab
- sel kalender memakai `<div role="gridcell">`, **bukan `<button>`** — jebakan
  fokus `useModalA11y` mengumpulkan semua `<button>` tanpa melihat tabindex,
  dan 42 tombol mengacaukan perhitungan elemen pertama/terakhirnya
- kontras: `warn` memakai `gold-700` bukan `gold-500` (lihat §2)

---

## 10. Bahasa & penulisan

- antarmuka dwibahasa lewat `useLanguage()`; **jangan menulis teks langsung**
  kecuali istilah yang memang tidak diterjemahkan (nama paket, ID pohon)
- kamus di `src/lib/LanguageContext.jsx`, kunci `snake_case`
- kosakata yang hanya dipakai satu berkas (nama bulan, nama hari) boleh tinggal
  di berkas itu — memasukkannya ke kamus bersama membuatnya membengkak tanpa
  ada yang memakai
- angka dan tanggal lewat `src/lib/format.js` (`formatRupiah`, `formatNumber`,
  `formatDate`) — jangan memanggil `toLocaleString` sendiri
- pesan galat menyebut **apa yang salah dan apa yang harus dilakukan**:
  > "Pohon GJR-L1-001 tidak bisa dihapus karena masih terikat sertifikat
  > GJR-CERT-2026-0002 atas nama PT Hijau Lestari. Hapus sertifikatnya lebih
  > dulu di menu Sertifikat."

---

## 11. Sebelum menambah sesuatu

Daftar periksa singkat.

- [ ] Warnanya dari token peran, bukan palet mentah atau hex langsung?
- [ ] Ada kolom angka? Sudah `tabular-nums`?
- [ ] Pakai `<select>` atau `<input type="date">` bawaan? **Ganti** dengan
      `Select` / `DateField`.
- [ ] Modal? Sudah lewat `ModalPortal`, kepala/isi/kaki terpisah?
- [ ] Form? Urutannya siapa → kapan → apa, kolom bersyarat di bawah pemicunya?
- [ ] Ada penghapusan? Pakai `ConfirmDialog` dengan akibat yang bernomor.
- [ ] Judul memakai Libre Baskerville? Bobotnya **hanya** 400 atau 700.
- [ ] Teks kapital? Sudah diberi jarak huruf positif.
- [ ] Menambah kontrol ke topbar? Hitung ulang anggaran 375px.
- [ ] Sudah dicek di 375px dan 768px, tidak ada yang meluber atau terpotong?
- [ ] `npm run build` bersih?
- [ ] `npm run lint` **tidak bertambah** galatnya? Angka acuannya **13 galat +
      6 peringatan** — semuanya struktural dan sudah ada sejak lama, jadi
      "bersih" bukan patokan yang bisa dipakai. Yang dijaga: jangan menambah.
