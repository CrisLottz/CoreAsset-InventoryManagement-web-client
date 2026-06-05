import { useAuth } from '../../context/AuthContext';

export const UserMenu = () => {
    // Consumimos la memoria global estricta
    const { user, logout, isLoading } = useAuth();

    if (isLoading) {
        return <div className="text-sm text-gray-500 animate-pulse">Cargando credenciales...</div>;
    }

    if (!user) return null;

    return (
        <div className="flex flex-col space-y-4">
            {/* Información del Usuario */}
            <div className="flex items-center space-x-3">
                {/* Avatar generado dinámicamente con las variables White-Label */}
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                    {user.first_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate tracking-tight">
                        {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.role || 'Superusuario'}
                    </span>
                </div>
            </div>

            {/* CTA Destructivo (Cerrar Sesión) */}
            <button
                onClick={logout}
                // Padding X el doble de Y (px-4 py-2), semántica de error y focus ring estricto
                className="w-full px-4 py-2 text-sm font-bold text-semantic-error bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-semantic-error focus:ring-offset-2 dark:focus:ring-offset-surface-elevated flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar Sesión</span>
            </button>
        </div>
    );
};