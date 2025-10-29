import React from 'react';
import { useParams } from 'react-router-dom';
import { Home, MapPin, DollarSign, Loader2 } from 'lucide-react';

const PublicImovelDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Mock de carregamento de dados
    const [isLoading, setIsLoading] = React.useState(true);
    
    React.useEffect(() => {
        // Simula o carregamento de dados
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [id]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 min-h-[500px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
                <p className="ml-3 text-gray-600">Carregando detalhes do imóvel...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-white min-h-[80vh]">
            <h1 className="text-3xl font-bold text-dark-text mb-4">Detalhes do Imóvel (Cód: {id})</h1>
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner space-y-4">
                <p className="text-lg text-light-text">Esta é a página de visualização pública do imóvel com ID: <span className="font-mono text-dark-text">{id}</span>.</p>
                <p className="text-sm text-blue-600 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Aqui seria exibido o mapa e as informações de contato.</p>
                <p className="text-sm text-primary-orange">Lembre-se: Apenas imóveis com status 'Aprovado' e disponíveis são visíveis publicamente.</p>
            </div>
        </div>
    );
};

export default PublicImovelDetailsPage;