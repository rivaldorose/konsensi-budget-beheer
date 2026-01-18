import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WelcomeCard({ user, level = 1, currentXP = 0, totalXP = 100, badges = [], motivationalMessage = "Een goed begin is het halve werk!", userTitle = "Schuld Sloper", loginStreak = 0 }) {
  const [showXPInfo, setShowXPInfo] = useState(false);
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

  // Dynamic status badge based on level
  const getStatusBadge = () => {
    if (level >= 10) return { label: "Elite Status", icon: "⭐", color: "bg-[#FFD700]/20 text-[#B8860B]" };
    if (level >= 7) return { label: "Gevorderd", icon: "🏆", color: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" };
    if (level >= 4) return { label: "Op Weg", icon: "🚀", color: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" };
    return { label: "Starter", icon: "🌱", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" };
  };

  const statusBadge = getStatusBadge();

  // XP Boost is active when user has logged in 3+ days in a row
  const hasXpBoost = loginStreak >= 3;

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
            <span className={`px-3 py-1 ${statusBadge.color} dark:bg-konsensi-bg-green dark:text-konsensi-primary rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 dark:border dark:border-konsensi-primary/20`}>
              {statusBadge.label} {statusBadge.icon}
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
          <div className="flex items-center gap-2">
            <p className="font-bold text-konsensi-dark dark:text-white">{motivationalMessage}</p>
            <button
              onClick={() => setShowXPInfo(true)}
              className="p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors"
              title="Hoe werkt XP?"
            >
              <span className="material-symbols-outlined text-konsensi-dark/40 dark:text-text-tertiary text-lg">help</span>
            </button>
          </div>
          <div className="text-right">
            {hasXpBoost && (
              <p className="text-primary dark:text-konsensi-primary font-bold text-xs flex items-center justify-end gap-1 mb-1">
                XP Boost Active <span className="text-base">🔥</span>
              </p>
            )}
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

      {/* XP Info Modal */}
      <Dialog open={showXPInfo} onOpenChange={setShowXPInfo}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-konsensi-dark dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-konsensi-primary">emoji_events</span>
              Hoe werkt XP verdienen?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verdien XP (ervaringspunten) door actief bezig te zijn met je financiele doelen. Hoe meer XP je verdient, hoe hoger je level!
            </p>

            {/* XP Rewards List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-konsensi-dark dark:text-white text-sm">XP Beloningen:</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-lg">login</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dagelijks inloggen</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+5 XP</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500 text-lg">add_circle</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Schuld toevoegen</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+10 XP</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500 text-lg">calendar_month</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Betalingsregeling starten</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+20 XP</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-lg">payments</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Betaling doen</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+25 XP</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">trending_up</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Extra betaling doen</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+35 XP</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-lg">celebration</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Schuld volledig afgelost</span>
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-konsensi-primary">+100 XP</span>
                </div>
              </div>
            </div>

            {/* XP Boost Info */}
            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-200 dark:border-orange-500/20">
              <div className="flex items-start gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <h5 className="font-semibold text-orange-700 dark:text-orange-400 text-sm">XP Boost</h5>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Log 3 dagen achter elkaar in om een XP Boost te activeren! Je verdient dan extra XP op al je acties.
                  </p>
                </div>
              </div>
            </div>

            {/* Level Up Info */}
            <div className="p-3 bg-primary/10 dark:bg-konsensi-primary/10 rounded-lg border border-primary/20 dark:border-konsensi-primary/20">
              <div className="flex items-start gap-2">
                <span className="text-xl">⬆️</span>
                <div>
                  <h5 className="font-semibold text-konsensi-dark dark:text-konsensi-primary text-sm">Level Up</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Verzamel genoeg XP om naar het volgende level te stijgen. Elk level vereist meer XP, maar geeft ook meer status!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowXPInfo(false)}
            className="w-full mt-4 px-4 py-2 bg-primary dark:bg-konsensi-primary text-konsensi-dark font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Begrepen!
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
