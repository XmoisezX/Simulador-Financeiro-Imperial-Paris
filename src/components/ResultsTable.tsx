import React from 'react';
import { MonthlyResult, SimulationTotals } from '../types';

interface ResultsTableProps {
    monthlyData: MonthlyResult[];
    totals: SimulationTotals;
    taxRate: number;
    startDate: string;
    onActualDataChange: (month: number, field: keyof MonthlyResult, value: number | null) => void;
    actualData: Record<number, Partial<MonthlyResult>>;
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

// Helper function to get the date for a given month index
const getMonthDate = (startDateStr: string, monthIndex: number): string => {
    const start = new Date(startDateStr + 'T00:00:00');
    const targetDate = new Date(start.getFullYear(), start.getMonth() + monthIndex - 1, 1);
    
    return targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};

// Helper function to determine the current month index (1-indexed)
const getCurrentMonthIndex = (startDateStr: string): number => {
    const start = new Date(startDateStr + 'T00:00:00');
    const now = new Date();
    
    const diffYears = now.getFullYear() - start.getFullYear();
    const diffMonths = now.getMonth() - start.getMonth();
    
    if (diffYears < 0 || (diffYears === 0 && diffMonths < 0)) {
        return 1;
    }
    
    return (diffYears * 12) + diffMonths + 1;
};

interface EditableCellProps {
    month: number; 
    field: keyof MonthlyResult; 
    projectedValue: number; 
    actualValue: number | null; 
    isCurrency?: boolean;
    isInteger?: boolean;
    onActualDataChange: (month: number, field: keyof MonthlyResult, value: number | null) => void;
    isPastMonth: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({ month, field, projectedValue, actualValue, isCurrency = false, isInteger = false, onActualDataChange, isPastMonth }) => {
    
    const displayValue = actualValue !== null ? actualValue : projectedValue;
    const isActual = actualValue !== null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        if (rawValue.trim() === '') {
            // Se o campo estiver vazio, passamos null para o handler
            onActualDataChange(month, field, null);
            return;
        }
        
        // 1. Remove pontos de milhar (se houver)
        // 2. Substitui a vírgula decimal por ponto
        const cleanValue = rawValue.replace(/\./g, '').replace(/,/g, '.');
        
        const numericValue = parseFloat(cleanValue);
        
        // Se o valor não for um número válido (NaN), não atualizamos o estado
        if (isNaN(numericValue)) {
            // Podemos optar por não fazer nada ou passar null se o usuário limpar o campo
            return; 
        }
        
        onActualDataChange(month, field, numericValue);
    };
    
    // Format the value for display in the input field
    const formattedDisplayValue = isCurrency
        ? (displayValue || displayValue === 0 ? new Intl.NumberFormat('pt-BR').format(Number(displayValue)) : '')
        : (isInteger ? (displayValue || displayValue === 0 ? Math.round(Number(displayValue)).toString() : '') : displayValue.toFixed(2)); // CORRIGIDO: Usando displayValue

    if (!isPastMonth) {
        // Display projected value only
        return <TD className={`text-right ${isCurrency ? '' : 'text-center'}`}>{isCurrency ? formatCurrency(projectedValue) : (isInteger ? projectedValue.toFixed(0) : projectedValue.toFixed(2))}</TD>;
    }

    // Para meses passados, usamos o valor real (se existir) ou o projetado para preencher o input
    const inputValue = actualValue !== null 
        ? (isCurrency ? new Intl.NumberFormat('pt-BR').format(actualValue) : (isInteger ? Math.round(actualValue).toString() : actualValue.toFixed(2)))
        : ''; // Se não houver valor real, o input começa vazio para facilitar a digitação

    const projectedDisplay = isCurrency ? formatCurrency(projectedValue) : (isInteger ? projectedValue.toFixed(0) : projectedValue.toFixed(2));

