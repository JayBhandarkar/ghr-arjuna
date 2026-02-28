const { HfInference } = require('@huggingface/inference');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.categorizeTransaction = async (description, amount) => {
  const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities', 
    'Entertainment', 'Healthcare', 'Education', 'Travel', 'Investment', 'Salary', 'Other'];
  
  try {
    const prompt = `Categorize this transaction into one of these categories: ${categories.join(', ')}\nTransaction: "${description}" Amount: ${amount}\nRespond with only the category name.`;
    
    const result = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 20,
        temperature: 0.3
      }
    });

    const category = result.generated_text.replace(prompt, '').trim();
    return categories.find(c => category.toLowerCase().includes(c.toLowerCase())) || 'Other';
  } catch (error) {
    console.error('AI categorization error:', error);
    return 'Other';
  }
};

exports.generateFinancialSummary = async (transactions, analysis) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Analyze this financial data and provide a brief summary with insights and recommendations:
Total Income: $${analysis.totalIncome}
Total Expenses: $${analysis.totalExpenses}
Top Categories: ${JSON.stringify(analysis.categoryBreakdown)}
Provide 3-4 key insights in 150 words.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI summary error:', error);
    return 'Unable to generate summary at this time.';
  }
};
