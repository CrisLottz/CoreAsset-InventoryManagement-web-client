import { useState, useEffect } from 'react';

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

    return (
        <div className="bg-white dark:bg-surface-elevated p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
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
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white font-mono"
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
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white"
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
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white"
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
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white"
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
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none sm:text-sm bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                    />
                </div>
            </div>
        </div>
    );
};
