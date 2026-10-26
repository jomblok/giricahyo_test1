// src/lib/fotoJenis.js — gambar untuk kartu jenis pohon.
//
// ───────────────────────────────────────────────────────────────────────────
// CARA MENGGANTI DENGAN FOTO ASLI — dua langkah
// ───────────────────────────────────────────────────────────────────────────
//   1. Taruh berkasnya di `public/foto-jenis/`, nama jenis dalam huruf kecil
//      dan tanda hubung: `jati.jpg`, `kayu-putih.jpg`.
//   2. Tambahkan nama jenisnya ke BERFOTO di bawah.
//
// DAFTAR EKSPLISIT, BUKAN MENCOBA LALU GAGAL. Versi pertama mencoba memuat
// foto lebih dulu dan jatuh ke ilustrasi lewat onError. Itu salah karena dua
// hal: server pengembangan Vite menjawab berkas yang tidak ada dengan
// index.html (fallback SPA), sehingga permintaannya TIDAK PERNAH gagal dan
// gambarnya menggantung selamanya; dan seandainya pun gagal, setiap kartu
// menghasilkan satu permintaan sia-sia pada tiap pemuatan halaman.
//
// ───────────────────────────────────────────────────────────────────────────
// KENAPA ILUSTRASI, BUKAN FOTO STOK
// ───────────────────────────────────────────────────────────────────────────
// Godaan termudah adalah menarik foto pohon dari layanan foto stok supaya
// tampilannya langsung penuh. Itu ditolak dengan sengaja.
//
// Ini sistem MRV: seluruh nilainya bergantung pada apakah yang ditampilkan
// benar-benar mewakili pohon di Desa Giricahyo. Foto pohon jati milik orang
// lain, di negara lain, yang tampil di kartu "Jati — 86 pohon" akan dibaca
// sebagai dokumentasi lapangan oleh siapa pun yang melihatnya — termasuk
// penguji dan calon pendukung. Tidak ada tulisan "foto ilustrasi" yang cukup
// kuat melawan kesan itu.
//
// Ilustrasi yang jelas-jelas gambar tidak pernah tertukar dengan foto. Ia
// mengisi tata letaknya tanpa mengaku jadi bukti.

/**
 * Jenis yang fotonya sudah ada di public/foto-jenis/, beserta atribusinya.
 *
 * ATRIBUSI ADALAH SYARAT LISENSI, BUKAN BASA-BASI. Foto-foto ini diambil dari
 * Wikimedia Commons. Yang berlisensi CC BY dan CC BY-SA MEWAJIBKAN nama
 * pembuat dan lisensinya dicantumkan; memakainya tanpa itu adalah pelanggaran
 * lisensi. Karena itu datanya hidup di sini, bersebelahan dengan nama
 * berkasnya — bukan di catatan terpisah yang gampang ketinggalan saat ada yang
 * menambah atau mengganti foto.
 *
 * Yang berlisensi CC0 tidak mewajibkannya, tapi tetap dicantumkan.
 *
 * CATATAN CC BY-SA: memotong dan mengubah ukuran menghasilkan karya turunan,
 * yang harus tetap berlisensi sama. Itu berlaku pada FOTONYA, bukan pada
 * seluruh aplikasi ini.
 *
 * MENGGANTI DENGAN FOTO LAPANGAN SENDIRI — dua langkah:
 *   1. Timpa berkasnya di public/foto-jenis/ (jati.jpg, kayu-putih.jpg, …).
 *   2. Ganti barisnya di bawah jadi { oleh: "Nama pemotret", lisensi: null }.
 *      `lisensi: null` berarti milik koperasi sendiri — baris atribusinya
 *      otomatis tidak menyebut lisensi luar.
 */
