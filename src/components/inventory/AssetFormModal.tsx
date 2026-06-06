import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Location {
    id: string;
    name: string;
}

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssetFormModal = ({ isOpen, onClose, onSuccess }: AssetFormModalProps) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado controlado: El backend exige las llaves en MAYÚSCULAS
    const [formData, setFormData] = useState({
        internal_tag: '',
        location_id: '',
        status: 'ACTIVE', // <-- Llave real de la BD
        type: 'laptop', 
        model: '',
        serial_number: '',
        tenant: ''
    });

    useEffect(() => {
        if (isOpen) {
            apiClient.get('/assets/locations/')
                .then(res => setLocations(res.data.results || res.data))
                .catch(() => setError("Error al cargar sedes."));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const metadata_json: Record<string, string> = {
            type: formData.type,
        };

        if (formData.type === 'license') {
            metadata_json.tenant = formData.tenant;
        } else {
            metadata_json.model = formData.model;
            metadata_json.serial_number = formData.serial_number;
        }

        const payload = {
            internal_tag: formData.internal_tag,
            location: formData.location_id,
            status: formData.status,
            metadata_json: metadata_json
        };

        try {
            await apiClient.post('/assets/inventory/', payload);
            onSuccess(); 
            onClose();   
        } catch (err: any) {
            const backendError = err.response?.data;
            if (backendError && backendError.status) {
                setError(`Estado inválido: ${backendError.status[0]}`);
            } else if (backendError && backendError.schema_error) {
                setError(`Error de esquema JSON: ${backendError.schema_error}`);
            } else {
                setError("Error al registrar el activo. Verifica los datos.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                aria-hidden="true"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-2xl bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                
                <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-surface-base">
                    <h2 id="modal-title" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                        Registrar Nuevo Activo
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-semantic-error border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form id="asset-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            <div className="space-y-2">
                                <label htmlFor="internal_tag" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Tag Interno</label>
                                <input 
                                    type="text" 
                                    id="internal_tag" 
                                    required
                                    value={formData.internal_tag}
                                    onChange={e => setFormData({...formData, internal_tag: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="location_id" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Sede</label>
                                <select 
                                    id="location_id" 
                                    required
                                    value={formData.location_id}
                                    onChange={e => setFormData({...formData, location_id: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Seleccione una sede...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="status" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Estado Inicial</label>
                                <select 
                                    id="status" 
                                    required
                                    value={formData.status}
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {/* VALUE = BD KEY, TEXTO = UI LABEL */}
                                    <option value="ACTIVE">Operativo</option>
                                    <option value="MAINTENANCE">En Mantenimiento</option>
                                    <option value="RETIRED">De Baja / Descartado</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="type" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Tipo de Activo</label>
                                <select 
                                    id="type" 
                                    required
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="laptop">Laptop / Equipo</option>
                                    <option value="mobile">Dispositivo Móvil</option>
                                    <option value="license">Licencia de Software</option>
                                </select>
                            </div>

                            {formData.type === 'license' ? (
                                <div className="space-y-2 sm:col-span-2">
                                    <label htmlFor="tenant" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Tenant / Dominio de Licencia</label>
                                    <input 
                                        type="text" 
                                        id="tenant" 
                                        required
                                        value={formData.tenant}
                                        onChange={e => setFormData({...formData, tenant: e.target.value})}
                                        className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label htmlFor="model" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Modelo</label>
                                        <input 
                                            type="text" 
                                            id="model" 
                                            required
                                            value={formData.model}
                                            onChange={e => setFormData({...formData, model: e.target.value})}
                                            className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="serial_number" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Número de Serie</label>
                                        <input 
                                            type="text" 
                                            id="serial_number" 
                                            required
                                            value={formData.serial_number}
                                            onChange={e => setFormData({...formData, serial_number: e.target.value})}
                                            className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </form>
                </div>

                <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="asset-form"
                        disabled={isLoading}
                        className="px-6 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        {isLoading ? "Guardando..." : "Guardar Activo"}
                    </button>
                </footer>
            </div>
        </div>
    );
};