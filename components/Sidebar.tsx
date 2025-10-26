
import React from 'react';
import { SimulationInput } from '../types';
import NumberInput from './NumberInput';
import CollapsibleCard from './CollapsibleCard';

interface SidebarProps {
    inputs: SimulationInput;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, onInputChange }) => {
    return (
        <aside className="w-full lg:w-[420px] lg:flex-shrink-0 bg-white p-6 border-r border-gray-200 overflow-y-auto lg:h-[calc(100vh-80px)] lg:sticky top-[80px]">
            <h2 className="text-xl font-bold text-dark-text mb-6">Parâmetros da Simulação</h2>
            
            <div className="space-y-4">
                <CollapsibleCard title="Premissas Financeiras" isOpenDefault>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Valor Médio Venda (R$)" id="avgSaleValue" value={inputs.avgSaleValue} onChange={onInputChange} step={10000} placeholder="300000" title="Valor médio estimado de cada venda. Principal fator para o faturamento de vendas." />
                        <NumberInput label="Valor Médio Aluguel (R$)" id="avgRentalValue" value={inputs.avgRentalValue} onChange={onInputChange} step={100} placeholder="2500" title="Valor do primeiro aluguel (comissão) e base para o cálculo da administração mensal." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Alíquota SN (%)" id="taxRate" value={inputs.taxRate} onChange={onInputChange} step={0.1} placeholder="6" title="Alíquota percentual do Simples Nacional que incide sobre o Faturamento Bruto Total." />
                        <NumberInput label="Outros Custos Var. (%)" id="outrosCustosVarPercentFatBruto" value={inputs.outrosCustosVarPercentFatBruto} onChange={onInputChange} step={0.5} placeholder="1" title="Percentual de outros custos variáveis que incidem sobre o Faturamento Bruto Total (ex: taxas de portal, etc)." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Mês Pagto. Imóvel 1" id="propertyPayment1Month" value={inputs.propertyPayment1Month} onChange={onInputChange} min={1} max={12} title="Mês (1 a 12) em que o primeiro pagamento de imóvel será realizado." />
                        <NumberInput label="Valor Pagto. 1 (R$)" id="propertyPayment1Amount" value={inputs.propertyPayment1Amount} onChange={onInputChange} step={1000} title="Custo do primeiro imóvel a ser pago, impactando o fluxo de caixa no mês correspondente." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Mês Pagto. Imóvel 2" id="propertyPayment2Month" value={inputs.propertyPayment2Month} onChange={onInputChange} min={1} max={12} title="Mês (1 a 12) em que o segundo pagamento de imóvel será realizado." />
                        <NumberInput label="Valor Pagto. 2 (R$)" id="propertyPayment2Amount" value={inputs.propertyPayment2Amount} onChange={onInputChange} step={1000} title="Custo do segundo imóvel a ser pago, base para o cálculo da correção." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Caixa Inicial (R$)" id="initialCash" value={inputs.initialCash} onChange={onInputChange} step={1000} placeholder="Valor inicial" title="Valor inicial em caixa no começo do primeiro mês da simulação." />
                         <NumberInput label="SELIC Estimada Anual (%)" id="taxaSelicEstimadaAnual" value={inputs.taxaSelicEstimadaAnual} onChange={onInputChange} step={0.5} placeholder="10" title="Taxa SELIC anual estimada para corrigir o valor do segundo pagamento do imóvel." />
                    </div>
                </CollapsibleCard>

                <CollapsibleCard title="Custos e Estrutura">
                    <h3 className="text-md font-semibold text-light-text mb-2">Custos Fixos Mensais</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Contabilidade (R$)" id="custoContabilidade" value={inputs.custoContabilidade} onChange={onInputChange} step={10} title="Custo mensal com serviços de contabilidade." />
                        <NumberInput label="CRM e Sistemas (R$)" id="custoCRM" value={inputs.custoCRM} onChange={onInputChange} step={10} title="Custo mensal com software de CRM e outras ferramentas." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Internet e Tel. (R$)" id="custoInternetTel" value={inputs.custoInternetTel} onChange={onInputChange} step={10} title="Custo mensal com serviços de internet e telefonia." />
                        <NumberInput label="Água e Luz (R$)" id="custoAguaLuz" value={inputs.custoAguaLuz} onChange={onInputChange} step={10} title="Custo mensal com contas de água e eletricidade." />
                    </div>
                     <NumberInput label="Outros Custos Fixos (R$)" id="custoOutrosFixos" value={inputs.custoOutrosFixos} onChange={onInputChange} step={10} title="Outros custos fixos mensais não listados acima." />
                     <NumberInput label="Pró-Labore Total (R$/mês)" id="proLaboreTotal" value={inputs.proLaboreTotal} onChange={onInputChange} step={500} placeholder="Remuneração" title="Retirada mensal fixa para os sócios." />
                    <div className="grid grid-cols-2 gap-4">
                         <NumberInput label="Invest. Mkt Base (R$/mês)" id="marketingBaseCost" value={inputs.marketingBaseCost} onChange={onInputChange} step={100} placeholder="Facebook Ads" title="Investimento mensal fixo em marketing durante os meses iniciais (antes da expansão)." />
                         <NumberInput label="Invest. Mkt Expandido (R$/mês)" id="marketingExpandedCost" value={inputs.marketingExpandedCost} onChange={onInputChange} step={500} placeholder="Tráfego Pago" title="Investimento mensal em marketing após o início do plano de expansão." />
                    </div>
                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Estrutura Expansão</h3>
                     <NumberInput label="Mês Início Expansão" id="expansionStartMonth" value={inputs.expansionStartMonth} onChange={onInputChange} min={1} max={12} title="Mês em que os custos de expansão (marketing, estagiários, etc.) começam a ser aplicados." />
                    <div className="grid grid-cols-2 gap-4">
                       <NumberInput label="Nº Estagiários" id="numberOfInterns" value={inputs.numberOfInterns} onChange={onInputChange} min={0} title="Quantidade de estagiários contratados a partir do mês de expansão." />
                       <NumberInput label="Custo/Estagiário (R$)" id="internCost" value={inputs.internCost} onChange={onInputChange} step={100} title="Custo mensal por cada estagiário contratado." />
                    </div>
                    <NumberInput label="Nº Corretores Externos" id="numberOfBrokers" value={inputs.numberOfBrokers} onChange={onInputChange} min={0} title="Quantidade de corretores externos que começam a atuar a partir do mês de expansão." />
                </CollapsibleCard>

                <CollapsibleCard title="Metas e Comissões">
                    <h3 className="text-md font-semibold text-light-text mb-2">Metas Mensais</h3>
                    <NumberInput label="Nº Meses de Início Lento" id="slowStartMonths" value={inputs.slowStartMonths} onChange={onInputChange} min={0} max={11} placeholder="Meta reduzida" title="Número de meses iniciais com metas de vendas e aluguéis reduzidas para a equipe." />
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Vendas/Sócios (Lento)" id="salesTargetPartnersSlow" value={inputs.salesTargetPartnersSlow} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de vendas por sócio durante os meses de início lento." />
                        <NumberInput label="Aluguéis Totais (Lento)" id="rentalsTargetSlow" value={inputs.rentalsTargetSlow} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de novos contratos de aluguel (total da equipe) durante os meses de início lento." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Vendas/Sócios (Pós)" id="salesTargetPartnersFull" value={inputs.salesTargetPartnersFull} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de vendas por sócio após o período de início lento." />
                        <NumberInput label="Aluguéis Totais (Pós)" id="rentalsTargetFull" value={inputs.rentalsTargetFull} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de novos contratos de aluguel (total da equipe) após o período de início lento." />
                    </div>
                     <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Metas e Rampa Corretores (Pós)</h3>
                     <NumberInput label="Média Vendas/Mês (Corretor)" id="salesTargetBrokersFull" value={inputs.salesTargetBrokersFull} onChange={onInputChange} min={0} placeholder="Unid." title="Defina a meta média de vendas que cada corretor externo deve atingir por mês após o período de rampa inicial." />
                     <div className="grid grid-cols-3 gap-2">
                         <NumberInput label="Rampa M1 (%)" id="percRampaMes1" value={inputs.percRampaMes1} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida no primeiro mês de expansão." />
                         <NumberInput label="Rampa M2 (%)" id="percRampaMes2" value={inputs.percRampaMes2} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida no segundo mês de expansão." />
                         <NumberInput label="Rampa M3+ (%)" id="percRampaMes3" value={inputs.percRampaMes3} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida do terceiro mês de expansão em diante." />
                     </div>

                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Comissões (%)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Venda Bruta Empresa" id="commissionRateSale" value={inputs.commissionRateSale} onChange={onInputChange} step={0.5} title="Percentual bruto que a imobiliária recebe sobre o valor de cada venda." />
                        <NumberInput label="Variável Sócios (Venda)" id="partnerCommissionVarSale" value={inputs.partnerCommissionVarSale} onChange={onInputChange} step={1} title="Percentual da comissão bruta da venda que é pago como comissão variável aos sócios." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <NumberInput label="Corretor Venda" id="brokerCommissionSale" value={inputs.brokerCommissionSale} onChange={onInputChange} step={0.1} title="Comissão do corretor que realizou a venda, calculada como um % sobre o Valor de Venda (VV)." />
                         <NumberInput label="Corretor Agenc." id="brokerCommissionListing" value={inputs.brokerCommissionListing} onChange={onInputChange} step={0.1} title="Comissão do corretor que agenciou o imóvel, calculada como um % sobre o Valor de Venda (VV)." />
                         <NumberInput label="Ag. Interno (%)" id="brokerInternalListingRatio" value={inputs.brokerInternalListingRatio} onChange={onInputChange} step={5} title="Percentual de vendas feitas por corretores externos que foram agenciadas internamente pela imobiliária." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Admin. Aluguel" id="commissionRateRentalAdmin" value={inputs.commissionRateRentalAdmin} onChange={onInputChange} step={0.5} title="Percentual mensal cobrado sobre o valor do aluguel para administração do contrato." />
                        <NumberInput label="Var. Sócios (1º Alug.)" id="partnerCommissionVarRental1st" value={inputs.partnerCommissionVarRental1st} onChange={onInputChange} step={1} title="Percentual do primeiro aluguel que é pago como comissão variável aos sócios." />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Var. Corr. (1º Alug.)" id="brokerCommissionRental1stPercent" value={inputs.brokerCommissionRental1stPercent} onChange={onInputChange} step={1} title="Comissão paga a corretores sobre novos aluguéis (se aplicável)." />
                        <NumberInput label="Var. Corr. (Admin.)" id="brokerCommissionRentalAdminPercent" value={inputs.brokerCommissionRentalAdminPercent} onChange={onInputChange} step={0.5} title="Comissão paga a corretores sobre a administração de aluguéis (se aplicável)." />
                    </div>
                </CollapsibleCard>
            </div>
        </aside>
    );
};

export default Sidebar;
