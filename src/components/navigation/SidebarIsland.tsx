import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Category {
    id: string;
    name: string;
    icon: string;
}

// Mapeo seguro de SVGs desde la base de datos para los módulos dinámicos
const SYSTEM_ICONS: Record<string, string> = {
    'desktop-pc': 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    'device-laptop': 'M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm1.2-4.2V14H15V7h4.2l2 4.2z',
    'monitor': 'M3 5h18v10H3V5zm7 15h4m-2-5v5',
    'server': 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
    'hard-drive': 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-18v8h8',
    'cpu': 'M4 4h16v16H4V4zm5 0V2m6 2V2m-6 18v2m6-2v2M4 9H2m2 6H2m18-6h2m-2 6h2',
    'router': 'M12 3v6m0 0a3 3 0 100 6m0-6a3 3 0 110 6m0 4v3M4 12h3m10 0h3',
    'wifi': 'M12 20h.01M8.5 16.5a5 5 0 017 0M5.5 13.5a9 9 0 0113 0M2.5 10.5a14 14 0 0119 0',
    'switch': 'M4 6h16v4H4V6zm0 8h16v4H4v-4zm4-5h.01M16 9h.01M8 17h.01M16 17h.01',
    'cloud': 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.99A7.5 7.5 0 103 15z',
    'device-phone-mobile': 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    'tablet': 'M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm6 15h.01',
    'headset': 'M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9M3 14v3a2 2 0 002 2h1m15-5v3a2 2 0 01-2 2h-1M3 14h3m15 0h-3',
    'printer': 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
    'keyboard': 'M3 7h18v10H3V7zm4 4h.01M12 11h.01M17 11h.01M6 14h12',
    'tv': 'M2 5h20v12H2V5zm5 15h10M12 17v3',
    'code': 'M10 20l-4-4m0 0l4-4m-4 4h12m-2-4l4 4m0 0l-4 4',
    'shield': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    'video-camera': 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    'truck': 'M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm1.2-4.2V14H15V7h4.2l2 4.2zM1 10h14v4H1v-4z',
    'home': 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v11a1 1 0 01-1 1h-3m-6 0V14a2 2 0 012-2h2a2 2 0 012 2v7',
    'archive': 'M3 3h18v4H3V3zm1 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm6 4h4',
    'chair': 'M7 4h10v8H7V4zm0 8h10v4H7v-4zm2 4v4m6-4v4',
    'briefcase': 'M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm5 0V5a2 2 0 012-2h4a2 2 0 012 2v2',
    'gift': 'M20 12v8H4v-8M2 7h20v5H2V7zm10-5v5m-4-3a2 2 0 100 4h4M12 7h4a2 2 0 100-4h-4',
    'key': 'M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743-5.743L11 5H9v2H7v2H4a1 1 0 00-1 1v3a1 1 0 001 1h6.757A6 6 0 0121 9z'
};

export const SidebarIsland = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(true);
    const [isPeopleOpen, setIsPeopleOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    const renderIcon = (iconName: string) => {
        const path = SYSTEM_ICONS[iconName] || SYSTEM_ICONS['desktop-pc'];
        return (
            <svg className="w-5 h-5 flex-shrink-0 mr-3 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
            </svg>
        );
    };

    return (
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1" aria-label="Sidebar">
            {/* 1. Dashboard Analytics */}
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
                                    {renderIcon(category.icon)}
                                    {category.name}
                                </a>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 3. People (Dropdown: Employees, Users, Roles) */}
            <div className="pt-2">
                <button 
                    onClick={() => setIsPeopleOpen(!isPeopleOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors group"
                >
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        People
                    </div>
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isPeopleOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isPeopleOpen && (
                    <div className="mt-1 space-y-1 pl-10">
                        <a href="#" className="block px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Company Employees</a>
                        <a href="#" className="block px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Platform Users</a>
                        <a href="#" className="block px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Roles & Permissions</a>
                    </div>
                )}
            </div>

            {/* 4. Locations/Offices */}
            <div className="pt-2">
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Locations & Offices
                </a>
            </div>

            {/* 5. Audit Logs */}
            <div className="pt-2">
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Audit Logs
                </a>
            </div>

            {/* 6. Settings (Dropdown: Category Designer, General Settings) */}
            <div className="pt-2">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors group"
                >
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </div>
                    <svg className={`w-4 h-4 transform transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isSettingsOpen && (
                    <div className="mt-1 space-y-1 pl-10">
                        <a href="/settings/categories" className="block px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Category Designer</a>
                        <a href="/settings/general" className="block px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">General Configuration</a>
                    </div>
                )}
            </div>
        </nav>
    );
};