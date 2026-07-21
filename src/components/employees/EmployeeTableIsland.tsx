import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { EmployeeFormModal } from './EmployeeFormModal';
import { CsvImportModal } from './CsvImportModal';

interface Employee {
    id: string;
    employee_number: string | null;
    first_name: string;
    last_name: string;
    job_title: string;
    email: string | null;
    is_active: boolean;
}

export default function EmployeeTableIsland() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination & Search & Filter
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive'>('active');

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCsvOpen, setIsCsvOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    
    // Security Modal state
    const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, employeeId: string | null, password: '', error: string | null, isHardDelete: boolean}>({
        isOpen: false,
        employeeId: null,
        password: '',
        error: null,
        isHardDelete: false
    });

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'deactivate' | 'reactivate' | null, employeeId: string | null}>({
        isOpen: false,
        action: null,
        employeeId: null
    });

    // Bulk Actions state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeactivating, setIsBulkDeactivating] = useState(false);
    const [confirmBulkModal, setConfirmBulkModal] = useState(false); // Used for Deactivate
    const [confirmBulkReactivateModal, setConfirmBulkReactivateModal] = useState(false);
    const [bulkDeleteModal, setBulkDeleteModal] = useState<{isOpen: boolean, password: '', error: string | null}>({
        isOpen: false,
        password: '',
        error: null
    });

    // Toast state
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
            }, 300); // Wait for transition duration before unmounting
        }, 3000); // Time to display the toast
    };

    // Debounce search query (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset to page 1 on new search
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/employees/', {
                params: {
                    page,
                    search: debouncedQuery,
                    status: statusFilter
                }
            });
            // DRF PageNumberPagination returns { count, next, previous, results }
            setEmployees(res.data.results || res.data);
            if (res.data.count !== undefined) {
                // Assuming default page size of 20
                setTotalPages(Math.ceil(res.data.count / 20));
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedQuery, statusFilter]);

    useEffect(() => {
        fetchEmployees();
        setSelectedIds(new Set()); // Reset selections on fetch
    }, [fetchEmployees]);

    const openCreateForm = () => {
        setEditingEmployee(null);
        setIsFormOpen(true);
    };

    const openEditForm = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsFormOpen(true);
    };

    const requestDeactivate = (id: string) => {
        setConfirmModal({ isOpen: true, action: 'deactivate', employeeId: id });
    };

    const requestReactivate = (id: string) => {
        setConfirmModal({ isOpen: true, action: 'reactivate', employeeId: id });
    };

    const executeConfirmAction = async () => {
        const { action, employeeId } = confirmModal;
        if (!employeeId) return;

        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        
        if (action === 'deactivate') {
            try {
                await apiClient.delete(`/employees/${employeeId}/`);
                fetchEmployees();
                showToast("Employee deactivated successfully.", "warning");
            } catch (err) {
                showToast("Failed to deactivate employee.", "error");
            }
        } else if (action === 'reactivate') {
            try {
                await apiClient.post(`/employees/${employeeId}/reactivate/`);
                fetchEmployees();
                showToast("Employee reactivated successfully.", "success");
            } catch (err) {
                showToast("Failed to reactivate employee.", "error");
            }
        }
    };

    const openHardDelete = (id: string) => {
        setDeleteModal({
            isOpen: true,
            employeeId: id,
            password: '',
            error: null,
            isHardDelete: true
        });
    };

    const executeHardDelete = async () => {
        if (!deleteModal.employeeId || !deleteModal.password) {
            setDeleteModal(prev => ({...prev, error: "Password is required"}));
            return;
        }

        try {
            await apiClient.post(`/employees/${deleteModal.employeeId}/hard-delete/`, {
                password: deleteModal.password
            });
            setDeleteModal(prev => ({...prev, isOpen: false}));
            fetchEmployees();
            showToast("Employee permanently deleted.", "error");
        } catch (err: any) {
            if (err.response?.status === 403) {
                setDeleteModal(prev => ({...prev, error: "Invalid admin password."}));
            } else {
                setDeleteModal(prev => ({...prev, error: "An unexpected error occurred."}));
            }
        }
    };

    // Bulk Actions Logic
    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select based on current statusFilter
            const isSelectActive = statusFilter === 'active';
            setSelectedIds(new Set(employees.filter(emp => emp.is_active === isSelectActive).map(e => e.id)));
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

    const executeBulkDeactivate = async () => {
        setConfirmBulkModal(false);
        setIsBulkDeactivating(true);
        try {
            await Promise.all(Array.from(selectedIds).map(id => apiClient.delete(`/employees/${id}/`)));
            const count = selectedIds.size;
            setSelectedIds(new Set());
            fetchEmployees();
            showToast(`Successfully deactivated ${count} employees.`, "warning");
        } catch (err) {
            showToast("Failed to deactivate some employees.", "error");
        } finally {
            setIsBulkDeactivating(false);
        }
    };

    const executeBulkReactivate = async () => {
        setConfirmBulkReactivateModal(false);
        setIsBulkDeactivating(true); // Reusing the same loading state for simplicity
        try {
            await Promise.all(Array.from(selectedIds).map(id => apiClient.post(`/employees/${id}/reactivate/`)));
            const count = selectedIds.size;
            setSelectedIds(new Set());
            fetchEmployees();
            showToast(`Successfully reactivated ${count} employees.`, "success");
        } catch (err) {
            showToast("Failed to reactivate some employees.", "error");
        } finally {
            setIsBulkDeactivating(false);
        }
    };

    const executeBulkHardDelete = async () => {
        if (!bulkDeleteModal.password) {
            setBulkDeleteModal(prev => ({...prev, error: "Password is required"}));
            return;
        }

        setIsBulkDeactivating(true);
        try {
            // Promise.all to hard delete all selected
            await Promise.all(Array.from(selectedIds).map(id => 
                apiClient.post(`/employees/${id}/hard-delete/`, { password: bulkDeleteModal.password })
            ));
            const count = selectedIds.size;
            setBulkDeleteModal(prev => ({...prev, isOpen: false}));
            setSelectedIds(new Set());
            fetchEmployees();
            showToast(`Permanently deleted ${count} employees.`, "error");
        } catch (err: any) {
            if (err.response?.status === 403) {
                setBulkDeleteModal(prev => ({...prev, error: "Invalid admin password."}));
            } else {
                setBulkDeleteModal(prev => ({...prev, error: "An unexpected error occurred."}));
                showToast("Failed to delete some employees.", "error");
            }
        } finally {
            setIsBulkDeactivating(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded shadow-lg text-white font-medium flex items-center gap-2 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'} ${
                    toast.type === 'success' ? 'bg-semantic-success' :
                    toast.type === 'warning' ? 'bg-semantic-warning text-gray-900' :
                    toast.type === 'error' ? 'bg-semantic-error' :
                    'bg-primary-600'
                }`}>
                    {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                    {toast.type === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                    {toast.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {toast.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 gap-4 max-w-2xl">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-surface-elevated text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm transition-shadow"
                            aria-label="Search employees"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value as 'active' | 'inactive'); setPage(1); }}
                        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm rounded-md bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                        aria-label="Filter by status"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCsvOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import CSV
                    </button>
                    <button
                        onClick={openCreateForm}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Employee
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-gray-100 dark:bg-surface-elevated px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 flex justify-between items-center animate-fade-in shadow-sm">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{selectedIds.size} employee(s) selected</span>
                    <div className="flex items-center gap-4">
                        {statusFilter === 'active' ? (
                            <button 
                                onClick={() => setConfirmBulkModal(true)}
                                disabled={isBulkDeactivating}
                                className="px-4 py-2 bg-semantic-warning hover:bg-yellow-600 disabled:opacity-50 text-gray-900 font-bold rounded flex items-center gap-2 focus:ring-2 focus:ring-yellow-500 transition-colors"
                            >
                                {isBulkDeactivating ? 'Processing...' : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Deactivate Selected
                                    </>
                                )}
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setConfirmBulkReactivateModal(true)}
                                    disabled={isBulkDeactivating}
                                    className="px-4 py-2 bg-semantic-success hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded flex items-center gap-2 focus:ring-2 focus:ring-semantic-success transition-colors"
                                >
                                    {isBulkDeactivating ? 'Processing...' : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            Reactivate Selected
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setBulkDeleteModal(prev => ({...prev, isOpen: true, password: '', error: null}))}
                                    disabled={isBulkDeactivating}
                                    className="px-4 py-2 bg-semantic-error hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded flex items-center gap-2 focus:ring-2 focus:ring-semantic-error transition-colors"
                                >
                                    {isBulkDeactivating ? 'Processing...' : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            Delete Selected
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                                        checked={employees.length > 0 && selectedIds.size === employees.filter(e => e.is_active === (statusFilter === 'active')).length && employees.filter(e => e.is_active === (statusFilter === 'active')).length > 0}
                                        onChange={toggleSelectAll}
                                        disabled={employees.filter(e => e.is_active === (statusFilter === 'active')).length === 0}
                                        aria-label={`Select all ${statusFilter} employees`}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-4 text-left">Employee Name</th>
                                <th scope="col" className="px-6 py-4 text-left">Job Title</th>
                                <th scope="col" className="px-6 py-4 text-left">ID Number</th>
                                <th scope="col" className="px-6 py-4 text-left">Email</th>
                                <th scope="col" className="px-6 py-4 text-left">Status</th>
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-surface-elevated divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <svg className="mx-auto w-8 h-8 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No employees found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-left">
                                            {emp.is_active === (statusFilter === 'active') && (
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                                                    checked={selectedIds.has(emp.id)}
                                                    onChange={() => toggleSelection(emp.id)}
                                                    aria-label={`Select ${emp.first_name}`}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {emp.first_name} {emp.last_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {emp.job_title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {emp.employee_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {emp.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${emp.is_active ? 'bg-semantic-success/10 text-semantic-success' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            {emp.is_active ? (
                                                <>
                                                    <button onClick={() => openEditForm(emp)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:underline">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => requestDeactivate(emp.id)} className="text-semantic-warning hover:text-yellow-700 focus:outline-none focus:underline">
                                                        Deactivate
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => requestReactivate(emp.id)} className="text-semantic-success hover:text-green-700 focus:outline-none focus:underline">
                                                        Reactivate
                                                    </button>
                                                    <button onClick={() => openHardDelete(emp.id)} className="text-semantic-error hover:text-red-700 focus:outline-none focus:underline">
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination (if applicable) */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-surface-base">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-surface-elevated text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-surface-elevated text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sub-components */}
            <EmployeeFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                employee={editingEmployee} 
                onSuccess={() => { 
                    setIsFormOpen(false); 
                    fetchEmployees(); 
                    showToast(
                        editingEmployee ? "Employee updated successfully." : "Employee created successfully.", 
                        editingEmployee ? "info" : "success"
                    );
                }} 
            />
            
            <CsvImportModal 
                isOpen={isCsvOpen} 
                onClose={() => setIsCsvOpen(false)} 
                onSuccess={() => { setIsCsvOpen(false); fetchEmployees(); }} 
                onRefresh={() => fetchEmployees()}
            />

            {/* Hard Delete Security Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModal(prev => ({...prev, isOpen: false}))} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-semantic-error/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h2 id="delete-title" className="text-lg font-bold text-gray-900 dark:text-white">Permanent Deletion</h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                You are about to permanently delete an employee from the database. This action cannot be undone. All linked history will lose the employee reference.
                            </p>
                            
                            {deleteModal.error && (
                                <div className="mb-4 p-3 bg-semantic-error/10 text-semantic-error rounded text-sm">
                                    {deleteModal.error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="admin_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Admin Password Required
                                </label>
                                <input
                                    id="admin_password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={deleteModal.password}
                                    onChange={(e) => setDeleteModal(prev => ({...prev, password: e.target.value, error: null}))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-semantic-error bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-base border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal(prev => ({...prev, isOpen: false}))}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeHardDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-semantic-error rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-semantic-error"
                            >
                                Permanently Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* General Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmModal.action === 'deactivate' ? 'bg-semantic-warning/10 text-semantic-warning' : 'bg-semantic-success/10 text-semantic-success'}`}>
                                {confirmModal.action === 'deactivate' ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                )}
                            </div>
                            <h2 id="confirm-title" className="text-lg font-bold text-gray-900 dark:text-white">
                                {confirmModal.action === 'deactivate' ? 'Deactivate Employee' : 'Reactivate Employee'}
                            </h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {confirmModal.action === 'deactivate' 
                                    ? "Are you sure you want to deactivate this employee? This action changes their status to inactive. They will be retained in the database for historical and referential purposes." 
                                    : "Are you sure you want to reactivate this employee? Their status will be changed back to active, making them available for current assignments and references."
                                }
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-base border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeConfirmAction}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                                    confirmModal.action === 'deactivate' 
                                    ? 'bg-semantic-warning hover:bg-yellow-600 focus:ring-semantic-warning text-gray-900' 
                                    : 'bg-semantic-success hover:bg-green-700 focus:ring-semantic-success'
                                }`}
                            >
                                {confirmModal.action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Reactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        {/* Bulk Deactivate Confirmation Modal */}
            {confirmBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setConfirmBulkModal(false)} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-semantic-warning/10 text-semantic-warning flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Bulk Deactivation</h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Are you sure you want to deactivate <strong>{selectedIds.size}</strong> employees? This action changes their status to inactive. They will be retained in the database for historical and referential purposes.
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-base border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmBulkModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBulkDeactivate}
                                className="px-4 py-2 text-sm font-medium text-gray-900 bg-semantic-warning rounded-md shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-semantic-warning"
                            >
                                Yes, Deactivate All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Reactivate Confirmation Modal */}
            {confirmBulkReactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setConfirmBulkReactivateModal(false)} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-semantic-success/10 text-semantic-success flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Bulk Reactivation</h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Are you sure you want to reactivate <strong>{selectedIds.size}</strong> employees? Their status will be changed back to active, making them available for current assignments and references.
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-base border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmBulkReactivateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBulkReactivate}
                                className="px-4 py-2 text-sm font-medium text-white bg-semantic-success rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-semantic-success"
                            >
                                Yes, Reactivate All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Security Modal */}
            {bulkDeleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setBulkDeleteModal(prev => ({...prev, isOpen: false}))} aria-hidden="true"></div>
                    
                    <div role="dialog" aria-modal="true" className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-semantic-error/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-semantic-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Permanent Bulk Deletion</h2>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                You are about to permanently delete <strong>{selectedIds.size}</strong> employees from the database. This action cannot be undone. All linked history will lose the employee reference.
                            </p>
                            
                            {bulkDeleteModal.error && (
                                <div className="mb-4 p-3 bg-semantic-error/10 text-semantic-error rounded text-sm">
                                    {bulkDeleteModal.error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="bulk_admin_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Admin Password Required
                                </label>
                                <input
                                    id="bulk_admin_password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={bulkDeleteModal.password}
                                    onChange={(e) => setBulkDeleteModal(prev => ({...prev, password: e.target.value, error: null}))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-semantic-error bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                                    placeholder="Confirm your password"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-surface-base border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => setBulkDeleteModal(prev => ({...prev, isOpen: false}))}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeBulkHardDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-semantic-error rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-semantic-error"
                            >
                                Permanently Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
