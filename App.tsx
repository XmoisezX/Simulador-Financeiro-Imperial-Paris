import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/Login';
import HomePage from './src/pages/HomePage'; // Simulador
import MarketAnalysisPage from './src/pages/MarketAnalysisPage';
import ListingGoalsPage from './src/pages/ListingGoalsPage';
import DashboardPage from './src/pages/DashboardPage'; // Dashboard do CRM
import ImoveisPage from './src/pages/ImoveisPage';
import NewImovelPage from './src/pages/NewImovelPage';
import ViewImovelPage from './src/pages/ViewImovelPage';
import PessoasPage from './src/pages/PessoasPage';
import MapTestPage from './src/pages/MapTestPage';
import CRMLayout from './src/components/CRMLayout';
import PublicHomePage from './src/pages/PublicHomePage'; // NOVA PÁGINA
import PublicLayout from './src/layouts/PublicLayout'; // NOVO LAYOUT

const AppContent: React.FC = () => {
    const { session } = useAuth();

    if (!session) {
        // Rotas Públicas (Usuário deslogado)
        return (
            <Routes>
                <Route path="/" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
                <Route path="/login" element={<LoginPage />} />
                {/* Rotas públicas mockadas */}
                <Route path="/imoveis" element={<PublicLayout><div className="p-8 text-xl">Página de Imóveis (Mock)</div></PublicLayout>} />
                <Route path="/sobre" element={<PublicLayout><div className="p-8 text-xl">Página Sobre Nós (Mock)</div></PublicLayout>} />
                <Route path="/contato" element={<PublicLayout><div className="p-8 text-xl">Página de Contato (Mock)</div></PublicLayout>} />
                
                {/* Redireciona qualquer outra rota para a home pública */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    // Rotas do CRM (Usuário logado)
    return (
        <CRMLayout>
            <Routes>
                {/* Rota principal redireciona para o Dashboard do CRM */}
                <Route path="/" element={<Navigate to="/crm/dashboard" />} />
                
                {/* Páginas do CRM */}
                <Route path="/crm/dashboard" element={<DashboardPage />} />
                <Route path="/crm/imoveis" element={<ImoveisPage />} />
                <Route path="/crm/imoveis/novo" element={<NewImovelPage />} />
                <Route path="/crm/imoveis/:id" element={<ViewImovelPage />} />
                <Route path="/crm/pessoas" element={<PessoasPage />} />
                {/* Rotas placeholder para as outras funcionalidades do CRM */}
                <Route path="/crm/chaves" element={<div className="p-4 text-xl">Página de Chaves (Em construção)</div>} />
                <Route path="/crm/propostas" element={<div className="p-4 text-xl">Página de Propostas (Em construção)</div>} />
                <Route path="/crm/leads" element={<div className="p-4 text-xl">Página de Leads (Em construção)</div>} />
                <Route path="/crm/oportunidades" element={<div className="p-4 text-xl">Página de Oportunidades (Em construção)</div>} />
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