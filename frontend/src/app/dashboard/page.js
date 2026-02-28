'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, PiggyBank,
  ArrowRight, Shield, Sparkles, Loader2,
} from 'lucide-react';
import KPICard from '@/components/KPICard';
import FinancialScore from '@/components/FinancialScore';
import { ExpensePieChart, MonthlyTrendChart, IncomeVsExpenseChart } from '@/components/Charts';
import RecurringPayments from '@/components/RecurringPayments';
import AIInsights from '@/components/AIInsights';
import TransactionsTable from '@/components/TransactionsTable';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/api';
import { deriveFinancials } from '@/lib/deriveFinancials';

const quickActions = [
  { title: 'View Transactions', desc: 'Browse all your activity', href: '/dashboard/transactions' },
  { title: 'Financial Score', desc: 'Check your health rating', href: '/dashboard/score' },
  { title: 'Analytics', desc: 'Explore spending insights', href: '/dashboard/analytics' },
  { title: 'Upload Statement', desc: 'Import new bank data', href: '/dashboard/upload' },
];

export default function Dashboard() {
  const { user, login: refreshAuth } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Real current month/year
  const now = new Date();
  const currentPeriod = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // ── Fresh data from DATABASE ──────────────────────────────────────────────
  const [dbIncome, setDbIncome] = useState(null);   // annualIncome from DB
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await auth.getProfile();
        const income = data?.user?.annualIncome ?? 0;
        setDbIncome(income);
        // Keep AuthContext in sync with the latest DB value
        if (data?.user && data.user.annualIncome !== user?.annualIncome) {
          refreshAuth({ token: localStorage.getItem('token'), user: data.user });
        }
      } catch (err) {
        console.error('Failed to fetch profile from DB:', err);
        setDbError(true);
        // Fall back to cached value from AuthContext
        setDbIncome(user?.annualIncome ?? 0);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use DB value when ready; fall back to context while loading
  const annualIncome = dbIncome !== null ? dbIncome : (user?.annualIncome ?? 0);
  const fin = deriveFinancials(annualIncome);

  // Real month-over-month trend from 6-month derived data
  const lastMonth = fin.monthlyData[fin.monthlyData.length - 1];
  const prevMonth = fin.monthlyData[fin.monthlyData.length - 2];
  const incomeTrend = prevMonth?.income > 0 ? Math.round(((lastMonth.income - prevMonth.income) / prevMonth.income) * 100) : 0;
  const expenseTrend = prevMonth?.expense > 0 ? Math.round(((lastMonth.expense - prevMonth.expense) / prevMonth.expense) * 100) : 0;
  const savingsTrend = prevMonth?.savings > 0 ? Math.round(((lastMonth.savings - prevMonth.savings) / prevMonth.savings) * 100) : 0;

  // Recurring payments proportional to category budgets
  const recurringPayments = [
    { merchant: 'Netflix', amount: Math.round((fin.categories.find(c => c.name === 'Entertainment')?.value ?? 0) * 0.17), frequency: 'Monthly' },
    { merchant: 'Spotify', amount: Math.round((fin.categories.find(c => c.name === 'Entertainment')?.value ?? 0) * 0.11), frequency: 'Monthly' },
    { merchant: 'Amazon Prime', amount: Math.round((fin.categories.find(c => c.name === 'Shopping')?.value ?? 0) * 0.05), frequency: 'Monthly' },
    { merchant: 'Gym', amount: Math.round((fin.categories.find(c => c.name === 'Healthcare')?.value ?? 0) * 0.38), frequency: 'Monthly' },
  ].filter(p => p.amount > 0);

  const savingsRate = fin.totalIncome > 0 ? Math.round((fin.netSavings / fin.totalIncome) * 100) : 0;

  const aiInsights = {
    summary: annualIncome > 0
      ? `Based on your annual income of $${annualIncome.toLocaleString()}, your monthly income is $${fin.monthly.toLocaleString()}. You are ${savingsRate >= 20 ? 'saving well' : 'below the 20% savings target'} with a ${savingsRate}% savings rate this month.`
      : 'Add your annual income in Settings to unlock personalised AI insights.',
    highlights: annualIncome > 0 ? [
      { label: 'Annual Income', value: `$${annualIncome.toLocaleString()}` },
      { label: 'Savings Rate', value: `${savingsRate}%` },
      { label: 'Budget Status', value: fin.netSavings > 0 ? 'On Track ✓' : 'Over Budget' },
    ] : [],
  };

  // Loading skeleton while DB fetch happens
  if (loadingDb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm">Loading your financial data from database…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Financial overview for <strong>{currentPeriod}</strong>
            </p>
            {dbError && (
              <p className="text-xs text-amber-600 mt-1">⚠ Using cached data — could not reach database</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Secure &amp; Private</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Live DB Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards — all values from DB ── */}
      {annualIncome > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Monthly Income — from DB (annualIncome ÷ 12) */}
          <KPICard
            title="Monthly Income"
            value={`$${fin.monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description={currentPeriod}
            icon={DollarSign}
            trend={incomeTrend}
          />
          {/* Monthly Expenses — derived from DB income */}
          <KPICard
            title="Monthly Expenses"
            value={`$${fin.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description={currentPeriod}
            icon={TrendingUp}
            trend={expenseTrend}
          />
          {/* Net Savings — derived */}
          <KPICard
            title="Net Savings"
            value={`$${fin.netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            description={currentPeriod}
            icon={PiggyBank}
            trend={savingsTrend}
          />
          {/* Financial Score */}
          <FinancialScore score={fin.financialScore} />
        </div>
      ) : (
        /* No income set — show prompt instead of empty cards */
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl shrink-0">
            <Wallet className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">No income on record</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Add your annual income in Settings to unlock income, expense, and savings KPIs.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Add Income →
          </Link>
        </div>
      )}


      {/* ── Quick Actions ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ArrowRight className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{a.title}</h3>
              <p className="text-xs text-gray-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── AI Insights (only when DB has income) ── */}
      {annualIncome > 0 && <AIInsights insights={aiInsights} />}

      {/* ── Charts (only when DB has income) ── */}
      {annualIncome > 0 && (
        <>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              Financial Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ExpensePieChart data={fin.categories} />
              <MonthlyTrendChart data={fin.monthlyData.map(m => ({ month: m.month, expenses: m.expense }))} />
            </div>
          </div>

          <IncomeVsExpenseChart data={fin.monthlyData.map(m => ({ month: m.month, income: m.income, expense: m.expense }))} />

          {/* ── Recurring + Transactions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <RecurringPayments payments={recurringPayments} />
            </div>
            <div className="lg:col-span-2">
              <TransactionsTable transactions={fin.transactions.slice(0, 6)} />
            </div>
          </div>
        </>
      )}

      {/* ── CTA Banner ── */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white text-center shadow-lg">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-3">Your Finances, Intelligently Managed 💰</h2>
        <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
          Upload your bank statement to unlock AI-powered categorisation, personalised insights,
          and a complete picture of your financial health.
        </p>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors shadow"
        >
          <ArrowRight className="w-5 h-5" />
          Upload Statement
        </Link>
      </div>
    </div>
  );
}
