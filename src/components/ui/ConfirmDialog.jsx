// src/components/ui/ConfirmDialog.jsx
//
// Dialog konfirmasi untuk tindakan yang tidak bisa dibatalkan.
//
// KENAPA BUKAN window.confirm(): kotak bawaan peramban hanya bisa menampilkan
// satu baris teks polos. Untuk penghapusan di aplikasi ini itu tidak cukup —
// yang perlu diketahui admin sebelum menekan "Hapus" bukan "yakin?", melainkan
// APA SAJA YANG IKUT HILANG. Menghapus satu sertifikat juga menghapus baris
// pemasukan Rp 50.000 dari Carbon Fund dan membebaskan pohonnya; menghapus satu
// pohon juga menghapus riwayat pengukuran karbon dan fotonya. Fakta-fakta itu
// harus terbaca di layar pada saat keputusan diambil, bukan ditemukan setelah
// datanya sudah hilang.
//
// Kotak bawaan juga tidak mengikuti tema, tidak bisa menampilkan keadaan
// "sedang menghapus", dan tampil berbeda di tiap peramban.
//
// Perilaku dialog (Escape, jebakan fokus, kunci gulir, kembalikan fokus)
// datang gratis dari ModalPortal.

import { AlertTriangle, X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { Button } from "./Button";

/**
 * @param {string}   title        judul singkat, mis. "Hapus sertifikat?"
 * @param {string}   message      kalimat utama yang menyebut objeknya
 * @param {string[]} [consequences] daftar hal yang ikut berubah — inti dialog ini
 * @param {string}   [confirmLabel]
 * @param {string}   [cancelLabel]
 * @param {boolean}  [loading]    tombol dikunci selagi permintaan berjalan
 * @param {() => void} onConfirm
 * @param {() => void} onClose
 */
export function ConfirmDialog({
  title,
  message,
  consequences = [],
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  closeLabel = "Tutup",
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    // onClose diteruskan supaya Escape membatalkan — batal memang jalan keluar
    // yang aman di sini, jadi tidak ada alasan mempersulitnya.
    <ModalPortal onClose={loading ? undefined : onClose}>
      <div
        className="gjr-overlay-in fixed inset-0 z-[80] flex items-center justify-center bg-forest-950/60 p-4 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="gjr-confirm-title"
          className="gjr-panel-in w-full max-w-sm overflow-hidden rounded-3xl bg-surface shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 border-b border-line px-6 py-5">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bad-soft text-bad">
              <AlertTriangle size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="gjr-confirm-title" className="text-sm font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{message}</p>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={onClose}
                // Sengaja BUKAN cancelLabel: tombol Batal di bawah sudah
                // memakai label itu, dan dua kontrol berbunyi "Batal" membuat
                // pembaca layar menyebutkan pilihan yang sama dua kali.
                aria-label={closeLabel}
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-surface-sub hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {consequences.length > 0 && (
            <ul className="space-y-1.5 bg-surface-sub px-6 py-4">
              {consequences.map((c) => (
                <li key={c} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-bad" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2 px-6 py-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            {/* data-autofocus SENGAJA tidak dipasang di tombol hapus.
                ModalPortal memfokuskan elemen pertama, yaitu tombol Batal —
                jadi menekan Enter karena refleks membatalkan, bukan menghapus. */}
            <Button variant="danger" onClick={onConfirm} disabled={loading}>
              {loading && (
                <span className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-bad/30 border-t-bad align-[-2px]" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ConfirmDialog;
