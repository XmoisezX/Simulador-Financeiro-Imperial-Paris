import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Key, FileText, Users, Briefcase, CalendarCheck, Zap, DollarSign, Target, Map } from 'lucide-react';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link 
            to={to} 
            className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${
                isActive 
                ? 'bg-blue-100 text-blue-800 font-semibold' 
                : 'text-slate-600 hover:bg-gray-100'
            }`}
        >
            {icon}
            <span className="ml-3 text-sm">{label}</span>
        </Link>
    );
};

const CRMSidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto h-full">
            <div className="p-4 space-y-1">
                <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Imóveis & Vendas</h3>
                <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" />
                <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" />
                <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" />
                <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" />
                <NavItem to="/crm/oportunidades" icon={<Briefcase className="w-5 h-5" />} label="Oportunidades" />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Pessoas & Rotinas</h3>
                <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" />
                <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" />
                
                <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Ferramentas</h3>
                <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" />
                <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" />
                <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" />
                <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" />
            </div>
        </aside>
    );
};

export default CRMSidebar;