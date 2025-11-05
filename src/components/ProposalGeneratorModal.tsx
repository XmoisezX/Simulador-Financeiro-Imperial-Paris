import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, FileText, User, Home, DollarSign, Calendar, Printer, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import { Opportunity } from './NewOpportunityModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Aceita' | 'Recusada';

export interface Proposal {
    id?: string;
    oportunidade_id: string;
    cliente_id: string;
    imovel_id: string;
    valor_proposto: number;
    condicoes_pagamento: string | null;
    data_validade: string; // YYYY-MM-DD
    status: ProposalStatus;
    arquivo_url: string | null;
    // Campos adicionais para display (vindos do join)
    clientes?: { nome: string, telefone: string | null, email: string | null } | null;
    imoveis?: { codigo: string, logradouro: string, numero: string, bairro: string, dados_valores: { valor_venda: number | null, valor_locacao: number | null } } | null;
}

interface Template {
    id: string;
    title: string;
    type: string;
    content: string | null;
}

interface ProposalGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: Opportunity;
    onSaveSuccess: () => void;
}

const initialFormData: Proposal = {
    oportunidade_id: '',
    cliente_id: '',
    imovel_id: '',
    valor_proposto: 0,
    condicoes_pagamento: null,
    data_validade: new Date().toISOString().split('T')[0],
    status: 'Rascunho',
    arquivo_url: null,
};