    return (
        <td className="p-0">
            <div className={`flex flex-col items-end justify-center h-full p-1 ${isActual ? 'bg-yellow-100' : 'bg-white'}`}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={projectedDisplay}
                    className={`w-full text-right text-xs md:text-sm border-none focus:ring-0 p-0 m-0 bg-transparent ${isActual ? 'font-bold text-dark-text' : 'text-gray-500'}`}
                    style={{ minWidth: isCurrency ? '100px' : '50px' }}
                />
                <span className="text-[10px] text-gray-400 italic">
                    {isActual ? `Proj: ${projectedDisplay}` : 'Projetado'}
                </span>
            </div>
        </td>
    );
};


const ResultsTable: React.FC<ResultsTableProps> = ({ monthlyData, totals, taxRate, startDate, onActualDataChange, actualData }) => {
    
    const currentMonthIndex = getCurrentMonthIndex(startDate);
    
    const headers = [
        "Mês", "Data", "Nº Vendas Total", "Nº Vendas (Sócio)", "Nº Vendas (Corr.)", "VGV", "Nº Aluguéis", "Fat Bruto Venda", "Fat Bruto Alug (1º)", "Fat Bruto Alug (Adm)", "Fat Bruto Reg.", "Fat Bruto Total",
        `Imposto SN (${taxRate}%)`, "Com Var Venda (S)", "Com Var Venda (C)", "Com Var Alug (1º S)", "Com Var Alug (Estag.)", // NOVO HEADER
        "Rec Líquida (p/ CF)", "Custo Fixo Total", "Pagto Imóvel", "Fluxo Caixa Mês", "Fluxo Caixa Acum.",
        "Margem Contrib.", "Lucratividade Op.", "Ponto Equil."
    ];

    const tooltips: { [key: string]: string } = {
        "Mês": "Mês da simulação.",
        "Data": "Data de referência para o mês da simulação.",
        "Nº Vendas Total": "Número total de vendas realizadas no mês (sócios + corretores).",
        "Nº Vendas (Sócio)": "Número de vendas realizadas pelos sócios.",
        "Nº Vendas (Corr.)": "Número de vendas realizadas pelos corretores externos.",
        "VGV": "Valor Geral de Vendas. (Nº Vendas Total * Valor Médio Venda). Representa o valor total dos imóveis transacionados.",
        "Nº Aluguéis": "Número de novos contratos de aluguel fechados no mês.",
        "Fat Bruto Venda": "Faturamento Bruto Total gerado apenas pelas vendas no mês. (Nº Vendas Total * Valor Médio Venda * % Comissão Empresa)",
        "Fat Bruto Alug (1º)": "Faturamento Bruto gerado pelos novos contratos de aluguel. (Nº Aluguéis Novos * Valor Médio Aluguel)",
        "Fat Bruto Alug (Adm)": "Faturamento Bruto recorrente da administração dos contratos de aluguel acumulados. (Nº Contratos Acum. * Valor Médio Aluguel * % Admin.)",
        "Fat Bruto Reg.": "Faturamento Bruto gerado pela regularização de imóveis.",
        "Fat Bruto Total": "Soma de todo o faturamento bruto da imobiliária no mês (antes de subtrair comissões de corretores externos).",
        [`Imposto SN (${taxRate}%)`]: `Valor do imposto Simples Nacional a ser pago. Calculado sobre o Faturamento Bruto Total MENOS a comissão dos corretores externos.`,
        "Com Var Venda (S)": "Comissão variável paga aos sócios sobre as vendas que eles realizaram.",
        "Com Var Venda (C)": "Comissão total paga aos corretores externos sobre as vendas que eles realizaram (venda + agenciamento). Este valor é subtraído do Faturamento Bruto antes do cálculo do imposto.",
        "Com Var Alug (1º S)": "Comissão variável paga aos sócios sobre os novos contratos de aluguel.",
        "Com Var Alug (Estag.)": "Comissão variável paga aos estagiários sobre os novos contratos de aluguel (1º aluguel).", // NOVO TOOLTIP
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
            <table className="w-full min-w-[2200px] border-collapse">
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
                    {monthlyData.map((row, index) => {
                        const isPastMonth = row.month < currentMonthIndex;
                        const monthDate = getMonthDate(startDate, row.month);
                        
                        // Determine if we should use actual or projected values for display in non-editable cells
                        const cashFlowMonth = row.monthlyCashFlow;
                        const cashFlowAccumulated = row.accumulatedCashFlow;

                        return (
                            <tr key={row.month} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50 transition-colors duration-150 ${isPastMonth ? 'border-l-4 border-yellow-500' : ''}`}>
                                <TD className="text-center font-semibold">{row.month}</TD>
                                <TD className="text-center text-gray-500">{monthDate}</TD>
                                
                                {/* Nº Vendas Total (Editable/Actual) */}
                                <EditableCell 
                                    month={row.month} 
                                    field="actualSalesCount" 
                                    projectedValue={row.salesCount} 
                                    actualValue={row.actualSalesCount} 
                                    onActualDataChange={onActualDataChange} 
                                    isPastMonth={isPastMonth}
                                    isInteger
                                />
                                
                                {/* Non-editable derived fields (Sales Partners/Brokers) */}
                                <TD className="text-center">{row.salesCountPartners}</TD>
                                <TD className="text-center">{row.salesCountBrokers}</TD>
                                
                                {/* VGV (Derived) */}
                                <TD>{formatCurrency(row.vgv)}</TD>
                                
                                {/* Nº Aluguéis (Editable/Actual) */}
                                <EditableCell 
                                    month={row.month} 
                                    field="actualRentalsCount" 
                                    projectedValue={row.rentalsCount} 
                                    actualValue={row.actualRentalsCount} 
                                    onActualDataChange={onActualDataChange} 
                                    isPastMonth={isPastMonth}
                                    isInteger
                                />
                                
                                {/* Revenue Fields (Derived from counts or overridden by Gross Revenue Total) */}
                                <TD>{formatCurrency(row.grossRevenueSales)}</TD>
                                <TD>{formatCurrency(row.grossRevenueRental1st)}</TD>
                                <TD>{formatCurrency(row.grossRevenueRentalAdmin)}</TD>
                                <TD>{formatCurrency(row.grossRevenueRegularization)}</TD>
                                
                                {/* Gross Revenue Total (Editable/Actual) */}
                                <EditableCell 
                                    month={row.month} 
                                    field="actualGrossRevenueTotal" 
                                    projectedValue={row.grossRevenueTotal} 
                                    actualValue={row.actualGrossRevenueTotal} 
                                    onActualDataChange={onActualDataChange} 
                                    isPastMonth={isPastMonth}
                                    isCurrency
                                />
                                
                                {/* Variable Costs (Derived) */}
                                <TD>{formatCurrency(row.taxAmount)}</TD>
                                <TD>{formatCurrency(row.commissionVarSalesPartners)}</TD>
                                <TD>{formatCurrency(row.commissionVarSalesBrokersPaid)}</TD>
                                <TD>{formatCurrency(row.commissionVarRental1stPartners)}</TD>
                                <TD>{formatCurrency(row.commissionVarRental1stInterns)}</TD> {/* NOVO CAMPO */}
                                
                                {/* Net Revenue (Derived) */}
                                <TD>{formatCurrency(row.netRevenueForFixedCosts)}</TD>
                                
                                {/* Fixed Costs (Editable/Actual) */}
                                <EditableCell 
                                    month={row.month} 
                                    field="actualCurrentFixedCosts" 
                                    projectedValue={row.currentFixedCosts} 
                                    actualValue={row.actualCurrentFixedCosts} 
                                    onActualDataChange={onActualDataChange} 
                                    isPastMonth={isPastMonth}
                                    isCurrency
                                />
                                
                                {/* Property Payment (Editable/Actual) */}
                                <EditableCell 
                                    month={row.month} 
                                    field="actualPropertyPayment" 
                                    projectedValue={row.currentPropertyPayment} 
                                    actualValue={row.actualPropertyPayment} 
                                    onActualDataChange={onActualDataChange} 
                                    isPastMonth={isPastMonth}
                                    isCurrency
                                />
                                
                                {/* Cash Flow (Derived) */}
                                <CashFlowCell value={cashFlowMonth} />
                                <CashFlowCell value={cashFlowAccumulated} />
                                
                                {/* Indices (Derived) */}
                                <TD>{formatPercent(row.contributionMarginPercent)}</TD>
                                <TD>{formatPercent(row.operatingProfitabilityPercent)}</TD>
                                <TD>{formatCurrency(row.breakEvenPoint)}</TD>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-200 font-bold text-dark-text border-t-2 border-gray-400">
                        <TD className="text-left">Total/Média</TD>
                        <TD>-</TD> {/* Data column */}
                        <TD className="text-center">{totals.totalSalesCount}</TD>
                        <TD className="text-center">{totals.totalSalesCount - monthlyData.reduce((acc, row) => acc + row.salesCountBrokers, 0)}</TD>
                        <TD className="text-center">{monthlyData.reduce((acc, row) => acc + row.salesCountBrokers, 0)}</TD>
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
                        <TD>{formatCurrency(totals.commissionVarRental1stInterns)}</TD> {/* NOVO TOTAL */}
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