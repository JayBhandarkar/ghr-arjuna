/**
 * calculateFinancialHealth(transactions)
 *
 * 6-component Financial Health Score (max 100):
 *   Savings Score      25 pts  — savings ratio
 *   Expense Score      20 pts  — expense ratio
 *   EMI Score          20 pts  — EMI-to-income ratio
 *   Investment Score   15 pts  — investment ratio
 *   Subscription Score 10 pts  — recurring subscription ratio
 *   Stability Score    10 pts  — variance of monthly spending
 *
 * Returns { score, breakdown } so callers can display component breakdown.
 */
exports.calculateFinancialHealth = (transactions) => {
  const income = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const debits = transactions.filter(t => t.type === 'debit');
  const expenses = debits.reduce((s, t) => s + t.amount, 0);

  if (income === 0) return { score: 0, breakdown: null };

  // ── Identify EMI, Investment, Subscription amounts by category ────────────
  const byCategory = (cats) =>
    debits.filter(t => cats.includes((t.category || '').toLowerCase()))
      .reduce((s, t) => s + t.amount, 0);

  const emiTotal = byCategory(['emi']);
  const invTotal = byCategory(['investment']);
  const subTotal = byCategory(['entertainment']); // subscriptions proxied from entertainment

  // ── Ratios ────────────────────────────────────────────────────────────────
  const savingsRatio = Math.max(0, (income - expenses) / income); // 0–1
  const expenseRatio = Math.min(1, expenses / income);            // 0–1 (capped)
  const emiRatio = Math.min(1, emiTotal / income);
  const investmentRatio = Math.min(1, invTotal / income);
  const subscriptionRatio = Math.min(1, subTotal / income);

  // ── 1. Savings Score /25 ─────────────────────────────────────────────────
  //   ≥30% → 25 | 20–30% → 20 | 10–20% → 13 | 0–10% → 6 | negative → 0
  let savingsScore = 0;
  if (savingsRatio >= 0.30) savingsScore = 25;
  else if (savingsRatio >= 0.20) savingsScore = 20;
  else if (savingsRatio >= 0.10) savingsScore = 13;
  else if (savingsRatio > 0) savingsScore = 6;

  // ── 2. Expense Score /20 ─────────────────────────────────────────────────
  //   ≤50% → 20 | ≤65% → 15 | ≤75% → 10 | ≤90% → 5 | >90% → 0
  let expenseScore = 0;
  if (expenseRatio <= 0.50) expenseScore = 20;
  else if (expenseRatio <= 0.65) expenseScore = 15;
  else if (expenseRatio <= 0.75) expenseScore = 10;
  else if (expenseRatio <= 0.90) expenseScore = 5;

  // ── 3. EMI Score /20 ─────────────────────────────────────────────────────
  //   0% → 20 | ≤30% → 16 | ≤40% → 10 | ≤50% → 5 | >50% → 0
  let emiScore = 0;
  if (emiRatio === 0) emiScore = 20;
  else if (emiRatio <= 0.30) emiScore = 16;
  else if (emiRatio <= 0.40) emiScore = 10;
  else if (emiRatio <= 0.50) emiScore = 5;

  // ── 4. Investment Score /15 ───────────────────────────────────────────────
  //   ≥20% → 15 | ≥10% → 12 | ≥5% → 8 | >0% → 4 | 0% → 0
  let investmentScore = 0;
  if (investmentRatio >= 0.20) investmentScore = 15;
  else if (investmentRatio >= 0.10) investmentScore = 12;
  else if (investmentRatio >= 0.05) investmentScore = 8;
  else if (investmentRatio > 0) investmentScore = 4;

  // ── 5. Subscription Score /10 ─────────────────────────────────────────────
  //   ≤5% → 10 | ≤10% → 7 | ≤15% → 4 | >15% → 0
  let subscriptionScore = 0;
  if (subscriptionRatio <= 0.05) subscriptionScore = 10;
  else if (subscriptionRatio <= 0.10) subscriptionScore = 7;
  else if (subscriptionRatio <= 0.15) subscriptionScore = 4;

  // ── 6. Stability Score /10 — variance of monthly expense ──────────────────
  // Group debits by month → compute coefficient of variation → score
  const monthlyExp = {};
  debits.forEach(t => {
    const mo = (t.date || '').substring(0, 7); // YYYY-MM or first 7 chars
    monthlyExp[mo] = (monthlyExp[mo] || 0) + t.amount;
  });
  const vals = Object.values(monthlyExp);
  let stabilityScore = 0;
  if (vals.length >= 2) {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // coefficient of variation
    if (cv <= 0.10) stabilityScore = 10;
    else if (cv <= 0.20) stabilityScore = 7;
    else if (cv <= 0.35) stabilityScore = 4;
  } else {
    stabilityScore = 5; // not enough months — neutral
  }

  const score = savingsScore + expenseScore + emiScore + investmentScore + subscriptionScore + stabilityScore;

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      savings: { score: savingsScore, max: 25, ratio: Math.round(savingsRatio * 100) },
      expense: { score: expenseScore, max: 20, ratio: Math.round(expenseRatio * 100) },
      emi: { score: emiScore, max: 20, ratio: Math.round(emiRatio * 100) },
      investment: { score: investmentScore, max: 15, ratio: Math.round(investmentRatio * 100) },
      subscription: { score: subscriptionScore, max: 10, ratio: Math.round(subscriptionRatio * 100) },
      stability: { score: stabilityScore, max: 10, cv: vals.length >= 2 ? undefined : 'n/a' },
    },
  };
};


exports.detectRecurringExpenses = (transactions) => {
  const recurring = {};

  transactions.filter(t => t.type === 'debit').forEach(t => {
    const key = t.description.toLowerCase().substring(0, 20);
    if (!recurring[key]) {
      recurring[key] = { description: t.description, amounts: [], dates: [] };
    }
    recurring[key].amounts.push(t.amount);
    recurring[key].dates.push(t.date);
  });

  return Object.values(recurring)
    .filter(r => r.amounts.length >= 2)
    .map(r => ({
      description: r.description,
      frequency: r.amounts.length,
      averageAmount: r.amounts.reduce((a, b) => a + b, 0) / r.amounts.length
    }));
};

exports.detectUnusualPatterns = (transactions) => {
  const debits = transactions.filter(t => t.type === 'debit');
  if (debits.length === 0) return [];

  const amounts = debits.map(t => t.amount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / amounts.length);

  return debits
    .filter(t => Math.abs(t.amount - avg) > 2 * stdDev)
    .map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      reason: 'Unusually high transaction'
    }));
};

exports.getCategoryBreakdown = (transactions) => {
  const breakdown = {};

  transactions.forEach(t => {
    if (!breakdown[t.category]) {
      breakdown[t.category] = { total: 0, count: 0, type: t.type };
    }
    breakdown[t.category].total += t.amount;
    breakdown[t.category].count += 1;
  });

  return breakdown;
};
