import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function DebtJourneyChart({ monthlyData = [], weeklyData = [], totalPaid = 0, progressPercentage = 0 }) {
  const [viewMode, setViewMode] = useState("month");

  // Default empty data if none provided (6 months with zero amounts)
  const defaultMonthlyData = [
    { month: "Aug", amount: 0 },
    { month: "Sep", amount: 0 },
    { month: "Okt", amount: 0 },
    { month: "Nov", amount: 0 },
    { month: "Dec", amount: 0 },
    { month: "Jan", amount: 0 },
  ];

  // Default weekly data (last 6 weeks)
  const defaultWeeklyData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      const weekNum = getWeekNumber(weekDate);
      weeks.push({ month: `Wk ${weekNum}`, amount: 0 });
    }
    return weeks;
  }, []);

  // Helper function to get week number
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Select data based on view mode
  const chartData = viewMode === "month"
    ? (monthlyData.length > 0 ? monthlyData : defaultMonthlyData)
    : (weeklyData.length > 0 ? weeklyData : defaultWeeklyData);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 4000);

  // Calculate bar heights as percentages
  const bars = chartData.map((item) => ({
    ...item,
    height: (item.amount / maxAmount) * 100,
  }));

  return (
    <div className="bg-white dark:bg-card-bg rounded-[24px] p-8 flex flex-col gap-6 border border-transparent dark:border-border-main shadow-card">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-header text-[24px] font-bold text-[#3D6456] dark:text-white">Schuldenreis</h3>
          <p className="font-body text-[14px] text-gray-500 dark:text-text-secondary">Je bent goed op weg naar €0!</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-card-elevated p-1 rounded-full border border-transparent dark:border-border-main">
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              viewMode === "month"
                ? "bg-[#10B981] dark:bg-konsensi-primary shadow-sm text-white dark:text-black"
                : "text-gray-500 dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-white/5"
            }`}
          >
            Maand
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              viewMode === "week"
                ? "bg-[#10B981] dark:bg-konsensi-primary shadow-sm text-white dark:text-black"
                : "text-gray-500 dark:text-text-secondary hover:bg-gray-200 dark:hover:bg-white/5"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-3xl font-header font-extrabold text-[#10B981] dark:text-konsensi-primary tracking-tight">
            {formatCurrency(totalPaid || 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-text-secondary font-bold">Totaal Afbetaald</p>
        </div>
        <div className="mb-1 px-3 py-1 bg-purple-100 dark:bg-accent-purple/15 text-[#8B5CF6] dark:text-accent-purple rounded-full text-xs font-bold flex items-center gap-1 border border-transparent dark:border-accent-purple/20">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          Voortgang: {Math.round(progressPercentage || 0)}%
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80 relative flex items-end justify-between px-2 pt-8">
        {/* Y-axis labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pr-4">
          {[4000, 3000, 2000, 1000, 0].map((value) => (
            <div key={value} className="border-t border-gray-100 dark:border-border-main w-full relative h-0">
              <span className="absolute -top-3 -left-8 text-xs text-gray-400 dark:text-text-tertiary w-6 text-right">
                €{value / 1000}k
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="w-full flex justify-between items-end h-full z-10 pl-8 pb-8 gap-6">
          {bars.map((bar, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
              <div className="relative w-full max-w-[70px] bg-[#E5E7EB] dark:bg-card-elevated rounded-[40px] h-full overflow-hidden border border-transparent dark:border-border-main/50">
                <div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#3D6456] to-[#B2FF78] dark:from-konsensi-dark-green dark:to-konsensi-primary rounded-[40px] transition-all duration-500 ease-out group-hover:opacity-90 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  style={{ height: `${bar.height}%` }}
                ></div>
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-card-elevated dark:border dark:border-border-accent text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity font-mono">
                  {formatCurrency(bar.amount)}
                </div>
              </div>
              <span className="mt-3 text-sm font-medium text-gray-500 dark:text-text-secondary">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
