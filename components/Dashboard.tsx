import React from 'react';
import { SimulationInput, SimulationResult } from '../types';
import KpiCard from './KpiCard';
import CashFlowChart from './CashFlowChart';
import RevenueChart from './RevenueChart';
import ResultsTable from './ResultsTable';
import CollapsibleCard from './CollapsibleCard';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Dashboard: React.FC<{ results: SimulationResult, inputs: SimulationInput }> = ({ results, inputs }) => {
    const { summary, monthlyData, totals } = results;
    
    const totalNetRevenue = totals.netRevenueForFixedCosts - totals.totalFixedCosts;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Caixa Final Acumulado" value={formatCurrency(summary.finalCash)} status={summary.isViable ? 'positive' : 'negative'} />
                <KpiCard title="Receita Bruta Total" value={formatCurrency(totals.grossRevenueTotal)} />
                <KpiCard title="Resultado Líquido Total" value={formatCurrency(totalNetRevenue)} status={totalNetRevenue >= 0 ? 'positive' : 'negative'} />
                <KpiCard title="Cenário Viável?" value={summary.isViable ? 'Sim ✅' : 'Não ❌'} status={summary.isViable ? 'positive' : 'negative'} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Fluxo de Caixa Mensal e Acumulado</h3>
                    <CashFlowChart data={monthlyData} />
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Composição da Receita Bruta</h3>
                    <RevenueChart data={monthlyData} />
                </div>
            </div>

            {/* Detailed Table Section */}
            <CollapsibleCard title="Visão Detalhada Mês a Mês">
                 <ResultsTable monthlyData={monthlyData} totals={totals} taxRate={inputs.taxRate} />
            </CollapsibleCard>
        </div>
    );
};

export default Dashboard;
