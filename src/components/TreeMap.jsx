import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { treeApi } from "../lib/api";

const BASE_LAT = -7.9847;
const BASE_LNG = 110.4734;

const healthColor = { baik: "#2f6e51", sedang: "#c89b3c", buruk: "#c0392b" };

export default function TreeMap() {
  const { data: trees, loading, error } = useApi(() => treeApi.list());

  return (
    <div className="bg-white rounded-2xl border border-cream-100 overflow-hidden shadow-sm">
      <ApiState loading={loading} error={error}
        skeleton={<div className="h-64 bg-cream-100 animate-pulse"/>}
      >
        <MapContainer
          center={[BASE_LAT, BASE_LNG]}
          zoom={14}
          style={{ height: 320, width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {(trees ?? []).map((tree) => (
            <CircleMarker
              key={tree.id}
              center={[tree.latitude, tree.longitude]}
              radius={8}
              fillColor={healthColor[tree.health_status ?? tree.healthStatus] ?? "#2f6e51"}
              color="#fff"
              weight={2}
              fillOpacity={0.85}
            >
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <p className="font-bold font-mono">{tree.id}</p>
                  <p>{tree.species}</p>
                  <p className="text-forest-700/60">{tree.farmer_name ?? tree.farmerName}</p>
                  <p className="text-sage-600 font-semibold">{(tree.co2_eq_kg ?? tree.co2EqKg ?? 0).toFixed(1)} kg CO₂e</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </ApiState>
    </div>
  );
}
