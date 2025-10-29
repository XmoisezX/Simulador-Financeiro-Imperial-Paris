import React, { Suspense } from 'react';
import { VisibilidadeMapa } from '../../types';
import { Loader2 } from 'lucide-react';

// Carregamento dinâmico do MapDisplay
const MapDisplay = React.lazy(() => import('./MapDisplay'));

interface MapDisplayWrapperProps {
    visibilidade: VisibilidadeMapa;
    address: string;
    isValid: boolean;
    location: { lat: number, lng: number } | null;
    isGeocoding: boolean;
    geocodingError: string | null;
}

const MapDisplayWrapper: React.FC<MapDisplayWrapperProps> = (props) => {
    return (
        <Suspense fallback={
            <div className="relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
                <p className="ml-3 text-gray-600">Carregando mapa...</p>
            </div>
        }>
            <MapDisplay {...props} />
        </Suspense>
    );
};

export default MapDisplayWrapper;