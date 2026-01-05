import React from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function StatCards({ totalIncome, totalExpenses, totalPaidThisMonth, currentMonth }) {
  const formattedMonth = currentMonth
    ? new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(currentMonth)
    : new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income Card */}
      <div className="bg-white dark:bg-card-bg dark:border dark:border-border-main p-5 rounded-[1.5rem] shadow-soft flex flex-col justify-between h-32 hover:-translate-y-1 hover:dark:border-border-accent transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#ECFDF5] dark:bg-konsensi-bg-green flex items-center justify-center text-green-600 dark:text-konsensi-primary">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 dark:bg-card-elevated px-2 py-1 rounded-full text-gray-500 dark:text-text-secondary dark:border dark:border-border-main">
            Dec 2025
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-text-secondary font-medium">Totaal Inkomen</p>
          <p className="text-2xl font-header font-bold text-konsensi-dark dark:text-white">
            {formatCurrency(totalIncome || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-white dark:bg-card-bg dark:border dark:border-border-main p-5 rounded-[1.5rem] shadow-soft flex flex-col justify-between h-32 hover:-translate-y-1 hover:dark:border-border-accent transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#FFF1F2] dark:bg-accent-red/10 flex items-center justify-center text-rose-500 dark:text-accent-red">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 dark:bg-card-elevated px-2 py-1 rounded-full text-gray-500 dark:text-text-secondary dark:border dark:border-border-main">
            Dec 2025
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-text-secondary font-medium">Uitgaven</p>
          <p className="text-2xl font-header font-bold text-konsensi-dark dark:text-white">
            {formatCurrency(totalExpenses || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Paid Off Card */}
      <div className="bg-white dark:bg-card-bg p-5 rounded-[1.5rem] shadow-soft border-2 border-primary/20 dark:border-konsensi-primary/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-primary/20 dark:bg-konsensi-bg-green flex items-center justify-center text-primary dark:text-konsensi-primary">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <span className="text-[10px] font-bold bg-primary dark:bg-konsensi-primary text-konsensi-dark dark:text-black px-2 py-1 rounded-full">
            Deze Maand
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-text-secondary font-medium">Afbetaald</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-header font-bold text-konsensi-dark dark:text-white">
              {formatCurrency(totalPaidThisMonth || 0, { decimals: 0 })}
            </p>
            <span className="text-xs font-bold text-primary dark:text-konsensi-primary bg-konsensi-dark/90 dark:bg-konsensi-bg-green dark:border dark:border-konsensi-primary/20 px-2 py-0.5 rounded-md">
              Trots!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
