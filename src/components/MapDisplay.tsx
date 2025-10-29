import React from 'react';
import { MapPin, XCircle } from 'lucide-react';

interface MapDisplayProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    address: string;
    isValid: boolean;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ visibilidade, address, isValid }) => {
    
    // Mock de coordenadas para Pelotas (Centro)
    const mockLat = -31.7715;
    const mockLng = -52.3401;

    // Se o endereço não for válido, mostramos um aviso
    if (!isValid) {
        return (
            <div className="h-64 bg-gray-200 rounded-md mt-4 flex flex-col items-center justify-center text-gray-500 p-4">
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-center font-semibold">Localização Inválida</p>
                <p className="text-sm text-center">Preencha o CEP, Logradouro, Bairro e Número para visualizar o mapa.</p>
            </div>
        );
    }

    let mapContent;
    let mapClasses = "relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center overflow-hidden";

    switch (visibilidade) {
        case 'Exata':
            mapContent = (
                <>
                    <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                        [Mapa Estático: {address}]
                    </div>
                    <MapPin className="w-8 h-8 text-red-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" fill="red" />
                    <p className="absolute bottom-2 text-xs text-dark-text bg-white p-1 rounded shadow">Localização Exata</p>
                </>
            );
            break;
        case 'Aproximada':
            mapContent = (
                <>
                    <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                        [Mapa Estático: {address}]
                    </div>
                    {/* Simulação de círculo de 1km em meio tom laranja */}
                    <div className="absolute w-40 h-40 bg-primary-orange opacity-30 rounded-full animate-pulse"></div>
                    <MapPin className="w-6 h-6 text-primary-orange absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" fill="#ff6600" />
                    <p className="absolute bottom-2 text-xs text-dark-text bg-white p-1 rounded shadow">Localização Aproximada (Raio de 1km)</p>
                </>
            );
            break;
        case 'Não mostrar':
        default:
            mapContent = (
                <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p>Localização no centro do bairro/cidade.</p>
                    <p className="text-xs">Endereço não será exibido no mapa do site.</p>
                </div>
            );
            mapClasses += " bg-gray-100";
            break;
    }

    return (
        <div className={mapClasses}>
            {mapContent}
        </div>
    );
};

export default MapDisplay;