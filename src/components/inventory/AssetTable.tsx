import { useState, useEffect, useCallback } from 'react';
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

interface ColumnConfig {
    name: string;
    is_visible: boolean;
}

interface AssetTableProps {
    categoryId: string;
    structure: any; 
    refreshTrigger?: number;
    onEditAsset: (asset: Asset) => void;
    searchQuery: string;
    searchField: string;
    ordering: string;
    columnsConfig: ColumnConfig[]; 
    showUnassigned: boolean;
}

export const AssetTable = ({ categoryId, structure, refreshTrigger = 0, onEditAsset, searchQuery, searchField, ordering, columnsConfig, showUnassigned }: AssetTableProps) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [expandedText, setExpandedText] = useState<{title: string, content: string} | null>(null);

    // ESTADOS PARA BULK ACTIONS
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Resetear selecciones cuando se cambia de página o filtros
    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
    }, [searchQuery, searchField, ordering, categoryId, showUnassigned]);

    const fetchInventory = useCallback(async () => {
        setIsLoading(true);
        setBulkError(null);
        try {
            const response = await apiClient.get('/assets/inventory/', {
                params: { 
                    page: page, 
                    category: categoryId,
                    search: searchQuery || undefined, 
                    search_field: searchField, 
                    ordering: ordering,
                    assigned_to_null: showUnassigned ? 'true' : undefined
                }
            });
            setAssets(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching assets", error);
            setAssets([]);
        } finally {
            setIsLoading(false);
        }
    }, [categoryId, page, searchQuery, searchField, ordering, showUnassigned]);

    useEffect(() => {
        const timeoutId = setTimeout(() => fetchInventory(), 300);
        return () => clearTimeout(timeoutId);
    }, [fetchInventory, refreshTrigger]);

    // --- LÓGICA DE SELECCIÓN MÚLTIPLE ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(assets.map(a => a.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const executeBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} assets? This action is irreversible.`)) return;
        
        setIsBulkDeleting(true);
        setBulkError(null);
        try {
            // Paralelización de peticiones DELETE hacia Django
            await Promise.all(Array.from(selectedIds).map(id => apiClient.delete(`/assets/inventory/${id}/`)));
            setSelectedIds(new Set());
            fetchInventory(); // Refrescar la tabla tras el borrado
        } catch (err: any) {
            if (err.response?.status === 403) {
                setBulkError("Access Denied: Your assigned role lacks permission to delete assets.");
            } else {
                setBulkError("An error occurred while deleting one or more assets. Partial deletion may have occurred.");
            }
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const renderCellContent = (asset: Asset, fieldName: string) => {
        const fieldMeta = structure.fields.find((f: any) => f.name === fieldName);
        if (!fieldMeta) return <span className="text-gray-400 italic text-sm">-</span>;

        if (fieldMeta.field_type === 'EMPLOYEE') return asset.assigned_employee_name || <span className="text-gray-400 italic">Unassigned</span>;
        if (fieldMeta.field_type === 'LOCATION') return asset.location_name || <span className="text-gray-400 italic">Unknown</span>;

        const rawValue = asset.dynamic_data?.[fieldName];
        if (!rawValue) return <span className="text-gray-400 italic text-sm">-</span>;

        if (fieldMeta.field_type === 'COLOR_STATUS') {
            const optionMeta = fieldMeta.options_metadata?.find((opt: any) => opt.value === rawValue);
            const label = optionMeta?.label || rawValue;
            const colorName = optionMeta?.color?.toLowerCase() || 'gray'; 
            
            const themeMap: Record<string, { bg: string, text: string, border: string, dot: string }> = {
                green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-900/50', dot: 'bg-green-500' },
                yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/50', dot: 'bg-yellow-500' },
                red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-900/50', dot: 'bg-red-500' },
                purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/50', dot: 'bg-purple-500' },
                gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700/50', dot: 'bg-gray-500' }
            };
            const theme = themeMap[colorName] || themeMap.gray;

            return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${theme.bg} ${theme.text} ${theme.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} aria-hidden="true"></span>
                    {label.toUpperCase()}
                </span>
            );
        }

        if (fieldMeta.field_type === 'DROPDOWN') {
            const optionMeta = fieldMeta.options_metadata?.find((opt: any) => opt.value === rawValue);
            return optionMeta?.label || rawValue;
        }

        const textStr = String(rawValue);
        const MAX_LENGTH = 35;

        if (textStr.length > MAX_LENGTH || fieldMeta.field_type === 'LONG_TEXT') {
            return (
                <div className="flex items-center gap-1">
                    <span 
                        className="truncate max-w-[150px] xl:max-w-[250px] inline-block cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => setExpandedText({ title: fieldMeta.name, content: textStr })}
                    >
                        {textStr}
                    </span>
                    <button 
                        onClick={() => setExpandedText({ title: fieldMeta.name, content: textStr })}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-bold px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                    >
                        ...
                    </button>
                </div>
            );
        }

        return textStr;
    };

    const pkField = structure.fields.find((f: any) => f.is_locked && (f.name.toLowerCase() === 'internal tag' || f.id.includes('tag')));
    const pkLabel = pkField ? pkField.name : 'INTERNAL TAG';

    const orderedVisibleFields = columnsConfig
        .filter(c => c.is_visible)
        .map(c => c.name)
        .filter(name => name !== pkLabel && name.toLowerCase() !== 'internal tag');

    return (
        <div className="space-y-4 relative">
            
            {/* ALERTAS DE ERROR DE RED/PERMISOS */}
            {bulkError && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 rounded-lg flex items-start gap-3 animate-fade-in" aria-live="assertive">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm font-medium">{bulkError}</span>
                </div>
            )}

            {/* BARRA BULK ACTIONS FLOTANTE */}
            {selectedIds.size > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex justify-between items-center animate-fade-in">
                    <span className="text-sm font-bold text-primary-800 dark:text-primary-400">
                        {selectedIds.size} asset(s) selected
                    </span>
                    <button
                        onClick={executeBulkDelete}
                        disabled={isBulkDeleting}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded shadow-sm transition-colors focus:outline-none disabled:opacity-50 flex items-center gap-2"
                    >
                        {isBulkDeleting ? (
                            <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                {/* CHECKBOX SELECT ALL */}
                                <th scope="col" className="px-4 py-4 w-12 text-center bg-gray-100 dark:bg-gray-700/50">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        checked={assets.length > 0 && selectedIds.size === assets.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-4 bg-gray-100 dark:bg-gray-700/50">{pkLabel}</th>
                                <th scope="col" className="px-6 py-4 text-left w-24 bg-gray-100 dark:bg-gray-700/50 border-r-2 border-gray-200 dark:border-gray-700">Actions</th>
                                {orderedVisibleFields.map((fieldName) => (
                                    <th key={fieldName} scope="col" className="px-6 py-4">{fieldName}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={orderedVisibleFields.length + 3} className="px-6 py-12 text-center">
                                        <svg className="inline w-8 h-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    </td>
                                </tr>
                            ) : assets.length === 0 ? (
                                <tr>
                                    <td colSpan={orderedVisibleFields.length + 3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {searchQuery || showUnassigned ? "No assets match your search." : "No assets found in this module."}
                                    </td>
                                </tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                        {/* CHECKBOX INDIVIDUAL */}
                                        <td className="px-4 py-4 w-12 text-center bg-gray-100/50 dark:bg-gray-700/30">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                checked={selectedIds.has(asset.id)}
                                                onChange={() => toggleSelection(asset.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap bg-gray-100/50 dark:bg-gray-700/30">
                                            {asset.internal_tag}
                                        </td>
                                        <td className="px-6 py-4 text-left bg-gray-100/50 dark:bg-gray-700/30 border-r-2 border-gray-200 dark:border-gray-700">
                                            <button 
                                                onClick={() => onEditAsset(asset)}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm focus:outline-none focus:underline"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                        
                                        {orderedVisibleFields.map((fieldName) => (
                                            <td key={fieldName} className="px-6 py-4 whitespace-nowrap">
                                                {renderCellContent(asset, fieldName)}
                                            </td>
                                        ))}
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
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors">
                        Previous
                    </button>
                    <button onClick={() => setPage(p => p + 1)} disabled={isLoading || assets.length < 10} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors">
                        Next
                    </button>
                </div>
            </div>

            {expandedText && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setExpandedText(null)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl flex flex-col">
                        <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-surface-base">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{expandedText.title}</h3>
                            <button onClick={() => setExpandedText(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </header>
                        <div className="p-5 overflow-y-auto max-h-[60vh]">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all text-sm leading-relaxed">
                                {expandedText.content}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};