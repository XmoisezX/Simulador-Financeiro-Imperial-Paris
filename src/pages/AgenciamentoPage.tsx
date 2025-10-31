import React, { useState, useCallback } from 'react';
import { Briefcase, Upload, Loader2 } from 'lucide-react';
import SpreadsheetEditor from '../components/SpreadsheetEditor';
import { Button } from '../components/ui/Button';
import Papa from 'papaparse';

const defaultHeaders = ['ID', 'Endereço', 'Bairro', 'Tipo', 'Valor Venda', 'Valor Locação', 'Status', 'Proprietário'];

const AgenciamentoPage: React.FC = () => {
    const [data, setData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>(defaultHeaders);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleDataChange = useCallback((newData: string[][]) => {
        setData(newData);
    }, []);
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setUploadError('Por favor, selecione um arquivo CSV.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        
        Papa.parse(file, {
            header: false, // Não assume que a primeira linha é cabeçalho automaticamente
            skipEmptyLines: true,
            complete: (results) => {
                setIsUploading(false);
                
                if (results.errors.length > 0) {
                    setUploadError(`Erro ao processar CSV: ${results.errors[0].message}`);
                    return;
                }
                
                const rawData = results.data as string[][];
                if (rawData.length === 0) {
                    setUploadError('O arquivo CSV está vazio.');
                    setData([]);
                    setHeaders(defaultHeaders);
                    return;
                }
                
                // Assume que a primeira linha é o cabeçalho
                const newHeaders = rawData[0];
                const newData = rawData.slice(1);
                
                setHeaders(newHeaders);
                setData(newData);
            },
            error: (error) => {
                setIsUploading(false);
                setUploadError(`Erro de leitura: ${error.message}`);
            }
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Agenciamento
            </h1>
            <p className="text-lg text-light-text mb-8">
                Edite e gerencie a lista de imóveis extraídos ou captados.
            </p>
            
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold text-dark-text mb-3">Importar Planilha</h2>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                />
                {isUploading && (
                    <div className="flex items-center mt-2 text-blue-600 text-sm">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando arquivo...
                    </div>
                )}
                {uploadError && (
                    <div className="text-red-600 text-sm p-2 bg-red-50 rounded-md mt-2">{uploadError}</div>
                )}
                <Button 
                    onClick={() => { setData([]); setHeaders(defaultHeaders); setUploadError(null); }}
                    variant="outline"
                    size="sm"
                    className="mt-3 text-gray-600 hover:bg-gray-100"
                >
                    Limpar Planilha
                </Button>
            </div>
            
            <SpreadsheetEditor 
                title="Dados da Planilha"
                headers={headers}
                data={data}
                onDataChange={handleDataChange}
            />
        </div>
    );
};

export default AgenciamentoPage;