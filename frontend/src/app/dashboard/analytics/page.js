'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';

function TrendIcon({ change }) {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const fin = deriveFinancials(user?.annualIncome || mockData.kpis.totalIncome * 12);

    // Month-over-month change for top categories (vs previous month at 96% variation)
    const prevMonthExp = fin.monthlyExp * 0.96;
    const topCategories = fin.topCategories.map((c) => ({
        ...c,
        change: Math.round(((c.value - c.value * 0.96) / (c.value * 0.96)) * 100),
    }));

    const avgMonthlySpend = Math.round(
        fin.monthlyData.reduce((s, m) => s + m.expense, 0) / fin.monthlyData.length
    );
    const bestSavingsMonth = fin.monthlyData.reduce((best, m) =>
        m.savings > best.savings ? m : best
        , fin.monthlyData[0]);
    const savingsRate = Math.round((fin.monthlySav / fin.monthly) * 100);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1 text-sm">Deep dive into your spending patterns and trends</p>
                {user?.annualIncome && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Based on your annual income of <strong>${Number(user.annualIncome).toLocaleString()}</strong>
                    </div>
                )}
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Monthly Spend', value: `$${avgMonthlySpend.toLocaleString()}`, sub: 'last 6 months' },
                    { label: 'Largest Category', value: fin.topCategories[0]?.name ?? '—', sub: `$${fin.topCategories[0]?.value?.toLocaleString()} / mo` },
                    { label: 'Best Savings Month', value: bestSavingsMonth.month, sub: `$${bestSavingsMonth.savings.toLocaleString()} saved` },
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
                                {fin.categories.map((entry, i) => (
                                    <Cell key={`cell-${i}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Breakdown Table */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-base font-semibold text-gray-900 mb-5">Category Breakdown</h2>
                    <div className="space-y-4">
                        {topCategories.map((c) => {
                            const pct = Math.round((c.value / fin.monthlyExp) * 100);
                            return (
                                <div key={c.name}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-gray-700">{c.name}</span>
                                        <div className="flex items-center gap-2">
                                            <TrendIcon change={c.change} />
                                            <span className={`text-xs font-medium ${c.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {c.change > 0 ? '+' : ''}{c.change}%
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">${c.value.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: c.color }}
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
                <h2 className="text-base font-semibold text-gray-900 mb-5">Monthly Financial Overview (6 Months)</h2>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={fin.monthlyData} barSize={26} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(v) => `$${v.toLocaleString()}`}
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
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                        <Tooltip
                            formatter={(v) => `$${v.toLocaleString()}`}
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

            {/* Income vs Expense Line */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-base font-semibold text-gray-900 mb-5">Income vs Expense</h2>
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={fin.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                        <Tooltip
                            formatter={(v) => `$${v.toLocaleString()}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Income" />
                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Expenses" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
