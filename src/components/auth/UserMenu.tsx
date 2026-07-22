import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const UserMenu = () => {
    const { user, logout, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return <div className="h-10 w-10 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full"></div>;
    }

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full transition-transform hover:scale-105"
            >
                {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                ) : (
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                        {user.first_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-elevated rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.role || (user.is_staff ? 'Superuser' : 'User')}
                        </p>
                    </div>
                    <a
                        href="/settings/general"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        My user settings
                    </a>
                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-semantic-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};