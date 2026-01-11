import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
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
    if (path === 'PrivacyPolicy') return true;
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
                    className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                    to={createPageUrl('TermsOfService')}
                  >
                    <span className="material-symbols-outlined">description</span>
                    <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                  </Link>
                  <Link
                    className="group flex items-center gap-4 px-4 py-3 rounded-[24px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30 transition-all"
                    to={createPageUrl('PrivacyPolicy')}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
                    <span className="font-bold text-sm">Privacybeleid</span>
                  </Link>
                </nav>
              </aside>

              {/* Main Content Section */}
              <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                  <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                    <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Privacybeleid</h2>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Laatst bijgewerkt op: 30 december 2025</p>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">1. Introductie</h3>
                      <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
                        Konsensi hecht grote waarde aan de bescherming van uw persoonsgegevens. In dit Privacybeleid leggen we uit welke gegevens we verzamelen en waarom.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">2. Welke gegevens verzamelen wij?</h3>
                      <ul className="list-disc pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
                        <li>
                          <strong className="font-medium text-[#1F2937] dark:text-white">Persoonsgegevens:</strong> Naam, e-mailadres, telefoonnummer, adres, financiële gegevens (inkomen, uitgaven, schulden).
                        </li>
                        <li>
                          <strong className="font-medium text-[#1F2937] dark:text-white">Gebruiksgegevens:</strong> Informatie over hoe u onze Diensten gebruikt (IP-adres, browsertype, bezochte pagina's).
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">3. Hoe gebruiken wij uw gegevens?</h3>
                      <h4 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">3.1. Diensten leveren</h4>
                      <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
                        Voor het aanbieden en verbeteren van onze budgetbeheer- en schuldhulpdiensten.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">4. Delen met derden</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        Wij delen uw gegevens alleen met derden indien dit noodzakelijk is voor de Dienstverlening of op basis van wettelijke verplichting.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">5. Beveiliging</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beveiligen.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">6. Uw rechten</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        U heeft het recht op inzage, correctie, verwijdering en beperking van verwerking van uw gegevens.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">7. Contact</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        Voor vragen over dit Privacybeleid kunt u contact met ons opnemen via{' '}
                        <a className="text-primary hover:underline" href="mailto:info@konsensi.nl">
                          info@konsensi.nl
                        </a>
                        .
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
    <div className="bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <h1 className="text-[#1F2937] dark:text-white text-3xl sm:text-4xl font-bold tracking-tight">
                Privacybeleid
              </h1>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                className="sr-only peer"
                type="checkbox"
                checked={darkMode}
                onChange={toggleTheme}
              />
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-300 flex items-center justify-between px-1.5 peer-focus:ring-2 peer-focus:ring-primary/50">
                <span className="material-symbols-outlined text-[18px] text-gray-400 dark:text-gray-500">light_mode</span>
                <span className="material-symbols-outlined text-[18px] text-gray-400 dark:text-gray-500">dark_mode</span>
              </div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${darkMode ? 'translate-x-8' : 'translate-x-0'}`}>
                <span className={`material-symbols-outlined text-[16px] text-yellow-500 absolute transition-all duration-300 ${darkMode ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`}>
                  light_mode
                </span>
                <span className={`material-symbols-outlined text-[16px] text-primary absolute transition-all duration-300 ${darkMode ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`}>
                  dark_mode
                </span>
              </div>
            </label>
          </div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium pl-12">
            Laatst bijgewerkt op: 30 december 2025
          </p>
        </header>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] p-8 sm:p-10 mb-12">
          <section className="mb-8">
            <h2 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">1. Introductie</h2>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
              Konsensi hecht grote waarde aan de bescherming van uw persoonsgegevens. In dit Privacybeleid leggen we uit welke gegevens we verzamelen en waarom.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">2. Welke gegevens verzamelen wij?</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
              <li>
                <strong className="font-medium text-[#1F2937] dark:text-white">Persoonsgegevens:</strong> Naam, e-mailadres, telefoonnummer, adres, financiële gegevens (inkomen, uitgaven, schulden).
              </li>
              <li>
                <strong className="font-medium text-[#1F2937] dark:text-white">Gebruiksgegevens:</strong> Informatie over hoe u onze Diensten gebruikt (IP-adres, browsertype, bezochte pagina's).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">3. Hoe gebruiken wij uw gegevens?</h2>
            <h3 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">3.1. Diensten leveren</h3>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
              Voor het aanbieden en verbeteren van onze budgetbeheer- en schuldhulpdiensten.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">4. Delen met derden</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              Wij delen uw gegevens alleen met derden indien dit noodzakelijk is voor de Dienstverlening of op basis van wettelijke verplichting.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">5. Beveiliging</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              Wij nemen passende technische en organisatorische maatregelen om uw gegevens te beveiligen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">6. Uw rechten</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              U heeft het recht op inzage, correctie, verwijdering en beperking van verwerking van uw gegevens.
            </p>
          </section>

          <section>
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">7. Contact</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              Voor vragen over dit Privacybeleid kunt u contact met ons opnemen via{' '}
              <a className="text-primary hover:underline" href="mailto:info@konsensi.nl">
                info@konsensi.nl
              </a>
              .
            </p>
          </section>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mb-12">
          <button
            onClick={handleAccept}
            className="flex items-center justify-center w-full max-w-[480px] h-[52px] bg-primary hover:bg-primary-dark text-white text-base font-bold rounded-[24px] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Ik begrijp en ga akkoord
          </button>
          <Link
            to="/login"
            className="text-gray-600 dark:text-gray-400 hover:text-primary text-sm font-medium underline transition-colors"
          >
            Terug naar login
          </Link>
        </div>
      </div>
    </div>
  );
}
