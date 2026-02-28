import { Sparkles } from 'lucide-react';

export default function AIInsights({ insights }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-2">AI Financial Summary</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{insights.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.highlights.map((h, i) => (
              <div key={i} className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-100 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{h.label}</p>
                <p className="font-bold text-gray-900 text-sm">{h.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
