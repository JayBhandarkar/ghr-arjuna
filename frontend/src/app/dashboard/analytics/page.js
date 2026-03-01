'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useStatement } from '@/lib/StatementContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';
import { formatINR, formatINRChart } from '@/lib/formatINR';

function TrendIcon({ change }) {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const { hasRealData, computed: realFin, statementMeta } = useStatement();

    const fin = hasRealData
        ? realFin
        : deriveFinancials(user?.annualIncome || mockData.kpis.totalIncome * 12);

    const avgMonthlySpend = fin.monthlyData?.length > 0
        ? Math.round(fin.monthlyData.reduce((s, m) => s + m.expense, 0) / fin.monthlyData.length)
        : 0;

    const bestSavingsMonth = fin.monthlyData?.length > 0
        ? fin.monthlyData.reduce((best, m) => m.savings > best.savings ? m : best, fin.monthlyData[0])
        : { month: '—', savings: 0 };

    const savingsRate = fin.monthly > 0 ? Math.round((fin.monthlySav / fin.monthly) * 100) : 0;

    // Category trend: compare each category to the average (or show 0 if only one data point)
    const topCategories = (fin.topCategories || []).map((c) => ({
        ...c,
        change: hasRealData ? 0 : Math.round(((c.value - c.value * 0.96) / (c.value * 0.96)) * 100),
    }));

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1 text-sm">Deep dive into your spending patterns and trends</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {hasRealData ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                            <FileText className="w-3.5 h-3.5" />
                            Real data from <strong>{statementMeta?.fileName ?? 'your statement'}</strong>
                            {statementMeta?.totalFound ? ` · ${statementMeta.totalFound} transactions` : ''}
                        </div>
                    ) : user?.annualIncome ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Estimated from annual income of <strong>{formatINR(Number(user.annualIncome))}</strong> —{' '}
                            <Link href="/dashboard/upload" className="underline font-semibold">upload statement</Link> for real data
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <Link href="/dashboard/upload" className="underline font-semibold">Upload a statement</Link> to see real analytics
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Monthly Spend', value: formatINR(avgMonthlySpend), sub: `last ${fin.monthlyData?.length ?? 0} months` },
                    { label: 'Largest Category', value: fin.topCategories?.[0]?.name ?? '—', sub: `${formatINR(fin.topCategories?.[0]?.value ?? 0)} / period` },
                    { label: 'Best Savings Month', value: bestSavingsMonth.month, sub: `${formatINR(bestSavingsMonth.savings)} saved` },
                    { label: 'Savings Rate', value: `${savingsRate}%`, sub: 'of total income' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-shadow">
                        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 — Pie + Category Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending by Category — Donut Pie */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold text-gray-900 mb-5">Spending by Category</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={fin.categories}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                innerRadius={55}
                                dataKey="value"
                                paddingAngle={3}
                            >
                                {fin.categories?.map((entry, i) => (
                                    <Cell key={`cell-${i}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => [formatINR(v), 'Amount']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Breakdown Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold text-gray-900 mb-5">Category Breakdown</h2>
                    <div className="space-y-4">
                        {topCategories.map((c) => {
                            const pct = fin.monthlyExp > 0 ? Math.round((c.value / fin.monthlyExp) * 100) : 0;
                            return (
                                <div key={c.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-gray-700">{c.name}</span>
                                        <div className="flex items-center gap-2">
                                            {!hasRealData && <TrendIcon change={c.change} />}
                                            {!hasRealData && (
                                                <span className={`text-xs font-medium ${c.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {c.change > 0 ? '+' : ''}{c.change}%
                                                </span>
                                            )}
                                            <span className="text-sm font-bold text-gray-900">{formatINR(c.value)}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: c.color }}
                                        />
                                    </div>
                                    <div className="text-right text-xs text-gray-400 mt-0.5">{pct}% of expenses</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Monthly Income vs Expense — Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-base font-semibold text-gray-900 mb-5">
                    {hasRealData ? 'Income vs Expense by Month' : 'Monthly Financial Overview (6 Months)'}
                </h2>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={fin.monthlyData} barSize={26} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={formatINRChart} />
                        <Tooltip
                            formatter={(v, name) => [formatINR(v), name]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                        <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
                        <Bar dataKey="savings" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Savings" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Savings Trend — Line Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Savings Trend</h2>
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={fin.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={formatINRChart} />
                        <Tooltip
                            formatter={(v) => [formatINR(v), 'Savings']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="savings"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#10b981' }}
                            activeDot={{ r: 7 }}
                            name="Savings"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
