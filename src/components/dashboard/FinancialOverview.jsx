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

  return (
    <div className="bg-white dark:bg-card-bg rounded-[2rem] p-6 shadow-soft border border-transparent dark:border-border-main">
      <h3 className="font-header text-lg font-bold text-konsensi-dark dark:text-white mb-4">Financieel Overzicht</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative size-40 flex-shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(
                #3D6456 0% ${fixedCostsPercent}%,
                #B2FF78 ${fixedCostsPercent}% ${fixedCostsPercent + paymentPlansPercent}%,
                #E5E7EB ${fixedCostsPercent + paymentPlansPercent}% 100%
              )`
            }}
          ></div>
          {/* Dark mode donut */}
          <div
            className="dark:block hidden w-full h-full rounded-full absolute inset-0"
            style={{
              background: `conic-gradient(
                #059669 0% ${fixedCostsPercent}%,
                #34d399 ${fixedCostsPercent}% ${fixedCostsPercent + paymentPlansPercent}%,
                #2a2a2a ${fixedCostsPercent + paymentPlansPercent}% 100%
              )`
            }}
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
              <span className="size-3 rounded-full bg-gray-200 dark:bg-card-elevated"></span>
              <span className="text-gray-600 dark:text-text-secondary">Potjes</span>
            </div>
            <span className="font-bold text-konsensi-dark dark:text-white">{formatCurrency(pots, { decimals: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
