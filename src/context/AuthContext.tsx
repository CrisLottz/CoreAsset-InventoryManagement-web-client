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
    permissions?: string[];
    avatar?: string | null;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maintain module-level cache to share between React Islands
let cachedUser: User | null = null;
let fetchUserPromise: Promise<any> | null = null;
let isFetched = false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // IMPORTANT: Always initialize to null/true to match server (SSR)
    // and avoid hydration errors.
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async (force = false) => {
        // If already fetched successfully and not forcing, use cache
        if (isFetched && !force) {
            setUser(cachedUser);
            setIsLoading(false);
            return;
        }

        try {
            // If there's no ongoing request or we're forcing it, initiate one
            if (!fetchUserPromise || force) {
                fetchUserPromise = apiClient.get('/users/me/');
            }
            // Await the request
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
        // This only executes in the client (Browser), keeping the
        // module-level data secure and isolated per tab.
        checkAuth();
        
        const handleUserUpdated = () => checkAuth(true);
        window.addEventListener('user-updated', handleUserUpdated);
        return () => window.removeEventListener('user-updated', handleUserUpdated);
    }, []);

    const logout = async () => {
        try {
            await apiClient.post('/users/logout/');
        } catch (error) {
            console.error(error);
        } finally {
            // Clear global cache
            cachedUser = null;
            fetchUserPromise = null;
            isFetched = false;
            setUser(null);
            window.location.href = '/login';
        }
    };



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