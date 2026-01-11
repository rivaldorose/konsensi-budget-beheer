import React, { useState } from 'react';
import { formatCurrency } from '@/components/utils/formatters';

export default function DebtJourneyWidget({
  debts = [],
  totalPaid = 0,
  paymentCount = 0,
  onViewAll
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');

  const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const clearedDebts = debts.filter(d => d.status === 'afbetaald').length;
  const overallProgress = totalDebt > 0 ? Math.min((totalPaid / (totalDebt + totalPaid)) * 100, 100) : 0;

  // Streak calculation (simplified - based on payments)
  const streak = Math.min(paymentCount, 12);

  // Average monthly payment (simplified calculation)
  const avgMonthlyPayment = paymentCount > 0 ? totalPaid / Math.max(paymentCount / 2, 1) : 0;

  // Generate chart data points (6 months of sample data)
  const generateChartPath = () => {
    const points = [
      { x: 0, y: 100 },
      { x: 16.6, y: 85 },
      { x: 33.3, y: 70 },
      { x: 50, y: 55 },
      { x: 66.6, y: 40 },
      { x: 83.3, y: 25 },
      { x: 100, y: Math.max(100 - overallProgress, 10) }
    ];

    const pathPoints = points.map((p, i) => {
      const x = (p.x / 100) * 280 + 20;
      const y = (p.y / 100) * 80 + 10;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    return pathPoints;
  };

  // Progress circle calculations
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const progressOffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-emerald-100 dark:bg-[#1a2e26] flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-500 text-[20px]">trending_up</span>
          </div>
          <h3 className="font-semibold text-lg text-[#1F2937] dark:text-white">Jouw Schuldreis</h3>
        </div>

        {/* Period Selector */}
        <div className="flex bg-gray-100 dark:bg-[#2a2a2a] rounded-full p-1">
          {['6m', '1j', 'Totaal'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                selectedPeriod === period
                  ? 'bg-white dark:bg-[#3a3a3a] text-[#1F2937] dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-28 mb-6">
        <svg className="w-full h-full" viewBox="0 0 320 100" preserveAspectRatio="none">
          {/* Grid Lines */}
          <line x1="20" y1="30" x2="300" y2="30" stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-[#2a2a2a]" strokeDasharray="4 4" />
          <line x1="20" y1="50" x2="300" y2="50" stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-[#2a2a2a]" strokeDasharray="4 4" />
          <line x1="20" y1="70" x2="300" y2="70" stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-[#2a2a2a]" strokeDasharray="4 4" />

          {/* Chart Line */}
          <path
            d={generateChartPath()}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {[0, 16.6, 33.3, 50, 66.6, 83.3, 100].map((x, i) => {
            const progress = [100, 85, 70, 55, 40, 25, Math.max(100 - overallProgress, 10)];
            const cx = (x / 100) * 280 + 20;
            const cy = (progress[i] / 100) * 80 + 10;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="4"
                fill="#10b981"
                className="drop-shadow-sm"
              />
            );
          })}
        </svg>

        {/* Month Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 dark:text-[#a1a1a1]">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mrt</span>
          <span>Apr</span>
          <span>Mei</span>
          <span>Jun</span>
          <span>Jul</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Paid */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-4 border border-gray-100 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Totaal Afbetaald</p>
          <p className="text-lg font-bold text-emerald-500">{formatCurrency(totalPaid)}</p>
        </div>

        {/* Progress Circle */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-4 border border-gray-100 dark:border-[#2a2a2a] flex flex-col items-center justify-center">
          <div className="relative size-14">
            <svg className="size-14 -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-[#2a2a2a]"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r={circleRadius}
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-[#1F2937] dark:text-white">{Math.round(overallProgress)}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mt-1">Voortgang</p>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-2">
          {/* Streak */}
          <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border border-gray-100 dark:border-[#2a2a2a] flex items-center gap-2">
            <div className="size-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-500 text-[16px]">local_fire_department</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2937] dark:text-white">{streak}</p>
              <p className="text-[10px] text-gray-500 dark:text-[#a1a1a1]">Streak</p>
            </div>
          </div>

          {/* Average */}
          <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border border-gray-100 dark:border-[#2a2a2a] flex items-center gap-2">
            <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[16px]">show_chart</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2937] dark:text-white">{formatCurrency(avgMonthlyPayment)}</p>
              <p className="text-[10px] text-gray-500 dark:text-[#a1a1a1]">Gem./mnd</p>
            </div>
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
