import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, User, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
}

interface ExtractedUserSelectProps {
    imovelId: number;
    currentUserId: string | null;
    onUpdate: (newUserId: string | null) => void;
}

const ExtractedUserSelect: React.FC<ExtractedUserSelectProps> = ({ imovelId, currentUserId, onUpdate }) => {
    const { session } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        // Busca todos os perfis (usuários)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            const uniqueUsers = data as UserProfile[];
            setUsers(uniqueUsers.sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email)));
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newUserId = e.target.value || null;
        
        if (!session) {
            alert('Você precisa estar logado para atribuir um responsável.');
            return;
        }
        
        setIsSaving(true);
        setSaveStatus(null);
        
        // 1. Atualiza o estado local imediatamente (via prop)
        onUpdate(newUserId);

        // 2. Salva no Supabase
        const { error } = await supabase
            .from('imoveis_importados')
            .update({ responsible_user_id: newUserId })
            .eq('id', imovelId);

        setIsSaving(false);

        if (error) {
            console.error('Erro ao salvar responsável:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } else {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const selectedValue = currentUserId || '';

    return (
        <div className="relative w-full h-full flex items-center">
            <select
                id={`responsible-${imovelId}`}
                value={selectedValue}
                onChange={handleSelectChange}
                disabled={isLoading || isSaving}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange disabled:bg-gray-100 appearance-none"
            >
                <option value="">{isLoading ? 'Carregando...' : 'Não Atribuído'}</option>
                {users.map(user => (
                    <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                    </option>
                ))}
            </select>
            
            {isSaving && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 bg-white/80">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-orange" />
                </div>
            )}
            
            {saveStatus === 'success' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 bg-white/80">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
            )}
            
            {saveStatus === 'error' && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 bg-white/80">
                    <XCircle className="w-4 h-4 text-red-600" />
                </div>
            )}
        </div>
    );
};

export default ExtractedUserSelect;