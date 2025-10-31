import React, { useState, useCallback } from 'react';
import { Briefcase, Upload, Loader2, Save, Trash2, RefreshCw, Plus, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import TextInput from '../components/TextInput';
import Papa from 'papaparse';
import { useAgenciamentoData, Planilha } from '../hooks/useAgenciamentoData';
import { TARGET_PLANILHA_NAME, DEFAULT_AGENCIAMENTO_PLANILHA, DEFAULT_AGENCIAMENTO_HEADERS } from '../constants/agenciamento';
import { useNavigate } from 'react-router-dom';

const AgenciamentoPage: React.FC = () => {
    const { planilhas, isLoading, error, savePlanilha, deletePlanilha, fetchPlanilhas } = useAgenciamentoData();
    const navigate = useNavigate();
    
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
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
            header: false,
            skipEmptyLines: true,
            complete: async (results) => {
                setIsUploading(false);
                
                if (results.errors.length > 0) {
                    setUploadError(`Erro ao processar CSV: ${results.errors[0].message}`);
                    return;
                }
                
                const rawData = results.data as string[][];
                if (rawData.length === 0) {
                    setUploadError('O arquivo CSV está vazio.');
                    return;
                }
                
                const newHeaders = rawData[0];
                const newData = rawData.slice(1);
                const planilhaName = file.name.replace('.csv', '').trim() || 'Planilha Importada';
                
                // Salva a nova planilha importada
                const { success, id } = await savePlanilha(planilhaName, newHeaders, newData);
                
                if (success && id) {
                    alert(`Planilha "${planilhaName}" importada e salva com sucesso!`);
                    navigate(`/crm/agenciamento/${id}`);
                } else {
                    setUploadError('Falha ao salvar a planilha importada.');
                }
            },
            error: (error) => {
                setIsUploading(false);
                setUploadError(`Erro de leitura: ${error.message}`);
            }
        });
    };
    
    const handleCreateNew = async () => {
        const newPlanilhaName = `Nova Planilha ${new Date().toLocaleDateString('pt-BR')}`;
        
        // Salva uma planilha vazia com headers padrão
        const { success, id } = await savePlanilha(newPlanilhaName, DEFAULT_AGENCIAMENTO_HEADERS, []);
        
        if (success && id) {
            navigate(`/crm/agenciamento/${id}`);
        } else {
            alert('Falha ao criar nova planilha.');
        }
    };
    
    const handleDelete = async (id: string, nome: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a planilha "${nome}"?`)) {
            const success = await deletePlanilha(id);
            if (success) {
                alert('Planilha excluída.');
            } else {
                alert('Falha ao excluir a planilha.');
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Agenciamento
            </h1>
            <p className="text-lg text-light-text mb-8">
                Gerencie suas planilhas de imóveis extraídos e captados.
            </p>
            
            {/* Ações de Criação e Importação */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold text-dark-text border-b pb-2">Ações Rápidas</h2>
                
                <div className="flex flex-wrap gap-4">
                    <Button 
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Criar Nova Planilha
                    </Button>
                    
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                        />
                        <Button 
                            asChild
                            variant="outline"
                            className="text-primary-orange border-primary-orange hover:bg-orange-50 flex items-center"
                            disabled={isUploading}
                        >
                            <span>
                                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Importar CSV
                            </span>
                        </Button>
                    </label>
                </div>
                
                {uploadError && (
                    <div className="text-red-600 text-sm p-2 bg-red-50 rounded-md mt-2">{uploadError}</div>
                )}
            </div>
            
            {/* Lista de Planilhas Salvas */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold text-dark-text mb-3 flex justify-between items-center">
                    Planilhas Salvas ({planilhas.length})
                    <Button onClick={fetchPlanilhas} variant="outline" size="sm" disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </h2>
                
                {/* Link para a planilha fixa (imoveis_extraidos) */}
                <div className={`flex justify-between items-center p-2 rounded-md transition-colors bg-gray-100 border border-gray-300 mb-3`}>
                    <Link to={`/crm/agenciamento/${DEFAULT_AGENCIAMENTO_PLANILHA.id}`} className="text-left text-blue-600 hover:underline font-medium flex-1 min-w-0 truncate pr-2">
                        {TARGET_PLANILHA_NAME} (Padrão do Sistema)
                    </Link>
                    <span className="text-xs text-gray-500">Dados fixos</span>
                </div>

                {isLoading ? (
                    <p className="text-sm text-gray-500">Carregando...</p>
                ) : (
                    <div className="space-y-2">
                        {planilhas.map(p => (
                            <div key={p.id} className={`flex justify-between items-center p-2 rounded-md transition-colors hover:bg-gray-100`}>
                                <Link to={`/crm/agenciamento/${p.id}`} className="text-left text-blue-600 hover:underline font-medium flex-1 min-w-0 truncate pr-2 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-gray-500" /> {p.nome}
                                </Link>
                                <div className="flex space-x-2 items-center">
                                    <span className="text-xs text-gray-500 hidden sm:block">Atualizado: {new Date(p.updated_at).toLocaleDateString('pt-BR')}</span>
                                    <Button onClick={() => handleDelete(p.id, p.nome)} size="sm" variant="outline" className="text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {planilhas.length === 0 && <p className="text-sm text-gray-500">Nenhuma planilha salva no banco de dados.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgenciamentoPage;