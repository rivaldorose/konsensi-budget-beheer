import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";
import { gamificationService, XP_REWARDS } from "@/services/gamificationService";

export default function GamificationSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState({
    level: 1,
    current_xp: 0,
    xp_to_next_level: 100,
    total_xp: 0
  });
  const [loginStreak, setLoginStreak] = useState(0);
  const location = useLocation();
  const { toast } = useToast();

  const currentPath = location.pathname;
  const isActiveRoute = (path) => {
    if (path === 'GamificationSettings') return currentPath === createPageUrl('GamificationSettings');
    return currentPath === createPageUrl(path);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData?.id) {
        const level = await gamificationService.getUserLevel(userData.id);
        setLevelData(level);

        const streak = await gamificationService.getLoginStreak(userData.id);
        setLoginStreak(streak);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // XP rewards info for display
  const xpRewardsList = [
    { action: "Dagelijkse login", xp: XP_REWARDS.DAILY_LOGIN, icon: "login", description: "Elke dag dat je inlogt" },
    { action: "Schuld toevoegen", xp: XP_REWARDS.DEBT_ADDED, icon: "add_circle", description: "Nieuwe schuld registreren" },
    { action: "Samenvatting bekijken", xp: XP_REWARDS.SUMMARY_VIEWED, icon: "summarize", description: "Cent voor Cent pagina bekijken (1x per dag)" },
    { action: "Betalingsregeling starten", xp: XP_REWARDS.PAYMENT_ARRANGEMENT_STARTED, icon: "handshake", description: "Nieuwe betalingsregeling opzetten" },
    { action: "Betaling maken", xp: XP_REWARDS.PAYMENT_MADE, icon: "payments", description: "Een schuldbetaling registreren" },
    { action: "Extra betaling", xp: XP_REWARDS.EXTRA_PAYMENT_MADE, icon: "add_task", description: "Meer betalen dan je regeling (bonus)" },
    { action: "Vaste last betaald", xp: XP_REWARDS.FIXED_COST_PAID, icon: "receipt_long", description: "Vaste last als betaald markeren" },
    { action: "Schuld volledig afbetaald", xp: XP_REWARDS.DEBT_FULLY_PAID, icon: "celebration", description: "Een schuld volledig aflossen" },
  ];

  // Level titles based on level
  const getLevelTitle = (level) => {
    if (level >= 20) return { title: "Financieel Meester", emoji: "👑" };
    if (level >= 15) return { title: "Schuld Sloper", emoji: "💪" };
    if (level >= 10) return { title: "Budget Expert", emoji: "⭐" };
    if (level >= 7) return { title: "Gevorderde Spaarder", emoji: "🏆" };
    if (level >= 4) return { title: "Actieve Bespaarder", emoji: "🚀" };
    if (level >= 2) return { title: "Starter", emoji: "🌱" };
    return { title: "Nieuweling", emoji: "🌱" };
  };

  const levelInfo = getLevelTitle(levelData.level);
  const xpPercentage = levelData.xp_to_next_level > 0 ? (levelData.current_xp / levelData.xp_to_next_level) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#9CA3AF]"></div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">emoji_events</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Gamification</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Bekijk je XP, level en voortgang</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="text-sm font-medium group-hover:font-semibold">Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('SecuritySettings')}
                >
                  <span className="material-symbols-outlined">shield</span>
                  <span className="text-sm font-medium group-hover:font-semibold">Account & Beveiliging</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('NotificationSettings')}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="text-sm font-medium group-hover:font-semibold">Notificaties</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className="material-symbols-outlined">tune</span>
                  <span className="text-sm font-medium group-hover:font-semibold">App Voorkeuren</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('GamificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('GamificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('GamificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('GamificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    emoji_events
                  </span>
                  <span className={`text-sm ${isActiveRoute('GamificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Gamification & XP</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className="material-symbols-outlined">calculate</span>
                  <span className="text-sm font-medium group-hover:font-semibold">VTLB Berekening</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 overflow-y-auto lg:max-h-full">
              <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Gamification & XP</h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Bekijk je voortgang en ontdek hoe je meer XP kunt verdienen.</p>
              </div>

              {/* Level Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-[24px] p-6 md:p-8 mb-8 border border-primary/20 dark:border-primary/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="size-20 rounded-full bg-primary dark:bg-primary flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-black text-white">{levelData.level}</span>
                    </div>
                    <div>
                      <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Jouw Level</p>
                      <h3 className="text-[#0d1b17] dark:text-white text-2xl font-bold flex items-center gap-2">
                        {levelInfo.title} {levelInfo.emoji}
                      </h3>
                      <p className="text-primary dark:text-primary font-semibold text-sm mt-1">
                        {levelData.total_xp} totaal XP verdiend
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:text-right">
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                      Nog <span className="font-bold text-primary">{levelData.xp_to_next_level - levelData.current_xp} XP</span> tot level {levelData.level + 1}
                    </p>
                    <div className="h-4 w-full md:w-64 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary dark:bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${xpPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{levelData.current_xp} / {levelData.xp_to_next_level} XP</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-[20px] p-5 border border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
                    <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Login Streak</span>
                  </div>
                  <p className="text-[#0d1b17] dark:text-white text-3xl font-bold">{loginStreak} dagen</p>
                  {loginStreak >= 3 && (
                    <p className="text-amber-500 text-xs font-semibold mt-1">XP Boost actief! 🔥</p>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-[20px] p-5 border border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-blue-500">stars</span>
                    <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Totaal XP</span>
                  </div>
                  <p className="text-[#0d1b17] dark:text-white text-3xl font-bold">{levelData.total_xp}</p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-[20px] p-5 border border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-purple-500">trending_up</span>
                    <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Huidige Level</span>
                  </div>
                  <p className="text-[#0d1b17] dark:text-white text-3xl font-bold">Level {levelData.level}</p>
                </div>
              </div>

              {/* XP Rewards Table */}
              <div className="border-t border-[#E5E7EB] dark:border-[#2a2a2a] pt-8">
                <h3 className="text-[#0d1b17] dark:text-white text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">bolt</span>
                  Hoe verdien je XP?
                </h3>
                <div className="grid gap-3">
                  {xpRewardsList.map((reward, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-[16px] border border-gray-100 dark:border-[#2a2a2a] hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-xl">{reward.icon}</span>
                        </div>
                        <div>
                          <p className="text-[#0d1b17] dark:text-white font-semibold">{reward.action}</p>
                          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">{reward.description}</p>
                        </div>
                      </div>
                      <div className="bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-full">
                        <span className="text-primary dark:text-primary font-bold">+{reward.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Progression Info */}
              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-500/10 rounded-[20px] border border-blue-200 dark:border-blue-500/20">
                <h4 className="text-blue-700 dark:text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">info</span>
                  Level Progressie
                </h4>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  Om naar het volgende level te gaan heb je steeds meer XP nodig. De XP requirement groeit met 1.5x per level.
                  Begin met 100 XP voor level 2, dan 150 XP voor level 3, 225 XP voor level 4, enzovoort.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
