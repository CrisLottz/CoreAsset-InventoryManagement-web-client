import { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

interface FieldOption {
    label: string;
    value: string;
    color?: string;
}

interface CategoryField {
    id: string;
    name: string;
    field_type: 'TEXT' | 'NUMBER' | 'LONG_TEXT' | 'DROPDOWN' | 'COLOR_STATUS' | 'EMPLOYEE' | 'LOCATION';
    is_required: boolean;
    is_locked: boolean;
    options_metadata?: FieldOption[];
}

interface ManagedCategory {
    id: string;
    name: string;
    icon: string;
    is_system_default: boolean;
    is_hidden: boolean;
    display_order: number;
    fields: CategoryField[];
}

const SYSTEM_ICONS = [
    // --- CORE IT HARDWARE ---
    { id: 'desktop-pc', label: 'Workstation / PC', svg: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'monitor', label: 'Display / Monitor', svg: 'M3 5h18v10H3V5zm7 15h4m-2-5v5' },
    { id: 'server', label: 'Datacenter / Server', svg: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
    { id: 'hard-drive', label: 'Storage / Storage Drive', svg: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-18v8h8' },
    { id: 'cpu', label: 'Processing / Component', svg: 'M4 4h16v16H4V4zm5 0V2m6 2V2m-6 18v2m6-2v2M4 9H2m2 6H2m18-6h2m-2 6h2' },

    // --- NETWORKING & INFRASTRUCTURE ---
    { id: 'router', label: 'Router / Access Point', svg: 'M12 3v6m0 0a3 3 0 100 6m0-6a3 3 0 110 6m0 4v3M4 12h3m10 0h3' },
    { id: 'wifi', label: 'Wireless Connectivity', svg: 'M12 20h.01M8.5 16.5a5 5 0 017 0M5.5 13.5a9 9 0 0113 0M2.5 10.5a14 14 0 0119 0' },
    { id: 'switch', label: 'Network Switch', svg: 'M4 6h16v4H4V6zm0 8h16v4H4v-4zm4-5h.01M16 9h.01M8 17h.01M16 17h.01' },
    { id: 'cloud', label: 'Cloud Resources', svg: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.99A7.5 7.5 0 103 15z' },

    // --- MOBILE & MOBILE PERIPHERALS ---
    { id: 'device-phone-mobile', label: 'Smartphone', svg: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'tablet', label: 'Tablet / iPad', svg: 'M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm6 15h.01' },
    { id: 'headset', label: 'Audio / Headphones', svg: 'M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9M3 14v3a2 2 0 002 2h1m15-5v3a2 2 0 01-2 2h-1M3 14h3m15 0h-3' },

    // --- PERIPHERALS & AUDIOVISUAL ---
    { id: 'printer', label: 'Printer / Copier', svg: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { id: 'keyboard', label: 'Input Device / Keyboard', svg: 'M3 7h18v10H3V7zm4 4h.01M12 11h.01M17 11h.01M6 14h12' },
    { id: 'tv', label: 'Smart TV / Display Media', svg: 'M2 5h20v12H2V5zm5 15h10M12 17v3' },

    // --- SOFTWARE, LICENSING & SECURITY ---
    { id: 'code', label: 'SaaS API / Internal Dev', svg: 'M10 20l-4-4m0 0l4-4m-4 4h12m-2-4l4 4m0 0l-4 4' },
    { id: 'shield', label: 'Firewall / Security HW', svg: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { id: 'video-camera', label: 'CCTV / Surveillance Cam', svg: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },

    // --- FACILIITES & LOGISTICS ---
    { id: 'truck', label: 'Fleet Vehicle / Logistics', svg: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm1.2-4.2V14H15V7h4.2l2 4.2zM1 10h14v4H1v-4z' },
    { id: 'home', label: 'Building / Office Branch', svg: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v11a1 1 0 01-1 1h-3m-6 0V14a2 2 0 012-2h2a2 2 0 012 2v7' },
    { id: 'archive', label: 'Storage / Physical Vault', svg: 'M3 3h18v4H3V3zm1 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm6 4h4' },

    // --- OFFICE & RECREATIONAL FURNITURE ---
    { id: 'chair', label: 'Office Furniture / Chair', svg: 'M7 4h10v8H7V4zm0 8h10v4H7v-4zm2 4v4m6-4v4' },
    { id: 'briefcase', label: 'Work Equipment Pack', svg: 'M3 7h18v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm5 0V5a2 2 0 012-2h4a2 2 0 012 2v2' },
    { id: 'gift', label: 'Merchandising / Welcome Pack', svg: 'M20 12v8H4v-8M2 7h20v5H2V7zm10-5v5m-4-3a2 2 0 100 4h4M12 7h4a2 2 0 100-4h-4' }
];

const COLORS_PALETTE = ['Green', 'Gray', 'Purple', 'Yellow', 'Red'];

export const CategoryBuilder = () => {
    const [categories, setCategories] = useState<ManagedCategory[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [securityModal, setSecurityModal] = useState<{ isOpen: boolean, type: 'field' | 'category', targetId: string, confirmKey: string }>({
        isOpen: false,
        type: 'field',
        targetId: '',
        confirmKey: ''
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

    useEffect(() => {
        apiClient.get('/assets/categories/')
            .then(res => {
                setCategories(res.data);
                if (res.data.length > 0) setSelectedId(res.data[0].id);
            })
            .catch(err => console.error("Failed to load schema:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const activeCategory = categories.find(c => c.id === selectedId);

    const updateGeneralSettings = (key: keyof ManagedCategory, value: any) => {
        setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, [key]: value } : c));
    };

    const handleAddField = () => {
        if (!activeCategory) return;
        const newField: CategoryField = {
            id: `new-${Date.now()}`,
            name: 'New Custom Field',
            field_type: 'TEXT',
            is_required: false,
            is_locked: false,
            options_metadata: []
        };
        setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, fields: [...c.fields, newField] } : c));
    };

    const updateFieldProperty = (fieldId: string, property: keyof CategoryField, value: any) => {
        setCategories(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            return {
                ...c,
                fields: c.fields.map(f => f.id === fieldId ? { ...f, [property]: value } : f)
            };
        }));
    };

    const moveField = (index: number, direction: 'UP' | 'DOWN') => {
        setCategories(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            
            const targetIndex = direction === 'UP' ? index - 1 : index + 1;
            
            if (index === 0 || targetIndex === 0) return c;
            if (targetIndex >= c.fields.length) return c;

            const newFields = [...c.fields];
            const temp = newFields[index];
            newFields[index] = newFields[targetIndex];
            newFields[targetIndex] = temp;
            
            return { ...c, fields: newFields };
        }));
    };

    const handleAddOption = (fieldId: string) => {
        setCategories(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            return {
                ...c,
                fields: c.fields.map(f => {
                    if (f.id !== fieldId) return f;
                    const opts = f.options_metadata || [];
                    return { ...f, options_metadata: [...opts, { label: 'New Option', value: 'New Option', color: 'Gray' }] };
                })
            };
        }));
    };

    const updateOptionProperty = (fieldId: string, optIndex: number, property: keyof FieldOption, value: string) => {
        setCategories(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            return {
                ...c,
                fields: c.fields.map(f => {
                    if (f.id !== fieldId) return f;
                    const opts = [...(f.options_metadata || [])];
                    opts[optIndex] = { ...opts[optIndex], [property]: value };
                    if (property === 'label') {
                        opts[optIndex].value = value;
                    }
                    return { ...f, options_metadata: opts };
                })
            };
        }));
    };

    const handleRemoveOption = (fieldId: string, optIndex: number) => {
        setCategories(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            return {
                ...c,
                fields: c.fields.map(f => {
                    if (f.id !== fieldId) return f;
                    return { ...f, options_metadata: f.options_metadata?.filter((_, idx) => idx !== optIndex) };
                })
            };
        }));
    };

    const triggerDeleteVerification = (type: 'field' | 'category', id: string) => {
        setSecurityModal({ isOpen: true, type, targetId: id, confirmKey: '' });
    };

    const executeVerifiedDelete = async () => {
        if (!securityModal.confirmKey) {
            showToast("You must provide authorization credentials.", "error");
            return;
        }

        // 1. Validar la contraseña contra el backend
        try {
            await apiClient.post('/users/verify-password/', { 
                password: securityModal.confirmKey 
            });
        } catch (err: any) {
            showToast(err.response?.data?.detail || "Incorrect password. Operation denied.", "error");
            return;
        }

        // 2. Si la validación es exitosa, procedemos con la destrucción
        if (securityModal.type === 'category') {
            try {
                if (!securityModal.targetId.startsWith('cat-')) {
                    await apiClient.delete(`/assets/categories/${securityModal.targetId}/`);
                }
                const remaining = categories.filter(c => c.id !== securityModal.targetId);
                setCategories(remaining);
                setSelectedId(remaining[0]?.id || null);
                showToast("Module deleted successfully.", "error"); // Red toast as requested
            } catch (err) {
                console.error("Failed to delete category:", err);
                showToast("Cannot delete module. Ensure no active assets are linked to it.", "error");
                return; // Stop execution on error
            }
        } 
        else if (securityModal.type === 'field') {
            setCategories(prev => prev.map(c => {
                if (c.id !== selectedId) return c;
                return { ...c, fields: c.fields.filter(f => f.id !== securityModal.targetId) };
            }));
            showToast("Field deleted successfully.", "error"); // Red toast for deletion
        }
        
        setSecurityModal({ isOpen: false, type: 'field', targetId: '', confirmKey: '' });
    };

    const handleSaveSchemaPayload = async () => {
        if (!activeCategory) return;
        
        const payload = {
            ...activeCategory,
            fields: activeCategory.fields.map(f => ({
                id: f.id.startsWith('new-') ? undefined : f.id,
                name: f.name,
                field_type: f.field_type,
                is_required: f.is_required,
                is_locked: f.is_locked,
                options_metadata: f.options_metadata || []
            }))
        };

        try {
            if (activeCategory.id.startsWith('cat-')) {
                const res = await apiClient.post('/assets/categories/', payload);
                setCategories(prev => prev.map(c => c.id === activeCategory.id ? res.data : c));
                setSelectedId(res.data.id);
            } else {
                await apiClient.put(`/assets/categories/${activeCategory.id}/`, payload);
            }
            showToast(`Schema persisted to database successfully for ${activeCategory.name}.`, "success");
        } catch (err: any) {
            console.error("Mutation failed:", err.response?.data || err);
            showToast("Error: Schema validation failed. Check browser console for details.", "error");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[600px] w-full text-gray-500 dark:text-gray-400">
                <svg className="w-8 h-8 animate-spin text-primary-600 mr-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Loading Configuration Engine...</span>
            </div>
        );
    }

    return (
        <article className="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[750px] flex flex-col md:flex-row relative">
            
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

            {/* COLUMNA MAESTRA (MASTER): LISTADO DE CATEGORÍAS */}
            <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-surface-base/50 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-surface-base">
                    <h2 className="font-bold text-gray-900 dark:text-white">Active Modules</h2>
                    <button 
                        onClick={() => {
                            const newCat: ManagedCategory = {
                                id: `cat-${Date.now()}`,
                                name: 'New Dynamic Module',
                                icon: 'desktop-pc',
                                is_system_default: false,
                                is_hidden: false,
                                display_order: 100,
                                fields: [{ id: `new-tag-${Date.now()}`, name: 'Internal Tag', field_type: 'TEXT', is_required: true, is_locked: true }]
                            };
                            setCategories(prev => [...prev, newCat]);
                            setSelectedId(newCat.id);
                        }}
                        className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors focus:outline-none"
                        aria-label="Create new asset category"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {categories.map((cat) => {
                        const iconData = SYSTEM_ICONS.find(i => i.id === cat.icon) || SYSTEM_ICONS[0];
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedId(cat.id)}
                                aria-selected={selectedId === cat.id}
                                className={`w-full text-left flex items-center justify-between px-3 py-3 rounded-md transition-all ${
                                    selectedId === cat.id 
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-bold shadow-sm' 
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                } ${cat.is_hidden ? 'opacity-40' : ''}`}
                            >
                                <span className="flex items-center gap-3 truncate">
                                    <svg className="w-4 h-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconData.svg} /></svg>
                                    <span className="truncate">{cat.name}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {cat.is_hidden && <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase tracking-wider">Hidden</span>}
                                    {cat.is_system_default && <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>}
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* COLUMNA DETALLE (DETAIL): PANEL DE CONFIGURACIÓN DEL ESQUEMA */}
            <section className="flex-1 flex flex-col bg-white dark:bg-surface-elevated">
                {activeCategory ? (
                    <>
                        <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                                    {activeCategory.name}
                                    {activeCategory.is_system_default && (
                                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">System Seed</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enforce metadata constraints and system routing settings.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {!activeCategory.is_system_default && (
                                    <button 
                                        onClick={() => triggerDeleteVerification('category', activeCategory.id)}
                                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 font-bold text-sm rounded shadow-sm transition-colors focus:outline-none flex items-center gap-2 justify-center"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete Module
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveSchemaPayload}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-sm rounded shadow-sm transition-colors focus:outline-none shrink-0"
                                >
                                    Save Module Schema
                                </button>
                            </div>
                        </header>

                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            
                            {/* SECCIÓN A: CONFIGURACIONES GENERALES */}
                            <fieldset className="space-y-4">
                                <legend className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">General Architecture Settings</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                    <div className="sm:col-span-5">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Module Display Name</label>
                                        <input 
                                            type="text" 
                                            value={activeCategory.name}
                                            onChange={(e) => updateGeneralSettings('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                        />
                                    </div>

                                    {/* SELECTOR VISUAL DE ÍCONOS DE BIBLIOTECA */}
                                    <div className="sm:col-span-4 relative">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Visual Icon Layer</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                                            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        >
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={(SYSTEM_ICONS.find(i => i.id === activeCategory.icon) || SYSTEM_ICONS[0]).svg} /></svg>
                                                <span>{(SYSTEM_ICONS.find(i => i.id === activeCategory.icon) || SYSTEM_ICONS[0]).label}</span>
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        
                                        {isIconDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-20 p-2 grid grid-cols-4 gap-1">
                                                {SYSTEM_ICONS.map((icon) => (
                                                    <button
                                                        key={icon.id}
                                                        type="button"
                                                        onClick={() => { updateGeneralSettings('icon', icon.id); setIsIconDropdownOpen(false); }}
                                                        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center gap-1 text-center group ${activeCategory.icon === icon.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                                                        title={icon.label}
                                                    >
                                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon.svg} /></svg>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="sm:col-span-3 flex items-end">
                                        <label className="relative inline-flex items-center cursor-pointer bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-full h-[38px] select-none">
                                            <input 
                                                type="checkbox" className="sr-only peer" 
                                                checked={activeCategory.is_hidden} 
                                                onChange={(e) => updateGeneralSettings('is_hidden', e.target.checked)}
                                            />
                                            <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[11px] after:left-[14px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase ml-8">Hide Module</span>
                                        </label>
                                    </div>
                                </div>
                            </fieldset>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* SECCIÓN B: ORQUESTRADOR DE CAMPOS DINÁMICOS */}
                            <fieldset className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <legend className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Database JSONB Schema Orchestrator</legend>
                                    <button 
                                        type="button" onClick={handleAddField}
                                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 focus:outline-none"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                        Append Custom Property
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* INDICADOR VISUAL FANTASMA EXCLUSIVO PARA SEEDED CATEGORIES */}
                                    {activeCategory.is_system_default && (
                                        <div className="p-4 border rounded-lg shadow-sm transition-all relative group bg-gray-50 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                <div className="md:col-span-4">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">Field Key/Label Name</label>
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded text-[9px] uppercase font-bold tracking-wider select-none">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                                                            System PK
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="text" value="Internal Tag" 
                                                        disabled={true} 
                                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-100 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-900 dark:disabled:text-white disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                                                    />
                                                </div>

                                                <div className="md:col-span-4">
                                                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Type Constraint</label>
                                                    <select
                                                        value="TEXT"
                                                        disabled={true}
                                                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-100 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-900 dark:disabled:text-white disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        <option value="TEXT">Free Text (Max 200 chars)</option>
                                                    </select>
                                                </div>

                                                <div className="md:col-span-3 flex items-center gap-4 h-[58px]">
                                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none cursor-not-allowed opacity-50">
                                                        <input 
                                                            type="checkbox" checked={true} 
                                                            disabled={true}
                                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Required</span>
                                                    </label>
                                                </div>

                                                <div className="md:col-span-1 flex justify-end h-[58px] items-center">
                                                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeCategory.fields.map((field, index) => {
                                        // PROTECCIÓN DE LLAVE PRIMARIA EXCLUSIVAMENTE PARA MÓDULOS CUSTOM O CAMPOS BLOQUEADOS DE DB
                                        const isStrictPK = (!activeCategory.is_system_default && index === 0) || field.is_locked || field.name.toLowerCase() === 'internal tag';

                                        return (
                                            <div 
                                                key={field.id}
                                                className={`p-4 border rounded-lg shadow-sm transition-all relative group ${isStrictPK ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700' : 'bg-white border-gray-200 dark:bg-surface-base/80 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-800'}`}
                                            >
                                                
                                                {/* BOTONES DE REORDENAMIENTO (MOVE UP / DOWN) */}
                                                {!isStrictPK && (
                                                    <div className="absolute -right-3 -top-3 hidden group-hover:flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md overflow-hidden z-10">
                                                        <button 
                                                            type="button" 
                                                            disabled={index <= 1} // No puede subir a la posición de la PK (index 0)
                                                            onClick={() => moveField(index, 'UP')}
                                                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="Move Field Up"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                                                        </button>
                                                        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>
                                                        <button 
                                                            type="button" 
                                                            disabled={index === activeCategory.fields.length - 1} 
                                                            onClick={() => moveField(index, 'DOWN')}
                                                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="Move Field Down"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                    
                                                    {/* Nombre de la Propiedad */}
                                                    <div className="md:col-span-4">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">Field Key/Label Name</label>
                                                            {/* BADGE DE PROTECCIÓN INDUSTRIAL */}
                                                            {isStrictPK && (
                                                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded text-[9px] uppercase font-bold tracking-wider select-none">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                                                                    System PK
                                                                </span>
                                                            )}
                                                        </div>
                                                        <input 
                                                            type="text" value={field.name} 
                                                            disabled={isStrictPK} 
                                                            onChange={(e) => updateFieldProperty(field.id, 'name', e.target.value)}
                                                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-100 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-900 dark:disabled:text-white disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                                                        />
                                                    </div>

                                                    {/* Selector de Tipo de Dato con Bloqueo Estricto */}
                                                    <div className="md:col-span-4">
                                                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Type Constraint</label>
                                                        <select
                                                            value={field.field_type}
                                                            disabled={isStrictPK || !field.id.startsWith('new-')} // BLOQUEO DE MUTACIÓN
                                                            onChange={(e) => updateFieldProperty(field.id, 'field_type', e.target.value)}
                                                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-100 disabled:bg-gray-100 disabled:text-gray-900 dark:disabled:bg-gray-900 dark:disabled:text-white disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <option value="TEXT">Free Text (Max 200 chars)</option>
                                                            <option value="NUMBER">Number Only</option>
                                                            <option value="LONG_TEXT">Long Text / Textarea</option>
                                                            <option value="DROPDOWN">Dynamic Dropdown List</option>
                                                            <option value="COLOR_STATUS">Color Status Switcher</option>
                                                            <option value="EMPLOYEE">System Employee Link</option>
                                                            <option value="LOCATION">System Location Link</option>
                                                        </select>
                                                    </div>

                                                    {/* Flags de Validación */}
                                                    <div className="md:col-span-3 flex items-center gap-4 h-[58px]">
                                                        <label className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none ${isStrictPK ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                            <input 
                                                                type="checkbox" checked={field.is_required} 
                                                                disabled={isStrictPK} // Bloquea desmarcar 'Required' si es PK
                                                                onChange={(e) => updateFieldProperty(field.id, 'is_required', e.target.checked)}
                                                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 disabled:cursor-not-allowed"
                                                            />
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Required</span>
                                                        </label>
                                                    </div>

                                                    {/* Botón de Purga Destructiva */}
                                                    <div className="md:col-span-1 flex justify-end h-[58px] items-center">
                                                        {!isStrictPK ? (
                                                            <button
                                                                type="button" onClick={() => triggerDeleteVerification('field', field.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors focus:outline-none"
                                                                title="Permanently erase this field structure"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* MÁNAGER SUB-ANIDADO DE OPCIONES (SOLO DROPDOWNS Y COLOR STATUS) */}
                                                {(field.field_type === 'DROPDOWN' || field.field_type === 'COLOR_STATUS') && (
                                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-2 animate-fade-in cursor-default">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dropdown List Values</span>
                                                            <button
                                                                type="button" onClick={() => handleAddOption(field.id)}
                                                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold focus:outline-none"
                                                            >
                                                                + Add Option Row
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {field.options_metadata?.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                                    {field.field_type === 'COLOR_STATUS' && (
                                                                        <select
                                                                            value={opt.color || 'Gray'}
                                                                            onChange={(e) => updateOptionProperty(field.id, oIdx, 'color', e.target.value)}
                                                                            className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-1 focus:outline-none text-gray-900 dark:text-white"
                                                                        >
                                                                            {COLORS_PALETTE.map(c => (
                                                                                <option key={c} value={c}>{c}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                    <input 
                                                                        type="text" value={opt.label} placeholder="Option text..."
                                                                        onChange={(e) => updateOptionProperty(field.id, oIdx, 'label', e.target.value)}
                                                                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                                    />
                                                                    <button
                                                                        type="button" onClick={() => handleRemoveOption(field.id, oIdx)}
                                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                                                                        title="Delete this option"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Select a module from the sidebar to start configuring.
                    </div>
                )}
            </section>

            {/* MODAL DE SEGURIDAD (Eliminación de Field / Categoría) */}
            {securityModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-surface-elevated border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden shadow-2xl flex flex-col animate-scale-up">
                        <header className="px-6 py-4 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-md font-bold text-red-800 dark:text-red-400">
                                    {securityModal.type === 'category' ? 'Irreversible Module Deletion' : 'Irreversible Schema Alteration'}
                                </h4>
                            </div>
                        </header>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {securityModal.type === 'category' 
                                    ? `You are about to permanently delete this entire inventory module. This action will fail if there are any active assets assigned to it.` 
                                    : `You are deleting a schema property. This action will completely purge all historical production data stored inside the JSONB object for every asset in this category.`}
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Confirm Administrator Password</label>
                                <input 
                                    type="password" placeholder="••••••••"
                                    value={securityModal.confirmKey}
                                    onChange={(e) => setSecurityModal(prev => ({ ...prev, confirmKey: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <footer className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-surface-base flex justify-end gap-3">
                            <button onClick={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Abort</button>
                            <button onClick={executeVerifiedDelete} className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm">Confirm Destruction</button>
                        </footer>
                    </div>
                </div>
            )}
        </article>
    );
};