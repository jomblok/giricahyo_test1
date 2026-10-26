// src/components/AccountRowActions.jsx — aksi pengelolaan satu akun.
//
// MASALAH YANG DIPECAHKAN. Backend sudah lama punya tiga endpoint pengelolaan
// akun — nonaktifkan, aktifkan kembali, setel ulang kata sandi — tapi tidak
// satu pun pernah dipanggil dari antarmuka. Baris akun di halaman Pengguna
// hanya menampilkan nama, email dan ID; tidak ada tombol apa pun.
//
// Akibatnya dua hal yang pasti terjadi di koperasi desa tidak punya jalan
// keluar sama sekali: petani yang lupa kata sandinya, dan akun yang harus
// dihentikan saat pengurusnya berganti. Keduanya hanya bisa diselesaikan
// dengan menyunting basis data langsung.

import { useState } from "react";
import { KeyRound, UserMinus, UserCheck, Loader2, X } from "lucide-react";
import { accountApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { useModalBehavior } from "../lib/useModalBehavior";
import { ModalPortal } from "./ui/ModalPortal";
import { Button, FormStep } from "./ui";

// Sama dengan aturan backend (Password::min(8)->letters()->numbers()), supaya
// pengguna tahu syaratnya SEBELUM mengirim, bukan lewat galat 422.
const MIN_PANJANG = 8;

function kataSandiValid(nilai) {
  return nilai.length >= MIN_PANJANG && /[A-Za-z]/.test(nilai) && /[0-9]/.test(nilai);
}

function ResetPasswordModal({ akun, onClose, onSelesai }) {
  const panelRef = useModalBehavior(true, onClose);
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();

  // Mengubah kata sandi AKUN SENDIRI wajib menyertakan yang lama — aturan
  // backend, dan alasannya bagus: tanpa itu siapa pun yang menemukan layar
  // admin yang tertinggal terbuka bisa mengunci pemiliknya keluar. Tanpa
  // kolom ini modalnya jadi jalan buntu: tombolnya ada, tapi selalu gagal.
  const akunSendiri = user?.id === akun.id;

  const [lama, setLama] = useState("");
  const [nilai, setNilai] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");

  async function kirim() {
    setGalat("");
    if (!kataSandiValid(nilai)) {
      setGalat(t("password_rule"));
      return;
    }
    if (akunSendiri && !lama) {
      setGalat(t("current_password_required"));
      return;
    }

    setMengirim(true);
    try {
      await accountApi.updatePassword(akun.id, nilai, akunSendiri ? lama : undefined);
      toast.success(t("toast_password_reset"));
      onSelesai?.();
      onClose();
    } catch (err) {
      setGalat(err?.message ?? t("toast_failed"));
    } finally {
      setMengirim(false);
    }
  }

  return (
    <ModalPortal onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-md gjr-overlay-in">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("reset_password")}
          className="my-8 flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-surface text-ink shadow-2xl gjr-panel-in"
        >
          <div className="flex items-start justify-between gap-3 border-b border-line p-5">
            <div className="min-w-0">
              <h2 className="gjr-display text-lg font-bold text-ink">{t("reset_password")}</h2>
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {akun.name} · {akun.email}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="shrink-0 rounded-xl p-2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {akunSendiri && (
              <FormStep n={1} label={t("current_password")} wajib>
                <input
                  type="password"
                  value={lama}
                  onChange={(e) => setLama(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-line bg-surface-sub px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
                />
              </FormStep>
            )}

            <FormStep n={akunSendiri ? 2 : 1} label={t("new_password")} wajib>
              <input
                type="text"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                autoComplete="off"
                placeholder={t("password_rule")}
                className="w-full rounded-xl border border-line bg-surface-sub px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
              />
              {/* Sengaja type="text": pengurus harus bisa MEMBACA kata sandi
                  yang dibuatnya untuk dibacakan ke petani lewat telepon.
                  Menyembunyikannya di layar admin tidak menambah keamanan —
                  nilainya memang untuk disampaikan. */}
              <p className="mt-2 text-xs text-ink-muted">{t("reset_password_hint")}</p>
            </FormStep>

            {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-line p-5">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={kirim} disabled={mengirim}>
              {mengirim ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
              {t("save")}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default function AccountRowActions({ akun, onBerubah }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [bukaReset, setBukaReset] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  const nonaktif = Boolean(akun.deactivated);

  async function alihkanAktif() {
    setSibuk(true);
    try {
      if (nonaktif) {
        await accountApi.activate(akun.id);
        toast.success(t("toast_account_activated"));
      } else {
        await accountApi.deactivate(akun.id);
        toast.success(t("toast_account_deactivated"));
      }
      onBerubah?.();
    } catch (err) {
      // Pesan backend sudah berbahasa Indonesia dan menjelaskan sebabnya
      // (mis. "Minimal satu akun admin harus aktif"), jadi ditampilkan apa adanya.
      toast.error(err?.message ?? t("toast_failed"));
    } finally {
      setSibuk(false);
    }
  }

  return (
    <>
      {/* Baris sendiri di ponsel. Diukur pada lebar 375px: baris akun hanya
          269px, dan tombol-tombol ini memakan 92px — menyisakan 83px untuk
          nama dan email, sehingga "admin@giricahyo.id" (butuh 104px)
          terpotong. Dengan tombol pindah ke bawah, kolom teks mendapat
          sekitar 220px dan keduanya terbaca utuh. */}
      <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
        <button
          type="button"
          onClick={() => setBukaReset(true)}
          title={t("reset_password")}
          aria-label={`${t("reset_password")} — ${akun.name}`}
          className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <KeyRound size={15} />
        </button>

        <button
          type="button"
          onClick={alihkanAktif}
          disabled={sibuk}
          title={nonaktif ? t("activate_account") : t("deactivate_account")}
          aria-label={`${nonaktif ? t("activate_account") : t("deactivate_account")} — ${akun.name}`}
          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
            nonaktif
              ? "text-good hover:bg-good-soft"
              : "text-ink-faint hover:bg-bad-soft hover:text-bad"
          }`}
        >
          {sibuk ? (
            <Loader2 size={15} className="animate-spin" />
          ) : nonaktif ? (
            <UserCheck size={15} />
          ) : (
            <UserMinus size={15} />
          )}
        </button>
      </div>

      {bukaReset && (
        <ResetPasswordModal akun={akun} onClose={() => setBukaReset(false)} onSelesai={onBerubah} />
      )}
    </>
  );
}
