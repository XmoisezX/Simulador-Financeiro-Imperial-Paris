export interface SimulationInput {
  avgSaleValue: number;
  avgRentalValue: number;
  avgRegularizationsPerMonth: number; // Novo
  avgRegularizationValue: number; // Novo
  taxRate: number;
  propertyPayment1Month: number;
  propertyPayment1Amount: number;
  propertyPayment2Month: number;
  propertyPayment2Amount: number;
  propertyPayment3Month: number; // Novo: Mês Pagto. Reforma
  propertyPayment3Amount: number; // Novo: Valor Pagto. Reforma
  initialCash: number;
  custoSetupInicial: number;
  custoContabilidade: number;
  custoCRM: number;
  custoInternetTel: number;
  custoAguaLuz: number;
  custoAluguelCondominio: number;
  salarioAdministrativo: number;
  custoOutrosFixos: number;
  taxaSelicEstimadaAnual: number;
  outrosCustosVarPercentFatBruto: number;
  // Pro-labore changes
  proLaboreStartMonth: number;
  proLaboreAlessandro: number;
  proLaboreTamires: number;
  proLaboreMoisez: number;
  marketingBaseCost: number;
  marketingExpandedCost: number;
  expansionStartMonth: number;
  numberOfInterns: number;
  internCost: number;
  numberOfBrokers: number;
  slowStartMonths: number;
  salesTargetPartnersSlow: number;
  rentalsTargetSlow: number;
  salesTargetPartnersFull: number;
  salesTargetBrokersFull: number;
  percRampaMes1: number;
  percRampaMes2: number;
  percRampaMes3: number;
  rentalsTargetFull: number;
  commissionRateSale: number;
  partnerCommissionVarSale: number;
  brokerCommissionSale: number;
  brokerCommissionListing: number;
  brokerInternalListingRatio: number;
  partnerCommissionVarRental1st: number;
  brokerCommissionRental1stPercent: number;
  brokerCommissionRentalAdminPercent: number;
  commissionRateRentalAdmin: number;
  // Novos campos para estagiários
  internCommissionRental1stPercent: number; // Comissão % sobre 1º aluguel
  internRentalRatio: number; // Proporção de aluguéis (0-100%)
  
  // NOVO: Data de Início
  startDate: string; 
}

export interface MonthlyResult {
  month: number;
  grossRevenueSales: number;
  grossRevenueRental1st: number;
  grossRevenueRentalAdmin: number;
  grossRevenueRegularization: number; // Novo
  grossRevenueTotal: number;
  taxAmount: number;
  commissionVarSalesPartners: number;
  commissionVarSalesBrokersPaid: number;
  commissionVarRental1stPartners: number;
  
  // NOVO: Comissão Estagiários
  commissionVarRental1stInterns: number; 
  
  netRevenueForFixedCosts: number;
  currentFixedCosts: number;
  currentPropertyPayment: number;
  monthlyCashFlow: number;
  accumulatedCashFlow: number;
  salesCount: number;
  salesCountPartners: number; // Novo
  salesCountBrokers: number; // Novo
  rentalsCount: number;
  contributionMarginPercent: number;
  operatingProfitabilityPercent: number;
  breakEvenPoint: number;
  vgv: number;
  
  // NOVO: Campos para Dados Reais (Actual Data)
  actualSalesCount: number | null;
  actualRentalsCount: number | null;
  actualGrossRevenueTotal: number | null;
  actualCurrentFixedCosts: number | null;
  actualPropertyPayment: number | null;
  actualMonthlyCashFlow: number | null;
}

export interface SimulationTotals {
    grossRevenueSales: number;
    grossRevenueRental1st: number;
    grossRevenueRentalAdmin: number;
    grossRevenueRegularization: number; // Novo
    grossRevenueTotal: number;
    taxAmount: number;
    commissionVarSalesPartners: number;
    commissionVarSalesBrokersPaid: number;
    commissionVarRental1stPartners: number;
    
    // NOVO: Comissão Estagiários
    commissionVarRental1stInterns: number; 
    
