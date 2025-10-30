import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { HomeIcon, MapPinIcon, BuildingOffice2Icon, CodeBracketIcon, BedIcon, CarIcon } from './icons';

// Mock Data
const operationOptions = ['Venda', 'Aluguel', 'Temporada'];
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const priceRanges = ['Até R$ 100k', 'R$ 100k - R$ 300k', 'R$ 300k - R$ 600k', 'Acima de R$ 600k'];
const roomOptions = [1, 2, 3, 4, '5+'];

interface FilterState {
    operation: string;
    type: string;
    neighborhood: string;
    price: string;
    rooms: number | string;
    garages: number | string;
    code: string;
}

const initialFilters: FilterState = {
    operation: 'Venda',
    type: '',
    neighborhood: '',
    price: '',
    rooms: '',
    garages: '',
    code: '',
};

const FloatingSearchForm: React.FC = () => {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Searching with filters:', filters);
        // Aqui você implementaria a navegação para a página de resultados
        alert(`Buscando: ${filters.operation} em ${filters.neighborhood || 'toda a cidade'}`);
    };
    
    const renderSelect = (name: keyof FilterState, label: string, options: (string | number)[], icon: React.FC) => (
        <div className="relative">
            <label htmlFor={name} className="sr-only">{label}</label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {icon({})}
            </div>
            <select
                id={name}
                name={name}
                value={filters[name]}
                onChange={handleInputChange}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white text-sm text-dark-text focus:ring-primary-orange focus:border-primary-orange appearance-none cursor-pointer shadow-sm"
            >
                <option value="" disabled>{label}</option>
                {options.map((opt, index) => (
                    <option key={index} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
    );
    
    const renderRadioGroup = (name: keyof FilterState, options: (string | number)[], icon: React.FC) => (
        <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-dark-text">
                {icon({})}
                <span className="ml-2">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, [name]: prev[name] === opt ? '' : opt }))}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                            filters[name] === opt
                                ? 'bg-primary-orange text-white border-primary-orange'
                                : 'bg-gray-100 text-dark-text border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto relative z-10">
            <div className="bg-white p-6 rounded-xl shadow-2xl border-t-4 border-primary-orange space-y-4">
                
                {/* Seção Principal de Filtros */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Operação */}
                    <div className="col-span-2 md:col-span-1">
                        {renderSelect('operation', 'Finalidade', operationOptions, BuildingOffice2Icon)}
                    </div>
                    {/* Tipo */}
                    <div className="col-span-2 md:col-span-1">
                        {renderSelect('type', 'Tipo de Imóvel', propertyTypes, HomeIcon)}
                    </div>
                    {/* Bairro */}
                    <div className="col-span-2 md:col-span-1">
                        {renderSelect('neighborhood', 'Bairro', neighborhoods, MapPinIcon)}
                    </div>
                    {/* Preço */}
                    <div className="col-span-2 md:col-span-1">
                        {renderSelect('price', 'Faixa de Preço', priceRanges, DollarSign)}
                    </div>
                </div>

                {/* Botão de Busca e Filtros Avançados */}
                <div className="flex justify-between items-center pt-2">
                    <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {isAdvancedOpen ? 'Menos Filtros' : 'Mais Filtros'}
                        {isAdvancedOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </button>
                    
                    <button
                        type="submit"
                        className="flex items-center bg-primary-orange hover:bg-secondary-orange text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
                    >
                        <Search className="w-5 h-5 mr-2" /> Buscar Imóveis
                    </button>
                </div>
                
                {/* Filtros Avançados */}
                {isAdvancedOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 animate-fade-in">
                        {/* Quartos */}
                        {renderRadioGroup('rooms', roomOptions, BedIcon)}
                        
                        {/* Garagens */}
                        {renderRadioGroup('garages', roomOptions, CarIcon)}
                        
                        {/* Código */}
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-medium text-dark-text">
                                <CodeBracketIcon />
                                <span className="ml-2">Código do Imóvel</span>
                            </div>
                            <input
                                type="text"
                                name="code"
                                value={filters.code}
                                onChange={handleInputChange}
                                placeholder="Ex: 52564"
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-primary-orange focus:border-primary-orange"
                            />
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
};

export default FloatingSearchForm;