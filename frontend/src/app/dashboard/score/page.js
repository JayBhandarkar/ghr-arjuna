'use client';

import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, Wallet, BarChart2, RefreshCcw, Layers, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useStatement } from '@/lib/StatementContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';
import { formatINR } from '@/lib/formatINR';

// ── Score label / colour helpers ─────────────────────────────────────────────
function getScoreStyle(s) {
    if (s >= 80) return { text: 'text-emerald-600', ring: '#10b981', label: 'Excellent', bg: 'bg-emerald-50  border-emerald-100' };
    if (s >= 60) return { text: 'text-blue-600', ring: '#3b82f6', label: 'Good', bg: 'bg-blue-50    border-blue-100' };
    if (s >= 40) return { text: 'text-yellow-500', ring: '#f59e0b', label: 'Fair', bg: 'bg-yellow-50  border-yellow-100' };
    return { text: 'text-red-500', ring: '#ef4444', label: 'Needs Work', bg: 'bg-red-50     border-red-100' };
}

/** Build a mock scoreBreakdown from deriveFinancials output (no real statement). */
function mockBreakdown(fin) {
    const income = fin.totalIncome || 1;
    const savingsRatio = Math.max(0, fin.netSavings / income);
    const expenseRatio = Math.min(1, fin.totalExpenses / income);
    const emiRatio = Math.min(1, (fin.categories?.find(c => c.name === 'EMI')?.value ?? 0) / income);
    const investRatio = Math.min(1, (fin.categories?.find(c => c.name === 'Investment')?.value ?? 0) / income);
    const subRatio = Math.min(1, (fin.categories?.find(c => c.name === 'Entertainment')?.value ?? 0) / income);

    const savingsScore = savingsRatio >= 0.30 ? 25 : savingsRatio >= 0.20 ? 20 : savingsRatio >= 0.10 ? 13 : savingsRatio > 0 ? 6 : 0;
    const expenseScore = expenseRatio <= 0.50 ? 20 : expenseRatio <= 0.65 ? 15 : expenseRatio <= 0.75 ? 10 : expenseRatio <= 0.90 ? 5 : 0;
    const emiScore = emiRatio === 0 ? 20 : emiRatio <= 0.30 ? 16 : emiRatio <= 0.40 ? 10 : emiRatio <= 0.50 ? 5 : 0;
    const investScore = investRatio >= 0.20 ? 15 : investRatio >= 0.10 ? 12 : investRatio >= 0.05 ? 8 : investRatio > 0 ? 4 : 0;
    const subScore = subRatio <= 0.05 ? 10 : subRatio <= 0.10 ? 7 : subRatio <= 0.15 ? 4 : 0;
    const stabilityScore = 5; // neutral — no monthly data in mock

    return {
        savings: { score: savingsScore, max: 25, ratio: Math.round(savingsRatio * 100) },
        expense: { score: expenseScore, max: 20, ratio: Math.round(expenseRatio * 100) },
        emi: { score: emiScore, max: 20, ratio: Math.round(emiRatio * 100) },
        investment: { score: investScore, max: 15, ratio: Math.round(investRatio * 100) },
        subscription: { score: subScore, max: 10, ratio: Math.round(subRatio * 100) },
        stability: { score: stabilityScore, max: 10 },
    };
}

