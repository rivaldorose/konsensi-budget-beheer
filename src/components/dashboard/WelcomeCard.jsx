import React from "react";

export default function WelcomeCard({ user, level = 9, currentXP = 2025, totalXP = 2562, badges = [], motivationalMessage = "Een goed begin is het halve werk!", userTitle = "Schuld Sloper" }) {
  const today = new Date();
  // Format: "Dinsdag 30 December 2025"
  const formattedDate = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);

  const userName = user?.voornaam || user?.full_name || user?.name || "Gebruiker";
  const xpPercentage = totalXP > 0 ? (currentXP / totalXP) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#E8FFD4] via-white to-white dark:from-card-bg dark:via-card-bg dark:to-card-bg dark:border dark:border-border-main shadow-soft p-6 md:p-8 group">
      {/* Background Blur Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 dark:bg-konsensi-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

      {/* Dark mode gradient overlay */}
      <div className="dark:absolute dark:inset-0 dark:bg-gradient-to-br dark:from-konsensi-dark-green/20 dark:via-card-bg dark:to-card-bg dark:pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        {/* Left Side - Welcome Message */}
        <div>
          <p className="text-konsensi-dark/60 dark:text-text-secondary text-sm font-body mb-1">{formattedDate}</p>
          <h2 className="font-header text-2xl md:text-3xl font-extrabold text-konsensi-dark dark:text-white">
            Welkom Terug, {userName} 👋
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-3 py-1 bg-konsensi-dark/10 dark:bg-konsensi-bg-green dark:border dark:border-konsensi-primary/20 rounded-full text-xs font-bold text-konsensi-dark dark:text-konsensi-primary uppercase tracking-wider">
              {userTitle}
            </span>
            <span className="px-3 py-1 bg-[#FFD700]/20 dark:bg-konsensi-bg-green text-[#B8860B] dark:text-konsensi-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 dark:border dark:border-konsensi-primary/20">
              Elite Status ⭐
            </span>
          </div>
        </div>

        {/* Right Side - Level Indicator */}
        <div className="flex flex-col items-end">
          <div className="size-16 rounded-full border-4 border-white dark:border-card-elevated shadow-lg bg-primary dark:bg-konsensi-primary flex items-center justify-center relative">
            <span className="font-header font-black text-xl text-konsensi-dark dark:text-black">{level}</span>
            <div className="absolute -bottom-2 bg-konsensi-dark dark:bg-black text-white dark:text-konsensi-primary text-[10px] font-bold px-2 py-0.5 rounded-full dark:border dark:border-konsensi-primary">
              LEVEL
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-white/60 dark:bg-card-elevated/40 backdrop-blur-sm rounded-2xl p-5 border border-white dark:border-border-main relative z-10">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="font-bold text-konsensi-dark dark:text-white">{motivationalMessage}</p>
          </div>
          <div className="text-right">
            <p className="text-primary dark:text-konsensi-primary font-bold text-xs flex items-center justify-end gap-1 mb-1">
              XP Boost Active <span className="text-base">🔥</span>
            </p>
            <p className="font-mono text-sm font-bold text-konsensi-dark dark:text-white">
              {currentXP} <span className="text-konsensi-dark/40 dark:text-text-tertiary">/ {totalXP} XP</span>
            </p>
          </div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-card-elevated dark:border dark:border-border-main rounded-full overflow-hidden relative">
          <div
            className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] dark:bg-[linear-gradient(45deg,rgba(255,255,255,.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.05)_50%,rgba(255,255,255,.05)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] z-10 opacity-30 animate-pulse"
            style={{ animation: "pulse 2s infinite" }}
          ></div>
          <div
            className="h-full bg-gradient-to-r from-primary/60 to-primary dark:from-konsensi-dark-green dark:to-konsensi-primary dark:shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full relative z-0"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
