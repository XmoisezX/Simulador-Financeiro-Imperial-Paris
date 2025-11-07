import React, { useMemo, useState } from 'react';
import { Search, Save } from 'lucide-react';
import TextInput from './TextInput';
import { Button } from './ui/Button';
import CollapsibleCard from './CollapsibleCard';
import NumberInput from './NumberInput';

// Mock data para dropdowns
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const numberOptions = [0, 1, 2, 3, 4, '5 ou +'] as const;

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

  // Estados locais para as categorias (evita includes em undefined)
  const [selectedDorms, setSelectedDorms] = useState<(number | '5 ou +')[]>([]);
  const [selectedSuites, setSelectedSuites] = useState<(number | '5 ou +')[]>([]);
  const [selectedVagas, setSelectedVagas] = useState<(number | '5 ou +')[]>([]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    onFilterChange(id as keyof ExtractedFilters, value);
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (value === '' || value === null) {
      onFilterChange(id as keyof ExtractedFilters, null);
      return;
    }
    const parsed = Number(value);
    onFilterChange(id as keyof ExtractedFilters, isNaN(parsed) ? null : parsed);
  };

  // Utilitário: traduz seleção (ex.: [2,3,'5 ou +']) para min e max
  const translateSelectionToRange = (arr: (number | '5 ou +')[]) => {
    if (!arr || arr.length === 0) return { min: null as number | null, max: null as number | null };
    const has5Plus = arr.includes('5 ou +');
    const nums = arr.filter((x): x is number => typeof x === 'number');
    const min = nums.length > 0 ? Math.min(...nums) : (has5Plus ? 5 : null);
    // se tiver '5 ou +' consideramos max = null (sem teto)
    const max = has5Plus ? null : (nums.length > 0 ? Math.max(...nums) : null);
    // se só tiver '5 ou +' e nada mais, min = 5, max = null
    return { min: min, max: max };
  };

  const toggleSelection = (
    option: number | '5 ou +',
    selected: (number | '5 ou +')[],
    setter: React.Dispatch<React.SetStateAction<(number | '5 ou +')[]>>
  ) => {
    const exists = selected.some((v) => v === option);
    if (exists) {
      setter(selected.filter((v) => v !== option));
    } else {
      // Regras simples: se marcar '5 ou +' pode coexistir com outros (vamos permitir)
      setter([...selected, option]);
    }
  };

  // Ao aplicar filtros, traduz as categorias em ranges e dispara onFilterChange
  const handleApply = () => {
    const d = translateSelectionToRange(selectedDorms);
    onFilterChange('minDorms', d.min);
    onFilterChange('maxDorms', d.max);

    const s = translateSelectionToRange(selectedSuites);
    onFilterChange('minSuites', s.min);
    onFilterChange('maxSuites', s.max);

    const v = translateSelectionToRange(selectedVagas);
    onFilterChange('minVagas', v.min);
    onFilterChange('maxVagas', v.max);

    onApply();
  };

  const resetAll = () => {
    setSelectedDorms([]);
    setSelectedSuites([]);
    setSelectedVagas([]);
    onClear();
  };

  // Exibição resumida das escolhas (UI)
  const renderNumberChoices = (
    selected: (number | '5 ou +')[],
    setter: React.Dispatch<React.SetStateAction<(number | '5 ou +')[]>>
  ) => (
    <div className="flex flex-wrap gap-3">
      {numberOptions.map((opt) => {
        const checked = selected.some((v) => v === opt);
        return (
          <label key={`${String(opt)}`} className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleSelection(opt, selected, setter)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span>{typeof opt === 'number' ? opt : opt}</span>
          </label>
        );
      })}
    </div>
  );

  const dormsSummary = useMemo(() => {
    const { min, max } = translateSelectionToRange(selectedDorms);
    if (min === null && max === null) return '—';
    if (max === null && min !== null) return `${min}+`;
    return `${min ?? 0} - ${max ?? 0}`;
  }, [selectedDorms]);

  const suitesSummary = useMemo(() => {
    const { min, max } = translateSelectionToRange(selectedSuites);
    if (min === null && max === null) return '—';
    if (max === null && min !== null) return `${min}+`;
    return `${min ?? 0} - ${max ?? 0}`;
  }, [selectedSuites]);

  const vagasSummary = useMemo(() => {
    const { min, max } = translateSelectionToRange(selectedVagas);
    if (min === null && max === null) return '—';
    if (max === null && min !== null) return `${min}+`;
    return `${min ?? 0} - ${max ?? 0}`;
  }, [selectedVagas]);

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
              {neighborhoods.map((b) => (
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
              {propertyTypes.map((t) => (
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

      {/* Valores e Áreas */}
      <CollapsibleCard title="Valores e Áreas">
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

      {/* Características */}
      <CollapsibleCard title="Características">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-light-text">Dormitórios <span className="text-xs text-gray-400 ml-1">({dormsSummary})</span></h4>
            {renderNumberChoices(selectedDorms, setSelectedDorms)}
          </div>

          <div>
            <h4 className="text-sm font-medium text-light-text">Suítes <span className="text-xs text-gray-400 ml-1">({suitesSummary})</span></h4>
            {renderNumberChoices(selectedSuites, setSelectedSuites)}
          </div>

          <div>
            <h4 className="text-sm font-medium text-light-text">Vagas de Garagem <span className="text-xs text-gray-400 ml-1">({vagasSummary})</span></h4>
            {renderNumberChoices(selectedVagas, setSelectedVagas)}
          </div>
        </div>
      </CollapsibleCard>

      {/* Ações de Filtro (Sticky Footer) */}
      <div className="pt-4 border-t border-gray-200 space-y-2 sticky bottom-0 bg-white z-10">
        <Button
          onClick={resetAll}
          variant="outline"
          className="w-full text-primary-orange border-primary-orange hover:bg-orange-50"
        >
          Limpar
        </Button>
        <Button
          onClick={handleApply}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Filtrar
        </Button>
      </div>
    </div>
  );
};

export default ExtractedImovelFilters;