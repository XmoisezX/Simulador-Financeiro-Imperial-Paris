import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/Button';

const ImovelSearch: React.FC = () => {
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
                A imobiliária que mais cresce em Pelotas
                <br />
                Para comprar e alugar a Imperial Paris é o lugar
            </h1>

            {/* Formulário de Busca Principal (Layout simplificado) */}
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 max-w-5xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Operação */}
                    <div className="col-span-1">
                        {renderDropdown('operacao', 'Operação', dropdownOptions.operacao)}
                    </div>
                    {/* Tipos */}
                    <div className="col-span-1">
                        {renderDropdown('tipos', 'Tipos', dropdownOptions.tipos)}
                    </div>
                    {/* Bairros */}
                    <div className="col-span-2 md:col-span-1">
                        {renderDropdown('bairros', 'Bairros', dropdownOptions.bairros)}
                    </div>
                    {/* Botão de Pesquisa */}
                    <div className="col-span-2 md:col-span-1">
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white h-full py-3">
                            <Search className="w-5 h-5 mr-2" /> Pesquisar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImovelSearch;