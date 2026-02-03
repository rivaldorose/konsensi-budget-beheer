import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/components/utils/formatters';

export default function DebtJourneyWidget({
  debts = [],
  totalPaid = 0,
  paymentCount = 0,
  payments = [],
  onViewAll
}) {
  const [viewMode, setViewMode] = useState('month');

  const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const overallProgress = totalDebt > 0 ? Math.min((totalPaid / (totalDebt + totalPaid)) * 100, 100) : 0;

  // Streak calculation (simplified - based on payments)
  const streak = Math.min(paymentCount, 12);

  // Average monthly payment (simplified calculation)
  const avgMonthlyPayment = paymentCount > 0 ? totalPaid / Math.max(paymentCount / 2, 1) : 0;

  // Generate monthly chart data from payments
  const chartData = useMemo(() => {
    const now = new Date();
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        month: monthNames[date.getMonth()],
        monthKey,
        amount: 0
      });
    }

    // Sum payments by month
    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        if (payment.payment_date) {
          const paymentDate = new Date(payment.payment_date);
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
          const monthData = months.find(m => m.monthKey === monthKey);
          if (monthData) {
            monthData.amount += payment.amount || 0;
          }
        }
      });
    }

    return months;
  }, [payments]);

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1000);

  // Calculate bar heights as percentages
  const bars = chartData.map(item => ({
    ...item,
    height: maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
  }));

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-100 dark:bg-[#1a2e26] flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">trending_up</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1F2937] dark:text-white">Jouw Schuldreis</h3>
            <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">
              {totalPaid > 0 && overallProgress >= 50
                ? 'Je bent goed op weg naar €0!'
                : totalPaid > 0
                ? `Al ${formatCurrency(totalPaid)} afgelost. Ga zo door!`
                : 'Registreer je eerste betaling om te starten.'}
            </p>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex bg-gray-100 dark:bg-[#2a2a2a] rounded-full p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
              viewMode === 'month'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Maand
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
              viewMode === 'week'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <p className="text-2xl font-extrabold text-emerald-500 tracking-tight">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-sm text-gray-500 dark:text-[#a1a1a1] font-medium">Totaal Afbetaald</p>
        </div>
        <div className="mb-1 px-3 py-1 bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          Voortgang: {Math.round(overallProgress)}%
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-48 relative flex items-end justify-between px-2 pt-6">
        {/* Y-axis labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pr-4">
          {[maxAmount, maxAmount * 0.75, maxAmount * 0.5, maxAmount * 0.25, 0].map((value, idx) => (
            <div key={idx} className="border-t border-gray-100 dark:border-[#2a2a2a] w-full relative h-0">
              <span className="absolute -top-2.5 -left-1 text-[10px] text-gray-400 dark:text-[#666] w-8 text-right">
                €{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="w-full flex justify-between items-end h-full z-10 pl-10 pb-8 gap-3">
          {bars.map((bar, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
              <div className="relative w-full max-w-[50px] bg-gray-100 dark:bg-[#2a2a2a] rounded-[20px] h-full overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#3D6456] to-[#10B981] dark:from-[#1a4a3a] dark:to-emerald-400 rounded-[20px] transition-all duration-500 ease-out group-hover:opacity-90"
                  style={{ height: `${Math.max(bar.height, bar.amount > 0 ? 5 : 0)}%` }}
                />
                {bar.amount > 0 && (
                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-[#333] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity font-medium">
                    {formatCurrency(bar.amount)}
                  </div>
                )}
              </div>
              <span className="mt-2 text-xs font-medium text-gray-500 dark:text-[#a1a1a1]">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="flex gap-3 mt-4">
        {/* Streak */}
        <div className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border border-gray-100 dark:border-[#2a2a2a] flex items-center gap-3">
          <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">local_fire_department</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F2937] dark:text-white">{streak}</p>
            <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Streak</p>
          </div>
        </div>

        {/* Average */}
        <div className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border border-gray-100 dark:border-[#2a2a2a] flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-500 text-[20px]">show_chart</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1F2937] dark:text-white">{formatCurrency(avgMonthlyPayment)}</p>
            <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Gem./mnd</p>
          </div>
        </div>
      </div>

      {/* View All Button */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-3 px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-[#1F2937] dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">emoji_events</span>
          Bekijk alle prestaties
        </button>
      )}
    </div>
  );
}
