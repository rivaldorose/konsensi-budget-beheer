import React, { useState, useEffect } from "react";
import { Bell, BellRing, BellDot, Lightbulb, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation } from "react-router-dom";
import NotificationRulesManager from "@/components/notifications/NotificationRulesManager";

export default function NotificationSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetOverschreden: true,
    schuldherinneringen: true,
    potjeVol: false,
    nieuwAdvies: true,
    emailNotifications: true,
    pushNotifications: true
  });
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // TODO: Save to backend
    toast({ title: 'Notificatie-instellingen opgeslagen!' });
  };

  const Toggle = ({ enabled, onToggle }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        className="sr-only peer" 
        type="checkbox" 
        checked={enabled}
        onChange={onToggle}
      />
      <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-konsensi-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-konsensi-green"></div>
    </label>
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-konsensi-dark shadow-md w-full h-16 flex items-center justify-center px-4 md:px-8 z-50 sticky top-0">
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
            <a className="px-5 py-2 bg-secondary text-konsensi-dark rounded-full text-sm font-bold shadow-sm" href={createPageUrl('Settings')}>Instellingen</a>
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
              <span className="text-white text-sm font-medium hidden sm:block">Rivaldo</span>
              <div className="size-9 rounded-full bg-cover bg-center border-2 border-white/20 bg-purple-badge"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-konsensi-dark dark:text-secondary text-3xl">settings</span>
                <h1 className="text-konsensi-dark dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
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
            {/* Sidebar */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a2c26] rounded-lg lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-4 lg:p-6 flex flex-col sticky top-24">
              <nav className="flex flex-col gap-2">
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('Settings') 
                      ? 'bg-secondary text-konsensi-dark' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('Settings')}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Mijn Profiel</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-secondary text-konsensi-dark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('SecuritySettings')}
                >
                  <span className="material-symbols-outlined">shield</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Account & Beveiliging</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-secondary text-konsensi-dark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-secondary text-konsensi-dark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('DisplaySettings')}
                >
                  <span className="material-symbols-outlined">tune</span>
                  <span className="font-medium text-sm group-hover:font-semibold">App Voorkeuren</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-secondary text-konsensi-dark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('Privacy')}
                >
                  <span className="material-symbols-outlined">lock</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacy</span>
                </a>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-secondary text-konsensi-dark'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white'
                  }`}
                  href={createPageUrl('HelpSupport')}
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Help Center</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white transition-all"
                  href={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-konsensi-dark dark:hover:text-white transition-all"
                  href={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </a>
              </nav>
            </aside>

            {/* Main Content */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a2c26] rounded-lg lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-6 md:p-8">
              <div className="flex flex-col mb-8">
                <h2 className="text-konsensi-dark dark:text-white font-bold text-2xl">Notificaties</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">Kies welke notificaties je wilt ontvangen</p>
              </div>

              <div className="flex flex-col gap-6">
                {/* Budget overschreden */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <BellRing className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Budget overschreden</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang een melding als je je budget overschrijdt.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.budgetOverschreden} onToggle={() => handleToggle('budgetOverschreden')} />
                </div>

                {/* Schuldherinneringen */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <BellDot className="w-5 h-5 text-accent-red" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Schuldherinneringen</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Herinneringen voor aankomende betalingen en achterstanden.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.schuldherinneringen} onToggle={() => handleToggle('schuldherinneringen')} />
                </div>

                {/* Potje vol */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Bell className="w-5 h-5 text-konsensi-green" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Potje vol</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang een melding wanneer je een spaarpotje vol hebt.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.potjeVol} onToggle={() => handleToggle('potjeVol')} />
                </div>

                {/* Nieuw advies */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Lightbulb className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Nieuw advies</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Meldingen over gepersonaliseerd financieel advies en tips.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.nieuwAdvies} onToggle={() => handleToggle('nieuwAdvies')} />
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-dark-border my-4"></div>

                {/* Email notifications */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Mail className="w-5 h-5 text-konsensi-dark dark:text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">E-mail notificaties</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang alle meldingen via e-mail.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.emailNotifications} onToggle={() => handleToggle('emailNotifications')} />
                </div>

                {/* Push notifications */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Smartphone className="w-5 h-5 text-konsensi-dark dark:text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Push notificaties</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang meldingen direct op je mobiele apparaat of browser.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.pushNotifications} onToggle={() => handleToggle('pushNotifications')} />
                </div>
              </div>

              <div className="mt-8 flex justify-start">
                <button 
                  className="bg-konsensi-green hover:bg-konsensi-green-light text-white px-8 py-4 rounded-xl font-bold transition-colors duration-200"
                  onClick={handleSave}
                >
                  Wijzigingen opslaan
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
