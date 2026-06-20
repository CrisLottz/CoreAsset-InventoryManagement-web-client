import { useState, useEffect } from 'react';
import { AssetTable } from './AssetTable';
import { AssetFormModal } from './AssetFormModal';
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
    const [assetToEdit, setAssetToEdit] = useState<any>(null); // ESTADO PARA LA EDICIÓN
    const [refreshCount, setRefreshCount] = useState(0);
    const [structure, setStructure] = useState<CategoryStructure | null>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(true);

    useEffect(() => {
        if (!categoryId) return;
        
        setIsLoadingStructure(true);
        apiClient.get(`/assets/categories/${categoryId}/`)
            .then(response => {
                setStructure(response.data);
            })
            .catch(error => console.error("Error loading category structure:", error))
            .finally(() => setIsLoadingStructure(false));
    }, [categoryId]);

    const handleOpenCreateModal = () => {
        setAssetToEdit(null); // Asegura que esté vacío para Crear
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (asset: any) => {
        setAssetToEdit(asset); // Carga el activo para Editar
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAssetToEdit(null); // Limpia el estado al cerrar
    };

    if (isLoadingStructure) {
        return <div className="p-8 text-center animate-pulse dark:text-gray-400">Loading module structure...</div>;
    }

    if (!structure) {
        return <div className="p-8 text-center text-red-500">Error: Module structure not found.</div>;
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {structure.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Dynamic asset management for the {structure.name} module.
                    </p>
                </div>
                <button 
                    onClick={handleOpenCreateModal}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 dark:focus:ring-offset-surface-elevated self-start sm:self-auto flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span>Register {structure.name}</span>
                </button>
            </header>

            <AssetTable 
                categoryId={categoryId!} 
                structure={structure} 
                refreshTrigger={refreshCount} 
                onEditAsset={handleOpenEditModal} 
            />

            <AssetFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSuccess={() => {
                    handleCloseModal();
                    setRefreshCount(prev => prev + 1);
                }}
                categoryId={categoryId!}
                structure={structure}
                assetToEdit={assetToEdit} 
            />
        </div>
    );
};