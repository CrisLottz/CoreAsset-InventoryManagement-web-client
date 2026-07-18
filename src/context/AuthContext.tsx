import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../services/apiClient';

interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: string;
    is_staff: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mantenemos un caché a nivel de módulo para compartir entre las diferentes Islas de React
let cachedUser: User | null = null;
let fetchUserPromise: Promise<any> | null = null;
let isFetched = false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // IMPORTANTE: Inicializamos siempre en null/true para que coincida con el servidor (SSR)
    // y evitar errores de hidratación.
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        // Si ya lo trajimos exitosamente, usamos el caché
        if (isFetched) {
            setUser(cachedUser);
            setIsLoading(false);
            return;
        }

        try {
            // Si no hay una petición en curso, la iniciamos
            if (!fetchUserPromise) {
                fetchUserPromise = apiClient.get('/users/me/');
            }
            // Esperamos la petición
            const response = await fetchUserPromise;
            
            cachedUser = response.data;
            isFetched = true;
            setUser(cachedUser);
        } catch (error) {
            cachedUser = null;
            isFetched = true;
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Esto solo se ejecuta en el cliente (Browser), manteniendo los
        // datos a nivel de módulo seguros y aislados por pestaña.
        checkAuth();
    }, []);

    const logout = async () => {
        try {
            await apiClient.post('/users/logout/');
        } catch (error) {
            console.error(error);
        } finally {
            // Limpiamos el caché global
            cachedUser = null;
            fetchUserPromise = null;
            isFetched = false;
            setUser(null);
            window.location.href = '/login';
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, checkAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};