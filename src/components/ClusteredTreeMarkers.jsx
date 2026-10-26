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
import { CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const CELL = 56; // lebar sel grid dalam piksel layar

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

export default function ClusteredTreeMarkers({ trees, healthColor, ringColor, renderPopup }) {
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
            >
              <Popup>{renderPopup(tree)}</Popup>
            </CircleMarker>
          );
        }

        // Beberapa pohon → gelembung berangka. Warnanya mengikuti kondisi
        // TERBURUK di dalam kelompok, supaya kelompok bermasalah tidak
        // tersamarkan oleh mayoritas pohon sehat.
        const statuses = cluster.items.map((t) => t.health_status ?? t.healthStatus);
        const worst = statuses.includes("buruk") ? "buruk"
                    : statuses.includes("sedang") ? "sedang"
                    : "baik";

        return (
          <Marker
            key={cluster.key}
            position={cluster.center}
            icon={clusterIcon(cluster.items.length, healthColor[worst])}
            eventHandlers={{
              // Klik gelembung → zoom ke isinya.
              click: () => {
                const bounds = L.latLngBounds(
                  cluster.items.map((t) => [Number(t.latitude), Number(t.longitude)])
                );
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
              },
            }}
          />
        );
      })}
    </>
  );
}
