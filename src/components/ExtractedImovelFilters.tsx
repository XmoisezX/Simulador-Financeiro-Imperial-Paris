import React from 'react';
import { Search, Save } from 'lucide-react';
import TextInput from './TextInput';
import { Button } from './ui/Button';
import CollapsibleCard from './CollapsibleCard';
import NumberInput from './NumberInput';

// Mock data for dropdowns
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];

// Esta interface espelha os filtros usados em ExtractedImoveisPage
export interface ExtractedFilters {
  minVenda: number | null;
  maxVenda: number | null;
  minAluguel: number | null;
  maxAluguel: number | null;
  minDorms: number | null;
  maxDorms: number | null;
  minSuites?: number | null;
  maxSuites?: number | null;
  minVagas?: number | null;
  maxVagas?: number | null;
  bairro: string;
  categoria: string;
  andar: number | null;
  enderecoSearch: string;
  referenciaSearch: string;
}

interface ExtractedImovelFiltersProps {
  filters: ExtractedFilters;
  onFilterChange: (key: keyof ExtractedFilters, value: string | number | null) => void;
  onApply: () => void;
  onClear: () => void;
}

const ExtractedImovelFilters: React.FC<ExtractedImovelFiltersProps> = ({
  filters,
  onFilterChange,
  onApply,
  onClear
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    onFilterChange(id as keyof ExtractedFilters, value);
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // NumberInput (moeda) envia somente dígitos em value
    if (value === '' || value === null) {
      onFilterChange(id as keyof ExtractedFilters, null);
      return;
    }
    const parsed = Number(value);
    onFilterChange(id as keyof ExtractedFilters, isNaN(parsed) ? null : parsed);
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-dark-text flex items-center">
          <Search className="w-5 h-5 mr-2" /> Filtros
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
          <Save className="w-4 h-4 mr-1" /> Salvar filtro
        </button>
      </div>

      {/* Busca Avançada */}
      <CollapsibleCard title="Busca Avançada" isOpenDefault>
        <div className="grid grid-cols-1 gap-3">
          <TextInput
            label="Buscar por Endereço/Proprietário"
            id="enderecoSearch"
            value={filters.enderecoSearch}
            onChange={handleTextChange}
            placeholder="Ex: 'Rua Suzana Cortez' ou 'Maria Silva'"
          />
          <TextInput
            label="Buscar por Referência"
            id="referenciaSearch"
            value={filters.referenciaSearch}
            onChange={handleTextChange}
            placeholder="Ex: REF1234"
          />
        </div>
      </CollapsibleCard>

      {/* Localização e Categoria */}
      <CollapsibleCard title="Localização e Categoria" isOpenDefault>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light-text">Bairro</label>
            <select
              id="bairro"
              value={filters.bairro}
              onChange={handleTextChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
            >
              <option value="">Todos os bairros</option>
              {neighborhoods.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-light-text">Categoria</label>
            <select
              id="categoria"
              value={filters.categoria}
              onChange={handleTextChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
            >
              <option value="">Todas as categorias</option>
              {propertyTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <NumberInput
            label="Andar (1-9)"
            id="andar"
            value={filters.andar ?? ''}
            onChange={handleNumericChange}
            min={1}
            max={9}
            placeholder="Ex: 5"
          />
        </div>
      </CollapsibleCard>

      {/* Faixas de Valores */}
      <CollapsibleCard title="Faixas de Valores">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-light-text mb-2">Venda (R$)</h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Mínimo"
                id="minVenda"
                value={filters.minVenda ?? ''}
                onChange={handleNumericChange}
                isCurrency
                placeholder="0"
              />
              <NumberInput
                label="Máximo"
                id="maxVenda"
                value={filters.maxVenda ?? ''}
                onChange={handleNumericChange}
                isCurrency
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-light-text mb-2">Aluguel (R$)</h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Mínimo"
                id="minAluguel"
                value={filters.minAluguel ?? ''}
                onChange={handleNumericChange}
                isCurrency
                placeholder="0"
              />
              <NumberInput
                label="Máximo"
                id="maxAluguel"
                value={filters.maxAluguel ?? ''}
                onChange={handleNumericChange}
                isCurrency
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Dormitórios */}
      <CollapsibleCard title="Dormitórios">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Mín."
            id="minDorms"
            value={filters.minDorms ?? ''}
            onChange={handleNumericChange}
            min={0}
          />
          <NumberInput
            label="Máx."
            id="maxDorms"
            value={filters.maxDorms ?? ''}
            onChange={handleNumericChange}
            min={0}
          />
        </div>
      </CollapsibleCard>

      {/* Ações de Filtro (Sticky Footer) */}
      <div className="pt-4 border-t border-gray-200 space-y-2 sticky bottom-0 bg-white z-10">
        <Button
          onClick={onClear}
          variant="outline"
          className="w-full text-primary-orange border-primary-orange hover:bg-orange-50"
        >
          Limpar
        </Button>
        <Button
          onClick={onApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Filtrar
        </Button>
      </div>
    </div>
  );
};

export default ExtractedImovelFilters;