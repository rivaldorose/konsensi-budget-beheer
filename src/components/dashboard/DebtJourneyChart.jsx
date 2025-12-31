import React, { useState } from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function DebtJourneyChart({ monthlyData = [], totalPaid = 0, progressPercentage = 0 }) {
  const [viewMode, setViewMode] = useState("month");

  // Default data if none provided (6 months)
  const defaultData = [
    { month: "Jul", amount: 1840 },
    { month: "Aug", amount: 2400 },
    { month: "Sep", amount: 1400 },
    { month: "Okt", amount: 3000 },
    { month: "Nov", amount: 2200 },
    { month: "Dec", amount: 3414 },
  ];

  const chartData = monthlyData.length > 0 ? monthlyData : defaultData;
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 4000);

  // Calculate bar heights as percentages
  const bars = chartData.map((item) => ({
    ...item,
    height: (item.amount / maxAmount) * 100,
  }));

  return (
    <div className="bg-white rounded-[24px] p-8 flex flex-col gap-6" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-header text-[24px] font-bold text-[#3D6456]">Schuldenreis</h3>
          <p className="font-body text-[14px] text-gray-500">Je bent goed op weg naar €0!</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              viewMode === "month"
                ? "bg-[#10B981] shadow-sm text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            Maand
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              viewMode === "week"
                ? "bg-[#10B981] shadow-sm text-white"
                : "text-gray-500 hover:bg-gray-200"
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-3xl font-header font-extrabold text-[#10B981] tracking-tight">
            {formatCurrency(totalPaid || 0)}
          </p>
          <p className="text-sm text-gray-500 font-bold">Totaal Afbetaald</p>
        </div>
        <div className="mb-1 px-3 py-1 bg-purple-100 text-[#8B5CF6] rounded-full text-xs font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">trending_up</span>
          Voortgang: {Math.round(progressPercentage || 0)}%
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80 relative flex items-end justify-between px-2 pt-8">
        {/* Y-axis labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pr-4">
          {[4000, 3000, 2000, 1000, 0].map((value) => (
            <div key={value} className="border-t border-gray-100 w-full relative h-0">
              <span className="absolute -top-3 -left-8 text-xs text-gray-400 w-6 text-right">
                {formatCurrency(value, { decimals: 0 })}
              </span>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="w-full flex justify-between items-end h-full z-10 pl-8 pb-8 gap-6">
          {bars.map((bar, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
              <div className="relative w-full max-w-[70px] bg-[#E5E7EB] rounded-[40px] h-full overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#3D6456] to-[#B2FF78] rounded-[40px] transition-all duration-500 ease-out group-hover:opacity-90"
                  style={{ height: `${bar.height}%` }}
                ></div>
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20 transition-opacity">
                  {formatCurrency(bar.amount)}
                </div>
              </div>
              <span className="mt-3 text-sm font-medium text-gray-500">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

