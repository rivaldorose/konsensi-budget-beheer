import React from "react";

export default function GamificationStats({ daysOnTrack = 0, savingsPotAmount = 0, savingsPotsCount = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Days On Track */}
      <div className="bg-orange-50 dark:bg-card-bg rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-orange-100 dark:border-accent-orange/20 hover:shadow-md dark:hover:border-accent-orange/40 transition-all">
        <div className="size-10 bg-orange-100 dark:bg-accent-orange/15 rounded-full flex items-center justify-center text-orange-500 dark:text-accent-orange text-2xl animate-pulse">
          🔥
        </div>
        <p className="font-header font-bold text-2xl text-orange-600 dark:text-accent-orange">{daysOnTrack}</p>
        <p className="text-xs font-bold text-orange-400 dark:text-accent-orange/70 uppercase tracking-wide">Dagen Op Schema!</p>
      </div>

      {/* Savings Pot */}
      <div className="bg-blue-50 dark:bg-card-bg rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-blue-100 dark:border-accent-blue/20 hover:shadow-md dark:hover:border-accent-blue/40 transition-all">
        <div className="size-10 bg-blue-100 dark:bg-accent-blue/15 rounded-full flex items-center justify-center text-blue-500 dark:text-accent-blue text-2xl">
          💧
        </div>
        <p className="font-header font-bold text-2xl text-blue-600 dark:text-accent-blue">+€{savingsPotAmount.toFixed(2)}</p>
        <p className="text-xs font-bold text-blue-400 dark:text-accent-blue/70 uppercase tracking-wide">Spaarpot ({savingsPotsCount})</p>
      </div>
    </div>
  );
}

