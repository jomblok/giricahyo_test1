# Giricahyo Carbon Dashboard

Dashboard admin/koperasi untuk manajemen bisnis karbon komunitas Giricahyo.
Front-end only — semua data sekarang masih **mock data** (data contoh), siap
diganti ke API sungguhan saat backend kamu jadi.

## Cara menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

Untuk build production (hasil siap upload/deploy ke Vercel):
```bash
npm run build
```
Hasilnya ada di folder `dist/`.

## Struktur project

```
src/
  data/             <- MOCK DATA. Ini yang nanti diganti jadi fetch ke API.
    farmers.js          (tabel: farmers)
    trees.js            (tabel: trees)
    carbonFundIncome.js (tabel: carbon_fund_income)
    fundDistribution.js (tabel: fund_distribution)
    carbonSalaries.js   (tabel: carbon_salaries)
    trendData.js        (hasil agregasi per tahun)

  lib/
    format.js       <- helper format Rupiah, angka, tanggal
    joins.js        <- "JOIN" antar mock data (mensimulasikan JOIN SQL).
                        Fungsi di sini yang nanti diganti jadi pemanggilan
                        endpoint API yang sudah melakukan JOIN di backend.

  components/        <- semua bagian UI (KPI card, tabel, peta, grafik, dst)
  App.jsx             <- menyusun semua section dashboard
```

## Cara mengganti mock data jadi API asli (untuk backend kamu nanti)

Setiap file di `src/data/` punya komentar `// TODO: ganti dengan fetch(...)`.
Pola penggantiannya seperti ini:

**Sebelum (mock):**
```js
// src/data/farmers.js
export const farmers = [
  { id: "F001", name: "Pak Slamet Riyadi", ... },
  ...
];
```

**Sesudah (API asli), pakai React state + useEffect di komponen yang
memakainya** — atau kamu bisa bikin custom hook seperti ini di `lib/`:

```js
// src/lib/useFarmers.js
import { useEffect, useState } from "react";

export function useFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/farmers")
      .then((res) => res.json())
      .then(setFarmers)
      .finally(() => setLoading(false));
  }, []);

  return { farmers, loading };
}
```

Lalu di komponen yang sebelumnya `import { farmers } from "../data/farmers"`,
ganti jadi `const { farmers, loading } = useFarmers();`

Fungsi-fungsi di `lib/joins.js` (seperti `getFarmersWithSalary`) juga bisa
langsung dipindah logikanya ke backend sebagai satu endpoint
(`GET /api/farmers-with-salary`) supaya front-end tidak perlu join manual.

## Skema database (acuan, untuk backend)

Lihat 5 tabel ini sebagai dasar skema SQL (PostgreSQL/MySQL):

- `farmers` (id, name, group_coop, address, status)
- `trees` (id, farmer_id, species, dbh_cm, height_m, density_rho, latitude,
  longitude, health_status, planted_date, last_updated)
- `carbon_measurements` (id, tree_id, measurement_date, agb_kg, bgb_kg,
  total_biomass_kg, carbon_stock_kg, co2_eq_kg)
- `carbon_fund_income` (id, date, source, qty, unit_price, total_amount)
- `fund_distribution` (id, component, percentage, amount, period)
- `carbon_salaries` (id, farmer_id, period, total_co2_kg, co2_proportion_pct,
  base_salary, social_incentive_pct, ecological_incentive_pct,
  participation_incentive_pct, final_salary)
- `tree_adoptions` (id, tree_id, buyer_id, buyer_name, adopted_date,
  package_name, certificate_no)

Penamaan kolom di atas pakai `snake_case` (konvensi SQL), sedangkan di kode
JavaScript otomatis jadi `camelCase` (contoh: `farmer_id` → `farmerId`).
Ini konvensi standar, kamu tidak perlu menyamakan keduanya secara manual —
biasanya library backend (Prisma dkk) yang menangani konversi ini.

## Palet warna (token desain)

| Nama         | Hex       | Pemakaian                          |
|--------------|-----------|-------------------------------------|
| forest-950   | `#0e2a21` | teks paling gelap                   |
| forest-900   | `#15392e` | header, navbar                      |
| sage-600     | `#2f6e51` | aksen sekunder, chart                |
| gold-500     | `#c89b3c` | highlight angka penting (gaji, dana) |
| cream-50     | `#f6f3ea` | background utama                    |
| clay-700     | `#7a1e14` | status "buruk" / peringatan         |

## Halaman Demo End-to-End: Generate QR → Scan → Hasil

Akses lewat tombol "Demo Alur QR" di header dashboard, atau langsung ke
`/demo-qr`. Ini mendemokan alur lengkap dari PDF "Sistem Digital
Inventarisasi Pohon": Tagging → Scanning → Reporting, dengan kamera
SUNGGUHAN (pakai library `html5-qrcode`), bukan simulasi.

