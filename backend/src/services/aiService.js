/**
 * aiService.js
 * All AI calls now go through the local ML microservice (port 5001).
 * The trained DistilBERT model + LabelEncoder handle categorization.
 * Gemini is kept for natural-language financial summaries.
 */

const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ── Real model categories (matches label_encoder.pkl exactly) ─────────────────
const MODEL_CATEGORIES = [
  'EMI', 'Entertainment', 'Food', 'Healthcare',
  'Investment', 'Other', 'Rent', 'Shopping', 'Transport', 'Utilities'
];

/**
 * Categorize a single transaction description using the local ML model.
 * Falls back to keyword heuristics if the service is unreachable.
 */
exports.categorizeTransaction = async (description, amount) => {
  try {
    const { data } = await axios.post(
      `${ML_URL}/predict`,
      { description },
      { timeout: 5000 }
    );
    return data.category || 'Other';
  } catch (err) {
    console.warn('ML service unavailable — using keyword fallback:', err.message);
    return keywordFallback(description);
  }
};

/**
 * Categorize many transactions in one request (more efficient).
 */
exports.categorizeTransactions = async (descriptions) => {
  try {
    const { data } = await axios.post(
      `${ML_URL}/predict-batch`,
      { descriptions },
      { timeout: 10000 }
    );
    return data.map(r => r.category || 'Other');
  } catch (err) {
    console.warn('ML batch unavailable — using keyword fallback:', err.message);
    return descriptions.map(d => keywordFallback(d));
  }
};

/**
 * Simple keyword fallback so the app still works if ML service is down.
 */
function keywordFallback(description = '') {
  const d = description.toLowerCase();
  if (/salary|payroll|income|deposit|wage/i.test(d)) return 'Other';
  if (/emi|loan|mortgage|credit card payment/i.test(d)) return 'EMI';
  if (/rent|lease|pg|hostel/i.test(d)) return 'Rent';
  if (/netflix|spotify|youtube|prime|hulu|disney/i.test(d)) return 'Entertainment';
  if (/grocer|restaurant|food|cafe|dining|zomato|swiggy/i.test(d)) return 'Food';
  if (/uber|ola|taxi|metro|bus|fuel|petrol|gas/i.test(d)) return 'Transport';
  if (/hospital|clinic|pharmacy|doctor|medical/i.test(d)) return 'Healthcare';
  if (/amazon|flipkart|shopping|mall|store/i.test(d)) return 'Shopping';
  if (/electricity|water|internet|broadband|phone bill/i.test(d)) return 'Utilities';
  if (/mutual fund|sip|stock|invest|nifty|sensex/i.test(d)) return 'Investment';
  return 'Other';
}

/**
 * Generate a structured 6-section financial summary using Gemini.
 * Returns plain text with bullet points that the frontend renders.
 */
exports.generateFinancialSummary = async (transactions, analysis) => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const savings = (analysis.totalIncome || 0) - (analysis.totalExpenses || 0);
    const savingsRate = analysis.totalIncome > 0
      ? Math.round((savings / analysis.totalIncome) * 100) : 0;

    // Top 3 spending categories
    const topCategories = Object.entries(analysis.categoryBreakdown || {})
      .map(([cat, info]) => ({ cat, total: Number(info?.total ?? info) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map(({ cat, total }) => `${cat}: ₹${total.toFixed(0)}`)
      .join(', ');

    const allCategories = Object.entries(analysis.categoryBreakdown || {})
      .map(([cat, info]) => `${cat}: ₹${Number(info?.total ?? info).toFixed(0)}`)
      .join(', ');

    const prompt = `You are a professional financial advisor for an Indian user. Analyse the transaction data below and generate a structured financial summary report.

--- FINANCIAL DATA ---
Total Income:      ₹${(analysis.totalIncome || 0).toFixed(0)}
Total Expenses:    ₹${(analysis.totalExpenses || 0).toFixed(0)}
Net Savings:       ₹${savings.toFixed(0)} (${savingsRate}% savings rate)
Total Transactions: ${transactions.length}
Category Breakdown: ${allCategories || 'Not available'}
Top 3 Categories:  ${topCategories || 'Not available'}
----------------------

Generate a professional financial summary covering EXACTLY these 6 sections. Use ₹ (Indian Rupees). Each section must have a bold heading followed by 1–2 bullet points. Keep the entire response between 150–200 words.

**1. Overall Financial Health**
• [one sentence health assessment with savings rate]

**2. Income vs Expense**
• [comparison with actual numbers]

**3. Top Spending Categories**
• [mention top 2–3 categories with amounts]

**4. Recurring Expenses**
• [note any recurring/subscription patterns]

**5. Risk Indicators**
• [flag any financial risks like high EMI, low savings, overspending]

**6. Actionable Recommendations**
• [Recommendation 1]
• [Recommendation 2]
• [Recommendation 3]

Use ONLY this format. Do not add any extra text outside the 6 sections. Use ₹ for all amounts.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini summary error:', error.message);
    const savings = (analysis.totalIncome || 0) - (analysis.totalExpenses || 0);
    const rate = analysis.totalIncome > 0
      ? Math.round((savings / analysis.totalIncome) * 100) : 0;
    const topCats = Object.entries(analysis.categoryBreakdown || {})
      .sort((a, b) => Number(b[1]?.total ?? b[1]) - Number(a[1]?.total ?? a[1]))
      .slice(0, 2)
      .map(([c]) => c).join(', ');

    // Return structured fallback
    return `**1. Overall Financial Health**\n• Savings rate is ${rate}% — ${rate >= 20 ? 'healthy and on track.' : 'below the recommended 20% target.'}\n\n**2. Income vs Expense**\n• Income: ₹${(analysis.totalIncome || 0).toFixed(0)} | Expenses: ₹${(analysis.totalExpenses || 0).toFixed(0)} | Net: ₹${savings.toFixed(0)}\n\n**3. Top Spending Categories**\n• ${topCats || 'Data not available'}\n\n**4. Recurring Expenses**\n• Review subscriptions and EMIs for regular outflows.\n\n**5. Risk Indicators**\n• ${rate < 10 ? 'Very low savings — high financial risk.' : rate < 20 ? 'Savings below 20% target — moderate risk.' : 'No major risk indicators detected.'}\n\n**6. Actionable Recommendations**\n• Increase savings to at least 20% of income.\n• Review and reduce top spending categories.\n• Build an emergency fund of 3–6 months expenses.`;
  }
};
