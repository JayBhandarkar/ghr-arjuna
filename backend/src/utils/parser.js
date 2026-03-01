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
  // Amount: commas allowed, optional decimal, optional leading minus
  const amountPattern = /(-?\d[\d,]*\.\d{2}|-?\d[\d,]{2,})/;

  // Keywords that indicate a debit transaction
  const debitKeywords = /\b(dr\.?|debit|withdrawal|withdraw|paid|payment|purchase|expense|spent)\b/i;
  // Keywords that indicate a credit transaction
  const creditKeywords = /\b(cr\.?|credit|deposit|received|salary|income|refund|transfer in)\b/i;

  lines.forEach(line => {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) return;

    // ── Search for amount AFTER the date to avoid matching date digits ──────
    const dateEnd = line.indexOf(dateMatch[1]) + dateMatch[1].length;
    const lineAfterDate = line.slice(dateEnd);
    const amountMatch = lineAfterDate.match(amountPattern);
    if (!amountMatch) return;

    const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(rawAmount) || rawAmount === 0) return;

    // Determine type: keyword-based first, then sign of amount
    let type;
    if (debitKeywords.test(line)) {
      type = 'debit';
    } else if (creditKeywords.test(line)) {
      type = 'credit';
    } else {
      type = rawAmount < 0 ? 'debit' : 'credit';
    }

    // Build description: remove date, remove the matched amount, strip separators
    const description = line
      .replace(datePattern, '')
      .replace(amountMatch[1], '')        // remove only the matched amount string
      .replace(/\|+/g, ' ')               // strip pipe separators
      .replace(/\b(dr\.?|cr\.?)\b/gi, '') // strip bare Dr/Cr labels
      .replace(/\s{2,}/g, ' ')
      .trim();

    transactions.push({
      date: dateMatch[1],
      description: description || 'Transaction',
      amount: Math.abs(rawAmount),
      type,
    });
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