const formatCurrency = (value: number | null | undefined) =>
  value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ProposalGeneratorModal: React.FC<ProposalGeneratorModalProps> = ({ isOpen, onClose, opportunity, onSaveSuccess }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<Proposal>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [existingProposals, setExistingProposals] = useState<Proposal[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [previewHtml, setPreviewHtml] = useState<string>('');

    const applyTemplate = useCallback((templateContent: string) => {
        if (!templateContent) return '';
        const clienteNome = formData.clientes?.nome || '';
        const clienteEmail = formData.clientes?.email || '';
        const clienteTelefone = formData.clientes?.telefone || '';
        const imovelCodigo = formData.imoveis?.codigo || '';
        const imovelEndereco = formData.imoveis
            ? `${formData.imoveis.logradouro || ''}, ${formData.imoveis.numero || ''} - ${formData.imoveis.bairro || ''}`
            : '';
        const imovelValorVenda = formatCurrency(formData.imoveis?.dados_valores?.valor_venda);
        const imovelValorLocacao = formatCurrency(formData.imoveis?.dados_valores?.valor_locacao);
        const valorProposto = formatCurrency(formData.valor_proposto);
        const condicoes = formData.condicoes_pagamento || '';
        const validade = formData.data_validade ? new Date(formData.data_validade).toLocaleDateString('pt-BR') : '';
        const hoje = new Date().toLocaleDateString('pt-BR');

        const replacements: Record<string, string> = {
            '{{CLIENTE_NOME}}': clienteNome,
            '{{CLIENTE_EMAIL}}': clienteEmail,
            '{{CLIENTE_TELEFONE}}': clienteTelefone,
            '{{IMOBILIARIA_NOME}}': 'Imperial Paris Imóveis',
            '{{IMOVEL_CODIGO}}': imovelCodigo,
            '{{IMOVEL_ENDERECO}}': imovelEndereco,
            '{{IMOVEL_BAIRRO}}': formData.imoveis?.bairro || '',
            '{{IMOVEL_VALOR_VENDA}}': imovelValorVenda,
            '{{IMOVEL_VALOR_LOCACAO}}': imovelValorLocacao,
            '{{VALOR_PROPOSTO}}': valorProposto,
            '{{CONDICOES_PAGAMENTO}}': condicoes,
            '{{DATA_VALIDADE}}': validade,
            '{{DATA_ATUAL}}': hoje,
            '{{LOCADOR_NOME}}': clienteNome,
            '{{LOCATARIO_NOME}}': clienteNome,
            '{{PROPOSTA_VALOR}}': valorProposto,
            '{{PROPOSTA_CONDICOES}}': condicoes,
        };

        let result = templateContent;
        Object.entries(replacements).forEach(([token, value]) => {
            result = result.split(token).join(value);
        });

        return result;
    }, [formData]);

    const fetchOpportunityDetails = useCallback(async () => {
        if (!session || !opportunity.cliente_id || !opportunity.imovel_id) {
            setError('Dados incompletos para gerar proposta.');
            setIsLoadingDetails(false);
            return;
        }
        
        setIsLoadingDetails(true);
        setError(null);

        const { data: clientData, error: clientError } = await supabase
            .from('pessoas')
            .select('nome, telefone, email')
            .eq('id', opportunity.cliente_id)
            .single();

        const { data: imovelData, error: imovelError } = await supabase
            .from('imoveis')
            .select('codigo, logradouro, numero, bairro, dados_valores')
            .eq('id', opportunity.imovel_id)
            .single();

        if (clientError || imovelError || !clientData || !imovelData) {
            console.error('Erro ao buscar detalhes para proposta:', clientError, imovelError);
            setError('Não foi possível carregar as informações do cliente ou imóvel.');
            setIsLoadingDetails(false);
            return;
        }
        
        const { data: proposalsData, error: proposalsError } = await supabase
            .from('propostas')
            .select('*')
            .eq('oportunidade_id', opportunity.id!)
            .order('created_at', { ascending: false });

        if (proposalsError) {
            console.error('Erro ao buscar propostas existentes:', proposalsError);
            setError('Não foi possível carregar propostas anteriores.');
        } else {
            setExistingProposals((proposalsData || []) as Proposal[]);
        }

        const { data: templatesData, error: templatesError } = await supabase
            .from('document_templates')
            .select('id, title, type, content')
            .eq('user_id', session.user.id)
            .eq('type', 'Proposta de Compra')
            .order('updated_at', { ascending: false });

        if (templatesError) {
            console.warn('Não foi possível carregar modelos de documento:', templatesError);
            setTemplates([]);
            setSelectedTemplateId('');
        } else {
            const list = (templatesData || []) as Template[];
            setTemplates(list);
            if (list.length > 0) {
                setSelectedTemplateId(prev => prev || list[0].id);
            } else {
                setSelectedTemplateId('');
            }
        }

        setFormData(prev => ({
            ...prev,
            oportunidade_id: opportunity.id!,
            cliente_id: opportunity.cliente_id!,
            imovel_id: opportunity.imovel_id!,
            valor_proposto: opportunity.valor_estimado || imovelData.dados_valores?.valor_venda || imovelData.dados_valores?.valor_locacao || 0,
            clientes: clientData,
            imoveis: imovelData,
        }));
        setIsLoadingDetails(false);
    }, [session, opportunity, applyTemplate]);

    useEffect(() => {
        if (isOpen) {
            fetchOpportunityDetails();
        }
    }, [isOpen, fetchOpportunityDetails]);

    useEffect(() => {
        if (!selectedTemplateId) {
            setPreviewHtml('');
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.content) {
            setPreviewHtml('');
            return;
        }
        setPreviewHtml(applyTemplate(template.content));
    }, [
        selectedTemplateId,
        templates,
        applyTemplate,
        formData.valor_proposto,
        formData.condicoes_pagamento,
        formData.data_validade,
        formData.clientes,
        formData.imoveis
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError(null);
    };
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, status: e.target.value as ProposalStatus }));
        setError(null);
    };

    const validate = () => {
        const errors: string[] = [];
        if (formData.valor_proposto <= 0) errors.push('O valor proposto deve ser maior que zero.');
        if (!formData.data_validade) errors.push('A data de validade é obrigatória.');
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSaveProposal = useCallback(async () => {
        if (!session || !validate()) return;

        setIsSaving(true);
        
        const dataToSave = {
            user_id: session.user.id,
            oportunidade_id: formData.oportunidade_id,
            cliente_id: formData.cliente_id,
            imovel_id: formData.imovel_id,
            valor_proposto: formData.valor_proposto,
            condicoes_pagamento: formData.condicoes_pagamento?.trim() || null,
            data_validade: formData.data_validade,
            status: formData.status,
            arquivo_url: formData.arquivo_url,
        };

        let result;
        if (formData.id) {
            result = await supabase
                .from('propostas')
                .update(dataToSave)
                .eq('id', formData.id)
                .select('id')
                .single();
        } else {
            result = await supabase
                .from('propostas')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        setIsSaving(false);

        if (result.error) {
            console.error('Erro ao salvar proposta:', result.error);
            setError(`Erro ao salvar: ${result.error.message}`);
        } else {
            alert('Proposta salva com sucesso!');
            onSaveSuccess();
            fetchOpportunityDetails();
        }
    }, [session, formData, onSaveSuccess, validate, fetchOpportunityDetails]);

    const handleGeneratePDF = useCallback(() => {
        if (!formData.clientes || !formData.imoveis) {
            alert('Informações do cliente ou imóvel incompletas.');
            return;
        }

        const doc = new jsPDF();
        const headerLines = [
            `Cliente: ${formData.clientes.nome}`,
            `Imóvel: ${formData.imoveis.codigo} - ${formData.imoveis.logradouro}, ${formData.imoveis.numero} (${formData.imoveis.bairro})`,
            `Valor Proposto: ${formatCurrency(formData.valor_proposto)}`,
            `Validade: ${formData.data_validade ? new Date(formData.data_validade).toLocaleDateString('pt-BR') : 'N/A'}`
        ];
        const baseContent = previewHtml ? stripHtml(previewHtml) : headerLines.join('\n');

        doc.setFontSize(18);
        doc.text("Proposta de Imóvel - Imperial Paris", 14, 22);
        doc.setFontSize(12);
        const wrappedLines = doc.splitTextToSize(baseContent, 180);
        doc.text(wrappedLines, 14, 32);

        autoTable(doc, {
            head: [['Campo', 'Valor']],
            body: [
                ['Cliente', formData.clientes.nome],
                ['Imóvel', `${formData.imoveis.codigo} - ${formData.imoveis.logradouro}, ${formData.imoveis.numero} (${formData.imoveis.bairro})`],
                ['Valor Proposto', formatCurrency(formData.valor_proposto)],
                ['Condições de Pagamento', formData.condicoes_pagamento || 'A combinar'],
                ['Validade', formData.data_validade ? new Date(formData.data_validade).toLocaleDateString('pt-BR') : 'N/A'],
            ],
            startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60,
            theme: 'grid',
        });

        doc.save(`proposta_${formData.imoveis.codigo}_${formData.clientes.nome}.pdf`);
        alert('PDF da proposta gerado! Lembre-se de anexar manualmente se necessário.');
    }, [formData, previewHtml]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <FileText className="w-5 h-5 mr-2" /> Gerar Proposta para {opportunity.nome}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                        <p className="text-gray-600">Carregando detalhes...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-red-600 text-sm">{error}</div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">Cliente: {formData.clientes?.nome || 'N/A'}</p>
                            <p className="text-xs text-blue-700">Imóvel: {formData.imoveis?.codigo || 'N/A'}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Modelo de Documento</label>
                            {templates.length > 0 ? (
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-dark-text"
                                >
                                    <option value="">Selecione um modelo (opcional)</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>{template.title}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-xs text-gray-500">Nenhum modelo salvo para “Proposta de Compra”. Crie um em Documentos.</div>
                            )}
                        </div>

                        {previewHtml && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-dark-text">Pré-visualização do Modelo</h3>
                                <div className="border rounded-md p-3 bg-gray-50 text-sm leading-relaxed max-h-64 overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <NumberInput 
                                label="Valor Proposto" 
                                id="valor_proposto" 
                                isCurrency
                                value={formData.valor_proposto} 
                                onChange={handleChange} 
                                placeholder="R$ 0,00"
                                required
                            />
                            <TextInput 
                                label="Data de Validade" 
                                id="data_validade" 
                                type="date"
                                value={formData.data_validade} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="condicoes_pagamento" className="block text-sm font-medium text-light-text">Condições de Pagamento</label>
                            <textarea 
                                id="condicoes_pagamento" 
                                rows={4} 
                                value={formData.condicoes_pagamento || ''}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="status" className="block text-sm font-medium text-light-text">Status da Proposta</label>
                            <select 
                                id="status" 
                                value={formData.status} 
                                onChange={handleStatusChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            >
                                <option value="Rascunho">Rascunho</option>
                                <option value="Enviada">Enviada</option>
                                <option value="Aceita">Aceita</option>
                                <option value="Recusada">Recusada</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button 
                                variant="outline" 
                                onClick={handleGeneratePDF}
                                disabled={!formData.clientes || !formData.imoveis}
                            >
                                <Printer className="w-4 h-4 mr-2" /> Gerar PDF
                            </Button>
                            <Button onClick={handleSaveProposal} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Proposta
                            </Button>
                        </div>

                        <div className="space-y-3 mt-6">
                            <h3 className="text-lg font-semibold text-dark-text">Propostas Anteriores ({existingProposals.length})</h3>
                            {existingProposals.length === 0 ? (
                                <p className="text-sm text-gray-500">Nenhuma proposta anterior para esta oportunidade.</p>
                            ) : (
                                <div className="space-y-2">
                                    {existingProposals.map(proposal => (
                                        <div key={proposal.id} className="p-3 bg-white rounded-md border border-gray-200 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-dark-text flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                    Proposta de {formatCurrency(proposal.valor_proposto)}
                                                </p>
                                                <p className="text-sm text-light-text mt-1">
                                                    Status: {proposal.status} | Validade: {new Date(proposal.data_validade).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" title="Visualizar (Mock)">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalGeneratorModal;