import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Key, FileText, Users, Briefcase, CalendarCheck, Zap, DollarSign, Target, Map, Menu } from 'lucide-react';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isSidebarOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isSidebarOpen }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link 
            to={to} 
            className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${
                isActive 
                ? 'bg-blue-100 text-blue-800 font-semibold' 
                : 'text-slate-600 hover:bg-gray-100'
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
    const sidebarWidth = isOpen ? 'w-64' : 'w-20'; // 64 (256px) vs 20 (80px)

    return (
        <aside className={`${sidebarWidth} bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto h-full transition-all duration-300 hidden lg:block sticky top-[88px]`}>
            <div className="p-4 space-y-1">
                {/* Botão de Toggle */}
                <button 
                    onClick={toggleSidebar}
                    className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full text-slate-600 hover:bg-gray-100 ${isOpen ? 'justify-end' : 'justify-center'}`}
                    title={isOpen ? 'Recolher Menu' : 'Expandir Menu'}
                >
                    <Menu className="w-5 h-5" />
                </button>

                {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Navegação</h3>}
                
                <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={isOpen} />
                
                {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Imóveis & Vendas</h3>}
                {!isOpen && <div className="h-4"></div>}
                <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={isOpen} />
                <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={isOpen} />
                <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={isOpen} />
                <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={isOpen} />
                <NavItem to="/crm/oportunidades" icon={<Briefcase className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={isOpen} />
                
                {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Pessoas & Rotinas</h3>}
                {!isOpen && <div className="h-4"></div>}
                <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={isOpen} />
                <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={isOpen} />
                
                {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Ferramentas</h3>}
                {!isOpen && <div className="h-4"></div>}
                <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={isOpen} />
                <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={isOpen} />
                <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={isOpen} />
                <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={isOpen} />
            </div>
        </aside>
    );
};

export default CRMSidebar;