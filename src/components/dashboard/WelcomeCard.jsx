import React from "react";

export default function WelcomeCard({ user, level = 9, currentXP = 2025, totalXP = 2562, badges = [] }) {
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(today);

  const userName = user?.voornaam || user?.full_name || user?.name || "Gebruiker";
  const xpPercentage = totalXP > 0 ? (currentXP / totalXP) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#E8FFD4] via-white to-white shadow-soft p-6 md:p-8 group">
      {/* Background Blur Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        {/* Left Side - Welcome Message */}
        <div>
          <p className="text-konsensi-dark/60 text-sm font-body mb-1">{formattedDate}</p>
          <h2 className="font-header text-2xl md:text-3xl font-extrabold text-konsensi-dark">
            Welkom Terug, {userName} 👋
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {badges.includes("schuld_sloper") && (
              <span className="px-3 py-1 bg-konsensi-dark/10 rounded-full text-xs font-bold text-konsensi-dark uppercase tracking-wider">
                Schuld Sloper
              </span>
            )}
            {badges.includes("elite_status") && (
              <span className="px-3 py-1 bg-[#FFD700]/20 text-[#B8860B] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                Elite Status{" "}
                <span className="material-symbols-outlined text-[14px]">verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Level Indicator */}
        <div className="flex flex-col items-end">
          <div className="size-16 rounded-full border-4 border-white shadow-lg bg-primary flex items-center justify-center relative">
            <span className="font-header font-black text-xl text-konsensi-dark">{level}</span>
            <div className="absolute -bottom-2 bg-konsensi-dark text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              LEVEL
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white relative z-10">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="font-bold text-konsensi-dark">Houd vol! Je bent er bijna.</p>
            <p className="text-xs text-konsensi-dark/60 mt-0.5">Volgende beloning: Rentevrije maand 🎉</p>
          </div>
          <div className="text-right">
            <p className="text-primary font-bold text-xs flex items-center justify-end gap-1 mb-1">
              XP Boost Active <span className="text-base">🔥</span>
            </p>
            <p className="font-mono text-sm font-bold text-konsensi-dark">
              {currentXP} <span className="text-konsensi-dark/40">/ {totalXP} XP</span>
            </p>
          </div>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] z-10 opacity-30 animate-pulse"
            style={{ animation: "pulse 2s infinite" }}
          ></div>
          <div
            className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full relative z-0"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

