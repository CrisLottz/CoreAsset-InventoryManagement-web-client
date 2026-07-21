import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Location {
    id: string;
    name: string;
    country: string | null;
    address: string | null;
    is_active: boolean;
    assets_count?: number;
}

interface LocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: Location | null;
    onSuccess: () => void;
    onShowToast?: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const LocationFormModal = ({ isOpen, onClose, location, onSuccess, onShowToast }: LocationFormModalProps) => {
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    const [address, setAddress] = useState('');
    const [isActive, setIsActive] = useState(true);
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (location) {
                setName(location.name || '');
                setCountry(location.country || '');
                setAddress(location.address || '');
                setIsActive(location.is_active !== undefined ? location.is_active : true);
            } else {
                setName('');
                setCountry('');
                setAddress('');
                setIsActive(true);
            }
            setError(null);
        }
    }, [isOpen, location]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const payload = {
            name,
            country: country || null,
            address: address || null,
            is_active: isActive
        };

        try {
            if (location) {
                await apiClient.put(`/assets/locations/${location.id}/`, payload);
                if (onShowToast) onShowToast("Location updated successfully.", "success");
            } else {
                await apiClient.post('/assets/locations/', payload);
                if (onShowToast) onShowToast("Location created successfully.", "success");
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.name?.[0] || "An unexpected error occurred.");
            if (onShowToast) onShowToast("Failed to save location.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true"></div>
            
            <div 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="modal-title" 
                className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-between items-center">
                    <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
                        {location ? 'Edit Location' : 'New Location'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-md" aria-live="assertive">
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form id="location-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Name Input */}
                            <div className="col-span-12">
                                <label htmlFor="loc_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location Name <span className="text-red-500" aria-label="Required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="loc_name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                                    placeholder="e.g. Headquarters"
                                />
                            </div>

                            {/* Country Input */}
                            <div className="col-span-12">
                                <label htmlFor="loc_country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Country <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="loc_country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                                    placeholder="e.g. United States"
                                />
                            </div>

                            {/* Address Textarea */}
                            <div className="col-span-12">
                                <label htmlFor="loc_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    id="loc_address"
                                    rows={3}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white resize-none"
                                    placeholder="Full street address..."
                                />
                            </div>

                            {/* Active Status Toggle */}
                            <div className="col-span-12 flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="loc_is_active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-surface-base dark:border-gray-600 dark:checked:bg-primary-500"
                                />
                                <label htmlFor="loc_is_active" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Active Location
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-base hover:bg-gray-50 dark:hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="location-form"
                        disabled={isSaving || !name.trim()}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            location ? 'Update Location' : 'Create Location'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
