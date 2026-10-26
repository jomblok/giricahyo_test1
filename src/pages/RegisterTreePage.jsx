// src/pages/RegisterTreePage.jsx — petani mendaftarkan pohon baru dari lapangan.
//
// Sebelum ini hanya admin yang bisa menambah pohon (POST /trees adalah
// jwt:admin), sehingga setiap pohon baru harus lewat Excel yang dikirim ke
// pengurus. Berkas survei yang hilang — dan 8 pohon yang selisihnya sampai
// sekarang belum terjelaskan — adalah akibat langsung dari jalur itu.
//
// Di sini pemasukan data pindah ke sumbernya. Yang diminta ke petani hanya
// yang bisa diukur dengan meteran dan diambil HP: jenis, diameter, tinggi,
// koordinat, tanggal tanam. Kerapatan kayu TIDAK diminta — petani tidak punya
// cara mengukurnya, dan katalog sudah menyimpannya per jenis.
//
// Urutan isiannya mengikuti aturan siapa -> kapan -> apa dari DESIGN.md §5,
// dengan keputusan terbesar (ukuran pohon) terakhir, tepat di atas tombol.

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, Sprout, Camera, ImagePlus, X, ShieldCheck, RotateCcw } from "lucide-react";
import AppShell from "../components/AppShell";
import { reportApi, speciesApi } from "../lib/api";
import { useApi } from "../lib/useApi.jsx";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { compressImage, isMobileDevice } from "../lib/compressImage";
import { bacaDraf, hapusDraf, adaIsinya, useSimpanDraf } from "../lib/draf";
import DateField from "../components/ui/DateField";
import { Card, Button, Select, FormStep, SectionHeader } from "../components/ui";

// Satu kunci per form. Bukan satu draf global: dua form berbeda yang dibuka
// bergantian tidak boleh saling menimpa isian.
const KUNCI_DRAF = "daftar-pohon";

