import { useState, useEffect } from 'react';

export const useReadingPaneMode = () => {
    const [mode, setMode] = useState<'auto' | 'light' | 'dark'>('auto');

    useEffect(() => {
        const updateMode = () => {
            const saved = localStorage.getItem('reading_pane_mode') as 'auto' | 'light' | 'dark' | null;
            if (saved) setMode(saved);
        };

        updateMode();
        window.addEventListener('preferences-changed', updateMode);
        return () => window.removeEventListener('preferences-changed', updateMode);
    }, []);

    const getThemedClass = (baseClass: string, lightModifiers: string, darkModifiersWithPrefix: string) => {
        if (mode === 'light') return `${baseClass} ${lightModifiers}`;
        
        // auto
        return `${baseClass} ${lightModifiers} ${darkModifiersWithPrefix}`;
    };

    return { mode, getThemedClass };
};
