import { useModalBehavior } from "../lib/useModalBehavior";
import { useLanguage } from "../lib/LanguageContext";
import { useToast } from "../lib/ToastContext";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, TreeDeciduous, User, Wind, ShieldCheck, AlertTriangle, Loader2, Camera, ImageOff, ChevronLeft, ChevronRight, MapPin, Download, Calendar, Ruler } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { treeApi } from "../lib/api";
import { formatNumber, formatDate } from "../lib/format";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { HealthBadge } from "./ui";
import { tautanPohon } from "../lib/tautanPublik";
import { pakaiFotoTidakAda } from "../lib/fotoTidakAda";

/* ─────────────────────────────────────────
   Timeline Foto — tampilkan sesuai ukuran asli
   ───────────────────────────────────────── */
function PhotoTimeline({ photos = [] }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-ink-faint">
        <ImageOff size={32} />
        <p className="text-sm">Belum ada foto perkembangan</p>
      </div>
    );
  }

  const current = photos[active];

  return (
    <div className="flex flex-col gap-3">
      {/* === FOTO UTAMA — ukuran mengikuti rasio foto, tidak dipotong === */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-sub border border-line">
        <img
          src={current.photo_url}
          alt={current.caption || "Foto pohon"}
          /* w-full + h-auto = foto mengisi lebar kolom, tinggi mengikuti rasio asli */
          className="w-full h-auto block"
          onError={(e) => pakaiFotoTidakAda(e, "Foto pohon tidak tersedia")}
        />

        {/* Navigasi kiri / kanan */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActive((p) => Math.max(0, p - 1))}
              disabled={active === 0}
              aria-label="Foto sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-forest-950/60 hover:bg-forest-950/90 text-cream-50 rounded-full disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActive((p) => Math.min(photos.length - 1, p + 1))}
              disabled={active === photos.length - 1}
              aria-label="Foto berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-forest-950/60 hover:bg-forest-950/90 text-cream-50 rounded-full disabled:opacity-20 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] bg-forest-950/70 text-cream-50 px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
            {active + 1} / {photos.length}
          </span>
        )}
      </div>

      {/* Caption + info pengukuran */}
      <div className="space-y-1 px-0.5">
        {current.caption && (
          <p className="text-sm font-semibold text-ink">{current.caption}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
          {current.measurement_date && (
            <span className="inline-flex items-center gap-1"><Calendar size={11} />{formatDate(current.measurement_date)}</span>
          )}
          {current.dbh_cm && (
            <span className="inline-flex items-center gap-1"><Ruler size={11} />DBH: {current.dbh_cm} cm</span>
          )}
          {current.height_m && (
            <span className="inline-flex items-center gap-1"><TreeDeciduous size={11} />Tinggi: {current.height_m} m</span>
          )}
        </div>
      </div>

      {/* Thumbnail strip horizontal */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Lihat foto ${i + 1} dari ${photos.length}`}
              className={`shrink-0 w-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-brand scale-105 shadow-md"
                  : "border-line opacity-55 hover:opacity-90 hover:border-brand/50"
              }`}
            >
              {/* thumbnail juga tanpa crop — gunakan tinggi auto */}
              <img
                src={p.photo_url}
                alt={`Foto ${i + 1}`}
                className="w-full h-auto block"
                onError={(e) => pakaiFotoTidakAda(e, `Foto ${i + 1} tidak tersedia`)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Modal
   ───────────────────────────────────────── */
export default function ScanResultModal({ treeId, role, onClose }) {
  const { t } = useLanguage();
  const panelRef = useModalBehavior(true, onClose);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    treeApi.get(treeId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [treeId]);

  const tree    = data?.tree;
  const farmer  = data?.farmer;
  const adoption = data?.adoption;
  const photos  = data?.photos ?? tree?.photos ?? [];
  const healthStatus = tree?.health_status ?? tree?.healthStatus;

  // Diportal ke document.body — lihat komentar serupa di CameraScanModal.jsx:
  // dipicu dari ScanBarcodeButton di dalam <header> Topbar yang punya
  // backdrop-blur, yang membuat header jadi containing block baru untuk
  // descendant position:fixed dan merusak "fixed inset-0" di sini.
  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="true" className="gjr-overlay-in fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-forest-950/55 backdrop-blur-sm" style={{zIndex: 0}} onClick={onClose} />

      {/*
        Modal landscape:
        - max-w-4xl → lebar, bukan narrow
        - max-h-[90vh] + overflow-y-auto → tetap scroll kalau konten banyak
        - grid 2 kolom di layar medium ke atas (info | foto)
        - di HP (<md) → satu kolom stacked
      */}
      <div className="relative w-full max-w-4xl bg-surface rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-forest-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] text-cream-50/50 uppercase tracking-wider">Detail Pohon</p>
            <p className="font-mono-id text-gold-400 text-base font-bold">{treeId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            title={t("close")}
            className="p-1.5 text-cream-50/50 hover:text-cream-50 transition-colors rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-brand" />
            </div>
          )}
          {error && (
            <div className="m-5 flex items-center gap-2 bg-bad-soft text-bad rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} />{error}
            </div>
          )}

          {tree && (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-line">

              {/* ─── KOLOM KIRI: Info pohon ─── */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Judul */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-ink text-xl leading-tight">{tree.species}</h2>
                    <p className="text-xs text-ink-muted mt-1">{farmer?.name} · {farmer?.group_coop}</p>
                  </div>
                  {healthStatus && (
                    <HealthBadge status={healthStatus} label={t(`health_${healthStatus}`)} size="md" />
                  )}
                </div>

                {/* Statistik */}
                <div className="space-y-2">
                  {(role === "admin" || role === "farmer") && (
                    <>
                      <InfoRow icon={Wind}          label="CO₂ Diserap"   value={`${formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 2)} kg CO₂e`} />
                      <InfoRow icon={TreeDeciduous} label="DBH / Tinggi"  value={`${tree.dbh_cm ?? tree.dbhCm} cm / ${tree.height_m ?? tree.heightM} m`} />
                      <InfoRow icon={User}          label="Tgl. Tanam"    value={formatDate(tree.planted_date ?? tree.plantedDate)} />
                    </>
                  )}
                  {role === "buyer" && adoption && (
                    <>
                      <InfoRow icon={Wind}        label="CO₂ Diserap"  value={`${formatNumber(tree.co2_eq_kg ?? tree.co2EqKg, 2)} kg CO₂e`} />
                      <InfoRow icon={ShieldCheck} label="Sertifikat"   value={adoption.certificate_no} mono />
                      <InfoRow icon={User}        label="Tgl. Adopsi"  value={formatDate(adoption.adopted_date)} />
                    </>
                  )}
                </div>

                {/* Mini-map lokasi pohon */}
                {(tree.latitude && tree.longitude) && (
                  <MiniMap lat={tree.latitude} lng={tree.longitude} label={tree.species} />
                )}

                {/* QR Code */}
                <QrCodeDisplay treeId={treeId} />

                {/* Update kesehatan (admin saja) */}
                {role === "admin" && (
                  <HealthUpdater treeId={treeId} current={tree.health_status ?? tree.healthStatus} onUpdate={onClose} />
                )}
              </div>

              {/* ─── KOLOM KANAN: Foto perkembangan ─── */}
              <div className="p-6 space-y-3 overflow-y-auto">
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={16} className="text-brand shrink-0" />
                  <h3 className="font-semibold text-sm text-ink">Foto Perkembangan Pohon</h3>
                  {photos.length > 0 && (
                    <span className="ml-auto text-[11px] bg-brand-soft text-brand-ink px-2 py-0.5 rounded-full font-semibold">
                      {photos.length} foto
                    </span>
                  )}
                </div>
                <PhotoTimeline photos={photos} />
              </div>

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────── */

// Mini-map memakai Leaflet langsung, SAMA seperti peta lain di aplikasi ini.
//
// Sebelumnya di sini ada <iframe> ke openstreetmap.org/export/embed.html.
// Secara teknis itu jalan, tapi rapuh karena tiga hal:
//
//   1. Iframe lintas-situs adalah sasaran utama pemblokir. Tracking prevention
//      bawaan peramban dan ekstensi privasi rutin memblokirnya, dan yang
//      terlihat pengguna bukan peta melainkan kotak "This content is blocked"
//      — pesan yang menyalahkan pemilik situs atas sesuatu yang tidak rusak.
//   2. referrerPolicy="no-referrer" dipasang pada iframe itu. Kebijakan ubin
//      OSM mensyaratkan Referer yang sah dan menyebut penghapusannya sebagai
//      alasan pemblokiran — jadi setelan itu justru melanggar syarat pakai.
//   3. Ia memuat SELURUH halaman OSM di dalam modal, lengkap dengan skrip dan
//      gayanya sendiri, hanya untuk menampilkan satu titik.
//
// Leaflet menggambar di dalam halaman kita sendiri: tidak ada frame untuk
// diblokir, mengikuti tema dan penyaring warna peta yang sama, dan ubinnya
// diminta langsung dengan Referer yang benar.
function MiniMap({ lat, lng, label }) {
  const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="border-t border-line pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-brand shrink-0" />
          <p className="text-xs font-semibold text-ink-muted">Lokasi Pohon</p>
        </div>
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-brand hover:opacity-80 font-semibold underline underline-offset-2"
        >
          Buka di Google Maps ↗
        </a>
      </div>
      {/* Koordinat */}
      <p className="text-[11px] text-ink-faint font-mono px-0.5">
        {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
      </p>
      {/* Peta embed */}
      <div className="rounded-2xl overflow-hidden border border-line shadow-sm" style={{ height: 180 }}>
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          style={{ height: 180, width: "100%" }}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          zoomControl={false}
          keyboard={false}
          aria-label={`Lokasi ${label}`}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <CircleMarker
            center={[lat, lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2f6e51", fillOpacity: 1 }}
          />
        </MapContainer>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3 bg-surface-sub rounded-xl px-3.5 py-2.5">
      <Icon size={14} className="text-ink-faint shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
        <p className={`text-sm font-medium text-ink ${mono ? "font-mono-id" : ""}`}>{value ?? "—"}</p>
      </div>
    </div>
  );
}


function HealthUpdater({ treeId, current, onUpdate }) {
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { t } = useLanguage();

  async function handleSave() {
    if (status === current) return;
    setSaving(true);
    try {
      await treeApi.updateHealth(treeId, status);
      // Sebelumnya kegagalan dilaporkan lewat alert() — dialog browser yang
      // memblokir seluruh halaman dan tidak bisa ditata mengikuti tema.
      toast.success(`${t("toast_health_updated")} — ${treeId}`);
      onUpdate();
    } catch (e) {
      toast.error(`${t("toast_failed")}: ${e.message ?? ""}`);
    } finally {
      setSaving(false);
    }
  }

  const SELECTED_CLS = {
    // sage-600, bukan sage-500: putih di atas sage-500 terukur rasio 4,28,
  // tepat di bawah ambang WCAG AA 4,5. sage-600 menaikkannya ke 5,9
  // tanpa mengubah kesan warnanya.
  baik:   "bg-sage-600 text-white border-sage-600",
    sedang: "bg-gold-500 text-forest-950 border-gold-500",
    buruk:  "bg-clay-500 dark:bg-clay-400 text-white dark:text-forest-950 border-clay-500 dark:border-clay-400",
  };

  return (
    <div className="border-t border-line pt-4 space-y-3">
      <p className="text-xs font-semibold text-ink-muted">Update Status Kesehatan</p>
      <div className="flex gap-2">
        {["baik", "sedang", "buruk"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${
              status === s ? SELECTED_CLS[s] : "bg-surface-sub text-ink-muted border-line"
            }`}>
            {t(`health_${s}`)}
          </button>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving || status === current}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:opacity-90 disabled:opacity-50 text-surface font-semibold text-sm rounded-xl py-2.5 transition-colors">
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}

function QrCodeDisplay({ treeId }) {
  const qrRef = useRef(null);

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${treeId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Dulu memaku "https://giricahyo.id" — domain yang belum ada, sehingga QR
  // dari sini tidak bisa dibuka sama sekali. Sekarang satu sumber dengan
  // halaman cetak lainnya.
  const qrValue = tautanPohon(treeId);

  return (
    <div className="border-t border-line pt-4 space-y-3">
      <div className="flex items-center justify-between">
         <p className="text-xs font-semibold text-ink-muted">Kode QR Pohon</p>
         <button onClick={handleDownload} className="text-[11px] flex items-center gap-1.5 text-brand hover:opacity-80 font-semibold bg-brand-soft transition-colors px-2.5 py-1.5 rounded-md">
            <Download size={14} /> Download QR
         </button>
      </div>
      {/* Latar putih sengaja tetap, bukan token — QR code butuh kontras tinggi
          terhadap modul gelapnya sendiri agar tetap terpindai di kedua tema. */}
      <div className="flex justify-center bg-white p-4 rounded-xl border border-line" ref={qrRef}>
        <QRCodeCanvas value={qrValue} size={140} level={"H"} />
      </div>
    </div>
  );
}
