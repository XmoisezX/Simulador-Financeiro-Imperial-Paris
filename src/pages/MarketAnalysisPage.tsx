import React, { useEffect, useRef, useState } from 'react';

// Let TypeScript know Chart.js is available on the window object from the CDN
declare var Chart: any;

const MarketAnalysisPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tab-overview');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('Centro');
    const [currentDate] = useState(new Date().toLocaleDateString('pt-BR'));

    const chartInstances = useRef<{[key: string]: any}>({});
    const marketTrendChartRef = useRef<HTMLCanvasElement>(null);
    const priceByNeighborhoodChartRef = useRef<HTMLCanvasElement>(null);
    const liquidityByNeighborhoodChartRef = useRef<HTMLCanvasElement>(null);
    const salesMixChartRef = useRef<HTMLCanvasElement>(null);
    const projectionChartRef = useRef<HTMLCanvasElement>(null);

    const neighborhoodData: { [key: string]: any } = {
        'Centro': {
            title: 'Centro',
            text: 'O Centro combina alta demanda de aluguel (proximidade com universidades e serviços) e um grande estoque de imóveis usados, muitos antigos. A liquidez é boa (110 dias), mas depende da precificação correta e do estado de conservação. Lançamentos são raros e muito valorizados.',
        },
        'Laranjal': {
            title: 'Laranjal',
            text: 'Principal bairro de alto padrão, focado em casas e condomínios de luxo. Possui o m² mais caro da cidade (R$ 7.000) e a melhor liquidez (90 dias), pois atende a um nicho específico e com alta demanda. A sazonalidade da praia influencia menos o mercado de venda.',
        },
        'Areal': {
            title: 'Areal',
            text: 'Bairro residencial tradicional, com boa infraestrutura. Tem atraído novos empreendimentos de médio e alto padrão. O preço do m² (R$ 4.800) é equilibrado e a liquidez é mediana (120 dias). Boa procura por famílias.',
        },
        'Porto': {
            title: 'Porto',
            text: 'Área com perfil misto, residencial e comercial. Valorização recente devido a novos empreendimentos próximos à universidade. O m² (R$ 4.500) é competitivo, mas a liquidez (140 dias) ainda é um pouco mais lenta que a do Centro.',
        },
        'Fragata': {
            title: 'Fragata',
            text: 'Bairro extenso, com grande foco residencial e preços mais acessíveis (R$ 4.200/m²). É um dos principais alvos para lançamentos do "Minha Casa, Minha Vida". A liquidez de usados é mais lenta (160 dias), refletindo um maior tempo de decisão de compra.',
        },
        'TresVendas': {
            title: 'Três Vendas',
            text: 'Similar ao Fragata, é uma grande zona residencial com os preços mais acessíveis da cidade (R$ 4.000/m²). Amplo estoque de imóveis usados e área de expansão para novos projetos populares. A liquidez é a mais lenta (170 dias).',
        }
    };

    useEffect(() => {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
        };

        const initChart = (ref: React.RefObject<HTMLCanvasElement>, id: string, config: any) => {
            if (ref.current && !chartInstances.current[id]) {
                const ctx = ref.current.getContext('2d');
                if (ctx) {
                    chartInstances.current[id] = new Chart(ctx, config);
                }
            }
        };

        if (activeTab === 'tab-overview') {
            initChart(marketTrendChartRef, 'marketTrendChart', {
                type: 'line',
                data: {
                    labels: ['2023', '2024', '2025 (Est.)', '2026 (Proj.)'],
                    datasets: [{
                        label: 'Preço Médio m²',
                        data: [4700, 5150, 5500, 5800],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: chartOptions
            });
        } else if (activeTab === 'tab-bairros') {
            initChart(priceByNeighborhoodChartRef, 'priceByNeighborhoodChart', {
                type: 'bar',
                data: {
                    labels: ['Laranjal', 'Centro', 'Areal', 'Porto', 'Fragata', 'Três Vendas'],
                    datasets: [{
                        label: 'Preço Médio por m²',
                        data: [7000, 5500, 4800, 4500, 4200, 4000],
                        backgroundColor: ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
                    }]
                },
                options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }
            });
            initChart(liquidityByNeighborhoodChartRef, 'liquidityByNeighborhoodChart', {
                type: 'bar',
                data: {
                    labels: ['Laranjal', 'Centro', 'Areal', 'Porto', 'Fragata', 'Três Vendas'],
                    datasets: [{
                        label: 'Dias para Venda',
                        data: [90, 110, 120, 140, 160, 170],
                        backgroundColor: '#3b82f6',
                    }]
                },
                options: { ...chartOptions, indexAxis: 'y', plugins: { ...chartOptions.plugins, legend: { display: false } } }
            });
        } else if (activeTab === 'tab-tipos') {
            initChart(salesMixChartRef, 'salesMixChart', {
                type: 'doughnut',
                data: {
                    labels: ['Imóveis Usados', 'Lançamentos / Na Planta'],
                    datasets: [{
                        data: [65, 35],
                        backgroundColor: ['#1e3a8a', '#60a5fa'],
                    }]
                },
                options: { ...chartOptions }
            });
        } else if (activeTab === 'tab-projecoes') {
            initChart(projectionChartRef, 'projectionChart', {
                type: 'bar',
                data: {
                    labels: ['Valorização Média 2025', 'Projeção Valorização 2026'],
                    datasets: [{
                        label: 'Preço Médio m²',
                        data: [5500, 5800],
                        backgroundColor: ['#3b82f6', '#1e3a8a'],
                    }]
                },
                options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }
            });
        }

        return () => {
            Object.values(chartInstances.current).forEach((chart: any) => chart.destroy());
            chartInstances.current = {};
        };
    }, [activeTab]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'tab-overview':
                return (
                    <div className="animate-fade-in">
                        <p className="text-base text-slate-700 mb-6 max-w-3xl">Esta seção apresenta uma visão macro do mercado imobiliário em Pelotas...</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                            <div className="kpi-card"><h2 className="kpi-title">Preço Médio m² (Urbano)</h2><p className="kpi-value">R$ 5.150</p></div>
                            <div className="kpi-card"><h2 className="kpi-title">Liquidez Média (Usados)</h2><p className="kpi-value">135 Dias</p></div>
                            <div className="kpi-card"><h2 className="kpi-title">Vendas Mensais (Média)</h2><p className="kpi-value">~350</p></div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Tendência de Valorização (Preço Médio m²)</h3><div className="chart-container"><canvas ref={marketTrendChartRef}></canvas></div></div>
                    </div>
                );
            case 'tab-bairros':
                return (
                    <div className="animate-fade-in">
                        <p className="text-base text-slate-700 mb-6 max-w-3xl">Explore as nuances do mercado em diferentes localidades...</p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow">
                                <h3 className="text-xl font-semibold mb-4 text-blue-900">Análise por Bairro</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Object.keys(neighborhoodData).map(key => (
                                        <button key={key} className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200" onClick={() => setSelectedNeighborhood(key)}>{neighborhoodData[key].title}</button>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg min-h-[200px]">
                                    <h4 className="text-lg font-semibold text-blue-800 mb-2">{neighborhoodData[selectedNeighborhood].title}</h4>
                                    <p className="text-slate-700 text-sm">{neighborhoodData[selectedNeighborhood].text}</p>
                                </div>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Preço Médio por m²</h3><div className="chart-container"><canvas ref={priceByNeighborhoodChartRef}></canvas></div></div>
                                <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Liquidez Média (Dias para Venda)</h3><div className="chart-container"><canvas ref={liquidityByNeighborhoodChartRef}></canvas></div></div>
                            </div>
                        </div>
                    </div>
                );
            case 'tab-tipos':
                return (
                    <div className="animate-fade-in">
                        <p className="text-base text-slate-700 mb-6 max-w-3xl">O mercado não é homogêneo. Esta seção compara o desempenho de imóveis usados versus lançamentos...</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                                <h3 className="text-xl font-semibold mb-6 text-blue-900">Comparativo: Usados vs. Lançamentos</h3>
                                <div className="space-y-6">
                                    <div><h4 className="text-lg font-semibold text-blue-800">Imóveis Usados</h4><ul className="list-disc list-inside mt-2 text-slate-700 space-y-1"><li><strong>Liquidez:</strong> Média de 120-150 dias.</li><li><strong>Demanda:</strong> Forte para imóveis bem localizados.</li></ul></div>
                                    <div><h4 className="text-lg font-semibold text-blue-800">Lançamentos (Na Planta)</h4><ul className="list-disc list-inside mt-2 text-slate-700 space-y-1"><li><strong>Liquidez:</strong> Alta, média de 60-90 dias.</li><li><strong>Atrativo:</strong> Facilidades de pagamento.</li></ul></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Mix de Vendas (Últimos 12 Meses)</h3><div className="chart-container"><canvas ref={salesMixChartRef}></canvas></div></div>
                        </div>
                    </div>
                );
            case 'tab-projecoes':
                return (
                    <div className="animate-fade-in">
                        <p className="text-base text-slate-700 mb-6 max-w-3xl">Olhando para o futuro, esta seção detalha as projeções e tendências esperadas...</p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                                <h3 className="text-xl font-semibold mb-6 text-blue-900">Tendências e Projeções para 2026</h3>
                                <div className="space-y-4 text-slate-700">
                                    <div><h4 className="font-semibold text-blue-800">Crescimento Cauteloso</h4><p>Espera-se uma valorização média de 5-7% ao ano...</p></div>
                                    <div><h4 className="font-semibold text-blue-800">Foco em Nichos</h4><p>A demanda por imóveis do programa "Minha Casa, Minha Vida" deve crescer...</p></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Projeção de Valorização (Preço Médio m²)</h3><div className="chart-container"><canvas ref={projectionChartRef}></canvas></div></div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-50 text-slate-900">
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderTabContent()}
            </main>
            <footer className="text-center text-slate-500 text-sm py-8 mt-8 border-t border-slate-200">
                <p>Análise simulada gerada em {currentDate}.</p>
                <p>Este é um relatório demonstrativo e não representa dados oficiais do mercado.</p>
            </footer>
        </div>
    );
};

export default MarketAnalysisPage;