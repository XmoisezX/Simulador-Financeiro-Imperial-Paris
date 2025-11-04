import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DollarSign, Loader2, RefreshCw, AlertTriangle, Users, TrendingUp, FileText, Clock, Target, Calendar, User, Home, Building } from 'lucide-react';
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

interface BrokerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const formatCurrency = (value: number | null) =>
  value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';
const formatPercent = (value: number | null) =>
  value !== null ? `${(value * 100).toFixed(2)}%` : 'N/A';

const isValidIsoDate = (s: string | null | undefined) => {
  if (!s) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
};

const SalesDashboardPage: React.FC = () => {
  const { session } = useAuth();

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    { key: 'imoveis', label: 'Imóveis', icon: <Building className="w-4 h-4" /> },
    { key: 'leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { key: 'corretores', label: 'Corretores', icon: <User className="w-4 h-4" /> },
    { key: 'relatorios', label: 'Relatórios', icon: <FileText className="w-4 h-4" /> },
  ] as const;
  type TabKey = typeof tabs[number]['key'];
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
  const [brokerPerformance, setBrokerPerformance] = useState<BrokerPerformance[]>([]);
  const [brokerProfiles, setBrokerProfiles] = useState<Record<string, BrokerProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const p_start_date = isValidIsoDate(startDate) ? startDate : null;
      const p_end_date = isValidIsoDate(endDate) ? endDate : null;

      const { data: companyData, error: companyError } = await supabase.rpc('get_company_sales_metrics', {
        p_user_id: session.user.id,
        p_start_date,
        p_end_date,
      });
      if (companyError) throw new Error(`Falha ao carregar métricas da empresa: ${companyError.message}`);
      setCompanyMetrics(companyData && companyData.length > 0 ? (companyData[0] as CompanyMetrics) : null);

      const { data: brokerData, error: brokerError } = await supabase.rpc('get_broker_sales_performance', {
        p_user_id: session.user.id,
        p_start_date,
        p_end_date,
      });
      if (brokerError) throw new Error(`Falha ao carregar desempenho dos corretores: ${brokerError.message}`);
      const list = (brokerData || []) as BrokerPerformance[];
      setBrokerPerformance(list);

      if (selectedBrokerId && !list.some(b => b.broker_id === selectedBrokerId)) {
        setSelectedBrokerId('');
      }

      const ids = list.map(b => b.broker_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', ids);
        if (profs) {
          const map: Record<string, BrokerProfile> = {};
          for (const p of profs as BrokerProfile[]) map[p.id] = p;
          setBrokerProfiles(map);
        } else {
          setBrokerProfiles({});
        }
      } else {
        setBrokerProfiles({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido ao carregar o painel.');
    } finally {
      setIsLoading(false);
    }
  }, [session, startDate, endDate, selectedBrokerId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const selectedBroker = useMemo(
    () => brokerPerformance.find(b => b.broker_id === selectedBrokerId) || null,
    [brokerPerformance, selectedBrokerId]
  );

  const topBroker = useMemo(() => {
    if (brokerPerformance.length === 0) return null;
    return [...brokerPerformance].sort((a, b) => (b.revenue_generated || 0) - (a.revenue_generated || 0))[0];
  }, [brokerPerformance]);

  const BrokerCards: React.FC<{ broker: BrokerPerformance }> = ({ broker }) => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <KpiCard title="Leads Atendidos" value={broker.leads_attended.toString()} />
      <KpiCard title="Propostas Enviadas" value={broker.proposals_sent.toString()} />
      <KpiCard title="Vendas Fechadas" value={broker.sales_closed.toString()} status={broker.sales_closed > 0 ? 'positive' : 'neutral'} />
      <KpiCard title="Conversão Individual" value={formatPercent(broker.individual_conversion_rate)} />
      <KpiCard title="Receita Gerada" value={formatCurrency(broker.revenue_generated)} status={broker.revenue_generated > 0 ? 'positive' : 'neutral'} />
    </div>
  );

  // TabsBar: now sticky directly under header (top-16)
  const TabsBar = (
    <nav className="sticky top-16 z-10 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`flex items-center gap-2 py-4 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key ? 'border-blue-600 text-blue-800' : 'border-transparent text-slate-500 hover:text-blue-700'
              }`}
              onClick={() => setActiveTab(t.key)}
              aria-current={activeTab === t.key ? 'page' : undefined}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  const PeriodFilters = (
    <div className="flex items-end gap-2 flex-wrap">
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Início</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Fim</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-md p-2 text-sm" />
      </div>
      <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700 text-white">
        <RefreshCw className="w-4 h-4 mr-2" /> Aplicar
      </Button>
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

  const BrokerHeaderCard: React.FC<{ b: BrokerPerformance }> = ({ b }) => {
    const profile = brokerProfiles[b.broker_id];
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={profile?.avatar_url || '/LOGO LARANJA.png'}
            alt={profile?.full_name || b.broker_name || 'Corretor'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-dark-text">{profile?.full_name || b.broker_name || 'Corretor'}</p>
            <p className="text-xs text-gray-500">{profile?.email || '—'}</p>
          </div>
        </div>
        <BrokerCards broker={b} />
      </div>
    );
  };

  return (
    <div className="p-0">
      {TabsBar}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark-text flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-blue-600" /> Painel de Gestão de Vendas
            </h1>
            <p className="text-sm text-gray-500 mt-1">Acompanhe resultados, produtividade e conversões por período e por corretor.</p>
          </div>
          {PeriodFilters}
        </div>

        {!hasCompanyData && (
          <div className="p-8 text-center text-gray-600 min-h-[300px]">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Nenhum dado encontrado para o período.</h2>
            <p className="text-lg">Registre leads, atividades, oportunidades e propostas para ver o painel em ação.</p>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <KpiCard title="Receita (Período)" value={formatCurrency(companyMetrics?.sales_total_revenue)} status={companyMetrics && companyMetrics.sales_total_revenue > 0 ? 'positive' : 'neutral'} />
              <KpiCard title="Leads Recebidos" value={companyMetrics?.total_leads?.toString() || 'N/A'} />
              <KpiCard title="Conv. Leads > Oportunidades" value={formatPercent(companyMetrics?.leads_to_opportunities_conversion)} />
              <KpiCard title="Conv. Leads > Vendas" value={formatPercent(companyMetrics?.leads_to_sales_conversion)} />
              <KpiCard title="Ticket Médio" value={formatCurrency(companyMetrics?.sales_avg_ticket)} />
              <KpiCard title="Crescimento Mensal" value={formatPercent(companyMetrics?.company_monthly_growth_percent)} status={companyMetrics && companyMetrics.company_monthly_growth_percent > 0 ? 'positive' : 'neutral'} />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {brokerPerformance.map((b) => (
                <BrokerHeaderCard key={b.broker_id} b={b} />
              ))}
            </div>
          </section>
        )}

        {activeTab === 'imoveis' && (
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-dark-text flex items-center"><Building className="w-5 h-5 mr-2 text-blue-600" /> Resumo de Oportunidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <KpiCard title="Abertas" value={`${companyMetrics?.opportunities_open || 0}`} />
              <KpiCard title="Em Andamento" value={`${companyMetrics?.opportunities_in_progress || 0}`} />
              <KpiCard title="Encerradas" value={`${companyMetrics?.opportunities_closed || 0}`} />
              <KpiCard title="Valor Total" value={formatCurrency(companyMetrics?.opportunities_total_value)} />
              <KpiCard title="Ticket Médio Oportunidade" value={formatCurrency(companyMetrics?.opportunities_avg_value)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-600" /> Status das Oportunidades</h3>
                  <div className="h-64">
                    <OpportunityStatusPieChart
                      open={companyMetrics?.opportunities_open || 0}
                      inProgress={companyMetrics?.opportunities_in_progress || 0}
                      closed={companyMetrics?.opportunities_closed || 0}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-purple-600" /> Comparativo por Corretor</h3>
                  <div className="h-64">
                    <BrokerComparisonBarChart data={brokerPerformance} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {activeTab === 'leads' && (
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-dark-text flex items-center"><Users className="w-5 h-5 mr-2 text-orange-600" /> Resumo de Leads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <KpiCard title="Total de Leads" value={`${companyMetrics?.total_leads || 0}`} />
              <KpiCard title="Novos > Oportunidades" value={formatPercent(companyMetrics?.leads_to_opportunities_conversion)} />
              <KpiCard title="Novos > Vendas" value={formatPercent(companyMetrics?.leads_to_sales_conversion)} />
              <KpiCard title="Atividades (Total)" value={`${companyMetrics?.total_activities || 0}`} />
              <KpiCard title="Tarefas no Prazo" value={formatPercent(companyMetrics?.on_time_activities_percent)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Origem dos Leads</h3>
                  <div className="h-64">
                    <LeadSourcePieChart data={companyMetrics?.lead_sources || {}} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-600" /> Resumo por Corretor</h3>
                  <div className="h-64">
                    <BrokerComparisonBarChart data={brokerPerformance} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {activeTab === 'corretores' && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard title="Total de Corretores" value={`${brokerPerformance.length}`} />
              <KpiCard title="Média Leads/Corretor" value={
                brokerPerformance.length
                  ? (brokerPerformance.reduce((a, b) => a + (b.leads_attended || 0), 0) / brokerPerformance.length).toFixed(1)
                  : '0.0'
              } />
              <KpiCard title="Média Vendas/Corretor" value={
                brokerPerformance.length
                  ? (brokerPerformance.reduce((a, b) => a + (b.sales_closed || 0), 0) / brokerPerformance.length).toFixed(1)
                  : '0.0'
              } />
              <KpiCard title="Destaque em Vendas" value={topBroker ? (brokerProfiles[topBroker.broker_id]?.full_name || topBroker.broker_name) : 'N/A'} />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Corretor:</label>
              <select
                value={selectedBrokerId}
                onChange={(e) => setSelectedBrokerId(e.target.value)}
                className="p-2 border border-gray-300 rounded-md text-sm text-dark-text bg-white"
              >
                <option value="">Todos</option>
                {brokerPerformance.map((b) => (
                  <option key={b.broker_id} value={b.broker_id}>
                    {brokerProfiles[b.broker_id]?.full_name || b.broker_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedBroker ? (
              <BrokerHeaderCard b={selectedBroker} />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {brokerPerformance.map((b) => (
                  <BrokerHeaderCard key={b.broker_id} b={b} />
                ))}
              </div>
            )}

            <Card className="shadow-md">
              <CardContent className="p-0">
                <BrokerPerformanceTable data={selectedBroker ? [selectedBroker] : brokerPerformance} />
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === 'relatorios' && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <KpiCard title="Receita (Período)" value={formatCurrency(companyMetrics?.sales_total_revenue)} status={companyMetrics && companyMetrics.sales_total_revenue > 0 ? 'positive' : 'neutral'} />
              <KpiCard title="Leads Recebidos" value={companyMetrics?.total_leads?.toString() || 'N/A'} />
              <KpiCard title="Conv. Geral do Funil" value={formatPercent(companyMetrics?.company_overall_funnel_conversion)} />
              <KpiCard title="Tempo Médio de Fechamento" value={`${companyMetrics?.company_avg_closing_time_days?.toFixed?.(1) || '0'} dias`} />
              <KpiCard title="Propostas Emitidas" value={`${companyMetrics?.proposals_issued || 0}`} />
              <KpiCard title="Taxa de Aprovação" value={formatPercent(companyMetrics?.proposals_approval_rate)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Origem dos Leads</h3>
                  <div className="h-64">
                    <LeadSourcePieChart data={companyMetrics?.lead_sources || {}} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-600" /> Status das Oportunidades</h3>
                  <div className="h-64">
                    <OpportunityStatusPieChart
                      open={companyMetrics?.opportunities_open || 0}
                      inProgress={companyMetrics?.opportunities_in_progress || 0}
                      closed={companyMetrics?.opportunities_closed || 0}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-purple-600" /> Comparativo por Corretor</h3>
                <div className="h-80">
                  <BrokerComparisonBarChart data={brokerPerformance} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardContent className="p-0">
                <BrokerPerformanceTable data={brokerPerformance} />
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default SalesDashboardPage;