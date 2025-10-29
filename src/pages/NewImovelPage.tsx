import React from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap } from 'lucide-react';
import CollapsibleCard from '../components/CollapsibleCard';
import TextInput from '../components/TextInput';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';

const NewImovelPage: React.FC = () => {
    
    // Mock data for dropdowns
    const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial'];
    const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto'];
    const motives = ['Vendido', 'Alugado', 'Retirado pelo proprietário'];
    const indexOptions = ['IGP-M', 'IPCA', 'FIPE'];
    const occupationOptions = ['Desocupado', 'Ocupado', 'Em reforma'];
    const floorOptions = ['Térreo', '1º Andar', '2º Andar', '3º Andar'];
    const orientationOptions = ['Norte', 'Sul', 'Leste', 'Oeste'];
    const floorTypes = ['Aquecido', 'Carpete', 'Laminado', 'Tabuão', 'Ardósia', 'Cerâmico', 'Mármore', 'Usina', 'Associado', 'Flutuante', 'Parquet', 'Vinílico', 'Granito', 'Bruto', 'Porcelanato'];

    const renderRadioGroup = (name: string, options: (string | number)[], required = false) => (
        <div className="flex flex-wrap gap-4">
            {options.map((option, index) => (
                <label key={`${name}-${option}-${index}`} className="flex items-center space-x-2 text-sm">
                    <input type="radio" name={name} value={String(option)} className="text-blue-600 focus:ring-blue-500" required={required} />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );

    const renderCheckboxGroup = (title: string, options: string[]) => (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-light-text">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {options.map(option => (
                    <label key={option} className="flex items-center space-x-2 text-sm">
                        <Checkbox id={`${title}-${option}`} />
                        <span>{option}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-dark-text flex items-center">
                <Home className="w-6 h-6 mr-2 text-blue-600" /> INÍCIO &gt; IMÓVEIS &gt; NOVO
            </h1>

            {/* Formulário Principal */}
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* 1. Dados do Imóvel */}
                <CollapsibleCard title={<span className="flex items-center"><Home className="w-5 h-5 mr-2" /> Dados do Imóvel</span>} isOpenDefault>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Tipo do imóvel *</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o tipo do imóvel</option>
                                {propertyTypes.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <p className="text-xs text-red-600">X Este campo é obrigatório</p>
                        </div>
                        <TextInput label="Código *" id="code" placeholder="52564" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Venda */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <label className="flex items-center space-x-2 font-semibold text-dark-text">
                                <Checkbox id="venda_check" />
                                <span>Venda</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('venda_disponibilidade', ['Disponível', 'Indisponível'])}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m}>{m}</option>)}
                            </select>
                            <p className="text-xs text-red-600">X Este campo é obrigatório</p>
                        </div>
                        
                        {/* Locação */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <label className="flex items-center space-x-2 font-semibold text-dark-text">
                                <Checkbox id="locacao_check" />
                                <span>Locação</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('locacao_disponibilidade', ['Disponível', 'Indisponível'])}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        {/* Temporada */}
                        <div className="p-3 border rounded-lg space-y-2">
                            <label className="flex items-center space-x-2 font-semibold text-dark-text">
                                <Checkbox id="temporada_check" />
                                <span>Temporada</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('temporada_disponibilidade', ['Disponível', 'Indisponível'])}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 2. Localização */}
                <CollapsibleCard title={<span className="flex items-center"><MapPin className="w-5 h-5 mr-2" /> Localização</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Condomínio</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Pesquise pelo nome do condomínio</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bloco / Torre / Quadra</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Pesquise pelo nome do subcondomínio</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label="CEP *" id="cep" placeholder="99999-999" />
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Estado *</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Rio Grande do Sul</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Cidade *</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Pelotas</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bairro *</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o bairro</option>
                                {neighborhoods.map(b => <option key={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label="Logradouro *" id="logradouro" placeholder="Informe o logradouro" />
                        <TextInput label="Número *" id="number" placeholder="Informe o número" />
                        <TextInput label="Complemento" id="complement" placeholder="Informe o complemento" />
                        <TextInput label="Ponto de referência" id="reference" placeholder="Ex: Ao lado da igreja" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Andar</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Nenhum</option>
                                {floorOptions.map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Último andar</label>
                            {renderRadioGroup('last_floor', ['Sim', 'Não'])}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-light-text">Mapa no site</label>
                            {renderRadioGroup('map_visibility', ['Exata', 'Aproximada', 'Não mostrar'])}
                        </div>
                    </div>
                    
                    {/* Mock Map Area */}
                    <div className="h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center text-gray-500">
                        [Área do Mapa]
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 3. Valores */}
                <CollapsibleCard title={<span className="flex items-center"><DollarSign className="w-5 h-5 mr-2" /> Valores</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Valor de venda" id="sale_value" placeholder="R$ 0,00" />
                        <TextInput label="Valor de locação" id="rental_value" placeholder="R$ 0,00" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex space-x-2 items-center">
                            <TextInput label="Valor de condomínio" id="condo_value" placeholder="R$ 0,00" />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox id="condo_exempt" />
                                <span>Isento</span>
                            </label>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <TextInput label="Valor de IPTU" id="iptu_value" placeholder="R$ 0,00" />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox id="iptu_exempt" />
                                <span>Isento</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Seguro Incêndio (anual)" id="fire_insurance" placeholder="R$ 0,00" />
                        <TextInput label="Taxa de limpeza" id="cleaning_fee" placeholder="R$ 0,00" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Índice de reajuste</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option>Escolha o índice de reajuste</option>
                                {indexOptions.map(i => <option key={i}>{i}</option>)}
                            </select>
                        </div>
                        <TextInput label="Valor Base" id="base_value" placeholder="Informe o valor base" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Período do IPTU</label>
                            {renderRadioGroup('iptu_period', ['Mensal', 'Anual'])}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Financiável</label>
                            {renderRadioGroup('financeable', ['Sim', 'Não', 'MCMV'])}
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 4. Visibilidade */}
                <CollapsibleCard title={<span className="flex items-center"><Eye className="w-5 h-5 mr-2" /> Visibilidade</span>}>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800 mb-4">
                        As informações de visibilidade podem ser sobrescritas de acordo com as configurações dos Portais.
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Endereço *</label>
                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                            <option>Todas acima incluindo logradouro</option>
                        </select>
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Valores</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <TextInput label="Venda" id="vis_venda" placeholder="Invisível" />
                        <TextInput label="Locação" id="vis_locacao" placeholder="Invisível" />
                        <TextInput label="Temporada" id="vis_temporada" placeholder="Invisível" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <TextInput label="IPTU" id="vis_iptu" placeholder="Invisível" />
                        <TextInput label="Condomínio" id="vis_condo" placeholder="Invisível" />
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 5. Dados não visíveis no site */}
                <CollapsibleCard title={<span className="flex items-center"><Lock className="w-5 h-5 mr-2" /> Dados não visíveis no site</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput label="Proprietário *" id="owner" placeholder="Pesquise por: Nome, CPF, Telefone" />
                        <TextInput label="Comissão (%)" id="owner_commission" placeholder="100%" />
                    </div>
                    <Button variant="outline" className="mt-2">+ Mais um proprietário</Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Período do email de atualização (dias)" id="update_period" placeholder="30" />
                        <label className="flex items-center space-x-2 text-sm mt-6">
                            <Checkbox id="send_update_email" />
                            <span>Enviar email de atualização</span>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Agenciador / Captador *" id="agent" placeholder="Moisez Torres (048.249.130-20)" />
                        <TextInput label="Responsável / Corretor *" id="responsible" placeholder="Alessandro Gomes" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label="Honorários Venda (%)" id="hon_venda" placeholder="0%" />
                        <TextInput label="Honorários Locação (%)" id="hon_locacao" placeholder="0%" />
                        <TextInput label="Honorários Temporada (%)" id="hon_temporada" placeholder="0%" />
                        <TextInput label="Data agenciamento *" id="agency_date" type="date" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label="Nº da matrícula" id="registry_number" placeholder="Informe o número" />
                        <label className="flex items-center space-x-2 text-sm mt-6">
                            <Checkbox id="no_registry" />
                            <span>Não possui matrícula</span>
                        </label>
                        <TextInput label="Nº do IPTU" id="iptu_number" placeholder="Informe o IPTU" />
                        <TextInput label="Vencimento da exclusividade" id="exclusive_due" type="date" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Ocupação *</label>
                            <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                {occupationOptions.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Exclusivo</label>
                            {renderRadioGroup('exclusive', ['Sim', 'Não'])}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Placa</label>
                            {renderRadioGroup('placa', ['Sim', 'Não'])}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <TextInput label="Nº medidor energia" id="energy_meter" placeholder="Informe o Nº da energia" />
                        <TextInput label="Nº medidor água" id="water_meter" placeholder="Informe o Nº da água" />
                        <TextInput label="Nº medidor gás" id="gas_meter" placeholder="Informe o Nº do gás" />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-light-text">Observações internas</label>
                        <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"></textarea>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 6. Chaves */}
                <CollapsibleCard title={<span className="flex items-center"><Key className="w-5 h-5 mr-2" /> Chaves</span>}>
                    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-light-text">Nenhuma chave vinculada a este imóvel.</p>
                        <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            + Nova chave
                        </Button>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 7. Documentos Anexados */}
                <CollapsibleCard title={<span className="flex items-center"><FileText className="w-5 h-5 mr-2" /> Documentos Anexados</span>}>
                    <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                        <p className="text-light-text">Nenhum documento anexado encontrado.</p>
                        <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                            + Novo anexo
                        </Button>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 8. Mídias */}
                <CollapsibleCard title={<span className="flex items-center"><Image className="w-5 h-5 mr-2" /> Mídias</span>}>
                    <div className="flex border-b border-gray-200 mb-4">
                        <button className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center"><Image className="w-4 h-4 mr-1" /> Imagens (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center"><List className="w-4 h-4 mr-1" /> Plantas (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center">Tour 360 (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center">Vídeos (0)</button>
                    </div>
                    <Button variant="outline" className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                        + Adicionar Imagem
                    </Button>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 9. Características */}
                <CollapsibleCard title={<span className="flex items-center"><List className="w-5 h-5 mr-2" /> Características</span>}>
                    <TextInput label="Etiquetas" id="tags" placeholder="Selecione ou pesquise etiquetas" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        {/* Dormitórios */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Dormitórios *</label>
                            {renderRadioGroup('bedrooms', [0, 1, 2, 3, 'Outro'], true)}
                        </div>
                        {/* Suítes */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Quantos são suítes? *</label>
                            {renderRadioGroup('suites', [0, 1, 2, 3, 'Outro'], true)}
                        </div>
                        {/* Banheiros */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Banheiros *</label>
                            {renderRadioGroup('bathrooms', [0, 1, 2, 3, 'Outro'], true)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        {/* Vagas de Garagem */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Vagas de garagem *</label>
                            {renderRadioGroup('garages', [0, 1, 2, 3, 'Outro'], true)}
                        </div>
                        {/* Condição */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Condição *</label>
                            {renderRadioGroup('condition', ['Em construção', 'Na planta', 'Novo', 'Usado'], true)}
                        </div>
                        {/* Mobiliado */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Mobiliado</label>
                            {renderRadioGroup('furnished', ['Não', 'Sim', 'Semimobiliado'])}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        {/* Orientação Solar */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Orientação solar</label>
                            {renderRadioGroup('orientation', orientationOptions)}
                        </div>
                        {/* Posição */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Posição</label>
                            {renderRadioGroup('position', ['Frente', 'Lateral', 'Fundos'])}
                        </div>
                        {/* Entrega da Obra */}
                        <TextInput label="Entrega da obra" id="delivery_date" type="date" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <TextInput label="Pessoas / Acomodações" id="accommodations" placeholder="Informe o número de pessoas" />
                        <TextInput label="Distância para o mar (m)" id="sea_distance" placeholder="0" />
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Tipo de piso</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {floorTypes.map(type => (
                            <label key={type} className="flex items-center space-x-2 text-sm">
                                <Checkbox id={`floor-${type}`} />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Título no site e portais</h3>
                    <TextInput label="" id="site_title" placeholder="Título do anúncio" />
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Descrição no site e portais</h3>
                    <textarea rows={5} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"></textarea>
                    <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50">
                        Gerar descrição agora
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Meta title" id="meta_title" placeholder="Meta title" />
                        <TextInput label="Meta description" id="meta_description" placeholder="Meta description" />
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 10. Sites e portais */}
                <CollapsibleCard title={<span className="flex items-center"><Zap className="w-5 h-5 mr-2" /> Sites e portais</span>}>
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm text-yellow-800 mb-4">
                        Não é possível anunciar um imóvel sem contratos disponíveis, caso já exista um anúncio ativo, o mesmo será removido.
                    </div>
                    <label className="flex items-center space-x-2 text-sm font-medium mb-4">
                        <Checkbox id="select_all_portals" />
                        <span>Selecionar todos</span>
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
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button>Próximo</Button>
                    </div>
                </CollapsibleCard>

                {/* 11. Aprovação do imóvel */}
                <CollapsibleCard title={<span className="flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Aprovação do imóvel</span>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-light-text">Status de aprovação</h3>
                            {renderRadioGroup('approval_status', ['Aprovado', 'Não aprovado', 'Aguardando'])}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Observações</label>
                            <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"></textarea>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button variant="ghost">Voltar</Button>
                        <Button className="bg-primary-orange hover:bg-secondary-orange">Salvar</Button>
                    </div>
                </CollapsibleCard>
            </div>
        </div>
    );
};

export default NewImovelPage;