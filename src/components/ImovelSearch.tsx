import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/Button';

const searchTabs = [
    { id: 'imoveis', label: 'Busca de Imóveis', color: 'bg-blue-600' },
    { id: 'cod', label: 'Busca Por Cód./Ref.', color: 'bg-[#1e3a8a]' },
    { id: 'condominio', label: 'Busca Edifício/Condomínio', color: 'bg-[#1e3a8a]' },
    { id: 'lugares', label: 'Busca Próximo a Lugares', color: 'bg-[#1e3a8a]' },
];

const ImovelSearch: React.FC = () => {
    const [activeTab, setActiveTab] = useState('imoveis');

    // Mock data for dropdowns
    const dropdownOptions = {
        operacao: ['Venda', 'Aluguel', 'Temporada'],
        cidades: ['Pelotas', 'Rio Grande', 'Capão do Leão'],
        tipos: ['Apartamento', 'Casa', 'Terreno', 'Comercial'],
        bairros: ['Centro', 'Laranjal', 'Areal', 'Fragata'],
        finalidade: ['Residencial', 'Comercial'],
        dormitorios: [1, 2, 3, 4, '5+'],
        garagem: [0, 1, 2, '3+'],
    };
    
    const renderDropdown = (id: string, label: string, options: (string | number)[]) => (
        <select 
            id={id} 
            className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-sm text-dark-text focus:ring-primary-orange focus:border-primary-orange appearance-none cursor-pointer"
        >
            <option value="" disabled>{label}</option>
            {options.map((opt, index) => (
                <option key={index} value={opt}>{opt}</option>
            ))}
        </select>
    );

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-8">
                A maior, melhor e mais bem avaliada imobiliária de Pelotas
                <br />
                Para comprar e alugar a Imperial Paris é o lugar
            </h1>

            {/* Abas de Busca */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {searchTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
                            activeTab === tab.id ? tab.color : 'bg-gray-400 hover:bg-gray-500'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <button className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700">
                    3077 - imóveis disponíveis
                </button>
            </div>

            {/* Formulário de Busca Principal */}
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-5xl mx-auto">
                {activeTab === 'imoveis' && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {/* Linha 1 */}
                        <div className="col-span-1 md:col-span-1">
                            {renderDropdown('operacao', 'Operação', dropdownOptions.operacao)}
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            {renderDropdown('cidades', 'Cidades', dropdownOptions.cidades)}
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            {renderDropdown('tipos', 'Tipos', dropdownOptions.tipos)}
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            {renderDropdown('bairros', 'Bairros', dropdownOptions.bairros)}
                        </div>
                        
                        {/* Linha 2 */}
                        <div className="col-span-1 md:col-span-1">
                            {renderDropdown('finalidade', 'Finalidade', dropdownOptions.finalidade)}
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            {renderDropdown('dormitorios', 'Dormitórios', dropdownOptions.dormitorios)}
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            {renderDropdown('garagem', 'Garagem', dropdownOptions.garagem)}
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <input type="text" placeholder="Valor Mín." className="w-full p-3 rounded-md bg-gray-100 text-sm text-dark-text focus:outline-none" />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <input type="text" placeholder="Valor Máx." className="w-full p-3 rounded-md bg-gray-100 text-sm text-dark-text focus:outline-none" />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-full py-3">
                                Pesquisar
                            </Button>
                        </div>
                    </div>
                )}
                
                {activeTab === 'cod' && (
                    <div className="flex space-x-4">
                        <TextInput label="" id="cod_ref" placeholder="Digite o Código ou Referência" className="flex-1" />
                        <Button className="bg-red-600 hover:bg-red-700 text-white px-8">
                            <Search className="w-5 h-5 mr-2" /> Buscar
                        </Button>
                    </div>
                )}
                
                {activeTab === 'condominio' && (
                    <div className="flex space-x-4">
                        <TextInput label="" id="condominio_search" placeholder="Digite o nome do Edifício ou Condomínio" className="flex-1" />
                        <Button className="bg-red-600 hover:bg-red-700 text-white px-8">
                            <Search className="w-5 h-5 mr-2" /> Buscar
                        </Button>
                    </div>
                )}
                
                {activeTab === 'lugares' && (
                    <div className="flex space-x-4">
                        <TextInput label="" id="lugares_search" placeholder="Ex: Próximo à UFPel, Shopping" className="flex-1" />
                        <Button className="bg-red-600 hover:bg-red-700 text-white px-8">
                            <Search className="w-5 h-5 mr-2" /> Buscar
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImovelSearch;