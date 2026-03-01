const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const parser = require('../utils/parser');
const aiService = require('../services/aiService');
const analysisService = require('../services/analysisService');

// ── Extract text + parse + ML-categorize transactions, return synchronously ───
exports.extractStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileType = parser.getFileType(req.file.mimetype, req.file.originalname);
    let rawText = '';
    let transactions = [];

    switch (fileType) {
      case 'pdf':
        rawText = await parser.extractTextFromPDF(req.file.buffer);
        transactions = parser.extractTransactions(rawText);
        break;
      case 'csv':
        rawText = parser.extractTextFromCSV(req.file.buffer);
        transactions = parser.parseCSV(req.file.buffer);
        break;
      case 'txt':
        rawText = parser.extractTextFromTXT(req.file.buffer);
        transactions = parser.extractTransactions(rawText);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported file type. Use PDF, CSV, or TXT.' });
    }

    // ── Run ML categorization on all transactions at once ──────────────────
    if (transactions.length > 0) {
      const descriptions = transactions.map(t => t.description || t.merchant || 'transaction');
      const categories = await aiService.categorizeTransactions(descriptions);
      transactions = transactions.map((t, i) => ({ ...t, category: categories[i] || 'Other' }));
    }

    // ── Build analysis object for Gemini ────────────────────────────────────
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);

    const categoryBreakdown = {};
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const cat = t.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Math.abs(parseFloat(t.amount) || 0);
    });
    // Convert to object format expected by generateFinancialSummary
    const categoryBreakdownObj = {};
    Object.entries(categoryBreakdown).forEach(([cat, total]) => {
      categoryBreakdownObj[cat] = { total, count: 1 };
    });

    const analysis = { totalIncome, totalExpenses, categoryBreakdown: categoryBreakdownObj };
    const aiSummary = await aiService.generateFinancialSummary(transactions, analysis);

    res.json({
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      rawText: rawText.trim(),
      transactions,
      totalFound: transactions.length,
      aiSummary,
      analysis: { totalIncome, totalExpenses, netSavings: totalIncome - totalExpenses },
    });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ message: 'Extraction failed', error: error.message });
  }
};



exports.uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileType = parser.getFileType(req.file.mimetype, req.file.originalname);
    const statement = await Statement.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileType,
      status: 'processing'
    });
    // Fire-and-forget background processing
    processStatement(statement._id, req.file.buffer, fileType, req.user._id);
    res.status(202).json({ message: 'Statement uploaded successfully', statementId: statement._id });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

const processStatement = async (statementId, buffer, fileType, userId) => {
  try {
    // 1. Parse rows
    let rawTransactions = [];
    if (fileType === 'pdf') {
      const text = await parser.extractTextFromPDF(buffer);
      rawTransactions = parser.extractTransactions(text);
    } else if (fileType === 'csv') {
      rawTransactions = parser.parseCSV(buffer);
    } else if (fileType === 'txt') {
      const text = parser.extractTextFromTXT(buffer);
      rawTransactions = parser.extractTransactions(text);
    }

    if (rawTransactions.length === 0) {
      await Statement.findByIdAndUpdate(statementId, { status: 'completed', analysis: {} });
      return;
    }

    // 2. Batch-categorize all descriptions with the ML model in ONE call
    const descriptions = rawTransactions.map(r => r.description || r.merchant || 'transaction');
    const categories = await aiService.categorizeTransactions(descriptions);

    // 3. Save transactions
    const transactions = [];
    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      const amount = Math.abs(parseFloat(raw.amount) || 0);
      const type = raw.type || (parseFloat(raw.amount) < 0 ? 'debit' : 'credit');
      const t = await Transaction.create({
        userId,
        statementId,
        date: raw.date ? new Date(raw.date) : new Date(),
        description: raw.description || raw.merchant || 'Transaction',
        amount,
        type,
        category: categories[i] || 'Other',
      });
      transactions.push(t);
    }

    // 4. Analysis
    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const financialHealthScore = analysisService.calculateFinancialHealth(transactions);
    const categoryBreakdown = analysisService.getCategoryBreakdown(transactions);
    const recurringExpenses = analysisService.detectRecurringExpenses(transactions);
    const unusualPatterns = analysisService.detectUnusualPatterns(transactions);

    const analysis = { totalIncome, totalExpenses, financialHealthScore, categoryBreakdown, recurringExpenses, unusualPatterns };
    const aiSummary = await aiService.generateFinancialSummary(transactions, analysis);
    analysis.aiSummary = aiSummary;

    await Statement.findByIdAndUpdate(statementId, { status: 'completed', analysis });
  } catch (error) {
    console.error('Processing error:', error);
    await Statement.findByIdAndUpdate(statementId, { status: 'failed' });
  }
};


exports.getStatements = async (req, res) => {
  try {
    const statements = await Statement.find({ userId: req.user._id }).sort({ uploadDate: -1 });
    res.json({ statements });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch statements', error: error.message });
  }
};

exports.getStatementAnalysis = async (req, res) => {
  try {
    const statement = await Statement.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!statement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    const transactions = await Transaction.find({ statementId: statement._id });

    res.json({
      statement,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analysis', error: error.message });
  }
};

exports.deleteStatement = async (req, res) => {
  try {
    const statement = await Statement.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!statement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    await Transaction.deleteMany({ statementId: statement._id });

    res.json({ message: 'Statement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete statement', error: error.message });
  }
};
