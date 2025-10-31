import React, { useState, useCallback, useEffect } from 'react';
import { Briefcase, Upload, Loader2, Save, Trash2, RefreshCw, Plus } from 'lucide-react';
import SpreadsheetEditor from '../components/SpreadsheetEditor';
import { Button } from '../components/ui/Button';
import TextInput from '../components/TextInput';
import Papa from 'papaparse';
import { useAgenciamentoData, Planilha } from '../hooks/useAgenciamentoData';

const defaultHeaders = ['ID', 'Endereço', 'Bairro', 'Tipo', 'Valor Venda', 'Valor Locação', 'Status', 'Proprietário'];
const TARGET_PLANILHA_NAME = 'imoveis_extraidos';

const AgenciamentoPage: React.FC = () => {
    const { planilhas, isLoading, error, savePlanilha, deletePlanilha, fetchPlanilhas } = useAgenciamentoData();
    
    const [data, setData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>(defaultHeaders);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    
    const [planilhaName, setPlanilhaName] = useState('Nova Planilha');
    const [currentPlanilhaId, setCurrentPlanilhaId] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Efeito para carregar a planilha alvo ou inicializar com dados vazios
    useEffect(() => {
        if (!isLoading && planilhas.length > 0) {
            const targetPlanilha = planilhas.find(p => p.nome.toLowerCase() === TARGET_PLANILHA_NAME);
            
            if (targetPlanilha) {
                handleLoad(targetPlanilha);
            } else if (currentPlanilhaId === undefined) {
                // Se não encontrou a alvo e não há nenhuma carregada, inicializa a nova
                handleNewPlanilha();
            }
        } else if (!isLoading && planilhas.length === 0 && currentPlanilhaId === undefined) {
             // Se não há planilhas salvas, inicializa a nova
             handleNewPlanilha();
        }
    }, [isLoading, planilhas]); // Depende de isLoading e planilhas

    // 2. Garante que sempre haja pelo menos uma linha vazia se os dados estiverem vazios
    useEffect(() => {
        if (data.length === 0 && headers.length > 0) {
            setData([Array(headers.length).fill('')]);
        }
    }, [data.length, headers.length]);

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
            header: false,
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
                
                const newHeaders = rawData[0];
                const newData = rawData.slice(1);
                
                setHeaders(newHeaders);
                setData(newData.length > 0 ? newData : [Array(newHeaders.length).fill('')]);
                setPlanilhaName(file.name.replace('.csv', ''));
                setCurrentPlanilhaId(undefined); // Novo upload = nova planilha
            },
            error: (error) => {
                setIsUploading(false);
                setUploadError(`Erro de leitura: ${error.message}`);
            }
        });
    };
    
    const handleSave = async (isNew: boolean) => {
        if (!planilhaName.trim()) {
            alert('O nome da planilha é obrigatório.');
            return;
        }
        
        setIsSaving(true);
        const idToSave = isNew ? undefined : currentPlanilhaId;
        
        const { success, id } = await savePlanilha(planilhaName, headers, data, idToSave);
        
        if (success) {
            alert(`Planilha "${planilhaName}" salva com sucesso!`);
            setCurrentPlanilhaId(id);
        } else {
            alert('Falha ao salvar a planilha.');
        }
        setIsSaving(false);
    };
    
    const handleLoad = (planilha: Planilha) => {
        setPlanilhaName(planilha.nome);
        setHeaders(planilha.headers);
        setData(planilha.data);
        setCurrentPlanilhaId(planilha.id);
    };
    
    const handleDelete = async (id: string, nome: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a planilha "${nome}"?`)) {
            const success = await deletePlanilha(id);
            if (success) {
                alert('Planilha excluída.');
                if (currentPlanilhaId === id) {
                    // Resetar para o estado inicial
                    handleNewPlanilha();
                }
            } else {
                alert('Falha ao excluir a planilha.');
            }
        }
    };
    
    const handleNewPlanilha = () => {
        setPlanilhaName('Nova Planilha');
        setHeaders(defaultHeaders);
        setData([Array(defaultHeaders.length).fill('')]);
        setCurrentPlanilhaId(undefined);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Agenciamento
            </h1>
            <p className="text-lg text-light-text mb-8">
                Edite e gerencie a lista de imóveis extraídos ou captados.
            </p>
            
            {/* Seção de Gerenciamento de Planilhas */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200 space-y-4">
                <h2 className="text-xl font-semibold text-dark-text border-b pb-2">Gerenciamento de Dados</h2>
                
                <TextInput 
                    label="Nome da Planilha"
                    id="planilhaName"
                    value={planilhaName}
                    onChange={(e) => setPlanilhaName(e.target.value)}
                    placeholder="Ex: Imóveis Extraídos 2024"
                />
                
                <div className="flex space-x-3">
                    <Button 
                        onClick={() => handleSave(currentPlanilhaId === undefined)}
                        disabled={isSaving || !planilhaName.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {currentPlanilhaId ? 'Atualizar Planilha' : 'Salvar Nova Planilha'}
                    </Button>
                    <Button 
                        onClick={handleNewPlanilha}
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nova Planilha
                    </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-dark-text mb-2">Importar CSV</h3>
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
                </div>
            </div>
            
            {/* Lista de Planilhas Salvas */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold text-dark-text mb-3 flex justify-between items-center">
                    Planilhas Salvas ({planilhas.length})
                    <Button onClick={fetchPlanilhas} variant="outline" size="sm" disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </h2>
                {isLoading ? (
                    <p className="text-sm text-gray-500">Carregando...</p>
                ) : (
                    <div className="space-y-2">
                        {planilhas.map(p => (
                            <div key={p.id} className={`flex justify-between items-center p-2 rounded-md transition-colors ${currentPlanilhaId === p.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'}`}>
                                <button onClick={() => handleLoad(p)} className="text-left text-blue-600 hover:underline font-medium flex-1 min-w-0 truncate pr-2">
                                    {p.nome} {currentPlanilhaId === p.id && '(Atual)'}
                                </button>
                                <div className="flex space-x-2 items-center">
                                    <span className="text-xs text-gray-500 hidden sm:block">Atualizado: {new Date(p.updated_at).toLocaleDateString('pt-BR')}</span>
                                    <Button onClick={() => handleDelete(p.id, p.nome)} size="sm" variant="outline" className="text-red-500 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {planilhas.length === 0 && <p className="text-sm text-gray-500">Nenhuma planilha salva.</p>}
                    </div>
                )}
            </div>

            {/* Editor de Planilha */}
            <SpreadsheetEditor 
                title={`Editor: ${planilhaName}`}
                headers={headers}
                data={data}
                onDataChange={handleDataChange}
            />
        </div>
    );
};

export default AgenciamentoPage;