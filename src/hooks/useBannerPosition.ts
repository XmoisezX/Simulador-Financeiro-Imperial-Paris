import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { DeviceType, ImageTransform } from '../components/ImageManipulator';

const BANNER_SETTINGS_KEY = 'hero_settings';
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1.0, offsetX: 0, offsetY: 0 }; // Alterado para 0/0

interface BannerSettings {
    desktop: ImageTransform;
    tablet: ImageTransform;
    mobile: ImageTransform;
}

const initialSettings: BannerSettings = {
    desktop: DEFAULT_TRANSFORM,
    tablet: DEFAULT_TRANSFORM,
    mobile: DEFAULT_TRANSFORM,
};

export const useBannerPosition = () => {
    const [settings, setSettings] = useState<BannerSettings>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        // Busca a configuração de posição
        const { data, error } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', BANNER_SETTINGS_KEY)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora 'Row not found'
            console.error('Error fetching banner settings:', error);
            setError('Falha ao carregar a configuração do banner.');
        } else if (data) {
            setSettings(data.setting_value as BannerSettings);
        } else {
            setSettings(initialSettings);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return { settings, isLoading, error };
};