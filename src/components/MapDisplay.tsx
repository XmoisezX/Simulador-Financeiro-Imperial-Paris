import React, { useEffect } from 'react';
import { MapPin, XCircle, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapDisplayProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    address: string;
    isValid: boolean;
    location: { lat: number, lng: number } | null;
    isGeocoding: boolean;
    geocodingError: string | null;
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
        return null; // Não renderiza marcadores se não houver localização
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


const MapDisplay: React.FC<MapDisplayProps> = ({ visibilidade, address, isValid, location, isGeocoding, geocodingError }) => {
    
    const defaultCenter: [number, number] = [-31.7719, -52.3425]; // Centro de Pelotas, RS
    const defaultZoom = 12;

    let mapContent;
    let mapClasses = "relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center overflow-hidden";

    if (!isValid) {
        mapContent = (
            <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center font-semibold">Localização Inválida</p>
                <p className="text-sm text-center">Preencha o CEP, Logradouro, Bairro e Número para visualizar o mapa.</p>
            </div>
        );
    } else if (isGeocoding) {
        mapContent = (
            <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Buscando endereço no mapa...</p>
            </div>
        );
    } else if (geocodingError) {
         mapContent = (
            <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center font-semibold">Erro de Geocodificação</p>
                <p className="text-sm text-center">{geocodingError}</p>
            </div>
        );
    } else if (visibilidade === 'Não mostrar') {
        mapContent = (
            <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>Localização no centro do bairro/cidade.</p>
                <p className="text-xs">Endereço não será exibido no mapa do site.</p>
            </div>
        );
    }

    // Se houver localização e não houver erro/carregamento, renderiza o mapa
    if (location && !isGeocoding && !geocodingError && visibilidade !== 'Não mostrar') {
        return (
            <div className="relative h-64 rounded-md mt-4">
                <MapContainer 
                    // Usa a localização encontrada ou o centro padrão como fallback inicial
                    center={[location.lat, location.lng]} 
                    zoom={visibilidade === 'Aproximada' ? 13 : 16} 
                    scrollWheelZoom={false}
                    className="w-full h-full rounded-md z-0"
                >
                    <MapController location={location} visibilidade={visibilidade} />
                </MapContainer>
            </div>
        );
    }

    // Renderiza o placeholder/erro
    return (
        <div className={mapClasses}>
            {mapContent}
        </div>
    );
};

export default MapDisplay;