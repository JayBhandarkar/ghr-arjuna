const Statement = require('../models/Statement');
const Transaction = require('../models/Transaction');
const parser = require('../utils/parser');
const aiService = require('../services/aiService');
const analysisService = require('../services/analysisService');

// ── NEW: Extract text + parse transactions immediately, return synchronously ──
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

    res.json({
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      rawText: rawText.trim(),
      transactions,
      totalFound: transactions.length,
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

    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' :
      req.file.mimetype.includes('csv') ? 'csv' : 'image';

    const statement = await Statement.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileType,
      status: 'processing'
    });

    processStatement(statement._id, req.file.buffer, fileType, req.user._id);

    res.status(202).json({
      message: 'Statement uploaded successfully',
      statementId: statement._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

const processStatement = async (statementId, buffer, fileType, userId) => {
  try {
    let rawTransactions = fileType === 'pdf'
      ? await parser.parsePDF(buffer)
      : parser.parseCSV(buffer);

    const transactions = [];

    for (const raw of rawTransactions) {
      const amount = Math.abs(parseFloat(raw.amount));
      const type = raw.type || (raw.amount < 0 ? 'debit' : 'credit');
      const category = await aiService.categorizeTransaction(raw.description, amount);

      const transaction = await Transaction.create({
        userId,
        statementId,
        date: new Date(raw.date),
        description: raw.description,
        amount,
        type,
        category
      });

      transactions.push(transaction);
    }

    const totalIncome = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const financialHealthScore = analysisService.calculateFinancialHealth(transactions);
    const categoryBreakdown = analysisService.getCategoryBreakdown(transactions);
    const recurringExpenses = analysisService.detectRecurringExpenses(transactions);
    const unusualPatterns = analysisService.detectUnusualPatterns(transactions);

    const analysis = {
      totalIncome,
      totalExpenses,
      financialHealthScore,
      categoryBreakdown,
      recurringExpenses,
      unusualPatterns
    };

    const aiSummary = await aiService.generateFinancialSummary(transactions, analysis);
    analysis.aiSummary = aiSummary;

    await Statement.findByIdAndUpdate(statementId, {
      status: 'completed',
      analysis
    });
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