    netRevenueForFixedCosts: number;
    totalFixedCosts: number;
    totalPropertyPayments: number;
    finalAccumulatedCashFlow: number;
    totalSalesCount: number;
    totalRentalsCount: number;
    avgContributionMarginPercent: number;
    avgOperatingProfitabilityPercent: number;
    avgBreakEvenPoint: number;
    totalVgv: number;
}

export interface SimulationSummary {
  finalCash: number;
  totalPropertyCost: number;
  isViable: boolean;
  bufferTarget: number;
  bufferMet: boolean;
}

export interface SimulationResult {
  monthlyData: MonthlyResult[];
  totals: SimulationTotals;
  summary: SimulationSummary;
}

// --- Imovel Cadastro Types ---

export type ImovelStatus = 'Venda' | 'Locação' | 'Temporada';
export type Disponibilidade = 'Disponível' | 'Indisponível';
export type SimNao = 'Sim' | 'Não';
export type SimNaoSemimobiliado = 'Não' | 'Sim' | 'Semimobiliado';
export type Financiavel = 'Sim' | 'Não' | 'MCMV';
export type VisibilidadeMapa = 'Exata' | 'Aproximada' | 'Não mostrar';
export type StatusAprovacao = 'Aprovado' | 'Não aprovado' | 'Aguardando';
export type Ocupacao = 'Desocupado' | 'Ocupado' | 'Locado'; // NOVO TIPO

export interface ImovelInput {
  // Step 1: Dados do Imóvel
  tipo_imovel: string;
  codigo: string;
  venda_ativo: boolean;
  venda_disponibilidade: Disponibilidade;
  venda_motivo_indisponibilidade: string;
  locacao_ativo: boolean;
  locacao_disponibilidade: Disponibilidade;
  locacao_motivo_indisponibilidade: string;
  temporada_ativo: boolean;
  temporada_disponibilidade: Disponibilidade;
  temporada_motivo_indisponibilidade: string;

  // Step 2: Localização
  condominio_id: string;
  bloco_torre: string;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  referencia: string;
  andar: string;
  ultimo_andar: SimNao;
  mapa_visibilidade: VisibilidadeMapa;

  // Step 3: Valores
  valor_venda: number;
  valor_locacao: number;
  valor_condominio: number;
  condominio_isento: boolean;
  valor_iptu: number;
  iptu_isento: boolean;
  seguro_incendio: number;
  taxa_limpeza: number;
  indice_reajuste: string;
  valor_base: number;
  iptu_periodo: 'Mensal' | 'Anual';
  financiavel: Financiavel;

  // Step 4: Visibilidade
  vis_endereco: string;
  vis_venda: string;
  vis_locacao: string;
  vis_temporada: string;
  vis_iptu: string;
  vis_condominio: string;

  // Step 5: Dados não visíveis no site
  proprietario_id: string;
  comissao_proprietario_percent: number;
  periodo_email_atualizacao: number;
  enviar_email_atualizacao: boolean;
  agenciador_id: string;
  responsavel_id: string;
  honorarios_venda_percent: number;
  honorarios_locacao_percent: number;
  honorarios_temporada_percent: number;
  data_agenciamento: string;
  numero_matricula: string;
  nao_possui_matricula: boolean;
  numero_iptu: string;
  vencimento_exclusividade: string;
  ocupacao: Ocupacao; // USANDO NOVO TIPO
  exclusivo: SimNao;
  placa: SimNao;
  medidor_energia: string;
  medidor_agua: string;
  medidor_gas: string;
  observacoes_internas: string;

  // Step 9: Características
  etiquetas: string;
  dormitorios: number;
  suites: number;
  banheiros: number;
  vagas_garagem: number;
  area_privativa_m2: number; // NOVO CAMPO
  condicao: string;
  mobiliado: SimNaoSemimobiliado;
  orientacao_solar: string;
  posicao: string;
  entrega_obra: string;
  pessoas_acomodacoes: number;
  distancia_mar_m: number;
  tipos_piso: string[];
  titulo_site: string;
  descricao_site: string;
  meta_title: string;
  meta_description: string;

  // Step 11: Aprovação do imóvel
  status_aprovacao: StatusAprovacao;
  observacoes_aprovacao: string;
}