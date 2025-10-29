import React, { useEffect, useRef, useState } from 'react';
import { MapPin, XCircle, Loader2 } from 'lucide-react';
import { useGoogleMapsScript } from '../../hooks/useGoogleMapsScript';

interface MapDisplayProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    address: string;
    isValid: boolean;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ visibilidade, address, isValid }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);
    const { loaded: scriptLoaded, error: scriptError } = useGoogleMapsScript();
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Função para geocodificar o endereço
    const geocodeAddress = async (addr: string) => {
        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) return;

        setIsGeocoding(true);
        const geocoder = new google.maps.Geocoder();
        
        try {
            const response = await geocoder.geocode({ address: addr });
            if (response.results.length > 0) {
                const loc = response.results[0].geometry.location;
                setLocation({ lat: loc.lat(), lng: loc.lng() });
            } else {
                setLocation(null);
            }
        } catch (e) {
            console.error("Geocoding failed:", e);
            setLocation(null);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Efeito para geocodificar quando o endereço ou a validade mudam
    useEffect(() => {
        if (scriptLoaded && isValid && address) {
            geocodeAddress(address);
        } else if (!isValid) {
            setLocation(null);
        }
    }, [scriptLoaded, isValid, address]);

    // Efeito para inicializar e atualizar o mapa
    useEffect(() => {
        if (!scriptLoaded || !mapRef.current || !location) return;

        const center = location;
        
        // 1. Inicializar o mapa se ainda não existir
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
                center: center,
                zoom: 15,
                disableDefaultUI: true,
                zoomControl: true,
            });
        } else {
            // Se o mapa já existe, apenas centraliza
            mapInstanceRef.current.setCenter(center);
        }

        // 2. Limpar marcadores/círculos anteriores
        markerRef.current?.setMap(null);
        circleRef.current?.setMap(null);

        // 3. Adicionar elementos baseados na visibilidade
        if (visibilidade === 'Exata') {
            markerRef.current = new google.maps.Marker({
                position: center,
                map: mapInstanceRef.current,
                title: "Localização Exata",
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }
            });
            mapInstanceRef.current.setZoom(16);
        } else if (visibilidade === 'Aproximada') {
            // Adiciona um círculo de 1km (1000 metros)
            circleRef.current = new google.maps.Circle({
                strokeColor: '#ff6600',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#ff6600',
                fillOpacity: 0.35,
                map: mapInstanceRef.current,
                center: center,
                radius: 1000, // 1 km
            });
            mapInstanceRef.current.setZoom(13);
        }
        
        // Cleanup function
        return () => {
            markerRef.current?.setMap(null);
            circleRef.current?.setMap(null);
        };

    }, [scriptLoaded, location, visibilidade]);


    let mapContent;
    let mapClasses = "relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center overflow-hidden";

    if (scriptError) {
        mapContent = (
            <div className="text-center text-red-500 p-4">
                <XCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold">Erro ao carregar o Google Maps.</p>
                <p className="text-sm">Verifique se a chave de API está configurada corretamente em `src/config/apiKeys.ts`.</p>
            </div>
        );
    } else if (!scriptLoaded || isGeocoding) {
        mapContent = (
            <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Carregando mapa...</p>
            </div>
        );
    } else if (!isValid) {
        mapContent = (
            <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center font-semibold">Localização Inválida</p>
                <p className="text-sm text-center">Preencha o CEP, Logradouro, Bairro e Número para visualizar o mapa.</p>
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
    } else if (!location) {
         mapContent = (
            <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center font-semibold">Endereço não encontrado</p>
                <p className="text-sm text-center">Não foi possível geocodificar o endereço fornecido.</p>
            </div>
        );
    }

    return (
        <div className={mapClasses}>
            {/* O mapa real será renderizado neste div */}
            <div ref={mapRef} className="w-full h-full" style={{ display: (scriptLoaded && location && visibilidade !== 'Não mostrar') ? 'block' : 'none' }}></div>
            
            {/* Overlay para estados de carregamento/erro/não mostrar */}
            {(!scriptLoaded || isGeocoding || !isValid || visibilidade === 'Não mostrar' || !location || scriptError) && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    {mapContent}
                </div>
            )}
        </div>
    );
};

export default MapDisplay;