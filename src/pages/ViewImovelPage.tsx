import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus, Edit, Save, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImovelInput, SimNao, Disponibilidade, SimNaoSemimobiliado, Financiavel, VisibilidadeMapa, StatusAprovacao, Ocupacao, ImovelImage } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import ImovelStep from '../components/ImovelStep';
import TextInput from '../components/TextInput';
import NumberInput from '../components/NumberInput';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { useCepLookup } from '../../hooks/useCepLookup';
import { useNominatimLookup } from '../../hooks/useNominatimLookup';
import MapDisplay from '../components/MapDisplay';
import ToggleSwitch from '../components/ToggleSwitch';
import ImageCard from '../components/ImageCard';
import ActionsDropdown from '../components/ActionsDropdown';
import { uploadImovelMedia, saveMediaMetadata } from '../utils/media';
import ImageCarousel from '../components/ImageCarousel'; // Importar o ImageCarousel

// --- Mock Data ---
const propertyTypes = [
    'Apartamento', 'Apartamento Garden', 'Box', 'Campo', 'Casa', 'Casa Comercial', 
    'Casa de Condomínio', 'Chácara', 'Cobertura', 'Conjunto Comercial', 'Duplex', 
    'Fazenda', 'Flat', 'Galpão', 'Geminado', 'Haras', 'Hotel', 'Kitnet', 'Loft', 
    'Loja', 'Ponto Comercial', 'Pousada', 'Prédio Comercial', 
    'Prédio Residencial', 'Sala Comercial', 'Salão Comercial', 'Sobrado', 'Studio', 
    'Sítio', 'Terreno', 'Terreno Comercial', 'Triplex', 'Área Rural'
];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const motives = ['Vendido', 'Alugado', 'Retirado pelo proprietário'];
const indexOptions = ['IGP-M', 'IPCA', 'FIPE'];
const occupationOptions: Ocupacao[] = ['Desocupado', 'Ocupado', 'Locado'];
const floorOptions = ['Nenhum', 'Térreo', '1º Andar', '2º Andar', '3º Andar'];
const orientationOptions = ['Norte', 'Sul', 'Leste', 'Oeste'];
const floorTypes = ['Aquecido', 'Carpete', 'Laminado', 'Tabuão', 'Ardósia', 'Cerâmico', 'Mármore', 'Usina', 'Associado', 'Flutuante', 'Parquet', 'Vinílico', 'Granito', 'Bruto', 'Porcelanato'];
const booleanOptions = ['Sim', 'Não'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const approvalOptions = ['Aprovado', 'Não aprovado', 'Aguardando'];

// Opções de visibilidade de endereço (Passo 4)
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

const TOTAL_STEPS = 11;

const ViewImovelPage: React.FC = () => {
    const { supabase, session } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const imovelId = searchParams.get('id');

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ImovelInput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // --- Estado de Mídias ---
    const [images, setImages] = useState<ImovelImage[]>([]);
    const [initialImages, setInitialImages] = useState<ImovelImage[]>([]); // Para comparar e detectar exclusões
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { data: cepData, loading: cepLoading, error: cepError, lookup: lookupCep } = useCepLookup();
    const { 
        location: nominatimLocation, 
        loading: nominatimLoading, 
        error: nominatimError, 
        lookup: lookupNominatim 
    } = useNominatimLookup();

    // --- Função para buscar dados do imóvel ---
    const fetchImovelData = useCallback(async () => {
        if (!imovelId || !session) return;

        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                *,
                imovel_media(id, url, legend, is_visible, rotation, ordem)
            `)
            .eq('id', imovelId)
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            console.error('Erro ao buscar imóvel:', error);
            alert('Não foi possível carregar os dados do imóvel.');
            navigate('/crm/imoveis');
            return;
        }

        // Mapear dados para o formato do formulário
        const mappedData: ImovelInput = {
            ...data,
            // Desestrutar campos JSONB
            ...data.dados_contrato,
            ...data.dados_localizacao,
            ...data.dados_valores,
            ...data.dados_internos,
            ...data.dados_caracteristicas,
        };

        setFormData(mappedData);

        // Mapear mídias para o estado de imagens e ordenar por 'ordem'
        const mappedImages: ImovelImage[] = data.imovel_media
            .map((media: any) => ({
                id: media.id, // Usar o ID do Supabase para imagens existentes
                url: media.url,
                file: null, // Imagem existente não tem arquivo
                legend: media.legend,
                isVisible: media.is_visible,
                rotation: media.rotation,
                ordem: media.ordem,
            }))
            .sort((a: ImovelImage, b: ImovelImage) => a.ordem - b.ordem); // Ordenar aqui

        setImages(mappedImages);
        setInitialImages(mappedImages); // Salvar estado inicial das imagens para comparação

    }, [imovelId, session, navigate]);

    useEffect(() => {
        fetchImovelData();
    }, [fetchImovelData]);

    // --- Lógica de Mídias (similar à NewImovelPage) ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && isEditing) {
            const newFiles = Array.from(e.target.files);
            const newImages: ImovelImage[] = newFiles.map(file => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file),
                file: file,
                legend: '',
                isVisible: true,
                rotation: 0,
                ordem: images.length > 0 ? Math.max(...images.map(img => img.ordem)) + 1 : 0, // Atribui a próxima ordem disponível
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const handleImageSelect = (id: string, isSelected: boolean) => {
        setSelectedImageIds(prev => 
            isSelected ? [...prev, id] : prev.filter(imgId => imgId !== id)
        );
    };
    
    const handleLegendUpdate = (id: string, legend: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, legend } : img));
    };

    const handleAction = (action: string) => {
        if (selectedImageIds.length === 0 || !isEditing) {
            alert('Selecione pelo menos uma imagem para realizar esta ação.');
            return;
        }

        setImages(prev => {
            let newImages = [...prev];
            
            if (action === 'delete') {
                newImages = newImages.filter(img => !selectedImageIds.includes(img.id));
                selectedImageIds.forEach(id => {
                    const img = prev.find(i => i.id === id);
                    if (img && img.url.startsWith('blob:')) {
                        URL.revokeObjectURL(img.url);
                    }
                });
                setSelectedImageIds([]);
                alert(`${selectedImageIds.length} imagem(ns) excluída(s).`);
            } else if (action === 'show') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, isVisible: true } : img);
            } else if (action === 'hide') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, isVisible: false } : img);
            } else if (action === 'rotate90') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, rotation: (img.rotation + 90) % 360 } : img);
            } else if (action === 'rotate180') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, rotation: (img.rotation + 180) % 360 } : img);
            }
            
            return newImages;
        });
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedImageIds(images.map(img => img.id));
        } else {
            setSelectedImageIds([]);
        }
    };

    // --- Handlers de Formulário (similar à NewImovelPage) ---
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!formData || !isEditing) return;
        
        const { id, value, type, checked } = e.target as HTMLInputElement;

        setFormData(prev => {
            if (!prev) return null;
            
            let newValue: any = value;

            if (type === 'checkbox') {
                newValue = checked;
            } else if (type === 'number' || id.includes('valor') || id.includes('percent') || id.includes('periodo') || id.includes('acomodacoes') || id.includes('distancia') || id.includes('area')) {
                newValue = value === '' ? 0 : parseFloat(value);
            } else if (id === 'dormitorios' || id === 'suites' || id === 'banheiros' || id === 'vagas_garagem') {
                 newValue = parseInt(value) || 0;
            }
            
            return { ...prev, [id]: newValue };
        });
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleRadioChange = useCallback((name: keyof ImovelInput, value: string) => {
        if (!formData || !isEditing) return;
        setFormData(prev => prev ? { ...prev, [name]: value as any } : null);
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleToggleChange = useCallback((name: 'vis_venda' | 'vis_locacao' | 'vis_temporada', checked: boolean) => {
        if (!formData || !isEditing) return;
        setFormData(prev => prev ? { ...prev, [name]: checked ? 'Visível' : 'Invisível' } : null);
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleCheckboxGroupChange = useCallback((field: keyof ImovelInput, value: string) => {
        if (!formData || !isEditing) return;
        setFormData(prev => {
            if (!prev) return null;
            const currentArray = (prev[field] as string[]) || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray };
        });
    }, [formData, isEditing]);
    
    const handleFinalidadeToggle = useCallback((field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => {
        if (!formData || !isEditing) return;
        setFormData(prev => {
            if (!prev) return null;
            const newState = { ...prev, [field]: checked };
            
            const activeCount = (newState.venda_ativo ? 1 : 0) + (newState.locacao_ativo ? 1 : 0) + (newState.temporada_ativo ? 1 : 0);
            
            if (activeCount === 0) {
                setValidationError('Pelo menos uma finalidade (Venda, Locação ou Temporada) deve estar ativa.');
                return prev;
            }
            
            setValidationError(null);
            return newState;
        });
    }, [formData, isEditing]);

    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        const cep = e.target.value;
        handleInputChange(e);
        
        if (cep.replace(/\D/g, '').length === 8) {
            lookupCep(cep);
        }
    }, [handleInputChange, lookupCep, isEditing]);

    // --- Handlers de Navegação e Salvamento ---
    const handleNext = () => {
        if (!validateStep(formData, step, true)) return;
        setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setValidationError(null);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        fetchImovelData(); // Recarrega dados para descartar alterações não salvas
    };

    const handleSave = async () => {
        if (!formData || !validateStep(formData, TOTAL_STEPS, true) || !session || !imovelId) return;

        setIsSaving(true);
        
        // 1. Estruturar dados para o Supabase (similar à NewImovelPage)
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
            etiquetas, dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
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
                etiquetas, dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
            },
            observacoes_aprovacao,
        };

        // 2. Atualizar Imóvel no Banco de Dados
        const { error: imovelError } = await supabase
            .from('imoveis')
            .update(imovelData)
            .eq('id', imovelId);

        if (imovelError) {
            console.error('Erro ao atualizar imóvel:', imovelError);
            alert(`Erro ao salvar o imóvel: ${imovelError.message}`);
            setIsSaving(false);
            return;
        }
        
        // --- Gerenciamento de Mídias ---
        const existingImageIds = initialImages.map(img => img.id);
        const currentImageIds = images.map(img => img.id);

        // Imagens a serem excluídas (estavam no initialImages mas não estão mais em images)
        const imagesToDelete = initialImages.filter(img => !currentImageIds.includes(img.id));
        for (const img of imagesToDelete) {
            // Extrair o nome do arquivo do URL para exclusão no storage
            const fileName = img.url.split('/').pop();
            if (fileName) {
                const { error: deleteStorageError } = await supabase.storage
                    .from('imovel-media')
                    .remove([`imoveis/${imovelId}/${fileName}`]);
                
                if (deleteStorageError) {
                    console.error(`Erro ao excluir imagem do storage (${fileName}):`, deleteStorageError);
                }
            }
            // Excluir do banco de dados
            const { error: deleteDbError } = await supabase
                .from('imovel_media')
                .delete()
                .eq('id', img.id);
            if (deleteDbError) {
                console.error(`Erro ao excluir metadados da imagem (${img.id}):`, deleteDbError);
            }
        }

        // Imagens novas (com `file` preenchido)
        const newImagesToUpload = images.filter(img => img.file !== null);
        if (newImagesToUpload.length > 0) {
            const uploadedMedia = await uploadImovelMedia(newImagesToUpload, session.user.id, imovelId);
            if (uploadedMedia.length > 0) {
                const { error: mediaError } = await saveMediaMetadata(imovelId, session.user.id, uploadedMedia);
                if (mediaError) {
                    console.error('Erro ao salvar metadados das novas mídias:', mediaError);
                    alert(`Atenção: Imóvel salvo, mas houve um erro ao salvar as novas mídias: ${mediaError.message}`);
                }
            }
        }

        // Imagens existentes que foram modificadas (sem `file`, mas com metadados alterados)
        const updatedExistingImages = images.filter(img => img.file === null && existingImageIds.includes(img.id))
            .filter(img => {
                const initial = initialImages.find(i => i.id === img.id);
                // Verifica se houve alteração em legenda, visibilidade, rotação OU ORDEM
                return initial && (initial.legend !== img.legend || initial.isVisible !== img.isVisible || initial.rotation !== img.rotation || initial.ordem !== img.ordem);
            });
        
        for (const img of updatedExistingImages) {
            const { error: updateError } = await supabase
                .from('imovel_media')
                .update({ legend: img.legend, is_visible: img.isVisible, rotation: img.rotation, ordem: img.ordem })
                .eq('id', img.id);
            if (updateError) {
                console.error(`Erro ao atualizar metadados da imagem (${img.id}):`, updateError);
            }
        }

        setIsSaving(false);
        setIsEditing(false); // Sai do modo de edição
        alert('Imóvel atualizado com sucesso!');
        fetchImovelData(); // Recarrega os dados para refletir todas as mudanças
    };

    // --- Validação e Efeitos (similar à NewImovelPage) ---
    const validateStep = useCallback((currentData: ImovelInput | null, currentStep: number, shouldSetError: boolean = true): boolean => {
        if (!currentData) return false;
        
        let errors: string[] = [];

        switch (currentStep) {
            case 1:
                if (!currentData.tipo_imovel) errors.push('O tipo do imóvel é obrigatório.');
                if (!currentData.codigo) errors.push('O código do imóvel é obrigatório.');
                const activeCount = (currentData.venda_ativo ? 1 : 0) + (currentData.locacao_ativo ? 1 : 0) + (currentData.temporada_ativo ? 1 : 0);
                if (activeCount === 0) errors.push('Pelo menos uma finalidade deve estar ativa.');
                
                if (currentData.venda_ativo && currentData.venda_disponibilidade === 'Indisponível' && !currentData.venda_motivo_indisponibilidade) {
                    errors.push('O motivo de indisponibilidade de venda é obrigatório.');
                }
                if (currentData.locacao_ativo && currentData.locacao_disponibilidade === 'Indisponível' && !currentData.locacao_motivo_indisponibilidade) {
                    errors.push('O motivo de indisponibilidade de locação é obrigatório.');
                }
                if (currentData.temporada_ativo && currentData.temporada_disponibilidade === 'Indisponível' && !currentData.temporada_motivo_indisponibilidade) {
                    errors.push('O motivo de indisponibilidade de temporada é obrigatório.');
                }
                break;
            case 2:
                if (!currentData.cep || currentData.cep.replace(/\D/g, '').length !== 8) errors.push('O CEP é obrigatório e deve ter 8 dígitos.');
                if (!currentData.bairro) errors.push('O bairro é obrigatório.');
                if (!currentData.logradouro) errors.push('O logradouro é obrigatório.');
                if (!currentData.numero) errors.push('O número é obrigatório.');
                break;
            case 3:
                if (currentData.venda_ativo && currentData.valor_venda <= 0) errors.push('O valor de venda deve ser maior que zero se a venda estiver ativa.');
                if (currentData.locacao_ativo && currentData.valor_locacao <= 0) errors.push('O valor de locação deve ser maior que zero se a locação estiver ativa.');
                if (!currentData.financiavel) errors.push('O campo Financiável é obrigatório.');
                break;
            case 5:
                if (!currentData.proprietario_id) errors.push('O proprietário é obrigatório.');
                if (!currentData.agenciador_id) errors.push('O agenciador é obrigatório.');
                if (!currentData.responsavel_id) errors.push('O responsável é obrigatório.');
                if (!currentData.data_agenciamento) errors.push('A data de agenciamento é obrigatória.');
                if (!currentData.ocupacao) errors.push('O campo Ocupação é obrigatório.');
                break;
            case 9:
                if (currentData.dormitorios === undefined || currentData.dormitorios < 0) errors.push('O número de dormitórios é obrigatório.');
                if (currentData.suites === undefined || currentData.suites < 0) errors.push('O número de suítes é obrigatório.');
                if (currentData.banheiros === undefined || currentData.banheiros < 0) errors.push('O número de banheiros é obrigatório.');
                if (currentData.vagas_garagem === undefined || currentData.vagas_garagem < 0) errors.push('O número de vagas de garagem é obrigatório.');
                if (currentData.area_privativa_m2 === undefined || currentData.area_privativa_m2 <= 0) errors.push('A área privativa é obrigatória.');
                if (!currentData.condicao) errors.push('A condição do imóvel é obrigatória.');
                break;
            case 11:
                if (!currentData.status_aprovacao) errors.push('O status de aprovação é obrigatório.');
                break;
        }

        if (errors.length > 0) {
            if (shouldSetError) setValidationError(errors.join(' '));
            return false;
        }
        if (shouldSetError) setValidationError(null);
        return true;
    }, []);

    useEffect(() => {
        if (formData) {
            const isValid = validateStep(formData, step, false);
            setIsCurrentStepValid(isValid);
        }
    }, [formData, step, validateStep]);

    useEffect(() => {
        if (step === 2 && formData) {
            const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;
            const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
            
            if (isAddressValid) {
                lookupNominatim(fullAddress);
            }
        }
    }, [step, formData, lookupNominatim]);

    // --- Renderização (similar à NewImovelPage, mas com controles de edição) ---
    if (!formData) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

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
                        disabled={!isEditing}
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );

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

    const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

    const renderStepContent = (currentStep: number) => {
        switch (currentStep) {
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
                            <TextInput label={<span>Código <RequiredAsterisk /></span>} id="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="52564" disabled />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className={`p-3 border rounded-lg space-y-2 ${!isVendaActive ? 'opacity-50' : ''}`}>
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
                            
                            <div className={`p-3 border rounded-lg space-y-2 ${!isLocacaoActive ? 'opacity-50' : ''}`}>
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
                            
                            <div className={`p-3 border rounded-lg space-y-2 ${!isTemporadaActive ? 'opacity-50' : ''}`}>
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
                const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
                const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

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
                                {cepLoading && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pt-6">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    </div>
                                )}
                                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Estado <RequiredAsterisk /></label>
                                <select id="estado" value={formData.estado} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing || cepLoading || !!cepData}>
                                    <option value={formData.estado}>{formData.estado}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Cidade <RequiredAsterisk /></label>
                                <select id="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing || cepLoading || !!cepData}>
                                    <option value={formData.cidade}>{formData.cidade}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Bairro <RequiredAsterisk /></label>
                                <select id="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing || cepLoading || !!cepData}>
                                    <option value={formData.bairro}>{formData.bairro}</option>
                                    {!cepData && neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <TextInput label={<span>Logradouro <RequiredAsterisk /></span>} id="logradouro" value={formData.logradouro} onChange={handleInputChange} placeholder="Informe o logradouro" disabled={!isEditing || cepLoading || !!cepData} />
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
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NumberInput label={<span>Valor de venda <RequiredAsterisk /></span>} id="valor_venda" isCurrency value={formData.valor_venda} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.venda_ativo || !isEditing} />
                            <NumberInput label="Valor de locação" id="valor_locacao" isCurrency value={formData.valor_locacao} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.locacao_ativo || !isEditing} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex space-x-2 items-center">
                                <NumberInput label="Valor de condomínio" id="valor_condominio" isCurrency value={formData.valor_condominio} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!isEditing} />
                                <label className="flex items-center space-x-1 text-sm mt-6">
                                    <Checkbox id="condominio_isento" checked={formData.condominio_isento} onCheckedChange={(checked) => setFormData(p => p ? ({ ...p, condominio_isento: checked as boolean }) : null)} disabled={!isEditing} />
                                    <span>Isento</span>
                                </label>
                            </div>
                            <div className="flex space-x-2 items-center">
                                <NumberInput label="Valor de IPTU" id="valor_iptu" isCurrency value={formData.valor_iptu} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!isEditing} />
                                <label className="flex items-center space-x-1 text-sm mt-6">
                                    <Checkbox id="iptu_isento" checked={formData.iptu_isento} onCheckedChange={(checked) => setFormData(p => p ? ({ ...p, iptu_isento: checked as boolean }) : null)} disabled={!isEditing} />
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
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <TextInput label="IPTU" id="vis_iptu" value={formData.vis_iptu} onChange={handleInputChange} placeholder="Invisível" disabled={!isEditing} />
                            <TextInput label="Condomínio" id="vis_condominio" value={formData.vis_condominio} onChange={handleInputChange} placeholder="Invisível" disabled={!isEditing} />
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextInput label={<span>Proprietário <RequiredAsterisk /></span>} id="proprietario_id" value={formData.proprietario_id} onChange={handleInputChange} placeholder="Pesquise por: Nome, CPF, Telefone (Mock)" disabled={!isEditing} />
                            <NumberInput label="Comissão (%)" id="comissao_proprietario_percent" value={formData.comissao_proprietario_percent} onChange={handleInputChange} placeholder="100%" disabled={!isEditing} />
                        </div>
                        <Button variant="outline" className="mt-2" disabled={!isEditing}>+ Mais um proprietário (Mock)</Button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <NumberInput label="Período do email de atualização (dias)" id="periodo_email_atualizacao" value={formData.periodo_email_atualizacao} onChange={handleInputChange} placeholder="30" disabled={!isEditing} />
                            <label className="flex items-center space-x-2 text-sm mt-6">
                                <Checkbox id="enviar_email_atualizacao" checked={formData.enviar_email_atualizacao} onCheckedChange={(checked) => setFormData(p => p ? ({ ...p, enviar_email_atualizacao: checked as boolean }) : null)} disabled={!isEditing} />
                                <span>Enviar email de atualização</span>
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <TextInput label={<span>Agenciador / Captador <RequiredAsterisk /></span>} id="agenciador_id" value={formData.agenciador_id} onChange={handleInputChange} placeholder="Moisez Torres (Mock)" disabled={!isEditing} />
                            <TextInput label={<span>Responsável / Corretor <RequiredAsterisk /></span>} id="responsavel_id" value={formData.responsavel_id} onChange={handleInputChange} placeholder="Alessandro Gomes (Mock)" disabled={!isEditing} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <NumberInput label="Honorários Venda (%)" id="honorarios_venda_percent" value={formData.honorarios_venda_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.venda_ativo || !isEditing} />
                            <NumberInput label="Honorários Locação (%)" id="honorarios_locacao_percent" value={formData.honorarios_locacao_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.locacao_ativo || !isEditing} />
                            <NumberInput label="Honorários Temporada (%)" id="honorarios_temporada_percent" value={formData.honorarios_temporada_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.temporada_ativo || !isEditing} />
                            <TextInput label={<span>Data agenciamento <RequiredAsterisk /></span>} id="data_agenciamento" type="date" value={formData.data_agenciamento} onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <TextInput label="Nº da matrícula" id="numero_matricula" value={formData.numero_matricula} onChange={handleInputChange} placeholder="Informe o número" disabled={!isEditing} />
                            <label className="flex items-center space-x-2 text-sm mt-6">
                                <Checkbox id="nao_possui_matricula" checked={formData.nao_possui_matricula} onCheckedChange={(checked) => setFormData(p => p ? ({ ...p, nao_possui_matricula: checked as boolean }) : null)} disabled={!isEditing} />
                                <span>Não possui matrícula</span>
                            </label>
                            <TextInput label="Nº do IPTU" id="numero_iptu" value={formData.numero_iptu} onChange={handleInputChange} placeholder="Informe o IPTU" disabled={!isEditing} />
                            <TextInput label="Vencimento da exclusividade" id="vencimento_exclusividade" type="date" value={formData.vencimento_exclusividade} onChange={handleInputChange} disabled={!isEditing} />
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
                                            disabled={!isEditing}
                                        />
                                        <span>Selecionar ({selectedImageIds.length})</span>
                                    </label>
                                    <ActionsDropdown 
                                        onAction={handleAction} 
                                        disabled={selectedImageIds.length === 0 || !isEditing} 
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
                            <h3 className="text-sm font-medium text-light-text">Status de aprovação <RequiredAsterisk /></label>
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
    
    const getStepTitle = (currentStep: number) => {
        const titles = [
            { icon: <Home className="w-5 h-5 mr-2" />, text: 'Dados do Imóvel' },
            { icon: <MapPin className="w-5 h-5 mr-2" />, text: 'Localização' },
            { icon: <DollarSign className="w-5 h-5 mr-2" />, text: 'Valores' },
            { icon: <Eye className="w-5 h-5 mr-2" />, text: 'Visibilidade' },
            { icon: <Lock className="w-5 h-5 mr-2" />, text: 'Dados não visíveis no site' },
            { icon: <Key className="w-5 h-5 mr-2" />, text: 'Chaves (Placeholder)' },
            { icon: <FileText className="w-5 h-5 mr-2" />, text: 'Documentos Anexados (Placeholder)' },
            { icon: <Image className="w-5 h-5 mr-2" />, text: 'Mídias' },
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
                <Home className="w-6 h-6 mr-2 text-blue-600" /> INÍCIO &gt; IMÓVEIS &gt; {imovelId ? `EDITAR (${formData.codigo})` : 'NOVO'}
            </h1>
            
            {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-4xl mx-auto">
                    <p className="font-semibold">Erro de Validação:</p>
                    <p className="text-sm">{validationError}</p>
                </div>
            )}

            {/* Carrossel de Imagens (fora dos passos) */}
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="relative h-64">
                    <ImageCarousel 
                        media={images.filter(img => img.isVisible)} // Apenas imagens visíveis no carrossel principal
                        defaultImageUrl="/LOGO LARANJA.png"
                        altText={`Imóvel ${formData.codigo}`}
                    />
                </div>
            </div>

            {/* Botões de Ação Global (Editar/Salvar/Cancelar) */}
            <div className="flex justify-end space-x-3 mb-6 max-w-4xl mx-auto">
                {!isEditing ? (
                    <Button 
                        onClick={handleEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Edit className="w-4 h-4 mr-2" /> Editar Imóvel
                    </Button>
                ) : (
                    <>
                        <Button 
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="text-gray-700 border-gray-300 hover:bg-gray-100"
                            disabled={isSaving}
                        >
                            <X className="w-4 h-4 mr-2" /> Cancelar Edição
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="bg-primary-orange hover:bg-secondary-orange"
                            disabled={!isCurrentStepValid || isSaving}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </>
                )}
            </div>

            {/* Renderiza todos os passos */}
            {allSteps.map(currentStep => (
                <div 
                    key={currentStep} 
                    id={`imovel-step-${currentStep}`}
                    // Aplica opacidade e desativa cliques se não for o passo ativo E não estiver editando
                    className={`transition-opacity duration-500 ${currentStep === step ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                >
                    <ImovelStep
                        title={getStepTitle(currentStep)}
                        step={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSave={handleSave} // O botão 'Finalizar Cadastro' agora chama handleSave
                        isLastStep={currentStep === TOTAL_STEPS}
                        isFirstStep={currentStep === 1}
                        isStepValid={currentStep === step ? isCurrentStepValid : true} // Apenas o passo atual precisa ser validado
                        isSaving={isSaving}
                        // Desabilita navegação se não estiver editando
                        disabled={!isEditing} 
                    >
                        {renderStepContent(currentStep)}
                    </ImovelStep>
                </div>
            ))}
        </div>
    );
};

export default ViewImovelPage;