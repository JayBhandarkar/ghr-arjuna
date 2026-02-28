/**
 * deriveFinancials(annualIncome)
 *
 * Given a user's annual income, generates realistic monthly financial figures
 * that are used across the dashboard, analytics, and transactions pages.
 *
 * Rationale:
 *   - Monthly income  = annualIncome / 12
 *   - Expenses        ≈ 70% of monthly income (realistic average)
 *   - Savings         = income - expenses
 *   - Category spend  split based on typical household percentages
 */

export function deriveFinancials(annualIncome = 0) {
    // Default to $60,000/yr if user skipped income entry
    const income = annualIncome && annualIncome > 0 ? annualIncome : 60000;
    const monthly = Math.round(income / 12);
    const expenseRate = 0.70;                           // spend 70% of income
    const monthlyExp = Math.round(monthly * expenseRate);
    const monthlySav = monthly - monthlyExp;

    // ── Category breakdown (% of monthly expenses) ──
    const categories = [
        { name: 'Food & Dining', pct: 0.29, color: '#f97316' },
        { name: 'Transportation', pct: 0.14, color: '#3b82f6' },
        { name: 'Shopping', pct: 0.21, color: '#ec4899' },
        { name: 'Bills & Utilities', pct: 0.17, color: '#f59e0b' },
        { name: 'Entertainment', pct: 0.11, color: '#8b5cf6' },
        { name: 'Healthcare', pct: 0.09, color: '#ef4444' },
    ].map(c => ({ ...c, value: Math.round(monthlyExp * c.pct) }));

    // ── 6-month history (slight natural variation ±5%) ──
    const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const variation = [0.92, 0.96, 1.0, 0.98, 1.04, 1.0];
    const monthlyData = MONTHS.map((month, i) => {
        const inc = Math.round(monthly * variation[i]);
        const exp = Math.round(monthlyExp * variation[i]);
        return { month, income: inc, expense: exp, savings: inc - exp };
    });

    // ── Transactions derived from the current month figures ──
    const foodBudget = categories.find(c => c.name === 'Food & Dining')?.value ?? 0;
    const transportBud = categories.find(c => c.name === 'Transportation')?.value ?? 0;
    const shopBud = categories.find(c => c.name === 'Shopping')?.value ?? 0;
    const billsBud = categories.find(c => c.name === 'Bills & Utilities')?.value ?? 0;
    const entBud = categories.find(c => c.name === 'Entertainment')?.value ?? 0;
    const healthBud = categories.find(c => c.name === 'Healthcare')?.value ?? 0;

    const transactions = [
        { id: 1, date: '2024-01-15', merchant: 'Whole Foods Market', category: 'Food & Dining', amount: -Math.round(foodBudget * 0.50), type: 'debit' },
        { id: 2, date: '2024-01-14', merchant: 'Salary Deposit', category: 'Income', amount: monthly, type: 'credit' },
        { id: 3, date: '2024-01-13', merchant: 'Uber', category: 'Transportation', amount: -Math.round(transportBud * 0.15), type: 'debit' },
        { id: 4, date: '2024-01-12', merchant: 'Amazon', category: 'Shopping', amount: -Math.round(shopBud * 0.30), type: 'debit' },
        { id: 5, date: '2024-01-11', merchant: 'Starbucks', category: 'Food & Dining', amount: -Math.round(foodBudget * 0.05), type: 'debit' },
        { id: 6, date: '2024-01-10', merchant: 'Netflix', category: 'Entertainment', amount: -Math.round(entBud * 0.17), type: 'debit' },
        { id: 7, date: '2024-01-09', merchant: 'CVS Pharmacy', category: 'Healthcare', amount: -Math.round(healthBud * 0.32), type: 'debit' },
        { id: 8, date: '2024-01-08', merchant: 'Freelance Payment', category: 'Income', amount: Math.round(monthly * 0.12), type: 'credit' },
        { id: 9, date: '2024-01-07', merchant: 'Con Edison', category: 'Bills & Utilities', amount: -Math.round(billsBud * 0.40), type: 'debit' },
        { id: 10, date: '2024-01-06', merchant: 'Gym Membership', category: 'Health & Fitness', amount: -Math.round(healthBud * 0.38), type: 'debit' },
        { id: 11, date: '2024-01-05', merchant: 'Delta Airlines', category: 'Transportation', amount: -Math.round(transportBud * 1.8), type: 'debit' },
        { id: 12, date: '2024-01-04', merchant: 'Dividend Income', category: 'Income', amount: Math.round(monthly * 0.02), type: 'credit' },
        { id: 13, date: '2024-01-03', merchant: "Trader Joe's", category: 'Food & Dining', amount: -Math.round(foodBudget * 0.25), type: 'debit' },
        { id: 14, date: '2024-01-02', merchant: 'Apple Store', category: 'Shopping', amount: -Math.round(shopBud * 0.45), type: 'debit' },
        { id: 15, date: '2024-01-01', merchant: 'Spotify', category: 'Entertainment', amount: -Math.round(entBud * 0.11), type: 'debit' },
    ];

    // Total income & expenses this month (from transactions)
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
    const netSavings = totalIncome - totalExpenses;

    // Financial score (0–100) — basic formula
    const savingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;
    const baseScore = Math.min(100, Math.max(0, Math.round(50 + savingsRate * 100)));

    // Top spending categories (sorted)
    const topCategories = [...categories].sort((a, b) => b.value - a.value);

    return {
        monthly,
        monthlyExp,
        monthlySav,
        totalIncome,
        totalExpenses,
        netSavings,
        financialScore: baseScore,
        categories,
        topCategories,
        monthlyData,
        transactions,
    };
}
