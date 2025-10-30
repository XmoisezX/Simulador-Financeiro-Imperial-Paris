import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

// Mock Data (Reutilizado do FloatingSearchForm)
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const roomOptions = [1, 2, 3, 4, '5+'];

interface FilterState {
    operation: 'Aluguel' | 'Vendas';
    city: string;
    type: string;
    neighborhood: string;
    rooms: number | string;
    garages: number | string;
    minPrice: string;
    maxPrice: string;
}

const initialFilters: FilterState = {
    operation: 'Vendas', // Padrão para a página de Imóveis Públicos
    city: 'Pelotas',
    type: '',
    neighborhood: '',
    rooms: '',
    garages: '',
    minPrice: '0',
    maxPrice: '300000',
};

const CompactSearchForm: React.FC = () => {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Searching with compact filters:', filters);
        alert(`Buscando: ${filters.operation} em ${filters.neighborhood || 'toda a cidade'}`);
        // Aqui a lógica real de filtragem da lista seria implementada
    };
    
    // Ajustado para ocupar a largura total do container
    const renderSelect = (name: keyof FilterState, options: (string | number)[], placeholder: string) => (
        <div className="relative w-full">
            <select
                id={name}
                name={name}
                value={filters[name]}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm text-dark-text focus:ring-primary-orange focus:border-primary-orange appearance-none cursor-pointer shadow-sm"
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt, index) => (
                    <option key={index} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
    );
    
    // Ajustado para ocupar a largura total do container
    const renderPriceInput = (name: keyof FilterState, placeholder: string) => (
        <div className="relative w-full">
            <input
                type="text"
                name={name}
                value={filters[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary-orange focus:border-primary-orange"
            />
        </div>
    );

    return (
        <form onSubmit={handleSearch} className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-100 space-y-4">
            
            <h2 className="text-lg font-bold text-dark-text border-b pb-2">Filtros de Busca</h2>
            
            {/* Abas de Operação */}
            <div className="flex border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, operation: 'Vendas' }))}
                    className={`py-1 px-3 text-xs font-semibold transition-colors ${
                        filters.operation === 'Vendas' 
                            ? 'border-b-2 border-primary-orange text-primary-orange' 
                            : 'text-gray-500 hover:text-dark-text'
                    }`}
                >
                    VENDAS
                </button>
                <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, operation: 'Aluguel' }))}
                    className={`py-1 px-3 text-xs font-semibold transition-colors ${
                        filters.operation === 'Aluguel' 
                            ? 'border-b-2 border-primary-orange text-primary-orange' 
                            : 'text-gray-500 hover:text-dark-text'
                    }`}
                >
                    ALUGUEL
                </button>
            </div>

            {/* Campos de Filtro Verticais */}
            <div className="space-y-3">
                
                {/* Bairro */}
                {renderSelect('neighborhood', neighborhoods, 'Bairro')}
                
                {/* Tipo */}
                {renderSelect('type', propertyTypes, 'Tipo')}
                
                {/* Quartos */}
                {renderSelect('rooms', roomOptions, 'Quartos')}
                
                {/* Vagas */}
                {renderSelect('garages', roomOptions, 'Vagas')}
                
                {/* Preço Mínimo */}
                {renderPriceInput('minPrice', 'Preço Mínimo')}
                
                {/* Preço Máximo */}
                {renderPriceInput('maxPrice', 'Preço Máximo')}
                
                {/* Botão de Busca */}
                <Button
                    type="submit"
                    className="w-full bg-primary-orange hover:bg-secondary-orange text-white font-medium px-4 py-2 flex items-center justify-center h-10 flex-shrink-0"
                >
                    <Search className="w-4 h-4 mr-2" /> Aplicar Filtros
                </Button>
            </div>
        </form>
    );
};

export default CompactSearchForm;