import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Key, FileText, Users, Briefcase, CalendarCheck, Zap, DollarSign, Target, Map, Menu, X, Settings, Globe, Building2, TrendingUp, Shield, FileText as DocumentsIcon } from 'lucide-react';

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
    const expandedClasses = isActive 
        ? 'bg-blue-100 text-blue-800 font-semibold' 
        : 'text-slate-600 hover:bg-gray-100';
    const collapsedClasses = isActive 
        ? 'bg-blue-100 text-blue-800 font-semibold' 
        : 'text-slate-600 hover:bg-gray-100';

    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${
                isSidebarOpen ? expandedClasses : collapsedClasses
            } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
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

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
                    onClick={toggleSidebar}
                ></div>
            )}

            <aside className={`
                ${isOpen ? 'w-64' : 'w-20'} 
                bg-white border-r border-gray-200 
                flex-shrink-0 overflow-y-auto h-full 
                transition-all duration-300 
                hidden lg:block sticky top-[88px] 
            `}>
                <div className="space-y-1 px-4 pb-4"> 
                    <button 
                        onClick={toggleSidebar}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full ${isOpen ? 'justify-end text-slate-600 hover:bg-gray-100' : 'justify-center text-slate-600 hover:bg-gray-100'}`}
                        title={isOpen ? 'Recolher Menu' : 'Expandir Menu'}
                    >
                        <Menu className={`w-5 h-5 text-slate-600`} />
                    </button>

                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Navegação</h3>}
                    
                    <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Imóveis & Vendas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/crm/sales-dashboard" icon={<DollarSign className="w-5 h-5" />} label="Painel de Vendas" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/condominios" icon={<Building2 className="w-5 h-5" />} label="Condomínios" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/agenciamento" icon={<Briefcase className="w-5 h-5" />} label="Agenciamento" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/oportunidades" icon={<TrendingUp className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Pessoas & Rotinas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Ferramentas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={isOpen} onClick={handleNavClick} />

                    <div className="pt-3">
                        <NavItem to="/crm/documentos" icon={<DocumentsIcon className="w-5 h-5" />} label="Documentos" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    </div>
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Administração</h3>}
                    
                    <div className="relative">
                        <button
                            onClick={handleSystemClick}
                            className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full ${
                                isSystemOpen 
                                ? 'bg-blue-100 text-blue-800 font-semibold' 
                                : (isOpen ? 'text-slate-600 hover:bg-gray-100' : 'text-slate-600 hover:bg-gray-100')
                            } ${isOpen ? 'justify-start' : 'justify-center'}`}
                            title="Sistema"
                        >
                            <Settings className="w-5 h-5" />
                            {isOpen && <span className="ml-3 text-sm whitespace-nowrap">Sistema</span>}
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
        </>
    );
};

export default CRMSidebar;