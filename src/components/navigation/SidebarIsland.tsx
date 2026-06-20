import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Category {
    id: string;
    name: string;
    icon: string;
}

export const SidebarIsland = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/assets/categories/')
            .then(response => {
                setCategories(response.data);
            })
            .catch(error => console.error("Error loading category structure:", error))
            .finally(() => setIsLoading(false));
    }, []);

    // Icono genérico (Heroicons SVG) en caso de que el string del icono falle
    const renderIcon = (iconName: string) => (
        <svg className="w-5 h-5 flex-shrink-0 mr-3 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    );

    return (
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Sidebar">
            {/* 1. Panel Principal */}
            <a href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard Analytics
            </a>

            {/* 2. Inventario (Dropdown Dinámico) */}
            <div className="pt-2">
                <button 
                    onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors group"
                >
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Inventory Modules
                    </div>
                    {/* Flecha del Dropdown */}
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isInventoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Subcategorías Dinámicas */}
                {isInventoryOpen && (
                    <div className="mt-1 space-y-1 pl-10">
                        {isLoading ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading structure...</div>
                        ) : (
                            categories.map(category => (
                                <a 
                                    key={category.id} 
                                    href={`/inventory/${category.id}`} 
                                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 group"
                                >
                                    {/* Aquí podríamos mapear el iconName a un SVG real, por ahora usamos el genérico */}
                                    {renderIcon(category.icon)}
                                    {category.name}
                                </a>
                            ))
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};