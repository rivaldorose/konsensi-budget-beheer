import React from "react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function DashboardFooter({
  dailyMotivation = "Kleine stappen leiden tot grote resultaten.",
  weekGoalPercentage = 89,
  onNextAction,
}) {
  return (
    <div className="sticky bottom-0 z-40 w-full bg-white dark:bg-card-bg border-t border-gray-100 dark:border-border-main py-4 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Daily Motivation */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="size-12 bg-primary/20 dark:bg-konsensi-bg-green rounded-xl hidden md:flex items-center justify-center text-primary dark:text-konsensi-primary border border-transparent dark:border-konsensi-primary/20">
            <span className="material-symbols-outlined">format_quote</span>
          </div>
          <div>
            <p className="text-xs font-bold text-primary dark:text-konsensi-primary uppercase tracking-wider mb-0.5">
              Daily Motivation
            </p>
            <p className="font-header font-bold text-konsensi-dark dark:text-white text-sm md:text-base">
              "{dailyMotivation}"
            </p>
          </div>
        </div>

        {/* Week Goal & Next Action */}
        <div className="flex items-center gap-6 w-full sm:w-auto">
          {/* Week Goal Progress */}
          <div className="hidden lg:block w-48">
            <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-text-secondary mb-1">
              <span>Weekdoel</span>
              <span>{weekGoalPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-card-elevated rounded-full overflow-hidden border border-transparent dark:border-border-main">
              <div
                className="h-full bg-konsensi-dark dark:bg-konsensi-primary rounded-full transition-all duration-300"
                style={{ width: `${weekGoalPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Next Action Button */}
          <Button
            onClick={onNextAction || (() => window.location.href = createPageUrl("VasteLastenCheck"))}
            className="bg-primary dark:bg-konsensi-primary hover:bg-[#a3ef6a] dark:hover:bg-konsensi-hover text-konsensi-dark dark:text-black font-header font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto flex items-center justify-center gap-2 group"
          >
            Volgende Actie
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

