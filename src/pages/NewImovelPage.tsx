import React, { useState, useCallback, useEffect } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImovelInput, SimNao, Disponibilidade, SimNaoSemimobiliado, Financiavel, VisibilidadeMapa, StatusAprovacao } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import ImovelStep from '../components/ImovelStep';
import TextInput from '../components/TextInput';
import NumberInput from '../components/NumberInput';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox'; // Mantendo o import para outros usos
import { useCepLookup } from '../../hooks/useCepLookup';
import MapDisplay from '../components/MapDisplay'; // Importando o novo componente

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
const occupationOptions = ['Desocupado', 'Ocupado', 'Em reforma'];
const floorOptions = ['Nenhum', 'Térreo', '1º Andar', '2º Andar', '3º Andar'];
const orientationOptions = ['Norte', 'Sul', 'Leste', 'Oeste'];
const floorTypes = ['Aquecido', 'Carpete', 'Laminado', 'Tabuão', 'Ardósia', 'Cerâmico', 'Mármore', 'Usina', 'Associado', 'Flutuante', 'Parquet', 'Vinílico', 'Granito', 'Bruto', 'Porcelanato'];
const booleanOptions = ['Sim', 'Não'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const approvalOptions = ['Aprovado', 'Não aprovado', 'Aguardando'];

// Helper para gerar código randômico de 5 dígitos
const generateRandomCode = () => String(Math.floor(10000 + Math.random() * 90000));

// --- Initial State ---
const getInitialState = (): ImovelInput => ({
    tipo_imovel: '',
    codigo: generateRandomCode(), // Código randômico inicial
    venda_ativo: false, // REMOVIDA PRÉ-SELEÇÃO
    venda_disponibilidade: 'Disponível',
    venda_motivo_indisponibilidade: '',
    locacao_ativo: false,
    locacao_disponibilidade: 'Indisponível',
    locacao_motivo_indisponibilidade: '',
    temporada_ativo: false,
    temporada_disponibilidade: 'Indisponível',
    temporada_motivo_indisponibilidade: '',

    // Step 2: Localização
    condominio_id: '',
    bloco_torre: '',
    cep: '',
    estado: 'RS', // Usando sigla padrão
    cidade: 'Pelotas',
    bairro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    referencia: '',
    andar: 'Nenhum',
    ultimo_andar: 'Não',
    mapa_visibilidade: 'Exata',

    // Step 3: Valores
    valor_venda: 0,
    valor_locacao: 0,
    valor_condominio: 0,
    condominio_isento: false,
    valor_iptu: 0,
    iptu_isento: false,
    seguro_incendio: 0,
    taxa_limpeza: 0,
    indice_reajuste: 'IGP-M',
    valor_base: 0,
    iptu_periodo: 'Mensal',
    financiavel: 'Não',

    // Step 4: Visibilidade
    vis_endereco: 'Todas acima incluindo logradouro',
    vis_venda: 'Visível',
    vis_locacao: 'Invisível',
    vis_temporada: 'Invisível',
    vis_iptu: 'Invisível',
    vis_condominio: 'Invisível',

    // Step 5: Dados não visíveis no site
    proprietario_id: '',
    comissao_proprietario_percent: 100,
    periodo_email_atualizacao: 30,
    enviar_email_atualizacao: true,
    agenciador_id: '',
    responsavel_id: '',
    honorarios_venda_percent: 0,
    honorarios_locacao_percent: 0,
    honorarios_temporada_percent: 0,
    data_agenciamento: new Date().toISOString().split('T')[0],
    numero_matricula: '',
    nao_possui_matricula: false,
    numero_iptu: '',
    vencimento_exclusividade: '',
    ocupacao: 'Desocupado',
    exclusivo: 'Não',
    placa: 'Não',
    medidor_energia: '',
    medidor_agua: '',
    medidor_gas: '',
    observacoes_internas: '',

    // Step 9: Características
    etiquetas: '',
    dormitorios: 0,
    suites: 0,
    banheiros: 0,
    vagas_garagem: 0,
    condicao: 'Usado',
    mobiliado: 'Não',
    orientacao_solar: 'Norte',
    posicao: 'Frente',
    entrega_obra: '',
    pessoas_acomodacoes: 0,
    distancia_mar_m: 0,
    tipos_piso: [],
    titulo_site: '',
    descricao_site: '',
    meta_title: '',
    meta_description: '',

    // Step 11: Aprovação do imóvel
    status_aprovacao: 'Aguardando',
    observacoes_aprovacao: '',
});

const TOTAL_STEPS = 11;

const NewImovelPage: React.FC = () => {
    const { supabase, session } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ImovelInput>(getInitialState());
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
    
    const { data: cepData, loading: cepLoading, error: cepError, lookup: lookupCep } = useCepLookup();

    // Scroll to the active step whenever it changes
    useEffect(() => {
        const activeStepElement = document.getElementById(`imovel-step-${step}`);
        if (activeStepElement) {
            activeStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [step]);

    // Efeito para revalidar o passo atual sempre que o formData mudar
    useEffect(() => {
        const isValid = validateStep(formData, step, false);
        setIsCurrentStepValid(isValid);
    }, [formData, step]);

    // Efeito para preencher o formulário quando o CEP é encontrado
    useEffect(() => {
        if (cepData) {
            setFormData(prev => ({
                ...prev,
                logradouro: cepData.logradouro || prev.logradouro,
                bairro: cepData.bairro || prev.bairro,
                cidade: cepData.localidade || prev.cidade,
                estado: cepData.uf || prev.estado,
                cep: cepData.cep || prev.cep,
            }));
        }
    }, [cepData]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type, checked } = e.target as HTMLInputElement;

        setFormData(prev => {
            let newValue: any = value;

            if (type === 'checkbox') {
                // Checkboxes que não são de finalidade (como isento, enviar_email_atualizacao)
                newValue = checked;
            } else if (type === 'number' || id.includes('valor') || id.includes('percent') || id.includes('periodo') || id.includes('acomodacoes') || id.includes('distancia')) {
                // Handle numeric inputs, including those using NumberInput (which passes clean numeric string)
                newValue = value === '' ? 0 : parseFloat(value);
            } else if (id === 'dormitorios' || id === 'suites' || id === 'banheiros' || id === 'vagas_garagem') {
                 // Handle radio groups for numbers
                 newValue = parseInt(value) || 0;
            }
            
            return { ...prev, [id]: newValue };
        });
        setValidationError(null); // Limpa o erro ao digitar
    }, []);
    
    const handleRadioChange = useCallback((name: keyof ImovelInput, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setValidationError(null);
    }, []);
    
    const handleCheckboxGroupChange = useCallback((field: keyof ImovelInput, value: string) => {
        setFormData(prev => {
            const currentArray = (prev[field] as string[]) || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
        setValidationError(null);
    }, []);
    
    const handleFinalidadeToggle = useCallback((field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: checked };
            
            // Verifica quantas finalidades estariam ativas APÓS a mudança
            const activeCount = (newState.venda_ativo ? 1 : 0) + (newState.locacao_ativo ? 1 : 0) + (newState.temporada_ativo ? 1 : 0);
            
            if (activeCount === 0) {
                // Se tentar desativar a última, impede a ação e define um erro
                setValidationError('Pelo menos uma finalidade (Venda, Locação ou Temporada) deve estar ativa.');
                return prev; // Retorna o estado anterior
            }
            
            setValidationError(null);
            return newState; // Retorna o novo estado
        });
    }, []);

    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const cep = e.target.value;
        handleInputChange(e); // Atualiza o estado do CEP no formulário
        
        if (cep.replace(/\D/g, '').length === 8) {
            lookupCep(cep);
        }
    }, [handleInputChange, lookupCep]);


    const validateStep = useCallback((currentData: ImovelInput, currentStep: number, shouldSetError: boolean = true): boolean => {
        let errors: string[] = [];

        switch (currentStep) {
            case 1: // Dados do Imóvel
                if (!currentData.tipo_imovel) errors.push('O tipo do imóvel é obrigatório.');
                if (!currentData.codigo) errors.push('O código do imóvel é obrigatório.');
                
                const activeCount = (currentData.venda_ativo ? 1 : 0) + (currentData.locacao_ativo ? 1 : 0) + (currentData.temporada_ativo ? 1 : 0);
                if (activeCount === 0) {
                    errors.push('Pelo menos uma finalidade deve estar ativa.');
                }
                
                if (currentData.venda_ativo && currentData.venda_disponibilidade === 'Indisponível' && !currentData.venda_motivo_indisponibilidade) {
                    errors.push('O motivo de indisponibilidade de venda é obrigatório.');
                }
                // Adicionar validações para locação e temporada se ativos
                break;
            case 2: // Localização
                if (!currentData.cep || currentData.cep.replace(/\D/g, '').length !== 8) errors.push('O CEP é obrigatório e deve ter 8 dígitos.');
                if (!currentData.bairro) errors.push('O bairro é obrigatório.');
                if (!currentData.logradouro) errors.push('O logradouro é obrigatório.');
                if (!currentData.numero) errors.push('O número é obrigatório.');
                break;
            case 3: // Valores
                if (currentData.venda_ativo && currentData.valor_venda <= 0) errors.push('O valor de venda deve ser maior que zero se a venda estiver ativa.');
                if (currentData.locacao_ativo && currentData.valor_locacao <= 0) errors.push('O valor de locação deve ser maior que zero se a locação estiver ativa.');
                break;
            case 5: // Dados não visíveis no site
                if (!currentData.proprietario_id) errors.push('O proprietário é obrigatório.');
                if (!currentData.agenciador_id) errors.push('O agenciador é obrigatório.');
                if (!currentData.responsavel_id) errors.push('O responsável é obrigatório.');
                if (!currentData.data_agenciamento) errors.push('A data de agenciamento é obrigatória.');
                break;
            case 9: // Características
                if (currentData.dormitorios === undefined || currentData.dormitorios < 0) errors.push('O número de dormitórios é obrigatório.');
                if (currentData.suites === undefined || currentData.suites < 0) errors.push('O número de suítes é obrigatório.');
                if (currentData.banheiros === undefined || currentData.banheiros < 0) errors.push('O número de banheiros é obrigatório.');
                if (currentData.vagas_garagem === undefined || currentData.vagas_garagem < 0) errors.push('O número de vagas de garagem é obrigatório.');
                if (!currentData.condicao) errors.push('A condição do imóvel é obrigatória.');
                break;
            case 11: // Aprovação
                if (!currentData.status_aprovacao) errors.push('O status de aprovação é obrigatório.');
                break;
        }

        if (errors.length > 0) {
            if (shouldSetError) {
                setValidationError(errors.join(' '));
            }
            return false;
        }
        if (shouldSetError) {
            setValidationError(null);
        }
        return true;
    }, []);

    const handleNext = () => {
        if (validateStep(formData, step, true)) {
            setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setValidationError(null); // Limpa o erro ao voltar
    };
    
    const handleSubmit = async () => {
        if (!validateStep(formData, TOTAL_STEPS, true)) return;
        if (!session) {
            alert('Você precisa estar logado para salvar o imóvel.');
            return;
        }

        setIsSaving(true);
        
        // Estruturando os dados para o Supabase (separando em JSONB)
        const { 
            tipo_imovel, codigo, bairro, logradouro, numero, status_aprovacao,
            // Dados de Contrato
            venda_ativo, venda_disponibilidade, venda_motivo_indisponibilidade,
            locacao_ativo, locacao_disponibilidade, locacao_motivo_indisponibilidade,
            temporada_ativo, temporada_disponibilidade, temporada_motivo_indisponibilidade,
            // Dados de Localização
            cep, estado, cidade, condominio_id, bloco_torre, complemento, referencia, andar, ultimo_andar, mapa_visibilidade,
            // Dados de Valores
            valor_venda, valor_locacao, valor_condominio, condominio_isento, valor_iptu, iptu_isento, seguro_incendio, taxa_limpeza, indice_reajuste, valor_base, iptu_periodo, financiavel,
            // Dados Internos (inclui Visibilidade e Dados não visíveis)
            proprietario_id, comissao_proprietario_percent, periodo_email_atualizacao, enviar_email_atualizacao, agenciador_id, responsavel_id, honorarios_venda_percent, honorarios_locacao_percent, honorarios_temporada_percent, data_agenciamento, numero_matricula, nao_possui_matricula, numero_iptu, vencimento_exclusividade, ocupacao, exclusivo, placa, medidor_energia, medidor_agua, medidor_gas, observacoes_internas,
            // Dados de Características (inclui Visibilidade de Site)
            etiquetas, dormitorios, suites, banheiros, vagas_garagem, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
            // Observações de Aprovação
            observacoes_aprovacao,
        } = formData;

        const imovelData = {
            user_id: session.user.id,
            codigo,
            tipo_imovel,
            bairro,
            logradouro,
            numero,
            status_aprovacao,
            
            dados_contrato: {
                venda_ativo, venda_disponibilidade, venda_motivo_indisponibilidade,
                locacao_ativo, locacao_disponibilidade, locacao_motivo_indisponibilidade,
                temporada_ativo, temporada_disponibilidade, temporada_motivo_indisponibilidade,
            },
            dados_localizacao: {
                cep, estado, cidade, condominio_id, bloco_torre, complemento, referencia, andar, ultimo_andar, mapa_visibilidade,
            },
            dados_valores: {
                valor_venda, valor_locacao, valor_condominio, condominio_isento, valor_iptu, iptu_isento, seguro_incendio, taxa_limpeza, indice_reajuste, valor_base, iptu_periodo, financiavel,
            },
            dados_internos: {
                proprietario_id, comissao_proprietario_percent, periodo_email_atualizacao, enviar_email_atualizacao, agenciador_id, responsavel_id, honorarios_venda_percent, honorarios_locacao_percent, honorarios_temporada_percent, data_agenciamento, numero_matricula, nao_possui_matricula, numero_iptu, vencimento_exclusividade, ocupacao, exclusivo, placa, medidor_energia, medidor_agua, medidor_gas, observacoes_internas,
            },
            dados_caracteristicas: {
                etiquetas, dormitorios, suites, banheiros, vagas_garagem, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
            },
        };

        const { error } = await supabase.from('imoveis').insert(imovelData);

        setIsSaving(false);

        if (error) {
            console.error('Erro ao salvar imóvel:', error);
            alert(`Erro ao salvar o imóvel: ${error.message}`);
        } else {
            alert('Imóvel cadastrado com sucesso!');
            navigate('/crm/imoveis'); // Redireciona para a listagem após o sucesso
        }
    };

    // Helper function to render radio groups
    const renderRadioGroup = (name: keyof ImovelInput, options: (string | number)[], required = false) => (
        <div className="flex flex-wrap gap-4">
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
                    />
                    <span>{type}</span>
                </label>
            ))}
        </div>
    );

    const renderStepContent = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Tipo do imóvel *</label>
                                <select 
                                    id="tipo_imovel"
                                    value={formData.tipo_imovel}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-400"
                                >
                                    <option value="">Escolha o tipo do imóvel</option>
                                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <TextInput label="Código *" id="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="52564" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {/* Venda */}
                            <div className="p-3 border rounded-lg space-y-2">
                                <label htmlFor="venda_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="venda_ativo"
                                        checked={formData.venda_ativo}
                                        onChange={(e) => handleFinalidadeToggle('venda_ativo', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span>Venda</span>
                                </label>
                                <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                                {renderRadioGroup('venda_disponibilidade', ['Disponível', 'Indisponível'])}
                                <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                                <select 
                                    id="venda_motivo_indisponibilidade"
                                    value={formData.venda_motivo_indisponibilidade}
                                    onChange={handleInputChange}
                                    disabled={formData.venda_disponibilidade === 'Disponível' || !formData.venda_ativo}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                >
                                    <option value="">Escolha o motivo da indisponibilidade</option>
                                    {motives.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            
                            {/* Locação */}
                            <div className="p-3 border rounded-lg space-y-2">
                                <label htmlFor="locacao_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="locacao_ativo"
                                        checked={formData.locacao_ativo}
                                        onChange={(e) => handleFinalidadeToggle('locacao_ativo', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span>Locação</span>
                                </label>
                                <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                                {renderRadioGroup('locacao_disponibilidade', ['Disponível', 'Indisponível'])}
                                <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                                <select 
                                    id="locacao_motivo_indisponibilidade"
                                    value={formData.locacao_motivo_indisponibilidade}
                                    onChange={handleInputChange}
                                    disabled={formData.locacao_disponibilidade === 'Disponível' || !formData.locacao_ativo}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                >
                                    <option value="">Escolha o motivo da indisponibilidade</option>
                                    {motives.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            
                            {/* Temporada */}
                            <div className="p-3 border rounded-lg space-y-2">
                                <label htmlFor="temporada_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="temporada_ativo"
                                        checked={formData.temporada_ativo}
                                        onChange={(e) => handleFinalidadeToggle('temporada_ativo', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span>Temporada</span>
                                </label>
                                <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                                {renderRadioGroup('temporada_disponibilidade', ['Disponível', 'Indisponível'])}
                                <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                                <select 
                                    id="temporada_motivo_indisponibilidade"
                                    value={formData.temporada_motivo_indisponibilidade}
                                    onChange={handleInputChange}
                                    disabled={formData.temporada_disponibilidade === 'Disponível' || !formData.temporada_ativo}
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
                // Validação de endereço para o mapa
                const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
                const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Condomínio</label>
                                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                    <option>Pesquise pelo nome do condomínio (Mock)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Bloco / Torre / Quadra</label>
                                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                    <option>Pesquise pelo nome do subcondomínio (Mock)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="relative">
                                <TextInput 
                                    label="CEP *" 
                                    id="cep" 
                                    value={formData.cep} 
                                    onChange={handleCepChange} 
                                    placeholder="99999-999" 
                                    maxLength={9}
                                />
                                {cepLoading && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pt-6">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    </div>
                                )}
                                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Estado *</label>
                                <select id="estado" value={formData.estado} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={cepLoading || !!cepData}>
                                    <option value={formData.estado}>{formData.estado}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Cidade *</label>
                                <select id="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={cepLoading || !!cepData}>
                                    <option value={formData.cidade}>{formData.cidade}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Bairro *</label>
                                <select id="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={cepLoading || !!cepData}>
                                    <option value={formData.bairro}>{formData.bairro}</option>
                                    {/* Mock de bairros se não houver CEP data */}
                                    {!cepData && neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <TextInput label="Logradouro *" id="logradouro" value={formData.logradouro} onChange={handleInputChange} placeholder="Informe o logradouro" disabled={cepLoading || !!cepData} />
                            <TextInput label="Número *" id="numero" value={formData.numero} onChange={handleInputChange} placeholder="Informe o número" />
                            <TextInput label="Complemento" id="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Informe o complemento" disabled={cepLoading || !!cepData} />
                            <TextInput label="Ponto de referência" id="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Ex: Ao lado da igreja" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Andar</label>
                                <select id="andar" value={formData.andar} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
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
                        />
                    </>
                );
            case 3:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NumberInput label="Valor de venda" id="valor_venda" isCurrency value={formData.valor_venda} onChange={handleInputChange} placeholder="R$ 0,00" />
                            <NumberInput label="Valor de locação" id="valor_locacao" isCurrency value={formData.valor_locacao} onChange={handleInputChange} placeholder="R$ 0,00" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex space-x-2 items-center">
                                <NumberInput label="Valor de condomínio" id="valor_condominio" isCurrency value={formData.valor_condominio} onChange={handleInputChange} placeholder="R$ 0,00" />
                                <label className="flex items-center space-x-1 text-sm mt-6">
                                    <Checkbox id="condominio_isento" checked={formData.condominio_isento} onCheckedChange={(checked) => setFormData(p => ({ ...p, condominio_isento: checked as boolean }))} />
                                    <span>Isento</span>
                                </label>
                            </div>
                            <div className="flex space-x-2 items-center">
                                <NumberInput label="Valor de IPTU" id="valor_iptu" isCurrency value={formData.valor_iptu} onChange={handleInputChange} placeholder="R$ 0,00" />
                                <label className="flex items-center space-x-1 text-sm mt-6">
                                    <Checkbox id="iptu_isento" checked={formData.iptu_isento} onCheckedChange={(checked) => setFormData(p => ({ ...p, iptu_isento: checked as boolean }))} />
                                    <span>Isento</span>
                                </label>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <NumberInput label="Seguro Incêndio (anual)" id="seguro_incendio" isCurrency value={formData.seguro_incendio} onChange={handleInputChange} placeholder="R$ 0,00" />
                            <NumberInput label="Taxa de limpeza" id="taxa_limpeza" isCurrency value={formData.taxa_limpeza} onChange={handleInputChange} placeholder="R$ 0,00" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Índice de reajuste</label>
                                <select id="indice_reajuste" value={formData.indice_reajuste} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                    {indexOptions.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <NumberInput label="Valor Base" id="valor_base" isCurrency value={formData.valor_base} onChange={handleInputChange} placeholder="Informe o valor base" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Período do IPTU</label>
                                {renderRadioGroup('iptu_periodo', ['Mensal', 'Anual'])}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Financiável</label>
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
                            <label className="block text-sm font-medium text-light-text">Endereço *</label>
                            <select id="vis_endereco" value={formData.vis_endereco} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Todas acima incluindo logradouro</option>
                            </select>
                        </div>
                        
                        <h3 className="text-sm font-medium text-light-text mt-4">Valores</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <TextInput label="Venda" id="vis_venda" value={formData.vis_venda} onChange={handleInputChange} placeholder="Invisível" />
                            <TextInput label="Locação" id="vis_locacao" value={formData.vis_locacao} onChange={handleInputChange} placeholder="Invisível" />
                            <TextInput label="Temporada" id="vis_temporada" value={formData.vis_temporada} onChange={handleInputChange} placeholder="Invisível" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <TextInput label="IPTU" id="vis_iptu" value={formData.vis_iptu} onChange={handleInputChange} placeholder="Invisível" />
                            <TextInput label="Condomínio" id="vis_condominio" value={formData.vis_condominio} onChange={handleInputChange} placeholder="Invisível" />
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput label="Proprietário *" id="proprietario_id" value={formData.proprietario_id} onChange={handleInputChange} placeholder="Pesquise por: Nome, CPF, Telefone (Mock)" />
                            <NumberInput label="Comissão (%)" id="comissao_proprietario_percent" value={formData.comissao_proprietario_percent} onChange={handleInputChange} placeholder="100%" />
                        </div>
                        <Button variant="outline" className="mt-2">+ Mais um proprietário (Mock)</Button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <NumberInput label="Período do email de atualização (dias)" id="periodo_email_atualizacao" value={formData.periodo_email_atualizacao} onChange={handleInputChange} placeholder="30" />
                            <label className="flex items-center space-x-2 text-sm mt-6">
                                <Checkbox id="enviar_email_atualizacao" checked={formData.enviar_email_atualizacao} onCheckedChange={(checked) => setFormData(p => ({ ...p, enviar_email_atualizacao: checked as boolean }))} />
                                <span>Enviar email de atualização</span>
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <TextInput label="Agenciador / Captador *" id="agenciador_id" value={formData.agenciador_id} onChange={handleInputChange} placeholder="Moisez Torres (Mock)" />
                            <TextInput label="Responsável / Corretor *" id="responsavel_id" value={formData.responsavel_id} onChange={handleInputChange} placeholder="Alessandro Gomes (Mock)" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <NumberInput label="Honorários Venda (%)" id="honorarios_venda_percent" value={formData.honorarios_venda_percent} onChange={handleInputChange} placeholder="0%" />
                            <NumberInput label="Honorários Locação (%)" id="honorarios_locacao_percent" value={formData.honorarios_locacao_percent} onChange={handleInputChange} placeholder="0%" />
                            <NumberInput label="Honorários Temporada (%)" id="honorarios_temporada_percent" value={formData.honorarios_temporada_percent} onChange={handleInputChange} placeholder="0%" />
                            <TextInput label="Data agenciamento *" id="data_agenciamento" type="date" value={formData.data_agenciamento} onChange={handleInputChange} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <TextInput label="Nº da matrícula" id="numero_matricula" value={formData.numero_matricula} onChange={handleInputChange} placeholder="Informe o número" />
                            <label className="flex items-center space-x-2 text-sm mt-6">
                                <Checkbox id="nao_possui_matricula" checked={formData.nao_possui_matricula} onCheckedChange={(checked) => setFormData(p => ({ ...p, nao_possui_matricula: checked as boolean }))} />
                                <span>Não possui matrícula</span>
                            </label>
                            <TextInput label="Nº do IPTU" id="numero_iptu" value={formData.numero_iptu} onChange={handleInputChange} placeholder="Informe o IPTU" />
                            <TextInput label="Vencimento da exclusividade" id="vencimento_exclusividade" type="date" value={formData.vencimento_exclusividade} onChange={handleInputChange} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Ocupação *</label>
                                <select id="ocupacao" value={formData.ocupacao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
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
                            <TextInput label="Nº medidor energia" id="medidor_energia" value={formData.medidor_energia} onChange={handleInputChange} placeholder="Informe o Nº da energia" />
                            <TextInput label="Nº medidor água" id="medidor_agua" value={formData.medidor_agua} onChange={handleInputChange} placeholder="Informe o Nº da água" />
                            <TextInput label="Nº medidor gás" id="medidor_gas" value={formData.medidor_gas} onChange={handleInputChange} placeholder="Informe o Nº do gás" />
                        </div>
                        
                        <div className="space-y-2 mt-4">
                            <label className="block text-sm font-medium text-light-text">Observações internas</label>
                            <textarea 
                                id="observacoes_internas" 
                                rows={3} 
                                value={formData.observacoes_internas}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            ></textarea>
                        </div>
                    </>
                );
            case 6: // Chaves
                return (
                    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-light-text">Nenhuma chave vinculada a este imóvel. (Mock)</p>
                        <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            + Nova chave
                        </Button>
                    </div>
                );
            case 7: // Documentos Anexados
                return (
                    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-light-text">Nenhum documento anexado encontrado. (Mock)</p>
                        <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            + Novo anexo
                        </Button>
                    </div>
                );
            case 8: // Mídias
                return (
                    <>
                        <div className="flex border-b border-gray-200 mb-4">
                            <button className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center"><Image className="w-4 h-4 mr-1" /> Imagens (0)</button>
                            <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center"><List className="w-4 h-4 mr-1" /> Plantas (0)</button>
                            <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center">Tour 360 (0)</button>
                            <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center">Vídeos (0)</button>
                        </div>
                        <Button variant="outline" className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            + Adicionar Imagem
                        </Button>
                    </>
                );
            case 9:
                return (
                    <>
                        <TextInput label="Etiquetas" id="etiquetas" value={formData.etiquetas} onChange={handleInputChange} placeholder="Selecione ou pesquise etiquetas" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Dormitórios *</label>
                                {renderRadioGroup('dormitorios', [0, 1, 2, 3, 4, 5])}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Quantos são suítes? *</label>
                                {renderRadioGroup('suites', [0, 1, 2, 3, 4, 5])}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Banheiros *</label>
                                {renderRadioGroup('banheiros', [0, 1, 2, 3, 4, 5])}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Vagas de garagem *</label>
                                {renderRadioGroup('vagas_garagem', [0, 1, 2, 3, 4, 5])}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Condição *</label>
                                {renderRadioGroup('condicao', conditionOptions)}
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
                            <TextInput label="Entrega da obra" id="entrega_obra" type="date" value={formData.entrega_obra} onChange={handleInputChange} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <NumberInput label="Pessoas / Acomodações" id="pessoas_acomodacoes" value={formData.pessoas_acomodacoes} onChange={handleInputChange} placeholder="Informe o número de pessoas" />
                            <NumberInput label="Distância para o mar (m)" id="distancia_mar_m" value={formData.distancia_mar_m} onChange={handleInputChange} placeholder="0" />
                        </div>
                        
                        <h3 className="text-sm font-medium text-light-text mt-6">Tipo de piso</h3>
                        {renderPisoCheckboxGroup(floorTypes)}
                        
                        <h3 className="text-sm font-medium text-light-text mt-6">Título no site e portais</h3>
                        <TextInput label="" id="titulo_site" value={formData.titulo_site} onChange={handleInputChange} placeholder="Título do anúncio" />
                        
                        <h3 className="text-sm font-medium text-light-text mt-4">Descrição no site e portais</h3>
                        <textarea 
                            id="descricao_site" 
                            rows={5} 
                            value={formData.descricao_site}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                        ></textarea>
                        <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            Gerar descrição agora (Mock IA)
                        </Button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <TextInput label="Meta title" id="meta_title" value={formData.meta_title} onChange={handleInputChange} placeholder="Meta title" />
                            <TextInput label="Meta description" id="meta_description" value={formData.meta_description} onChange={handleInputChange} placeholder="Meta description" />
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
                            <Checkbox id="select_all_portals" />
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
                                    <Checkbox id="imperialparis_portal" checked />
                                    <span>imperialparis.com</span>
                                </label>
                                <div className="space-y-2 mt-2">
                                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
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
                            <h3 className="text-sm font-medium text-light-text">Status de aprovação *</h3>
                            {renderRadioGroup('status_aprovacao', approvalOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Observações</label>
                            <textarea 
                                id="observacoes_aprovacao" 
                                rows={3} 
                                value={formData.observacoes_aprovacao}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            ></textarea>
                        </div>
                    </div>
                );
            default:
                return <p>Passo não encontrado.</p>;
        }
    };
    
    const getStepTitle = (currentStep: number) => {
        const titles = [
            { icon: <Home className="w-5 h-5 mr-2" />, text: 'Dados do Imóvel' },
            { icon: <MapPin className="w-5 h-5 mr-2" />, text: 'Localização' },
            { icon: <DollarSign className="w-5 h-5 mr-2" />, text: 'Valores' },
            { icon: <Eye className="w-5 h-5 mr-2" />, text: 'Visibilidade' },
            { icon: <Lock className="w-5 h-5 mr-2" />, text: 'Dados não visíveis no site' },
            { icon: <Key className="w-5 h-5 mr-2" />, text: 'Chaves (Placeholder)' },
            { icon: <FileText className="w-5 h-5 mr-2" />, text: 'Documentos Anexados (Placeholder)' },
            { icon: <Image className="w-5 h-5 mr-2" />, text: 'Mídias (Placeholder)' },
            { icon: <List className="w-5 h-5 mr-2" />, text: 'Características' },
            { icon: <Zap className="w-5 h-5 mr-2" />, text: 'Sites e portais (Placeholder)' },
            { icon: <CheckCircle className="w-5 h-5 mr-2" />, text: 'Aprovação do imóvel' },
        ];
        const titleData = titles[currentStep - 1];
        return <span className="flex items-center">{titleData.icon} {titleData.text}</span>;
    };

    const allSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-dark-text flex items-center">
                <Home className="w-6 h-6 mr-2 text-blue-600" /> INÍCIO &gt; IMÓVEIS &gt; NOVO
            </h1>
            
            {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-4xl mx-auto">
                    <p className="font-semibold">Erro de Validação:</p>
                    <p className="text-sm">{validationError}</p>
                </div>
            )}

            {/* Renderiza todos os passos */}
            {allSteps.map(currentStep => (
                <div 
                    key={currentStep} 
                    id={`imovel-step-${currentStep}`}
                    // Aplica opacidade e desativa cliques se não for o passo ativo
                    className={`transition-opacity duration-500 ${currentStep === step ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                >
                    <ImovelStep
                        title={getStepTitle(currentStep)}
                        step={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSave={handleSubmit}
                        isLastStep={currentStep === TOTAL_STEPS}
                        isFirstStep={currentStep === 1}
                        isStepValid={currentStep === step ? isCurrentStepValid : true} // Apenas o passo atual precisa ser validado
                        isSaving={isSaving}
                    >
                        {renderStepContent(currentStep)}
                    </ImovelStep>
                </div>
            ))}
        </div>
    );
};

export default NewImovelPage;