// ── Component bar definition ─────────────────────────────────────────────────
const COMPONENTS = [
    {
        key: 'savings',
        label: 'Savings Score',
        max: 25,
        icon: Wallet,
        color: 'emerald',
        barColor: '#10b981',
        ratioLabel: 'Savings ratio',
        tip: (r, s) => r >= 30 ? `Great! You save ${r}% of income.` : r >= 20 ? `Good savings at ${r}%. Push to 30% for full points.` : `Savings ratio is ${r}%. Aim for ≥20%.`,
    },
    {
        key: 'expense',
        label: 'Expense Score',
        max: 20,
        icon: TrendingDown,
        color: 'blue',
        barColor: '#3b82f6',
        ratioLabel: 'Expense ratio',
        tip: (r, s) => r <= 50 ? `Excellent! Expenses are only ${r}% of income.` : r <= 75 ? `Expenses at ${r}% — try to stay below 65%.` : `Expenses are ${r}% of income — consider reducing discretionary spending.`,
    },
    {
        key: 'emi',
        label: 'EMI Score',
        max: 20,
        icon: Layers,
        color: 'teal',
        barColor: '#14b8a6',
        ratioLabel: 'EMI-to-income ratio',
        tip: (r, s) => r === 0 ? 'No EMI — great financial flexibility!' : r <= 30 ? `EMI is ${r}% of income — manageable.` : `EMI is ${r}% of income. Try to keep it under 30%.`,
    },
    {
        key: 'investment',
        label: 'Investment Score',
        max: 15,
        icon: BarChart2,
        color: 'purple',
        barColor: '#8b5cf6',
        ratioLabel: 'Investment ratio',
        tip: (r, s) => r >= 20 ? `Excellent! Investing ${r}% — on track for long-term wealth.` : r >= 10 ? `Investing ${r}% — try to reach 20% for full points.` : r > 0 ? `Only ${r}% in investments. Start increasing your SIPs.` : 'No investments detected. Consider starting a SIP.',
    },
    {
        key: 'subscription',
        label: 'Subscription Score',
        max: 10,
        icon: RefreshCcw,
        color: 'pink',
        barColor: '#ec4899',
        ratioLabel: 'Subscription ratio',
        tip: (r, s) => r <= 5 ? `Subscriptions are ${r}% — minimal and healthy.` : r <= 10 ? `Subscriptions at ${r}%. Review unused services.` : `Subscriptions are ${r}% of income — audit and cancel unused ones.`,
    },
    {
        key: 'stability',
        label: 'Stability Score',
        max: 10,
        icon: TrendingUp,
        color: 'orange',
        barColor: '#f97316',
        ratioLabel: 'Monthly variance',
        tip: (r, s) => s >= 10 ? 'Monthly spending is very consistent — great financial discipline!' : s >= 7 ? 'Spending is slightly variable — keep working on consistency.' : 'High monthly spending variance detected — try to maintain a regular budget.',
    },
];

const COLOR_VARIANTS = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
};

