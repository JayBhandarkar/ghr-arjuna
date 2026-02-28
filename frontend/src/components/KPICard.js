export default function KPICard({ title, value, description, icon: Icon, trend }) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trend > 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
            }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mb-0.5">{value}</h3>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}