export default function RegisterTreePage() {
  const { t } = useLanguage();
  const toast = useToast();

  const { data: katalog } = useApi(() => speciesApi.list(), []);
  const jenisList = katalog?.species ?? katalog ?? [];

  // Draf dibaca SEKALI saat komponen lahir, lewat initializer malas useState.
  // Kalau dibaca di useEffect, form sempat tampil kosong lalu berkedip terisi,
  // dan petani yang keburu mengetik akan bertabrakan dengan pemulihan itu.
  const [drafAwal] = useState(() => bacaDraf(KUNCI_DRAF));
  const [drafDipulihkan, setDrafDipulihkan] = useState(() => adaIsinya(drafAwal));

  const [jenis, setJenis] = useState(drafAwal.jenis ?? "");
  const [dbh, setDbh] = useState(drafAwal.dbh ?? "");
  const [tinggi, setTinggi] = useState(drafAwal.tinggi ?? "");
  const [tanggal, setTanggal] = useState(drafAwal.tanggal ?? "");
  const [koordinat, setKoordinat] = useState(drafAwal.koordinat ?? null);
  const [statusGps, setStatusGps] = useState("idle"); // idle | ambil | gagal
  const [catatan, setCatatan] = useState(drafAwal.catatan ?? "");
  // Foto TIDAK ikut draf: base64-nya bisa ratusan KB dan localStorage hanya
  // ~5 MB untuk seluruh origin. Alasan lengkapnya di lib/draf.js.
  const [foto, setFoto] = useState(null);
  const [memproses, setMemproses] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");
  const [sukses, setSukses] = useState("");

  const jenisTerpilih = jenisList.find((s) => s.name === jenis);

  useSimpanDraf(KUNCI_DRAF, { jenis, dbh, tinggi, tanggal, koordinat, catatan });

  /** Mengosongkan form sekaligus membuang drafnya. */
  function kosongkan() {
    setJenis(""); setDbh(""); setTinggi(""); setTanggal("");
    setKoordinat(null); setCatatan(""); setFoto(null);
    hapusDraf(KUNCI_DRAF);
    setDrafDipulihkan(false);
  }

  function ambilKoordinat() {
    if (!navigator.geolocation) {
      setStatusGps("gagal");
      return;
    }
    setStatusGps("ambil");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKoordinat({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatusGps("idle");
      },
      // Kegagalan GPS adalah hal biasa di lapangan (di bawah tajuk rapat,
      // izin belum diberikan). Pesannya menyebut apa yang harus dilakukan,
      // bukan sekadar "gagal".
      () => setStatusGps("gagal"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function pilihFoto(file) {
    if (!file) return;
    setMemproses(true);
    try {
      setFoto(await compressImage(file));
    } catch {
      setGalat(t("photo_process_failed"));
    } finally {
      setMemproses(false);
    }
  }

  async function kirim(e) {
    e.preventDefault();
    setGalat("");
    setSukses("");

    if (!jenis || !dbh || !tinggi || !tanggal || !koordinat) {
      setGalat(t("fill_all_required") || "Lengkapi semua isian yang wajib.");
      return;
    }

    setMengirim(true);
    try {
      const res = await reportApi.create({
        type: "pohon_baru",
        species: jenis,
        dbh_cm: Number(dbh),
        height_m: Number(tinggi),
        latitude: koordinat.lat,
        longitude: koordinat.lon,
        planted_date: tanggal,
        note: catatan || null,
        photo_url: foto,
      });
      toast.success(t("report_sent"));
      setSukses(res?.message ?? t("report_sent"));
      // Draf dibuang HANYA setelah server menerima. Kalau dibuang sebelum
      // atau saat gagal, isian hilang justru di saat yang paling dibutuhkan.
      kosongkan();
    } catch (err) {
      setGalat(err?.message ?? "Pengajuan gagal.");
    } finally {
      setMengirim(false);
    }
  }

  return (
    <AppShell title={t("nav_register_tree")} showPeriod={false}>
      <div className="max-w-2xl space-y-6">
        <div>
          <SectionHeader>{t("register_tree")}</SectionHeader>
          <p className="text-sm text-ink-muted">{t("register_tree_desc")}</p>
        </div>

        {sukses && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-good-soft px-4 py-3">
            <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-good" />
            <p className="text-sm text-good">{sukses}</p>
          </div>
        )}

        {/* Pemulihan draf TIDAK BOLEH diam-diam. Form yang tiba-tiba terisi
            sendiri membingungkan, dan lebih buruk lagi: petani bisa mengira
            angka lama itu hasil ukur hari ini. Banner ini menyebut apa yang
            kembali, apa yang TIDAK kembali (foto), dan memberi jalan keluar. */}
        {drafDipulihkan && (
          <div className="flex flex-wrap items-start gap-2.5 rounded-2xl border border-line bg-surface-sub px-4 py-3">
            <RotateCcw size={17} className="shrink-0 mt-0.5 text-ink-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t("draft_restored")}</p>
              <p className="text-xs text-ink-muted">{t("draft_restored_desc")}</p>
            </div>
            <Button type="button" size="lg" variant="ghost" onClick={kosongkan}>
              {t("discard_draft")}
            </Button>
          </div>
        )}

        <Card className="p-5">
          <form onSubmit={kirim} className="space-y-6">
            {/* 1. SIAPA/APA — jenis pohon lebih dulu, karena ia menentukan
                   kerapatan kayu yang dipakai menghitung CO2. */}
            <FormStep n={1} label={t("species")} wajib>
              <Select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                placeholder="— Pilih jenis —"
                options={jenisList.map((s) => ({ value: s.name, label: s.name }))}
              />
              {jenis && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  {jenisTerpilih?.density_rho
                    ? `${t("rho_from_catalog")} ρ = ${jenisTerpilih.density_rho}`
                    : t("rho_unknown")}
                </p>
              )}
            </FormStep>

            {/* 2. KAPAN */}
            <FormStep n={2} label={t("planted_date")} wajib>
              <DateField value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </FormStep>

            {/* 3. DI MANA */}
            <FormStep n={3} label={t("coordinates")} wajib>
              {koordinat ? (
                <div className="flex items-center gap-2 rounded-2xl bg-good-soft px-3.5 py-2.5">
                  <CheckCircle2 size={15} className="text-good shrink-0" />
                  <span className="text-sm tabular-nums text-ink">
                    {koordinat.lat.toFixed(5)}, {koordinat.lon.toFixed(5)}
                  </span>
                  <button type="button" onClick={ambilKoordinat}
                          className="ml-auto text-xs text-brand hover:underline">
                    {t("take_location")}
                  </button>
                </div>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={ambilKoordinat} disabled={statusGps === "ambil"}>
                    {statusGps === "ambil"
                      ? <Loader2 size={15} className="animate-spin" />
                      : <MapPin size={15} />}
                    {statusGps === "ambil" ? t("taking_location") : t("take_location")}
                  </Button>
                  {statusGps === "gagal" && (
                    <p className="mt-1.5 text-xs text-bad">{t("location_failed")}</p>
                  )}
                </>
              )}
            </FormStep>

            {/* 4. APA — ukuran, bagian yang paling banyak makan ruang,
                   diletakkan terakhir sesuai aturan siapa->kapan->apa. */}
            <FormStep n={4} label={`DBH (cm) & ${t("height")} (m)`} wajib>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number" step="0.1" min="0.1" max="999"
                  value={dbh} onChange={(e) => setDbh(e.target.value)}
                  placeholder="DBH cm"
                  className="rounded-2xl border border-line bg-surface-sub px-3.5 py-2.5 text-sm tabular-nums text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <input
                  type="number" step="0.1" min="0.1" max="150"
                  value={tinggi} onChange={(e) => setTinggi(e.target.value)}
                  placeholder={`${t("height")} m`}
                  className="rounded-2xl border border-line bg-surface-sub px-3.5 py-2.5 text-sm tabular-nums text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">{t("dbh_hint")}</p>
            </FormStep>

            <FormStep n={5} label={`${t("report_photo")} & ${t("report_note")}`}>
              {foto ? (
                <div className="relative mb-3">
                  <img src={foto} alt="" className="w-full rounded-2xl border border-line" />
                  <button type="button" onClick={() => setFoto(null)}
                          aria-label={t("remove")}
                          className="absolute top-2 right-2 rounded-xl bg-forest-950/70 p-1.5 text-cream-50 hover:bg-forest-950">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mb-3">
                  {isMobileDevice() && (
                    <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-line-strong bg-surface-sub px-3 py-3 text-center text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors">
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                             onChange={(e) => pilihFoto(e.target.files?.[0])} />
                      <Camera size={17} className="mx-auto mb-1" />{t("take_photo")}
                    </label>
                  )}
                  <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-line-strong bg-surface-sub px-3 py-3 text-center text-sm text-ink-muted hover:border-brand hover:text-brand transition-colors">
                    <input type="file" accept="image/*" className="hidden"
                           onChange={(e) => pilihFoto(e.target.files?.[0])} />
                    <ImagePlus size={17} className="mx-auto mb-1" />{t("choose_photo")}
                  </label>
                </div>
              )}
              {memproses && (
                <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Loader2 size={13} className="animate-spin" /> {t("processing")}
                </p>
              )}
              <textarea
                value={catatan} onChange={(e) => setCatatan(e.target.value)}
                rows={2} maxLength={500} placeholder={t("report_note_ph")}
                className="w-full rounded-2xl border border-line bg-surface-sub px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
            </FormStep>

            <div className="flex items-start gap-2.5 rounded-2xl bg-brand-soft px-3.5 py-3">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-brand-ink" />
              <p className="text-xs leading-relaxed text-brand-ink">{t("report_will_be_verified")}</p>
            </div>

            {galat && <p role="alert" className="text-sm text-bad">{galat}</p>}

            <Button type="submit" disabled={mengirim || memproses} className="w-full">
              {mengirim ? <Loader2 size={15} className="animate-spin" /> : <Sprout size={15} />}
              {t("submit_tree")}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
