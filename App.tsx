import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/Login';
import HomePage from './src/pages/HomePage';
import MarketAnalysisPage from './src/pages/MarketAnalysisPage';
import ListingGoalsPage from './src/pages/ListingGoalsPage';
import DashboardPage from './src/pages/DashboardPage';
import ImoveisPage from './src/pages/ImoveisPage';
import NewImovelPage from './src/pages/NewImovelPage';
import ViewImovelPage from './src/pages/ViewImovelPage';
import PessoasPage from './src/pages/PessoasPage';
import MapTestPage from './src/pages/MapTestPage';
import SystemSettingsPage from './src/pages/SystemSettingsPage';
import SiteSettingsPage from './src/pages/SiteSettingsPage';
import CondominiosPage from './src/pages/CondominiosPage';
import NewCondominioPage from './src/pages/NewCondominioPage';
import ViewCondominioPage from './src/pages/ViewCondominioPage';
import PlanilhaPage from './src/pages/PlanilhaPage';
import ExtractedImoveisPage from './src/pages/ExtractedImoveisPage';
import ChavesPage from './src/pages/ChavesPage';
import OportunidadesPage from './src/pages/OportunidadesPage';
import PropostasPage from './src/pages/PropostasPage';
import AtividadesPage from './src/pages/AtividadesPage';
import LeadsPage from './src/pages/LeadsPage';
import SalesDashboardPage from './src/pages/SalesDashboardPage';
import CRMLayout from './src/components/CRMLayout';
import PublicHomePage from './src/pages/PublicHomePage';
import PublicLayout from './src/layouts/PublicLayout';
import PublicImovelDetailsPage from './src/pages/PublicImovelDetailsPage';
import ImoveisPublicPage from './src/pages/ImoveisPublicPage';
import ErrorBoundary from './src/components/ErrorBoundary';
import SystemUsersPage from './src/pages/SystemUsersPage';
import DocumentosPage from './src/pages/DocumentosPage';

const AppContent: React.FC = () => {
    const { session } = useAuth();

    if (!session) {
        return (
            <Routes>
                <Route path="/" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/imoveis" element={<PublicLayout><ImoveisPublicPage /></PublicLayout>} />
                <Route path="/imoveis/:id" element={<PublicLayout><PublicImovelDetailsPage /></PublicLayout>} />
                <Route path="/sobre" element={<PublicLayout><div className="p-8 text-xl">Página Sobre Nós (Mock)</div></PublicLayout>} />
                <Route path="/contato" element={<PublicLayout><div className="p-8 text-xl">Página de Contato (Mock)</div></PublicLayout>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    return (
        <CRMLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/crm/dashboard" />} />
                <Route path="/crm/dashboard" element={<DashboardPage />} />
                <Route path="/crm/imoveis" element={<ImoveisPage />} />
                <Route path="/crm/imoveis/novo" element={<NewImovelPage />} />
                <Route path="/crm/imoveis/:id" element={<ViewImovelPage />} />
                <Route path="/crm/condominios" element={<CondominiosPage />} />
                <Route path="/crm/condominios/novo" element={<NewCondominioPage />} />
                <Route path="/crm/condominios/:id" element={<ViewCondominioPage />} />
                <Route path="/crm/agenciamento" element={<ExtractedImoveisPage />} />
                <Route path="/crm/agenciamento/planilhas/:id" element={<PlanilhaPage />} />
                <Route path="/crm/pessoas" element={<PessoasPage />} />
                <Route path="/crm/chaves" element={<ChavesPage />} />
                <Route path="/crm/oportunidades" element={<OportunidadesPage />} />
                <Route path="/crm/propostas" element={<PropostasPage />} />
                <Route path="/crm/atividades" element={<AtividadesPage />} />
                <Route path="/crm/leads" element={<LeadsPage />} />
                <Route path="/crm/sales-dashboard" element={<SalesDashboardPage />} />
                <Route path="/crm/sistema" element={<SystemSettingsPage />} />
                <Route path="/crm/sistema/site" element={<SiteSettingsPage />} />
                <Route path="/crm/sistema/usuarios" element={<SystemUsersPage />} />
                <Route path="/crm/sistema/geral" element={<div className="p-4 text-xl">Configurações Gerais (Em construção)</div>} />
                <Route path="/crm/documentos" element={<DocumentosPage />} />
                <Route path="/simulador" element={<HomePage />} />
                <Route path="/analise-de-mercado" element={<MarketAnalysisPage />} />
                <Route path="/metas-agenciamento" element={<ListingGoalsPage />} />
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
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;