const BERFOTO = {
  "Jati":     { oleh: "Dadjosm",                    lisensi: "CC BY-SA 4.0" },
  "Mahoni":   { oleh: "Krzysztof Ziarnek, Kenraiz", lisensi: "CC BY-SA 4.0" },
  "Sirsak":   { oleh: "Vijayanrajapuram",           lisensi: "CC BY-SA 4.0" },
  "Melinjo":  { oleh: "Wiki Farazi",                lisensi: "CC0" },
  "Kelapa":   { oleh: "Lokeswaran Kaliyappan",      lisensi: "CC BY 4.0" },
  "Sengon":   { oleh: "Forest & Kim Starr",         lisensi: "CC BY 3.0 US" },
  "Beringin": { oleh: "July09jy",                   lisensi: "CC BY-SA 4.0" },
  "Kluwih":   { oleh: "Chuck Wilson",               lisensi: "CC0" },

  "Nangka":      { oleh: "Sanu N",             lisensi: "CC BY-SA 4.0" },
  "Johar":       { oleh: "Wee Hong",           lisensi: "CC BY-SA 4.0" },
  "Dulisen":     { oleh: "Lannafolium",        lisensi: "CC0" },
  "Lo/Loa":      { oleh: "DXLINH",             lisensi: "Domain publik" },
  "Wunut":       { oleh: "Dan5990",            lisensi: "CC BY-SA 4.0" },
  "Joho Keling": { oleh: "Kaushlendrapathe",   lisensi: "CC BY 4.0" },
  "Pule":        { oleh: "Manhdeptraipro2114", lisensi: "CC BY-SA 4.0" },
  "Tingi":       { oleh: "Dinesh Valke",       lisensi: "CC BY-SA 2.0" },
  "Flamboyan":   { oleh: "Kaushlendrapathe",   lisensi: "CC BY 4.0" },
  "Asam Jawa":   { oleh: "FazeelaNizam13",     lisensi: "CC BY-SA 4.0" },
  "Akasia":      { oleh: "CSIRO",              lisensi: "CC BY 3.0" },
  "Trembesi":    { oleh: "Basile Morin",       lisensi: "CC BY-SA 4.0" },
  "Lamtoro":     { oleh: "Awahab515",          lisensi: "CC BY-SA 4.0" },
  "Kayu Putih":  { oleh: "R. Purdie",          lisensi: "CC BY 3.0" },
  "Nyamplung":   { oleh: "P1898",              lisensi: "CC BY 4.0" },
  "Sono Keling": { oleh: "Dinesh Valke",       lisensi: "CC BY-SA 2.0" },
  "Jambu Mete":  { oleh: "Fatimah Bello",      lisensi: "CC BY-SA 4.0" },

  // SENGAJA TIDAK ADA DI SINI: "Johar (belum teridentifikasi pasti)".
  //
  // Nama Latinnya NULL di katalog — datanya sendiri menyatakan jenisnya belum
  // dipastikan. Memberinya foto berarti menciptakan klaim yang justru
  // dibantah oleh catatannya sendiri: pembaca melihat pohon tertentu dan
  // menyimpulkan jenisnya sudah diketahui.
  //
  // Ilustrasi di tempatnya bukan kekurangan, melainkan jawaban yang benar —
  // ia mengisi tata letak tanpa menyatakan apa pun tentang jenisnya. Isi
  // baris ini hanya setelah jenisnya benar-benar dipastikan di lapangan,
  // bersamaan dengan memperbarui scientific_name-nya.
};

/** Daftar atribusi untuk jenis yang sedang ditampilkan — dipakai KartuJenis
 *  untuk mencetak satu baris kredit di bawah barisan kartu. */
export function kreditFoto(daftarNama) {
  const keluar = [];
  for (const nama of daftarNama) {
    const k = BERFOTO[nama];
    if (k) keluar.push({ nama, ...k });
  }
  return keluar;
}

