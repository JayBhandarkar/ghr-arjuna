'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, User, Search, Shield, TrendingUp, ChevronDown,
  Settings, LogOut, LayoutDashboard, Receipt, BarChart3,
  Heart, Upload, X, ArrowRight, Clock
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { deriveFinancials } from '@/lib/deriveFinancials';
import { mockData } from '@/data/mockData';
import { formatINR } from '@/lib/formatINR';

/* ─── Searchable destinations ─── */
const PAGES = [
  { label: 'Dashboard', desc: 'Overview & KPIs', href: '/dashboard', icon: LayoutDashboard, keywords: ['dashboard', 'home', 'overview', 'kpi', 'summary'] },
  { label: 'Transactions', desc: 'All your activity', href: '/dashboard/transactions', icon: Receipt, keywords: ['transactions', 'history', 'payments', 'activity', 'spending', 'debit', 'credit'] },
  { label: 'Analytics', desc: 'Spending insights', href: '/dashboard/analytics', icon: BarChart3, keywords: ['analytics', 'charts', 'insights', 'trends', 'spending', 'category', 'breakdown'] },
  { label: 'Financial Score', desc: 'Your health rating', href: '/dashboard/score', icon: Heart, keywords: ['score', 'financial', 'health', 'rating', 'credit', 'wellness'] },
  { label: 'Settings', desc: 'Account & security', href: '/dashboard/settings', icon: Settings, keywords: ['settings', 'profile', 'account', 'password', 'security', 'notifications', 'email'] },
  { label: 'Upload Statement', desc: 'Import bank data', href: '/dashboard/upload', icon: Upload, keywords: ['upload', 'import', 'statement', 'bank', 'pdf', 'file'] },
];

function filterPages(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return PAGES.filter(p =>
    p.label.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.keywords.some(k => k.includes(q))
  );
}

function filterTransactions(query) {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];
  return mockData.transactions.filter(t =>
    t.merchant.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q)
  ).slice(0, 4);
}

/* ─── Notification data ─── */
const NOTIFICATIONS = [
  { id: 1, text: 'Your financial score improved by 3 points!', time: '2m ago', unread: true },
  { id: 2, text: 'New transaction detected: Amazon $89.99', time: '1h ago', unread: true },
  { id: 3, text: 'Monthly report for January is ready', time: '3h ago', unread: false },
];

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  /* ── Compute results ── */
  const pageResults = filterPages(query);
  const txResults = filterTransactions(query);
  const hasResults = pageResults.length > 0 || txResults.length > 0;

  /* Flat list for keyboard nav */
  const allResults = [
    ...pageResults.map(r => ({ ...r, _type: 'page' })),
    ...txResults.map(r => ({ ...r, _type: 'tx', label: r.merchant, desc: r.category, href: `/dashboard/transactions?q=${encodeURIComponent(r.merchant)}` })),
  ];

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSearchOpen(false);
        setActiveIdx(-1);
      }
      if (showNotifications && !e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) {
        setShowNotifications(false);
      }
      if (showProfile && !e.target.closest('#profile-panel') && !e.target.closest('#profile-btn')) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications, showProfile]);

  /* ── Keyboard navigation ── */
  const handleKeyDown = (e) => {
    if (!searchOpen || !hasResults) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && allResults[activeIdx]) {
        navigate(allResults[activeIdx].href);
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setQuery('');
      setActiveIdx(-1);
      inputRef.current?.blur();
    }
  };

  const navigate = useCallback((href) => {
    setSearchOpen(false);
    setQuery('');
    setActiveIdx(-1);
    router.push(href);
  }, [router]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSearchOpen(val.trim().length > 0);
    setActiveIdx(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchOpen(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo + mobile menu */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                BankAI
              </span>
            </Link>
          </div>

          {/* ── SEARCH BAR ── */}
          <div ref={dropdownRef} className="flex-1 max-w-xl relative">
            <div className={`relative flex items-center transition-all duration-200 ${searchOpen ? 'ring-2 ring-emerald-400' : ''} rounded-xl`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${searchOpen ? 'text-emerald-500' : 'text-gray-400'}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => query.trim() && setSearchOpen(true)}
                placeholder="Search transactions, analytics, settings…"
                className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                  focus:outline-none focus:bg-white focus:border-emerald-300
                  text-sm text-gray-900 placeholder-gray-400 transition-all"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Dropdown Results ── */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[420px] overflow-y-auto">

                {!hasResults && query.trim().length > 0 && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No results for &quot;<span className="font-medium text-gray-600">{query}</span>&quot;
                  </div>
                )}

                {/* Pages section */}
                {pageResults.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pages</p>
                    </div>
                    {pageResults.map((item, i) => {
                      const Icon = item.icon;
                      const isActive = activeIdx === i;
                      return (
                        <button
                          key={item.href}
                          onClick={() => navigate(item.href)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{item.label}</p>
                            <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                          </div>
                          <ArrowRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-gray-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Transactions section */}
                {txResults.length > 0 && (
                  <div className={pageResults.length > 0 ? 'border-t border-gray-100' : ''}>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transactions</p>
                    </div>
                    {txResults.map((tx, i) => {
                      const globalIdx = pageResults.length + i;
                      const isActive = activeIdx === globalIdx;
                      return (
                        <button
                          key={tx.id}
                          onClick={() => navigate(`/dashboard/transactions?q=${encodeURIComponent(tx.merchant)}`)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                            <Receipt className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{tx.merchant}</p>
                            <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatINR(Math.abs(tx.amount))}
                          </span>
                        </button>
                      );
                    })}
                    {/* View all transactions shortcut */}
                    <button
                      onClick={() => navigate('/dashboard/transactions')}
                      className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 border-t border-gray-50 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                      View all transactions
                    </button>
                  </div>
                )}

                {/* If results exist — keyboard hint */}
                {hasResults && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
                    <span>↑↓ Navigate</span>
                    <span>↵ Open</span>
                    <span>Esc Close</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status badges — desktop only */}
            <div className="hidden lg:flex items-center gap-4 mr-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notif-btn"
                onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>

              {showNotifications && (
                <div id="notif-panel" className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    <span className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-emerald-50/40' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-emerald-500' : 'bg-transparent'}`} />
                          <div>
                            <p className="text-sm text-gray-700">{n.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{n.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                id="profile-btn"
                onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Premium</p>
                </div>
                <ChevronDown className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
              </button>

              {showProfile && (
                <div id="profile-panel" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left text-sm"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
