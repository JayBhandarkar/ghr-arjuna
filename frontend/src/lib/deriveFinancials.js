/**
 * deriveFinancials(annualIncome)
 *
 * Generates realistic monthly financial figures from the user's annual income.
 * Categories match the trained DistilBERT model's LabelEncoder exactly:
 *   EMI · Entertainment · Food · Healthcare · Investment
 *   Other · Rent · Shopping · Transport · Utilities
 *
 * Rationale:
 *   - Monthly income  = annualIncome / 12
 *   - Expenses        ≈ 72% of monthly income
 *   - Category split  based on typical household budgets
 */

// ── Real dynamic dates (last N days from today) ───────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── Last 6 months as "Mon YY" labels ─────────────────────────────────────────
function last6MonthLabels() {
    const labels = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('default', { month: 'short' }));
    }
    return labels;
}

export function deriveFinancials(annualIncome = 0) {
    // Default to ₹5,00,000/yr if user skipped income entry (realistic Indian middle-class default)
    const income = annualIncome && annualIncome > 0 ? annualIncome : 500000;
    const monthly = Math.round(income / 12);
    const expenseRate = 0.72;
    const monthlyExp = Math.round(monthly * expenseRate);
    const monthlySav = monthly - monthlyExp;

    // ── Category breakdown — names match model labels exactly ──────────────
    const categories = [
        { name: 'Food', pct: 0.27, color: '#f97316' },
        { name: 'Transport', pct: 0.13, color: '#3b82f6' },
        { name: 'Shopping', pct: 0.20, color: '#ec4899' },
        { name: 'Utilities', pct: 0.16, color: '#f59e0b' },
        { name: 'Entertainment', pct: 0.10, color: '#8b5cf6' },
        { name: 'Healthcare', pct: 0.08, color: '#ef4444' },
        { name: 'Rent', pct: 0.00, color: '#6366f1' },  // only shown if user pays rent
        { name: 'EMI', pct: 0.00, color: '#14b8a6' },
        { name: 'Investment', pct: 0.06, color: '#22c55e' },
    ]
        .map(c => ({ ...c, value: Math.round(monthlyExp * c.pct) }))
        .filter(c => c.value > 0);  // hide $0 categories

    // ── 6-month history with realistic ±8% variation ──────────────────────
    const MONTHS = last6MonthLabels();
    const variation = [0.91, 0.95, 1.0, 0.97, 1.05, 1.0];
    const monthlyData = MONTHS.map((month, i) => {
        const inc = Math.round(monthly * variation[i]);
        const exp = Math.round(monthlyExp * variation[i]);
        return { month, income: inc, expense: exp, savings: inc - exp };
    });

    // ── Budget helpers ────────────────────────────────────────────────────
    const cat = (name) => categories.find(c => c.name === name)?.value ?? 0;
    const foodBud = cat('Food');
    const transportBud = cat('Transport');
    const shopBud = cat('Shopping');
    const utilBud = cat('Utilities');
    const entBud = cat('Entertainment');
    const healthBud = cat('Healthcare');
    const investBud = cat('Investment');

    // ── Transactions — real dynamic dates, model category names ───────────
    const transactions = [
        { id: 1, date: daysAgo(0), merchant: 'Salary Deposit', category: 'Other', amount: monthly, type: 'credit' },
        { id: 2, date: daysAgo(1), merchant: 'Whole Foods Market', category: 'Food', amount: -Math.round(foodBud * 0.50), type: 'debit' },
        { id: 3, date: daysAgo(2), merchant: 'Uber', category: 'Transport', amount: -Math.round(transportBud * 0.15), type: 'debit' },
        { id: 4, date: daysAgo(3), merchant: 'Amazon', category: 'Shopping', amount: -Math.round(shopBud * 0.30), type: 'debit' },
        { id: 5, date: daysAgo(4), merchant: 'Starbucks', category: 'Food', amount: -Math.round(foodBud * 0.05), type: 'debit' },
        { id: 6, date: daysAgo(5), merchant: 'Netflix', category: 'Entertainment', amount: -Math.round(entBud * 0.17), type: 'debit' },
        { id: 7, date: daysAgo(6), merchant: 'CVS Pharmacy', category: 'Healthcare', amount: -Math.round(healthBud * 0.32), type: 'debit' },
        { id: 8, date: daysAgo(7), merchant: 'Freelance Payment', category: 'Other', amount: Math.round(monthly * 0.12), type: 'credit' },
        { id: 9, date: daysAgo(8), merchant: 'Electricity Bill', category: 'Utilities', amount: -Math.round(utilBud * 0.40), type: 'debit' },
        { id: 10, date: daysAgo(9), merchant: 'Spotify', category: 'Entertainment', amount: -Math.round(entBud * 0.11), type: 'debit' },
        { id: 11, date: daysAgo(10), merchant: 'Mutual Fund SIP', category: 'Investment', amount: -Math.round(investBud * 0.80), type: 'debit' },
        { id: 12, date: daysAgo(11), merchant: "Trader Joe's", category: 'Food', amount: -Math.round(foodBud * 0.25), type: 'debit' },
        { id: 13, date: daysAgo(12), merchant: 'Internet Bill', category: 'Utilities', amount: -Math.round(utilBud * 0.30), type: 'debit' },
        { id: 14, date: daysAgo(13), merchant: 'Dividend Income', category: 'Investment', amount: Math.round(monthly * 0.02), type: 'credit' },
        { id: 15, date: daysAgo(14), merchant: 'Apple Store', category: 'Shopping', amount: -Math.round(shopBud * 0.45), type: 'debit' },
    ];

    // ── Totals ────────────────────────────────────────────────────────────
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
    const netSavings = totalIncome - totalExpenses;

    // ── Financial Score (0–100) ───────────────────────────────────────────
    const savingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;
    const baseScore = Math.min(100, Math.max(0, Math.round(50 + savingsRate * 100)));

    // ── Top spending categories (sorted by value desc) ────────────────────
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
