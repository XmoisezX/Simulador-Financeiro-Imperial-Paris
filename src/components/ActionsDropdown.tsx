import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ActionsDropdownProps {
    onAction: (action: string) => void;
    disabled: boolean;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onAction, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { label: 'Excluir', value: 'delete', className: 'text-red-600 hover:bg-red-50' },
        { label: 'Mostrar no site', value: 'show' },
        { label: 'Ocultar no site', value: 'hide' },
        { label: 'Girar 90°', value: 'rotate90' },
        { label: 'Girar 180°', value: 'rotate180' },
    ];

    const handleActionClick = (value: string) => {
        if (!disabled) { // Só permite a ação se não estiver desabilitado
            onAction(value);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Ações
                {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {actions.map(action => (
                            <button
                                key={action.value}
                                onClick={() => handleActionClick(action.value)}
                                className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${action.className || ''}`}
                                role="menuitem"
                                disabled={disabled} // Desabilita os itens do menu
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;