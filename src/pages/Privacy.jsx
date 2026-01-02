import React, { useState, useEffect } from 'react';
import { Share2, Mail, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation } from 'react-router-dom';
import { User } from '@/api/entities';

export default function Privacy() {
  const [darkMode, setDarkMode] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: true,
    marketing: false
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
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      await User.updateMyUserData({ privacy_settings: privacySettings });
      toast({ title: 'Privacy-instellingen opgeslagen!' });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
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
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Notificaties</span>
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
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
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
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a2c26] rounded-lg lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-6 md:p-8 lg:p-8">
              <div className="mb-8">
                <h2 className="text-konsensi-dark dark:text-white font-bold text-2xl">Privacy</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">Beheer je privacy-instellingen</p>
              </div>

              <div className="flex flex-col gap-6">
                {/* Data Sharing */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <Share2 className="w-5 h-5 text-konsensi-dark dark:text-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Gegevens delen met derden</h3>
                        <div className="group relative cursor-pointer">
                          <span className="material-symbols-outlined text-[16px] text-gray-400 dark:text-gray-500">help</span>
                          <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded shadow-lg z-10 pointer-events-none">
                            Geanonimiseerde gegevens kunnen niet naar jou worden herleid.
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg">Sta toe dat Konsensi geanonimiseerde gegevens deelt met partners voor analysedoeleinden.</p>
                    </div>
                  </div>
                  <Toggle enabled={privacySettings.dataSharing} onToggle={() => handleToggle('dataSharing')} />
                </div>

                <div className="h-px w-full bg-gray-200 dark:bg-dark-border"></div>

                {/* Marketing */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <Mail className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Marketingcommunicatie</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg">Ontvang updates, aanbiedingen en nieuws van Konsensi.</p>
                    </div>
                  </div>
                  <Toggle enabled={privacySettings.marketing} onToggle={() => handleToggle('marketing')} />
                </div>

                <div className="h-px w-full bg-gray-200 dark:bg-dark-border"></div>

                {/* Privacy Policy Link */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <FileText className="w-5 h-5 text-konsensi-green" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Lees ons Privacybeleid</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg">Bekijk hoe wij omgaan met uw persoonsgegevens.</p>
                      <a 
                        className="text-konsensi-green text-sm mt-1 hover:underline inline-flex items-center gap-1"
                        href={createPageUrl('PrivacyPolicy')}
                      >
                        Bekijk Privacybeleid
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6">
                <button 
                  className="w-full sm:w-auto px-8 py-4 bg-konsensi-green hover:bg-konsensi-green-light text-white rounded-xl font-bold shadow-md shadow-green-500/20 transition-all transform active:scale-95 text-center"
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

