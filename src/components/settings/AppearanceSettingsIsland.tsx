import React, { useState, useEffect } from 'react';

const THEMES = [
    {
        id: 'ocean',
        name: 'Ocean Blue',
        colors: {
            '--color-primary-50': '#eff6ff',
            '--color-primary-100': '#dbeafe',
            '--color-primary-500': '#3b82f6',
            '--color-primary-600': '#2563eb',
            '--color-primary-700': '#1d4ed8',
            '--color-primary-800': '#1e40af',
        }
    },
    {
        id: 'plum',
        name: 'Aubergine / Plum',
        colors: {
            '--color-primary-50': '#f3e8ff',
            '--color-primary-100': '#e9d5ff',
            '--color-primary-500': '#a855f7',
            '--color-primary-600': '#9333ea',
            '--color-primary-700': '#7e22ce',
            '--color-primary-800': '#6b21a8',
        }
    },
    {
        id: 'emerald',
        name: 'Emerald',
        colors: {
            '--color-primary-50': '#ecfdf5',
            '--color-primary-100': '#d1fae5',
            '--color-primary-500': '#10b981',
            '--color-primary-600': '#059669',
            '--color-primary-700': '#047857',
            '--color-primary-800': '#065f46',
        }
    },
    {
        id: 'sunset',
        name: 'Sunset Amber',
        colors: {
            '--color-primary-50': '#fffbeb',
            '--color-primary-100': '#fef3c7',
            '--color-primary-500': '#f59e0b',
            '--color-primary-600': '#d97706',
            '--color-primary-700': '#b45309',
            '--color-primary-800': '#92400e',
        }
    },
    {
        id: 'slate',
        name: 'Slate',
        colors: {
            '--color-primary-50': '#f8fafc',
            '--color-primary-100': '#f1f5f9',
            '--color-primary-500': '#64748b',
            '--color-primary-600': '#475569',
            '--color-primary-700': '#334155',
            '--color-primary-800': '#1e293b',
        }
    },
    {
        id: 'crimson',
        name: 'Crimson',
        colors: {
            '--color-primary-50': '#fef2f2',
            '--color-primary-100': '#fee2e2',
            '--color-primary-500': '#ef4444',
            '--color-primary-600': '#dc2626',
            '--color-primary-700': '#b91c1c',
            '--color-primary-800': '#991b1b',
        }
    }
];

const TooltipInfo = ({ text }: { text: string }) => (
    <div className="relative inline-flex items-center group ml-2 align-middle">
        <svg className="w-4 h-4 text-gray-400 hover:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

export const AppearanceSettingsIsland = () => {
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
    const [activeThemeId, setActiveThemeId] = useState<string>('ocean');
    const [readingPane, setReadingPane] = useState<'auto' | 'light' | 'dark'>('auto');

    useEffect(() => {
        // Initialize state from local storage on client side
        const savedMode = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedMode) setThemeMode(savedMode);

        const savedColors = localStorage.getItem('theme_colors');
        if (savedColors) {
            try {
                const parsed = JSON.parse(savedColors);
                const matchingTheme = THEMES.find(t => t.colors['--color-primary-600'] === parsed['--color-primary-600']);
                if (matchingTheme) setActiveThemeId(matchingTheme.id);
            } catch (e) {}
        }

        const savedReadingPane = localStorage.getItem('reading_pane_mode') as 'auto' | 'light' | 'dark' | null;
        if (savedReadingPane) setReadingPane(savedReadingPane);
    }, []);

    const applyThemeMode = (mode: 'light' | 'dark' | 'system') => {
        setThemeMode(mode);
        if (mode === 'system') {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            localStorage.setItem('theme', mode);
            if (mode === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    const applyColorTheme = (themeId: string) => {
        setActiveThemeId(themeId);
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) {
            localStorage.setItem('theme_colors', JSON.stringify(theme.colors));
            for (const [key, value] of Object.entries(theme.colors)) {
                document.documentElement.style.setProperty(key, value);
            }
        }
    };

    const applyReadingPane = (mode: 'auto' | 'light' | 'dark') => {
        setReadingPane(mode);
        localStorage.setItem('reading_pane_mode', mode);
        // Dispatch custom event so data tables can listen and update instantly
        window.dispatchEvent(new Event('preferences-changed'));
    };

    return (
        <section className="bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Appearance & Theming
            </h2>

            {/* Global Theme Mode */}
            <div className="mb-8">
                <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Global Interface Mode
                    </label>
                    <TooltipInfo text="Changes the primary color scheme of the entire application between Light, Dark, or syncs with your OS." />
                </div>
                <div className="flex flex-wrap gap-3">
                    {['light', 'dark', 'system'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => applyThemeMode(mode as any)}
                            aria-pressed={themeMode === mode}
                            className={`px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                                themeMode === mode 
                                ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400' 
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-surface-base dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className="capitalize">{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Palette Selector */}
            <div className="mb-8">
                <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Brand Color Theme
                    </label>
                    <TooltipInfo text="Selects the primary accent color used for buttons, active links, and highlights." />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => applyColorTheme(theme.id)}
                            aria-pressed={activeThemeId === theme.id}
                            className={`flex items-center p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                                activeThemeId === theme.id
                                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-500'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            <div 
                                className="w-6 h-6 rounded-full flex-shrink-0 shadow-sm border border-black/10 dark:border-white/10"
                                style={{ backgroundColor: theme.colors['--color-primary-500'] }}
                            />
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {theme.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reading Pane Setting */}
            <div>
                <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Light/Dark Reading Pane
                    </label>
                    <TooltipInfo text="Overrides the global theme for data tables only. E.g., Use Dark Mode globally, but keep tables Light for reading." />
                </div>
                <div className="flex flex-wrap gap-3">
                    {['auto', 'light', 'dark'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => applyReadingPane(mode as any)}
                            aria-pressed={readingPane === mode}
                            className={`px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                                readingPane === mode 
                                ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-400' 
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-surface-base dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                        >
                            <span className="capitalize">{mode === 'auto' ? 'Match Global Theme' : `Force ${mode}`}</span>
                        </button>
                    ))}
                </div>
            </div>

        </section>
    );
};
