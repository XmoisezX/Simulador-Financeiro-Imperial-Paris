import React from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface ImagePreviewCardProps {
    previewUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const ImagePreviewCard: React.FC<ImagePreviewCardProps> = ({ previewUrl, isLoading, error }) => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200 h-full min-h-[300px] flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Preview da Imagem Processada</h3>
            
            {isLoading && (
                <div className="flex flex-col items-center text-primary-orange">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="mt-2 text-sm">Processando preview...</p>
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center text-red-600">
                    <ImageOff className="h-8 w-8" />
                    <p className="mt-2 text-sm text-center">Erro ao carregar preview: {error}</p>
                </div>
            )}

            {previewUrl && !isLoading && !error && (
                <div className="w-full h-full max-h-[500px] overflow-hidden flex justify-center items-center">
                    <img 
                        src={previewUrl} 
                        alt="Preview sem marca d'água" 
                        className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                    />
                </div>
            )}

            {!previewUrl && !isLoading && !error && (
                <p className="text-light-text text-center">Faça o upload de uma imagem e clique em "Gerar Preview" para ver o resultado.</p>
            )}
        </div>
    );
};

export default ImagePreviewCard;