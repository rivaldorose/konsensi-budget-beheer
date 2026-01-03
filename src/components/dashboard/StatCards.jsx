import React from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function StatCards({ totalIncome, totalExpenses, totalPaidThisMonth, currentMonth }) {
  const formattedMonth = currentMonth
    ? new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(currentMonth)
    : new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income Card */}
      <div className="bg-white dark:bg-[#1a2c26] p-5 rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#ECFDF5] dark:bg-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 dark:bg-[#2A3F36] px-2 py-1 rounded-full text-[#6B7280] dark:text-[#9CA3AF]">
            {formattedMonth}
          </span>
        </div>
        <div>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] font-medium">Totaal Inkomen</p>
          <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
            {formatCurrency(totalIncome || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-white dark:bg-[#1a2c26] p-5 rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#FFF1F2] dark:bg-red-500/20 flex items-center justify-center text-red-500">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 dark:bg-[#2A3F36] px-2 py-1 rounded-full text-[#6B7280] dark:text-[#9CA3AF]">
            {formattedMonth}
          </span>
        </div>
        <div>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] font-medium">Uitgaven</p>
          <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
            {formatCurrency(totalExpenses || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Paid Off Card */}
      <div className="bg-white dark:bg-[#1a2c26] p-5 rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border-2 border-primary/20 dark:border-primary/30 flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <span className="text-[10px] font-bold bg-primary text-white px-2 py-1 rounded-full">
            Deze Maand
          </span>
        </div>
        <div>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] font-medium">Afbetaald</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
              {formatCurrency(totalPaidThisMonth || 0, { decimals: 0 })}
            </p>
            <span className="text-xs font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
              Trots!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

