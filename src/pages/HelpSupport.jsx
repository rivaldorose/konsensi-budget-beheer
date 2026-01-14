import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Megaphone, FileText, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation, Link } from 'react-router-dom';

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

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

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
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 overflow-y-auto lg:max-h-full">
              <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Hulp & Support</h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Vind antwoorden op veelgestelde vragen of neem contact met ons op</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* FAQ */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className="w-5 h-5 text-[#0d1b17] dark:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d1b17] dark:text-white font-semibold text-lg mb-1">Veelgestelde vragen (FAQ)</h3>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-3">Vind snel antwoorden op de meest voorkomende vragen.</p>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-[#E5E7EB] dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] text-primary rounded-[24px] text-sm font-medium transition-colors group"
                      onClick={() => window.location.href = createPageUrl('FAQSettings')}
                    >
                      <span>Bekijk FAQ</span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Phone className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d1b17] dark:text-white font-semibold text-lg mb-1">Contact opnemen</h3>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-3">Neem contact met ons op via telefoon, e-mail of chat.</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-[#E5E7EB] dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] text-primary rounded-[24px] text-sm font-medium transition-colors group mb-4">
                      <span>Contactformulier</span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <a className="text-primary text-sm hover:underline inline-flex items-center gap-2" href="tel:+31619866218">
                        Bel ons: +31 6 19 86 62 18
                      </a>
                      <a className="text-primary text-sm hover:underline inline-flex items-center gap-2" href="mailto:support@konsensi.nl">
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
                    <h3 className="text-[#0d1b17] dark:text-white font-semibold text-lg mb-1">Feedback geven</h3>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-3">Help ons Konsensi te verbeteren door je mening te delen.</p>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#2a2a2a] border border-[#E5E7EB] dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] text-primary rounded-[24px] text-sm font-medium transition-colors group"
                      onClick={() => window.location.href = createPageUrl('Feedback')}
                    >
                      <span>Geef feedback</span>
                      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-[#E5E7EB] dark:bg-[#2a2a2a] my-2 w-full"></div>

                {/* Terms */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d1b17] dark:text-white font-semibold text-lg mb-1">Algemene Voorwaarden</h3>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-2">Lees onze gebruiksvoorwaarden.</p>
                    <a className="text-primary text-sm hover:underline inline-flex items-center gap-2 mt-1" href={createPageUrl('TermsOfService')}>
                      Bekijk voorwaarden
                    </a>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-shrink-0 mt-1">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d1b17] dark:text-white font-semibold text-lg mb-1">Privacybeleid</h3>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mb-2">Hoe wij omgaan met uw persoonsgegevens.</p>
                    <a className="text-primary text-sm hover:underline inline-flex items-center gap-2 mt-1" href={createPageUrl('PrivacyPolicy')}>
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
