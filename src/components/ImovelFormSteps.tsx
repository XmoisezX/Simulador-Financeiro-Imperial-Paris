import React, { useCallback, useEffect } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus, Building2, Link as LinkIcon } from 'lucide-react';
import { ImovelInput, VisibilidadeMapa, Ocupacao, ImovelImage } from '../../types';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import ToggleSwitch from './ToggleSwitch';
import ImageCard from './ImageCard';
import ActionsDropdown from './ActionsDropdown';
import PersonSelect from './PersonSelect';
import UserSelect from './UserSelect';
import MapDisplay from './MapDisplay';

// --- Mock Data ---
const propertyTypes = [
    'Apartamento', 'Apartamento Garden', 'Box', 'Campo', 'Casa', 'Casa Comercial', 
    'Casa de Condomínio', 'Chácara', 'Cobertura', 'Conjunto Comercial', 'Duplex', 
    'Fazenda', 'Flat', 'Galpão', 'Geminado', 'Haras', 'Hotel', 'Kitnet', 'Loft', 
    'Loja', 'Pavilhão', 'Ponto Comercial', 'Pousada', 'Prédio Comercial', 
    'Prédio Residencial', 'Sala Comercial', 'Salão Comercial', 'Sobrado', 'Studio', 
    'Sítio', 'Terreno', 'Terreno Comercial', 'Triplex', 'Área Rural'
];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const motives = ['Vendido', 'Alugado', 'Retirado pelo proprietário'];
const indexOptions = ['IGP-M', 'IPCA', 'FIPE'];
const occupationOptions: Ocupacao[] = ['Desocupado', 'Ocupado', 'Locado'];
const floorOptions = ['Nenhum', 'Térreo', '1º Andar', '2º Andar', '3º Andar', '4º Andar']; // Adicionado 4º Andar
const orientationOptions = ['Norte', 'Sul', 'Leste', 'Oeste'];
const floorTypes = ['Aquecido', 'Carpete', 'Laminado', 'Tabuão', 'Ardósia', 'Cerâmico', 'Mármore', 'Usina', 'Associado', 'Flutuante', 'Parquet', 'Vinílico', 'Granito', 'Bruto', 'Porcelanato'];
const booleanOptions = ['Sim', 'Não'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const approvalOptions = ['Aprovado', 'Não aprovado', 'Aguardando'];

const visibilidadeEnderecoOptions = [
    'Apenas estado',
    'Apenas o estado e a cidade',
    'Todas acima incluindo o bairro',
    'Todas acima incluindo logradouro',
    'Todas acima incluindo condomínio e subcondomínio',
    'Todos acima incluindo o número',
    'Todos acima incluindo o andar',
    'Todos acima incluindo o complemento',
];

interface ImovelFormStepsProps {
    step: number;
    formData: ImovelInput;
    images: ImovelImage[];
    selectedImageIds: string[];
    isEditing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    
    // Handlers de Input
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadioChange: (name: keyof ImovelInput, value: string) => void;
    handleToggleChange: (name: 'vis_venda' | 'vis_locacao' | 'vis_temporada' | 'vis_iptu' | 'vis_condominio', checked: boolean) => void; // Atualizado
    handleCheckboxGroupChange: (field: keyof ImovelInput, value: string | boolean) => void; // Atualizado para aceitar boolean
    handleFinalidadeToggle: (field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => void;
    handlePersonSelectChange: (id: keyof ImovelInput, personId: string) => void;
    
    // Handlers de Mídia
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImageSelect: (id: string, isSelected: boolean) => void;
    handleLegendUpdate: (id: string, legend: string) => void;
    handleAction: (action: string) => void;
    handleSelectAll: (checked: boolean) => void;
    
    // Props de Geocodificação (Recebidas do pai)
    nominatimLocation: { lat: number, lng: number, display_name: string } | null;
    nominatimLoading: boolean;
    nominatimError: string | null;
}

const ImovelFormSteps: React.FC<ImovelFormStepsProps> = ({
    step,
    formData,
    images,
    selectedImageIds,
    isEditing,
    fileInputRef,
    handleInputChange,
    handleCepChange,
    handleRadioChange,
    handleToggleChange,
    handleCheckboxGroupChange,
    handleFinalidadeToggle,
    handlePersonSelectChange,
    handleFileSelect,
    handleImageSelect,
    handleLegendUpdate,
    handleAction,
    handleSelectAll,
    nominatimLocation,
    nominatimLoading,
    nominatimError,
}) => {
    
    // A lógica de geocodificação e CEP lookup foi movida para o componente pai.
    // Aqui, apenas usamos os resultados passados via props.
    
    const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

    // Helper function to render radio groups
    const renderRadioGroup = (name: keyof ImovelInput, options: (string | number)[], required = false) => (
        <div className={`flex flex-wrap gap-4 ${!isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
            {options.map((option, index) => (
                <label key={`${name}-${option}-${index}`} className="flex items-center space-x-2 text-sm">
                    <input 
                        type="radio" 
                        name={name} 
                        value={String(option)} 
                        checked={String(formData[name]) === String(option)}
                        onChange={() => handleRadioChange(name, String(option))}
                        className="text-blue-600 focus:ring-blue-500" 
                        required={required} 
                        disabled={!isEditing}
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );
    
    // Helper function to render checkbox groups (for piso types)
    const renderPisoCheckboxGroup = (options: string[]) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                    <Checkbox 
                        id={`piso-${type}`} 
                        checked={formData.tipos_piso.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxGroupChange('tipos_piso', type)}
                        disabled={!isEditing}
                    />
                    <span>{type}</span>
                </label>
            ))}
        </div>
    );
    
    const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
    const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

    switch (step) {
        case 1:
            const isVendaActive = formData.venda_ativo;
            const isLocacaoActive = formData.locacao_ativo;
            const isTemporadaActive = formData.temporada_ativo;

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Tipo do imóvel <RequiredAsterisk /></label>
                            <select 
                                id="tipo_imovel"
                                value={formData.tipo_imovel}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-400 disabled:bg-gray-100"
                            >
                                <option value="">Escolha o tipo do imóvel</option>
                                {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <TextInput label={<span>Código <RequiredAsterisk /></span>} id="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="52564" disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Venda */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isVendaActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="venda_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="venda_ativo"
                                    checked={isVendaActive}
                                    onChange={(e) => handleFinalidadeToggle('venda_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Venda</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('venda_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="venda_motivo_indisponibilidade"
                                value={formData.venda_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.venda_disponibilidade === 'Disponível' || !isVendaActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        {/* Locação */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isLocacaoActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="locacao_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="locacao_ativo"
                                    checked={isLocacaoActive}
                                    onChange={(e) => handleFinalidadeToggle('locacao_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Locação</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('locacao_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="locacao_motivo_indisponibilidade"
                                value={formData.locacao_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.locacao_disponibilidade === 'Disponível' || !isLocacaoActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        {/* Temporada */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isTemporadaActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="temporada_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="temporada_ativo"
                                    checked={isTemporadaActive}
                                    onChange={(e) => handleFinalidadeToggle('temporada_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Temporada</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('temporada_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="temporada_motivo_indisponibilidade"
                                value={formData.temporada_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.temporada_disponibilidade === 'Disponível' || !isTemporadaActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                </>
            );
        case 2:
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Condomínio</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option>Pesquise pelo nome do condomínio (Mock)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bloco / Torre / Quadra</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option>Pesquise pelo nome do subcondomínio (Mock)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="relative">
                            <TextInput 
                                label={<span>CEP <RequiredAsterisk /></span>} 
                                id="cep" 
                                value={formData.cep} 
                                onChange={handleCepChange} 
                                placeholder="99999-999" 
                                maxLength={9}
                                disabled={!isEditing}
                            />
                            {/* Removido cepLoading, pois o pai gerencia o estado e o preenchimento */}
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Estado <RequiredAsterisk /></label>
                            <select id="estado" value={formData.estado} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.estado}>{formData.estado}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Cidade <RequiredAsterisk /></label>
                            <select id="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.cidade}>{formData.cidade}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bairro <RequiredAsterisk /></label>
                            <select id="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.bairro}>{formData.bairro}</option>
                                {/* Mock de bairros se não houver CEP data */}
                                {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label={<span>Logradouro <RequiredAsterisk /></span>} id="logradouro" value={formData.logradouro} onChange={handleInputChange} placeholder="Informe o logradouro" disabled={!isEditing} />
                        <TextInput label={<span>Número <RequiredAsterisk /></span>} id="numero" value={formData.numero} onChange={handleInputChange} placeholder="Informe o número" disabled={!isEditing} />
                        <TextInput label="Complemento" id="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Informe o complemento" disabled={!isEditing} />
                        <TextInput label="Ponto de referência" id="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Ex: Ao lado da igreja" disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Andar</label>
                            <select id="andar" value={formData.andar} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {floorOptions.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Último andar</label>
                            {renderRadioGroup('ultimo_andar', booleanOptions)}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-light-text">Mapa no site</label>
                            {renderRadioGroup('mapa_visibilidade', ['Exata', 'Aproximada', 'Não mostrar'])}
                        </div>
                    </div>
                    
                    <MapDisplay 
                        visibilidade={formData.mapa_visibilidade as VisibilidadeMapa} 
                        address={fullAddress}
                        isValid={isAddressValid}
                        location={nominatimLocation ? { lat: nominatimLocation.lat, lng: nominatimLocation.lng } : null}
                        isGeocoding={nominatimLoading}
                        geocodingError={nominatimError}
                    />
                </>
            );
        case 3:
            const isCondominioDisabled = formData.condominio_isento || !isEditing;
            const isIptuDisabled = formData.iptu_isento || !isEditing;

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberInput label={<span>Valor de venda <RequiredAsterisk /></span>} id="valor_venda" isCurrency value={formData.valor_venda} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.venda_ativo || !isEditing} />
                        <NumberInput label="Valor de locação" id="valor_locacao" isCurrency value={formData.valor_locacao} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.locacao_ativo || !isEditing} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex space-x-2 items-center">
                            <NumberInput 
                                label="Valor de condomínio" 
                                id="valor_condominio" 
                                isCurrency 
                                value={formData.valor_condominio} 
                                onChange={handleInputChange} 
                                placeholder="R$ 0,00" 
                                disabled={isCondominioDisabled} 
                                className={isCondominioDisabled ? 'opacity-50' : ''}
                            />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox 
                                    id="condominio_isento" 
                                    checked={formData.condominio_isento} 
                                    onCheckedChange={(checked) => handleCheckboxGroupChange('condominio_isento', checked as any)} 
                                    disabled={!isEditing}
                                />
                                <span>Isento</span>
                            </label>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <NumberInput 
                                label="Valor de IPTU" 
                                id="valor_iptu" 
                                isCurrency 
                                value={formData.valor_iptu} 
                                onChange={handleInputChange} 
                                placeholder="R$ 0,00" 
                                disabled={isIptuDisabled} 
                                className={isIptuDisabled ? 'opacity-50' : ''}
                            />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox 
                                    id="iptu_isento" 
                                    checked={formData.iptu_isento} 
                                    onCheckedChange={(checked) => handleCheckboxGroupChange('iptu_isento', checked as any)} 
                                    disabled={!isEditing}
                                />
                                <span>Isento</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <NumberInput label="Seguro Incêndio (anual)" id="seguro_incendio" value={formData.seguro_incendio} onChange={handleInputChange} placeholder="R$ 0,00" isCurrency disabled={!isEditing} />
                        <NumberInput label="Taxa de limpeza" id="taxa_limpeza" value={formData.taxa_limpeza} onChange={handleInputChange} placeholder="R$ 0,00" isCurrency disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Índice de reajuste</label>
                            <select id="indice_reajuste" value={formData.indice_reajuste} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {indexOptions.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <NumberInput label="Valor Base" id="valor_base" value={formData.valor_base} onChange={handleInputChange} placeholder="Informe o valor base" isCurrency disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Período do IPTU</label>
                            {renderRadioGroup('iptu_periodo', ['Mensal', 'Anual'])}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Financiável <RequiredAsterisk /></label>
                            {renderRadioGroup('financiavel', ['Sim', 'Não', 'MCMV'])}
                        </div>
                    </div>
                </>
            );
        case 4:
            return (
                <>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800 mb-4">
                        As informações de visibilidade podem ser sobrescritas de acordo com as configurações dos Portais.
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Endereço <RequiredAsterisk /></label>
                        <select id="vis_endereco" value={formData.vis_endereco} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                            {visibilidadeEnderecoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Valores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ToggleSwitch 
                            label="Venda" 
                            id="vis_venda" 
                            checked={formData.vis_venda === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_venda', checked)}
                            disabled={!formData.venda_ativo || !isEditing}
                        />
                        <ToggleSwitch 
                            label="Locação" 
                            id="vis_locacao" 
                            checked={formData.vis_locacao === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_locacao', checked)}
                            disabled={!formData.locacao_ativo || !isEditing}
                        />
                        <ToggleSwitch 
                            label="Temporada" 
                            id="vis_temporada" 
                            checked={formData.vis_temporada === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_temporada', checked)}
                            disabled={!formData.temporada_ativo || !isEditing}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <ToggleSwitch 
                            label="IPTU" 
                            id="vis_iptu" 
                            checked={formData.vis_iptu === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_iptu', checked)}
                            disabled={!isEditing}
                        />
                        <ToggleSwitch 
                            label="Condomínio" 
                            id="vis_condominio" 
                            checked={formData.vis_condominio === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_condominio', checked)}
                            disabled={!isEditing}
                        />
                    </div>
                </>
            );
        case 5:
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PersonSelect 
                            label="Proprietário" 
                            id="proprietario_id" 
                            value={formData.proprietario_id} 
                            onChange={(id) => handlePersonSelectChange('proprietario_id', id)}
                            required
                            showNewButton
                            disabled={!isEditing}
                        />
                        <NumberInput label="Comissão (%)" id="comissao_proprietario_percent" value={formData.comissao_proprietario_percent} onChange={handleInputChange} placeholder="100%" disabled={!isEditing} />
                    </div>
                    <Button variant="outline" className="mt-2" disabled={!isEditing}>+ Mais um proprietário (Mock)</Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <NumberInput label="Período do email de atualização (dias)" id="periodo_email_atualizacao" value={formData.periodo_email_atualizacao} onChange={handleInputChange} placeholder="30" disabled={!isEditing} />
                        <label className="flex items-center space-x-2 text-sm mt-6">
                            <Checkbox id="enviar_email_atualizacao" checked={formData.enviar_email_atualizacao} onCheckedChange={(checked) => handleCheckboxGroupChange('enviar_email_atualizacao', checked as any)} disabled={!isEditing} />
                            <span>Enviar email de atualização</span>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <UserSelect 
                            label="Agenciador / Captador" 
                            id="agenciador_id" 
                            value={formData.agenciador_id} 
                            onChange={(id) => handlePersonSelectChange('agenciador_id', id)}
                            required
                            disabled={!isEditing}
                        />
                        <UserSelect 
                            label="Responsável / Corretor" 
                            id="responsavel_id" 
                            value={formData.responsavel_id} 
                            onChange={(id) => handlePersonSelectChange('responsavel_id', id)}
                            required
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <NumberInput label="Honorários Venda (%)" id="honorarios_venda_percent" value={formData.honorarios_venda_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.venda_ativo || !isEditing} />
                        <NumberInput label="Honorários Locação (%)" id="honorarios_locacao_percent" value={formData.honorarios_locacao_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.locacao_ativo || !isEditing} />
                        <NumberInput label="Honorários Temporada (%)" id="honorarios_temporada_percent" value={formData.honorarios_temporada_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.temporada_ativo || !isEditing} />
                        <TextInput label={<span>Data agenciamento <RequiredAsterisk /></span>} id="data_agenciamento" type="date" value={formData.data_agenciamento} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Ocupação <RequiredAsterisk /></label>
                            <select id="ocupacao" value={formData.ocupacao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {occupationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Exclusivo</label>
                            {renderRadioGroup('exclusivo', booleanOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Placa</label>
                            {renderRadioGroup('placa', booleanOptions)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <TextInput label="Nº medidor energia" id="medidor_energia" value={formData.medidor_energia} onChange={handleInputChange} placeholder="Informe o Nº da energia" disabled={!isEditing} />
                        <TextInput label="Nº medidor água" id="medidor_agua" value={formData.medidor_agua} onChange={handleInputChange} placeholder="Informe o Nº da água" disabled={!isEditing} />
                        <TextInput label="Nº medidor gás" id="medidor_gas" value={formData.medidor_gas} onChange={handleInputChange} placeholder="Informe o Nº do gás" disabled={!isEditing} />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-light-text">Observações internas</label>
                        <textarea 
                            id="observacoes_internas" 
                            rows={3} 
                            value={formData.observacoes_internas}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            disabled={!isEditing}
                        ></textarea>
                    </div>
                </>
            );
        case 6: // Chaves
            return (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-light-text">Nenhuma chave vinculada a este imóvel. (Mock)</p>
                    <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        + Nova chave
                    </Button>
                </div>
            );
        case 7: // Documentos Anexados
            return (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-light-text">Nenhum documento anexado encontrado. (Mock)</p>
                    <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        + Novo anexo
                    </Button>
                </div>
            );
        case 8: // Mídias
            return (
                <>
                    <div className="flex border-b border-gray-200 mb-4">
                        <button className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center"><Image className="w-4 h-4 mr-1" /> Imagens ({images.length})</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}><List className="w-4 h-4 mr-1" /> Plantas (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}>Tour 360 (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}>Vídeos (0)</button>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        disabled={!isEditing}
                    />
                    
                    <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 flex items-center"
                        disabled={!isEditing}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar imagem
                    </Button>
                    
                    {images.length > 0 && (
                        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4 mb-4">
                                <label className="flex items-center space-x-2 text-sm font-medium">
                                    <Checkbox 
                                        id="select-all" 
                                        checked={selectedImageIds.length === images.length && images.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        className="w-5 h-5 text-blue-600 border-gray-400"
                                        disabled={!isEditing}
                                    />
                                    <span>Selecionar ({selectedImageIds.length})</span>
                                </label>
                                <ActionsDropdown 
                                    onAction={handleAction} 
                                    disabled={selectedImageIds.length === 0 || !isEditing} 
                                    selectedCount={selectedImageIds.length}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {images.map(img => (
                                    <ImageCard 
                                        key={img.id}
                                        image={img}
                                        onSelect={handleImageSelect}
                                        onLegendChange={handleLegendUpdate}
                                        isSelected={selectedImageIds.includes(img.id)}
                                        disabled={!isEditing}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        case 9:
            return (
                <>
                    <TextInput label="Etiquetas" id="etiquetas" value={formData.etiquetas} onChange={handleInputChange} placeholder="Selecione ou pesquise etiquetas" disabled={!isEditing} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Dormitórios <RequiredAsterisk /></label>
                            {renderRadioGroup('dormitorios', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Quantos são suítes? <RequiredAsterisk /></label>
                            {renderRadioGroup('suites', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Banheiros <RequiredAsterisk /></label>
                            {renderRadioGroup('banheiros', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Vagas de garagem <RequiredAsterisk /></label>
                            {renderRadioGroup('vagas_garagem', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Condição <RequiredAsterisk /></label>
                            {renderRadioGroup('condicao', conditionOptions, true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Mobiliado</label>
                            {renderRadioGroup('mobiliado', ['Não', 'Sim', 'Semimobiliado'])}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Orientação solar</label>
                            {renderRadioGroup('orientacao_solar', orientationOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Posição</label>
                            {renderRadioGroup('posicao', ['Frente', 'Lateral', 'Fundos'])}
                        </div>
                        <TextInput label="Entrega da obra" id="entrega_obra" type="date" value={formData.entrega_obra} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <NumberInput label={<span>Área Privativa (m²) <RequiredAsterisk /></span>} id="area_privativa_m2" value={formData.area_privativa_m2} onChange={handleInputChange} placeholder="0" disabled={!isEditing} />
                        <NumberInput label="Pessoas / Acomodações" id="pessoas_acomodacoes" value={formData.pessoas_acomodacoes} onChange={handleInputChange} placeholder="Informe o número de pessoas" disabled={!isEditing} />
                        <NumberInput label="Distância para o mar (m)" id="distancia_mar_m" value={formData.distancia_mar_m} onChange={handleInputChange} placeholder="0" disabled={!isEditing} />
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Tipo de piso</h3>
                    {renderPisoCheckboxGroup(floorTypes)}
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Título no site e portais</h3>
                    <TextInput label="" id="titulo_site" value={formData.titulo_site} onChange={handleInputChange} placeholder="Título do anúncio" disabled={!isEditing} />
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Descrição no site e portais</h3>
                    <textarea 
                        id="descricao_site" 
                        rows={5} 
                        value={formData.descricao_site}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        disabled={!isEditing}
                    ></textarea>
                    <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        Gerar descrição agora (Mock IA)
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Meta title" id="meta_title" value={formData.meta_title} onChange={handleInputChange} placeholder="Meta title" disabled={!isEditing} />
                        <TextInput label="Meta description" id="meta_description" value={formData.meta_description} onChange={handleInputChange} placeholder="Meta description" disabled={!isEditing} />
                    </div>
                </>
            );
        case 10: // Sites e portais
            return (
                <>
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm text-yellow-800 mb-4">
                        Não é possível anunciar um imóvel sem contratos disponíveis, caso já exista um anúncio ativo, o mesmo será removido.
                    </div>
                    <label className="flex items-center space-x-2 text-sm font-medium mb-4">
                        <Checkbox id="select_all_portals" disabled={!isEditing} />
                        <span>Selecionar todos (Mock)</span>
                    </label>
                    
                    {/* Mock de Portais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-dark-text">jetlar.com</h4>
                            <p className="text-sm text-red-600 mt-2">Não possui anúncios disponíveis</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-white">
                            <label className="flex items-center space-x-2 font-semibold text-dark-text">
                                <Checkbox id="imperialparis_portal" checked disabled={!isEditing} />
                                <span>imperialparis.com</span>
                            </label>
                            <div className="space-y-2 mt-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                    <option>Sem destaque</option>
                                </select>
                                <p className="text-xs text-light-text">Data de inclusão: 28/10/2025</p>
                                <p className="text-xs text-light-text">Data de remoção: -</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        case 11:
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-light-text">Status de aprovação <RequiredAsterisk /></h3>
                        {renderRadioGroup('status_aprovacao', approvalOptions)}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Observações</label>
                        <textarea 
                            id="observacoes_aprovacao" 
                            rows={3} 
                            value={formData.observacoes_aprovacao}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            disabled={!isEditing}
                        ></textarea>
                    </div>
                </div>
            );
        default:
            return <p>Passo não encontrado.</p>;
    }
};

export default ImovelFormSteps;