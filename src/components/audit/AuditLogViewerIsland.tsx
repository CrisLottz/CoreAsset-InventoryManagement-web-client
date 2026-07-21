import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { AuditFilterBarIsland } from './AuditFilterBarIsland';
import { useReadingPaneMode } from '../../hooks/useReadingPaneMode';
import { useDateFormat } from '../../hooks/useDateFormat';

interface ActorDetails {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string | null;
}

interface AuditLog {
    id: string;
    actor: string;
    actor_details: ActorDetails | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata_json: Record<string, any>;
    ip_address: string;
    created_at: string;
}

export const AuditLogViewerIsland = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ action: '', entity_type: '', actor: '', start_date: '', end_date: '' });
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const params: any = { page: currentPage };
            if (filters.action) params.action = filters.action;
            if (filters.entity_type) params.entity_type = filters.entity_type;
            if (filters.actor) params.actor = filters.actor;
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;

            const res = await apiClient.get('/audit/logs/', { params });
            setLogs(res.data.results || res.data);
            setTotalResults(res.data.count || (Array.isArray(res.data) ? res.data.length : 0));
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [currentPage, filters]);

    const handleFilterChange = useCallback((newFilters: any) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change
    }, []);

    const toggleJsonViewer = (logId: string) => {
        setExpandedLogId(expandedLogId === logId ? null : logId);
    };

    const getActionBadge = (action: string) => {
        const method = action.toUpperCase();
        const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        if (method === 'POST') return <span className={getThemedClass(baseClass, "bg-green-100 text-green-800", "dark:bg-green-900/30 dark:text-green-400")}>Created</span>;
        if (method === 'PUT' || method === 'PATCH') return <span className={getThemedClass(baseClass, "bg-blue-100 text-blue-800", "dark:bg-blue-900/30 dark:text-blue-400")}>Updated</span>;
        if (method === 'DELETE') return <span className={getThemedClass(baseClass, "bg-red-100 text-red-800", "dark:bg-red-900/30 dark:text-red-400")}>Deleted</span>;
        return <span className={getThemedClass(baseClass, "bg-gray-100 text-gray-800", "dark:bg-gray-800 dark:text-gray-300")}>{method}</span>;
    };

    const { mode, getThemedClass } = useReadingPaneMode();
    const { formatDateTime } = useDateFormat();
    
    // Themed classes for reading pane
    const containerClasses = getThemedClass('shadow-sm rounded-lg border flex-1 overflow-hidden flex flex-col', 'bg-white border-gray-200', 'dark:bg-surface-elevated dark:border-gray-700 dark:text-gray-100');
    const theadClasses = getThemedClass('', 'bg-gray-50', 'dark:bg-surface-base');
    const tbodyClasses = getThemedClass('divide-y', 'bg-white divide-gray-200', 'dark:bg-surface-elevated dark:divide-gray-700');
    const trClasses = getThemedClass('transition-colors', 'hover:bg-gray-50', 'dark:hover:bg-gray-800/50');
    const thClasses = getThemedClass('px-4 py-3 text-left text-xs font-medium uppercase tracking-wider', 'text-gray-500', 'dark:text-gray-400');
    const textPrimaryClasses = getThemedClass('text-sm font-medium', 'text-gray-900', 'dark:text-white');
    const textSecondaryClasses = getThemedClass('text-xs font-mono', 'text-gray-500', 'dark:text-gray-400');
    const textBodyClasses = getThemedClass('text-sm', 'text-gray-900', 'dark:text-white');
    const tdClasses = getThemedClass('px-4 py-4 whitespace-nowrap text-sm', 'text-gray-500', 'dark:text-gray-400');
    const tdIpClasses = getThemedClass('px-4 py-4 whitespace-nowrap text-sm font-mono', 'text-gray-500', 'dark:text-gray-400');
    const btnClasses = getThemedClass('inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500', 'text-primary-700 bg-primary-50 hover:bg-primary-100', 'dark:text-primary-400 dark:bg-primary-900/20 dark:hover:bg-primary-900/40');

    return (
        <div className="flex flex-col h-full space-y-4">
            <AuditFilterBarIsland onFilterChange={handleFilterChange} totalResults={totalResults} />

            <div className={containerClasses}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={theadClasses}>
                            <tr>
                                <th scope="col" className={thClasses}>Timestamp</th>
                                <th scope="col" className={thClasses}>Action</th>
                                <th scope="col" className={thClasses}>Actor</th>
                                <th scope="col" className={`${thClasses} w-64`}>Entity Type / ID</th>
                                <th scope="col" className={thClasses}>IP Address</th>
                                <th scope="col" className={`${thClasses} text-right`}>Metadata</th>
                            </tr>
                        </thead>
                        <tbody className={tbodyClasses}>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading audit logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No audit logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr className={trClasses}>
                                            <td className={tdClasses}>
                                                {formatDateTime(log.created_at)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getActionBadge(log.action)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {log.actor_details?.avatar ? (
                                                        <img 
                                                            src={log.actor_details.avatar} 
                                                            alt={log.actor_details.username} 
                                                            className="flex-shrink-0 h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 mr-3" 
                                                        />
                                                    ) : (
                                                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-xs mr-3 border border-transparent">
                                                            {(log.actor_details?.username || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className={textPrimaryClasses}>
                                                            {log.actor_details ? log.actor_details.username : 'Unknown'}
                                                        </span>
                                                        <span className={textSecondaryClasses}>
                                                            {log.actor}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 max-w-xs">
                                                <div className="flex flex-col">
                                                    <span className={`${textBodyClasses} truncate`} title={log.entity_type}>
                                                        {log.entity_type}
                                                    </span>
                                                    {log.entity_id && (
                                                        <span className={`${textSecondaryClasses} truncate`} title={log.entity_id}>
                                                            ID: {log.entity_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={tdIpClasses}>
                                                {log.ip_address}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => toggleJsonViewer(log.id)}
                                                    aria-expanded={expandedLogId === log.id}
                                                    aria-label="View Metadata"
                                                    className={btnClasses}
                                                >
                                                    {expandedLogId === log.id ? 'Hide JSON' : 'View JSON'}
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Collapsible JSON Viewer */}
                                        {expandedLogId === log.id && (
                                            <tr>
                                                <td colSpan={6} className={getThemedClass('p-4 border-t-0 border-b', 'bg-gray-50 border-gray-200', 'dark:bg-surface-base dark:border-gray-700')}>
                                                    <div className="max-h-64 overflow-y-auto rounded bg-gray-900 p-4">
                                                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                                            {JSON.stringify(log.metadata_json, null, 2)}
                                                        </pre>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-white dark:bg-surface-elevated px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{totalResults > 0 ? (currentPage - 1) * 20 + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * 20, totalResults)}</span> of <span className="font-medium">{totalResults}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-base text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage * 20 >= totalResults}
                                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-base text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
