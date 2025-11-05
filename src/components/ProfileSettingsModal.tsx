import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, User, Mail, Briefcase, Phone, Lock, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import AvatarUploader from './AvatarUploader';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const applyThemeClass = (theme: string | null | undefined) => {
    const el = document.documentElement;
    if (!el) return;
    el.classList.remove('theme-dark', 'theme-light');
    if (theme === 'dark') el.classList.add('theme-dark');
    else el.classList.add('theme-light');
};

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
    const { profile, updateProfile, fetchProfile } = useProfile();
    const { session } = useAuth();
    
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setRole(profile.role || '');
            setCompanyName(profile.company_name || 'IMPERIAL PARIS');
            setPhone(profile.phone || '');
            setTheme((profile.theme as 'light' | 'dark') || 'light');
            // apply on mount
            applyThemeClass(profile.theme);
        } else if (session) {
            setFullName('');
            setRole('');
            setCompanyName('IMPERIAL PARIS');
            setPhone('');
            setTheme('light');
            applyThemeClass('light');
        }
    }, [profile, session]);

    const handleSave = useCallback(async () => {
        if (!fullName.trim()) {
            setUpdateError('O nome completo é obrigatório.');
            return;
        }

        setIsUpdating(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        const success = await updateProfile({
            full_name: fullName.trim(),
            role: role.trim(),
            company_name: companyName.trim(),
            phone: phone.trim(),
            theme: theme,
        });

        setIsUpdating(false);
        if (success) {
            setUpdateSuccess(true);
            // Apply theme immediately in the page
            applyThemeClass(theme);
            setTimeout(() => setUpdateSuccess(false), 3000);
        } else {
            setUpdateError('Falha ao salvar as informações.');
        }
    }, [fullName, role, companyName, phone, updateProfile, theme]);
    
    const handleAvatarUpdate = useCallback(async (newUrl: string) => {
        const success = await updateProfile({ avatar_url: newUrl });
        return success;
    }, [updateProfile]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text">⚙️ Configurações da Conta</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Conteúdo do Perfil */}
                <div className="p-6 space-y-6">
                    <div className="border p-4 rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-dark-text mb-3">Foto de Perfil</h3>
                        <AvatarUploader 
                            currentAvatarUrl={profile?.avatar_url || null}
                            onUploadSuccess={handleAvatarUpdate}
                            disabled={isUpdating}
                        />
                        <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, WEBP. Máx: 5MB.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput 
                            label={<span>Nome Completo <span className="text-red-500">*</span></span>} 
                            id="fullName" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            placeholder="Seu nome completo"
                        />
                        <TextInput 
                            label={<span>E-mail Empresarial</span>} 
                            id="email" 
                            value={session?.user.email || ''} 
                            disabled
                            placeholder="email@empresa.com"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput 
                            label={<span>Cargo / Função</span>} 
                            id="role" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                            placeholder="Corretor, Gerente, etc."
                        />
                        <TextInput 
                            label={<span>Nome da Empresa</span>} 
                            id="companyName" 
                            value={companyName} 
                            onChange={(e) => setCompanyName(e.target.value)} 
                            placeholder="IMPERIAL PARIS"
                        />
                    </div>

                    <h3 className="text-lg font-semibold text-dark-text pt-4 border-t border-gray-100">Contato e Preferências</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput 
                            label={<span>Telefone</span>} 
                            id="phone" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(53) 99999-9999"
                        />
                        <div>
                            <label className="block text-sm font-medium text-light-text mb-1">Tema</label>
                            <div className="flex items-center space-x-4">
                                <label className={`px-3 py-2 rounded-md cursor-pointer ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
                                    <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} />
                                    <span className="ml-2">Claro</span>
                                </label>
                                <label className={`px-3 py-2 rounded-md cursor-pointer ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200'}`}>
                                    <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                                    <span className="ml-2">Escuro</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Escolha entre o modo Claro ou Escuro para sua conta (aplicado imediatamente).</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                        <Lock className="w-4 h-4 mr-2" /> Alterar Senha (Mock)
                    </Button>
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    {updateError && <p className="text-red-600 self-center mr-4 text-sm">{updateError}</p>}
                    {updateSuccess && <p className="text-green-600 self-center mr-4 text-sm">Salvo com sucesso!</p>}
                    
                    <Button variant="outline" onClick={onClose} disabled={isUpdating}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsModal;