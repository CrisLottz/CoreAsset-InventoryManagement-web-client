import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { RoleFormModal } from './RoleFormModal';

export interface Permission {
    id: number;
    name: string;
    codename: string;
    app_label: string;
    model_name: string;
}

export interface Role {
    id: number;
    name: string;
    user_count: number;
    permissions: number[];
}

export default function RoleTableIsland() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination (Though roles are usually not heavily paginated, we stick to the UI standard)
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; role: Role | null; error: string | null; isDeleting: boolean }>({
        isOpen: false,
        role: null,
        error: null,
        isDeleting: false
    });

    // Toast (Assuming global state or simple local implementation. We will use a local toast for simplicity here)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                search: debouncedSearch,
                ordering: 'name'
            });
            const response = await apiClient.get(`/rbac/roles/?${params.toString()}`);
            const data = response.data.results || response.data;
            setRoles(Array.isArray(data) ? data : []);
            setTotalPages(Math.ceil((response.data.count || (Array.isArray(data) ? data.length : 0)) / 10) || 1);
        } catch (error) {
            console.error("Failed to load roles", error);
            showToast("Failed to load roles.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleDelete = async () => {
        if (!deleteModal.role) return;
        setDeleteModal(prev => ({ ...prev, isDeleting: true, error: null }));
        
        try {
            await apiClient.delete(`/rbac/roles/${deleteModal.role.id}/`);
            showToast("Role deleted successfully", "success");
            setDeleteModal({ isOpen: false, role: null, error: null, isDeleting: false });
            // If deleting last item on page, go back
            if (roles.length === 1 && page > 1) {
                setPage(p => p - 1);
            } else {
                fetchRoles();
            }
        } catch (error: any) {
            setDeleteModal(prev => ({ 
                ...prev, 
                isDeleting: false, 
                error: error.response?.data?.detail || "Failed to delete role" 
            }));
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg flex items-center transition-opacity ${toast.type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 'bg-green-100 text-green-800 border-l-4 border-green-500'}`} role="alert" aria-live="polite">
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <label htmlFor="search_roles" className="sr-only">Search roles</label>
                    <input
                        type="text"
                        id="search_roles"
                        placeholder="Search roles by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-surface-elevated text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                </div>
                
                <button
                    onClick={() => { setEditingRole(null); setIsFormOpen(true); }}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Role
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Roles table">
                        <thead className="bg-gray-50 dark:bg-surface-base">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users Assigned</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-elevated divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No roles found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                {role.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            <span className="font-semibold text-gray-900 dark:text-white">{role.user_count}</span> users
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => { setEditingRole(role); setIsFormOpen(true); }}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 mr-2 transition-colors"
                                                aria-label={`Edit ${role.name}`}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (role.user_count > 0) return;
                                                    setDeleteModal({ isOpen: true, role: role, error: null, isDeleting: false });
                                                }}
                                                className={`text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors ${role.user_count > 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                aria-label={`Delete ${role.name}`}
                                                title={role.user_count > 0 ? "Cannot delete this role because it is assigned to users." : "Delete role"}
                                                aria-disabled={role.user_count > 0}
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

            <div className="flex justify-end px-2">
                <p className="text-xs text-gray-400 dark:text-gray-500/80 flex items-center italic">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Roles assigned to active users are protected and cannot be deleted.
                </p>
            </div>

            {/* Modals */}
            <RoleFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSaved={fetchRoles} 
                roleToEdit={editingRole}
            />

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeleteModal({ isOpen: false, role: null, error: null, isDeleting: false })}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-surface-base rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200 dark:border-gray-700">
                            <div className="bg-white dark:bg-surface-base px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                            Delete Role
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Are you sure you want to delete the role <span className="font-semibold text-gray-700 dark:text-gray-300">"{deleteModal.role?.name}"</span>? This action cannot be undone.
                                            </p>
                                            {deleteModal.error && (
                                                <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                                                    {deleteModal.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-surface-elevated px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    onClick={handleDelete}
                                    disabled={deleteModal.isDeleting}
                                >
                                    {deleteModal.isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-surface-base text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setDeleteModal({ isOpen: false, role: null, error: null, isDeleting: false })}
                                    disabled={deleteModal.isDeleting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
