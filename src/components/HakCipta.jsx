// src/components/HakCipta.jsx — baris hak cipta di kaki halaman.
//
// SATU KOMPONEN, BUKAN TEKS YANG TERSEBAR. Dipasang sekali di AppShell (semua
// halaman setelah masuk) dan di dua halaman yang berdiri sendiri: login dan
// halaman publik pohon yang dibuka tamu lewat QR. Mengganti nama pemilik atau
// tahun cukup di sini.
//
// Tahunnya dihitung, bukan ditulis mati: "© 2026" yang tertinggal di tahun 2028
// terlihat seperti situs yang ditelantarkan. Mulai tahun berikutnya ia menjadi
// rentang "2026–2027", sesuai kebiasaan penulisan hak cipta.
//
// Foto jenis dari Wikimedia Commons TIDAK tercakup klaim ini — lisensi CC-nya
// tetap milik pemotretnya dan tercantum di baris kredit di bawah kartu jenis.

import { useLanguage } from "../lib/LanguageContext";

const TAHUN_MULAI = 2026;
const PEMILIK = "Koperasi Griya Jati Rasa, Desa Giricahyo";

/**
 * @param {boolean} gelap  true untuk halaman berlatar gelap tetap (login,
 *                         halaman publik pohon) yang tidak ikut tema.
 */
export default function HakCipta({ gelap = false, className = "" }) {
  const { t } = useLanguage();
  const sekarang = new Date().getFullYear();
  const tahun = sekarang > TAHUN_MULAI ? `${TAHUN_MULAI}–${sekarang}` : String(TAHUN_MULAI);

  return (
    <footer
      className={`text-center text-[11px] leading-relaxed ${
        gelap ? "text-cream-50/60" : "text-ink-faint"
      } ${className}`}
    >
      © {tahun} Giricahyo Carbon — {PEMILIK}. {t("copyright_rights")}
    </footer>
  );
}
