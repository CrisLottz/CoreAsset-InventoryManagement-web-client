import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { UserFormModal } from './UserFormModal';

export interface User {
    id: string;
    username: string;
    email: string;
    is_staff: boolean;
    is_active: boolean;
    is_mfa_enabled: boolean;
    employee: string | null;
    assigned_locations: string[];
    groups: number[];
    user_permissions: number[];
}

export default function UserTableIsland() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                search: debouncedSearch,
                ordering: '-date_joined'
            });
            const response = await apiClient.get(`/users/?${params.toString()}`);
            const data = response.data.results || response.data;
            setUsers(Array.isArray(data) ? data : []);
            setTotalPages(Math.ceil((response.data.count || (Array.isArray(data) ? data.length : 0)) / 10) || 1);
        } catch (error) {
            console.error("Failed to load users", error);
            showToast("Failed to load users.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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
                    <label htmlFor="search_users" className="sr-only">Search users</label>
                    <input
                        type="text"
                        id="search_users"
                        placeholder="Search by username or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-surface-elevated text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                </div>
                
                <button
                    onClick={() => { setEditingUser(null); setIsFormOpen(true); }}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add User
                </button>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" aria-label="Users table">
                        <thead className="bg-gray-50 dark:bg-surface-base">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Access</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-elevated divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-lg">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {u.username}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.is_active ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {u.is_staff ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                                    Super Admin
                                                </span>
                                            ) : (
                                                <span>{u.groups?.length || 0} Roles</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => { setEditingUser(u); setIsFormOpen(true); }}
                                                className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 mr-2 transition-colors"
                                                aria-label={`Edit ${u.username}`}
                                            >
                                                Edit
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

            <UserFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSaved={fetchUsers} 
                userToEdit={editingUser}
            />
        </div>
    );
}
