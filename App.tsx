import React, { useState, useEffect, useCallback } from 'react';
import { SimulationInput, SimulationResult } from './types';
import { useFinancialSimulator } from './hooks/useFinancialSimulator';
import { initialSimulationInputs } from './constants';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [inputs, setInputs] = useState<SimulationInput>(initialSimulationInputs);
    const [results, setResults] = useState<SimulationResult | null>(null);
    const calculateSimulation = useFinancialSimulator();

    // Run simulation whenever inputs change
    useEffect(() => {
        const simulationData = calculateSimulation(inputs);
        setResults(simulationData);
    }, [inputs, calculateSimulation]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setInputs(prevInputs => ({
            ...prevInputs,
            [id]: value === '' ? 0 : parseFloat(value)
        }));
    }, []);
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <div className="flex flex-1 flex-col lg:flex-row">
                <Sidebar inputs={inputs} onInputChange={handleInputChange} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {results ? (
                        <Dashboard results={results} inputs={inputs} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xl text-gray-500">Gerando simulação...</p>
                        </div>
                    )}
                </main>
            </div>
            {/* Footer is removed from the flex layout to stick to the bottom */}
            <Footer />
        </div>
    );
};

export default App;