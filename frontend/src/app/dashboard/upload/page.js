'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2,
  X, Eye, Table, ArrowUpRight, ArrowDownRight, File, Copy, ClipboardCheck,
} from 'lucide-react';
import { statements } from '@/lib/api';

// ── Tiny copy-to-clipboard hook ───────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);
  return { copied, copy };
}

const CATEGORY_COLORS = {
  'Food & Dining': 'bg-orange-100 text-orange-700',
  'Income': 'bg-emerald-100 text-emerald-700',
  'Transportation': 'bg-blue-100 text-blue-700',
  'Shopping': 'bg-pink-100 text-pink-700',
  'Entertainment': 'bg-purple-100 text-purple-700',
  'Healthcare': 'bg-red-100 text-red-700',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-700',
};

function FileSizeLabel({ bytes }) {
  const kb = bytes / 1024;
  return <span>{kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`}</span>;
}

export default function UploadPage() {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);   // extracted data from backend
  const [tab, setTab] = useState('transactions'); // 'transactions' | 'raw'
  const { copied: copiedTx, copy: copyTx } = useCopy();
  const { copied: copiedRaw, copy: copyRaw } = useCopy();

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  };

  const pickFile = (f) => {
    const allowed = ['.pdf', '.csv', '.txt'];
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Only PDF, CSV, and TXT files are supported.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  };

  // ── Upload & Extract ────────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('statement', file);
      const { data } = await statements.extract(formData);
      setResult(data);
      setTab('transactions');
    } catch (err) {
      setError(err.response?.data?.message || 'Extraction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setLoading(false);
  };

  // ── File type icon ───────────────────────────────────────────────────────────
  const fileIcon = (name = '') => {
    const ext = name.split('.').pop().toLowerCase();
    const colors = { pdf: 'text-red-500', csv: 'text-emerald-500', txt: 'text-blue-500' };
    return <File className={`w-10 h-10 ${colors[ext] ?? 'text-gray-400'}`} />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Upload Statement</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload a bank statement (PDF, CSV, or TXT) — we'll extract the text and parse your transactions instantly.
        </p>
      </div>

      {/* Drop zone */}
      {!result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
              ${dragActive
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.csv,.txt"
              className="hidden"
              onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])}
            />

            {!file ? (
              /* Empty state */
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">Drag &amp; drop your file here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {['PDF', 'CSV', 'TXT'].map(t => (
                    <span key={t} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{t}</span>
                  ))}
                  <span className="text-xs text-gray-400">Max 10 MB</span>
                </div>
              </>
            ) : (
              /* File selected */
              <div className="space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-4">
                  {fileIcon(file.name)}
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-400"><FileSizeLabel bytes={file.size} /></p>
                  </div>
                  <button onClick={reset} className="ml-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Extracting content…</span>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleExtract}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500
                        text-white font-semibold rounded-xl shadow hover:shadow-md transition-all text-sm"
                    >
                      <Eye className="w-4 h-4" /> Extract &amp; Preview
                    </button>
                    <button
                      onClick={reset}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Extraction Results ── */}
      {result && (
        <div className="space-y-5">
          {/* Summary banner */}
          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{result.fileName}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  {result.fileType.toUpperCase()} · <FileSizeLabel bytes={result.fileSize} /> · {result.totalFound} transaction{result.totalFound !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              <Upload className="w-4 h-4" /> Upload Another
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'transactions' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Table className="w-4 h-4" /> Parsed Transactions
            </button>
            <button
              onClick={() => setTab('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'raw' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <FileText className="w-4 h-4" /> Raw Extracted Text
            </button>
          </div>

          {/* Tab content */}
          {tab === 'transactions' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Copy transactions as TSV */}
              {result.transactions.length > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">
                    {result.transactions.length} transaction{result.transactions.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={() => {
                      const header = 'Date\tDescription\tAmount\tType';
                      const rows = result.transactions.map((t, i) => {
                        const isCredit = t.type === 'credit' || (t.amount > 0 && t.type !== 'debit');
                        return `${t.date || '—'}\t${t.description || t.merchant || '—'}\t$${Math.abs(parseFloat(t.amount || 0)).toFixed(2)}\t${isCredit ? 'Credit' : 'Debit'}`;
                      });
                      copyTx([header, ...rows].join('\n'));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedTx
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                  >
                    {copiedTx
                      ? <><ClipboardCheck className="w-3.5 h-3.5" /> Copied!</>
                      : <><Copy className="w-3.5 h-3.5" /> Copy as TSV</>
                    }
                  </button>
                </div>
              )}
              {result.transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Table className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No structured transactions detected</p>
                  <p className="text-sm mt-1">Switch to <strong>Raw Extracted Text</strong> to see the full content</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.transactions.map((t, i) => {
                          const isCredit = t.type === 'credit' || (t.amount > 0 && t.type !== 'debit');
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                              <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                              <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{t.date || '—'}</td>
                              <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate" title={t.description || t.merchant}>
                                {t.description || t.merchant || '—'}
                              </td>
                              <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isCredit ? '+' : '-'}${Math.abs(parseFloat(t.amount || 0)).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                  }`}>
                                  {isCredit
                                    ? <ArrowUpRight className="w-3 h-3" />
                                    : <ArrowDownRight className="w-3 h-3" />}
                                  {isCredit ? 'Credit' : 'Debit'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
                    {result.transactions.length} transaction{result.transactions.length !== 1 ? 's' : ''} extracted from {result.fileName}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'raw' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Raw Extracted Text</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{result.rawText.length.toLocaleString()} characters</span>
                  <button
                    onClick={() => copyRaw(result.rawText)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedRaw
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                  >
                    {copiedRaw
                      ? <><ClipboardCheck className="w-3.5 h-3.5" /> Copied!</>
                      : <><Copy className="w-3.5 h-3.5" /> Copy Text</>
                    }
                  </button>
                </div>
              </div>
              <pre className="p-5 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[600px] overflow-y-auto bg-gray-50 rounded-b-2xl">
                {result.rawText || '(No readable text found in this file)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
