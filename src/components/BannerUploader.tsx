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

    // estado para armazenar o código que o Dyad deve escrever
    const [pendingCodeToWrite, setPendingCodeToWrite] = useState<string | null>(null);
    
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
        // Mantive sua lógica original mas sem remover as aspas da serialização JSON
        // para manter um arquivo TypeScript válido. Se você quiser outro formato, ajuste aqui.
        const settingsString = JSON.stringify(settings, null, 4);

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
        
        if (!uploadSuccess) {
            setUploading(false);
            return;
        }
        
        // 2. Gerar o novo código com as configurações de transformação
        const newCode = generateSettingsCode(transformSettings);
        
        // Em vez de inserir JSX aqui (inválido), guardamos o código num estado
        setPendingCodeToWrite(newCode);

        setUploading(false);
        setSuccess('Configurações preparadas para escrita. Confirme para salvar no arquivo.');
        return true;
    }, [session, fileToUpload, transformSettings]);

    // Função auxiliar para limpar pending state após Dyad processar (opcional)
    const handleClearPending = useCallback(() => {
        setPendingCodeToWrite(null);
        setSuccess('Configurações escritas com sucesso.');
    }, []);

    // Funções simples de UI para trocar device
    const renderDeviceButton = (device: DeviceType) => {
        const active = currentDevice === device;
        const onClick = () => setCurrentDevice(device);
        const Icon = device === 'desktop' ? Monitor : device === 'tablet' ? Tablet : Smartphone;
        return (
            <button
                key={device}
                onClick={onClick}
                style={{
                    padding: 8,
                    marginRight: 8,
                    borderRadius: 6,
                    border: active ? '2px solid #f59e0b' : '1px solid #ddd',
                    background: active ? '#fff7ed' : '#fff'
                }}
                title={device}
            >
                <Icon size={16} />
            </button>
        );
    };

    return (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
            <h2>Upload e Posição do Banner de Fundo (Home)</h2>

            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ flex: '0 0 300px' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileChange}
                        style={{ display: 'block', marginBottom: 12 }}
                    />

                    <div style={{ display: 'flex', marginBottom: 12 }}>
                        {renderDeviceButton('desktop')}
                        {renderDeviceButton('tablet')}
                        {renderDeviceButton('mobile')}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <Button onClick={() => fileInputRef.current?.click()}><Upload /> Escolher Imagem</Button>
                        <Button onClick={handleUploadAndSave} style={{ marginLeft: 8 }}>
                            {uploading ? <Loader2 /> : <span>Salvar e Aplicar</span>}
                        </Button>
                    </div>

                    {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
                    {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 8 }}>
                        <h4>Pré-visualização</h4>
                        <BannerPreview
                            imageUrl={previewUrl ?? PUBLIC_URL}
                            transform={transformSettings[currentDevice]}
                            width={previewDimensions[currentDevice].width}
                            height={previewDimensions[currentDevice].height}
                        />
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <h4>Editor</h4>
                        <ImageManipulator
                            imageUrl={previewUrl ?? PUBLIC_URL}
                            initialTransform={transformSettings[currentDevice] ?? DEFAULT_TRANSFORM}
                            width={previewDimensions[currentDevice].width}
                            height={previewDimensions[currentDevice].height}
                            onChange={(newTransform) => {
                                setTransformSettings(prev => ({
                                    ...prev,
                                    [currentDevice]: newTransform
                                }));
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* dyad-write deve aparecer apenas no render, com o conteúdo escapado.
                O Dyad (ou o ambiente) interceptará essa tag para escrever o arquivo. */}
            {pendingCodeToWrite && (
                <div style={{ display: 'none' }}>
                    <dyad-write
                        path="src/hooks/useBannerPosition.ts"
                        description="Atualizando as configurações estáticas do banner no código."
                    >
{`
${String(pendingCodeToWrite).replace(/`/g, '\\`')}
`}
                    </dyad-write>
                </div>
            )}

            {/* Botão opcional para limpar o pending (após o Dyad aplicar a mudança) */}
            {pendingCodeToWrite && (
                <div style={{ marginTop: 12 }}>
                    <Button onClick={handleClearPending}>
                        <CheckCircle /> Confirmar que o arquivo foi gravado
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BannerUploader;
