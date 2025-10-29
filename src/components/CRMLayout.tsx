import React, { useState } from 'react';
import CRMSidebar from './CRMSidebar';
import Header from './Header';
import Footer from './Footer';
import { Menu } from 'lucide-react';

interface CRMLayoutProps {
    children: React.ReactNode;
}

const CRMLayout: React.FC<CRMLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar do CRM */}
                <CRMSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                
                {/* Conteúdo Principal */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
                    {/* Botão de Toggle no topo do conteúdo principal para telas pequenas */}
                    <div className="lg:hidden p-4 border-b border-gray-200 bg-white">
                        <button onClick={toggleSidebar} className="text-gray-600 hover:text-blue-600">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CRMLayout;