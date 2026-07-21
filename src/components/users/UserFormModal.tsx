import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../services/apiClient';
import type { User } from './UserTableIsland';
import type { Role, Permission } from '../roles/RoleTableIsland';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    userToEdit: User | null;
}

export const UserFormModal = ({ isOpen, onClose, onSaved, userToEdit }: UserFormModalProps) => {
    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
    const [isStaff, setIsStaff] = useState(false);
    const [isActive, setIsActive] = useState(true);

    // Dropdown Data
    const [employees, setEmployees] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    
    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);

    // Fetch dependent data on mount
    useEffect(() => {
        if (isOpen) {
            setIsLoadingData(true);
            Promise.all([
                apiClient.get('/employees/'),
                apiClient.get('/assets/locations/'),
                apiClient.get('/rbac/roles/'),
                apiClient.get('/rbac/permissions/')
            ])
            .then(([empRes, locRes, rolesRes, permsRes]) => {
                setEmployees(empRes.data.results || empRes.data);
                setLocations(locRes.data.results || locRes.data);
                setRoles(rolesRes.data.results || rolesRes.data);
                setAllPermissions(permsRes.data);
            })
            .catch(err => {
                console.error("Failed to load dependent data", err);
                setError("Failed to load form data. Please try again.");
            })
            .finally(() => setIsLoadingData(false));
        }
    }, [isOpen]);

    // Initialize form when userToEdit changes
    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                setUsername(userToEdit.username);
                setEmail(userToEdit.email);
                setPassword('');
                setEmployeeId(userToEdit.employee || '');
                setSelectedRoles(new Set(userToEdit.groups || []));
                setSelectedLocations(new Set(userToEdit.assigned_locations || []));
                setSelectedPermissions(new Set(userToEdit.user_permissions || []));
                setIsStaff(userToEdit.is_staff);
                setIsActive(userToEdit.is_active);
            } else {
                setUsername('');
                setEmail('');
                setPassword('');
                setEmployeeId('');
                setSelectedRoles(new Set());
                setSelectedLocations(new Set());
                setSelectedPermissions(new Set());
                setIsStaff(false);
                setIsActive(true);
            }
            setError(null);
            setShowAdvancedPerms(false);
        }
    }, [isOpen, userToEdit]);

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

    // Matrix Logic (Reused from RoleFormModal)
    const permissionMatrix = useMemo(() => {
        const matrix: Record<string, { view?: Permission, add?: Permission, change?: Permission, delete?: Permission }> = {};
        
        const permsArray = Array.isArray(allPermissions) ? allPermissions : [];
        
        permsArray.forEach(perm => {
            if (!perm) return;
            
            const rawModelName = perm.model_name || perm.app_label || 'Global';
            const moduleName = formatModuleName(rawModelName);
            
            if (!matrix[moduleName]) matrix[moduleName] = {};
            
            const codename = perm.codename || '';
            if (codename.startsWith('view_')) matrix[moduleName].view = perm;
            else if (codename.startsWith('add_')) matrix[moduleName].add = perm;
            else if (codename.startsWith('change_')) matrix[moduleName].change = perm;
            else if (codename.startsWith('delete_')) matrix[moduleName].delete = perm;
        });
        return Object.fromEntries(Object.entries(matrix).filter(([_, actions]) => Object.keys(actions).length > 0));
    }, [allPermissions]);

    const handleTogglePermission = (permId: number) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(permId)) newSet.delete(permId);
        else newSet.add(permId);
        setSelectedPermissions(newSet);
    };

    const handleToggleRole = (roleId: number) => {
        const newSet = new Set(selectedRoles);
        if (newSet.has(roleId)) newSet.delete(roleId);
        else newSet.add(roleId);
        setSelectedRoles(newSet);
    };

    const handleToggleLocation = (locId: string) => {
        const newSet = new Set(selectedLocations);
        if (newSet.has(locId)) newSet.delete(locId);
        else newSet.add(locId);
        setSelectedLocations(newSet);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!employeeId) {
            setError("You must select an Employee to link to this user.");
            return;
        }

        setIsSaving(true);
        setError(null);

        const payload: any = {
            username,
            email,
            employee: employeeId,
            groups: Array.from(selectedRoles),
            assigned_locations: Array.from(selectedLocations),
            user_permissions: Array.from(selectedPermissions),
            is_staff: isStaff,
            is_active: isActive
        };

        if (password) {
            payload.password = password;
        }

        try {
            if (userToEdit) {
                await apiClient.patch(`/users/${userToEdit.id}/`, payload);
            } else {
                await apiClient.post('/users/', payload);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            // Flatten Django errors
            const msgs = err.response?.data;
            if (typeof msgs === 'object') {
                const firstKey = Object.keys(msgs)[0];
                setError(`${firstKey}: ${msgs[firstKey][0]}`);
            } else {
                setError("Failed to save user.");
            }
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
                                {userToEdit ? 'Edit Platform User' : 'Create Platform User'}
                            </h3>

                            {error && (
                                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 flex items-center">
                                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            {isLoadingData ? (
                                <div className="py-12 flex justify-center text-gray-500 dark:text-gray-400">Loading form data...</div>
                            ) : (
                                <div className="space-y-6">
                                    {/* 1. Core Fields & Employee Link */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                                        <div className="md:col-span-2">
                                            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Employee Link <span className="text-red-500">*</span>
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Select the physical person this account belongs to.</p>
                                            <select
                                                id="employee"
                                                required
                                                value={employeeId}
                                                onChange={(e) => setEmployeeId(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                                            >
                                                <option value="">-- Select Employee --</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Username <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="username"
                                                required
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Password {userToEdit ? <span className="text-gray-400 font-normal">(Leave blank to keep current)</span> : <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                required={!userToEdit}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-surface-elevated text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-2 flex items-center space-x-6">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={(e) => setIsActive(e.target.checked)}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-900 dark:text-white">Active Account</span>
                                            </label>
                                            
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isStaff}
                                                    onChange={(e) => setIsStaff(e.target.checked)}
                                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <span className="ml-2 text-sm font-medium text-purple-700 dark:text-purple-400">Super Administrator (Bypasses RBAC)</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* 2. Roles & Locations */}
                                    {!isStaff && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Assigned Roles</h4>
                                                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 border border-gray-200 dark:border-gray-700 p-2 rounded-md bg-gray-50 dark:bg-surface-elevated">
                                                    {roles.map(role => (
                                                        <label key={role.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRoles.has(role.id)}
                                                                onChange={() => handleToggleRole(role.id)}
                                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{role.name}</span>
                                                        </label>
                                                    ))}
                                                    {roles.length === 0 && <span className="text-xs text-gray-500 px-2">No roles available.</span>}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Geographic Scope (Locations)</h4>
                                                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 border border-gray-200 dark:border-gray-700 p-2 rounded-md bg-gray-50 dark:bg-surface-elevated">
                                                    {locations.map(loc => (
                                                        <label key={loc.id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLocations.has(loc.id)}
                                                                onChange={() => handleToggleLocation(loc.id)}
                                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{loc.name}</span>
                                                        </label>
                                                    ))}
                                                    {locations.length === 0 && <span className="text-xs text-gray-500 px-2">No locations available.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Advanced Individual Permissions */}
                                    {!isStaff && (
                                        <div>
                                            <button 
                                                type="button"
                                                onClick={() => setShowAdvancedPerms(!showAdvancedPerms)}
                                                className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
                                            >
                                                <svg className={`w-4 h-4 mr-1 transform transition-transform ${showAdvancedPerms ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                                Advanced: Granular Individual Permissions
                                            </button>

                                            {showAdvancedPerms && (
                                                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-surface-elevated">
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
                                                                            const inputId = `user_perm_${perm?.id || `${moduleName}_${actionType}`}`;
                                                                            
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
                                                                                                aria-label={`Grant ${actionType} individual permission for ${moduleName}`}
                                                                                            />
                                                                                            <label htmlFor={inputId} className="sr-only">
                                                                                                {`Grant ${actionType} individual permission for ${moduleName}`}
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
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-surface-elevated px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={isSaving || isLoadingData}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save User'}
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
