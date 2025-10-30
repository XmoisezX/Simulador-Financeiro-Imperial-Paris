import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Loader2, XCircle, CheckCircle, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import ImageEditor, { DeviceType, ImageTransform } from './ImageEditor';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BANNER_FILENAME = 'hero-background.png';
const BANNER_BUCKET = 'imovel-media';
const PUBLIC_URL = `https://pqievwbfrbiqhvdyalrh.supabase.co/storage/v1/object/public/${BANNER_BUCKET}/${BANNER_FILENAME}`;

// Configuração de Posição
const BANNER_SETTINGS_KEY = 'hero_settings';
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1.0, offsetX: 0, offsetY: 0 };

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

const BannerUploader: React.FC = () => {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Estado de Transformação
    const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
    const [transformSettings, setTransformSettings] = useState<BannerSettings>(initialSettings);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    
    // --- Supabase Utilities ---
    const saveSettings = useCallback(async (settings: BannerSettings) => {
        if (!session) return false;
        
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                setting_key: BANNER_SETTINGS_KEY,
                setting_value: settings,
            }, { onConflict: 'setting_key' });

        if (error) {
            console.error('Error saving banner settings:', error);
            setError('Erro ao salvar as configurações do banner.');
            return false;
        }
        setTransformSettings(settings);
        setSuccess('Configurações salvas com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
        return true;
    }, [session]);
    
    // --- Efeitos ---
    // 1. Fetch current settings
    useEffect(() => {
        const fetchSettings = async () => {
            setIsSettingsLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', BANNER_SETTINGS_KEY)
                .single();

            if (error && error.code !== 'PGRST116') { 
                console.error('Error fetching banner settings:', error);
            } else if (data) {
                setTransformSettings(data.setting_value as BannerSettings);
            }
            setIsSettingsLoading(false);
        };
        if (session) {
            fetchSettings();
        }
    }, [session]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccess(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Formato de arquivo inválido. Use JPG, PNG ou WEBP.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('O arquivo deve ter no máximo 5MB.');
            return;
        }

        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setFileToUpload(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadAndSave = useCallback(async () => {
        if (!session?.user.id) return;

        setUploading(true);
        setError(null);
        setSuccess(null);
        
        let uploadSuccess = true;

        // 1. Upload do arquivo (se houver um novo)
        if (fileToUpload) {
            const { error: uploadError } = await supabase.storage
                .from(BANNER_BUCKET)
                .upload(BANNER_FILENAME, fileToUpload, {
                    cacheControl: '3600',
                    upsert: true, 
                    contentType: fileToUpload.type,
                });

            if (uploadError) {
                setError(`Erro ao fazer upload: ${uploadError.message}`);
                uploadSuccess = false;
            }
        }
        
        // 2. Salvar as configurações de transformação (sempre salva, mesmo que só a posição mude)
        const settingsSaved = await saveSettings(transformSettings);
        
        if (uploadSuccess && settingsSaved) {
            setSuccess('Banner de fundo e configurações atualizados com sucesso! O site pode levar alguns minutos para atualizar devido ao cache.');
            setFileToUpload(null);
            setPreviewUrl(null);
        } else if (settingsSaved) {
             setSuccess('Configurações de visualização salvas com sucesso!');
        }

        setUploading(false);
    }, [session?.user.id, fileToUpload, transformSettings, saveSettings, previewUrl]);
    
    const handleCancel = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setFileToUpload(null);
        setPreviewUrl(null);
        setError(null);
        setSuccess(null);
        
        // Recarrega as configurações iniciais
        if (initialSettings) {
            setTransformSettings(initialSettings);
        }
    };
    
    const handleTransformChange = (transform: ImageTransform) => {
        setTransformSettings(prev => ({
            ...prev,
            [currentDevice]: transform,
        }));
    };
    
    const currentTransform = transformSettings[currentDevice];
    const isDirty = fileToUpload !== null || JSON.stringify(transformSettings) !== JSON.stringify(initialSettings);

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-text">Upload e Posição do Banner de Fundo (Home)</h3>
            <p className="text-sm text-light-text">
                Selecione a imagem e ajuste o zoom e a posição para cada tipo de dispositivo.
            </p>

            <input
                type="file"
                ref={fileInputRef}
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />

            {/* Seletor de Dispositivo */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-md font-semibold text-dark-text">Visualização por Dispositivo</h4>
                <div className="flex flex-wrap gap-3">
                    <Button 
                        onClick={() => setCurrentDevice('desktop')}
                        variant={currentDevice === 'desktop' ? 'default' : 'outline'}
                        className={currentDevice === 'desktop' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}
                        disabled={uploading}
                    >
                        <Monitor className="w-4 h-4 mr-2" /> Desktop
                    </Button>
                    <Button 
                        onClick={() => setCurrentDevice('tablet')}
                        variant={currentDevice === 'tablet' ? 'default' : 'outline'}
                        className={currentDevice === 'tablet' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}
                        disabled={uploading}
                    >
                        <Tablet className="w-4 h-4 mr-2" /> Tablet
                    </Button>
                    <Button 
                        onClick={() => setCurrentDevice('mobile')}
                        variant={currentDevice === 'mobile' ? 'default' : 'outline'}
                        className={currentDevice === 'mobile' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}
                        disabled={uploading}
                    >
                        <Smartphone className="w-4 h-4 mr-2" /> Mobile
                    </Button>
                </div>
            </div>

            {/* Editor de Imagem */}
            <ImageEditor
                imageUrl={previewUrl || PUBLIC_URL}
                currentTransform={currentTransform}
                onTransformChange={handleTransformChange}
                device={currentDevice}
                isLoading={isSettingsLoading || uploading}
            />

            {/* Ações de Upload e Salvar */}
            <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Upload className="w-4 h-4 mr-2" /> {fileToUpload ? 'Trocar Imagem' : 'Selecionar Nova Imagem'}
                </Button>
                
                <Button
                    type="button"
                    onClick={handleUploadAndSave}
                    disabled={uploading || (!fileToUpload && !isDirty)}
                    className="bg-primary-orange hover:bg-secondary-orange text-white"
                >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Configurações'}
                </Button>
                
                {(fileToUpload || isDirty) && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploading}
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                    >
                        Cancelar
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex items-center text-red-600 text-sm p-2 bg-red-50 rounded-md">
                    <XCircle className="w-4 h-4 mr-2" /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center text-green-600 text-sm p-2 bg-green-50 rounded-md">
                    <CheckCircle className="w-4 h-4 mr-2" /> {success}
                </div>
            )}
        </div>
    );
};

export default BannerUploader;