/** Nama jenis -> nama berkas: "Kayu Putih" -> "kayu-putih" */
function keSlug(nama) {
  return String(nama || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Dua angka acuan yang diturunkan dari nama jenisnya: rona dan bentuk tajuk.
 *
 * DITURUNKAN, BUKAN DIACAK. Kartu yang sama tidak boleh berganti rupa tiap
 * halaman dimuat — pengurus harus bisa mengenali "yang hijau tua kerucut itu
 * Pinus" tanpa membaca. Nilai acak menghancurkan kemampuan itu.
 *
 * DUA PENGADUK TERPISAH. Versi pertama hanya memakai satu nilai untuk rona,
 * dalam rentang 95-150. Hasilnya kedelapan kartu tampak kembar: rentangnya
 * terlalu sempit untuk dibedakan mata, dan tajuknya seragam. Sebagai indeks
 * visual itu tidak ada gunanya. Pengganda yang berbeda (31 dan 17) membuat
 * rona dan bentuk bergerak sendiri-sendiri, sehingga dua jenis yang kebetulan
 * seronanya hampir pasti berbeda bentuk.
 */
function kodeDari(nama, pengganda) {
  let h = 0;
  for (const c of String(nama || "")) h = (h * pengganda + c.charCodeAt(0)) % 9973;
  return h;
}

/** Empat siluet tajuk, dipilih dari nama. Pembeda terkuat setelah warna. */
function tajuk(bentuk, daun) {
  const o88 = `fill="${daun}" opacity=".88"`;
  const o70 = `fill="${daun}" opacity=".7"`;
  switch (bentuk) {
    case 1: // kerucut — cemara, pinus
      return `<path d="M80 16 L104 54 H56 Z" fill="${daun}"/>
<path d="M80 34 L110 74 H50 Z" ${o88}/>
<path d="M80 52 L116 92 H44 Z" ${o70}/>`;
    case 2: // bertingkat — jati, mahoni
      return `<ellipse cx="80" cy="30" rx="26" ry="11" fill="${daun}"/>
<ellipse cx="80" cy="50" rx="38" ry="13" ${o88}/>
<ellipse cx="80" cy="70" rx="30" ry="11" ${o70}/>`;
    case 3: // ramping — sengon, kayu putih
      return `<ellipse cx="80" cy="46" rx="18" ry="34" fill="${daun}"/>
<ellipse cx="64" cy="54" rx="11" ry="22" ${o88}/>
<ellipse cx="96" cy="54" rx="11" ry="22" ${o70}/>`;
    default: // bulat merimbun — beringin, sirsak
      return `<circle cx="80" cy="46" r="26" fill="${daun}"/>
<circle cx="58" cy="58" r="18" ${o88}/>
<circle cx="102" cy="58" r="18" ${o88}/>
<circle cx="68" cy="34" r="14" ${o70}/>
<circle cx="94" cy="36" r="12" ${o70}/>`;
  }
}

// Hasilnya disimpan karena satu halaman bisa memanggil ini ratusan kali:
// katalog adopsi pembeli merender 179 kartu, dan tiap render membangun ulang
// SVG ~1,2KB lalu meng-encode-nya. Jumlah jenis selalu kecil (puluhan), jadi
// peta ini tidak akan tumbuh liar.
const simpanan = new Map();

/** Ilustrasi pohon sebagai data URI. Tanpa permintaan jaringan. */
export function ilustrasiJenis(nama) {
  const tersimpan = simpanan.get(nama);
  if (tersimpan) return tersimpan;

  const k = kodeDari(nama, 31);
  // Rentang 70-170 membentang dari hijau zaitun sampai hijau kebiruan, dan
  // kecerahan ikut bergeser. Keduanya perlu: rona saja, pada kecerahan yang
  // sama, masih sulit dipisahkan pada petak kecil 142x80.
  const rona = 70 + (k % 100);
  const terang = 30 + ((k >> 3) % 16);
  const daun = `hsl(${rona} 34% ${terang}%)`;
  const batang = `hsl(${rona} 28% ${terang - 10}%)`;
  const langit = `hsl(${rona} 22% ${94 - (k % 5)}%)`;
  const tanah = `hsl(${rona} 20% 85%)`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">
<rect width="160" height="120" fill="${langit}"/>
<ellipse cx="80" cy="118" rx="70" ry="14" fill="${tanah}"/>
<rect x="76" y="62" width="8" height="46" rx="3" fill="${batang}"/>
${tajuk(kodeDari(nama, 17) % 4, daun)}
</svg>`;

  // width/height WAJIB ADA, bukan hiasan. SVG yang hanya ber-viewBox punya
  // rasio tanpa ukuran intrinsik; sebagai sumber <img> ia gagal didekode dan
  // kotaknya tetap kosong (naturalWidth 0).
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  simpanan.set(nama, uri);
  return uri;
}

// Kelas ditulis UTUH, bukan dirakit jadi `text-jenis-${n}`.
//
// Tailwind memindai berkas sumber sebagai teks biasa dan hanya membuat kelas
// yang benar-benar tertulis di dalamnya. Nama kelas yang dirakit saat berjalan
// tidak pernah terlihat olehnya, jadi aturannya tidak ikut dibuat — teksnya
// lalu mewarisi warna induk tanpa galat apa pun, dan cacat seperti ini hanya
// ketahuan kalau ada yang memperhatikan warnanya hilang.
//
// Terverifikasi dengan mencari `text-jenis-` di dalam CSS hasil build: versi
// yang dirakit menghasilkan nol kecocokan.
const KELAS_WARNA = [
  "text-jenis-1", "text-jenis-2", "text-jenis-3",
  "text-jenis-4", "text-jenis-5", "text-jenis-6",
];

/**
 * Kelas warna aksen sebuah jenis. Diturunkan dari nama dengan pengaduk ketiga
 * (13), terpisah dari rona dan bentuk, supaya dua jenis yang kebetulan sewarna
 * tetap berbeda ilustrasinya. Nilai warnanya ada di :root pada index.css,
 * lengkap dengan rasio kontras terukurnya.
 */
export function warnaJenis(nama) {
  return KELAS_WARNA[kodeDari(nama, 13) % KELAS_WARNA.length];
}

/**
 * Gambar untuk sebuah jenis, beserta penanda apakah ia masih sementara.
 * Kartu memakai `sementara` untuk menampilkan label, supaya tidak ada gambar
 * pengganti yang lewat tanpa keterangan.
 */
export function gambarJenis(nama) {
  const kredit = BERFOTO[nama];
  if (kredit) {
    return { src: `/foto-jenis/${keSlug(nama)}.jpg`, sementara: false, kredit };
  }
  return { src: ilustrasiJenis(nama), sementara: true, kredit: null };
}
