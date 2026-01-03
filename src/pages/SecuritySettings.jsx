import React, { useState, useEffect } from 'react';
import { ChevronLeft, Shield, Lock, Smartphone, Key, LogOut, AlertTriangle, Eye, EyeOff, Monitor, Link as LinkIcon, Trash2 } from 'lucide-react';
import { User } from '@/api/entities';
import { SecuritySettings as SecuritySettingsEntity } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation } from 'react-router-dom';

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
    
    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        const existing = await SecuritySettingsEntity.filter({ created_by: userData.email });
        if (existing.length > 0) {
          const s = existing[0];
          setSettings(s);
          setTwoFactorEnabled(s.two_factor_enabled ?? false);
          setBiometricEnabled(s.biometric_login ?? false);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };
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

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    try {
      const data = { two_factor_enabled: newValue };
      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      } else {
        const created = await SecuritySettingsEntity.create({ ...data, created_by: user.email });
        setSettings(created);
      }
      toast({ title: 'Instellingen opgeslagen' });
    } catch (error) {
      console.error('Error saving 2FA:', error);
      setTwoFactorEnabled(!newValue);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleToggleBiometric = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    try {
      const data = { biometric_login: newValue };
      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      } else {
        const created = await SecuritySettingsEntity.create({ ...data, created_by: user.email });
        setSettings(created);
      }
      toast({ title: 'Instellingen opgeslagen' });
    } catch (error) {
      console.error('Error saving biometric:', error);
      setBiometricEnabled(!newValue);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = window.confirm('Weet je zeker dat je wilt uitloggen op alle apparaten?');
    if (confirmed) {
      try {
        await User.logout();
        window.location.href = createPageUrl('Onboarding');
      } catch (error) {
        console.error('Error logging out:', error);
        toast({ title: 'Fout bij uitloggen', variant: 'destructive' });
      }
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
              <span className="text-white text-sm font-medium hidden sm:block">{user?.voornaam || 'Rivaldo'}</span>
              <div 
                className="size-9 rounded-full bg-cover bg-center border-2 border-white/20"
                style={{
                  backgroundImage: user?.profielfoto_url ? `url(${user.profielfoto_url})` : 'none',
                  backgroundColor: user?.profielfoto_url ? 'transparent' : '#8B5CF6'
                }}
              >
                {!user?.profielfoto_url && (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(user?.voornaam?.[0] || 'R').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
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
            {/* Sidebar */}
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
                  <span className="material-symbols-outlined">tune</span>
                  <span className="font-medium text-sm group-hover:font-semibold">App Voorkeuren</span>
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
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a2c26] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-6 md:p-8 lg:p-8">
              <div className="flex flex-col border-b border-gray-100 dark:border-[#2A3F36] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white font-bold text-2xl">Account & Beveiliging</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">Beheer je accountgegevens en beveiligingsinstellingen</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* Two-Factor Authentication */}
                <div className="flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <Shield className="w-5 h-5 text-konsensi-green" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Twee-factor authenticatie</h3>
                          <div className="group relative cursor-pointer">
                            <span className="material-symbols-outlined text-[16px] text-gray-400 dark:text-gray-500">help</span>
                            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                              Twee-factor authenticatie helpt ongeautoriseerde toegang te voorkomen.
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Voeg een extra beveiligingslaag toe aan je account.</p>
                      </div>
                    </div>
                    <Toggle enabled={twoFactorEnabled} onToggle={handleToggle2FA} />
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-dark-border w-full"></div>

                {/* Active Sessions */}
                <div className="flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-1">
                      <Monitor className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Actieve sessies</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Bekijk en beheer waar je bent ingelogd.</p>
                    </div>
                  </div>
                  <div className="pl-[36px] flex flex-col gap-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[24px] hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Desktop (Chrome, Windows) - Actief nu</span>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="text-[13px]">Amsterdam, NL</span>
                        </div>
                      </div>
                      <button className="mt-2 sm:mt-0 self-start sm:self-center text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:underline decoration-red-500/30">
                        Afmelden
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[24px] hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Mobiel (Safari, iOS) - Laatst actief: 2 dagen geleden</span>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="text-[13px]">Rotterdam, NL</span>
                        </div>
                      </div>
                      <button className="mt-2 sm:mt-0 self-start sm:self-center text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:underline decoration-red-500/30">
                        Afmelden
                      </button>
                    </div>
                    <button className="mt-2 w-full sm:w-auto self-start px-4 py-2 bg-gray-50 dark:bg-[#1a2c26]-elevated hover:bg-gray-100 dark:hover:bg-dark-border text-konsensi-green text-sm font-medium rounded-[24px] border border-gray-200 dark:border-[#2A3F36] hover:border-gray-300 dark:hover:border-dark-border-accent transition-all">
                      Beheer alle sessies
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-dark-border w-full"></div>

                {/* Connected Apps */}
                <div className="flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-1">
                      <LinkIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Gekoppelde apps</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Beheer apps en diensten die toegang hebben tot je Konsensi-account.</p>
                    </div>
                  </div>
                  <div className="pl-[36px] flex flex-col gap-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[24px] hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Bank X API</span>
                        <span className="text-gray-500 dark:text-gray-400 text-[13px]">Toegang verlenen: 30-12-2025</span>
                      </div>
                      <button className="mt-2 sm:mt-0 self-start sm:self-center text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:underline decoration-red-500/30">
                        Ontkoppelen
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-[24px] hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors border border-transparent hover:border-gray-200 dark:hover:border-dark-border">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-900 dark:text-white text-sm font-medium">Google Authenticator</span>
                        <span className="text-gray-500 dark:text-gray-400 text-[13px]">Voor inloggen</span>
                      </div>
                      <button className="mt-2 sm:mt-0 self-start sm:self-center text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md text-sm font-medium transition-all hover:underline decoration-red-500/30">
                        Ontkoppelen
                      </button>
                    </div>
                    <button className="mt-2 w-full sm:w-auto self-start px-4 py-2 bg-gray-50 dark:bg-[#1a2c26]-elevated hover:bg-gray-100 dark:hover:bg-dark-border text-konsensi-green text-sm font-medium rounded-[24px] border border-gray-200 dark:border-[#2A3F36] hover:border-gray-300 dark:hover:border-dark-border-accent transition-all">
                      Beheer alle gekoppelde apps
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-dark-border w-full"></div>

                {/* Delete Account */}
                <div className="flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <h3 className="text-red-500 font-semibold text-lg">Account Verwijderen</h3>
                      <p className="text-red-500/80 text-sm">Je kunt je account permanent verwijderen. Dit kan niet ongedaan gemaakt worden.</p>
                      <button className="mt-4 self-start px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-[24px] transition-colors shadow-lg shadow-red-500/20">
                        Account verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
