import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown'; // Importando o novo componente

const Header: React.FC = () => {
    const { session } = useAuth();
    const location = useLocation();

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error("Erro ao carregar logo. Verifique se o arquivo 'LOGO LARANJA.png' está na pasta public.");
    };

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
                        {/* Ícone de Notificações (Mock) */}
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                            <Bell className="w-6 h-6" />
                        </button>
                        
                        {/* Dropdown de Perfil */}
                        <UserProfileDropdown />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;