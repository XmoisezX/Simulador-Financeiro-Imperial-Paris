import React from 'react';
import { Search, Home, DollarSign, MapPin, CheckCircle, ArrowRight, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import TextInput from '../components/TextInput';
import { Link } from 'react-router-dom';

// Mock Data
const stats = [
    { value: '100+', label: 'Imóveis Exclusivos' },
    { value: '15', label: 'Anos de Experiência' },
    { value: '98%', label: 'Satisfação do Cliente' },
    { value: 'Pelotas', label: 'Foco Regional' },
];

const featuredProperties = [
    { id: 1, title: 'Apartamento de Luxo no Laranjal', price: 850000, location: 'Laranjal, Pelotas', beds: 3, baths: 2, area: 120, imageUrl: 'https://via.placeholder.com/400x300/ff6600/ffffff?text=Imovel+1' },
    { id: 2, title: 'Casa em Condomínio Fechado', price: 420000, location: 'Areal, Pelotas', beds: 4, baths: 3, area: 180, imageUrl: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=Imovel+2' },
    { id: 3, title: 'Terreno Comercial no Centro', price: 250000, location: 'Centro, Pelotas', beds: 0, baths: 0, area: 300, imageUrl: 'https://via.placeholder.com/400x300/10b981/ffffff?text=Imovel+3' },
];

const PublicHomePage: React.FC = () => {
    return (
        <div className="bg-white">
            {/* 1. Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('https://via.placeholder.com/1920x800/ff6600/ffffff?text=Imperial+Paris+Imoveis')" }}>
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                        Somos a tua imobiliária em <span className="text-primary-orange">Pelotas-RS</span>.
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-200 mb-8">
                        Encontre o imóvel perfeito para morar ou investir.
                    </p>
                    
                    {/* Search Bar Mock */}
                    <div className="bg-white p-4 rounded-lg shadow-xl flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                        <div className="flex-1">
                            <TextInput 
                                label="" 
                                id="search_term" 
                                placeholder="Busque por código, bairro ou tipo de imóvel..."
                                className="w-full"
                            />
                        </div>
                        <div className="w-full md:w-auto">
                            <Button className="w-full bg-primary-orange hover:bg-secondary-orange text-white h-full py-3">
                                <Search className="w-5 h-5 mr-2" /> Buscar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stats/KPIs Section */}
            <div className="container mx-auto p-8 -mt-16 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-orange">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center p-3 border-r last:border-r-0 lg:border-r border-gray-200">
                            <p className="text-3xl font-bold text-primary-orange">{stat.value}</p>
                            <p className="text-sm text-light-text mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Featured Properties */}
            <div className="container mx-auto p-8 mt-8">
                <h2 className="text-3xl font-bold text-dark-text mb-8 border-b pb-2">Imóveis em Destaque</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredProperties.map(prop => (
                        <div key={prop.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div className="h-48 bg-gray-200 relative">
                                <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-primary-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                                    Venda
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="text-lg font-semibold text-dark-text truncate">{prop.title}</h3>
                                <p className="text-2xl font-bold text-primary-orange">{prop.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <div className="flex items-center text-sm text-light-text space-x-4">
                                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {prop.location}</span>
                                </div>
                                <div className="flex items-center text-sm text-dark-text space-x-4 border-t pt-2">
                                    <span className="flex items-center"><Home className="w-4 h-4 mr-1" /> {prop.area} m²</span>
                                    <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Financiável</span>
                                </div>
                                <Button variant="outline" className="w-full mt-3 text-blue-600 border-blue-600 hover:bg-blue-50">
                                    Ver Detalhes <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3">
                        Ver Todos os Imóveis
                    </Button>
                </div>
            </div>

            {/* 4. Why Choose Us Section */}
            <div className="bg-light-orange-bg p-12 mt-12">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-bold text-dark-text text-center mb-10">Por que escolher a Imperial Paris Imóveis?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-blue-500">
                            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Segurança Jurídica</h3>
                            <p className="text-light-text text-sm">Garantimos que toda a documentação do seu imóvel esteja impecável, do início ao fim do processo.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-primary-orange">
                            <DollarSign className="w-8 h-8 text-primary-orange mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Melhor Negociação</h3>
                            <p className="text-light-text text-sm">Nossa expertise em Pelotas garante que você obtenha o melhor valor, seja na compra, venda ou locação.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-green-500">
                            <User className="w-8 h-8 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Atendimento Personalizado</h3>
                            <p className="text-light-text text-sm">Você não é apenas um número. Oferecemos consultoria dedicada para atender suas necessidades específicas.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 5. Testimonials (Mock) */}
            <div className="container mx-auto p-8 mt-8">
                <h2 className="text-3xl font-bold text-dark-text text-center mb-8">O que dizem nossos clientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-gray-50 rounded-lg shadow-inner border-l-4 border-primary-orange">
                        <p className="italic text-dark-text mb-4">"A equipe da Imperial Paris foi fundamental na compra do nosso primeiro apartamento. Profissionais, transparentes e muito atenciosos. Recomendo!"</p>
                        <p className="font-semibold text-sm text-dark-text">- João Silva, Comprador</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg shadow-inner border-l-4 border-blue-500">
                        <p className="italic text-dark-text mb-4">"Consegui alugar meu imóvel em tempo recorde e com toda a segurança. O serviço de administração é excelente."</p>
                        <p className="font-semibold text-sm text-dark-text">- Maria Torres, Proprietária</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicHomePage;