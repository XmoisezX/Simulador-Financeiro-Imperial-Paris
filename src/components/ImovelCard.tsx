import React from 'react';
import { Bed, Bath, Car, Maximize2, ChevronRight, Image, RefreshCw, Info } from 'lucide-react';
import ImageCarousel from './ImageCarousel'; // Importando o carrossel
import { Link } from 'react-router-dom'; // Importando Link
import { Checkbox } from './ui/Checkbox'; // Importando Checkbox shadcn/ui

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
        iptu_periodo: 'Mensal' | 'Anual';
    };
    dados_localizacao: {
        cidade: string;
        estado: string;
    };
    dados_caracteristicas: {
        tipo_imovel: string;
        dormitorios: number;
        suites: number;
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
    isSelected: boolean; // Nova prop
    onSelect: (imovelId: string, isSelected: boolean) => void; // Nova prop
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onViewDetails, isSelected, onSelect }) => {
    
    const isVenda = imovel.dados_contrato.venda_ativo;
    const isLocacao = imovel.dados_contrato.locacao_ativo;
    
    const statusText = isVenda ? 'Venda' : (isLocacao ? 'Locação' : 'Indefinido');
    const isAvailable = (isVenda && imovel.dados_contrato.venda_disponibilidade === 'Disponível') || 
                        (isLocacao && imovel.dados_contrato.locacao_disponibilidade === 'Disponível');
    
    const price = isVenda ? imovel.dados_valores.valor_venda : imovel.dados_valores.valor_locacao;
    const type = imovel.dados_caracteristicas.tipo_imovel;
    
    const defaultImage = '/LOGO LARANJA.png';
    
    // Mídias visíveis (já vêm ordenadas do ImoveisPage.tsx)
    const mediaForCarousel = imovel.imagens_imovel
        .filter(m => m.url) // Garante que a URL existe
        .map(m => ({ url: m.url, rotation: m.rotation }));
    
    // Dados de características
    const { dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2 } = imovel.dados_caracteristicas;
    
    // Formatação do IPTU
    const iptuValue = imovel.dados_valores.valor_iptu;
    const iptuPeriodo = imovel.dados_valores.iptu_periodo === 'Anual' ? '(anual)' : '(mensal)';

    return (
        <div className={`relative overflow-hidden rounded-xl transition-transform duration-200 ${isSelected ? 'ring-2 ring-blue-300' : ''}`}>
            <div className={`flex items-stretch border ${isSelected ? 'border-blue-100' : 'border-gray-200'} bg-white shadow-sm hover:shadow-lg transform hover:-translate-y-0.5`}>
                {/* Borda lateral acentuada */}
                <div className={`w-1 ${isAvailable ? 'bg-green-500' : 'bg-gray-200'}`} />

                {/* Conteúdo do card */}
                <div className="flex w-full">
                    {/* 1. Imagem / Carrossel */}
                    <div className="flex-shrink-0 w-56 h-36 relative bg-gray-100 m-4 rounded-md overflow-hidden">
                        <ImageCarousel 
                            media={mediaForCarousel}
                            defaultImageUrl={defaultImage}
                            altText={`Imóvel ${imovel.codigo}`}
                        />
                        {/* código pequeno no canto */}
                        <div className="absolute left-2 bottom-2 bg-black bg-opacity-70 text-white text-[11px] px-2 py-0.5 rounded-md">
                            {imovel.codigo}
                        </div>
                    </div>

                    {/* 2. Conteúdo (Endereço, características) */}
                    <div className="flex-1 py-4 pr-6 flex flex-col justify-between">
                        <div>
                            <p className="text-sm text-slate-500">{type}</p>
                            <h3 className="text-lg font-semibold text-dark-text leading-tight">{imovel.logradouro}, <span className="font-bold">{imovel.numero}</span></h3>
                            <p className="text-sm text-slate-500 mt-1">{imovel.bairro}</p>

                            <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Bed className="w-4 h-4 text-gray-400" />
                                    <span>{dormitorios} qts{ suites ? ` • ${suites} suítes` : '' }</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bath className="w-4 h-4 text-gray-400" />
                                    <span>{banheiros} banh.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Car className="w-4 h-4 text-gray-400" />
                                    <span>{vagas_garagem} vagas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Maximize2 className="w-4 h-4 text-gray-400" />
                                    <span>{area_privativa_m2} m²</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Ações, preço e status */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                                <Checkbox 
                                    id={`select-${imovel.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => onSelect(imovel.id, checked as boolean)}
                                    className="w-5 h-5 text-blue-600 border-gray-400"
                                />
                                <div className="text-xs text-slate-500 flex items-center gap-3">
                                    <button title="Mídias" className="flex items-center gap-1 text-slate-500 hover:text-blue-600"><Image className="w-4 h-4" /> <span className="hidden md:inline">Mídias</span></button>
                                    <button title="Atualizar" className="flex items-center gap-1 text-slate-500 hover:text-blue-600"><RefreshCw className="w-4 h-4" /> <span className="hidden md:inline">Atualizar</span></button>
                                    <button title="Info" className="flex items-center gap-1 text-slate-500 hover:text-blue-600"><Info className="w-4 h-4" /> <span className="hidden md:inline">Info</span></button>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500"> {statusText} </p>
                                    <p className="text-xl font-bold text-primary-orange">{formatCurrency(price)}</p>
                                </div>

                                <button 
                                    onClick={() => onViewDetails(imovel.id)}
                                    className="ml-2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                    title="Ver detalhes"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImovelCard;