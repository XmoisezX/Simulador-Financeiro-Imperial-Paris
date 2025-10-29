import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, User, Menu, X } from 'lucide-react';
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
        <header className="bg-white shadow-md sticky top-0 z-20">
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
                <nav className="hidden lg:flex space-x-6 text-dark-text font-medium">
                    <Link to="/" className="hover:text-primary-orange transition-colors">Início</Link>
                    <Link to="/imoveis" className="hover:text-primary-orange transition-colors">Imóveis</Link>
                    <Link to="/sobre" className="hover:text-primary-orange transition-colors">Sobre Nós</Link>
                    <Link to="/contato" className="hover:text-primary-orange transition-colors">Contato</Link>
                </nav>

                {/* Módulo de Login/Acesso ao CRM e Menu Mobile */}
                <div className="flex items-center space-x-4">
                    {session ? (
                        <Link to="/crm/dashboard">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <User className="w-4 h-4 mr-2" /> Acessar CRM
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button variant="outline" className="text-primary-orange border-primary-orange hover:bg-orange-50">
                                <LogIn className="w-4 h-4 mr-2" /> Login / CRM
                            </Button>
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
                        <Link to="/" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>Início</Link>
                        <Link to="/imoveis" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>Imóveis</Link>
                        <Link to="/sobre" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>Sobre Nós</Link>
                        <Link to="/contato" className="block p-2 text-dark-text hover:bg-gray-100 rounded" onClick={() => setIsMenuOpen(false)}>Contato</Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PublicHeader;