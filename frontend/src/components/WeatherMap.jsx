import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in react-leaflet
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 10);
        }
    }, [center, map]);
    return null;
}

export default function WeatherMap({ lat, lon, locationName }) {
    if (lat == null || lon == null) return null;

    const center = [lat, lon];

    return (
        <div className="weather-map card" id="weather-map">
            <h2>📍 Location Map</h2>
            <MapContainer
                center={center}
                zoom={10}
                style={{ width: "100%", borderRadius: "12px", zIndex: 1, minHeight: "300px" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={center}>
                    <Popup>
                        <strong>{locationName || "Location"}</strong>
                        <br />
                        {lat.toFixed(4)}, {lon.toFixed(4)}
                    </Popup>
                </Marker>
                <MapUpdater center={center} />
            </MapContainer>
        </div>
    );
}
