import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Download, Loader2, Image, X } from 'lucide-react';
import ImagePreviewCard from '../components/ImagePreviewCard';
import { useAuth } from '../contexts/AuthContext';

// URLs for the Edge Functions
const PREVIEW_FUNCTION_URL = "https://pqievwbfrbiqhvdyalrh.supabase.co/functions/v1/image-preview";
const DOWNLOAD_FUNCTION_URL = "https://pqievwbfrbiqhvdyalrh.supabase.co/functions/v1/remove-watermark";

interface UploadedFile {
    file: File;
    id: number;
}

const WatermarkRemoverPage: React.FC = () => {
    const { session } = useAuth();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const nextFileId = useMemo(() => uploadedFiles.length > 0 ? Math.max(...uploadedFiles.map(f => f.id)) + 1 : 1, [uploadedFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: UploadedFile[] = Array.from(e.target.files).map((file, index) => ({
                file,
                id: nextFileId + index,
            }));
            setUploadedFiles(prev => [...prev, ...newFiles]);
            setError(null);
            setPreviewUrl(null);
        }
    };

    const handleRemoveFile = (id: number) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
        if (uploadedFiles.length === 1) {
            setPreviewUrl(null);
        }
    };

    const handleGeneratePreview = useCallback(async () => {
        if (uploadedFiles.length === 0) {
            setError("Por favor, selecione uma imagem para o preview.");
            return;
        }
        if (uploadedFiles.length > 1) {
            setError("O preview só pode ser gerado para uma única imagem.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPreviewUrl(null);

        const fileToPreview = uploadedFiles[0].file;
        const formData = new FormData();
        // Use the specific key 'file' that the new Edge Function expects
        formData.append('file', fileToPreview);

        try {
            const response = await fetch(PREVIEW_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `Erro no servidor: ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorMessage = errorJson.error || errorMessage;
                } catch {
                    // If the response is not JSON, use the text body
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage);
            }

            // Create a Blob URL for the preview
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);

        } catch (err) {
            console.error("Erro ao gerar preview:", err);
            setError(`Falha ao processar o preview: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    }, [uploadedFiles, session]);

    const handleConvertAndDownload = useCallback(async () => {
        if (uploadedFiles.length === 0) {
            setError("Por favor, selecione pelo menos um arquivo para converter.");
            return;
        }

        setIsConverting(true);
        setError(null);

        const formData = new FormData();
        uploadedFiles.forEach(item => {
            // The download function can iterate through all values, so the key is less critical
            formData.append('files', item.file, item.file.name);
        });

        try {
            const response = await fetch(DOWNLOAD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = `Erro no servidor: ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorMessage = errorJson.error || errorMessage;
                } catch {
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage);
            }

            // Download the ZIP file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'imagens_sem_marca_d_agua.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            alert(`Sucesso! ${uploadedFiles.length} imagem(ns) processada(s) e baixada(s) em um arquivo ZIP.`);
            setUploadedFiles([]); // Clear the list after download
            setPreviewUrl(null);

        } catch (err) {
            console.error("Erro ao converter e baixar:", err);
            setError(`Falha ao processar e baixar o arquivo ZIP: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        } finally {
            setIsConverting(false);
        }
    }, [uploadedFiles, session]);

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8">
            <h1 className="text-3xl font-bold text-dark-text">Ferramenta de Remoção de Marca D'água</h1>
            <p className="text-lg text-light-text max-w-4xl">
                Faça o upload de suas fotos de imóveis para remover marcas d'água automaticamente. Você pode gerar um preview de uma imagem ou converter várias de uma vez para download em ZIP.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload and Actions Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                        <h2 className="text-xl font-semibold text-primary-orange">1. Selecione os Arquivos</h2>
                        
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Upload className="w-6 h-6 text-primary-orange" />
                            <p className="mt-2 text-sm text-gray-600">Clique para selecionar ou arraste e solte</p>
                            <p className="text-xs text-gray-500">JPG, PNG (Máx. 5MB por arquivo)</p>
                            <input id="file-upload" type="file" multiple accept="image/jpeg,image/png" className="hidden" onChange={handleFileChange} />
                        </label>

                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-white">
                                <h3 className="text-sm font-medium text-dark-text">Arquivos Selecionados ({uploadedFiles.length})</h3>
                                {uploadedFiles.map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md border border-gray-100">
                                        <div className="flex items-center min-w-0">
                                            <Image className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                                            <span className="truncate text-gray-700">{item.file.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveFile(item.id)} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                        <h2 className="text-xl font-semibold text-primary-orange">2. Ações</h2>
                        
                        {error && <p className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">{error}</p>}

                        <button
                            onClick={handleGeneratePreview}
                            disabled={isLoading || isConverting || uploadedFiles.length !== 1}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <React.Fragment>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando Preview...
                                </React.Fragment>
                            ) : (
                                'Gerar Preview (1 Imagem)'
                            )}
                        </button>

                        <button
                            onClick={handleConvertAndDownload}
                            disabled={isConverting || isLoading || uploadedFiles.length === 0}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-orange rounded-md hover:bg-secondary-orange transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isConverting ? (
                                <React.Fragment>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Convertendo e Gerando ZIP...
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <Download className="w-4 h-4 mr-2" /> Converter e Baixar ZIP ({uploadedFiles.length})
                                </React.Fragment>
                            )}
                        </button>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-2">
                    <ImagePreviewCard previewUrl={previewUrl} isLoading={isLoading} error={error} />
                </div>
            </div>
        </div>
    );
};

export default WatermarkRemoverPage;