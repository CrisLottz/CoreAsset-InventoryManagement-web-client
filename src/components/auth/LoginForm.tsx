import { useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

export const LoginForm = () => {
    // 1. Cambiamos el estado de 'email' a 'username'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { checkAuth } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 2. Enviamos el payload con la llave 'username' exacta que espera Django
            await apiClient.post('/users/login/', { username, password });
            
            await checkAuth();
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Credenciales inválidas o sin acceso a la sede.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="w-full max-w-md space-y-6 p-8 bg-white shadow-lg dark:bg-surface-elevated dark:shadow-none rounded-lg"
        >
            <div aria-live="assertive" className="min-h-[24px]">
                {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                        <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-tight">
                    Usuario Institucional
                </label>
                {/* 3. Cambiamos type="email" a type="text" para evitar el bloqueo del navegador */}
                <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded text-gray-900 bg-gray-50 border transition-all duration-200 
                        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}
                        focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-tight">
                    Contraseña Segura
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 rounded text-gray-900 bg-gray-50 border transition-all duration-200 
                        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white'}
                        focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 motion-reduce:transition-none"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white motion-reduce:animate-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Validando Identidad...</span>
                    </>
                ) : (
                    <span>Acceder al Panel de Gestión</span>
                )}
            </button>
        </form>
    );
};