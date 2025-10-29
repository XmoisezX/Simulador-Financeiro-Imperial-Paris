import React from 'react';
import { Search, Save, X } from 'lucide-react';
import TextInput from './TextInput';
import { Checkbox } from './ui/checkbox'; // Assumindo que Checkbox do shadcn/ui está disponível
import { Button } from './ui/button'; // Assumindo que Button do shadcn/ui está disponível

// Mock data for dropdowns
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata'];

const FilterSidebar: React.FC = () => {
    // Mock state for filters
    const [filters, setFilters] = React.useState({
        contract: 'Venda',
        type: ['Apartamento'],
        bedrooms: [3],
    });

    const handleClearFilters = () => {
        setFilters({ contract: '', type: [], bedrooms: [] } as any);
    };

    return (
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-dark-text flex items-center">
                    <Search className="w-5 h-5 mr-2" /> Filtros
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Save className="w-4 h-4 mr-1" /> Salvar filtro
                </button>
            </div>

            {/* Campo de Busca Principal */}
            <TextInput 
                label=""
                id="mainSearch"
                placeholder="Busque por endereço, código, condomínio"
            />

            {/* Código */}
            <TextInput 
                label="Código"
                id="code"
                placeholder="Informe um código"
            />

            {/* Contrato */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Contrato</h3>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm">
                        <Checkbox id="venda" checked={filters.contract === 'Venda'} />
                        <span>Venda</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                        <Checkbox id="locacao" />
                        <span>Locação</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                        <Checkbox id="temporada" />
                        <span>Temporada</span>
                    </label>
                </div>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Tipo</h3>
                <div className="flex flex-wrap gap-2">
                    {filters.type.map(t => (
                        <span key={t} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {t} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilters(f => ({ ...f, type: f.type.filter(item => item !== t) }))} />
                        </span>
                    ))}
                    {/* Mock Dropdown for adding types */}
                    <select className="text-xs border border-gray-300 rounded-full p-1">
                        <option>Adicionar Tipo</option>
                        {propertyTypes.filter(t => !filters.type.includes(t)).map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Cidade - UF */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Cidade - UF</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    <option>Digite a cidade</option>
                </select>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Bairro</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    <option>Digite o bairro</option>
                    {neighborhoods.map(b => <option key={b}>{b}</option>)}
                </select>
            </div>
            
            {/* Logradouro e número */}
            <TextInput 
                label="Logradouro e número"
                id="street"
                placeholder="Informe o logradouro e número"
            />

            {/* Condomínio */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Condomínio</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    <option>Digite o condomínio</option>
                </select>
            </div>

            {/* Valores */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Valores</h3>
                <div className="flex space-x-2">
                    <TextInput id="minPrice" placeholder="Informe um valor" />
                    <span className="text-light-text self-center">até</span>
                    <TextInput id="maxPrice" placeholder="Informe um valor" />
                </div>
            </div>

            {/* Dormitórios */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-light-text">Dormitórios</h3>
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, '5 ou +'].map(num => (
                        <label key={num} className="flex items-center space-x-1 text-sm">
                            <Checkbox id={`bed-${num}`} checked={filters.bedrooms.includes(Number(num))} />
                            <span>{num}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* Ações de Filtro */}
            <div className="pt-4 border-t border-gray-200 space-y-2 sticky bottom-0 bg-white">
                <Button 
                    onClick={handleClearFilters}
                    variant="outline"
                    className="w-full text-primary-orange border-primary-orange hover:bg-orange-50"
                >
                    Limpar
                </Button>
                <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Filtrar
                </Button>
            </div>
        </div>
    );
};

export default FilterSidebar;