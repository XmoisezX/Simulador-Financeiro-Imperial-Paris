import React from 'react';
import { Zap, Users, TrendingUp, Mail, Phone, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const LeadsPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-primary-orange" /> Gestão de Leads
                </h1>
                <Link to="/crm/oportunidades">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Criar Oportunidade
                    </Button>
                </Link>
            </div>

            <div className="max-w-4xl space-y-8">
                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-dark-text mb-3 border-b pb-2 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" /> Visão Geral
                    </h2>
                    <p className="text-light-text mb-4">
                        O módulo de Leads é o ponto de entrada para novos contatos. Aqui, você gerencia a importação de contatos de portais e campanhas de marketing, qualifica-os e os converte em Oportunidades.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-800">1,540</p><p className="text-sm text-light-text">Leads Totais</p></div>
                        <div className="p-4 bg-yellow-50 rounded-lg"><p className="text-2xl font-bold text-yellow-800">25</p><p className="text-sm text-light-text">Novos (Hoje)</p></div>
                        <div className="p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-800">12%</p><p className="text-sm text-light-text">Taxa de Conversão</p></div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-dark-text mb-3 border-b pb-2 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-orange" /> Próximos Passos
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-light-text">
                        <li><strong>Importação:</strong> Utilize a ferramenta de importação para trazer novos leads de planilhas.</li>
                        <li><strong>Qualificação:</strong> Classifique os leads como "Quente", "Morno" ou "Frio".</li>
                        <li><strong>Conversão:</strong> Converta leads qualificados em <Link to="/crm/oportunidades" className="text-blue-600 hover:underline">Oportunidades</Link> para iniciar o funil de vendas.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LeadsPage;