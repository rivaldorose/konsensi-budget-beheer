import React from "react";
import { formatCurrency } from "@/components/utils/formatters";

export default function FinancialOverview({ totalIncome = 0, fixedCosts = 0, paymentPlans = 0, pots = 0 }) {
  // Calculate percentages for donut chart
  const total = fixedCosts + paymentPlans + pots;
  const freeToSpend = Math.max(0, totalIncome - total);

  const fixedCostsPercent = totalIncome > 0 ? (fixedCosts / totalIncome) * 100 : 0;
  const paymentPlansPercent = totalIncome > 0 ? (paymentPlans / totalIncome) * 100 : 0;
  const potsPercent = totalIncome > 0 ? (pots / totalIncome) * 100 : 0;
  const freeToSpendPercent = totalIncome > 0 ? (freeToSpend / totalIncome) * 100 : 0;

  // Build conic-gradient string
  let currentPercent = 0;
  const segments = [];
  
  if (fixedCostsPercent > 0) {
    segments.push(`#3D6456 ${currentPercent}% ${currentPercent + fixedCostsPercent}%`);
    currentPercent += fixedCostsPercent;
  }
  
  if (paymentPlansPercent > 0) {
    segments.push(`#B2FF78 ${currentPercent}% ${currentPercent + paymentPlansPercent}%`);
    currentPercent += paymentPlansPercent;
  }
  
  if (potsPercent > 0) {
    segments.push(`#E5E7EB ${currentPercent}% ${currentPercent + potsPercent}%`);
    currentPercent += potsPercent;
  }
  
  if (freeToSpendPercent > 0) {
    segments.push(`transparent ${currentPercent}% 100%`);
  }

  const gradientString = segments.length > 0 ? segments.join(", ") : "transparent";

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-soft">
      <h3 className="font-header text-lg font-bold text-konsensi-dark mb-4">Financieel Overzicht</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative size-40 flex-shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{ background: `conic-gradient(${gradientString})` }}
          ></div>
          <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-xs text-gray-500 font-bold">Inkomen</span>
            <span className="text-xl font-header font-bold text-konsensi-dark">
              {formatCurrency(totalIncome, { decimals: 0 })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full">
          {fixedCosts > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-konsensi-dark"></span>
                <span className="text-gray-600">Vaste Lasten</span>
              </div>
              <span className="font-bold">{formatCurrency(fixedCosts, { decimals: 0 })}</span>
            </div>
          )}
          {paymentPlans > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary"></span>
                <span className="text-gray-600">Regelingen</span>
              </div>
              <span className="font-bold">{formatCurrency(paymentPlans, { decimals: 0 })}</span>
            </div>
          )}
          {pots > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gray-200"></span>
                <span className="text-gray-600">Potjes</span>
              </div>
              <span className="font-bold">{formatCurrency(pots, { decimals: 0 })}</span>
            </div>
          )}
          {freeToSpend > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-green-200"></span>
                <span className="text-gray-600">Vrij te besteden</span>
              </div>
              <span className="font-bold">{formatCurrency(freeToSpend, { decimals: 0 })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

