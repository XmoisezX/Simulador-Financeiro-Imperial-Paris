import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Loader2, XCircle, CheckCircle, Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../integrations/supabase/client'; // Mantido apenas para upload de imagem
import { useAuth } from '../contexts/AuthContext';
import ImageManipulator, { DeviceType, ImageTransform } from './ImageManipulator';
import BannerPreview from './BannerPreview';
import { useBannerPosition } from '../hooks/useBannerPosition'; // Usando o novo hook

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BANNER_FILENAME = 'hero-background.png';
const BANNER_BUCKET = 'imovel-media';
const PUBLIC_URL = `https://pqievwbfrbiqhvdyalrh.supabase.co/storage/v1/object/public/${BANNER_BUCKET}/${BANNER_FILENAME}`;

// Configuração de Posição
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1.0, offsetX: 0, offsetY: 0 };

interface BannerSettings {
    desktop: ImageTransform;
    tablet: ImageTransform;
    mobile: ImageTransform;
}

const BannerUploader: React.FC = () => {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Usando o novo hook para obter as configurações estáticas
    const { settings: initialSettings, isLoading: isSettingsLoading } = useBannerPosition();
    const [transformSettings, setTransformSettings] = useState<BannerSettings>(initialSettings);
    
    // Sincroniza o estado local com as configurações iniciais carregadas
    useEffect(() => {
        setTransformSettings(initialSettings);
    }, [initialSettings]);
    
    // Dimensões do preview para o manipulador
    const previewDimensions: Record<DeviceType, { width: number, height: number }> = {
        desktop: { width: 1024, height: 650 },
        tablet: { width: 768, height: 650 },
        mobile: { width: 375, height: 650 },
    };
    
    const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');

    // --- Geração de Código para Salvar ---
    const generateSettingsCode = (settings: BannerSettings) => {
        const settingsString = JSON.stringify(settings, null, 4).replace(/"/g, '');

        return `import { useState, useEffect, useCallback } from 'react';
import { DeviceType, ImageTransform } from '../components/ImageManipulator';

// Configuração de Posição Padrão (Hardcoded)
const DEFAULT_TRANSFORM: ImageTransform = { scale: 1.0, offsetX: 0, offsetY: 0 };

interface BannerSettings {
    desktop: ImageTransform;
    tablet: ImageTransform;
    mobile: ImageTransform;
}

// **CONFIGURAÇÕES ATUAIS DO BANNER (EDITAR ESTE OBJETO PARA SALVAR)**
const STATIC_BANNER_SETTINGS: BannerSettings = ${settingsString};

export const useBannerPosition = () => {
    const [settings, setSettings] = useState<BannerSettings>(STATIC_BANNER_SETTINGS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(() => {
        setSettings(STATIC_BANNER_SETTINGS);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = useCallback(async (newSettings: BannerSettings) => {
        // Esta função será interceptada pelo Dyad para gerar o novo código.
        console.log('Simulating saving settings to code:', newSettings);
        return true;
    }, []);

    return { settings, isLoading, error, saveSettings };
};
`;
    };
    
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
        if (!session?.user.id) {
            setError('Você precisa estar logado para salvar as configurações.');
            return;
        }

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
        
        // 2. Gerar e salvar o novo código com as configurações de transformação
        const newCode = generateSettingsCode(transformSettings);
        
        // Usamos o dyad-write para persistir as configurações no código
        // O Dyad irá interceptar isso e aplicar a mudança no arquivo.
        
        <dyad-write path="src/hooks/useBannerPosition.ts" description="Atualizando as configurações estáticas do banner no código.">
{newCode}