import React from "react";

export default function GamificationStats({ daysOnTrack = 0, savingsPotAmount = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Days On Track / Streak */}
      <div className="bg-orange-50 dark:bg-orange-500/10 rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-orange-100 dark:border-orange-500/20 hover:shadow-md dark:hover:shadow-soft-dark transition-shadow">
        <div className="size-10 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400 text-2xl">
          🔥
        </div>
        <p className="font-header font-bold text-2xl text-orange-600 dark:text-orange-400">{daysOnTrack}</p>
        <p className="text-xs font-bold text-orange-400 dark:text-orange-500 uppercase tracking-wide">Dagen Op Schema!</p>
      </div>

      {/* Savings Pot */}
      <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-blue-100 dark:border-blue-500/20 hover:shadow-md dark:hover:shadow-soft-dark transition-shadow">
        <div className="size-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 text-2xl">
          💧
        </div>
        <p className="font-header font-bold text-2xl text-blue-600 dark:text-blue-400">+€{savingsPotAmount.toFixed(2)}</p>
        <p className="text-xs font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wide">Savings Pot</p>
      </div>
    </div>
  );
}
