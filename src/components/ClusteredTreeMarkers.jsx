// src/components/ClusteredTreeMarkers.jsx
//
// Clustering penanda tanpa menambah dependensi baru.
//
// leaflet.markercluster butuh paket tambahan + CSS-nya sendiri. Untuk jumlah
// pohon sebesar kebun komunitas, pengelompokan berbasis grid layar sudah
// memberi manfaat yang sama — penanda berhenti saling menumpuk saat di-zoom
// keluar — dengan biaya nol paket baru.
//
// Cara kerjanya: koordinat diproyeksikan ke piksel pada zoom saat ini, lalu
// dijatuhkan ke sel grid selebar CELL piksel. Sel berisi >1 pohon digambar
// sebagai gelembung berangka; sel berisi 1 pohon digambar seperti biasa.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { CircleMarker, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../lib/LanguageContext";

const CELL = 56; // lebar sel grid dalam piksel layar

// Gelembung berisi sebanyak ini atau kurang menampilkan DAFTAR pohonnya saat
// diklik, bukan memperbesar peta. Alasannya bukan sekadar praktis: 9 pasang
// pohon di data survei berbagi koordinat yang persis sama, sehingga gelembung
// mereka tidak pernah pecah sebesar apa pun peta diperbesar — tanpa daftar,
// pohon-pohon itu tidak bisa dibuka sama sekali dari peta.
const BATAS_DAFTAR = 6;

