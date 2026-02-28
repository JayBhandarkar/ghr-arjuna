'use client';

import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';

function getScoreColor(s) {
    if (s >= 80) return { text: 'text-emerald-600', ring: '#10b981', label: 'Excellent', bg: 'bg-emerald-50 border-emerald-100' };
    if (s >= 60) return { text: 'text-yellow-500', ring: '#f59e0b', label: 'Good', bg: 'bg-yellow-50 border-yellow-100' };
    if (s >= 40) return { text: 'text-orange-500', ring: '#f97316', label: 'Fair', bg: 'bg-orange-50 border-orange-100' };
    return { text: 'text-red-500', ring: '#ef4444', label: 'Needs Work', bg: 'bg-red-50 border-red-100' };
}

export default function FinancialScorePage() {
    const { user } = useAuth();
    const fin = deriveFinancials(user?.annualIncome || mockData.kpis.totalIncome * 12);
    const score = fin.financialScore;
    const sc = getScoreColor(score);

    // ── Real computed metrics ──────────────────────────────────────────────────
    const savingsRate = fin.totalIncome > 0 ? Math.round((fin.netSavings / fin.totalIncome) * 100) : 0;
    const expenseRate = fin.totalIncome > 0 ? Math.round((fin.totalExpenses / fin.totalIncome) * 100) : 0;
    const topCategory = fin.topCategories[0];
    const entertainShop = (fin.categories.find(c => c.name === 'Entertainment')?.value ?? 0)
        + (fin.categories.find(c => c.name === 'Shopping')?.value ?? 0);
    const discretionaryPct = fin.totalIncome > 0 ? Math.round((entertainShop / fin.totalIncome) * 100) : 0;
    const monthlyIncome = fin.monthly;
    const monthlySavings = fin.monthlySav;

    // ── Metrics (only what we can actually calculate) ─────────────────────────
    const metrics = [
        {
            label: 'Savings Rate',
            value: `${savingsRate}%`,
            status: savingsRate >= 20 ? 'good' : 'warning',
            detail: savingsRate >= 20
                ? `Great! You're saving ${savingsRate}% — above the recommended 20%`
                : `You're saving ${savingsRate}%. Aim for at least 20% of income`,
        },
        {
            label: 'Expense Ratio',
            value: `${expenseRate}%`,
            status: expenseRate <= 75 ? 'good' : 'warning',
            detail: expenseRate <= 75
                ? `Expenses at ${expenseRate}% of income — healthy range`
                : `Expenses are ${expenseRate}% of income. Try to keep under 75%`,
        },
        {
            label: 'Discretionary Spend',
            value: `${discretionaryPct}%`,
            status: discretionaryPct <= 25 ? 'good' : 'warning',
            detail: discretionaryPct <= 25
                ? 'Shopping & Entertainment within recommended limits'
                : 'Non-essential spending is above 25% — consider trimming',
        },
        {
            label: 'Top Spending Category',
            value: topCategory?.name ?? '—',
            status: 'warning',
            detail: topCategory
                ? `$${topCategory.value?.toLocaleString()} this month (${Math.round((topCategory.value / fin.totalExpenses) * 100)}% of expenses)`
                : 'No data yet',
        },
        {
            label: 'Monthly Income',
            value: `$${monthlyIncome.toLocaleString()}`,
            status: 'good',
            detail: `Annual: $${Number(user?.annualIncome || monthlyIncome * 12).toLocaleString()}`,
        },
        {
            label: 'Monthly Savings',
            value: `$${monthlySavings.toLocaleString()}`,
            status: monthlySavings > 0 ? 'good' : 'warning',
            detail: monthlySavings > 0 ? 'Positive savings — building wealth' : 'No savings this month',
        },
    ];

    // ── Factor bars (derived only) ────────────────────────────────────────────
    const factors = [
        {
            label: 'Savings Consistency',
            score: Math.min(100, savingsRate * 4),
            weight: '35%',
            icon: TrendingUp,
            color: 'text-emerald-500',
        },
        {
            label: 'Spending Control',
            score: Math.max(0, 100 - expenseRate),
            weight: '40%',
            icon: TrendingDown,
            color: 'text-blue-500',
        },
        {
            label: 'Discretionary Discipline',
            score: Math.max(0, 100 - discretionaryPct * 3),
            weight: '25%',
            icon: Info,
            color: 'text-purple-500',
        },
    ];

    // ── Tips generated from real data ─────────────────────────────────────────
    const tips = [];
    if (savingsRate < 20) tips.push(`Boost your savings rate to 20%. You're currently at ${savingsRate}%.`);
    if (expenseRate > 75) tips.push(`Expenses are ${expenseRate}% of income. Look for subscriptions or dining costs to cut.`);
    if (discretionaryPct > 25) tips.push(`Shopping & Entertainment are ${discretionaryPct}% of income. A monthly budget cap can help.`);
    if (topCategory) tips.push(`"${topCategory.name}" is your biggest cost at $${topCategory.value?.toLocaleString()}/mo — explore ways to reduce it.`);
    if (savingsRate >= 20) tips.push('Excellent discipline! Consider channelling extra savings into an index fund or high-yield savings account.');
    if (monthlySavings > 0 && savingsRate >= 25)
        tips.push(`You saved $${monthlySavings.toLocaleString()} this month — you're on track for $${(monthlySavings * 12).toLocaleString()} this year.`);

    const circ = 2 * Math.PI * 80;
    const offset = circ - (score / 100) * circ;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Financial Score</h1>
                <p className="text-gray-500 mt-1 text-sm">Your personalised financial health rating</p>
                {user?.annualIncome > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Based on annual income of <strong>${Number(user.annualIncome).toLocaleString()}</strong>
                    </div>
                )}
            </div>

            {/* Score Hero */}
            <div className={`border rounded-2xl p-8 flex flex-col lg:flex-row items-center gap-10 ${sc.bg}`}>
                {/* Circular Progress */}
                <div className="flex flex-col items-center shrink-0">
                    <div className="relative w-52 h-52">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                            <circle
                                cx="100" cy="100" r="80"
                                stroke={sc.ring}
                                strokeWidth="14"
                                fill="none"
                                strokeDasharray={circ}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black ${sc.text}`}>{score}</span>
                            <span className="text-xs font-medium text-gray-400 mt-1">out of 100</span>
                        </div>
                    </div>
                    <span className={`mt-3 px-5 py-1.5 rounded-full text-sm font-bold ${sc.text} bg-white border border-gray-200`}>
                        {sc.label}
                    </span>
                </div>

                {/* Factor Bars */}
                <div className="flex-1 space-y-4 w-full">
                    <h2 className="text-lg font-bold text-gray-900">How your score is calculated</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Calculated from your savings rate, expense control, and discretionary spending habits.
                        A score above 75 is considered healthy.
                    </p>
                    <div className="space-y-4">
                        {factors.map((f) => {
                            const Icon = f.icon;
                            return (
                                <div key={f.label} className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${f.color} shrink-0`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{f.label}</span>
                                            <span className="text-xs text-gray-400">{f.weight} weight · {Math.round(f.score)}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.round(f.score)}%`, backgroundColor: sc.ring }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.map((m) => (
                        <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                            {m.status === 'good'
                                ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                : <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />}
                            <div>
                                <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">{m.label}</p>
                                <p className={`text-2xl font-black mt-1 ${m.status === 'good' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                                    {m.value}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">{m.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips — only shown if generated */}
            {tips.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">💡 Tips to Improve Your Score</h2>
                    <ul className="space-y-3">
                        {tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                                <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-gray-700">{tip}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
