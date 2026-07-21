import { useState, useEffect } from 'react';

export type DateFormat = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

export const useDateFormat = () => {
    const [format, setFormat] = useState<DateFormat>('dd/MM/yyyy');

    useEffect(() => {
        const updateFormat = () => {
            const saved = localStorage.getItem('date_format') as DateFormat | null;
            if (saved) setFormat(saved);
        };

        updateFormat();
        window.addEventListener('preferences-changed', updateFormat);
        return () => window.removeEventListener('preferences-changed', updateFormat);
    }, []);

    const saveFormat = (newFormat: DateFormat) => {
        localStorage.setItem('date_format', newFormat);
        setFormat(newFormat);
        window.dispatchEvent(new Event('preferences-changed'));
    };

    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';

        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        // Return only the date part according to format
        if (format === 'MM/dd/yyyy') return `${month}/${day}/${year}`;
        if (format === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateString: string | Date | null) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';

        const datePart = formatDate(dateString);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        
        return `${datePart} ${hours}:${minutes}`;
    };

    return { format, saveFormat, formatDate, formatDateTime };
};
