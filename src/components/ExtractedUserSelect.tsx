import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, User, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

// Lista fixa de responsáveis
const RESPONSIBLE_USERS = [
    { id: 'Moisez Torres', name: 'Moisez Torres' },
    { id: 'Alessandro Gomes', name: 'Alessandro Gomes' },
    { id: 'Tamires Torres', name: 'Tamires Torres' },
];

interface ExtractedUserSelectProps {
    imovelId: number;
    currentUserName: string | null; // Renomeado para refletir que é o nome
    onUpdate: (newUserName: string | null) => void;
}

const ExtractedUserSelect: React.FC<ExtractedUserSelectProps> = ({ imovelId, currentUserName, onUpdate }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

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
        const newUserName = e.target.value || null;
        
        setIsSaving(true);
        setSaveStatus(null);
        
        // 1. Atualiza o estado local imediatamente (via prop)
        onUpdate(newUserName);

        // 2. Salva no Supabase (usando o campo responsible_user_id para armazenar o nome)
        const { error } = await supabase
            .from('imoveis_importados')
            .update({ responsible_user_id: newUserName })
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

    const displayName = currentUserName || 'Não Atribuído';
    const selectedValue = currentUserName || '';

    return (
        <div 
            className={`relative w-full h-full flex items-center p-2 cursor-pointer transition-colors ${currentUserName ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-50'}`} 
            ref={selectRef}
        >
            
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
                    {RESPONSIBLE_USERS.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                    ))}
                </select>
            ) : (
                // Modo de Visualização (Botão)
                <button
                    onClick={() => setIsSelectOpen(true)}
                    className={`w-full text-left text-sm flex items-center justify-between ${currentUserName ? 'text-green-800 font-medium' : 'text-gray-500'}`}
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