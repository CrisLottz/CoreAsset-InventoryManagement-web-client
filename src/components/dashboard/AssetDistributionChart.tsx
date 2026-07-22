import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AssetDistributionChartProps {
    title: string;
    data: Array<{ name: string; count: number }>;
    colorPrefix?: string; // e.g. "var(--color-primary-"
}

export const AssetDistributionChart: React.FC<AssetDistributionChartProps> = ({ title, data }) => {
    // We use CSS custom properties for white-label support
    // Since Recharts needs explicit colors or we can use Tailwind classes if we hack it, 
    // but the easiest is using standard CSS variable reads. 
    // For robust SSR/Client hydration without window issues, we'll assign inline styles using standard HSL/Hex if possible, 
    // or rely on CSS vars string format. Recharts handles CSS vars fine on modern browsers.
    const colors = [
        'var(--color-primary-500, #3B82F6)',
        'var(--color-primary-400, #60A5FA)',
        'var(--color-primary-600, #2563EB)',
        'var(--color-primary-300, #93C5FD)',
        'var(--color-primary-700, #1D4ED8)',
    ];

    return (
        <div class="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
            <h3 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-4">{title}</h3>
            
            <div class="flex-1 min-h-[300px] relative">
                {/* A11y: The chart canvas is hidden from screen readers. 
                    Recharts SVGs can be given role="img", but a fallback table is the WCAG gold standard. */}
                <div aria-hidden="true" class="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-surface-elevated, #fff)', borderColor: 'var(--color-border, #e5e7eb)', color: 'var(--color-text-base, #111827)', borderRadius: '0.5rem' }}
                                itemStyle={{ color: 'var(--color-text-base, #111827)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* A11y: Visually hidden data table for screen readers */}
                <table class="sr-only">
                    <caption>{title} Data</caption>
                    <thead>
                        <tr>
                            <th scope="col">Category</th>
                            <th scope="col">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
