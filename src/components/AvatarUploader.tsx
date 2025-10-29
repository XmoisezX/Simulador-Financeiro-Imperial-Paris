import React, { useState, useRef, useCallback } from 'react';
import { User, Upload, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { supabase } from '../integrations/supabase/client';

interface AvatarUploaderProps {
    currentAvatarUrl: string | null;
    onUploadSuccess: (newUrl: string) => void;
    disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ currentAvatarUrl, onUploadSuccess, disabled = false }) => {
    const { session } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Formato de arquivo inválido. Use JPG, PNG ou WEBP.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('O arquivo deve ter no máximo 5MB.');
            return;
        }

        setFileToUpload(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = useCallback(async () => {
        if (!session?.user.id || !fileToUpload) return;

        setUploading(true);
        setError(null);

        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // 1. Upload para o Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars') // Usaremos um bucket chamado 'avatars'
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            setError(`Erro ao fazer upload: ${uploadError.message}`);
            setUploading(false);
            return;
        }

        // 2. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Atualizar o perfil no banco de dados
        const success = await onUploadSuccess(publicUrl);

        if (success) {
            // Limpar estados após sucesso
            setFileToUpload(null);
            setPreviewUrl(null);
        } else {
             setError('Erro ao salvar a URL no perfil.');
        }

        setUploading(false);
    }, [session?.user.id, fileToUpload, onUploadSuccess]);
    
    const handleCancel = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFileToUpload(null);
        setPreviewUrl(null);
        setError(null);
    };

    const displayUrl = previewUrl || currentAvatarUrl;

    return (
        <div className="space-y-3">
            <input
                type="file"
                ref={fileInputRef}
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || uploading}
            />

            <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {displayUrl ? (
                        <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-12 h-12 text-gray-500" />
                    )}
                </div>

                <div className="flex flex-col space-y-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                        <Upload className="w-4 h-4 mr-2" /> {previewUrl ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </Button>
                    
                    {previewUrl && (
                        <p className="text-xs text-gray-500">Nova imagem selecionada. Clique em Salvar para confirmar.</p>
                    )}
                </div>
            </div>
            
            {error && (
                <div className="flex items-center text-red-600 text-sm p-2 bg-red-50 rounded-md">
                    <XCircle className="w-4 h-4 mr-2" /> {error}
                </div>
            )}

            {previewUrl && (
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading || disabled}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar Nova Foto'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploading || disabled}
                        className="text-gray-700 border-gray-300 hover:bg-gray-100"
                    >
                        Cancelar
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AvatarUploader;