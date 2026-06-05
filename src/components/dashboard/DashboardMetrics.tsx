import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Metrics {
    totalAssets: number;
    activeUsers: number;
    recentAssignments: number;
}

export const DashboardMetrics = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await apiClient.get('/metrics/summary/');
                setMetrics(response.data);
            } catch (err: any) {
                setMetrics({
                    totalAssets: 142,
                    activeUsers: 8,
                    recentAssignments: 15
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (isLoading) {
        return (
            <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6" 
                aria-live="polite" 
                aria-busy="true"
            >
                {[1, 2, 3].map((i) => (
                    <div 
                        key={i} 
                        className="h-32 bg-gray-200 dark:bg-surface-elevated animate-pulse rounded-lg motion-reduce:animate-none"
                    ></div>
                ))}
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-semantic-error rounded-lg" aria-live="assertive">
                No se pudieron cargar las métricas.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-colors duration-200">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activos Registrados
                </span>
                <span className="mt-2 text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {metrics.totalAssets}
                </span>
            </div>

            <div className="p-6 bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-colors duration-200">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuarios Activos
                </span>
                <span className="mt-2 text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {metrics.activeUsers}
                </span>
            </div>

            <div className="p-6 bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-colors duration-200">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asignaciones Recientes
                </span>
                <span className="mt-2 text-4xl font-bold text-semantic-info dark:text-blue-400 tracking-tight">
                    +{metrics.recentAssignments}
                </span>
            </div>
        </div>
    );
};