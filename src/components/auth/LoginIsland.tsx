import { AuthProvider } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';

// Esta es la Súper Isla. Todo lo que esté aquí adentro comparte el mismo árbol de React.
export const LoginIsland = () => {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
};