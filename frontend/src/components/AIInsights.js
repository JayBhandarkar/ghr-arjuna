'use client';

import { Zap } from 'lucide-react';

// ── Section icons ─────────────────────────────────────────────────────────────
const SECTION_ICONS = {
  '1': '💰', '2': '📊', '3': '🏷️', '4': '🔄', '5': '⚠️', '6': '✅',
};

/**
 * Parse Gemini's structured output into sections:
 *   **1. Heading**
 *   • bullet one
 *   • bullet two
 */
function parseSections(text = '') {
  if (!text) return null;

  const sections = [];
  // Split on bold headings like **1. Title** or **Title**
  const blocks = text.split(/\*\*(\d+\.\s*[^*]+)\*\*/g);

  // blocks alternates between: prefix, heading, content, heading, content, ...
  for (let i = 1; i < blocks.length; i += 2) {
    const heading = blocks[i].trim();
    const body = (blocks[i + 1] || '').trim();
    const number = heading.match(/^(\d+)/)?.[1] || '';
    const title = heading.replace(/^\d+\.\s*/, '');
    const bullets = body
      .split('\n')
      .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);
    if (title) sections.push({ number, title, bullets });
  }

  return sections.length > 0 ? sections : null;
}

// ── Section colour map ────────────────────────────────────────────────────────
const SECTION_COLORS = [
  'bg-emerald-50 border-emerald-100',
  'bg-blue-50    border-blue-100',
  'bg-purple-50  border-purple-100',
  'bg-orange-50  border-orange-100',
  'bg-red-50     border-red-100',
  'bg-teal-50    border-teal-100',
];

// ── Main component ────────────────────────────────────────────────────────────
export default function AIInsights({ insights }) {
  const isLLM = insights?.isGemini;
  const sections = isLLM ? parseSections(insights.summary) : null;

  return (
    <div className={`rounded-2xl p-6 shadow-sm border transition-all duration-300 ${isLLM
        ? 'bg-gradient-to-br from-violet-50 via-slate-50 to-teal-50 border-violet-200'
        : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
      }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl shadow-md shrink-0 ${isLLM
            ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
            : 'bg-gradient-to-br from-emerald-400 to-teal-500'
          }`}>
          <Zap className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <h3 className="text-base font-bold text-gray-900">AI Financial Summary</h3>
            {isLLM && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 border border-violet-200 text-violet-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5" />
                Powered by LLM
              </span>
            )}
          </div>

          {/* ── Structured sections (when Gemini returns bullet format) ── */}
          {sections ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sections.map((sec, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${SECTION_COLORS[i % SECTION_COLORS.length]}`}
                >
                  {/* Section heading */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{SECTION_ICONS[sec.number] || '📌'}</span>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {sec.title}
                    </span>
                  </div>
                  {/* Bullets */}
                  <ul className="space-y-1">
                    {sec.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            /* ── Fallback: plain text summary ── */
            <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
              {insights.summary}
            </p>
          )}

          {/* ── Highlight chips ── */}
          {insights.highlights?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {insights.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm"
                >
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {h.label}
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{h.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
