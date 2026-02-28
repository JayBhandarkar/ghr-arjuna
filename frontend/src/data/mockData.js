export const mockData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  
  kpis: {
    totalIncome: 12500.00,
    totalExpenses: 8750.50,
    savings: 3749.50,
    financialScore: 78,
  },
  
  categoryData: [
    { name: 'Food & Dining', value: 2500, color: '#3b82f6' },
    { name: 'Transportation', value: 1200, color: '#8b5cf6' },
    { name: 'Shopping', value: 1800, color: '#ec4899' },
    { name: 'Bills & Utilities', value: 1500, color: '#f59e0b' },
    { name: 'Entertainment', value: 950, color: '#10b981' },
    { name: 'Healthcare', value: 800, color: '#ef4444' },
  ],
  
  monthlyTrend: [
    { month: 'Jan', expenses: 7200 },
    { month: 'Feb', expenses: 7800 },
    { month: 'Mar', expenses: 8200 },
    { month: 'Apr', expenses: 7500 },
    { month: 'May', expenses: 8750 },
    { month: 'Jun', expenses: 8100 },
  ],
  
  incomeVsExpense: [
    { month: 'Jan', income: 12000, expense: 7200 },
    { month: 'Feb', income: 12000, expense: 7800 },
    { month: 'Mar', income: 12500, expense: 8200 },
    { month: 'Apr', income: 12500, expense: 7500 },
    { month: 'May', income: 12500, expense: 8750 },
    { month: 'Jun', income: 13000, expense: 8100 },
  ],
  
  recurringPayments: [
    { merchant: 'Netflix', amount: 15.99, frequency: 'Monthly' },
    { merchant: 'Spotify', amount: 9.99, frequency: 'Monthly' },
    { merchant: 'Amazon Prime', amount: 14.99, frequency: 'Monthly' },
    { merchant: 'Gym Membership', amount: 49.99, frequency: 'Monthly' },
  ],
  
  transactions: [
    { id: 1, date: '2024-01-15', merchant: 'Whole Foods', category: 'Food & Dining', amount: -125.50, type: 'debit' },
    { id: 2, date: '2024-01-14', merchant: 'Salary Deposit', category: 'Income', amount: 3000.00, type: 'credit' },
    { id: 3, date: '2024-01-13', merchant: 'Uber', category: 'Transportation', amount: -25.00, type: 'debit' },
    { id: 4, date: '2024-01-12', merchant: 'Amazon', category: 'Shopping', amount: -89.99, type: 'debit' },
    { id: 5, date: '2024-01-11', merchant: 'Starbucks', category: 'Food & Dining', amount: -12.50, type: 'debit' },
  ],
  
  aiInsights: {
    summary: 'Your spending is 15% higher than last month. Consider reducing dining expenses by $200 to meet your savings goal. You\'re on track to save $3,750 this month.',
    highlights: [
      { label: 'Top Category', value: 'Food & Dining ($2,500)' },
      { label: 'Savings Rate', value: '30%' },
      { label: 'Budget Status', value: 'On Track' },
    ]
  }
};
