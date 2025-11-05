import React from 'react';
import BannerUploader from '../components/BannerUploader';
import WatermarkManager from '../components/WatermarkManager';

const SystemSettingsPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6">Configurações do Sistema</h1>
            <p className="text-lg text-light-text mb-8">Gerencie as configurações globais da plataforma e do site.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <BannerUploader />
                </div>

                <div className="space-y-6">
                    <WatermarkManager />
                </div>
            </div>

            <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-semibold text-dark-text mb-3">Administração Geral (Mock)</h3>
                <p className="text-light-text text-sm">Opções de sistema estão centralizadas aqui.</p>
            </div>
        </div>
    );
};

export default SystemSettingsPage;