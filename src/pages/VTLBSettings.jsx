import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";

export default function VTLBSettings() {
  const [loading, setLoading] = useState(true);
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();

      // Calculate VTLB from user data
      const costs = await MonthlyCost.filter({ user_id: userData.id });

      // Calculate total fixed income
      const fixedIncome = userData.monthly_income || 0;

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
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          {/* Page Header - Fixed */}
          <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">settings</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Beheer je profiel, notificaties en app-voorkeuren</p>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-[#0d1b17] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('HelpSupport')}
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span>Hulp</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar Navigation - Fixed */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Settings') ? 'fill-1' : ''}`} style={isActiveRoute('Settings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    account_circle
                  </span>
                  <span className={`text-sm ${isActiveRoute('Settings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('SecuritySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('SecuritySettings') ? 'fill-1' : ''}`} style={isActiveRoute('SecuritySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    shield
                  </span>
                  <span className={`text-sm ${isActiveRoute('SecuritySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Account & Beveiliging</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('DisplaySettings') ? 'fill-1' : ''}`} style={isActiveRoute('DisplaySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    tune
                  </span>
                  <span className={`text-sm ${isActiveRoute('DisplaySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>App Voorkeuren</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Privacy')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
                </Link>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Help Center</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content Section - Scrollable */}
            <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                  <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">VTLB Berekening</h2>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Bereken je Vrij Te Laten Bedrag voor schuldaflossing</p>
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
