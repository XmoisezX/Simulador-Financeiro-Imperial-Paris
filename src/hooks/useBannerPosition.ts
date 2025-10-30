import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

const BANNER_POSITION_KEY = 'hero_position';
const DEFAULT_POSITION = 'center';

export const useBannerPosition = () => {
    const [position, setPosition] = useState(DEFAULT_POSITION);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosition = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        // Busca a configuração de posição
        const { data, error } = await supabase
            .from('site_settings')
            .select('setting_value')
            .eq('setting_key', BANNER_POSITION_KEY)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora 'Row not found'
            console.error('Error fetching banner position:', error);
            setError('Falha ao carregar a configuração do banner.');
        } else if (data) {
            setPosition(data.setting_value.position || DEFAULT_POSITION);
        } else {
            setPosition(DEFAULT_POSITION);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchPosition();
    }, [fetchPosition]);

    return { position, isLoading, error };
};