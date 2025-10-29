import React from 'react';
import { Plus, RefreshCw, List, Map } from 'lucide-react';
import { Link } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import ImovelCard from '../components/ImovelCard';
import { Button } from '../components/ui/Button';

// Mock Data
const mockImoveis = [
    { id: 1, code: '51704', address: 'Rua Coronel Alberto Rosa, 362', neighborhood: 'Centro', city: 'Pelotas - RS', type: 'Apartamento', bedrooms: 3, bathrooms: 2, area: 97, price: 245000, condoFee: 245, iptu: 80, status: 'Venda', isAvailable: false, imageUrl: '/LOGO LARANJA.png' },
    { id: 2, code: '40242', address: 'Rua Três de Maio, 1379', neighborhood: 'Centro', city: 'Pelotas - RS', type: 'Apartamento, 401', bedrooms: 3, bathrooms: 2, area: 84, price: 230000, condoFee: 210, iptu: 0, status: 'Venda', isAvailable: true, imageUrl: '/LOGO LARANJA.png' },
    { id: 3, code: '58559', address: 'Rua Leonardo Colares, 360', neighborhood: 'Centro', city: 'Pelotas - RS', type: 'Apartamento, 41', bedrooms: 3, bathrooms: 1, area: 71.97, price: 165000, condoFee: 250, iptu: 22, status: 'Venda', isAvailable: true, imageUrl: '/LOGO LARANJA.png' },
    { id: 4, code: '27778', address: 'Avenida São Francisco de Paula, 3691', neighborhood: 'Areal', city: 'Pelotas - RS', type: 'Apartamento', bedrooms: 3, bathrooms: 2, area: 90, price: 485000, condoFee: 0, iptu: 0, status: 'Venda', isAvailable: true, imageUrl: '/LOGO LARANJA.png' },
    { id: 5, code: '7244', address: 'Rua Andrade Neves, 3446', neighborhood: 'Centro', city: 'Pelotas - RS', type: 'Apartamento, 3º andar', bedrooms: 3, bathrooms: 2, area: 90, price: 300000, condoFee: 0, iptu: 0, status: 'Venda', isAvailable: true, imageUrl: '/LOGO LARANJA.png' },
];

const ImoveisPage: React.FC = () => {
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
                        <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            <RefreshCw className="w-4 h-4 mr-2" /> Reajustar valores
                        </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-500">
                        <button title="Visualização em Lista" className="p-2 border rounded-md bg-gray-200 text-dark-text"><List className="w-5 h-5" /></button>
                        <button title="Visualização em Mapa" className="p-2 border rounded-md hover:bg-gray-100"><Map className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Breadcrumb e Contagem */}
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-xl font-semibold text-dark-text">Imóveis ({mockImoveis.length})</h2>
                    <div className="flex space-x-2">
                        {/* Mock de filtros ativos */}
                        <span className="flex items-center bg-gray-200 text-sm px-3 py-1 rounded-full">Apartamento</span>
                        <span className="flex items-center bg-gray-200 text-sm px-3 py-1 rounded-full">3 dormitórios</span>
                    </div>
                </div>

                {/* Lista de Imóveis */}
                <div className="space-y-4">
                    {mockImoveis.map(imovel => (
                        <ImovelCard key={imovel.id} imovel={imovel} />
                    ))}
                </div>
                
                <div className="text-center mt-8 text-light-text text-sm">
                    Fim da lista
                </div>
            </div>
        </div>
    );
};

export default ImoveisPage;