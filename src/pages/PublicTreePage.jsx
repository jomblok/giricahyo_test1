import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Leaf, MapPin, User, Cloud, ArrowLeft, Loader2, AlertCircle, Camera, Stethoscope, Car, Share2, Check, ImageOff, Ruler } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { treeApi } from "../lib/api";
import { useToast } from "../lib/ToastContext";
import { useLanguage } from "../lib/LanguageContext";
import AddTreePhotoModal from "../components/AddTreePhotoModal";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatNumber } from "../lib/format";

// Peta warna lokal disengaja, BUKAN duplikat HEALTH_TONE (components/ui/Badge)
// yang perlu dihindari: seluruh halaman ini adalah kartu identitas publik
// dengan latar krem TETAP (seperti LoginPage/CertificateModal) — tidak ikut
// tema gelap/terang aplikasi. HEALTH_TONE dibangun di atas token yang
// SENGAJA berubah mengikuti .dark di <html>; memakainya di sini akan
// membuat warna teks berubah tema padahal kartunya sendiri tidak, dan
// merusak kontras di atas latar krem yang tetap terang. Teksnya tetap lewat
// t() untuk i18n.
const HEALTH_STYLE = {
  baik:   { key: "health_baik",   color: "text-sage-600 bg-sage-100" },
  sedang: { key: "health_sedang", color: "text-gold-600 bg-gold-100" },
  buruk:  { key: "health_buruk",  color: "text-clay-700 bg-clay-100" },
};

