// src/components/ui/FormStep.jsx
//
// Satu langkah pengisian form: nomor urut + label + isinya.
//
// KENAPA ADA NOMORNYA. Nomor urut biasanya cuma hiasan dan sebaiknya dihindari
// — tapi di form-form aplikasi ini ia menyampaikan sesuatu yang benar. Form
// Sertifikat punya kolom yang muncul dan hilang menurut paket yang dipilih,
// jadi tingginya berubah-ubah dan mudah membuat orang kehilangan tempat. Nomor
// yang tetap memberi titik pegangan ("saya sedang di 3"), dan apa pun yang
// menyembul di bawah nomor 3 jelas milik langkah itu.
//
// URUTAN YANG DIPAKAI: siapa → kapan → apa. Pertanyaan yang paling dulu
// diketahui petugas ditaruh paling atas, dan keputusan yang paling besar —
// yang biasanya juga paling banyak memakan ruang layar — ditaruh terakhir,
// tepat di atas tombol simpan. Kolom yang kemunculannya BERGANTUNG pada
// pilihan lain harus berada DI BAWAH pilihan itu, tidak pernah di atasnya;
// kalau di atas, memilih sesuatu di bawah membuat kolom baru menyembul di luar
// arah pandang, dan itu yang membuat form terasa membingungkan.
//
// Angkanya ditulis manual di setiap pemakaian, bukan dihitung otomatis dari
// urutan anak, supaya urutan alurnya terbaca langsung di JSX — dan supaya
// menukar urutan berarti menukar angkanya secara sadar, bukan diam-diam.

export function FormStep({ n, label, wajib = false, className = "", children }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold tabular-nums text-brand-ink"
        >
          {n}
        </span>
        <span className="text-xs font-medium text-ink-muted">
          {label}
          {wajib && <span className="text-bad"> *</span>}
        </span>
      </div>
      {children}
    </div>
  );
}

export default FormStep;
