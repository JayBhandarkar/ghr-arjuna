'use client';

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { formatINR, formatINRChart } from '@/lib/formatINR';

const EMERALD_PALETTE = [
  '#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444',
  '#14b8a6', '#6366f1', '#f97316', '#22c55e',
];

export function ExpensePieChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Expense Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={EMERALD_PALETTE[i % EMERALD_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [formatINR(v), 'Amount']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Monthly Expense Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={formatINRChart} />
          <Tooltip
            formatter={(v) => [formatINR(v), 'Expenses']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeVsExpenseChart({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Income vs Expense</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barSize={28} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={formatINRChart} />
          <Tooltip
            formatter={(v, name) => [formatINR(v), name.charAt(0).toUpperCase() + name.slice(1)]}
            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
          <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expense" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
