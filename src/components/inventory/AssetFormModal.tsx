import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryId: string;
    structure: any;
    assetToEdit?: any; 
}

export const AssetFormModal = ({ isOpen, onClose, onSuccess, categoryId, structure, assetToEdit }: AssetFormModalProps) => {
    const [internalTag, setInternalTag] = useState('');
    const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
    
    const [locations, setLocations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]); 

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Identificamos el nombre personalizado de la llave primaria si existe, o caemos al valor por defecto
    const pkField = structure?.fields?.find((f: any) => f.is_locked && (f.name.toLowerCase() === 'internal tag' || f.id.includes('tag')));
    const pkLabel = pkField ? pkField.name : 'Internal Tag / Unique Identifier';

    useEffect(() => {
        if (isOpen && structure) {
            
            Promise.all([
                apiClient.get('/assets/locations/').catch(() => ({ data: [] })),
                apiClient.get('/employees/').catch(() => ({ data: [] })) 
            ]).then(([locRes, empRes]) => {
                setLocations(locRes.data.results || locRes.data || []);
                setEmployees(empRes.data.results || empRes.data || []);
            });

            const initialValues: Record<string, string> = {};
            
            structure.fields.forEach((field: any) => {
                // Prevenimos mapear la PK como un campo dinámico visual
                if (field.name === pkLabel || field.name.toLowerCase() === 'internal tag') return;

                if (assetToEdit) {
                    if (field.field_type === 'LOCATION') {
                        initialValues[field.name] = assetToEdit.location || '';
                    } else if (field.field_type === 'EMPLOYEE') {
                        initialValues[field.name] = assetToEdit.assigned_to || 'unassigned';
                    } else {
                        initialValues[field.name] = assetToEdit.dynamic_data?.[field.name] || '';
                    }
                } else {
                    if (field.field_type === 'DROPDOWN' || field.field_type === 'COLOR_STATUS') {
                        initialValues[field.name] = field.options_metadata?.[0]?.value || '';
                    } else if (field.field_type === 'EMPLOYEE') {
                        initialValues[field.name] = 'unassigned';
                    } else {
                        initialValues[field.name] = '';
                    }
                }
            });
            
            setDynamicValues(initialValues);
            setInternalTag(assetToEdit ? assetToEdit.internal_tag : '');
            setError(null);
        }
    }, [isOpen, structure, assetToEdit, pkLabel]);

    if (!isOpen || !structure) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const payload: any = {
            internal_tag: internalTag,
            category: categoryId,
            dynamic_data: {}
        };

        structure.fields.forEach((field: any) => {
            // INYECCIÓN VITAL: Pasamos la PK al dynamic_data de forma invisible para satisfacer la validación estricta de Django
            if (field.name === pkLabel || field.name.toLowerCase() === 'internal tag') {
                payload.dynamic_data[field.name] = internalTag;
                return;
            }

            const val = dynamicValues[field.name];
            
            if (field.field_type === 'LOCATION') {
                payload.location = val;
            } else if (field.field_type === 'EMPLOYEE') {
                payload.assigned_to = (val === 'unassigned' || !val) ? null : val;
            } else {
                payload.dynamic_data[field.name] = val;
            }
        });

        try {
            if (assetToEdit) {
                await apiClient.patch(`/assets/inventory/${assetToEdit.id}/`, payload);
            } else {
                await apiClient.post('/assets/inventory/', payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            const backendError = err.response?.data;
            if (backendError) {
                if (backendError.dynamic_data) {
                    const errorKey = Object.keys(backendError.dynamic_data)[0];
                    setError(`Validation Error in ${errorKey}: ${backendError.dynamic_data[errorKey]}`);
                } else if (backendError.location) {
                    setError(`Location Error: ${backendError.location[0]}`);
                } else if (backendError.assigned_to) {
                    setError(`Assignment Error: ${backendError.assigned_to[0]}`);
                } else if (backendError.internal_tag) {
                    setError(`Tag Error: ${backendError.internal_tag[0]}`);
                } else {
                    setError("Error saving asset. Please check the required fields.");
                }
            } else {
                setError("Network error. Please check your connection.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderFieldInput = (field: any) => {
        const value = dynamicValues[field.name] || '';
        const handleChange = (val: string) => setDynamicValues(prev => ({ ...prev, [field.name]: val }));
        
        const baseClasses = "w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

        switch (field.field_type) {
            case 'DROPDOWN':
            case 'COLOR_STATUS':
                return (
                    <select required={field.is_required} value={value} onChange={(e) => handleChange(e.target.value)} className={baseClasses}>
                        <option value="" disabled>Select...</option>
                        {field.options_metadata?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'LOCATION':
                return (
                    <select required={field.is_required} value={value} onChange={(e) => handleChange(e.target.value)} className={baseClasses}>
                        <option value="" disabled>Select a location...</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                );
            case 'EMPLOYEE':
                return (
                    <select required={field.is_required} value={value} onChange={(e) => handleChange(e.target.value)} className={baseClasses}>
                        <option value="unassigned">Unassigned</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                        ))}
                    </select>
                );
            case 'LONG_TEXT':
                return (
                    <textarea required={field.is_required} value={value} rows={3} onChange={(e) => handleChange(e.target.value)} className={baseClasses} />
                );
            default:
                return (
                    <input 
                        type={field.field_type === 'NUMBER' ? 'number' : 'text'}
                        required={field.is_required} value={value}
                        onChange={(e) => handleChange(e.target.value)} className={baseClasses}
                    />
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
                
                <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-surface-base">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                        {assetToEdit ? 'Edit' : 'Register'} {structure.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-semantic-error border border-red-200 dark:bg-red-900/20 dark:border-red-900/50 rounded flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form id="dynamic-asset-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            <div className="space-y-2 sm:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {pkLabel} <span className="text-semantic-error">*</span>
                                </label>
                                <input 
                                    type="text" required value={internalTag}
                                    onChange={e => setInternalTag(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-surface-base border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                                    placeholder="E.g. LAP-2026-001"
                                />
                            </div>

                            {structure.fields.filter((f: any) => f.name !== pkLabel && f.name.toLowerCase() !== 'internal tag').map((field: any) => (
                                <div key={field.id} className={`space-y-2 ${field.field_type === 'LONG_TEXT' ? 'sm:col-span-2' : ''}`}>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {field.name} {field.is_required ? <span className="text-semantic-error">*</span> : <span className="text-gray-400 font-normal text-xs">(Optional)</span>}
                                    </label>
                                    {renderFieldInput(field)}
                                </div>
                            ))}

                        </div>
                    </form>
                </div>

                <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="dynamic-asset-form" disabled={isLoading} className="px-6 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 rounded flex items-center justify-center gap-2 transition-colors">
                        {isLoading ? "Saving..." : (assetToEdit ? `Update ${structure.name}` : `Save ${structure.name}`)}
                    </button>
                </footer>
            </div>
        </div>
    );
};