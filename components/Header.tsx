import React from 'react';
import { useAuth } from '../src/contexts/AuthContext';

const Header: React.FC = () => {
    const { session, supabase } = useAuth();

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error("Erro ao carregar logo. Verifique se o arquivo 'LOGO LARANJA.png' está na pasta public.");
    };

    return (
        <header className="bg-white shadow-md">
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
                            Projeção para 12 Meses - Imperial Paris Imóveis
                        </p>
                    </div>
                </div>
                {session && (
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-light-text hidden md:block">{session.user.email}</span>
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