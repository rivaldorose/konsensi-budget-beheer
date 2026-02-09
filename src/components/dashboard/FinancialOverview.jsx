import React from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function FinancialOverview({ totalIncome = 0, fixedCosts = 0, paymentPlans = 0, pots = 0 }) {
  // Calculate percentages for donut chart based on actual data
  const total = fixedCosts + paymentPlans + pots;
  const freeToSpend = Math.max(0, totalIncome - total);

  const fixedCostsPercent = totalIncome > 0 ? (fixedCosts / totalIncome) * 100 : 0;
  const paymentPlansPercent = totalIncome > 0 ? (paymentPlans / totalIncome) * 100 : 0;
  const potsPercent = totalIncome > 0 ? (pots / totalIncome) * 100 : 0;
  const freeToSpendPercent = totalIncome > 0 ? (freeToSpend / totalIncome) * 100 : 0;

  // Cumulative stops for conic-gradient
  const stop1 = fixedCostsPercent;
  const stop2 = stop1 + paymentPlansPercent;
  const stop3 = stop2 + potsPercent;

  const lightGradient = totalIncome > 0
    ? `conic-gradient(
        #3D6456 0% ${stop1}%,
        #B2FF78 ${stop1}% ${stop2}%,
        #f59e0b ${stop2}% ${stop3}%,
        #E5E7EB ${stop3}% 100%
      )`
    : '#E5E7EB';

  const darkGradient = totalIncome > 0
    ? `conic-gradient(
        #059669 0% ${stop1}%,
        #34d399 ${stop1}% ${stop2}%,
        #d97706 ${stop2}% ${stop3}%,
        #2a2a2a ${stop3}% 100%
      )`
    : '#2a2a2a';

  return (
    <div className="bg-white dark:bg-card-bg rounded-[2rem] p-6 shadow-soft border border-transparent dark:border-border-main">
      <h3 className="font-header text-lg font-bold text-konsensi-dark dark:text-white mb-4">Financieel Overzicht</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative size-40 flex-shrink-0">
          {/* Light mode donut */}
          <div
            className="w-full h-full rounded-full dark:hidden"
            style={{ background: lightGradient }}
          ></div>
          {/* Dark mode donut */}
          <div
            className="hidden dark:block w-full h-full rounded-full absolute inset-0"
            style={{ background: darkGradient }}
          ></div>
          <div className="absolute inset-4 bg-white dark:bg-card-bg rounded-full flex flex-col items-center justify-center shadow-inner border border-transparent dark:border-border-main">
            <span className="text-xs text-gray-500 dark:text-text-tertiary font-bold">Inkomen</span>
            <span className="text-xl font-header font-bold text-konsensi-dark dark:text-white">
              {formatCurrency(totalIncome, { decimals: 0 })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-konsensi-dark dark:bg-konsensi-dark-green"></span>
              <span className="text-gray-600 dark:text-text-secondary">Vaste Lasten</span>
            </div>
            <span className="font-bold text-konsensi-dark dark:text-white">{formatCurrency(fixedCosts, { decimals: 0 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-primary dark:bg-konsensi-hover"></span>
              <span className="text-gray-600 dark:text-text-secondary">Regelingen</span>
            </div>
            <span className="font-bold text-konsensi-dark dark:text-white">{formatCurrency(paymentPlans, { decimals: 0 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-amber-500 dark:bg-amber-600"></span>
              <span className="text-gray-600 dark:text-text-secondary">Potjes</span>
            </div>
            <span className="font-bold text-konsensi-dark dark:text-white">{formatCurrency(pots, { decimals: 0 })}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-gray-200 dark:bg-[#2a2a2a]"></span>
              <span className="text-gray-600 dark:text-text-secondary">Vrij te besteden</span>
            </div>
            <span className="font-bold text-konsensi-dark dark:text-white">{formatCurrency(freeToSpend, { decimals: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
