import React from 'react';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImovelStepProps {
    title: React.ReactNode;
    children: React.ReactNode;
    step: number;
    totalSteps: number;
    onNext: () => void; // Mantido para compatibilidade, mas não usado
    onBack: () => void; // Mantido para compatibilidade, mas não usado
    onSave: () => void; // Mantido para compatibilidade, mas não usado
    isLastStep: boolean; // Mantido para compatibilidade, mas não usado
    isFirstStep: boolean; // Mantido para compatibilidade, mas não usado
    isStepValid: boolean; // Mantido para compatibilidade, mas não usado
    isSaving: boolean; // Mantido para compatibilidade, mas não usado
    disabled?: boolean;
}

const ImovelStep: React.FC<ImovelStepProps> = ({
    title,
    children,
    step,
    totalSteps,
    disabled = false,
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 ${disabled ? 'opacity-70' : ''}`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        {title}
                    </h2>
                    <span className="text-sm text-light-text font-medium">
                        Passo {step} de {totalSteps}
                    </span>
                </div>
                
                <div className="space-y-6">
                    {children}
                </div>
                
                {/* Removemos o footer de navegação por passo */}
            </div>
        </div>
    );
};

export default ImovelStep;