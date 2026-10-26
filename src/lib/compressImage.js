// src/lib/compressImage.js
//
// Diangkat dari dalam AddTreePhotoModal.jsx ketika laporan lapangan petani
// ditambahkan — tiga tempat sekarang mengirim foto (tambah foto pohon, lapor
// kondisi, daftarkan pohon baru), dan tiga salinan logika kompresi berarti
// tiga batas ukuran yang bisa melenceng sendiri-sendiri.
//
// KENAPA DIKOMPRES SAMA SEKALI: foto disimpan sebagai data URI di kolom
// longtext, bukan sebagai berkas. Foto mentah kamera HP 4 MB akan menjadi
// string base64 sekitar 5,3 MB — di atas batas validasi 2.000.000 karakter,
// dan dikirim lewat jaringan desa yang lambat. Hasil kompresi ini sekitar
// 150–300 KB.
//
// Angka 1024px dipilih karena foto ini dilihat di kartu dasbor dan halaman
// publik, bukan dicetak; kualitas 0,72 adalah titik di mana artefak JPEG mulai
// terlihat pada daun — di bawah itu tanda-tanda hama yang justru dilaporkan
// petani ikut hilang.

export function compressImage(file, maxPx = 1024, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca."));
    };

    img.src = url;
  });
}

// Kamera belakang hanya berguna di perangkat yang punya dua kamera. Di laptop,
// atribut `capture` justru membuka kamera depan dan membuat tombol "Ambil
// Foto" terasa rusak — jadi tombolnya disembunyikan saja di sana.
export const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
