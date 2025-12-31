import React from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function StatCards({ totalIncome, totalExpenses, totalPaidThisMonth, currentMonth }) {
  const formattedMonth = currentMonth
    ? new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(currentMonth)
    : new Intl.DateTimeFormat("nl-NL", { month: "short", year: "numeric" }).format(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income Card */}
      <div className="bg-white p-5 rounded-[1.5rem] shadow-soft flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-green-600">
            <span className="material-symbols-outlined">calendar_month</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500">
            {formattedMonth}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Totaal Inkomen</p>
          <p className="text-2xl font-header font-bold text-konsensi-dark">
            {formatCurrency(totalIncome || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="bg-white p-5 rounded-[1.5rem] shadow-soft flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-[#FFF1F2] flex items-center justify-center text-rose-500">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-500">
            {formattedMonth}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Uitgaven</p>
          <p className="text-2xl font-header font-bold text-konsensi-dark">
            {formatCurrency(totalExpenses || 0, { decimals: 0 })}
          </p>
        </div>
      </div>

      {/* Paid Off Card */}
      <div className="bg-white p-5 rounded-[1.5rem] shadow-soft flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300 border-2 border-primary/20">
        <div className="flex justify-between items-start">
          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-konsensi-dark">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <span className="text-[10px] font-bold bg-primary text-konsensi-dark px-2 py-1 rounded-full">
            Deze Maand
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Afbetaald</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-header font-bold text-konsensi-dark">
              {formatCurrency(totalPaidThisMonth || 0, { decimals: 0 })}
            </p>
            <span className="text-xs font-bold text-primary bg-konsensi-dark/90 px-2 py-0.5 rounded-md">
              Trots!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

