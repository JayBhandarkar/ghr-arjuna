'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sticky navbar always on top */}
      <div className="sticky top-0 z-50">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar — fixed positioning handled inside Sidebar component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area — offset for the sidebar width on desktop */}
        <main className="flex-1 lg:ml-64 transition-all duration-300 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
