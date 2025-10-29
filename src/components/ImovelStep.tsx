import React from 'react';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImovelStepProps {
    title: React.ReactNode;
    children: React.ReactNode;
    step: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    onSave: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isStepValid: boolean;
    isSaving: boolean;
    disabled?: boolean; // Nova prop
}

const ImovelStep: React.FC<ImovelStepProps> = ({
    title,
    children,
    step,
    totalSteps,
    onNext,
    onBack,
    onSave,
    isLastStep,
    isFirstStep,
    isStepValid,
    isSaving,
    disabled = false, // Valor padrão
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
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
                
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                    <Button 
                        onClick={onBack} 
                        variant="outline" 
                        disabled={isFirstStep || disabled} // Desabilita se for o primeiro passo ou se o componente estiver desabilitado
                        className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    
                    {isLastStep ? (
                        <Button 
                            onClick={onSave} 
                            disabled={!isStepValid || isSaving || disabled} // Desabilita se o passo não for válido, estiver salvando ou o componente estiver desabilitado
                            className="bg-primary-orange hover:bg-secondary-orange"
                        >
                            {isSaving ? 'Salvando...' : 'Finalizar Cadastro'}
                        </Button>
                    ) : (
                        <Button 
                            onClick={onNext} 
                            disabled={!isStepValid || disabled} // Desabilita se o passo não for válido ou o componente estiver desabilitado
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Próximo <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImovelStep;