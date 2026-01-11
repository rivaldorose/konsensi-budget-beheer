import React, { useState, useEffect } from "react";
import { Bell, BellRing, BellDot, Lightbulb, Mail, Smartphone, Calendar, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";
import NotificationRulesManager from "@/components/notifications/NotificationRulesManager";

export default function NotificationSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    budgetOverschreden: true,
    schuldherinneringen: true,
    potjeVol: false,
    nieuwAdvies: true,
    emailNotifications: true,
    pushNotifications: true,
    calendarReminders: true,
    reminderDaysBefore: 3
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
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar - Fixed */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('SecuritySettings')}
                >
                  <span className="material-symbols-outlined">shield</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Account & Beveiliging</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className="material-symbols-outlined">tune</span>
                  <span className="font-medium text-sm group-hover:font-semibold">App Voorkeuren</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className="material-symbols-outlined">calculate</span>
                  <span className="font-medium text-sm group-hover:font-semibold">VTLB Berekening</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('Privacy')}
                >
                  <span className="material-symbols-outlined">lock</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacy</span>
                </Link>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('HelpSupport')}
                >
                  <span className="material-symbols-outlined">help</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Help Center</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-secondary text-[#0d1b17]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('FAQSettings')}
                >
                  <span className="material-symbols-outlined">help_outline</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Veelgestelde Vragen</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  to={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  to={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content - Scrollable */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2a2a2a] p-6 md:p-8 overflow-y-auto lg:max-h-full">
              <div className="flex flex-col mb-8">
                <h2 className="text-[#0d1b17] dark:text-white font-bold text-2xl">Notificaties</h2>
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
                      <Mail className="w-5 h-5 text-[#0d1b17] dark:text-white" />
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
                      <Smartphone className="w-5 h-5 text-[#0d1b17] dark:text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Push notificaties</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang meldingen direct op je mobiele apparaat of browser.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.pushNotifications} onToggle={() => handleToggle('pushNotifications')} />
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-dark-border my-4"></div>

                {/* Calendar Reminders Section */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Kalender Herinneringen</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Instellingen voor kalenderherinneringen bij betalingen en belangrijke data.</p>
                    </div>
                  </div>

                  {/* Calendar reminders toggle */}
                  <div className="flex items-center justify-between gap-4 pl-9">
                    <div className="flex flex-col">
                      <h4 className="text-gray-900 dark:text-white text-base font-medium">Kalenderherinneringen inschakelen</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Voeg automatisch herinneringen toe aan je kalender voor betalingen.</p>
                    </div>
                    <Toggle enabled={notifications.calendarReminders} onToggle={() => handleToggle('calendarReminders')} />
                  </div>

                  {/* Reminder days before */}
                  {notifications.calendarReminders && (
                    <div className="flex items-center justify-between gap-4 pl-9">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex flex-col">
                          <h4 className="text-gray-900 dark:text-white text-base font-medium">Dagen van tevoren herinneren</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Hoeveel dagen voor een betaling wil je een herinnering ontvangen?</p>
                        </div>
                      </div>
                      <select
                        className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-2 px-4 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-konsensi-green/20 focus:border-konsensi-green"
                        value={notifications.reminderDaysBefore}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          reminderDaysBefore: parseInt(e.target.value)
                        }))}
                      >
                        <option value={1}>1 dag</option>
                        <option value={2}>2 dagen</option>
                        <option value={3}>3 dagen</option>
                        <option value={5}>5 dagen</option>
                        <option value={7}>1 week</option>
                      </select>
                    </div>
                  )}

                  {/* Email for calendar reminders */}
                  {notifications.calendarReminders && notifications.emailNotifications && (
                    <div className="pl-9 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex flex-col">
                          <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">E-mail herinneringen actief</p>
                          <p className="text-blue-600 dark:text-blue-400/80 text-xs mt-1">
                            Je ontvangt e-mailherinneringen {notifications.reminderDaysBefore} {notifications.reminderDaysBefore === 1 ? 'dag' : 'dagen'} voor elke geplande betaling.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info about calendar export */}
                  <div className="pl-9 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl border border-gray-100 dark:border-[#3a3a3a]">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">info</span>
                      <div className="flex flex-col">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Kalenderbestand downloaden</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          Op de Cent voor Cent pagina kun je een .ics bestand downloaden om betalingsherinneringen direct aan je agenda toe te voegen (Google Calendar, Apple Calendar, Outlook, etc.).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-start">
                <button 
                  className="bg-konsensi-green hover:bg-konsensi-green-light text-white px-8 py-4 rounded-[24px] font-bold transition-colors duration-200"
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
