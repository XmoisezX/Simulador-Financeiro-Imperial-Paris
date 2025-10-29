import React from 'react';
import CRMSidebar from './CRMSidebar';
import Header from './Header';
import Footer from './Footer';

interface CRMLayoutProps {
    children: React.ReactNode;
}

const CRMLayout: React.FC<CRMLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar do CRM */}
                <CRMSidebar />
                
                {/* Conteúdo Principal */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CRMLayout;