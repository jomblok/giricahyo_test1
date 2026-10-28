import { useMemo, useState, useEffect } from "react";
// CircleMarker & Popup dulu dipakai langsung di sini; sejak marker dipindah ke
// ClusteredTreeMarkers, keduanya tinggal import yang menganggur.
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, MapPin } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";
import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";
import ClusteredTreeMarkers from "./ClusteredTreeMarkers";
import { Skeleton, EmptyState, readVar } from "./ui";

const FALLBACK_CENTER = [-7.9847, 110.4734];
const ORDER = ["baik", "sedang", "buruk"];

// Menyesuaikan tampilan peta ke data sungguhan. Sebelumnya center & zoom
// dipatok konstanta, jadi pohon di luar area itu jatuh di luar layar dan
// tidak pernah terlihat.
function FitToTrees({ points, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
    } else {
      map.fitBounds(points, { padding: [36, 36], maxZoom: 17 });
    }
  }, [map, trigger, points]);
  return null;
}

export default function TreeMap({ height = 320, showControls = false }) {
  const { data: trees, loading, error } = useApi(() => treeApi.map());
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("semua");

  // `theme` SENGAJA jadi dependensi walau tidak disebut di dalam fungsinya:
  // readVar membaca variabel CSS dari DOM, dan nilainya berubah begitu tema
  // diganti. Tanpa `theme` di sini warna titik peta tertahan di tema lama.
  // Lint tidak bisa melihat hubungan lewat DOM itu, jadi peringatannya keliru.
  const healthColor = useMemo(() => ({
    baik:   readVar("--chart-1", "#2f6e51"),
    sedang: readVar("--chart-2", "#c89b3c"),
    buruk:  readVar("--chart-5", "#a43828"),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ringColor = useMemo(() => readVar("--surface", "#ffffff"), [theme]);

  // Dibungkus useMemo: `trees ?? []` membuat array BARU di setiap render saat
  // trees masih kosong, sehingga dua useMemo di bawah tidak pernah memakai
  // hasil simpanannya.
  const all = useMemo(() => trees ?? [], [trees]);
  const counts = useMemo(() => {
    const c = { baik: 0, sedang: 0, buruk: 0 };
    for (const tr of all) {
      const s = tr.health_status ?? tr.healthStatus;
      if (s in c) c[s] += 1;
    }
    return c;
  }, [all]);

  const visible = useMemo(() => {
    const withCoords = all.filter((tr) => tr.latitude != null && tr.longitude != null);
    return statusFilter === "semua"
      ? withCoords
      : withCoords.filter((tr) => (tr.health_status ?? tr.healthStatus) === statusFilter);
  }, [all, statusFilter]);

  const points = useMemo(
    () => visible.map((tr) => [Number(tr.latitude), Number(tr.longitude)]),
    [visible]
  );

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm transition-colors flex flex-col">
      {showControls && (
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-line">
          <button
            type="button"
            onClick={() => setStatusFilter("semua")}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              statusFilter === "semua"
                ? "border-brand bg-brand-soft text-brand-ink"
                : "border-line bg-surface-sub text-ink-muted hover:text-ink"
            }`}
          >
            {lang === "en" ? "All" : "Semua"} · {all.length}
          </button>
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              disabled={counts[s] === 0}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                statusFilter === s
                  ? "border-brand bg-brand-soft text-brand-ink"
                  : "border-line bg-surface-sub text-ink-muted hover:text-ink"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: healthColor[s] }} />
              {t(`health_${s}`)} · {counts[s]}
            </button>
          ))}
          {counts.buruk > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("buruk")}
              className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-bad-soft text-bad transition-colors hover:brightness-95"
            >
              <Crosshair size={12} />
              {lang === "en" ? "Focus on critical trees" : "Fokus ke pohon kritis"}
            </button>
          )}
        </div>
      )}

      <ApiState loading={loading} error={error} skeleton={<div style={{ height }}><Skeleton className="w-full h-full" rounded="rounded-none" /></div>}>
        {points.length === 0 ? (
          <div style={{ height }} className="flex items-center justify-center">
            <EmptyState icon={MapPin} title={t("no_trees_found")} compact />
          </div>
        ) : (
          <MapContainer
            center={points[0] ?? FALLBACK_CENTER}
            zoom={14}
            style={{ height, width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FitToTrees points={points} trigger={statusFilter} />
            <ClusteredTreeMarkers
              trees={visible}
              healthColor={healthColor}
              ringColor={ringColor}
            />
          </MapContainer>
        )}
      </ApiState>
      {/* Keterangan gelembung. Tanpa ini angka di peta tidak menjelaskan
          dirinya, dan di layar sentuh tidak ada "sorot" untuk memunculkan
          tooltip — jadi penjelasannya harus tertulis. */}
      {points.length > 0 && (
        <p className="px-3 py-2 border-t border-line text-[11px] leading-relaxed text-ink-muted">
          {t("map_legend")}
        </p>
      )}
    </div>
  );
}
