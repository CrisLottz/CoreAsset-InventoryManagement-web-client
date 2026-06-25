import { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core'; // <-- CORRECCIÓN: Aislado como 'type'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnConfig {
    name: string;
    is_visible: boolean;
}

interface ViewEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: ColumnConfig[]) => void;
    defaultFields: any[]; // La estructura original del backend
    currentConfig: ColumnConfig[];
}

// Sub-componente: Elemento arrastrable
const SortableItem = ({ item, onToggle }: { item: ColumnConfig, onToggle: (name: string) => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.name });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`flex items-center justify-between p-3 mb-2 border rounded-md shadow-sm transition-colors ${
                isDragging ? 'bg-primary-50 border-primary-300 dark:bg-primary-900/20 dark:border-primary-700' : 'bg-white border-gray-200 dark:bg-surface-elevated dark:border-gray-700'
            }`}
        >
            <div className="flex items-center gap-3">
                {/* Handle de Arrastre (Soporta Teclado y Mouse) */}
                <button 
                    type="button"
                    {...attributes} 
                    {...listeners} 
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    aria-label={`Drag ${item.name} column`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
                </button>
                <span className={`font-medium ${item.is_visible ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                    {item.name}
                </span>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={item.is_visible} onChange={() => onToggle(item.name)} aria-label={`Toggle visibility for ${item.name}`} />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
        </div>
    );
};

export const ViewEditorModal = ({ isOpen, onClose, onSave, defaultFields, currentConfig }: ViewEditorModalProps) => {
    const [columns, setColumns] = useState<ColumnConfig[]>([]);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Sensores de Accesibilidad para Dnd-Kit
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isOpen) {
            setColumns([...currentConfig]);
            setShowResetConfirm(false);
        }
    }, [isOpen, currentConfig]);

    if (!isOpen) return null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setColumns((items) => {
                const oldIndex = items.findIndex(i => i.name === active.id);
                const newIndex = items.findIndex(i => i.name === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleVisibility = (name: string) => {
        setColumns(cols => cols.map(c => c.name === name ? { ...c, is_visible: !c.is_visible } : c));
    };

    const handleReset = () => {
        const defaultConfig = defaultFields.map(f => ({ name: f.name, is_visible: true }));
        setColumns(defaultConfig);
        setShowResetConfirm(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-md bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-2xl">
                <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-surface-base">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customize Table View</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Drag to reorder columns or toggle their visibility. Changes are saved to your account.
                    </p>

                    {showResetConfirm ? (
                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded text-sm text-yellow-800 dark:text-yellow-400" aria-live="polite">
                            <p className="font-bold mb-2">Are you sure?</p>
                            <p className="mb-3">This will revert your view to the system default, showing all columns in their original order.</p>
                            <div className="flex gap-2">
                                <button onClick={handleReset} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded">Yes, Reset</button>
                                <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 bg-white border border-yellow-300 text-yellow-800 rounded">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowResetConfirm(true)} className="mb-4 text-sm text-primary-600 hover:underline dark:text-primary-400 font-medium focus:outline-none">
                            Reset to default view
                        </button>
                    )}

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={columns.map(c => c.name)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                                {columns.map(col => (
                                    <SortableItem key={col.name} item={col} onToggle={toggleVisibility} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">Cancel</button>
                    <button onClick={() => onSave(columns)} className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm">Save View</button>
                </footer>
            </div>
        </div>
    );
};