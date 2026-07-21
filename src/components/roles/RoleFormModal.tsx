import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../services/apiClient';
import type { Role, Permission } from './RoleTableIsland';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    roleToEdit: Role | null;
}

export const RoleFormModal = ({ isOpen, onClose, onSaved, roleToEdit }: RoleFormModalProps) => {
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all available permissions when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoadingPermissions(true);
            apiClient.get('/rbac/permissions/')
                .then(res => {
                    setAllPermissions(res.data);
                })
                .catch(err => {
                    console.error("Failed to load permissions", err);
                    setError("Failed to load permission matrix data.");
                })
                .finally(() => {
                    setIsLoadingPermissions(false);
                });
        }
    }, [isOpen]);

    // Initialize form when roleToEdit changes or modal opens
    useEffect(() => {
        if (isOpen) {
            if (roleToEdit) {
                setName(roleToEdit.name);
                setSelectedPermissions(new Set(roleToEdit.permissions || []));
            } else {
                setName('');
                setSelectedPermissions(new Set());
            }
            setError(null);
        }
    }, [isOpen, roleToEdit]);

    // Module Name Formatting
    const MODULE_NAME_MAP: Record<string, string> = {
        'logentry': 'System Logs (Admin)',
        'asset': 'IT Assets (Inventory)',
        'assetcategory': 'Asset Categories',
        'categoryfield': 'Category Custom Fields',
        'location': 'Geographic Locations',
        'usertablepreference': 'User Table Preferences',
        'auditlog': 'System Audit Logs',
        'group': 'RBAC Roles',
        'permission': 'RBAC Permissions',
        'contenttype': 'System Content Types',
        'user': 'Platform Users',
        'employee': 'Company Employees',
    };

    const formatModuleName = (rawName: string) => {
        const lowerName = String(rawName).toLowerCase();
        if (MODULE_NAME_MAP[lowerName]) return MODULE_NAME_MAP[lowerName];
        return String(rawName).charAt(0).toUpperCase() + String(rawName).slice(1);
    };

    // Group permissions for the Matrix UI
    const permissionMatrix = useMemo(() => {
        const matrix: Record<string, { view?: Permission, add?: Permission, change?: Permission, delete?: Permission }> = {};
        
        const permsArray = Array.isArray(allPermissions) ? allPermissions : [];
        
        permsArray.forEach(perm => {
            if (!perm) return;
            
            const rawModelName = perm.model_name || perm.app_label || 'Global';
            const moduleName = formatModuleName(rawModelName);
            
            if (!matrix[moduleName]) {
                matrix[moduleName] = {};
            }
            
            const codename = perm.codename || '';
            if (codename.startsWith('view_')) matrix[moduleName].view = perm;
            else if (codename.startsWith('add_')) matrix[moduleName].add = perm;
            else if (codename.startsWith('change_')) matrix[moduleName].change = perm;
            else if (codename.startsWith('delete_')) matrix[moduleName].delete = perm;
        });

        // Filter out empty rows if any
        return Object.fromEntries(Object.entries(matrix).filter(([_, actions]) => Object.keys(actions).length > 0));
    }, [allPermissions]);

    const handleTogglePermission = (permId: number) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permId)) {
            newSet.delete(permId);
        } else {
            newSet.add(permId);
        }
        setSelectedPermissions(newSet);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        const payload = {
            name,
            permissions: Array.from(selectedPermissions)
        };

        try {
            if (roleToEdit) {
                await apiClient.put(`/rbac/roles/${roleToEdit.id}/`, payload);
            } else {
                await apiClient.post('/rbac/roles/', payload);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.name?.[0] || "Failed to save role.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="relative inline-block align-bottom bg-white dark:bg-surface-base rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
                        <div className="bg-white dark:bg-surface-base px-4 pt-5 pb-4 sm:p-6 flex-1 overflow-y-auto">
                            <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white mb-6" id="modal-title">
                                {roleToEdit ? 'Edit Role & Permissions' : 'Create New Role'}
                            </h3>

                            {error && (
                                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
                                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="space-y-8">
                                {/* Role Name */}
                                <div>
                                    <label htmlFor="role_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Role Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="role_name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                                        placeholder="e.g. IT Administrator"
                                    />
                                </div>

                                {/* Permission Matrix */}
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Permission Matrix</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Define granular access levels across the platform. Check the boxes to grant permissions.
                                    </p>

                                    {isLoadingPermissions ? (
                                        <div className="py-12 flex justify-center text-gray-500 dark:text-gray-400">Loading matrix...</div>
                                    ) : (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-surface-elevated">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-surface-base">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">View</th>
                                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add</th>
                                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delete</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {Object.entries(permissionMatrix).map(([moduleName, actions]) => (
                                                            <tr key={moduleName} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                                    {moduleName}
                                                                </td>
                                                                {['view', 'add', 'change', 'delete'].map((actionType) => {
                                                                    const perm = actions[actionType as keyof typeof actions];
                                                                    const inputId = `perm_${perm?.id || `${moduleName}_${actionType}`}`;
                                                                    
                                                                    return (
                                                                        <td key={actionType} className="px-6 py-4 whitespace-nowrap text-center">
                                                                            {perm ? (
                                                                                <div className="flex items-center justify-center">
                                                                                    <input
                                                                                        id={inputId}
                                                                                        type="checkbox"
                                                                                        checked={selectedPermissions.has(perm.id)}
                                                                                        onChange={() => handleTogglePermission(perm.id)}
                                                                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-primary-500"
                                                                                        aria-label={`Grant ${actionType} permission for ${moduleName}`}
                                                                                    />
                                                                                    <label htmlFor={inputId} className="sr-only">
                                                                                        {`Grant ${actionType} permission for ${moduleName}`}
                                                                                    </label>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-gray-300 dark:text-gray-600">-</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-surface-elevated px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Role'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-surface-base text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={onClose}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
