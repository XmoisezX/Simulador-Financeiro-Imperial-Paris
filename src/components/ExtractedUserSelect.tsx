import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, User, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
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
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const fetchUsers = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
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
    
    // Fecha o select ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsSelectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
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
        setIsSelectOpen(false); // Fecha após a seleção

        if (error) {
            console.error('Erro ao salvar responsável:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
        } else {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const selectedUser = users.find(u => u.id === currentUserId);
    const displayName = selectedUser?.full_name || selectedUser?.email?.split('@')[0] || 'Não Atribuído';
    const selectedValue = currentUserId || '';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                <Loader2 className="w-3 h-3 animate-spin mr-1" /> Carregando...
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center p-2 cursor-pointer hover:bg-gray-50 transition-colors" ref={selectRef}>
            
            {isSelectOpen ? (
                // Modo de Seleção (Dropdown)
                <select
                    id={`responsible-${imovelId}`}
                    value={selectedValue}
                    onChange={handleSelectChange}
                    disabled={isSaving}
                    className="w-full p-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange disabled:bg-gray-100 appearance-none"
                    autoFocus
                >
                    <option value="">Não Atribuído</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name || user.email}
                        </option>
                    ))}
                </select>
            ) : (
                // Modo de Visualização (Botão)
                <button
                    onClick={() => setIsSelectOpen(true)}
                    className={`w-full text-left text-sm flex items-center justify-between ${currentUserId ? 'text-dark-text font-medium' : 'text-gray-500'}`}
                    disabled={isSaving}
                >
                    <span className="truncate pr-2">{displayName}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                </button>
            )}
            
            {isSaving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-orange" />
                </div>
            )}
            
            {saveStatus === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-50/80">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
            )}
            
            {saveStatus === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50/80">
                    <XCircle className="w-4 h-4 text-red-600" />
                </div>
            )}
        </div>
    );
};

export default ExtractedUserSelect;