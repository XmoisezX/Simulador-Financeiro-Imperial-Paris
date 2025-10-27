import React from 'react';
import { MonthlyResult, SimulationTotals } from '../types';

interface ResultsTableProps {
    monthlyData: MonthlyResult[];
    totals: SimulationTotals;
    taxRate: number;
}

const formatCurrency = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercent = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return `${(value).toFixed(2)}%`;
}

const CashFlowCell: React.FC<{ value: number }> = ({ value }) => {
    const className = value >= 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold';
    return <td className={`px-2 md:px-4 py-3 text-xs md:text-sm text-right ${className}`}>{formatCurrency(value)}</td>;
};

const TH: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
    <th title={title} className="px-2 md:px-4 py-3 text-xs md:text-sm text-left uppercase sticky top-0 z-10 whitespace-nowrap">{children}</th>
);

const TD: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <td className={`px-2 md:px-4 py-3 text-xs md:text-sm text-right ${className}`}>{children}</td>
);

const ResultsTable: React.FC<ResultsTableProps> = ({ monthlyData, totals, taxRate }) => {
    const headers = [
        "Mês", "Nº Vendas", "VGV", "Nº Aluguéis", "Fat Bruto Venda", "Fat Bruto Alug (1º)", "Fat Bruto Alug (Adm)", "Fat Bruto Reg.", "Fat Bruto Total",
        `Imposto SN (${taxRate}%)`, "Com Var Venda (S)", "Com Var Venda (C)", "Com Var Alug (1º S)",
        "Rec Líquida (p/ CF)", "Custo Fixo Total", "Pagto Imóvel", "Fluxo Caixa Mês", "Fluxo Caixa Acum.",
        "Margem Contrib.", "Lucratividade Op.", "Ponto Equil."
    ];

    const tooltips: { [key: string]: string } = {
        "Mês": "Mês da simulação.",
        "Nº Vendas": "Número total de vendas realizadas no mês (sócios + corretores).",
        "VGV": "Valor Geral de Vendas. (Nº Vendas * Valor Médio Venda). Representa o valor total dos imóveis transacionados.",
        "Nº Aluguéis": "Número de novos contratos de aluguel fechados no mês.",
        "Fat Bruto Venda": "Faturamento Bruto Total gerado apenas pelas vendas no mês. (Nº Vendas * Valor Médio Venda * % Comissão Empresa)",
        "Fat Bruto Alug (1º)": "Faturamento Bruto gerado pelos novos contratos de aluguel. (Nº Aluguéis Novos * Valor Médio Aluguel)",
        "Fat Bruto Alug (Adm)": "Faturamento Bruto recorrente da administração dos contratos de aluguel acumulados. (Nº Contratos Acum. * Valor Médio Aluguel * % Admin.)",
        "Fat Bruto Reg.": "Faturamento Bruto gerado pela regularização de imóveis.",
        "Fat Bruto Total": "Soma de todo o faturamento bruto da imobiliária no mês (antes de subtrair comissões de corretores externos).",
        [`Imposto SN (${taxRate}%)`]: `Valor do imposto Simples Nacional a ser pago. Calculado sobre o Faturamento Bruto Total MENOS a comissão dos corretores externos.`,
        "Com Var Venda (S)": "Comissão variável paga aos sócios sobre as vendas que eles realizaram.",
        "Com Var Venda (C)": "Comissão total paga aos corretores externos sobre as vendas que eles realizaram (venda + agenciamento). Este valor é subtraído do Faturamento Bruto antes do cálculo do imposto.",
        "Com Var Alug (1º S)": "Comissão variável paga aos sócios sobre os novos contratos de aluguel.",
        "Rec Líquida (p/ CF)": "Receita Líquida: Faturamento Tributável subtraindo todos os custos variáveis (impostos, comissões de sócios, etc). Valor disponível para cobrir os custos fixos.",
        "Custo Fixo Total": "Soma de todos os custos fixos do mês (Operacional, Pró-Labore, Marketing, Estagiários).",
        "Pagto Imóvel": "Valor de pagamento de imóvel programado para este mês específico, incluindo correções.",
        "Fluxo Caixa Mês": "Resultado financeiro do mês. (Receita Líquida - Custos Fixos - Pagamento de Imóvel)",
        "Fluxo Caixa Acum.": "Saldo de caixa acumulado desde o início da operação. (Caixa Acumulado Anterior + Fluxo de Caixa do Mês)",
        "Margem Contrib.": "Margem de Contribuição Percentual. (Receita Líquida / Faturamento Tributável). Mostra quanto % da receita sobra para pagar custos fixos e gerar lucro.",
        "Lucratividade Op.": "Lucratividade Operacional Percentual. (Lucro Operacional / Receita Líquida). Mostra a eficiência da operação principal em gerar lucro.",
        "Ponto Equil.": "Ponto de Equilíbrio. (Custo Fixo Total / % Margem Contrib.). Indica o faturamento mínimo necessário no mês para cobrir todos os custos."
    };

    return (
         <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px] border-collapse">
                <thead>
                    <tr className="bg-orange-100 text-kpi-value-color font-semibold tracking-wider">
                        {headers.map((header, index) => (
                           <TH key={index} title={tooltips[header]}>
                               {header.split(' ').map((word, i) => <div key={i}>{word}</div>)}
                           </TH>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {monthlyData.map((row, index) => (
                        <tr key={row.month} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors duration-150`}>
                            <TD className="text-center font-semibold">{row.month}</TD>
                            <TD className="text-center">{row.salesCount}</TD>
                            <TD>{formatCurrency(row.vgv)}</TD>
                            <TD className="text-center">{row.rentalsCount}</TD>
                            <TD>{formatCurrency(row.grossRevenueSales)}</TD>
                            <TD>{formatCurrency(row.grossRevenueRental1st)}</TD>
                            <TD>{formatCurrency(row.grossRevenueRentalAdmin)}</TD>
                            <TD>{formatCurrency(row.grossRevenueRegularization)}</TD>
                            <TD>{formatCurrency(row.grossRevenueTotal)}</TD>
                            <TD>{formatCurrency(row.taxAmount)}</TD>
                            <TD>{formatCurrency(row.commissionVarSalesPartners)}</TD>
                            <TD>{formatCurrency(row.commissionVarSalesBrokersPaid)}</TD>
                            <TD>{formatCurrency(row.commissionVarRental1stPartners)}</TD>
                            <TD>{formatCurrency(row.netRevenueForFixedCosts)}</TD>
                            <TD>{formatCurrency(row.currentFixedCosts)}</TD>
                            <TD>{formatCurrency(row.currentPropertyPayment)}</TD>
                            <CashFlowCell value={row.monthlyCashFlow} />
                            <CashFlowCell value={row.accumulatedCashFlow} />
                            <TD>{formatPercent(row.contributionMarginPercent)}</TD>
                            <TD>{formatPercent(row.operatingProfitabilityPercent)}</TD>
                            <TD>{formatCurrency(row.breakEvenPoint)}</TD>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-200 font-bold text-dark-text border-t-2 border-gray-400">
                        <TD className="text-left">Total/Média</TD>
                        <TD className="text-center">{totals.totalSalesCount}</TD>
                        <TD>{formatCurrency(totals.totalVgv)}</TD>
                        <TD className="text-center">{totals.totalRentalsCount}</TD>
                        <TD>{formatCurrency(totals.grossRevenueSales)}</TD>
                        <TD>{formatCurrency(totals.grossRevenueRental1st)}</TD>
                        <TD>{formatCurrency(totals.grossRevenueRentalAdmin)}</TD>
                        <TD>{formatCurrency(totals.grossRevenueRegularization)}</TD>
                        <TD>{formatCurrency(totals.grossRevenueTotal)}</TD>
                        <TD>{formatCurrency(totals.taxAmount)}</TD>
                        <TD>{formatCurrency(totals.commissionVarSalesPartners)}</TD>
                        <TD>{formatCurrency(totals.commissionVarSalesBrokersPaid)}</TD>
                        <TD>{formatCurrency(totals.commissionVarRental1stPartners)}</TD>
                        <TD>{formatCurrency(totals.netRevenueForFixedCosts)}</TD>
                        <TD>{formatCurrency(totals.totalFixedCosts)}</TD>
                        <TD>{formatCurrency(totals.totalPropertyPayments)}</TD>
                        <TD>-</TD>
                        <CashFlowCell value={totals.finalAccumulatedCashFlow} />
                        <TD>{formatPercent(totals.avgContributionMarginPercent)}</TD>
                        <TD>{formatPercent(totals.avgOperatingProfitabilityPercent)}</TD>
                        <TD>{formatCurrency(totals.avgBreakEvenPoint)}</TD>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default ResultsTable;