import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { KpiCard } from './KpiCard';
import { AssetDistributionChart } from './AssetDistributionChart';
import { ActivityTimelineChart } from './ActivityTimelineChart';

// Simplified SVG Icons for KPIs
const ServerIcon = () => <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
const UserIcon = () => <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const WrenchIcon = () => <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ArchiveIcon = () => <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;

export const DashboardGridIsland: React.FC = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Fetch locations for filter
        apiClient.get('/assets/locations/')
            .then(res => setLocations(res.data.results || res.data))
            .catch(err => console.error("Could not load locations", err));
    }, []);

    const fetchAnalytics = async (forceRefresh = false) => {
        try {
            if (!forceRefresh && !data) setLoading(true);
            else setRefreshing(true);
            
            const params = new URLSearchParams();
            if (selectedLocation) params.append('location', selectedLocation);
            if (forceRefresh) params.append('force_refresh', 'true');
            
            const res = await apiClient.get(`/analytics/dashboard/?${params.toString()}`);
            setData(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [selectedLocation]);

    if (loading) {
        return (
            <div class="animate-pulse space-y-6">
                <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <div key={i} class="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>)}
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                    <div class="h-80 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div class="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">{error}</div>;
    }

    return (
        <div class="flex flex-col space-y-6">
            {/* Global Filters */}
            <div class="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-surface-elevated p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div class="flex items-center space-x-4">
                    <label htmlFor="location-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Scope:
                    </label>
                    <select
                        id="location-filter"
                        class="form-select w-48 sm:text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-surface-base dark:text-white focus:ring-primary-500 focus:border-primary-500"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        disabled={refreshing}
                    >
                        <option value="">Global (All Locations)</option>
                        {locations.map((loc: any) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <button 
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        {refreshing ? 'Refreshing...' : 'Force Sync'}
                    </button>
                </div>
            </div>

            {/* Top Row: KPIs */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Total Assets" 
                    value={data?.kpis?.total_assets || 0} 
                    icon={<ServerIcon />} 
                />
                <KpiCard 
                    title="Active Employees" 
                    value={data?.kpis?.active_employees || 0} 
                    icon={<UserIcon />} 
                />
                <KpiCard 
                    title="In Maintenance" 
                    value={data?.kpis?.assets_in_maintenance || 0} 
                    icon={<WrenchIcon />} 
                />
                <KpiCard 
                    title="Ready to Deploy" 
                    value={data?.kpis?.assets_unassigned || 0} 
                    description="Assets with no assignee"
                    icon={<ArchiveIcon />} 
                />
            </div>

            {/* Middle Row: Bento Grid for Charts */}
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-4 h-[400px]">
                    <AssetDistributionChart 
                        title="Assets by Category" 
                        data={data?.assets_by_category || []} 
                    />
                </div>
                
                <div class="lg:col-span-8 h-[400px]">
                    <ActivityTimelineChart 
                        title="System Activity (7 Days)" 
                        data={data?.recent_activity_volume || []} 
                    />
                </div>
            </div>

            {/* Bottom Row */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="h-[400px]">
                    <AssetDistributionChart 
                        title="Assets by Status" 
                        data={data?.assets_by_status || []} 
                    />
                </div>
                <div class="h-[400px]">
                    <AssetDistributionChart 
                        title="Assets by Location" 
                        data={data?.assets_by_location || []} 
                    />
                </div>
            </div>
            
        </div>
    );
};
