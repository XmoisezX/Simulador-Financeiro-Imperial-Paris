import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, List, Map, Loader2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import ImovelCard from '../components/ImovelCard';
import ImovelDetailsModal from '../components/ImovelDetailsModal';
import ActionsDropdown from '../components/ActionsDropdown'; // Importando o novo dropdown
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox'; // Importando Checkbox
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { ImovelInput } from '../../types';

// Interface para o Imóvel (deve ser a mesma usada no ImovelCard)
interface Imovel {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    status_aprovacao: 'Aprovado' | 'Não aprovado' | 'Aguardando';
    dados_contrato: any;
    dados_valores: any;
    dados_localizacao: any;
    dados_caracteristicas: any;
    imagens_imovel: { id: string, url: string, rotation: number, ordem: number }[];
}

// Interface para os detalhes completos (para o modal)
interface ImovelDetails extends ImovelInput {
    id: string;
    created_at: string;
    imagens_imovel: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[];
}

const ImoveisPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- Estado de Seleção ---
    const [selectedImovelIds, setSelectedImovelIds] = useState<string[]>([]);
    
    // Estado do Modal de Detalhes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImovelDetails, setSelectedImovelDetails] = useState<ImovelDetails | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const fetchImoveis = useCallback(async () => {
        if (!session) return;

        setIsLoading(true);
        setError(null);
        setSelectedImovelIds([]); // Limpa a seleção ao recarregar

        // 1. Buscar Imóveis (dados resumidos + todas as mídias necessárias para o carrossel)
        const { data: imoveisData, error: imovelError } = await supabase
            .from('imoveis')
            .select(`
                id, codigo, bairro, logradouro, numero, status_aprovacao,
                dados_contrato, dados_valores, dados_localizacao, dados_caracteristicas,
                imagens_imovel(id, url, rotation, ordem)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (imovelError) {
            console.error('Erro ao buscar imóveis:', imovelError);
            setError('Não foi possível carregar a lista de imóveis.');
            setIsLoading(false);
            return;
        }
        
        // 2. Mapear e formatar os dados
        const formattedImoveis: Imovel[] = imoveisData.map((imovel: any) => {
            
            // Filtra e ordena as imagens para o carrossel, priorizando ordem 0
            const mediaForCard = imovel.imagens_imovel
                .sort((a: any, b: any) => a.ordem - b.ordem) // Ordena pela ordem crescente (0 será o primeiro)
                .map((m: any) => ({ id: m.id, url: m.url, rotation: m.rotation, ordem: m.ordem }));
            
            return {
                id: imovel.id,
                codigo: imovel.codigo,
                bairro: imovel.bairro,
                logradouro: imovel.logradouro,
                numero: imovel.numero,
                status_aprovacao: imovel.status_aprovacao,
                dados_contrato: imovel.dados_contrato,
                dados_valores: imovel.dados_valores,
                dados_localizacao: imovel.dados_localizacao,
                dados_caracteristicas: imovel.dados_caracteristicas,
                imagens_imovel: mediaForCard, // Passa a lista de mídias ordenadas
            };
        });

        setImoveis(formattedImoveis);
        setIsLoading(false);
    }, [session]);
    
    const handleViewDetails = useCallback(async (imovelId: string) => {
        if (!session) return;
        
        setIsDetailsLoading(true);
        setSelectedImovelDetails(null);
        
        // Buscar todos os campos do imóvel e todas as mídias
        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                *,
                imagens_imovel(id, url, legend, is_visible, rotation, ordem)
            `)
            .eq('id', imovelId)
            .eq('user_id', session.user.id)
            .single();
            
        setIsDetailsLoading(false);

        if (error) {
            console.error('Erro ao buscar detalhes do imóvel:', error);
            alert('Não foi possível carregar os detalhes do imóvel.');
            return;
        }
        
        // Ordenar as imagens antes de passar para o modal
        if (data.imagens_imovel) {
            data.imagens_imovel.sort((a: any, b: any) => a.ordem - b.ordem);
        }
        
        setSelectedImovelDetails(data as ImovelDetails);
        setIsModalOpen(true);
        
    }, [session]);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);
    
    // --- Lógica de Seleção ---
    const handleSelectImovel = useCallback((imovelId: string, isSelected: boolean) => {
        setSelectedImovelIds(prev => {
            if (isSelected) {
                return [...prev, imovelId];
            } else {
                return prev.filter(id => id !== imovelId);
            }
        });
    }, []);
    
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedImovelIds(imoveis.map(imovel => imovel.id));
        } else {
            setSelectedImovelIds([]);
        }
    }, [imoveis]);
    
    const isAllSelected = imoveis.length > 0 && selectedImovelIds.length === imoveis.length;
    const isIndeterminate = selectedImovelIds.length > 0 && selectedImovelIds.length < imoveis.length;
    
    // --- Lógica de Ações em Massa ---
    const handleMassAction = async (action: string) => {
        if (selectedImovelIds.length === 0) return;
        
        switch (action) {
            case 'edit':
                if (selectedImovelIds.length === 1) {
                    navigate(`/crm/imoveis/${selectedImovelIds[0]}`);
                } else {
                    alert(`Ação de Edição Múltipla (Mock) para ${selectedImovelIds.length} imóveis.`);
                }
                break;
            case 'send_portals':
                alert(`Ação: Enviar para portais (Mock) para ${selectedImovelIds.length} imóveis.`);
                break;
            case 'print':
                alert(`Ação: Imprimir (Mock) para ${selectedImovelIds.length} imóveis.`);
                break;
            case 'withdraw_keys':
                alert(`Ação: Retirar chaves (Mock) para ${selectedImovelIds.length} imóveis.`);
                break;
            case 'export':
                alert(`Ação: Exportar (Mock) para ${selectedImovelIds.length} imóveis.`);
                break;
            case 'delete':
                if (window.confirm(`Tem certeza que deseja excluir ${selectedImovelIds.length} imóvel(is)? Esta ação é irreversível.`)) {
                    setIsLoading(true);
                    let successCount = 0;
                    let errorCount = 0;
                    
                    // 1. Excluir metadados das imagens (para evitar órfãos)
                    const { error: mediaError } = await supabase
                        .from('imagens_imovel')
                        .delete()
                        .in('imovel_id', selectedImovelIds);
                        
                    if (mediaError) {
                        console.error('Erro ao excluir mídias:', mediaError);
                        // Continuamos, mas alertamos sobre o erro de mídias
                    }
                    
                    // 2. Excluir os imóveis principais
                    const { error: imovelDeleteError, count } = await supabase
                        .from('imoveis')
                        .delete()
                        .in('id', selectedImovelIds);
                        
                    if (imovelDeleteError) {
                        console.error('Erro ao excluir imóveis:', imovelDeleteError);
                        alert(`Erro ao excluir imóveis: ${imovelDeleteError.message}`);
                        errorCount = selectedImovelIds.length;
                    } else {
                        successCount = selectedImovelIds.length;
                    }
                    
                    if (successCount > 0) {
                        alert(`${successCount} imóvel(is) excluído(s) com sucesso.`);
                    } else if (errorCount > 0) {
                        alert(`Falha ao excluir ${errorCount} imóvel(is).`);
                    }
                    
                    // 3. Recarregar a lista e limpar a seleção
                    fetchImoveis();
                }
                break;
            default:
                console.warn(`Ação desconhecida: ${action}`);
        }
    };

    return (
        <div className="flex h-full min-h-[calc(100vh-150px)]">
            {/* Barra Lateral de Filtros */}
            <FilterSidebar />

            {/* Conteúdo Principal da Listagem */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                
                {/* Header de Ações */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-3">
                        <Link to="/crm/imoveis/novo">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Novo imóvel
                            </Button>
                        </Link>
                        <Button 
                            variant="outline" 
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={fetchImoveis}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                            {isLoading ? 'Atualizando...' : 'Atualizar Lista'}
                        </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-500">
                        <button title="Visualização em Lista" className="p-2 border rounded-md bg-gray-200 text-dark-text"><List className="w-5 h-5" /></button>
                        <button title="Visualização em Mapa" className="p-2 border rounded-md hover:bg-gray-100"><Map className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Barra de Seleção e Ações em Massa */}
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-dark-text">
                            <Checkbox 
                                id="select-all" 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                className="w-5 h-5 text-blue-600 border-gray-400"
                                indeterminate={isIndeterminate}
                            />
                            <span>Selecionar ({selectedImovelIds.length})</span>
                        </label>
                        
                        <ActionsDropdown 
                            onAction={handleMassAction}
                            disabled={selectedImovelIds.length === 0}
                            selectedCount={selectedImovelIds.length}
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <select className="p-2 border border-gray-300 rounded-md text-sm text-light-text">
                            <option>Data de atualização</option>
                            <option>Código</option>
                            <option>Valor</option>
                        </select>
                    </div>
                </div>

                {/* Lista de Imóveis */}
                {error && <div className="text-red-600 p-4 bg-red-50 rounded-md">{error}</div>}
                
                {isLoading || isDetailsLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                        <p className="text-gray-600">Carregando imóveis...</p>
                    </div>
                )}
                
                {!isLoading && imoveis.length === 0 && !error && (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-lg">Nenhum imóvel encontrado. Comece cadastrando um novo!</p>
                    </div>
                )}

                <div className="space-y-4">
                    {imoveis.map(imovel => (
                        <ImovelCard 
                            key={imovel.id} 
                            imovel={imovel} 
                            onViewDetails={handleViewDetails} 
                            isSelected={selectedImovelIds.includes(imovel.id)}
                            onSelect={handleSelectImovel}
                        />
                    ))}
                </div>
                
                <div className="text-center mt-8 text-light-text text-sm">
                    Fim da lista
                </div>
            </div>
            
            {/* Modal de Detalhes */}
            <ImovelDetailsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imovel={selectedImovelDetails}
            />
        </div>
    );
};

export default ImoveisPage;