import React from 'react';

const Header: React.FC = () => {
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error("Erro ao carregar logo. Verifique se o arquivo 'LOGO LARANJA.png' está na mesma pasta do HTML.");
    };

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto p-4 flex items-center justify-center">
                {/* Certifique-se de que o arquivo 'LOGO LARANJA.png' esteja na mesma pasta que este arquivo HTML para que o logo apareça corretamente. */}
                <img
                    src="LOGO LARANJA.png"
                    alt="Imperial Paris Imóveis Logo"
                    className="h-16 header-logo"
                    onError={handleImageError}
                />
                <div className="ml-4 text-center sm:text-left">
                     <h1 className="text-xl md:text-2xl font-bold text-dark-text">
                        Simulador de Cenário Financeiro
                    </h1>
                    <p className="text-sm text-light-text hidden sm:block">
                        Projeção para 12 Meses - Imperial Paris Imóveis
                    </p>
                </div>
            </div>
        </header>
    );
};

export default Header;