**Alurnya:**
1. **Pilih pohon dummy** dari dropdown → QR code langsung digenerate
   (pakai `qrcode.react`). Isi QR adalah URL ke halaman publik pohon itu,
   contoh: `http://localhost:5173/pohon/GJR-002-001`
2. **Klik "Lanjut ke Scan"** → browser akan minta izin akses kamera
3. **Arahkan kamera ke QR** dari langkah 1 — bisa ditampilkan di layar HP
   lain, laptop lain, atau di-print di kertas
4. Begitu terbaca, otomatis pindah ke **halaman hasil** yang menunjukkan
   data pohon (jenis, petani, koordinat, estimasi CO₂) — bukti scan
   berhasil dan tercocokkan ke data sistem

### ⚠️ Penting soal kamera & HTTPS

Browser **hanya mengizinkan akses kamera lewat HTTPS atau localhost**, ini
keamanan bawaan browser, bukan limitasi dari kode kita. Konsekuensinya:

- **Di laptop/komputer kamu sendiri** (`http://localhost:5173`) → kamera
  akan jalan normal.
- **Kalau dites dari HP lain di jaringan WiFi yang sama**, mengakses lewat
  `http://192.168.x.x:5173` → kamera **TIDAK akan jalan** karena itu bukan
  localhost maupun HTTPS. Solusinya nanti setelah deploy ke Vercel
  (otomatis HTTPS), atau pakai tool tunnel seperti `ngrok`/`localtunnel`
  saat masih development.
- Kalau muncul pesan error "Tidak bisa mengakses kamera" di halaman demo,
  kemungkinan besar karena ini, atau karena kamu belum memberi izin akses
  kamera di pop-up permission browser.

### Cara test paling praktis sekarang
Cara termudah untuk coba sendirian tanpa perlu dua device: buka dua tab
browser di laptop yang sama. Tab 1 di halaman `/demo-qr` step "Generate"
(tampilkan QR-nya besar di layar), Tab 2 juga di `/demo-qr` tapi langsung
ke step "Scan" — lalu arahkan kamera laptop ke layar Tab 1.



Ini mengimplementasikan mekanisme dari PDF "Sistem Digital Inventarisasi
Pohon": setiap pohon punya barcode/QR fisik. Ada **dua jalur scan** yang
berbeda kebutuhannya:

### 1. Halaman publik `/pohon/:id` — untuk siapa saja, tanpa login
Ini yang dituju oleh QR code FISIK yang ditempel di pohon. Saat orang lewat
dan scan pakai kamera HP biasa (bukan kamera di dalam app kita), browser
langsung membuka URL ini. Contoh: `https://giricahyo.id/pohon/GJR-002-001`.

Isinya disengaja seadanya — hanya 4 hal: jenis pohon, nama petani pemilik,
lokasi koordinat, dan estimasi serapan karbon. Tidak ada data sensitif
(gaji, dll).

**Untuk diterapkan ke barcode fisik:** generate QR code yang isinya adalah
URL halaman ini (pakai library seperti `qrcode` di Node, atau situs gratis
seperti qr-code-generator.com saat masih tahap pilot), lalu print & tempel
di pohon.

### 2. Scan Barcode di dalam dashboard — untuk user yang sudah login
Tombol "Scan Barcode" di pojok kanan atas dashboard. Saat ini **masih mock**
(klik tombol → animasi memindai 1.2 detik → pilih pohon secara acak dari
data), karena kamu bilang ingin fokus ke tampilan & alur dulu.

**Untuk membuat ini fungsional (baca kamera sungguhan):**
1. Install library scan: `npm install html5-qrcode`
2. Di `src/components/ScanBarcodeButton.jsx`, ganti bagian `setTimeout` di
   fungsi `handleScan` dengan pemanggilan kamera dari `html5-qrcode` —
   library itu akan memberi callback berisi teks yang terbaca dari
   barcode/QR (ini akan menjadi `treeId`-nya).
3. Hasil baca itu dipakai untuk memanggil `getTreeDetail(treeId)` di
   `lib/joins.js` (sudah disiapkan), lalu ditampilkan lewat
   `ScanResultModal`.

Tampilan hasil scan **berubah sesuai role** (`admin` / `farmer` / `buyer`):
- **Admin** — semua data teknis (DBH, tinggi, tanggal tanam) + tombol aksi
  pengelolaan
- **Petani** — proporsi CO₂ dan gaji karbon dari pohon tersebut
- **Buyer** — status dukungan/adopsi dan nomor sertifikat

Role ini untuk sekarang disimulasikan lewat dropdown "Login sebagai" di
header (supaya kamu bisa coba ketiganya tanpa sistem login sungguhan).
Nanti tinggal dihubungkan ke role asli dari sesi login.



- Peta pakai **Leaflet + OpenStreetMap** (gratis, tanpa API key).
- Grafik pakai **Recharts**.
- Ikon pakai **lucide-react**.
- Koordinat pohon di mock data berpusat di sekitar Giricahyo, Purwosari,
  Gunungkidul — ganti dengan koordinat asli saat data sungguhan tersedia.
