const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'csv', 'image'],
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  analysis: {
    totalIncome: Number,
    totalExpenses: Number,
    financialHealthScore: Number,
    categoryBreakdown: mongoose.Schema.Types.Mixed,
    recurringExpenses: [mongoose.Schema.Types.Mixed],
    unusualPatterns: [mongoose.Schema.Types.Mixed],
    aiSummary: String
  }
});

module.exports = mongoose.model('Statement', statementSchema);