export default function PublicTreePage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [tree, setTree] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  // { tidakAda, pesan } — lihat catch di loadData kenapa keduanya dibedakan.
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [savingHealth, setSavingHealth] = useState(null);
  const toast = useToast();
  const { t } = useLanguage();

  // Mengambil data pohon. Ditulis sebagai rantai .then/.catch/.finally, bukan
  // try/await: dengan begitu SETIAP setState pasti berada di dalam callback
  // janji, sehingga aman dipanggil langsung dari effect di bawah tanpa render
  // tambahan. Pada versi try/await, galat yang dilempar secara sinkron akan
  // memanggil setError di dalam effect itu sendiri.
  const ambil = useCallback(() => treeApi.getPublic(id)
    .then((res) => {
      // Backend sekarang mengirim { tree, farmer, photos }. Pemeriksaan ini
      // dipertahankan apa adanya — ia memang sudah benar sejak dulu; yang dulu
      // salah adalah bentuk balasan backend-nya.
      if (!res.tree) throw new Error("Invalid response format");
      setTree(res.tree);
      setFarmer(res.farmer);
      // Backend bisa menaruh foto di beberapa tempat; ambil yang mana pun ada.
      setPhotos(res.photos ?? res.tree.photos ?? []);
      setError(null);
    })
    .catch((e) => {
      // "TIDAK ADA" DAN "GAGAL DIMUAT" DIBEDAKAN. Halaman ini dibuka lewat
      // pindai QR, sering dari ponsel di jaringan yang tidak stabil. Dulu
      // setiap kegagalan ditampilkan sebagai "ID pohon ini tidak terdaftar" —
      // jadi saat koneksi putus, tamu yang memindai pohon yang jelas-jelas ada
      // diberi tahu pohonnya tidak terdaftar. Hanya 404 yang berarti tidak ada;
      // selebihnya menampilkan penyebab sebenarnya beserta tombol coba lagi.
      //
      // Fallback ke data contoh lokal (lib/joins.js + src/data/) DIHAPUS.
      // Ia hanya aktif di mode pengembangan, mencari pohon berpola GJR-001-001
      // yang tidak pernah cocok dengan ID asli GJR-L1-…, sehingga satu-satunya
      // efeknya adalah mengganti pesan galat yang jujur dengan "tidak ditemukan".
      setError({ tidakAda: e.status === 404, pesan: e.message });
    })
    .finally(() => setLoading(false)), [id]);

  // Untuk "Coba lagi" dan muat ulang sesudah petugas menyimpan: tampilkan
  // keadaan memuat dulu, baru ambil. Dipanggil dari event handler, jadi reset
  // di sini tidak menambah render apa pun.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await ambil();
  }, [ambil]);

  // Saat dipasang cukup ambil(): state awalnya sudah "memuat", karena halaman
  // ini di-key per ID di App.jsx dan selalu dipasang segar untuk tiap pohon.
  useEffect(() => { ambil(); }, [ambil]);

  // Panel petugas sebelumnya hanya memanggil alert() berisi teks placeholder.
  // Endpoint-nya sudah tersedia, jadi sekarang benar-benar menyimpan.
  const updateHealth = async (status) => {
    setSavingHealth(status);
    try {
      await treeApi.updateHealth(id, status);
      toast.success(`${t("toast_health_updated")} — ${id}`);
      await loadData();
    } catch (e) {
      toast.error(`${t("toast_failed")}: ${e.message ?? ""}`);
    } finally {
      setSavingHealth(null);
    }
  };

  const health = tree ? (HEALTH_STYLE[tree.healthStatus || tree.health_status] ?? HEALTH_STYLE.baik) : null;

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-sage-500/20 rounded-lg p-1.5"><Leaf size={16} className="text-sage-400" /></div>
          <span className="text-cream-50/70 text-xs font-semibold uppercase tracking-wider">Giricahyo Carbon</span>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-sage-400" />
          </div>
        )}

        {/* !tree: kalau muat ulang gagal SETELAH data sudah tampil (mis. sesudah
            petugas memperbarui kondisi), data yang sudah ada tetap dibiarkan
            terlihat alih-alih diganti kotak galat. */}
        {error && !tree && (
          <div className="bg-forest-900 rounded-3xl p-8 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-clay-400" />
            {error.tidakAda ? (
              <>
                <p className="font-semibold text-cream-50 mb-1">Pohon tidak ditemukan</p>
                <p className="text-sm text-cream-50/60">ID pohon <span className="font-mono-id">{id}</span> tidak terdaftar.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-cream-50 mb-1">Data pohon belum bisa dimuat</p>
                <p className="text-sm text-cream-50/60">{error.pesan}</p>
                <button
                  type="button"
                  onClick={loadData}
                  className="mt-5 inline-flex items-center justify-center rounded-xl bg-sage-500/20 px-5 py-2.5 text-sm font-semibold text-sage-300 hover:bg-sage-500/30 transition-colors"
                >
                  Coba lagi
                </button>
              </>
            )}
          </div>
        )}

        {tree && (
          <div className="bg-cream-50 rounded-3xl overflow-hidden shadow-2xl">
            <HeroPhoto photos={photos} treeId={tree.id} />
            <div className="p-6 space-y-5">
              <div className="text-center pb-4 border-b border-cream-100">
                <h1 className="text-2xl font-bold text-forest-950">{tree.species}</h1>
                <span className={`inline-block mt-2 text-[11px] font-medium px-2.5 py-1 rounded-full ${health.color}`}>
                  {t(health.key)}
                </span>
              </div>
              <InfoRow icon={User}   label="Petani Pemilik"         value={farmer?.name ?? "—"} />
              {/* toFixed(3), bukan (5). Backend SENGAJA membulatkan koordinat
                  publik ke 3 desimal (TreeController::showPublic) supaya titik
                  persis pohon milik petani tidak tersiar; menampilkannya dengan
                  5 desimal cuma menambahkan dua angka nol dan mengklaim presisi
                  ~1 m untuk data yang ketelitiannya ~110 m.

                  Cadangan `|| -7.98` juga dibuang: ia mengarang lokasi di tengah
                  Jawa untuk pohon tanpa koordinat, seolah-olah itu posisi
                  sebenarnya. Sekarang mengaku tidak tahu. (Koordinat wajib diisi
                  saat mendaftar, jadi ini pengaman, bukan kasus yang ada
                  sekarang.) */}
              <InfoRow
                icon={MapPin}
                label="Lokasi Koordinat"
                value={
                  tree.latitude == null || tree.longitude == null
                    ? "—"
                    : `${Number(tree.latitude).toFixed(3)}, ${Number(tree.longitude).toFixed(3)}`
                }
                mono
              />
              <InfoRow icon={Cloud}  label="Estimasi Serapan Karbon" value={`${formatNumber(tree.co2_eq_kg || tree.co2EqKg || 0, 2)} kg CO₂e`} highlight />

              {/* Padanan yang mudah dibayangkan — angka kilogram saja tidak
                  memberi rasa skala bagi pengunjung awam. */}
              <CarbonEquivalent kg={tree.co2_eq_kg || tree.co2EqKg || 0} />

              <MiniMap
                lat={Number(tree.latitude)}
                lng={Number(tree.longitude)}
                species={tree.species}
                status={tree.healthStatus || tree.health_status}
              />

              <GrowthStrip photos={photos} />
              
              <div className="pt-4 border-t border-cream-100 mt-4">
                <p className="text-[11px] uppercase tracking-wider text-forest-700 font-bold mb-3 text-center">Spesifikasi Pohon</p>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="Diameter (DBH)" value={`${formatNumber(tree.dbh_cm || tree.dbhCm || 0, 1)} cm`} />
                  <MetricCard label="Tinggi" value={`${formatNumber(tree.height_m || tree.heightM || 0, 1)} m`} />
                  <MetricCard label="Tahun Tanam" value={new Date(tree.planted_date || tree.plantedDate).getFullYear()} />
                  <MetricCard label="Update Terakhir" value={new Date(tree.last_updated || tree.lastUpdated).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} />
                </div>
              </div>
            </div>
            <div className="bg-cream-100 px-6 py-3 text-center">
              <p className="text-[11px] text-forest-700">Dukung petani penjaga pohon ini melalui Koperasi Griya Jati Rasa</p>
            </div>
          </div>
        )}

        {/* ADMIN QUICK ACTIONS PANEL */}
        {tree && user?.role === "admin" && (
          <div className="mt-6 bg-forest-900 border border-sage-500/20 rounded-3xl p-6 shadow-xl gjr-content-in">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={16} className="text-gold-400" />
              <h3 className="text-sm font-bold text-cream-50 uppercase tracking-wide">Panel Petugas</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-cream-50/70 mb-2 font-medium">Update Status Kesehatan:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["baik",   "Sehat",     "bg-sage-500/20 hover:bg-sage-500/40 text-sage-400 border-sage-500/30"],
                    ["sedang", "Perhatian", "bg-gold-500/20 hover:bg-gold-500/40 text-gold-400 border-gold-500/30"],
                    ["buruk",  "Kritis",    "bg-clay-500/20 hover:bg-clay-500/40 text-clay-400 border-clay-500/30"],
                  ].map(([value, label, cls]) => {
                    const isCurrent = (tree.healthStatus || tree.health_status) === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateHealth(value)}
                        disabled={savingHealth !== null || isCurrent}
                        aria-pressed={isCurrent}
                        className={`py-2 border rounded-xl text-xs font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${cls} ${
                          isCurrent ? "ring-1 ring-cream-50/40" : ""
                        }`}
                      >
                        {savingHealth === value ? "…" : label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setPhotoOpen(true)}
                className="w-full py-3 bg-sage-500 hover:bg-sage-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Camera size={18} />
                Tambah Foto Perkembangan
              </button>
            </div>
          </div>
        )}

        {photoOpen && (
          <AddTreePhotoModal
            isOpen
            treeId={id}
            onClose={() => setPhotoOpen(false)}
            onPhotoAdded={() => { setPhotoOpen(false); loadData(); }}
          />
        )}

        {/* Hanya kalau pohonnya benar-benar termuat — membagikan tautan ke ID
            yang tidak terdaftar, atau yang belum bisa dimuat, hanya meneruskan
            kotak galat ke orang lain. */}
        {tree && <ShareButton treeId={id} />}

        {/* Hanya untuk yang sudah masuk. Halaman ini terutama dibuka tamu yang
            memindai QR di kebun; bagi mereka tidak ada dashboard untuk dituju,
            dan tautan ini dulu justru melempar mereka ke halaman login. */}
        {user && (
          <Link to="/" className="flex items-center justify-center gap-1.5 text-cream-50/70 text-xs mt-6 hover:text-cream-50/70 transition-colors">
            <ArrowLeft size={12} />Kembali ke Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}

// Label memakai forest-700 PENUH, bukan pengubah opasitas dan bukan token
// semantik. Dua-duanya pernah dicoba dan dua-duanya salah di sini:
//   - forest-700/45 memudar jadi rasio 2,11 di atas kartu krem
//   - --ink-faint benar di mode terang, tapi MEMBALIK jadi warna terang di
//     mode gelap, sementara kartu halaman ini tetap krem — teksnya hilang
// Kartu di sini sengaja tidak mengikuti tema, jadi warnanya pun tidak boleh.
function InfoRow({ icon: Icon, label, value, mono, highlight }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-sage-100 rounded-lg p-2 shrink-0"><Icon size={15} className="text-sage-600" /></div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-forest-700 mb-0.5">{label}</p>
        <p className={`text-sm break-words ${mono ? "font-mono-id" : ""} ${highlight ? "font-bold text-gold-700 text-base" : "font-medium text-forest-950"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-sage-50/50 border border-sage-100 rounded-xl p-2.5 text-center">
      <p className="text-[9px] text-forest-700 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="font-semibold text-forest-950 text-xs">{value}</p>
    </div>
  );
}

// ~192 g CO₂ per km mobil penumpang — dipakai hanya untuk memberi rasa skala,
// bukan angka resmi.
function CarbonEquivalent({ kg }) {
  if (!kg) return null;
  const km = kg / 0.192;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-sage-500/10 border border-sage-500/20 px-3 py-2.5 mt-1">
      <Car size={15} className="text-sage-600 shrink-0 mt-0.5" />
      {/* DIGELAPKAN. Sebelumnya text-cream-50/70 — teks krem di atas latar
          sage-500/10 yang terang, rasio terukur 1,12 dari ambang 4,5: praktis
          tidak terbaca. Komponen ini jelas dirancang untuk latar GELAP, lalu
          dipasang di kartu terang tanpa warnanya ikut disesuaikan. */}
      <p className="text-[11px] leading-snug text-forest-900">
        Setara menghapus emisi dari sekitar{" "}
        <span className="font-bold text-forest-950">{formatNumber(km, 0)} km</span> perjalanan mobil.
      </p>
    </div>
  );
}

function ShareButton({ treeId }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Pohon ${treeId} — Giricahyo Carbon`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* pengguna membatalkan, atau clipboard tidak diizinkan */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-cream-50/15 bg-cream-50/5 hover:bg-cream-50/10 px-4 py-2.5 text-xs font-semibold text-cream-50/80 transition-colors"
    >
      {copied ? <Check size={14} className="text-sage-400" /> : <Share2 size={14} />}
      {copied ? "Tautan tersalin" : "Bagikan pohon ini"}
    </button>
  );
}

// Peta kecil supaya pengunjung tahu pohon ini berdiri di mana, bukan sekadar
// membaca sepasang angka koordinat.
const MINI_MAP_COLOR = { baik: "#3f8862", sedang: "#c89b3c", buruk: "#c4503e" };

function MiniMap({ lat, lng, species, status }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const color = MINI_MAP_COLOR[status] ?? MINI_MAP_COLOR.baik;

  return (
    <div className="rounded-2xl overflow-hidden border border-cream-200">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: 170, width: "100%" }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        keyboard={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <CircleMarker
          center={[lat, lng]}
          radius={9}
          fillColor={color}
          color="#ffffff"
          weight={3}
          fillOpacity={0.9}
        />
      </MapContainer>
      <p className="bg-cream-100 px-3 py-2 text-[10px] text-forest-700 flex items-center gap-1.5">
        <MapPin size={11} className="shrink-0" />
        Perkiraan lokasi {species} · peta dari OpenStreetMap
      </p>
    </div>
  );
}

// Linimasa foto pertumbuhan — bukti visual bahwa pohonnya benar-benar dirawat.
function GrowthStrip({ photos = [] }) {
  const [active, setActive] = useState(null);

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-cream-100 px-3 py-2.5 text-[11px] text-forest-700">
        <ImageOff size={13} className="shrink-0" />
        <span>Belum ada foto perkembangan untuk pohon ini.</span>
      </div>
    );
  }

  const shown = active !== null ? photos[active] : null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
        Perkembangan Pohon
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((ph, i) => (
          <button
            key={ph.id ?? i}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
            aria-label={`Foto ${ph.measurement_date ?? i + 1}`}
            className={`shrink-0 w-[72px] rounded-xl overflow-hidden border-2 transition-all ${
              active === i ? "border-sage-500 shadow-md" : "border-cream-200 hover:border-sage-400"
            }`}
          >
            <img
              src={ph.photo_url}
              alt=""
              loading="lazy"
              className="w-full h-12 object-cover bg-cream-200"
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
            />
            <span className="block px-1 py-0.5 bg-white text-[8px] text-forest-700/60 truncate">
              {ph.measurement_date ?? "—"}
            </span>
          </button>
        ))}
      </div>

      {shown && (
        <div className="rounded-2xl border border-cream-200 bg-white p-3 space-y-2">
          <img
            src={shown.photo_url}
            alt={shown.caption || "Foto perkembangan pohon"}
            className="w-full rounded-xl border border-cream-100"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <p className="text-xs font-semibold text-forest-950">
            {shown.caption || "Foto perkembangan pohon"}
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] text-forest-700/60">
            {shown.measurement_date && <span>{shown.measurement_date}</span>}
            {shown.dbh_cm && (
              <span className="inline-flex items-center gap-1">
                <Ruler size={11} /> DBH {shown.dbh_cm} cm
              </span>
            )}
            {shown.height_m && <span>Tinggi {shown.height_m} m</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Kepala kartu. Kalau ada foto pertumbuhan, foto TERBARU dipakai sebagai latar
// dan identitas pohon ditumpangkan di atasnya; kalau belum ada, tampilannya
// kembali ke bidang hijau polos seperti sebelumnya.
function HeroPhoto({ photos = [], treeId }) {
  const [failed, setFailed] = useState(false);

  const latest = photos.length
    ? [...photos].sort((a, b) =>
        String(b.measurement_date ?? "").localeCompare(String(a.measurement_date ?? ""))
      )[0]
    : null;

  if (!latest || failed) {
    return (
      <div className="bg-forest-900 px-6 py-5 text-center">
        <p className="text-[11px] uppercase tracking-wider text-cream-50/75 mb-1">Kartu Identitas Pohon</p>
        <p className="font-mono-id text-gold-500 text-sm">{treeId}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-forest-900">
      <img
        src={latest.photo_url}
        alt={latest.caption || `Foto pohon ${treeId}`}
        className="w-full h-44 object-cover"
        onError={() => setFailed(true)}
      />
      {/* Gradien supaya teks tetap terbaca di atas foto apa pun. */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-6 py-4 text-center">
        <p className="text-[11px] uppercase tracking-wider text-cream-50/70 mb-0.5">Kartu Identitas Pohon</p>
        <p className="font-mono-id text-gold-400 text-sm">{treeId}</p>
      </div>
      {latest.measurement_date && (
        <span className="absolute top-3 right-3 rounded-full bg-forest-950/70 px-2.5 py-1 text-[10px] font-medium text-cream-50/85 backdrop-blur-sm">
          {latest.measurement_date}
        </span>
      )}
    </div>
  );
}
