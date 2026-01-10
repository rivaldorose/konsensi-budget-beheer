import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/components/utils/LanguageContext';

export default function DisplaySettings() {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [currency, setCurrency] = useState('EUR');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const { language, changeLanguage } = useTranslation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
    
    const loadSettings = async () => {
      try {
        const user = await User.me();
        if (user.display_settings) {
          const settings = typeof user.display_settings === 'string' 
            ? JSON.parse(user.display_settings) 
            : user.display_settings;
          setTheme(settings.theme || 'light');
          setFontSize(settings.fontSize || 'medium');
          setCurrency(settings.currency || 'EUR');
        }
        if (user.language_preference) {
          changeLanguage(user.language_preference);
        }
      } catch (error) {
        console.error('Error loading display settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = {
        theme,
        fontSize,
        currency
      };
      await User.updateMyUserData({ display_settings: settings });
      toast({ title: 'App voorkeuren opgeslagen', variant: 'success' });
    } catch (error) {
      console.error('Error saving display settings:', error);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const languages = [
    { code: 'nl', name: 'Nederlands' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pl', name: 'Polski' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ar', name: 'العربية' }
  ];

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'Dollar' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary"></div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a]">
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col sticky top-24">
              <nav className="flex flex-col gap-2">
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings') 
                      ? 'bg-secondary text-[#0d1b17]' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('Settings')}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Mijn Profiel</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('SecuritySettings')}
                >
                  <span className="material-symbols-outlined">shield</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Account & Beveiliging</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('NotificationSettings')}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Notificaties</span>
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
                    isActiveRoute('Privacy')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('HelpSupport')}
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Help Center</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  href={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  href={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </a>
              </nav>
            </aside>

            {/* Main Content */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2a2a2a] p-6 md:p-8 lg:p-8">
              <div className="mb-8">
                <h2 className="text-[#0d1b17] dark:text-white font-bold text-2xl">App Voorkeuren</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-1">Pas de app aan naar jouw wensen</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* Language */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <span className="material-symbols-outlined text-[#0d1b17] dark:text-white text-[24px]">translate</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Taal</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Kies je voorkeurstaal voor de applicatie.</p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-auto">
                    <select 
                      className="appearance-none w-full md:w-40 bg-gray-50 dark:bg-[#1a1a1a]-elevated border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] py-2.5 pl-4 pr-10 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-konsensi-green/20 focus:border-konsensi-green transition-all cursor-pointer"
                      value={language}
                      onChange={async (e) => {
                        const newLang = e.target.value;
                        changeLanguage(newLang);
                        try {
                          await User.updateMyUserData({ language_preference: newLang });
                        } catch (error) {
                          console.error('Error saving language:', error);
                        }
                      }}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none text-xl">expand_more</span>
                  </div>
                </div>

                {/* Theme */}
                <div className="flex flex-col gap-4 pb-6 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <span className="material-symbols-outlined text-accent-blue text-[24px]">palette</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Thema</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Kies tussen een licht, donker of systeemthema.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 pl-0 md:pl-[44px] mt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-[#2a2a2a] group-hover:border-konsensi-green transition-colors bg-white dark:bg-[#1a1a1a]-elevated">
                        <input 
                          className="peer sr-only" 
                          name="theme" 
                          type="radio"
                          checked={theme === 'light'}
                          onChange={() => {
                            setTheme('light');
                            setDarkMode(false);
                            document.documentElement.classList.remove('dark');
                            localStorage.setItem('theme', 'light');
                          }}
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-konsensi-green scale-0 peer-checked:scale-100 transition-transform"></div>
                        <div className="absolute inset-0 rounded-full border border-konsensi-green opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-gray-900 dark:text-white text-sm">Licht</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-[#2a2a2a] group-hover:border-konsensi-green transition-colors bg-white dark:bg-[#1a1a1a]-elevated">
                        <input 
                          className="peer sr-only" 
                          name="theme" 
                          type="radio"
                          checked={theme === 'dark'}
                          onChange={() => {
                            setTheme('dark');
                            setDarkMode(true);
                            document.documentElement.classList.add('dark');
                            localStorage.setItem('theme', 'dark');
                          }}
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-konsensi-green scale-0 peer-checked:scale-100 transition-transform"></div>
                        <div className="absolute inset-0 rounded-full border border-konsensi-green opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-gray-900 dark:text-white text-sm">Donker</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 dark:border-[#2a2a2a] group-hover:border-konsensi-green transition-colors bg-white dark:bg-[#1a1a1a]-elevated">
                        <input 
                          className="peer sr-only" 
                          name="theme" 
                          type="radio"
                          checked={theme === 'auto'}
                          onChange={() => {
                            setTheme('auto');
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            setDarkMode(prefersDark);
                            if (prefersDark) {
                              document.documentElement.classList.add('dark');
                            } else {
                              document.documentElement.classList.remove('dark');
                            }
                            localStorage.setItem('theme', 'auto');
                          }}
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-konsensi-green scale-0 peer-checked:scale-100 transition-transform"></div>
                        <div className="absolute inset-0 rounded-full border border-konsensi-green opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-gray-900 dark:text-white text-sm">Systeem</span>
                    </label>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <span className="material-symbols-outlined text-konsensi-green text-[24px]">euro_symbol</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Valuta</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Stel je voorkeursvaluta in.</p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-auto">
                    <select 
                      className="appearance-none w-full md:w-40 bg-gray-50 dark:bg-[#1a1a1a]-elevated border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] py-2.5 pl-4 pr-10 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-konsensi-green/20 focus:border-konsensi-green transition-all cursor-pointer"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>{curr.name} ({curr.symbol})</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none text-xl">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-[#2a2a2a] flex justify-end">
                <button 
                  className="bg-konsensi-green text-white px-8 py-4 rounded-[24px] font-bold text-sm hover:bg-konsensi-green-light transition-colors shadow-sm focus:ring-4 focus:ring-konsensi-green/30 focus:outline-none"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
