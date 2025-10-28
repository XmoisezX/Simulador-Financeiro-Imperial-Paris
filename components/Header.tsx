import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../src/contexts/AuthContext';

const Header: React.FC = () => {
    const { session, supabase } = useAuth();
    const location = useLocation();

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error("Erro ao carregar logo. Verifique se o arquivo 'LOGO LARANJA.png' está na pasta public.");
    };

    const navLinkClasses = (path: string) => 
        `py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            location.pathname === path 
            ? 'bg-orange-100 text-primary-orange' 
            : 'text-light-text hover:bg-gray-100'
        }`;

    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="container mx-auto p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <img
                        src="/LOGO LARANJA.png"
                        alt="Imperial Paris Imóveis Logo"
                        className="h-16 header-logo"
                        onError={handleImageError}
                    />
                    <div className="ml-4 text-left">
                         <h1 className="text-xl md:text-2xl font-bold text-dark-text">
                            Simulador de Cenário Financeiro
                        </h1>
                        <p className="text-sm text-light-text hidden sm:block">
                            Projeção e Análise de Mercado - Imperial Paris Imóveis
                        </p>
                    </div>
                </div>
                
                {session && (
                    <div className="flex items-center space-x-4">
                        <nav className="hidden md:flex items-center space-x-2 bg-white p-1 rounded-lg">
                            <Link to="/" className={navLinkClasses('/')}>
                                Simulador
                            </Link>
                            <Link to="/analise-de-mercado" className={navLinkClasses('/analise-de-mercado')}>
                                Análise de Mercado
                            </Link>
                            <Link to="/metas-agenciamento" className={navLinkClasses('/metas-agenciamento')}>
                                Metas Agenciamento
                            </Link>
                        </nav>
                        <span className="text-sm text-light-text hidden lg:block">{session.user.email}</span>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-orange rounded-md hover:bg-secondary-orange transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;