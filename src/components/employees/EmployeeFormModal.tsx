import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface Employee {
    id: string;
    employee_number: string | null;
    first_name: string;
    last_name: string;
    job_title: string;
    email: string | null;
    is_active: boolean;
}

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee: Employee | null; // If null, it's create mode
}

export const EmployeeFormModal = ({ isOpen, onClose, onSuccess, employee }: EmployeeFormModalProps) => {
    const isEdit = !!employee;
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        job_title: '',
        email: '',
        employee_number: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setGeneralError(null);
            if (employee) {
                setFormData({
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    job_title: employee.job_title,
                    email: employee.email || '',
                    employee_number: employee.employee_number || ''
                });
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    job_title: '',
                    email: '',
                    employee_number: ''
                });
            }
        }
    }, [isOpen, employee]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setGeneralError(null);

        try {
            if (isEdit) {
                await apiClient.put(`/employees/${employee.id}/`, formData);
            } else {
                await apiClient.post('/employees/', formData);
            }
            onSuccess();
        } catch (error: any) {
            if (error.response && error.response.status === 400) {
                setErrors(error.response.data);
            } else {
                setGeneralError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true"></div>
            
            <div 
                className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 id="modal-title" className="text-xl font-bold tracking-tight leading-tight text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ARIA Live region for announcements */}
                <div aria-live="polite" className="sr-only">
                    {generalError ? `Error: ${generalError}` : ''}
                    {Object.keys(errors).length > 0 ? 'There are validation errors in the form.' : ''}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                        
                        {generalError && (
                            <div className="p-4 bg-semantic-error/10 text-semantic-error rounded-md flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">{generalError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    First Name <span className="text-semantic-error">*</span>
                                </label>
                                <input
                                    id="first_name"
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white ${errors.first_name ? 'border-semantic-error' : 'border-gray-300 dark:border-gray-600'}`}
                                    aria-invalid={!!errors.first_name}
                                    aria-describedby={errors.first_name ? "first_name-error" : undefined}
                                />
                                {errors.first_name && (
                                    <p id="first_name-error" className="mt-1 text-sm text-semantic-error flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {errors.first_name[0]}
                                    </p>
                                )}
                            </div>
                            
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Last Name <span className="text-semantic-error">*</span>
                                </label>
                                <input
                                    id="last_name"
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white ${errors.last_name ? 'border-semantic-error' : 'border-gray-300 dark:border-gray-600'}`}
                                    aria-invalid={!!errors.last_name}
                                    aria-describedby={errors.last_name ? "last_name-error" : undefined}
                                />
                                {errors.last_name && (
                                    <p id="last_name-error" className="mt-1 text-sm text-semantic-error flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {errors.last_name[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Job Title <span className="text-semantic-error">*</span>
                            </label>
                            <input
                                id="job_title"
                                type="text"
                                required
                                value={formData.job_title}
                                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white ${errors.job_title ? 'border-semantic-error' : 'border-gray-300 dark:border-gray-600'}`}
                                aria-invalid={!!errors.job_title}
                                aria-describedby={errors.job_title ? "job_title-error" : undefined}
                            />
                            {errors.job_title && (
                                <p id="job_title-error" className="mt-1 text-sm text-semantic-error flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {errors.job_title[0]}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Employee Number
                                </label>
                                <input
                                    id="employee_number"
                                    type="text"
                                    value={formData.employee_number}
                                    onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white ${errors.employee_number ? 'border-semantic-error' : 'border-gray-300 dark:border-gray-600'}`}
                                    aria-invalid={!!errors.employee_number}
                                    aria-describedby={errors.employee_number ? "employee_number-error" : undefined}
                                />
                                {errors.employee_number && (
                                    <p id="employee_number-error" className="mt-1 text-sm text-semantic-error flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {errors.employee_number[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-surface-base text-gray-900 dark:text-white ${errors.email ? 'border-semantic-error' : 'border-gray-300 dark:border-gray-600'}`}
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                />
                                {errors.email && (
                                    <p id="email-error" className="mt-1 text-sm text-semantic-error flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {errors.email[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-3 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isLoading && (
                                <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isEdit ? 'Save Changes' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
