import React from 'react';

interface KpiCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon }) => {
    return (
        <div class="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-colors">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-sm font-semibold tracking-tight text-gray-500 dark:text-gray-400 uppercase">
                    {title}
                </h3>
                {icon && <div class="text-primary-500">{icon}</div>}
            </div>
            <div>
                {/* Tabular nums to prevent width jumping */}
                <span class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-mono tabular-nums">
                    {value}
                </span>
            </div>
            {description && (
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {description}
                </p>
            )}
        </div>
    );
};
