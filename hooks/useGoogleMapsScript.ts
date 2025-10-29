import { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../src/config/apiKeys';

export const useGoogleMapsScript = () => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Verifica se a chave foi configurada
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            console.error("Google Maps API Key não configurada.");
            setError(true);
            return;
        }

        if (window.google && window.google.maps) {
            setLoaded(true);
            return;
        }

        const scriptId = 'google-maps-script';
        if (document.getElementById(scriptId)) {
            // Se o script já foi adicionado, esperamos o evento de load (ou assumimos que já carregou)
            setLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        // Usando a chave importada
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;

        const handleLoad = () => setLoaded(true);
        const handleError = () => {
            setError(true);
            console.error("Falha ao carregar o script do Google Maps.");
        };

        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);

        document.head.appendChild(script);

        return () => {
            script.removeEventListener('load', handleLoad);
            script.removeEventListener('error', handleError);
        };
    }, []);

    return { loaded, error };
};