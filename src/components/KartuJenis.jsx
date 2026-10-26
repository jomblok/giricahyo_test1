// src/components/KartuJenis.jsx — deretan kartu jenis pohon bergambar.
//
// Mengikuti arah visual rancangan PKM: barisan kartu berfoto di bagian atas
// dashboard, satu per jenis, sebagai pintu masuk sekaligus ringkasan.
//
// MENGAPA JUGA BERFUNGSI SEBAGAI PENYARING. Di rancangan aslinya kartu ini
// hanya hiasan. Dijadikan tombol penyaring, ia membayar ruang yang dipakainya:
// pengurus yang ingin melihat 86 pohon Jati tidak perlu mencari di tabel 179
// baris. Gambar besar yang tidak bisa ditekan hanya memakan layar.
//
// Angka yang ditampilkan NYATA — jumlah pohon dan CO2 dihitung dari data yang
// ada, bukan diisi contoh. Yang sementara hanya gambarnya, dan itu ditandai.

import { gambarJenis, warnaJenis, kreditFoto } from "../lib/fotoJenis";
import { formatNumber } from "../lib/format";
import { useLanguage } from "../lib/LanguageContext";

export default function KartuJenis({ jenis, aktif, onPilih }) {
  const { t } = useLanguage();
  if (!jenis?.length) return null;

  const kredit = kreditFoto(jenis.map((j) => j.nama)).filter((k) => k.lisensi);

  return (
    <>
    <div
      className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x"
      role="group"
      aria-label={t("species_catalog")}
    >
      {jenis.map((j) => {
        const terpilih = aktif === j.nama;
        const gambar = gambarJenis(j.nama);
        const warna = warnaJenis(j.nama);
        return (
          <button
            key={j.nama}
            type="button"
            onClick={() => onPilih?.(terpilih ? null : j.nama)}
            aria-pressed={terpilih}
            className={`group relative w-36 shrink-0 snap-start overflow-hidden rounded-2xl border text-left transition-all ${
              terpilih
                ? "border-brand ring-2 ring-brand/30 bg-brand-soft"
                : "border-line bg-surface hover:border-line-strong"
            }`}
          >
            <div className="relative h-20 w-full overflow-hidden bg-surface-sub">
              {/* Data URI tidak punya permintaan jaringan untuk ditunda, dan
                  `lazy` pada elemen di bawah lipatan menahan dekodenya sampai
                  digulir. Hanya foto asli yang pantas ditunda. */}
              <img
                src={gambar.src}
                alt=""
                aria-hidden="true"
                loading={gambar.sementara ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
              {/* Penanda gambar sementara. Tidak ada gambar pengganti yang
                  boleh lewat tanpa keterangan: di sistem MRV, gambar tanpa
                  penanda akan dibaca sebagai dokumentasi lapangan. */}
              {gambar.sementara && (
                <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] font-semibold text-surface">
                  {t("illustration")}
                </span>
              )}
            </div>

            <div className="p-2.5">
              {/* Membungkus dua baris, tidak dipotong. Beberapa nama membawa
                  keterangan di dalam kurung — "Johar (belum teridentifikasi
                  pasti)" — dan potongannya jatuh tepat di keterangan itu,
                  menyisakan "Johar (belum ter…". Di sistem MRV, catatan bahwa
                  sebuah jenis BELUM DIPASTIKAN adalah hal yang paling tidak
                  boleh hilang: ia menentukan seberapa jauh angka di bawahnya
                  boleh dipercaya. */}
              <p className={`line-clamp-3 text-sm font-bold leading-tight ${warna}`}>{j.nama}</p>

              {/* Nama Latin, miring — mengikuti rancangan, dan memang begitu
                  cara binomial ditulis. Membungkus, tidak dipotong:
                  "Anacardium occ…" kehilangan justru bagian yang
                  membedakannya dari kerabat semarganya. */}
              {j.latin && (
                <p className="mt-0.5 break-words text-[11px] italic leading-tight text-ink-muted">
                  {j.latin}
                </p>
              )}

              <p className="mt-1.5 text-[11px] text-ink-muted">
                <span className={`tabular-nums text-sm font-bold ${warna}`}>
                  {formatNumber(j.jumlah)}
                </span>{" "}
                {t("trees").toLowerCase()}
              </p>

              <p className="mt-0.5 tabular-nums text-[11px] text-ink-muted">
                {formatNumber(j.co2, 0)} kg CO₂
              </p>
            </div>
          </button>
        );
      })}
    </div>

    {/* Kredit — LISENSI MEWAJIBKANNYA, tapi tidak harus selalu terbentang.
        CC BY dan CC BY-SA menuntut nama pembuat dan lisensinya tercantum;
        keduanya tetap ada di halaman, dalam teks biasa, terbaca pembaca layar
        dan mesin pencari, dan tidak terkunci di balik JavaScript — <details>
        bekerja tanpanya.

        Dilipat karena jumlahnya tumbuh bersama katalog: dengan 19 jenis,
        daftar yang terbentang menjadi empat baris dan menenggelamkan kartu
        yang seharusnya jadi isi utama bagian ini. Yang terlihat tertutup
        tetap menyebutkan ada berapa sumber, sehingga keberadaannya jelas
        tanpa harus dibuka.

        Jenis yang fotonya milik koperasi sendiri tidak ikut terhitung
        (lisensi null), jadi bagian ini hilang sendiri begitu seluruh foto
        diganti foto lapangan. */}
    {kredit.length > 0 && (
      <details className="mt-2 text-[11px] text-ink-faint">
        <summary className="cursor-pointer list-none marker:hidden">
          <span className="underline decoration-dotted underline-offset-2">
            {t("photo_credit")} {kredit.length} {t("photo_credit_sources")}
          </span>
        </summary>
        <p className="mt-1.5 leading-relaxed">
          {kredit.map((k, i) => (
            <span key={k.nama}>
              {i > 0 && " · "}
              {k.nama}: {k.oleh} ({k.lisensi})
            </span>
          ))}{" "}
          — Wikimedia Commons
        </p>
      </details>
    )}
    </>
  );
}

