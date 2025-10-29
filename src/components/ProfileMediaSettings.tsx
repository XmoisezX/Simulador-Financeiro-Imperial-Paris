import React from 'react';
import { Image, Plus, RefreshCw, List, Map } from 'lucide-react';
import { Button } from './ui/Button';

const ProfileMediaSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-sm text-yellow-800 rounded-md">
                Esta seção é um placeholder para a funcionalidade de gerenciamento de fotos de imóveis.
            </div>
            
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-dark-text flex items-center">
                    <Image className="w-5 h-5 mr-2" /> Gerenciamento de Mídias (Mock)
                </h3>
                <Button 
                    variant="outline" 
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => alert('Abrir seletor de arquivos (Mock)')}
                >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Imagem
                </Button>
            </div>
            
            <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg bg-white">
                <p className="text-light-text">Nenhuma foto de imóvel encontrada para este usuário. (Mock)</p>
                <p className="text-xs text-gray-500 mt-2">Esta funcionalidade deve ser integrada com a página de cadastro de imóveis.</p>
            </div>
            
            <div className="flex justify-end space-x-2">
                <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100">
                    <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                </Button>
            </div>
        </div>
    );
};

export default ProfileMediaSettings;