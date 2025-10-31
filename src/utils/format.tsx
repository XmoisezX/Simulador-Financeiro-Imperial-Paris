import React from 'react';

export const formatCurrency = (value: number | string | null | undefined, prefix: string = 'R$'): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : Number(value);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    
    const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix} ${formatted}`;
};

export const formatCurrencyHalfTone = (value: number | string | null | undefined): React.ReactNode => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : Number(value);
    if (isNaN(num) || !isFinite(num)) return <span className="text-gray-400">N/A</span>;
    
    const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Separa a parte inteira e decimal para aplicar estilos diferentes
    const parts = formatted.split(',');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : '00';
    
    return (
        <span className="whitespace-nowrap">
            <span className="text-gray-400 text-xs">R$</span>
            <span className="font-medium text-dark-text">{integerPart}</span>
            <span className="text-gray-400 text-xs">,{decimalPart}</span>
        </span>
    );
};

export const parseCurrencyToNumber = (value: string | null): number | null => {
    if (!value) return null;
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
};