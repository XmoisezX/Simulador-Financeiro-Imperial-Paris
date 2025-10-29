import React from 'react';
import { Bed, Bath, Home, Maximize2, ChevronRight, Image, RefreshCw, Info } from 'lucide-react';
import ImageCarousel from './ImageCarousel'; // Importando o carrossel

// Interface baseada na estrutura de dados do Supabase (tabela imoveis + primeira midia)
interface Imovel {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    status_aprovacao: 'Aprovado' | 'Não aprovado' | 'Aguardando';
    
    // Dados JSONB
    dados_contrato: {
        venda_ativo: boolean;
        locacao_ativo: boolean;
        venda_disponibilidade: 'Disponível' | 'Indisponível';
        locacao_disponibilidade: 'Disponível' | 'Indisponível';
    };
    dados_valores: {
        valor_venda: number;
        valor_locacao: number;
        valor_condominio: number;
        valor_iptu: number;
    };
    dados_localizacao: {
        cidade: string;
        estado: string;
    };
    dados_caracteristicas: {
        tipo_imovel: string;
        dormitorios: number;
        banheiros: number;
        vagas_garagem: number;
        area_privativa_m2: number; // NOVO CAMPO
    };
    
    // Mídia (lista completa de mídias)
    imagens_imovel: { id: string, url: string, rotation: number, ordem: number }[]; // Adicionado 'id' e 'ordem'
}

interface ImovelCardProps {
    imovel: Imovel;
    onViewDetails: (imovelId: string) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onViewDetails }) => {
    
    const isVenda = imovel.dados_contrato.venda_ativo;
    const isLocacao = imovel.dados_contrato.locacao_ativo;
    
    const statusText = isVenda ? 'Venda' : (isLocacao ? 'Locação' : 'Indefinido');
    const statusColor = isVenda ? 'text-red-600' : 'text-blue-600';
    
    const isAvailable = (isVenda && imovel.dados_contrato.venda_disponibilidade === 'Disponível') || 
                        (isLocacao && imovel.dados_contrato.locacao_disponibilidade === 'Disponível');
    
    const price = isVenda ? imovel.dados_valores.valor_venda : imovel.dados_valores.valor_locacao;
    const type = imovel.dados_caracteristicas.tipo_imovel;
    
    const defaultImage = '/LOGO LARANJA.png';
    
    // Mídias visíveis (assumindo que todas as mídias retornadas são visíveis para o CRM)
    // O ImageCarousel já espera um array de { url, rotation }
    const mediaForCarousel = imovel.imagens_imovel
        .filter(m => m.url) // Garante que a URL existe
        .sort((a, b) => a.ordem - b.ordem) // Ordena pela ordem
        .map(m => ({ url: m.url, rotation: m.rotation }));

    return (
        <div className="flex border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4 relative">
            <div className="flex-shrink-0 w-40 h-40 relative">
                <ImageCarousel 
                    media={mediaForCarousel}
                    defaultImageUrl={defaultImage}
                    altText={`Imóvel ${imovel.codigo}`}
                />
                <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg font-semibold z-10">
                    {imovel.codigo}
                </div>
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                        <p className="text-white font-bold text-sm rotate-[-15deg]">Indisponível</p>
                    </div>
                )}
            </div>
            
            <div className="flex-1 p-3 flex justify-between">
                {/* Detalhes do Imóvel */}
                <div className="flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-semibold text-dark-text truncate">{imovel.logradouro}, {imovel.numero}</p>
                        <p className="text-xs text-light-text">{type}</p>
                        <p className="text-xs font-medium text-blue-700">{imovel.bairro} - {imovel.dados_localizacao.cidade} - {imovel.dados_localizacao.estado}</p>
                    </div>
                    
                    {/* KPIs */}
                    <div className="flex space-x-4 text-light-text mt-2">
                        <div className="flex items-center text-xs" title="Quartos"><Bed className="w-3 h-3 mr-1" /> {imovel.dados_caracteristicas.dormitorios}</div>
                        <div className="flex items-center text-xs" title="Banheiros"><Bath className="w-3 h-3 mr-1" /> {imovel.dados_caracteristicas.banheiros}</div>
                        <div className="flex items-center text-xs" title="Vagas de Garagem"><Home className="w-3 h-3 mr-1" /> {imovel.dados_caracteristicas.vagas_garagem}</div>
                        <div className="flex items-center text-xs" title="Área Privativa"><Maximize2 className="w-3 h-3 mr-1" /> {imovel.dados_caracteristicas.area_privativa_m2} m²</div>
                    </div>
                </div>
                
                {/* Preço e Ações */}
                <div className="flex flex-col items-end justify-between">
                    <div className="flex space-x-3 text-gray-500 text-xs font-medium">
                        <button title="Mídias" className="hover:text-primary-orange"><Image className="w-4 h-4" /></button>
                        <button title="Atualizar" className="hover:text-primary-orange"><RefreshCw className="w-4 h-4" /></button>
                        <button title="Informações" className="hover:text-primary-orange"><Info className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="text-right">
                        <p className={`text-xs font-semibold ${statusColor}`}>{statusText}</p>
                        <p className="text-lg font-bold text-dark-text">{formatCurrency(price)}</p>
                        {imovel.dados_valores.valor_condominio > 0 && <p className="text-xs text-light-text">Condomínio: {formatCurrency(imovel.dados_valores.valor_condominio)}</p>}
                        {imovel.dados_valores.valor_iptu > 0 && <p className="text-xs text-light-text">IPTU: {formatCurrency(imovel.dados_valores.valor_iptu)}</p>}
                        
                        {/* Botão de Detalhes */}
                        <button 
                            onClick={() => onViewDetails(imovel.id)}
                            className="text-blue-600 hover:text-primary-orange text-sm mt-1 flex items-center transition-colors group"
                        >
                            Detalhes <ChevronRight className="w-4 h-4 ml-1 group-hover:text-primary-orange transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImovelCard;