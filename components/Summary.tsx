import React from 'react';
import { SimulationSummary } from '../types';

interface SummaryProps {
    summary: SimulationSummary;
}

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Summary: React.FC<SummaryProps> = ({ summary }) => {
    const { finalCash, isViable, bufferMet, bufferTarget } = summary;

    const finalCashClass = isViable ? 'text-green-700' : 'text-red-600';

    return (
        <div className="mt-6 text-center text-lg p-4 bg-gray-100 rounded-md border border-gray-200">
            <p className="font-semibold">
                <strong>Resultado da Simulação:</strong> Caixa Acumulado Final: 
                <span className={`ml-2 font-bold ${finalCashClass}`}>
                    {formatCurrency(finalCash)}
                </span>.
            </p>
            {!isViable ? (
                <p className="mt-2 text-red-600 font-bold">
                    <span role="img" aria-label="cross mark">❌</span> Cenário INVIÁVEL sem aporte adicional ou renegociação de pagamentos.
                </p>
            ) : bufferMet ? (
                <p className="mt-2 text-green-700 font-bold">
                    <span role="img" aria-label="check mark">✅</span> Meta de buffer ({formatCurrency(bufferTarget)}) ATINGIDA.
                </p>
            ) : (
                <p className="mt-2 text-orange-600 font-bold">
                    <span role="img" aria-label="warning">⚠️</span> Pagamentos cobertos, mas meta de buffer ({formatCurrency(bufferTarget)}) NÃO ATINGIDA.
                </p>
            )}
        </div>
    );
};

export default Summary;