import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Megaphone, FileText, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation } from 'react-router-dom';

export default function HelpSupport() {
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Help Center</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  href={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
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
              <div className="flex flex-col border-b border-gray-100 dark:border-[#2a2a2a] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white font-bold text-2xl">Hulp & Support</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-2">Vind antwoorden op veelgestelde vragen of neem contact met ons op</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* FAQ */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Veelgestelde vragen (FAQ)</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Vind snel antwoorden op de meest voorkomende vragen.</p>
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#1a1a1a]-elevated border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-dark-border-accent text-konsensi-green rounded-[24px] text-sm font-medium transition-colors group"
                      onClick={() => window.location.href = createPageUrl('FAQSettings')}
                    >
                      <span>Bekijk FAQ</span>
                      <ArrowRight className="w-4 h-4 text-konsensi-green group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Contact opnemen</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Neem contact met ons op via telefoon, e-mail of chat.</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#1a1a1a]-elevated border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-dark-border-accent text-konsensi-green rounded-[24px] text-sm font-medium transition-colors group mb-4">
                      <span>Contactformulier</span>
                      <ArrowRight className="w-4 h-4 text-konsensi-green group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <a className="text-konsensi-green text-sm hover:underline inline-flex items-center gap-2" href="tel:0881234567">
                        Bel ons: 088-1234567
                      </a>
                      <a className="text-konsensi-green text-sm hover:underline inline-flex items-center gap-2" href="mailto:support@konsensi.nl">
                        E-mail: support@konsensi.nl
                      </a>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Megaphone className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Feedback geven</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Help ons Konsensi te verbeteren door je mening te delen.</p>
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#1a1a1a]-elevated border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-dark-border-accent text-konsensi-green rounded-[24px] text-sm font-medium transition-colors group"
                      onClick={() => window.location.href = createPageUrl('Feedback')}
                    >
                      <span>Geef feedback</span>
                      <ArrowRight className="w-4 h-4 text-konsensi-green group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-gray-200 dark:bg-dark-border my-2 w-full"></div>

                {/* Terms */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-konsensi-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Algemene Voorwaarden</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Lees onze gebruiksvoorwaarden.</p>
                    <a className="text-konsensi-green text-sm hover:underline inline-flex items-center gap-2 mt-1" href={createPageUrl('TermsOfService')}>
                      Bekijk voorwaarden
                    </a>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Lock className="w-5 h-5 text-konsensi-green" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Privacybeleid</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Hoe wij omgaan met uw persoonsgegevens.</p>
                    <a className="text-konsensi-green text-sm hover:underline inline-flex items-center gap-2 mt-1" href={createPageUrl('PrivacyPolicy')}>
                      Bekijk Privacybeleid
                    </a>
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

