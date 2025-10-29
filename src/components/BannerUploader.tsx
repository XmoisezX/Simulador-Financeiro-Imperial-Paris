import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BANNER_FILENAME = 'hero-background.png';
const BANNER_BUCKET = 'imovel-media';
const PUBLIC_URL = `https://pqievwbfrbiqhvdyalrh.supabase.co/storage/v1/object/public/${BANNER_BUCKET}/${BANNER_FILENAME}`;

const BannerUploader: React.FC = () => {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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

    const handleUpload = useCallback(async () => {
        if (!session?.user.id || !fileToUpload) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        // 1. Upload para o Storage com upsert: true para sobrescrever o banner existente
        const { error: uploadError } = await supabase.storage
            .from(BANNER_BUCKET)
            .upload(BANNER_FILENAME, fileToUpload, {
                cacheControl: '3600',
                upsert: true, 
                contentType: fileToUpload.type,
            });

        if (uploadError) {
            setError(`Erro ao fazer upload: ${uploadError.message}`);
        } else {
            setSuccess('Banner de fundo atualizado com sucesso! O site pode levar alguns minutos para atualizar devido ao cache.');
            setFileToUpload(null);
            setPreviewUrl(null);
        }

        setUploading(false);
    }, [session?.user.id, fileToUpload]);
    
    const handleCancel = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setFileToUpload(null);
        setPreviewUrl(null);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-dark-text">Upload do Banner de Fundo (Home)</h3>
            <p className="text-sm text-light-text">
                Esta imagem será usada como fundo na seção de busca da página inicial. 
                Recomendamos uma imagem de alta resolução (mínimo 1920x1080) e com foco central.
            </p>

            <input
                type="file"
                ref={fileInputRef}
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />

            {/* Pré-visualização e Ações */}
            <div className="border border-dashed border-gray-300 p-4 rounded-md space-y-4">
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Pré-visualização do Banner" className="w-full h-full object-cover" />
                    ) : (
                        <img src={PUBLIC_URL} alt="Banner Atual" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    )}
                    {!previewUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            <p className="text-center">Clique para selecionar uma nova imagem.</p>
                        </div>
                    )}
                </div>
                
                <div className="flex space-x-3">
                    <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Upload className="w-4 h-4 mr-2" /> {fileToUpload ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </Button>
                    
                    {fileToUpload && (
                        <Button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Banner'}
                        </Button>
                    )}
                    
                    {(fileToUpload || success) && (
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