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
          <div>
            <p className="text-xs font-bold text-primary dark:text-konsensi-primary uppercase tracking-wider mb-0.5">
              Daily Motivation
            </p>
            <p className="font-header font-bold text-konsensi-dark dark:text-white text-sm md:text-base">
              "{dailyMotivation}"
            </p>
          </div>
        </div>

        {/* Next Action */}
        <div className="flex items-center gap-6 w-full sm:w-auto">
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

