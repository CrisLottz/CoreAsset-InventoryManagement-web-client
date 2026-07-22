import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityTimelineChartProps {
    title: string;
    data: Array<{ date: string; count: number }>;
}

export const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({ title, data }) => {
    return (
        <div class="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
            <h3 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-4">{title}</h3>
            
            <div class="flex-1 min-h-[300px] relative">
                {/* A11y: Hidden from SRs */}
                <div aria-hidden="true" class="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border, #e5e7eb)" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--color-text-muted, #6b7280)', fontSize: 12 }} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'var(--color-text-muted, #6b7280)', fontSize: 12 }} 
                            />
                            <Tooltip 
                                cursor={{ fill: 'var(--color-surface-hover, #f3f4f6)' }}
                                contentStyle={{ backgroundColor: 'var(--color-surface-elevated, #fff)', borderColor: 'var(--color-border, #e5e7eb)', color: 'var(--color-text-base, #111827)', borderRadius: '0.5rem' }}
                                itemStyle={{ color: 'var(--color-text-base, #111827)' }}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="var(--color-primary-500, #3B82F6)" 
                                radius={[4, 4, 0, 0]} 
                                name="Actions"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* A11y: Visually hidden data table */}
                <table class="sr-only">
                    <caption>{title} Data</caption>
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Actions Logged</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td>{item.date}</td>
                                <td>{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
