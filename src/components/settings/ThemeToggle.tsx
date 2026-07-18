import { useState, useEffect } from 'react';

export const ThemeToggle = () => {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    
    useEffect(() => {
        const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (stored) {
            setTheme(stored);
        } else {
            setTheme('system');
        }
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        const root = document.documentElement;
        
        if (newTheme === 'system') {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else {
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    return (
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => applyTheme('light')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors focus:outline-none ${theme === 'light' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Light
            </button>
            <button 
                onClick={() => applyTheme('dark')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                Dark
            </button>
            <button 
                onClick={() => applyTheme('system')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-colors focus:outline-none ${theme === 'system' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                System
            </button>
        </div>
    );
};
