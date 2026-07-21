import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';

const TooltipInfo = ({ text }: { text: string }) => (
    <div className="relative inline-flex items-center group ml-2 align-middle">
        <svg className="w-4 h-4 text-gray-400 hover:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

const PasswordInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    tooltip 
}: { 
    id: string, 
    label: string, 
    value: string, 
    onChange: (val: string) => void,
    tooltip: string
}) => {
    const [show, setShow] = useState(false);

    return (
        <div>
            <div className="flex items-center mb-1">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
                <TooltipInfo text={tooltip} />
            </div>
            <div className="relative rounded-md shadow-sm">
                <input
                    type={show ? "text" : "password"}
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2.5 px-3 pr-10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none text-base sm:text-sm dark:bg-surface-base dark:border-gray-600 dark:text-white"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                    {show ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export const SecuritySettingsIsland = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setToast(null);

        if (newPassword !== confirmPassword) {
            setToast({ message: "New password and confirmation do not match.", type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/users/change-password/', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            setToast({ message: "Password updated successfully.", type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setToast({ 
                message: error.response?.data?.detail || "Failed to update password. Please check your current password.", 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Account Security
            </h2>

            {/* Accessible Toast Notification */}
            <div aria-live="polite" className="mb-4">
                {toast && (
                    <div className={`p-3 rounded-md text-sm font-medium ${
                        toast.type === 'success' 
                        ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                        {toast.message}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordInput 
                    id="current_password" 
                    label="Current Password" 
                    value={currentPassword} 
                    onChange={setCurrentPassword} 
                    tooltip="Your current active password for identity verification."
                />
                
                <PasswordInput 
                    id="new_password" 
                    label="New Password" 
                    value={newPassword} 
                    onChange={setNewPassword} 
                    tooltip="Must be at least 8 characters long and contain a mix of letters and numbers."
                />
                
                <PasswordInput 
                    id="confirm_password" 
                    label="Confirm New Password" 
                    value={confirmPassword} 
                    onChange={setConfirmPassword} 
                    tooltip="Please re-type your new password to ensure there are no typos."
                />

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-surface-elevated transition-colors"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </section>
    );
};
