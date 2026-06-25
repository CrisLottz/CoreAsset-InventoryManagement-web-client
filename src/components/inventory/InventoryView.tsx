import { useState, useEffect } from 'react';
import { AssetTable } from './AssetTable';
import { AssetFormModal } from './AssetFormModal';
import { ViewEditorModal } from './ViewEditorModal'; 
import { apiClient } from '../../services/apiClient';

interface CategoryStructure {
    id: string;
    name: string;
    fields: {
        id: string;
        name: string;
        field_type: string;
        is_required: boolean;
        options_metadata?: { label: string; value: string; color?: string }[];
    }[];
}

interface InventoryViewProps {
    categoryId?: string;
}

export const InventoryView = ({ categoryId }: InventoryViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewEditorOpen, setIsViewEditorOpen] = useState(false); 
    const [assetToEdit, setAssetToEdit] = useState<any>(null);
    const [refreshCount, setRefreshCount] = useState(0);
    const [structure, setStructure] = useState<CategoryStructure | null>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('internal_tag');
    const [ordering, setOrdering] = useState('-created_at');
    const [columnsConfig, setColumnsConfig] = useState<{name: string, is_visible: boolean}[]>([]); 
    
    // NUEVO ESTADO: Controla la bandera para activos sin asignar
    const [showUnassigned, setShowUnassigned] = useState(false);

    useEffect(() => {
        if (!categoryId) return;
        
        setIsLoadingStructure(true);
        setSearchQuery('');
        setSearchField('internal_tag');
        setOrdering('-created_at');
        setColumnsConfig([]); 
        setShowUnassigned(false); // Reset al cambiar de módulo

        apiClient.get(`/assets/categories/${categoryId}/`)
            .then(async (response) => {
                const fetchedStructure = response.data;
                setStructure(fetchedStructure);

                try {
                    const prefRes = await apiClient.get('/assets/preferences/');
                    const userPref = prefRes.data.results?.find((p: any) => p.category === categoryId) 
                                     || prefRes.data?.find((p: any) => p.category === categoryId);
                    
                    if (userPref && userPref.columns_config && userPref.columns_config.length > 0) {
                        setColumnsConfig(userPref.columns_config);
                    } else {
                        setColumnsConfig(fetchedStructure.fields.map((f: any) => ({ name: f.name, is_visible: true })));
                    }
                } catch (e) {
                    console.error("Could not fetch user preferences, using defaults.", e);
                    setColumnsConfig(fetchedStructure.fields.map((f: any) => ({ name: f.name, is_visible: true })));
                }
            })
            .catch(error => console.error("Error loading category structure:", error))
            .finally(() => setIsLoadingStructure(false));
    }, [categoryId]);

    const handleSaveViewConfig = async (newConfig: {name: string, is_visible: boolean}[]) => {
        try {
            await apiClient.post('/assets/preferences/', {
                category: categoryId,
                columns_config: newConfig
            });
            setColumnsConfig(newConfig);
            setIsViewEditorOpen(false);
        } catch (error) {
            console.error("Error saving view preferences", error);
            alert("Failed to save view preferences.");
        }
    };

    const handleOpenCreateModal = () => {
        setAssetToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (asset: any) => {
        setAssetToEdit(asset);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAssetToEdit(null);
    };

    if (isLoadingStructure) return <div className="p-8 text-center animate-pulse dark:text-gray-400">Loading module structure...</div>;
    if (!structure) return <div className="p-8 text-center text-red-500">Error: Module structure not found.</div>;

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{structure.name}</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Dynamic asset management for the {structure.name} module.</p>
                </div>
                <button 
                    onClick={handleOpenCreateModal}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded focus:outline-none focus:ring-2 focus:ring-primary-600 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span>Register {structure.name}</span>
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-surface-elevated p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    <div className="flex">
                        <select 
                            value={searchField} 
                            onChange={(e) => {
                                setSearchField(e.target.value);
                                setSearchQuery('');
                                setShowUnassigned(false);
                            }}
                            className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded-l-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 border-r-0"
                        >
                            <option value="internal_tag">Internal Tag</option>
                            {structure.fields.map((f: any) => {
                                const backendKey = f.field_type === 'LOCATION' ? 'location' : f.field_type === 'EMPLOYEE' ? 'assigned_to' : f.name;
                                return <option key={f.id} value={backendKey}>{f.name}</option>;
                            })}
                        </select>
                        
                        {/* Renderizado condicional del input de texto basado en el toggle */}
                        {(!showUnassigned || searchField !== 'assigned_to') && (
                            <div className="relative w-full md:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md leading-5 bg-white dark:bg-surface-elevated text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* RENDERIZADO CONDICIONAL EXCLUSIVO PARA ASSIGNED TO */}
                    {searchField === 'assigned_to' && (
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300 select-none animate-fade-in">
                            <input 
                                type="checkbox" 
                                checked={showUnassigned} 
                                onChange={(e) => {
                                    setShowUnassigned(e.target.checked);
                                    if (e.target.checked) setSearchQuery(''); 
                                }}
                                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-4 h-4" 
                            />
                            <span className="font-medium">Show Unassigned Only</span>
                        </label>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort-order" className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Sort by:</label>
                        <select 
                            id="sort-order" value={ordering} onChange={(e) => setOrdering(e.target.value)}
                            className="py-2 pl-3 pr-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-surface-base text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            <option value="-created_at">Newest First</option>
                            <option value="created_at">Oldest First</option>
                            <option value="internal_tag">Internal Tag (A-Z)</option>
                            <option value="-internal_tag">Internal Tag (Z-A)</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                    <button 
                        onClick={() => setIsViewEditorOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-surface-elevated dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800 shadow-sm transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        Edit View
                    </button>
                </div>
            </div>

            <AssetTable 
                categoryId={categoryId!} structure={structure} refreshTrigger={refreshCount} onEditAsset={handleOpenEditModal} 
                searchQuery={searchQuery} searchField={searchField} ordering={ordering}
                columnsConfig={columnsConfig} 
                showUnassigned={showUnassigned} // <-- PASAMOS LA BANDERA
            />

            <AssetFormModal 
                isOpen={isModalOpen} onClose={handleCloseModal} categoryId={categoryId!} structure={structure} assetToEdit={assetToEdit} 
                onSuccess={() => { handleCloseModal(); setRefreshCount(prev => prev + 1); }}
            />

            {isViewEditorOpen && (
                <ViewEditorModal
                    isOpen={isViewEditorOpen}
                    onClose={() => setIsViewEditorOpen(false)}
                    onSave={handleSaveViewConfig}
                    defaultFields={structure.fields}
                    currentConfig={columnsConfig}
                />
            )}
        </div>
    );
};