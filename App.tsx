import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/Login';
import HomePage from './src/pages/HomePage'; // Agora é o Simulador
import MarketAnalysisPage from './src/pages/MarketAnalysisPage';
import ListingGoalsPage from './src/pages/ListingGoalsPage';
import DashboardPage from './src/pages/DashboardPage'; // Novo Dashboard do CRM
import ImoveisPage from './src/pages/ImoveisPage'; // Nova página de Imóveis
import NewImovelPage from './src/pages/NewImovelPage'; // Nova página de Cadastro de Imóvel
import ViewImovelPage from './src/pages/ViewImovelPage'; // Nova página de Visualização/Edição de Imóvel
import MapTestPage from './src/pages/MapTestPage'; // Nova página de Teste de Mapa
import CRMLayout from './src/components/CRMLayout'; // Novo Layout

const AppContent: React.FC = () => {
    const { session } = useAuth();

    if (!session) {
        return <LoginPage />;
    }

    return (
        <CRMLayout>
            <Routes>
                {/* Rota principal redireciona para o Dashboard do CRM */}
                <Route path="/" element={<Navigate to="/crm/dashboard" />} />
                
                {/* Páginas do CRM */}
                <Route path="/crm/dashboard" element={<DashboardPage />} />
                <Route path="/crm/imoveis" element={<ImoveisPage />} />
                <Route path="/crm/imoveis/novo" element={<NewImovelPage />} />
                <Route path="/crm/imoveis/:id" element={<ViewImovelPage />} /> {/* NOVA ROTA */}
                {/* Rotas placeholder para as outras funcionalidades do CRM */}
                <Route path="/crm/chaves" element={<div className="p-4 text-xl">Página de Chaves (Em construção)</div>} />
                <Route path="/crm/propostas" element={<div className="p-4 text-xl">Página de Propostas (Em construção)</div>} />
                <Route path="/crm/leads" element={<div className="p-4 text-xl">Página de Leads (Em construção)</div>} />
                <Route path="/crm/oportunidades" element={<div className="p-4 text-xl">Página de Oportunidades (Em construção)</div>} />
                <Route path="/crm/pessoas" element={<div className="p-4 text-xl">Página de Pessoas (Em construção)</div>} />
                <Route path="/crm/atividades" element={<div className="p-4 text-xl">Página de Atividades (Em construção)</div>} />
                
                {/* Ferramentas existentes */}
                <Route path="/simulador" element={<HomePage />} />
                <Route path="/analise-de-mercado" element={<MarketAnalysisPage />} />
                <Route path="/metas-agenciamento" element={<ListingGoalsPage />} />
                
                {/* Nova Rota de Teste */}
                <Route path="/mapa-teste" element={<MapTestPage />} />
                
                <Route path="*" element={<Navigate to="/crm/dashboard" />} />
            </Routes>
        </CRMLayout>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;