import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Key, FileText, Users, Briefcase, CalendarCheck, Zap, DollarSign, Target, Map, Menu, X, Settings, Globe, Building2, TrendingUp, Shield } from 'lucide-react';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isSidebarOpen: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isSidebarOpen, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${isSidebarOpen ? 'justify-start' : 'justify-center'} ${isActive ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-600 hover:bg-gray-100'}`}
            title={label}
        >
            {icon}
            {isSidebarOpen && <span className="ml-3 text-sm whitespace-nowrap">{label}</span>}
        </Link>
    );
};

interface CRMSidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ isOpen, toggleSidebar }) => {
    const [isSystemOpen, setIsSystemOpen] = useState(false);

    const handleSystemClick = () => {
        if (isOpen) {
            setIsSystemOpen(prev => !prev);
        } else {
            toggleSidebar();
            setIsSystemOpen(true);
        }
    };
    
    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            toggleSidebar();
        }
    };

    // Desktop sidebar (visible on lg)
    const DesktopAside = (
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto h-full sticky top-[88px]">
            <div className="space-y-1 px-4 pb-4"> 
                <div className="flex justify-end p-3">
                    <button 
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-slate-600 hover:bg-gray-100"
                        title="Recolher Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Navegação</h3>
                
                <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={true} onClick={handleNavClick} />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Imóveis & Vendas</h3>
                <NavItem to="/crm/sales-dashboard" icon={<DollarSign className="w-5 h-5" />} label="Painel de Vendas" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/condominios" icon={<Building2 className="w-5 h-5" />} label="Condomínios" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/agenciamento" icon={<Briefcase className="w-5 h-5" />} label="Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/oportunidades" icon={<TrendingUp className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={true} onClick={handleNavClick} />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Pessoas & Rotinas</h3>
                <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={true} onClick={handleNavClick} />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Ferramentas</h3>
                <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={true} onClick={handleNavClick} />

                <div className="pt-3">
                    <NavItem to="/crm/documentos" icon={<FileText className="w-5 h-5" />} label="Documentos" isSidebarOpen={true} onClick={handleNavClick} />
                </div>
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Administração</h3>
                
                <div className="relative">
                    <button
                        onClick={handleSystemClick}
                        className="flex items-center p-3 rounded-lg transition-colors duration-150 w-full justify-start text-slate-600 hover:bg-gray-100"
                        title="Sistema"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="ml-3 text-sm whitespace-nowrap">Sistema</span>
                    </button>
                    
                    {isSystemOpen && (
                        <div className="pl-4 pt-1 space-y-1">
                            <NavItem to="/crm/sistema/site" icon={<Globe className="w-5 h-5" />} label="Site" isSidebarOpen={true} onClick={handleNavClick} />
                            <NavItem to="/crm/sistema/usuarios" icon={<Shield className="w-5 h-5" />} label="Usuários e Permissões" isSidebarOpen={true} onClick={handleNavClick} />
                            <NavItem to="/crm/sistema/geral" icon={<Settings className="w-5 h-5" />} label="Geral (Mock)" isSidebarOpen={true} onClick={handleNavClick} />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    // Mobile panel (visible on small screens). Renders when isOpen is true.
    const MobilePanel = (
        <>
            {/* overlay (only visible on small screens via tailwind) */}
            {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={toggleSidebar}></div>}

            <div className={`fixed top-0 right-0 bottom-0 w-64 bg-white z-40 p-4 overflow-y-auto lg:hidden transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Menu className="w-6 h-6 text-slate-600" />
                        <span className="font-semibold text-dark-text">Menu</span>
                    </div>
                    <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/sales-dashboard" icon={<DollarSign className="w-5 h-5" />} label="Painel de Vendas" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/condominios" icon={<Building2 className="w-5 h-5" />} label="Condomínios" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/agenciamento" icon={<Briefcase className="w-5 h-5" />} label="Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={true} onClick={handleNavClick} />
                <NavItem to="/crm/oportunidades" icon={<TrendingUp className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={true} onClick={handleNavClick} />

                <div className="mt-4 border-t pt-4">
                    <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={true} onClick={handleNavClick} />
                </div>

                <div className="mt-4 border-t pt-4">
                    <NavItem to="/crm/sistema/site" icon={<Globe className="w-5 h-5" />} label="Site" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/sistema/usuarios" icon={<Shield className="w-5 h-5" />} label="Usuários e Permissões" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/sistema/geral" icon={<Settings className="w-5 h-5" />} label="Geral (Mock)" isSidebarOpen={true} onClick={handleNavClick} />
                </div>
            </div>
        </>
    );

    return (
        <>
            {DesktopAside}
            {MobilePanel}
        </>
    );
};

export default CRMSidebar;