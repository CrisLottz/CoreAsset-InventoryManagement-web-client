import { useState, useEffect } from 'react';
import { useReadingPaneMode } from '../../hooks/useReadingPaneMode';

interface AuditFilterBarProps {
    onFilterChange: (filters: { action: string; entity_type: string; actor: string; start_date: string; end_date: string }) => void;
    totalResults: number;
}

export const AuditFilterBarIsland = ({ onFilterChange, totalResults }: AuditFilterBarProps) => {
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [actor, setActor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Debounce logic (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            onFilterChange({
                action,
                entity_type: entityType,
                actor,
                start_date: startDate,
                end_date: endDate
            });
        }, 300);

        return () => clearTimeout(handler);
    }, [action, entityType, actor, startDate, endDate, onFilterChange]);

    const { mode, getThemedClass } = useReadingPaneMode();

    const toggleReadingPane = () => {
        const newMode = mode === 'light' ? 'auto' : 'light';
        localStorage.setItem('reading_pane_mode', newMode);
        window.dispatchEvent(new Event('preferences-changed'));
    };

    return (
        <div className="bg-white dark:bg-surface-elevated p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Customizable table view</h3>
                <button
                    type="button"
                    onClick={toggleReadingPane}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:bg-surface-base dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    {mode === 'light' ? 'Disable Light Reading Pane' : 'Light Reading Pane'}
                </button>
            </div>

            {/* Screen Reader Only Announcement for Accessibility */}
            <div aria-live="polite" className="sr-only">
                {totalResults} audit logs found matching current filters.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Actor UUID Filter */}
                <div>
                    <label htmlFor="filter-actor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Actor (UUID)
                    </label>
                    <input
                        type="text"
                        id="filter-actor"
                        value={actor}
                        onChange={(e) => setActor(e.target.value)}
                        placeholder="Search by User UUID..."
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white font-mono py-2 px-3 h-10"
                    />
                </div>

                {/* Entity Type Filter */}
                <div>
                    <label htmlFor="filter-entity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Entity / Module
                    </label>
                    <input
                        type="text"
                        id="filter-entity"
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        placeholder="e.g. assets, users..."
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white py-2 px-3 h-10"
                    />
                </div>

                {/* Action Filter */}
                <div>
                    <label htmlFor="filter-action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Action
                    </label>
                    <select
                        id="filter-action"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white py-2 px-3 h-10"
                    >
                        <option value="">All Actions</option>
                        <option value="POST">Created (POST)</option>
                        <option value="PATCH">Updated (PATCH)</option>
                        <option value="PUT">Updated (PUT)</option>
                        <option value="DELETE">Deleted (DELETE)</option>
                    </select>
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="filter-start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white py-2 px-3 h-10"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="filter-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="filter-end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white py-2 px-3 h-10"
                    />
                </div>
            </div>
        </div>
    );
};
