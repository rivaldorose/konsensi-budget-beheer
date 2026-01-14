import React from "react";

export default function DashboardFooter({
  dailyMotivation = "Kleine stappen leiden tot grote resultaten.",
}) {
  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] py-5 px-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-emerald-500 text-[20px]">lightbulb</span>
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
            Daily Motivation
          </p>
          <p className="font-semibold text-[#1F2937] dark:text-white text-sm md:text-base">
            "{dailyMotivation}"
          </p>
        </div>
      </div>
    </div>
  );
}

