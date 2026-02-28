'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Download, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';

const CATEGORY_COLORS = {
  'Food & Dining': 'bg-orange-100 text-orange-700',
  'Income': 'bg-emerald-100 text-emerald-700',
  'Transportation': 'bg-blue-100   text-blue-700',
  'Shopping': 'bg-pink-100   text-pink-700',
  'Entertainment': 'bg-purple-100 text-purple-700',
  'Healthcare': 'bg-red-100    text-red-700',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-700',
  'Health & Fitness': 'bg-teal-100   text-teal-700',
};

/* Inner component that uses useSearchParams — wrapped in Suspense below */
function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const urlQuery = searchParams.get('q') || '';

  const [search, setSearch] = useState(urlQuery);
  const [filter, setFilter] = useState('all');

  // Derive income-based transactions
  const fin = deriveFinancials(user?.annualIncome || mockData.kpis.totalIncome * 12);
  const allTransactions = fin.transactions;

  // Sync with URL param whenever it changes (e.g. new search from navbar)
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const clearSearch = () => {
    setSearch('');
    router.replace('/dashboard/transactions');
  };

  const filtered = allTransactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.merchant.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    const matchesFilter = filter === 'all' || t.type === filter;
    return matchesSearch && matchesFilter;
  });

  const totalCredit = allTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = allTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance = totalCredit - totalDebit;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1 text-sm">Track and review all your financial activity</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors self-start sm:self-auto">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
            <ArrowUpRight className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-emerald-600">+${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-xl shrink-0">
            <ArrowDownRight className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">-${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className={`p-3 rounded-xl shrink-0 ${netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <Filter className={`w-6 h-6 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Net Balance</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* "Came from global search" banner */}
      {urlQuery && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700">
            <Search className="w-4 h-4 shrink-0" />
            <span>Filtered from search: <strong>&quot;{urlQuery}&quot;</strong></span>
          </div>
          <button
            onClick={clearSearch}
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear filter
          </button>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search merchant or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-sm text-gray-900 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Type filters */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'credit', label: '↑ Income' },
              { key: 'debit', label: '↓ Expense' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${filter === f.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Merchant</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No transactions match &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="py-4 px-4 text-gray-400 whitespace-nowrap">{t.date}</td>
                    <td className="py-4 px-4 font-semibold text-gray-900">{t.merchant}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-lg ${CATEGORY_COLORS[t.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${t.type === 'credit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                        }`}>
                        {t.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {t.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 text-right">
          {filtered.length} of {allTransactions.length} transaction{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

/* Wrap in Suspense because useSearchParams() needs it in App Router */
export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm p-8">Loading transactions…</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
