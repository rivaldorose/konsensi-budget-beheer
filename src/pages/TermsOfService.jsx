import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      await User.me();
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const isActiveRoute = (path) => {
    if (path === 'TermsOfService') return true;
    return location.pathname === createPageUrl(path);
  };

  const handleAccept = () => {
    navigate(-1);
  };

  // Logged-in view with settings sidebar
  if (isLoggedIn && !loading) {
    return (
      <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
        <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
          <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
            {/* Page Header */}
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
              {/* Sidebar Navigation */}
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
                    className="group flex items-center gap-4 px-4 py-3 rounded-[24px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30 transition-all"
                    to={createPageUrl('TermsOfService')}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    <span className="font-bold text-sm">Algemene Voorwaarden</span>
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

              {/* Main Content Section */}
              <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                  <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                    <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Algemene Voorwaarden</h2>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Laatst bijgewerkt op: 30 december 2025</p>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">1.</span>
                        Introductie
                      </h3>
                      <p className="text-[15px] leading-[1.7] text-[#6B7280] dark:text-[#9CA3AF]">
                        Welkom bij Konsensi Budgetbeheer. Door gebruik te maken van onze diensten ga je akkoord met de onderstaande algemene voorwaarden. Lees deze zorgvuldig door voordat je onze website of applicatie gebruikt.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">2.</span>
                        Definities
                      </h3>
                      <ul className="space-y-3 text-[15px] leading-[1.7] text-[#6B7280] dark:text-[#9CA3AF] list-disc list-inside marker:text-primary">
                        <li>
                          <strong className="font-medium text-[#1F2937] dark:text-white">Diensten:</strong> De online financiële diensten en tools aangeboden door Konsensi.
                        </li>
                        <li>
                          <strong className="font-medium text-[#1F2937] dark:text-white">Gebruiker:</strong> Iedere natuurlijke persoon die gebruik maakt van de Diensten.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">3.</span>
                        Gebruik van de Diensten
                      </h3>
                      <div>
                        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">3.1. Toegankelijkheid</h4>
                        <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                          Konsensi streeft ernaar de Diensten 24/7 beschikbaar te stellen, maar garandeert geen ononderbroken toegang. We kunnen de toegang tijdelijk opschorten voor onderhoud of updates.
                        </p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">4.</span>
                        Intellectueel Eigendom
                      </h3>
                      <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                        Alle intellectuele eigendomsrechten met betrekking tot de Diensten, inclusief maar niet beperkt tot software, ontwerpen en inhoud, berusten bij Konsensi. Het is niet toegestaan materiaal te kopiëren of te hergebruiken zonder schriftelijke toestemming.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">5.</span>
                        Aansprakelijkheid
                      </h3>
                      <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                        Konsensi is niet aansprakelijk voor enige directe of indirecte schade voortvloeiend uit het gebruik van de Diensten, tenzij er sprake is van opzet of grove nalatigheid onzerzijds.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">6.</span>
                        Wijzigingen
                      </h3>
                      <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                        Konsensi behoudt zich het recht voor deze voorwaarden te allen tijde te wijzigen. Wij zullen gebruikers op de hoogte stellen van wezenlijke wijzigingen via de app of e-mail.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="text-primary opacity-80">7.</span>
                        Toepasselijk Recht
                      </h3>
                      <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                        Op deze voorwaarden is het Nederlands recht van toepassing. Geschillen zullen worden voorgelegd aan de bevoegde rechter in Nederland.
                      </p>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
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

  // Not logged in view (original)
  return (
    <div className="bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-display transition-colors duration-200 antialiased min-h-screen w-full flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-[1000px]">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="flex items-center justify-center p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all group"
              >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
              </button>
              <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-[#1F2937] dark:text-white leading-tight">
                Algemene Voorwaarden
              </h1>
            </div>
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="sr-only">Use dark mode settings</span>
              <span className={`pointer-events-none relative inline-block h-9 w-9 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                <span className={`material-symbols-outlined absolute inset-0 flex h-full w-full items-center justify-center text-yellow-500 transition-opacity duration-200 ease-in ${darkMode ? 'opacity-0' : 'opacity-100'}`}>
                  light_mode
                </span>
                <span className={`material-symbols-outlined absolute inset-0 flex h-full w-full items-center justify-center text-primary transition-opacity duration-200 ease-in ${darkMode ? 'opacity-100' : 'opacity-0'}`}>
                  dark_mode
                </span>
              </span>
            </button>
          </div>
          <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] pl-0 md:pl-12">
            Laatst bijgewerkt op: 30 december 2025
          </p>
        </header>

        <main className="bg-white dark:bg-[#1a2c26] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] p-6 md:p-10 lg:p-12 overflow-hidden">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">1.</span>
              Introductie
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#6B7280] dark:text-[#9CA3AF]">
              Welkom bij Konsensi Budgetbeheer. Door gebruik te maken van onze diensten ga je akkoord met de onderstaande algemene voorwaarden. Lees deze zorgvuldig door voordat je onze website of applicatie gebruikt.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-[#1F2937] dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">2.</span>
              Definities
            </h2>
            <ul className="space-y-3 text-[15px] leading-[1.7] text-[#6B7280] dark:text-[#9CA3AF] list-disc list-inside marker:text-primary">
              <li>
                <strong className="font-medium text-[#1F2937] dark:text-white">Diensten:</strong> De online financiële diensten en tools aangeboden door Konsensi.
              </li>
              <li>
                <strong className="font-medium text-[#1F2937] dark:text-white">Gebruiker:</strong> Iedere natuurlijke persoon die gebruik maakt van de Diensten.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">3.</span>
              Gebruik van de Diensten
            </h2>
            <div className="pl-0">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">3.1. Toegankelijkheid</h3>
              <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
                Konsensi streeft ernaar de Diensten 24/7 beschikbaar te stellen, maar garandeert geen ononderbroken toegang. We kunnen de toegang tijdelijk opschorten voor onderhoud of updates.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">4.</span>
              Intellectueel Eigendom
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
              Alle intellectuele eigendomsrechten met betrekking tot de Diensten, inclusief maar niet beperkt tot software, ontwerpen en inhoud, berusten bij Konsensi. Het is niet toegestaan materiaal te kopiëren of te hergebruiken zonder schriftelijke toestemming.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">5.</span>
              Aansprakelijkheid
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
              Konsensi is niet aansprakelijk voor enige directe of indirecte schade voortvloeiend uit het gebruik van de Diensten, tenzij er sprake is van opzet of grove nalatigheid onzerzijds.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">6.</span>
              Wijzigingen
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
              Konsensi behoudt zich het recht voor deze voorwaarden te allen tijde te wijzigen. Wij zullen gebruikers op de hoogte stellen van wezenlijke wijzigingen via de app of e-mail.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">7.</span>
              Toepasselijk Recht
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
              Op deze voorwaarden is het Nederlands recht van toepassing. Geschillen zullen worden voorgelegd aan de bevoegde rechter in Nederland.
            </p>
          </section>
        </main>

        <div className="mt-12 mb-8 flex flex-col items-center justify-center gap-6">
          <button
            onClick={handleAccept}
            className="bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-10 rounded-[24px] shadow-lg shadow-primary/25 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] w-full sm:w-auto min-w-[280px]"
          >
            Ik begrijp en ga akkoord
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors hover:underline"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
