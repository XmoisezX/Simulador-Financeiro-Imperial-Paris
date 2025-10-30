import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, User, Menu, X, Search, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

const PublicHeader: React.FC = () => {
    const { session } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-20 backdrop-blur-sm">
            {/* Barra Principal (Logo e Navegação) */}
            <div className="container mx-auto p-4 flex items-center justify-between">
                <Link to="/" className="flex items-center">
                    <img
                        src="/LOGO LARANJA.png"
                        alt="Imperial Paris Imóveis Logo"
                        className="h-16"
                        onError={handleImageError}
                    />
                </Link>

                {/* Navegação Desktop */}
                <nav className="hidden lg:flex space-x-8 text-dark-text font-medium">
                    <Link to="/imoveis" className="hover:text-primary-orange transition-colors">ALUGAR</Link>
                    <Link to="/imoveis" className="hover:text-primary-orange transition-colors">COMPRAR</Link>
                    <Link to="/condominios" className="hover:text-primary-orange transition-colors">CONDOMÍNIOS</Link>
                    <Link to="/manutencao" className="hover:text-primary-orange transition-colors">MANUTENÇÃO</Link>
                    <Link to="/sobre" className="hover:text-primary-orange transition-colors">IMPERIAL</Link>
                </nav>

                {/* Botões de Ação (Movidos para a direita) */}
                <div className="flex items-center space-x-4">
                    {/* Módulo de Login/CRM */}
                    {session ? (
                        <Link to="/crm/dashboard" className="text-gray-600 hover:text-primary-orange transition-colors p-2 rounded-full hover:bg-gray-100 hidden sm:block" title="Acessar CRM">
                            <User className="w-6 h-6" />
                        </Link>
                    ) : (
                        <Link to="/login" className="text-gray-600 hover:text-primary-orange transition-colors p-2 rounded-full hover:bg-gray-100 hidden sm:block" title="Login">
                            <LogIn className="w-6 h-6" />
                        </Link>
                    )}
                    
                    {/* Botão de Menu Mobile */}
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 lg:hidden"
                        title="Abrir Menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            {/* Menu Mobile Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
                    <div className="absolute right-0 top-0 w-64 h-full bg-white shadow-lg p-6 space-y-4">
                        <div className="flex justify-end">
                            <button onClick={() => setIsMenuOpen(false)} className="text-gray-600 hover:text-red-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <Link to="/imoveis" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>ALUGAR</Link>
                        <Link to="/imoveis" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>COMPRAR</Link>
                        <Link to="/condominios" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>CONDOMÍNIOS</Link>
                        <Link to="/manutencao" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>MANUTENÇÃO</Link>
                        <Link to="/sobre" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>IMPERIAL</Link>
                        <Link to={session ? "/crm/dashboard" : "/login"} className="block p-2 text-blue-600 hover:bg-blue-50 rounded" onClick={() => setIsMenuOpen(false)}>
                            {session ? 'Acessar CRM' : 'Login / CRM'}
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PublicHeader;