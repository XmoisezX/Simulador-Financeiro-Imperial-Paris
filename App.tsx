import React from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/Login';
import HomePage from './src/pages/HomePage';

const AppContent: React.FC = () => {
    const { session } = useAuth();

    if (!session) {
        return <LoginPage />;
    }

    return <HomePage />;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;