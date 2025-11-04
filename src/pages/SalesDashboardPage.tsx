import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DollarSign, Loader2, RefreshCw, AlertTriangle, Users, TrendingUp, FileText, Clock, Target, Calendar, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import KpiCard from '../components/KpiCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import LeadSourcePieChart from '../components/charts/LeadSourcePieChart';
import OpportunityStatusPieChart from '../components/charts/OpportunityStatusPieChart';
import BrokerComparisonBarChart from '../components/charts/BrokerComparisonBarChart';
import BrokerPerformanceTable from '../components/BrokerPerformanceTable';

interface CompanyMetrics {
    total_leads: number;
    leads_to_opportunities_conversion: number;
    leads_to_sales_conversion: number;
    lead_sources: Record<string, number>;
    total_activities: number;
    on_time_activities_percent: number;
    opportunities_open: number;
    opportunities_in_progress: number;
    opportunities_closed: number;
    opportunities_total_value: number;
    opportunities_avg_value: number;
    opportunities_avg_time_in_funnel_days: number;
    proposals_issued: number;
    proposals_accepted: number;
    proposals_total_value: number;
    proposals_approval_rate: number;
    sales_total_sold_month: number;
    sales_total_sold_ytd: number;
    sales_avg_ticket: number;
    sales_total_revenue: number;
    company_monthly_growth_percent: number;
    company_overall_funnel_conversion: number;
    company_avg_closing_time_days: number;
}

interface BrokerPerformance {
    broker_id: string;
    broker_name: string;
    leads_attended: number;
    proposals_sent: number;
    sales_closed: number;
    individual_conversion_rate: number;
    revenue_generated: number;
}

const formatCurrency = (value: number | null) =>
  value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';
const formatPercent = (value: number | null) =>
  value !== null ? `${(value * 100).toFixed(2)}%` : 'N/A';

