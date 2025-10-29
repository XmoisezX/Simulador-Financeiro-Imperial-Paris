import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string | null;
    company_name: string | null;
    avatar_url: string | null;
}

interface UpdateProfileData {
    full_name?: string;
    role?: string;
    company_name?: string;
    avatar_url?: string;
}

export const useProfile = () => {
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!session?.user.id) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, company_name, avatar_url')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            // Se o erro for "Row not found", pode ser que o trigger não tenha rodado.
            // Não definimos um erro fatal aqui para permitir que o usuário continue.
            setProfile(null);
        } else {
            setProfile(data as Profile);
        }
        setIsLoading(false);
    }, [session?.user.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = useCallback(async (updates: UpdateProfileData) => {
        if (!session?.user.id) {
            setError('Usuário não autenticado.');
            return false;
        }

        setError(null);
        
        // Adiciona updated_at para garantir que o registro seja atualizado
        const updatesWithTimestamp = {
            ...updates,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updatesWithTimestamp)
            .eq('id', session.user.id);

        if (error) {
            console.error('Error updating profile:', error);
            setError(`Erro ao atualizar o perfil: ${error.message}`);
            return false;
        }

        // Atualiza o estado local após o sucesso
        setProfile(prev => ({
            ...(prev as Profile),
            ...updates,
        }));
        return true;
    }, [session?.user.id]);

    return { profile, isLoading, error, updateProfile, fetchProfile };
};