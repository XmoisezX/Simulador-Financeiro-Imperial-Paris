import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// A correção do ícone do Leaflet
if (typeof window !== 'undefined' && L.Icon) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}

interface MapWrapperProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    location: { lat: number, lng: number } | null;
    center: [number, number];
    zoom: number;
}

// Componente interno para controlar o mapa e marcadores
const MapController: React.FC<{ location: { lat: number, lng: number } | null, visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar' }> = ({ location, visibilidade }) => {
    const map = useMap();
    
    useEffect(() => {
        if (location) {
            // Ajusta a visualização do mapa
            const zoomLevel = visibilidade === 'Aproximada' ? 13 : 16;
            map.setView([location.lat, location.lng], zoomLevel);
        }
    }, [location, visibilidade, map]);

    if (!location) {
        return (
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
        );
    }

    return (
        <>
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {visibilidade === 'Exata' && (
                <Marker position={[location.lat, location.lng]} />
            )}
            
            {visibilidade === 'Aproximada' && (
                <Circle 
                    center={[location.lat, location.lng]} 
                    radius={1000} // 1 km
                    pathOptions={{ 
                        color: '#ff6600', 
                        fillColor: '#ff6600', 
                        fillOpacity: 0.35 
                    }}
                />
            )}
        </>
    );
};


const MapWrapper: React.FC<MapWrapperProps> = ({ location, visibilidade, center, zoom }) => {
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            scrollWheelZoom={false}
            className="w-full h-full rounded-md z-0"
        >
            <MapController location={location} visibilidade={visibilidade} />
        </MapContainer>
    );
};

export default MapWrapper;