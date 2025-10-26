import React, { useState, useEffect, useCallback } from 'react';
import { SimulationInput, SimulationResult } from '../../types';
import { useFinancialSimulator } from '../../hooks/useFinancialSimulator';
import { initialSimulationInputs } from '../../constants';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Sidebar from '../../components/Sidebar';
import Dashboard from '../../components/Dashboard';

const HomePage: React.FC = () => {
    const [inputs, setInputs] = useState<SimulationInput>(initialSimulationInputs);
    const [results, setResults] = useState<SimulationResult | null>(null);
    const [duration, setDuration] = useState(12);
    const calculateSimulation = useFinancialSimulator();

    useEffect(() => {
        const simulationData = calculateSimulation(inputs, duration);
        setResults(simulationData);
    }, [inputs, calculateSimulation, duration]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setInputs(prevInputs => ({
            ...prevInputs,
            [id]: value === '' ? 0 : parseFloat(value)
        }));
    }, []);

    const handleLoadSimulation = useCallback((loadedInputs: SimulationInput) => {
        setInputs(loadedInputs);
        setDuration(12); // Reset duration when loading a simulation
    }, []);

    const handleExtendSimulation = useCallback(() => {
        setDuration(prevDuration => prevDuration + 12);
    }, []);
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <div className="flex flex-1 flex-col lg:flex-row">
                <Sidebar inputs={inputs} onInputChange={handleInputChange} onLoadSimulation={handleLoadSimulation} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {results ? (
                        <Dashboard results={results} inputs={inputs} onExtend={handleExtendSimulation} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-xl text-gray-500">Gerando simulação...</p>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default HomePage;