export default function FinancialScorePage() {
    const { user } = useAuth();
    const { hasRealData, computed: realFin, statementMeta } = useStatement();

    const mockFin = deriveFinancials(user?.annualIncome || mockData.kpis.totalIncome * 12);
    const fin = hasRealData ? realFin : mockFin;

    const score = fin.financialScore;
    const sc = getScoreStyle(score);
    const bd = hasRealData ? (fin.scoreBreakdown || mockBreakdown(fin)) : mockBreakdown(fin);

    const circ = 2 * Math.PI * 80;
    const offset = circ - (score / 100) * circ;

    // ── Key totals ─────────────────────────────────────────────────────────────
    const savingsRate = fin.totalIncome > 0 ? Math.round((fin.netSavings / fin.totalIncome) * 100) : 0;
    const expenseRate = fin.totalIncome > 0 ? Math.round((fin.totalExpenses / fin.totalIncome) * 100) : 0;
    const topCategory = fin.topCategories?.[0];

    // ── Improvement tips ──────────────────────────────────────────────────────
    const tips = [];
    if (bd.savings.ratio < 20) tips.push({ icon: '💰', text: `Boost your savings rate to 20%. You're at ${bd.savings.ratio}% now.` });
    if (bd.expense.ratio > 75) tips.push({ icon: '✂️', text: `Expenses at ${bd.expense.ratio}% of income. Cut subscriptions or dining.` });
    if (bd.emi.ratio > 30) tips.push({ icon: '🏠', text: `EMI is ${bd.emi.ratio}% of income — above the 30% safe threshold.` });
    if (bd.investment.ratio < 10) tips.push({ icon: '📈', text: `Invest more! Currently at ${bd.investment.ratio}% — target 10–20%.` });
    if (bd.subscription.ratio > 10) tips.push({ icon: '📺', text: `Subscriptions are ${bd.subscription.ratio}% of income. Audit unused services.` });
    if (bd.stability.score < 7) tips.push({ icon: '📊', text: 'High spending variance across months. Try setting a fixed monthly budget.' });
    if (tips.length === 0)
        tips.push({ icon: '🎉', text: 'Excellent financial health! Keep up your savings and investment habits.' });

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">Financial Health Score</h1>
                <p className="text-gray-500 mt-1 text-sm">6-component score out of 100, computed from your real transactions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {hasRealData ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                            <FileText className="w-3.5 h-3.5" />
                            Computed from <strong>{statementMeta?.fileName ?? 'your statement'}</strong>
                            {statementMeta?.totalFound ? ` · ${statementMeta.totalFound} transactions` : ''}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Estimated — <Link href="/dashboard/upload" className="underline font-semibold">upload a statement</Link> for your real score
                        </span>
                    )}
                </div>
            </div>

            {/* ── Score Hero ── */}
            <div className={`border rounded-2xl p-8 flex flex-col lg:flex-row items-center gap-10 ${sc.bg}`}>
                {/* Circular gauge */}
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
                                style={{ transition: 'stroke-dashoffset 1.4s ease' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black ${sc.text}`}>{score}</span>
                            <span className="text-xs font-medium text-gray-400 mt-1">out of 100</span>
                        </div>
                    </div>
                    <span className={`mt-3 px-5 py-1.5 rounded-full text-sm font-bold ${sc.text} bg-white border border-gray-200 shadow-sm`}>
                        {sc.label}
                    </span>
                    {/* component total chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                        {COMPONENTS.map(c => {
                            const v = COLOR_VARIANTS[c.color];
                            return (
                                <span key={c.key} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.badge}`}>
                                    {bd[c.key].score}/{c.max}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Component bars */}
                <div className="flex-1 w-full space-y-3">
                    <h2 className="text-lg font-bold text-gray-900">Score Breakdown</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Each component is scored independently. A score above 75 is considered healthy.
                    </p>
                    {COMPONENTS.map(comp => {
                        const data = bd[comp.key];
                        const pct = Math.round((data.score / comp.max) * 100);
                        const Icon = comp.icon;
                        const v = COLOR_VARIANTS[comp.color];
                        return (
                            <div key={comp.key} className={`rounded-xl border p-3 ${v.bg} ${v.border}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${v.text}`} />
                                        <span className={`text-sm font-semibold ${v.text}`}>{comp.label}</span>
                                        {'ratio' in data && (
                                            <span className="text-xs text-gray-400 ml-1">{comp.ratioLabel}: {data.ratio}%</span>
                                        )}
                                    </div>
                                    <span className={`text-sm font-bold ${v.text}`}>{data.score} / {comp.max}</span>
                                </div>
                                <div className="w-full bg-white/60 rounded-full h-2.5">
                                    <div
                                        className="h-2.5 rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: comp.barColor }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Formula Reference ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">📐 Scoring Formula</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { label: 'Savings Score', max: 25, formula: '(Income − Expenses) ÷ Income' },
                        { label: 'Expense Score', max: 20, formula: 'Total Expenses ÷ Income' },
                        { label: 'EMI Score', max: 20, formula: 'Total EMI ÷ Income' },
                        { label: 'Investment Score', max: 15, formula: 'Investments ÷ Income' },
                        { label: 'Subscription Score', max: 10, formula: 'Recurring expenses ÷ Income' },
                        { label: 'Stability Score', max: 10, formula: 'Variance of monthly spending' },
                    ].map(row => (
                        <div key={row.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="shrink-0 w-8 h-8 bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center">
                                {row.max}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{row.formula}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Key Metrics ── */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Total Income',
                            value: formatINR(fin.totalIncome),
                            detail: hasRealData ? 'From statement credits' : 'Estimated from annual income',
                            good: true,
                        },
                        {
                            label: 'Total Expenses',
                            value: formatINR(fin.totalExpenses),
                            detail: `${expenseRate}% of income`,
                            good: expenseRate <= 75,
                        },
                        {
                            label: 'Net Savings',
                            value: formatINR(fin.netSavings),
                            detail: `${savingsRate}% savings rate`,
                            good: savingsRate >= 20,
                        },
                        {
                            label: 'EMI Burden',
                            value: `${bd.emi.ratio}%`,
                            detail: bd.emi.ratio === 0 ? 'No EMIs detected' : `${formatINR(Math.round(fin.totalIncome * bd.emi.ratio / 100))} EMI/month`,
                            good: bd.emi.ratio <= 30,
                        },
                        {
                            label: 'Investment Rate',
                            value: `${bd.investment.ratio}%`,
                            detail: bd.investment.ratio > 0 ? `${formatINR(Math.round(fin.totalIncome * bd.investment.ratio / 100))} invested` : 'No investments detected',
                            good: bd.investment.ratio >= 10,
                        },
                        {
                            label: 'Top Expense',
                            value: topCategory?.name ?? '—',
                            detail: topCategory ? `${formatINR(topCategory.value)} · ${Math.round((topCategory.value / fin.totalExpenses) * 100)}% of expenses` : 'No data',
                            good: false,
                        },
                    ].map(m => (
                        <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
                            {m.good
                                ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                : <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />}
                            <div>
                                <p className="font-semibold text-gray-500 text-xs uppercase tracking-wide">{m.label}</p>
                                <p className={`text-2xl font-black mt-1 ${m.good ? 'text-emerald-600' : 'text-yellow-600'}`}>{m.value}</p>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">{m.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Personalised Tips ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">💡 Personalised Tips</h2>
                <ul className="space-y-3">
                    {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <span className="text-xl shrink-0">{tip.icon}</span>
                            <p className="text-sm text-gray-700">{tip.text}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
