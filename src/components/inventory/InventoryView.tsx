import { useState } from 'react';
import { AssetTable } from './AssetTable';
import { AssetFormModal } from './AssetFormModal';

export const InventoryView = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Inventario Activo
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Gestión y asignación de hardware de la sede.
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 dark:focus:ring-offset-surface-elevated self-start sm:self-auto flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span>Registrar Activo</span>
                </button>
            </header>

            {/* Le pasamos el contador a la tabla para que sepa cuándo recargar */}
            <AssetTable refreshTrigger={refreshCount} />

            {/* Modal controlado por el estado */}
            <AssetFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => setRefreshCount(prev => prev + 1)} 
            />
        </div>
    );
};