const SalesDashboardPage: React.FC = () => {
    const { session } = useAuth();

    // Período (padrão: últimos 12 meses)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
    const [brokerPerformance, setBrokerPerformance] = useState<BrokerPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Corretores: seletor de foco
    const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');

    const fetchDashboardData = useCallback(async () => {
        if (!session) {
            setError('Você precisa estar logado para ver o painel de vendas.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1) Métricas gerais da empresa
            const { data: companyData, error: companyError } = await supabase.rpc('get_company_sales_metrics', {
                p_user_id: session.user.id,
                p_start_date: startDate,
                p_end_date: endDate,
            });

            if (companyError) {
                console.error('Erro ao buscar métricas da empresa:', companyError);
                throw new Error(`Falha ao carregar métricas da empresa: ${companyError.message}`);
            }
            if (companyData && companyData.length > 0) {
                setCompanyMetrics(companyData[0] as CompanyMetrics);
            } else {
                setCompanyMetrics(null);
            }

            // 2) Desempenho dos corretores
            const { data: brokerData, error: brokerError } = await supabase.rpc('get_broker_sales_performance', {
                p_user_id: session.user.id,
                p_start_date: startDate,
                p_end_date: endDate,
            });

            if (brokerError) {
                console.error('Erro ao buscar desempenho dos corretores:', brokerError);
                throw new Error(`Falha ao carregar desempenho dos corretores: ${brokerError.message}`);
            }
            setBrokerPerformance((brokerData || []) as BrokerPerformance[]);

            // Ajusta o corretor selecionado caso não exista na lista
            if (selectedBrokerId && !brokerData?.some((b: BrokerPerformance) => b.broker_id === selectedBrokerId)) {
                setSelectedBrokerId('');
            }
        } catch (e) {
            console.error('Erro geral ao buscar dados do dashboard:', e);
            setError(e instanceof Error ? e.message : 'Erro desconhecido ao carregar o painel.');
        } finally {
            setIsLoading(false);
        }
    }, [session, startDate, endDate, selectedBrokerId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Broker selecionado
    const selectedBroker = useMemo(
        () => brokerPerformance.find(b => b.broker_id === selectedBrokerId) || null,
        [brokerPerformance, selectedBrokerId]
    );

    // Cards por corretor (resumo tabular -> cards)
    const BrokerCards: React.FC<{ broker: BrokerPerformance }> = ({ broker }) => (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KpiCard title="Leads Atendidos" value={broker.leads_attended.toString()} />
            <KpiCard title="Propostas Enviadas" value={broker.proposals_sent.toString()} />
            <KpiCard title="Vendas Fechadas" value={broker.sales_closed.toString()} status={broker.sales_closed > 0 ? 'positive' : 'neutral'} />
            <KpiCard title="Conversão Individual" value={formatPercent(broker.individual_conversion_rate)} />
            <KpiCard title="Receita Gerada" value={formatCurrency(broker.revenue_generated)} status={broker.revenue_generated > 0 ? 'positive' : 'neutral'} />
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <p className="text-gray-600">Carregando painel de vendas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-md min-h-[500px]">
                <h2 className="text-xl font-bold flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> Erro ao Carregar Painel</h2>
                <p className="mt-2">{error}</p>
                <div className="flex items-center gap-2 mt-4">
                    <Button onClick={fetchDashboardData} className="bg-red-600 hover:bg-red-700 text-white">
                        <RefreshCw className="w-4 h-4 mr-2" /> Tentar Recarregar
                    </Button>
                </div>
            </div>
        );
    }

    const hasCompanyData = !!companyMetrics || brokerPerformance.length > 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8">
            {/* Header + Filtros de Período */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-dark-text flex items-center">
                        <DollarSign className="w-6 h-6 mr-2 text-blue-600" /> Painel de Gestão de Vendas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Acompanhe resultados, produtividade e conversões por período e por corretor.</p>
                </div>
                <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Início</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 text-sm"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Fim</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 text-sm"
                        />
                    </div>
                    <Button 
                        onClick={fetchDashboardData}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Aplicar
                    </Button>
                </div>
            </div>

            {!hasCompanyData && (
                <div className="p-8 text-center text-gray-600 min-h-[300px]">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2">Nenhum dado encontrado para o período.</h2>
                    <p className="text-lg">Registre leads, atividades, oportunidades e propostas para ver o painel em ação.</p>
                </div>
            )}

            {/* Indicadores Gerais da Imobiliária */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-text flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-primary-orange" /> Indicadores Gerais da Imobiliária</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                    <KpiCard title="Receita (Período)" value={formatCurrency(companyMetrics?.sales_total_revenue)} status={companyMetrics && companyMetrics.sales_total_revenue > 0 ? 'positive' : 'neutral'} />
                    <KpiCard title="Leads Recebidos" value={companyMetrics?.total_leads?.toString() || 'N/A'} />
                    <KpiCard title="Conv. Leads > Oportunidades" value={formatPercent(companyMetrics?.leads_to_opportunities_conversion)} />
                    <KpiCard title="Conv. Leads > Vendas" value={formatPercent(companyMetrics?.leads_to_sales_conversion)} />
                    <KpiCard title="Ticket Médio" value={formatCurrency(companyMetrics?.sales_avg_ticket)} />
                    <KpiCard title="Crescimento Mensal" value={formatPercent(companyMetrics?.company_monthly_growth_percent)} status={companyMetrics && companyMetrics.company_monthly_growth_percent > 0 ? 'positive' : 'neutral'} />
                </div>
            </section>

            {/* Leads e Oportunidades (Gráficos) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Origem dos Leads</h3>
                        {companyMetrics?.lead_sources && Object.keys(companyMetrics.lead_sources).length > 0 ? (
                            <div className="h-64">
                                <LeadSourcePieChart data={companyMetrics.lead_sources} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado de origem de leads no período.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-600" /> Status das Oportunidades</h3>
                        {companyMetrics && (companyMetrics.opportunities_open > 0 || companyMetrics.opportunities_in_progress > 0 || companyMetrics.opportunities_closed > 0) ? (
                            <div className="h-64">
                                <OpportunityStatusPieChart 
                                    open={companyMetrics.opportunities_open}
                                    inProgress={companyMetrics.opportunities_in_progress}
                                    closed={companyMetrics.opportunities_closed}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhuma oportunidade registrada no período.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Desempenho por Corretor - Ranking, Gráfico de barras e Cards individuais */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-dark-text flex items-center"><Users className="w-5 h-5 mr-2 text-purple-600" /> Desempenho por Corretor</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Corretor:</label>
                        <select
                            value={selectedBrokerId}
                            onChange={(e) => setSelectedBrokerId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm text-dark-text bg-white"
                        >
                            <option value="">Todos</option>
                            {brokerPerformance.map(b => (
                                <option key={b.broker_id} value={b.broker_id}>{b.broker_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Card className="shadow-md">
                    <CardContent className="p-6">
                        {brokerPerformance.length > 0 ? (
                            <div className="h-80">
                                <BrokerComparisonBarChart data={brokerPerformance} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum corretor com desempenho registrado no período.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cards do corretor selecionado OU cards para todos (resumo) */}
                {selectedBroker ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <p className="text-sm text-gray-700">Resumo do Corretor Selecionado</p>
                        </div>
                        <BrokerCards broker={selectedBroker} />
                    </div>
                ) : (
                    brokerPerformance.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                <p className="text-sm text-gray-700">Resumo de Corretores</p>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {brokerPerformance.map(b => (
                                    <div key={b.broker_id} className="p-4 bg-white border rounded-lg shadow-sm">
                                        <div className="mb-3 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-semibold text-dark-text">{b.broker_name}</span>
                                        </div>
                                        <BrokerCards broker={b} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                <Card className="shadow-md">
                    <CardContent className="p-0">
                        {brokerPerformance.length > 0 ? (
                            <BrokerPerformanceTable data={brokerPerformance} />
                        ) : (
                            <div className="p-6 text-center text-gray-500">Nenhum dado detalhado de desempenho de corretores.</div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};

export default SalesDashboardPage;