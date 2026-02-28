export default function FinancialScore({ score }) {
  const getColor = (s) => {
    if (s >= 80) return { text: 'text-emerald-600', ring: '#10b981', label: 'Excellent', bg: 'bg-emerald-50' };
    if (s >= 60) return { text: 'text-yellow-500', ring: '#f59e0b', label: 'Good', bg: 'bg-yellow-50' };
    if (s >= 40) return { text: 'text-orange-500', ring: '#f97316', label: 'Fair', bg: 'bg-orange-50' };
    return { text: 'text-red-500', ring: '#ef4444', label: 'Needs Work', bg: 'bg-red-50' };
  };

  const sc = getColor(score);
  const circ = 2 * Math.PI * 38;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all duration-300">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Financial Health Score</p>
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" stroke="#e5e7eb" strokeWidth="8" fill="none" />
            <circle
              cx="44" cy="44" r="38"
              stroke={sc.ring}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-black ${sc.text}`}>{score}</span>
          </div>
        </div>
        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${sc.text} ${sc.bg}`}>
          {sc.label}
        </span>
      </div>
    </div>
  );
}
