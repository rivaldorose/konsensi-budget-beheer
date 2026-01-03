import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation } from "react-router-dom";

export default function VTLBSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [vtlbData, setVtlbData] = useState({
    vastInkomen: 0,
    vasteLasten: 0,
    huidigeBetalingsregelingen: 0,
    beschikbaarBudget: 0,
    afloscapaciteit: 0
  });
  const location = useLocation();
  const { toast } = useToast();

  // Check current route to highlight active nav item
  const currentPath = location.pathname;
  const isActiveRoute = (path) => {
    if (path === 'Settings') return currentPath === createPageUrl('Settings');
    return currentPath === createPageUrl(path);
  };

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    loadData();
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // Calculate VTLB from user data
      const costs = await MonthlyCost.filter({ user_id: userData.id });
      
      // Calculate total fixed income
      const incomeData = await User.me();
      const fixedIncome = incomeData.monthly_income || 0;

      // Calculate total fixed costs
      const totalFixedCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      // Get current payment arrangements (from debts)
      // This would need to be fetched from debts table
      const currentArrangements = 0; // Placeholder - would need actual debt data

      // Calculate available budget
      const beschikbaarBudget = fixedIncome - totalFixedCosts - currentArrangements;

      // Calculate afloscapaciteit (15% of available budget)
      const afloscapaciteit = Math.max(0, beschikbaarBudget * 0.15);

      // Calculate other allocations
      const boodschappen = Math.max(0, beschikbaarBudget * 0.60);
      const buffer = Math.max(0, beschikbaarBudget * 0.25);

      setVtlbData({
        vastInkomen: fixedIncome,
        vasteLasten: totalFixedCosts,
        huidigeBetalingsregelingen: currentArrangements,
        beschikbaarBudget: beschikbaarBudget,
        afloscapaciteit: afloscapaciteit,
        boodschappen: boodschappen,
        buffer: buffer
      });
    } catch (error) {
      console.error("Error loading VTLB data:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij laden gegevens'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-primary shadow-md w-full h-16 flex items-center justify-center px-4 md:px-8 z-50 sticky top-0">
        <div className="w-full max-w-[1400px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-3xl">forest</span>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">KONSENSI Budgetbeheer</h2>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            <a className="px-4 py-2 text-white/90 text-sm font-medium hover:text-white transition-colors" href={createPageUrl('Dashboard')}>Dashboard</a>
            <a className="px-4 py-2 text-white/90 text-sm font-medium hover:text-white transition-colors" href={createPageUrl('BudgetPlan')}>Balans</a>
            <a className="px-4 py-2 text-white/90 text-sm font-medium hover:text-white transition-colors" href={createPageUrl('Debts')}>Schulden</a>
            <a className="px-5 py-2 bg-secondary text-[#0d1b17] rounded-full text-sm font-bold shadow-sm" href={createPageUrl('Settings')}>Instellingen</a>
          </nav>
          <div className="flex items-center gap-4">
            <label className="relative inline-flex items-center cursor-pointer mr-2">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleTheme}
              />
              <div className="w-14 h-7 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/20 flex items-center justify-between px-1.5">
                <span className="material-symbols-outlined text-[16px] text-yellow-300 z-10 select-none">light_mode</span>
                <span className="material-symbols-outlined text-[16px] text-white/80 z-10 select-none">dark_mode</span>
              </div>
            </label>
            <button className="text-white/80 hover:text-white transition-colors p-1">
              <span className="material-symbols-outlined">search</span>
            </button>
            <div className="hidden sm:flex items-center justify-center bg-purple-badge text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              Level 9
            </div>
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <span className="text-white text-sm font-medium hidden sm:block">{user?.voornaam || 'Gebruiker'}</span>
              <div 
                className="size-9 rounded-full bg-cover bg-center border-2 border-white/20"
                style={{
                  backgroundImage: user?.profielfoto_url 
                    ? `url(${user.profielfoto_url})` 
                    : 'none',
                  backgroundColor: user?.profielfoto_url ? 'transparent' : '#8B5CF6'
                }}
              >
                {!user?.profielfoto_url && (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(user?.voornaam?.[0] || user?.email?.[0] || 'R').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0d1b17] dark:text-secondary text-3xl">settings</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal pl-11">Beheer je profiel, notificaties en app-voorkeuren</p>
            </div>
            <button 
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a2c26] text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('HelpSupport')}
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span>Hulp</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a2c26] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-4 lg:p-6 flex flex-col sticky top-24">
              <nav className="flex flex-col gap-2">
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings') 
                      ? 'bg-secondary text-[#0d1b17]' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('Settings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Settings') ? 'fill-1' : ''}`} style={isActiveRoute('Settings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    account_circle
                  </span>
                  <span className={`text-sm ${isActiveRoute('Settings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Mijn Profiel</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('SecuritySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('SecuritySettings') ? 'fill-1' : ''}`} style={isActiveRoute('SecuritySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    shield
                  </span>
                  <span className={`text-sm ${isActiveRoute('SecuritySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Account & Beveiliging</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('DisplaySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('DisplaySettings') ? 'fill-1' : ''}`} style={isActiveRoute('DisplaySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    tune
                  </span>
                  <span className={`text-sm ${isActiveRoute('DisplaySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>App Voorkeuren</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('Privacy')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
                </a>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Hulp & Support</span>
                </a>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 w-full">
              <div className="bg-white dark:bg-[#1a2c26] rounded-2xl shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-6 md:p-8 w-full">
                <div className="mb-8">
                  <h2 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight mb-2">VTLB Berekening</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-[15px] font-normal">Bereken je Vrij Te Laten Bedrag voor schuldaflossing</p>
                </div>

                {/* Warning Banner */}
                {vtlbData.afloscapaciteit === 0 && (
                  <div className={`mb-8 ${vtlbData.beschikbaarBudget < 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-amber-50 dark:bg-amber-500/10'} border-l-4 ${vtlbData.beschikbaarBudget < 0 ? 'border-red-500' : 'border-amber-500'} rounded-r-lg p-4 flex gap-4 items-start`}>
                    <span className={`material-symbols-outlined ${vtlbData.beschikbaarBudget < 0 ? 'text-red-500' : 'text-amber-500'} shrink-0`}>error</span>
                    <div>
                      <h3 className={`${vtlbData.beschikbaarBudget < 0 ? 'text-red-500' : 'text-amber-500'} font-semibold text-lg leading-tight mb-1`}>
                        Jouw Afloscapaciteit per maand: {formatCurrency(vtlbData.afloscapaciteit)}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {vtlbData.beschikbaarBudget < 0 
                          ? 'Je hebt momenteel geen ruimte om schulden af te lossen. Richt je op het verlagen van kosten of het verhogen van je inkomen.'
                          : 'Je hebt momenteel geen ruimte om schulden af te lossen. Richt je op het verlagen van kosten of het verhogen van je inkomen.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Calculation Breakdown */}
                <div className="mb-8">
                  <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">Hoe komen we hieraan?</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Deze berekening is gebaseerd op de gegevens die je hebt ingevuld.</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary dark:text-green-400 text-[20px]">check_circle</span>
                        <span className="text-gray-800 dark:text-gray-200 text-[15px]">Vast inkomen</span>
                      </div>
                      <span className="text-primary dark:text-green-400 font-semibold text-[15px]">{formatCurrency(vtlbData.vastInkomen)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
                        <span className="text-gray-800 dark:text-gray-200 text-[15px]">Vaste lasten</span>
                      </div>
                      <span className="text-red-500 font-semibold text-[15px]">{formatCurrency(-vtlbData.vasteLasten)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500 text-[20px]">cancel</span>
                        <span className="text-gray-800 dark:text-gray-200 text-[15px]">Huidige betalingsregelingen</span>
                      </div>
                      <span className="text-red-500 font-semibold text-[15px]">{formatCurrency(-vtlbData.huidigeBetalingsregelingen)}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-white font-semibold text-base">Beschikbaar voor budget</span>
                      <span className={`font-bold text-lg ${vtlbData.beschikbaarBudget >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                        {formatCurrency(vtlbData.beschikbaarBudget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Budget Distribution */}
                {vtlbData.beschikbaarBudget > 0 && (
                  <div className="mb-8">
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-4 mt-8">Verdeling van je vrije budget</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-800 dark:text-gray-200 text-[15px]">🛒 Boodschappen & overige lasten (60%)</span>
                        <span className="text-gray-500 dark:text-gray-400 font-semibold text-[15px]">{formatCurrency(vtlbData.boodschappen)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-800 dark:text-gray-200 text-[15px]">🐷 Buffer & Sparen (25%)</span>
                        <span className="text-gray-500 dark:text-gray-400 font-semibold text-[15px]">{formatCurrency(vtlbData.buffer)}</span>
                      </div>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
                      <div className="flex justify-between items-center p-3 rounded-[24px] bg-primary/5 dark:bg-primary/10 border border-primary/10">
                        <span className="text-gray-900 dark:text-white font-semibold text-base flex items-center gap-2">
                          💡 Jouw Afloscapaciteit (15%)
                        </span>
                        <span className="text-primary dark:text-green-400 font-bold text-lg">{formatCurrency(vtlbData.afloscapaciteit)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[24px] p-5 flex flex-col sm:flex-row gap-4 items-start mt-8">
                  <div className="p-1 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-500">
                    <span className="material-symbols-outlined text-[20px] block">settings</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 dark:text-white font-semibold text-[15px] mb-1">Klopt de berekening niet?</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-[13px] leading-relaxed mb-3">
                      Deze berekening is gebaseerd op je ingevulde inkomen, vaste lasten en woonsituatie. Pas deze aan voor een accurate berekening.
                    </p>
                    <button 
                      className="text-primary dark:text-green-400 text-sm font-medium hover:underline flex items-center gap-1 group"
                      onClick={() => window.location.href = createPageUrl('Income')}
                    >
                      Gegevens aanpassen
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-xs italic">
                    *Deze berekening is een vereenvoudigde versie gebaseerd op de VTLB-normen.
                    <a 
                      className="text-primary dark:text-green-400 hover:underline ml-1 not-italic" 
                      href="https://www.nibud.nl/consumenten/schulden/vtlb-calculator/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Officiële calculator <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
