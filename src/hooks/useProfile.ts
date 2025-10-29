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
            setError('Não foi possível carregar o perfil.');
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
        
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);

        if (error) {
            console.error('Error updating profile:', error);
            setError('Erro ao atualizar o perfil.');
            return false;
        }

        // Atualiza o estado local após o sucesso
        setProfile(prev => ({
            ...(prev as Profile),
            ...updates,
            updated_at: new Date().toISOString(),
        }));
        return true;
    }, [session?.user.id]);

    return { profile, isLoading, error, updateProfile, fetchProfile };
};