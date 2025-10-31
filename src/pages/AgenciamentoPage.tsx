import React from 'react';
import { Briefcase } from 'lucide-react';
import SpreadsheetEditor from '../components/SpreadsheetEditor';

const defaultHeaders = ['ID', 'Endereço', 'Bairro', 'Tipo', 'Valor Venda', 'Valor Locação', 'Status', 'Proprietário'];
const initialData: string[][] = [
    // Initial data based on the empty CSV attachment. Adding one empty row for visibility.
    Array(defaultHeaders.length).fill(''),
];

const AgenciamentoPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Agenciamento
            </h1>
            <p className="text-lg text-light-text mb-8">
                Edite e gerencie a lista de imóveis extraídos ou captados.
            </p>
            
            <SpreadsheetEditor 
                title="Planilha de Imóveis Extraídos"
                headers={defaultHeaders}
                initialData={initialData}
            />
            
            <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                    Atenção: O arquivo CSV fornecido estava vazio. A planilha foi inicializada com colunas padrão para imóveis.
                </p>
            </div>
        </div>
    );
};

export default AgenciamentoPage;