import { useState, useEffect } from 'react';

interface Asset {
    id: string;
    serial_number: string;
    model: string;
    status: 'active' | 'maintenance' | 'retired';
    assigned_to: string | null;
}

export const AssetTable = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchMockData = () => {
            setIsLoading(true);
            setTimeout(() => {
                setAssets([
                    { id: '1', serial_number: 'LP-2026-001', model: 'Dell Latitude 7420', status: 'active', assigned_to: 'Marvin' },
                    { id: '2', serial_number: 'MN-2026-045', model: 'Dell UltraSharp 27', status: 'maintenance', assigned_to: null },
                    { id: '3', serial_number: 'LP-2026-012', model: 'ThinkPad T14', status: 'retired', assigned_to: null },
                ]);
                setIsLoading(false);
            }, 800);
        };
        fetchMockData();
    }, [page]);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-4">Serial</th>
                                <th scope="col" className="px-6 py-4">Modelo</th>
                                <th scope="col" className="px-6 py-4">Estado</th>
                                <th scope="col" className="px-6 py-4">Asignado a</th>
                                <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center" aria-live="polite" aria-busy="true">
                                        <svg className="inline w-6 h-6 animate-spin text-primary-600 motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {asset.serial_number}
                                        </td>
                                        <td className="px-6 py-4">{asset.model}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                                asset.status === 'active' ? 'bg-green-50 text-semantic-success border-green-200 dark:bg-green-900/20 dark:border-green-900/50' :
                                                asset.status === 'maintenance' ? 'bg-yellow-50 text-semantic-warning border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50' :
                                                'bg-red-50 text-semantic-error border-red-200 dark:bg-red-900/20 dark:border-red-900/50'
                                            }`}>
                                                {asset.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" aria-hidden="true"></span>}
                                                {asset.status === 'maintenance' && <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" aria-hidden="true"></span>}
                                                {asset.status === 'retired' && <span className="w-1.5 h-1.5 rounded-full bg-semantic-error" aria-hidden="true"></span>}
                                                {asset.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{asset.assigned_to || <span className="text-gray-400 italic">No asignado</span>}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm focus:outline-none focus:underline">
                                                Gestionar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex items-center justify-between px-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {page}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                        Anterior
                    </button>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};