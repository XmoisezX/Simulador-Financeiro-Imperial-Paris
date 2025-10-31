import React from 'react';
import { Search, DollarSign, Bed, Car, Building, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from './NumberInput';

// Mock Data baseado nas colunas da tabela imoveis_importados
const CATEGORY_OPTIONS = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural', 'Outro'];
const NEIGHBORHOOD_OPTIONS = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas', 'Outro'];
const ROOM_OPTIONS = [1, 2, 3, 4, 5];
const FLOOR_OPTIONS = [1, 2, 3, 4, 5];

export interface ExtractedFilters {
    minVenda: number | null;
    maxVenda: number | null;
    minAluguel: number | null;
    maxAluguel: number | null;
    minDorms: number | null;
    maxDorms: number | null;
    minSuites: number | null;
    maxSuites: number | null;
    minVagas: number | null;
    maxVagas: number | null;
    bairro: string;
    categoria: string;
    andar: number | null; // Mocked, since 'andar' is not a direct column, but we'll use it for filtering logic
}

interface ExtractedImovelFiltersProps {
    filters: ExtractedFilters;
    onFilterChange: (key: keyof ExtractedFilters, value: string | number | null) => void;
    onApply: () => void;
    onClear: () => void;
}

const ExtractedImovelFilters: React.FC<ExtractedImovelFiltersProps> = ({ filters, onFilterChange, onApply, onClear }) => {
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const numericValue = value === '' ? null : parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
        onFilterChange(id as keyof ExtractedFilters, numericValue);
    };
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target;
        onFilterChange(id as keyof ExtractedFilters, value);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-dark-text flex items-center border-b pb-2">
                <Search className="w-5 h-5 mr-2 text-blue-600" /> Filtro Inteligente
            </h2>

            {/* Linha 1: Valores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 border p-3 rounded-md">
                    <h3 className="text-sm font-medium text-light-text flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Valor Venda</h3>
                    <div className="flex space-x-2">
                        <NumberInput label="Mín" id="minVenda" value={filters.minVenda || ''} onChange={handleNumberChange} isCurrency placeholder="0" />
                        <NumberInput label="Máx" id="maxVenda" value={filters.maxVenda || ''} onChange={handleNumberChange} isCurrency placeholder="Máx" />
                    </div>
                </div>
                <div className="space-y-2 border p-3 rounded-md">
                    <h3 className="text-sm font-medium text-light-text flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Valor Aluguel</h3>
                    <div className="flex space-x-2">
                        <NumberInput label="Mín" id="minAluguel" value={filters.minAluguel || ''} onChange={handleNumberChange} isCurrency placeholder="0" />
                        <NumberInput label="Máx" id="maxAluguel" value={filters.maxAluguel || ''} onChange={handleNumberChange} isCurrency placeholder="Máx" />
                    </div>
                </div>
                
                {/* Categoria e Bairro */}
                <div className="space-y-2">
                    <label htmlFor="categoria" className="block text-sm font-medium text-light-text flex items-center"><Building className="w-4 h-4 mr-1" /> Categoria</label>
                    <select id="categoria" value={filters.categoria} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todas</option>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="bairro" className="block text-sm font-medium text-light-text flex items-center"><MapPin className="w-4 h-4 mr-1" /> Bairro</label>
                    <select id="bairro" value={filters.bairro} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todos</option>
                        {NEIGHBORHOOD_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            {/* Linha 2: Características */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2 border p-3 rounded-md">
                    <h3 className="text-sm font-medium text-light-text flex items-center"><Bed className="w-4 h-4 mr-1" /> Dormitórios</h3>
                    <div className="flex space-x-2">
                        <NumberInput label="Mín" id="minDorms" value={filters.minDorms || ''} onChange={handleNumberChange} placeholder="0" />
                        <NumberInput label="Máx" id="maxDorms" value={filters.maxDorms || ''} onChange={handleNumberChange} placeholder="Máx" />
                    </div>
                </div>
                <div className="space-y-2 border p-3 rounded-md">
                    <h3 className="text-sm font-medium text-light-text flex items-center"><Bed className="w-4 h-4 mr-1" /> Suítes (Mock)</h3>
                    <div className="flex space-x-2">
                        <NumberInput label="Mín" id="minSuites" value={filters.minSuites || ''} onChange={handleNumberChange} placeholder="0" />
                        <NumberInput label="Máx" id="maxSuites" value={filters.maxSuites || ''} onChange={handleNumberChange} placeholder="Máx" />
                    </div>
                </div>
                <div className="space-y-2 border p-3 rounded-md">
                    <h3 className="text-sm font-medium text-light-text flex items-center"><Car className="w-4 h-4 mr-1" /> Vagas (Mock)</h3>
                    <div className="flex space-x-2">
                        <NumberInput label="Mín" id="minVagas" value={filters.minVagas || ''} onChange={handleNumberChange} placeholder="0" />
                        <NumberInput label="Máx" id="maxVagas" value={filters.maxVagas || ''} onChange={handleNumberChange} placeholder="Máx" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="andar" className="block text-sm font-medium text-light-text flex items-center"><Building className="w-4 h-4 mr-1" /> Andar (Mock)</label>
                    <select id="andar" value={filters.andar || ''} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todos</option>
                        {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}º ou mais</option>)}
                    </select>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button onClick={onClear} variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100">
                    Limpar Filtros
                </Button>
                <Button onClick={onApply} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Aplicar Filtros
                </Button>
            </div>
        </div>
    );
};

export default ExtractedImovelFilters;