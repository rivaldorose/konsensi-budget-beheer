import React from "react";

export default function GamificationStats({ daysOnTrack = 7, savingsPotAmount = 12.5 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Days On Track */}
      <div className="bg-orange-50 rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-orange-100 hover:shadow-md transition-shadow">
        <div className="size-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-2xl animate-pulse">
          🔥
        </div>
        <p className="font-header font-bold text-2xl text-orange-600">{daysOnTrack}</p>
        <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">Dagen Op Schema!</p>
      </div>

      {/* Savings Pot */}
      <div className="bg-blue-50 rounded-[1.5rem] p-4 flex flex-col items-center text-center justify-center gap-2 border border-blue-100 hover:shadow-md transition-shadow">
        <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-2xl">
          💧
        </div>
        <p className="font-header font-bold text-2xl text-blue-600">+€{savingsPotAmount.toFixed(2)}</p>
        <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Savings Pot</p>
      </div>
    </div>
  );
}

