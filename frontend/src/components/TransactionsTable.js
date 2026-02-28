export default function TransactionsTable({ transactions }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Recent Transactions</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Merchant</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="border-b border-gray-50 hover:bg-emerald-50/40 transition-colors"
              >
                <td className="py-3 px-4 text-gray-400 whitespace-nowrap">{t.date}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{t.merchant}</td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg">
                    {t.category}
                  </span>
                </td>
                <td className={`py-3 px-4 text-right font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
