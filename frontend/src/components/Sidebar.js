'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Upload, Receipt, BarChart3, Heart, Settings,
  ChevronLeft, ChevronRight, TrendingUp, LogOut, User
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & KPIs',
  },
  {
    name: 'Upload Statement',
    path: '/dashboard/upload',
    icon: Upload,
    description: 'Import bank data',
  },
  {
    name: 'Transactions',
    path: '/dashboard/transactions',
    icon: Receipt,
    description: 'All your activity',
  },
  {
    name: 'Analytics',
    path: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Spending insights',
  },
  {
    name: 'Financial Score',
    path: '/dashboard/score',
    icon: Heart,
    description: 'Your health rating',
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    description: 'Account & security',
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-40
          bg-white border-r border-gray-200 shadow-sm
          flex flex-col
          transition-all duration-300
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6
            bg-white border border-gray-200 rounded-full
            items-center justify-center shadow-md hover:shadow-lg
            transition-all z-10"
        >
          {isCollapsed
            ? <ChevronRight className="w-3 h-3 text-gray-600" />
            : <ChevronLeft className="w-3 h-3 text-gray-600" />}
        </button>

        {/* Header / Logo */}
        <div className="p-5 border-b border-gray-100 h-16 flex items-center shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md shrink-0">
              <TrendingUp className="text-white w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent leading-tight">
                  BankAI
                </h1>
                <p className="text-[10px] text-gray-400 leading-tight">Financial Intelligence</p>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {!isCollapsed && (
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
              Main Menu
            </h3>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                title={isCollapsed ? item.name : undefined}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-200
                  ${isCollapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className={`text-[11px] truncate ${isActive ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs
                    rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                    whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0
                      border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile + Sign Out */}
        <div className="p-3 border-t border-gray-100 space-y-1 shrink-0">
          {!isCollapsed && (
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Account
            </h3>
          )}

          <Link
            href="/dashboard/settings"
            onClick={onClose}
            title={isCollapsed ? 'Profile' : undefined}
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{user?.name || 'User'}</p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email || ''}</p>
              </div>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs
                rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Profile
              </div>
            )}
          </Link>

          <button
            onClick={logout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl
              text-red-500 hover:bg-red-50 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">Sign Out</p>
                <p className="text-[11px] text-red-400">End your session</p>
              </div>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs
                rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
