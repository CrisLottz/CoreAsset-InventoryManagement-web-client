import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { LocationFormModal } from './LocationFormModal';

interface Location {
    id: string;
    name: string;
    country: string | null;
    address: string | null;
    is_active: boolean;
    assets_count: number;
}

export default function LocationTableIsland() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; location: Location | null; error: string | null; isDeleting: boolean }>({
        isOpen: false,
        location: null,
        error: null,
        isDeleting: false
    });

    const [breakdownModal, setBreakdownModal] = useState<{ isOpen: boolean; location: Location | null; data: {category_id: string, category_name: string, count: number}[]; isLoading: boolean }>({
        isOpen: false,
        location: null,
        data: [],
        isLoading: false
    });

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
        setToast({ message, type });
        setIsExiting(false);
        setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setToast(null);
                setIsExiting(false);
            }, 300);
        }, 3000);
    };

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/assets/locations/', {
                params: {
                    page: page,
                    search: debouncedSearch || undefined
                }
            });
            
            if (response.data.results) {
                setLocations(response.data.results);
                setTotalRecords(response.data.count);
                setTotalPages(Math.ceil(response.data.count / 10)); // Assuming page_size=10
            } else {
                setLocations(response.data); // Fallback if pagination is turned off
                setTotalRecords(response.data.length);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
            setLocations([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const executeDelete = async () => {
        if (!deleteModal.location) return;
        
        setDeleteModal(prev => ({ ...prev, isDeleting: true, error: null }));
        
        try {
            await apiClient.delete(`/assets/locations/${deleteModal.location.id}/`);
            setDeleteModal({ isOpen: false, location: null, error: null, isDeleting: false });
            fetchLocations();
            showToast("Location deleted successfully.", "success");
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "An unexpected error occurred. Unable to delete location.";
            setDeleteModal(prev => ({ ...prev, error: errorMessage, isDeleting: false }));
        }
    };

    const fetchBreakdown = async (loc: Location) => {
        setBreakdownModal({ isOpen: true, location: loc, data: [], isLoading: true });
        try {
            const response = await apiClient.get(`/assets/locations/${loc.id}/category_breakdown/`);
            setBreakdownModal(prev => ({ ...prev, data: response.data, isLoading: false }));
        } catch (error) {
            console.error("Failed to fetch breakdown", error);
            setBreakdownModal(prev => ({ ...prev, isLoading: false }));
            showToast("Failed to load category breakdown.", "error");
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div 
                    aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
                    className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded shadow-lg text-white font-medium flex items-center gap-2 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'} ${
                        toast.type === 'success' ? 'bg-semantic-success' :
                        toast.type === 'warning' ? 'bg-semantic-warning text-gray-900' :
                        toast.type === 'error' ? 'bg-semantic-error' :
                        'bg-primary-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <label htmlFor="search_locations" className="sr-only">Search locations</label>
                    <input
                        type="text"
                        id="search_locations"
                        placeholder="Search locations by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-surface-elevated text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                </div>
                
                <button
                    onClick={() => { setEditingLocation(null); setIsFormOpen(true); }}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Location
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Locations table">
                        <thead className="bg-gray-50 dark:bg-surface-base">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets Assigned</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-elevated divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                // Skeleton Loaders
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : locations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No locations found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                locations.map((loc) => (
                                    <tr key={loc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{loc.name}</div>
                                            {loc.address && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs" title={loc.address}>{loc.address}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {loc.country || <span className="text-gray-400 italic">Not specified</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {loc.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    <svg className="mr-1.5 h-2 w-2 text-green-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                    <svg className="mr-1.5 h-2 w-2 text-gray-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {loc.assets_count > 0 ? (
                                                <button 
                                                    onClick={() => fetchBreakdown(loc)}
                                                    className="flex items-center text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:underline group transition-colors"
                                                    aria-label={`View category breakdown for ${loc.assets_count} assets`}
                                                >
                                                    <span className="font-bold mr-1">{loc.assets_count}</span> 
                                                    <span className="text-xs group-hover:underline">assets (View)</span>
                                                </button>
                                            ) : (
                                                <div className="flex items-center text-gray-500">
                                                    <span className="font-semibold mr-1">0</span> 
                                                    <span className="text-xs">assets</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => { setEditingLocation(loc); setIsFormOpen(true); }}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 mr-2 transition-colors"
                                                aria-label={`Edit ${loc.name}`}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (loc.assets_count > 0) return;
                                                    setDeleteModal({ isOpen: true, location: loc, error: null, isDeleting: false });
                                                }}
                                                className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors ${loc.assets_count > 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                aria-label={`Delete ${loc.name}`}
                                                title={loc.assets_count > 0 ? "Cannot delete this location because it has active assets assigned." : "Delete location"}
                                                aria-disabled={loc.assets_count > 0}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-surface-elevated text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                aria-label="Previous page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-surface-elevated text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                aria-label="Next page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Delete constraint explanatory label */}
            <div className="flex justify-end px-2">
                <p className="text-xs text-gray-400 dark:text-gray-500/80 flex items-center italic">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Locations with assigned assets are protected and cannot be deleted.
                </p>
            </div>

            {/* Modals */}
            <LocationFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                location={editingLocation}
                onSuccess={() => { setIsFormOpen(false); fetchLocations(); }}
                onShowToast={showToast}
            />

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => !deleteModal.isDeleting && setDeleteModal(prev => ({...prev, isOpen: false}))} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base">
                            <h2 id="delete-title" className="text-xl font-semibold text-gray-900 dark:text-white">Delete Location</h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Are you absolutely sure you want to permanently delete <strong>{deleteModal.location?.name}</strong>?
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                This is a destructive operation and cannot be undone.
                            </p>

                            {deleteModal.error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded" aria-live="assertive">
                                    <p className="text-sm text-red-700 dark:text-red-400">{deleteModal.error}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(prev => ({...prev, isOpen: false}))}
                                disabled={deleteModal.isDeleting}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-base hover:bg-gray-50 dark:hover:bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                disabled={deleteModal.isDeleting}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-semantic-error hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleteModal.isDeleting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Permanently Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Breakdown Modal */}
            {breakdownModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setBreakdownModal(prev => ({...prev, isOpen: false}))} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" aria-labelledby="breakdown-title" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-between items-center">
                            <h2 id="breakdown-title" className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
                                Assets in {breakdownModal.location?.name}
                            </h2>
                            <button 
                                onClick={() => setBreakdownModal(prev => ({...prev, isOpen: false}))}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
                                aria-label="Close modal"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-0 overflow-y-auto">
                            {breakdownModal.isLoading ? (
                                <div className="p-6 flex justify-center">
                                    <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : breakdownModal.data.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    No assets found for this location.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {breakdownModal.data.map((item, index) => (
                                        <li key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {item.category_name}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                                {item.count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Total: <strong className="text-gray-900 dark:text-white">{breakdownModal.location?.assets_count}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
