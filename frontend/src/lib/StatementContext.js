'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Storage key ─────────────────────────────────────────────────────────────
const LS_KEY = 'parsedStatement';

const StatementContext = createContext(null);

/**
 * Derives aggregated financials from a flat array of parsed transactions.
 *
 * Returns the same shape that other pages expect so they can swap
 * deriveFinancials() output for real data with no structural changes.
 */
export function computeFinancialsFromTransactions(transactions = []) {
    if (!transactions || transactions.length === 0) return null;

    // ── Totals ────────────────────────────────────────────────────────────────
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');

    const totalIncome = credits.reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);
    const totalExpenses = debits.reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);
    const netSavings = totalIncome - totalExpenses;

    // ── Category breakdown ────────────────────────────────────────────────────
    const CATEGORY_COLORS = {
        Food: '#f97316',
        Transport: '#3b82f6',
        Shopping: '#ec4899',
        Utilities: '#f59e0b',
        Entertainment: '#8b5cf6',
        Healthcare: '#ef4444',
        EMI: '#14b8a6',
        Investment: '#22c55e',
        Rent: '#6366f1',
        Other: '#94a3b8',
    };

    const catMap = {};
    debits.forEach(t => {
        const name = t.category || 'Other';
        catMap[name] = (catMap[name] || 0) + Math.abs(parseFloat(t.amount) || 0);
    });

    const categories = Object.entries(catMap)
        .map(([name, value]) => ({
            name,
            value: Math.round(value),
            color: CATEGORY_COLORS[name] || '#94a3b8',
            pct: totalExpenses > 0 ? value / totalExpenses : 0,
        }))
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);

    // ── Monthly bucketing ─────────────────────────────────────────────────────
    const monthMap = {};
    transactions.forEach(t => {
        if (!t.date) return;
        // Accept both YYYY-MM-DD and DD/MM/YYYY and DD-MM-YYYY
        let d = new Date(t.date);
        if (isNaN(d)) {
            // try DD/MM/YYYY or DD-MM-YYYY
            const parts = t.date.split(/[-\/]/);
            if (parts.length === 3) {
                const [a, b, c] = parts;
                // if day/month/year (DD/MM/YY or DD/MM/YYYY)
                const year = c.length === 2 ? `20${c}` : c;
                d = new Date(`${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
            }
        }
        if (isNaN(d)) return;

        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g. "Feb 26"
        if (!monthMap[label]) monthMap[label] = { month: label, income: 0, expense: 0, _date: d };
        const amt = Math.abs(parseFloat(t.amount) || 0);
        if (t.type === 'credit') monthMap[label].income += amt;
        else monthMap[label].expense += amt;
    });

    const monthlyData = Object.values(monthMap)
        .sort((a, b) => a._date - b._date)
        .slice(-6)  // last 6 months
        .map(m => ({ month: m.month, income: Math.round(m.income), expense: Math.round(m.expense), savings: Math.round(m.income - m.expense) }));

    // ── Recurring — repeated merchant within debits ───────────────────────────
    const merchantCount = {};
    debits.forEach(t => {
        const key = (t.description || t.merchant || '').toLowerCase().trim();
        if (!key) return;
        merchantCount[key] = merchantCount[key] || { label: t.description || t.merchant, amounts: [] };
        merchantCount[key].amounts.push(Math.abs(parseFloat(t.amount) || 0));
    });
    const recurringPayments = Object.values(merchantCount)
        .filter(m => m.amounts.length >= 2)
        .map(m => ({
            merchant: m.label,
            amount: Math.round(m.amounts.reduce((a, b) => a + b, 0) / m.amounts.length),
            frequency: 'Monthly',
        }))
        .slice(0, 6);

    // ── 6-Component Financial Health Score ───────────────────────────────────
    const totalEMI = debits.filter(t => (t.category || '').toLowerCase() === 'emi')
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);
    const totalInvestment = debits.filter(t => (t.category || '').toLowerCase() === 'investment')
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);
    const totalSubscription = debits.filter(t => (t.category || '').toLowerCase() === 'entertainment')
        .reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);

    const savingsRatio = totalIncome > 0 ? Math.max(0, netSavings / totalIncome) : 0;
    const expenseRatio = totalIncome > 0 ? Math.min(1, totalExpenses / totalIncome) : 1;
    const emiRatio = totalIncome > 0 ? Math.min(1, totalEMI / totalIncome) : 0;
    const investmentRatio = totalIncome > 0 ? Math.min(1, totalInvestment / totalIncome) : 0;
    const subscriptionRatio = totalIncome > 0 ? Math.min(1, totalSubscription / totalIncome) : 0;

    // 1. Savings /25
    let savingsScore = 0;
    if (savingsRatio >= 0.30) savingsScore = 25;
    else if (savingsRatio >= 0.20) savingsScore = 20;
    else if (savingsRatio >= 0.10) savingsScore = 13;
    else if (savingsRatio > 0) savingsScore = 6;

    // 2. Expense /20
    let expenseScore = 0;
    if (expenseRatio <= 0.50) expenseScore = 20;
    else if (expenseRatio <= 0.65) expenseScore = 15;
    else if (expenseRatio <= 0.75) expenseScore = 10;
    else if (expenseRatio <= 0.90) expenseScore = 5;

    // 3. EMI /20
    let emiScore = 0;
    if (emiRatio === 0) emiScore = 20;
    else if (emiRatio <= 0.30) emiScore = 16;
    else if (emiRatio <= 0.40) emiScore = 10;
    else if (emiRatio <= 0.50) emiScore = 5;

    // 4. Investment /15
    let investmentScore = 0;
    if (investmentRatio >= 0.20) investmentScore = 15;
    else if (investmentRatio >= 0.10) investmentScore = 12;
    else if (investmentRatio >= 0.05) investmentScore = 8;
    else if (investmentRatio > 0) investmentScore = 4;

    // 5. Subscription /10
    let subscriptionScore = 0;
    if (subscriptionRatio <= 0.05) subscriptionScore = 10;
    else if (subscriptionRatio <= 0.10) subscriptionScore = 7;
    else if (subscriptionRatio <= 0.15) subscriptionScore = 4;

    // 6. Stability /10 — coefficient of variation of monthly expenses
    const monthlyExpMap = {};
    debits.forEach(t => {
        if (!t.date) return;
        // Use first 7 chars: handles YYYY-MM-DD and DD/MM/YYYY differently,
        // so we re-parse the same date logic used for bucket labels above
        let d2 = new Date(t.date);
        if (isNaN(d2)) {
            const pts = t.date.split(/[-\/]/);
            if (pts.length === 3) {
                const yr = pts[2].length === 2 ? `20${pts[2]}` : pts[2];
                d2 = new Date(`${yr}-${pts[1].padStart(2, '0')}-${pts[0].padStart(2, '0')}`);
            }
        }
        if (isNaN(d2)) return;
        const mo = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`;
        monthlyExpMap[mo] = (monthlyExpMap[mo] || 0) + Math.abs(parseFloat(t.amount) || 0);
    });
    const expVals = Object.values(monthlyExpMap);
    let stabilityScore = 5; // neutral default
    if (expVals.length >= 2) {
        const mean = expVals.reduce((a, b) => a + b, 0) / expVals.length;
        const variance = expVals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / expVals.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
        if (cv <= 0.10) stabilityScore = 10;
        else if (cv <= 0.20) stabilityScore = 7;
        else if (cv <= 0.35) stabilityScore = 4;
        else stabilityScore = 0;
    }

    const financialScore = Math.min(100, Math.max(0,
        savingsScore + expenseScore + emiScore + investmentScore + subscriptionScore + stabilityScore
    ));

    const scoreBreakdown = {
        savings: { score: savingsScore, max: 25, ratio: Math.round(savingsRatio * 100) },
        expense: { score: expenseScore, max: 20, ratio: Math.round(expenseRatio * 100) },
        emi: { score: emiScore, max: 20, ratio: Math.round(emiRatio * 100) },
        investment: { score: investmentScore, max: 15, ratio: Math.round(investmentRatio * 100) },
        subscription: { score: subscriptionScore, max: 10, ratio: Math.round(subscriptionRatio * 100) },
        stability: { score: stabilityScore, max: 10 },
    };

    // ── Normalise transactions for table display ──────────────────────────────
    const normalised = transactions.map((t, i) => ({
        id: t.id || i + 1,
        date: t.date || '—',
        merchant: t.description || t.merchant || 'Transaction',
        category: t.category || 'Other',
        amount: Math.abs(parseFloat(t.amount) || 0),
        type: t.type || 'debit',
    }));

    return {
        transactions: normalised,
        categories,
        topCategories: [...categories].sort((a, b) => b.value - a.value),
        monthlyData,
        recurringPayments,
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        netSavings: Math.round(netSavings),
        financialScore,
        scoreBreakdown,
        monthly: Math.round(totalIncome),
        monthlyExp: Math.round(totalExpenses),
        monthlySav: Math.round(netSavings),
    };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function StatementProvider({ children }) {
    // raw parsed transactions array from the upload page
    const [parsedTransactions, setParsedTransactions] = useState(null);
    const [statementMeta, setStatementMeta] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);

    // Hydrate from localStorage on mount (survives page refresh / navigation)
    useEffect(() => {
        try {
            const stored = localStorage.getItem(LS_KEY);
            if (stored) {
                const { transactions, meta, aiSummary: savedSummary } = JSON.parse(stored);
                if (Array.isArray(transactions) && transactions.length > 0) {
                    setParsedTransactions(transactions);
                    setStatementMeta(meta || null);
                    setAiSummary(savedSummary || null);
                }
            }
        } catch (_) { /* ignore */ }
    }, []);

    /**
     * Called by the upload page after a successful extraction.
     * Persists to localStorage so other pages see it immediately.
     */
    const saveStatement = useCallback((transactions, meta = {}, summary = null) => {
        setParsedTransactions(transactions);
        setStatementMeta(meta);
        setAiSummary(summary);
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ transactions, meta, aiSummary: summary }));
        } catch (_) { /* quota exceeded or private mode */ }
    }, []);

    const clearStatement = useCallback(() => {
        setParsedTransactions(null);
        setStatementMeta(null);
        setAiSummary(null);
        try { localStorage.removeItem(LS_KEY); } catch (_) { }
    }, []);

    const computed = computeFinancialsFromTransactions(parsedTransactions);
    const hasRealData = !!computed;

    return (
        <StatementContext.Provider
            value={{
                parsedTransactions,
                statementMeta,
                aiSummary,
                computed,
                hasRealData,
                saveStatement,
                clearStatement,
            }}
        >
            {children}
        </StatementContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStatement() {
    const ctx = useContext(StatementContext);
    if (!ctx) throw new Error('useStatement must be used inside <StatementProvider>');
    return ctx;
}
