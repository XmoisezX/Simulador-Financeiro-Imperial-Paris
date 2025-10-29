import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, List, Map, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import ImovelCard from '../components/ImovelCard';
import ImovelDetailsModal from '../components/ImovelDetailsModal'; // Importando o modal
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { ImovelInput } from '../../types'; // Importando ImovelInput para o modal

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
    imagens_imovel: { id: string, url: string, rotation: number, ordem: number }[]; // Alterado para lista completa com ID e ordem
}

// Interface para os detalhes completos (para o modal)
interface ImovelDetails extends ImovelInput {
    id: string;
    created_at: string;
    imagens_imovel: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[];
}

const ImoveisPage: React.FC = () => {
    const { session } = useAuth();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado do Modal de Detalhes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImovelDetails, setSelectedImovelDetails] = useState<ImovelDetails | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const fetchImoveis = useCallback(async () => {
        if (!session) return;

        setIsLoading(true);
        setError(null);

        // 1. Buscar Imóveis (dados resumidos + todas as mídias necessárias para o carrossel)
        // Usamos a sintaxe de foreign table para buscar as imagens e ordená-las
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
                imovel_media(id, url, legend, is_visible, rotation, ordem)
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

                {/* Breadcrumb e Contagem */}
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-semibold text-dark-text">Imóveis ({imoveis.length})</h2>
                    <div className="flex space-x-2">
                        {/* Mock de filtros ativos */}
                        <span className="flex items-center bg-gray-200 text-sm px-3 py-1 rounded-full">Apartamento</span>
                        <span className="flex items-center bg-gray-200 text-sm px-3 py-1 rounded-full">3 dormitórios</span>
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
                        <ImovelCard key={imovel.id} imovel={imovel} onViewDetails={handleViewDetails} />
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