function buildClusters(map, trees, zoom) {
  const cells = new Map();

  for (const tree of trees) {
    const lat = Number(tree.latitude);
    const lng = Number(tree.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const pt = map.project([lat, lng], zoom);
    const key = `${Math.floor(pt.x / CELL)}:${Math.floor(pt.y / CELL)}`;

    let cell = cells.get(key);
    if (!cell) {
      cell = { items: [], sumLat: 0, sumLng: 0 };
      cells.set(key, cell);
    }
    cell.items.push(tree);
    cell.sumLat += lat;
    cell.sumLng += lng;
  }

  return [...cells.entries()].map(([key, c]) => ({
    key,
    items: c.items,
    center: [c.sumLat / c.items.length, c.sumLng / c.items.length],
  }));
}

// Gelembung cluster digambar sebagai divIcon supaya angkanya bisa ditata CSS.
function clusterIcon(count, color) {
  const size = count > 99 ? 46 : count > 9 ? 40 : 34;
  return L.divIcon({
    html:
      `<span class="gjr-cluster" style="--c:${color};width:${size}px;height:${size}px">` +
      `${count > 999 ? "999+" : count}</span>`,
    className: "gjr-cluster-wrap",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Ringkasan isi sebuah gelembung untuk tooltip-nya: berapa pohon per kondisi,
// dan jenis apa yang paling banyak. Tanpa ini gelembung hanya menampilkan
// angka, dan tidak ada cara mengetahui isinya selain memperbesar peta.
function ringkasKelompok(items) {
  const kondisi = { baik: 0, sedang: 0, buruk: 0 };
  const jenis = new Map();
  for (const t of items) {
    const s = t.health_status ?? t.healthStatus;
    if (s in kondisi) kondisi[s] += 1;
    jenis.set(t.species, (jenis.get(t.species) ?? 0) + 1);
  }
  const jenisTeratas = [...jenis.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return { kondisi, jenisTeratas, sisaJenis: Math.max(0, jenis.size - 3) };
}

export default function ClusteredTreeMarkers({ trees, healthColor, ringColor }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const buka = (id) => navigate(`/pohon/${id}`);
  const map = useMap();

  // Zoom peta dibaca sebagai TOKO EKSTERNAL, bukan disalin ke state.
  //
  // Sebelumnya: useState + pendengar zoomend + useEffect yang menyalin ulang
  // zoom setiap kali daftar pohon berganti. Effect itu bukan hiasan. FitToTrees
  // dirender SEBELUM komponen ini, jadi effect-nya jalan lebih dulu; bila
  // fitBounds mengubah zoom tanpa animasi, zoomend berbunyi sebelum pendengar
  // di sini terpasang dan terlewat. Effect penyalin itulah yang menutup celah
  // tersebut — dengan satu render ekstra memakai zoom lama.
  //
  // useSyncExternalStore menutup celah yang sama secara bawaan: setelah
  // berlangganan, React membaca getSnapshot sekali lagi dan merender ulang
  // bila nilainya sudah berubah di antara render dan langganan. Setiap
  // render juga membaca zoom terkini, jadi berganti daftar pohon pun langsung
  // memakai zoom yang benar.
  const berlangganan = useCallback((ubah) => {
    map.on("zoomend", ubah);
    return () => map.off("zoomend", ubah);
  }, [map]);
  const zoom = useSyncExternalStore(berlangganan, () => map.getZoom());

  const clusters = useMemo(
    () => buildClusters(map, trees, zoom),
    [map, trees, zoom]
  );

  return (
    <>
      {clusters.map((cluster) => {
        // Satu pohon → penanda biasa, lengkap dengan popup detailnya.
        if (cluster.items.length === 1) {
          const tree = cluster.items[0];
          const status = tree.health_status ?? tree.healthStatus;
          return (
            <CircleMarker
              key={tree.id}
              center={[Number(tree.latitude), Number(tree.longitude)]}
              radius={8}
              fillColor={healthColor[status] ?? healthColor.baik}
              color={ringColor}
              weight={2}
              fillOpacity={0.85}
              // Klik langsung membuka halaman detail pohon. Dulu klik hanya
              // memunculkan popup kecil, sehingga detail lengkapnya butuh
              // langkah lain di luar peta. Ringkasan popup itu kini menjadi
              // tooltip pratinjau saat disorot.
              eventHandlers={{ click: () => buka(tree.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <div className="text-xs leading-snug">
                  <p><span className="font-mono-id font-semibold">{tree.id}</span> · {tree.species}</p>
                  <p className="opacity-70">{tree.farmer_name ?? tree.farmerName}</p>
                  <p className="font-semibold" style={{ color: healthColor[status] }}>
                    {(tree.co2_eq_kg ?? tree.co2EqKg ?? 0).toFixed(1)} kg CO₂e
                  </p>
                  <p className="mt-0.5 opacity-60">{t("map_click_for_detail")}</p>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        }

        // Beberapa pohon → gelembung berangka. Warnanya mengikuti kondisi
        // TERBURUK di dalam kelompok, supaya kelompok bermasalah tidak
        // tersamarkan oleh mayoritas pohon sehat.
        const statuses = cluster.items.map((tr) => tr.health_status ?? tr.healthStatus);
        const worst = statuses.includes("buruk") ? "buruk"
                    : statuses.includes("sedang") ? "sedang"
                    : "baik";

        const kecil = cluster.items.length <= BATAS_DAFTAR;
        const r = ringkasKelompok(cluster.items);

        return (
          <Marker
            key={cluster.key}
            position={cluster.center}
            icon={clusterIcon(cluster.items.length, healthColor[worst])}
            eventHandlers={kecil ? undefined : {
              // Gelembung besar: klik → zoom ke isinya.
              click: () => {
                const bounds = L.latLngBounds(
                  cluster.items.map((tr) => [Number(tr.latitude), Number(tr.longitude)])
                );
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
              },
            }}
          >
            {/* Tooltip saat disorot. Sebelumnya tidak ada sama sekali: gelembung
                hanya menampilkan angka, dan satu-satunya cara tahu isinya
                adalah mengekliknya untuk memperbesar peta. */}
            <Tooltip direction="top" offset={[0, -18]}>
              <div className="text-xs leading-snug">
                <p className="font-bold">{cluster.items.length} {t("map_trees_unit")}</p>
                <p>
                  {["baik", "sedang", "buruk"]
                    .filter((k) => r.kondisi[k] > 0)
                    .map((k) => `${r.kondisi[k]} ${t(`health_${k}`).toLowerCase()}`)
                    .join(" · ")}
                </p>
                <p className="opacity-70">
                  {r.jenisTeratas.map(([n, c]) => `${n} ${c}`).join(", ")}
                  {r.sisaJenis > 0 ? ` +${r.sisaJenis}` : ""}
                </p>
                <p className="mt-0.5 opacity-60">
                  {t(kecil ? "map_click_for_list" : "map_click_to_zoom")}
                </p>
              </div>
            </Tooltip>

            {/* Gelembung kecil: klik → daftar pohon, masing-masing langsung ke
                halaman detailnya. Leaflet membuka Popup ini sendiri saat klik. */}
            {kecil && (
              <Popup>
                <ul className="min-w-[180px] space-y-0.5">
                  {cluster.items.map((tr) => {
                    const st = tr.health_status ?? tr.healthStatus;
                    return (
                      <li key={tr.id}>
                        <button
                          type="button"
                          onClick={() => buka(tr.id)}
                          className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-black/5"
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: healthColor[st] ?? healthColor.baik }} />
                          <span className="font-mono-id font-semibold">{tr.id}</span>
                          <span className="opacity-70">{tr.species}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Popup>
            )}
          </Marker>
        );
      })}
    </>
  );
}
