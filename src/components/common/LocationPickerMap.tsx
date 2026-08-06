import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in bundlers (Vite/Webpack)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface LocationPickerMapProps {
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
}

const MapEvents: React.FC<{ onChange: (lat: number, lng: number) => void }> = ({ onChange }) => {
    useMapEvents({
        click(e) {
            onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        },
    });
    return null;
};

const RecenterMap: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([latitude, longitude], map.getZoom());
    }, [latitude, longitude, map]);
    return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
    latitude,
    longitude,
    onChange,
}) => {
    return (
        <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
            <MapContainer
                center={[latitude, longitude]}
                zoom={13}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]} />
                <MapEvents onChange={onChange} />
                <RecenterMap latitude={latitude} longitude={longitude} />
            </MapContainer>
        </div>
    );
};