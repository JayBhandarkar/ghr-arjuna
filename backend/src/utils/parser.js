const pdfParse = require('pdf-parse');

// ── PDF → raw text ────────────────────────────────────────────────────────────
exports.extractTextFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

// ── Plain text / .txt ─────────────────────────────────────────────────────────
exports.extractTextFromTXT = (buffer) => {
  return buffer.toString('utf-8');
};

// ── CSV → raw text ────────────────────────────────────────────────────────────
exports.extractTextFromCSV = (buffer) => {
  return buffer.toString('utf-8');
};

// ── Parse CSV text → transaction rows ──────────────────────────────────────────
exports.parseCSV = (buffer) => {
  const text = buffer.toString('utf-8');
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('Invalid CSV format');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const transaction = {};
    headers.forEach((header, index) => {
      transaction[header] = values[index]?.trim();
    });
    if (transaction.date && transaction.amount) {
      transactions.push(transaction);
    }
  }
  return transactions;
};

// ── Extract transactions from raw text (PDF / TXT) ────────────────────────────
exports.extractTransactions = (text) => {
  const transactions = [];
  const lines = text.split('\n');

  const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
  const amountPattern = /(\d[\d,]*\.?\d{0,2})/;

  lines.forEach(line => {
    const dateMatch = line.match(datePattern);
    const amountMatch = line.match(amountPattern);

    if (dateMatch && amountMatch) {
      const description = line
        .replace(datePattern, '')
        .replace(amountPattern, '')
        .replace(/[|]{1,}/g, ' ')
        .trim();

      transactions.push({
        date: dateMatch[1],
        description: description || 'Transaction',
        amount: parseFloat(amountMatch[1].replace(',', '')),
      });
    }
  });

  return transactions;
};

// ── Detect file type from mimetype ───────────────────────────────────────────
exports.getFileType = (mimetype, originalname) => {
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('csv') || originalname.endsWith('.csv')) return 'csv';
  if (mimetype.includes('text') || originalname.endsWith('.txt')) return 'txt';
  return 'unknown';
};
