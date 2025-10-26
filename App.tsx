import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import HomePage from './pages/HomePage';

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