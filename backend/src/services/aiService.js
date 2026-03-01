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
 * Generate a natural-language financial summary using Gemini.
 */
exports.generateFinancialSummary = async (transactions, analysis) => {
  try {
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const categoryList = Object.entries(analysis.categoryBreakdown || {})
      .map(([cat, amt]) => `${cat}: $${Number(amt).toFixed(2)}`)
      .join(', ');

    const prompt = `You are a financial advisor. Analyse this data and write a concise 3-4 sentence summary with actionable insights:
Total Income: $${analysis.totalIncome?.toFixed(2)}
Total Expenses: $${analysis.totalExpenses?.toFixed(2)}
Net Savings: $${(analysis.totalIncome - analysis.totalExpenses)?.toFixed(2)}
Category breakdown: ${categoryList}
Focus on savings potential, spending habits, and one concrete recommendation. Keep it under 120 words.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini summary error:', error.message);
    const savings = (analysis.totalIncome || 0) - (analysis.totalExpenses || 0);
    const rate = analysis.totalIncome > 0
      ? Math.round((savings / analysis.totalIncome) * 100) : 0;
    return `Your savings rate is ${rate}%. Total income: $${analysis.totalIncome?.toFixed(2)}, expenses: $${analysis.totalExpenses?.toFixed(2)}, net savings: $${savings.toFixed(2)}.`;
  }
};
