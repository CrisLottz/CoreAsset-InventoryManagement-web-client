import React, { useState, useRef, useEffect } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import type { DateFormat } from '../../hooks/useDateFormat';
import { apiClient } from '../../services/apiClient';
import { ImageCropperModal } from './ImageCropperModal';

const TooltipInfo = ({ text }: { text: string }) => (
    <div className="relative inline-flex items-center group ml-2 align-middle">
        <svg className="w-4 h-4 text-gray-400 hover:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

export const PreferencesSettingsIsland = () => {
    const { format, saveFormat } = useDateFormat();
    const [avatarVisibility, setAvatarVisibility] = useState<'public' | 'private'>('public');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Cropper State
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        // Fetch current user data to set avatar visibility
        const fetchUserData = async () => {
            try {
                const response = await apiClient.get('/users/me/');
                if (response.data) {
                    if (response.data.avatar_visibility) {
                        setAvatarVisibility(response.data.avatar_visibility);
                    }
                    if (response.data.avatar) {
                        setAvatarUrl(response.data.avatar);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user data for preferences", error);
            }
        };
        fetchUserData();
    }, []);

    const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        saveFormat(e.target.value as DateFormat);
        showToast('Date format updated successfully', 'success');
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const file = target.files?.[0];
        if (!file) return;

        // Validation: Fallback to extension check if MIME type is missing (common Windows issue)
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isImageMime = file.type.startsWith('image/');
        const isValidExtension = extension && validExtensions.includes(extension);

        if (!isImageMime && !isValidExtension) {
            showToast('Please select a valid image file.', 'error');
            target.value = '';
            return;
        }
        
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit for raw input
        if (file.size > MAX_SIZE) {
            showToast('Initial image size must be less than 5MB.', 'error');
            target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setSelectedImageSrc(reader.result?.toString() || null);
        });
        reader.readAsDataURL(file);
        
        target.value = ''; // Reset input so same file can be selected again
    };

    const handleCropComplete = async (croppedFile: File) => {
        setSelectedImageSrc(null); // Close modal
        
        const formData = new FormData();
        formData.append('avatar', croppedFile);

        setIsUploading(true);
        try {
            const response = await apiClient.patch('/users/me/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (response.data && response.data.avatar) {
                setAvatarUrl(response.data.avatar);
                showToast('Profile picture updated successfully', 'success');
                window.dispatchEvent(new Event('user-updated'));
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            showToast(error.response?.data?.detail || 'Failed to update profile picture', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleVisibilityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVis = e.target.value as 'public' | 'private';
        setAvatarVisibility(newVis);
        
        try {
            await apiClient.patch('/users/me/', {
                avatar_visibility: newVis
            });
            showToast('Visibility settings updated', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to update visibility', 'error');
        }
    };

    return (
        <section className="bg-white dark:bg-surface-elevated border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden mb-8 relative">
            {toast && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg text-sm font-bold z-[9999] animate-fade-in flex items-center gap-2 ${
                    toast.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'
                }`}>
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {toast.message}
                </div>
            )}
            
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Preferences</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage your preferences for date formatting and profile picture visibility.
                    </p>
                </div>

                <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-800">
                    
                    {/* Date Format row */}
                    <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Date Format</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Select the date and time format that will be used across the platform.
                            </p>
                        </div>
                        <div className="w-full md:w-64 flex-shrink-0">
                            <select 
                                value={format}
                                onChange={handleFormatChange}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-base text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2 px-3"
                            >
                                <option value="dd/MM/yyyy">dd/MM/yyyy (e.g., 21/07/2026)</option>
                                <option value="MM/dd/yyyy">MM/dd/yyyy (e.g., 07/21/2026)</option>
                                <option value="yyyy-MM-dd">yyyy-MM-dd (e.g., 2026-07-21)</option>
                            </select>
                        </div>
                    </div>

                    {/* Profile Picture row */}
                    <div className="pt-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            Profile Picture Visibility
                            <TooltipInfo text="Public: Visible to everyone. Private: Visible only to you and System Administrators." />
                        </h3>
                            {!avatarUrl ? (
                                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                    You must add a profile picture to select visibility settings.
                                </p>
                            ) : (
                                <div className="mt-2 flex items-center gap-4">
                                    <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                    <select 
                                        value={avatarVisibility}
                                        onChange={handleVisibilityChange}
                                        className="block rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-base text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-1.5 px-3"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex-shrink-0 pt-1">
                            <input 
                                type="file" 
                                id="avatar-upload-input"
                                accept="image/*" 
                                className="sr-only" 
                                onChange={handleAvatarUpload}
                                disabled={isUploading}
                            />
                            <label 
                                htmlFor="avatar-upload-input"
                                className={`inline-flex justify-center rounded-md border border-transparent bg-primary-500 py-2 px-4 text-sm font-bold text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {isUploading ? 'Uploading...' : (avatarUrl ? 'Change Picture' : 'Add Profile Picture')}
                            </label>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Cropper Modal */}
            {selectedImageSrc && (
                <ImageCropperModal
                    imageSrc={selectedImageSrc}
                    onClose={() => setSelectedImageSrc(null)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </section>
    );
};
