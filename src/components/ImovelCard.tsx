import React from 'react';
import { Bed, Bath, Home, Maximize2, ChevronRight, Image, RefreshCw, Info } from 'lucide-react';

interface Imovel {
    id: number;
    code: string;
    address: string;
    neighborhood: string;
    city: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    price: number;
    condoFee: number;
    iptu: number;
    status: 'Venda' | 'Aluguel';
    isAvailable: boolean;
    imageUrl: string;
}

interface ImovelCardProps {
    imovel: Imovel;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel }) => {
    const statusColor = imovel.status === 'Venda' ? 'text-red-600' : 'text-blue-600';
    const statusBg = imovel.status === 'Venda' ? 'bg-red-50' : 'bg-blue-50';

    return (
        <div className="flex border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 mb-4">
            <div className="flex-shrink-0 w-40 h-40 relative">
                <img 
                    src={imovel.imageUrl} 
                    alt={`Imagem do Imóvel ${imovel.code}`} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-tr-lg font-semibold">
                    {imovel.code}
                </div>
                {!imovel.isAvailable && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <p className="text-white font-bold text-sm rotate-[-15deg]">Indisponível</p>
                    </div>
                )}
            </div>
            
            <div className="flex-1 p-3 flex justify-between">
                {/* Detalhes do Imóvel */}
                <div className="flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-semibold text-dark-text truncate">{imovel.address}</p>
                        <p className="text-xs text-light-text">{imovel.type}</p>
                        <p className="text-xs font-medium text-blue-700">{imovel.neighborhood} - {imovel.city}</p>
                    </div>
                    
                    {/* KPIs */}
                    <div className="flex space-x-4 text-light-text mt-2">
                        <div className="flex items-center text-xs" title="Quartos"><Bed className="w-3 h-3 mr-1" /> {imovel.bedrooms}</div>
                        <div className="flex items-center text-xs" title="Banheiros"><Bath className="w-3 h-3 mr-1" /> {imovel.bathrooms}</div>
                        <div className="flex items-center text-xs" title="Área Privativa"><Maximize2 className="w-3 h-3 mr-1" /> {imovel.area} m²</div>
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
                        <p className={`text-xs font-semibold ${statusColor}`}>{imovel.status}</p>
                        <p className="text-lg font-bold text-dark-text">{formatCurrency(imovel.price)}</p>
                        {imovel.condoFee > 0 && <p className="text-xs text-light-text">Condomínio: {formatCurrency(imovel.condoFee)}</p>}
                        {imovel.iptu > 0 && <p className="text-xs text-light-text">IPTU (anual): {formatCurrency(imovel.iptu)}</p>}
                        <button className="text-blue-600 hover:text-blue-800 text-sm mt-1 flex items-center">
                            Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImovelCard;