import { formatINR } from '@/lib/formatINR';

export default function RecurringPayments({ payments }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow h-full">
      <h3 className="text-base font-semibold text-gray-900 mb-5">Recurring Payments</h3>
      <div className="space-y-3">
        {payments.map((payment, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all duration-200 cursor-default group"
          >
            <div>
              <p className="font-semibold text-gray-900 text-sm group-hover:text-emerald-800">{payment.merchant}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                {payment.frequency}
              </span>
            </div>
            <p className="text-base font-bold text-gray-900">{formatINR(payment.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
