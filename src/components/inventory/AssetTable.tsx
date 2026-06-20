import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Asset {
    id: string;
    internal_tag: string;
    assigned_to?: string | null;
    assigned_employee_name?: string | null; 
    location?: string | null;
    location_name?: string | null;
    dynamic_data: Record<string, any>; 
}

interface AssetTableProps {
    categoryId: string;
    structure: any; 
    refreshTrigger?: number;
    onEditAsset: (asset: Asset) => void;
}

export const AssetTable = ({ categoryId, structure, refreshTrigger = 0, onEditAsset }: AssetTableProps) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchInventory = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get('/assets/inventory/', {
                    params: { page: page, category: categoryId }
                });
                
                const data = response.data.results || response.data;
                setAssets(data);
            } catch (error) {
                console.error("Error fetching assets", error);
                setAssets([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInventory();
    }, [categoryId, page, refreshTrigger]);

    const renderCellContent = (asset: Asset, field: any) => {
        if (field.field_type === 'EMPLOYEE') return asset.assigned_employee_name || <span className="text-gray-400 italic">Unassigned</span>;
        if (field.field_type === 'LOCATION') return asset.location_name || <span className="text-gray-400 italic">Unknown</span>;

        const rawValue = asset.dynamic_data?.[field.name];
        
        if (!rawValue) return <span className="text-gray-400 italic text-sm">-</span>;

        if (field.field_type === 'COLOR_STATUS') {
            const optionMeta = field.options_metadata?.find((opt: any) => opt.value === rawValue);
            const label = optionMeta?.label || rawValue;
            const colorName = optionMeta?.color?.toLowerCase() || 'gray'; 
            
            // Diccionario anti-purge para que Tailwind respete las clases construidas
            const themeMap: Record<string, { bg: string, text: string, border: string, dot: string }> = {
                green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50', dot: 'bg-green-500' },
                yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50', dot: 'bg-yellow-500' },
                red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50', dot: 'bg-red-500' },
                purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50', dot: 'bg-purple-500' },
                gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-900/50', dot: 'bg-gray-500' }
            };

            const theme = themeMap[colorName] || themeMap.gray;

            return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${theme.bg} ${theme.text} ${theme.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} aria-hidden="true"></span>
                    {label.toUpperCase()}
                </span>
            );
        }

        if (field.field_type === 'DROPDOWN') {
            const optionMeta = field.options_metadata?.find((opt: any) => opt.value === rawValue);
            return optionMeta?.label || rawValue;
        }

        return String(rawValue);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-4">Internal Tag</th>
                                {structure.fields.map((field: any) => (
                                    <th key={field.id} scope="col" className="px-6 py-4">{field.name}</th>
                                ))}
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={structure.fields.length + 2} className="px-6 py-8 text-center" aria-live="polite" aria-busy="true">
                                        <svg className="inline w-6 h-6 animate-spin text-primary-600 motion-reduce:animate-none" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={structure.fields.length + 2} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No assets found in this module.
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                            {asset.internal_tag}
                                        </td>
                                        
                                        {structure.fields.map((field: any) => (
                                            <td key={field.id} className="px-6 py-4 whitespace-nowrap">
                                                {renderCellContent(asset, field)}
                                            </td>
                                        ))}
                                        
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => onEditAsset(asset)}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm focus:outline-none focus:underline"
                                            >
                                                Manage
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
                        Previous
                    </button>
                    <button onClick={() => setPage(p => p + 1)} disabled={isLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};