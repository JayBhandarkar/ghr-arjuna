exports.calculateFinancialHealth = (transactions) => {
  const income = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
  
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100;
  
  let score = 50;
  if (savingsRate > 20) score += 30;
  else if (savingsRate > 10) score += 20;
  else if (savingsRate > 0) score += 10;
  else score -= 20;
  
  if (expenseRatio < 50) score += 20;
  else if (expenseRatio < 70) score += 10;
  else if (expenseRatio > 100) score -= 30;
  
  return Math.max(0, Math.min(100, score));
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
