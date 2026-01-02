import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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

  const handleAccept = () => {
    // Navigate back or to login
    navigate(-1);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display transition-colors duration-200 antialiased min-h-screen w-full flex flex-col items-center py-10 px-4 md:px-8">
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
              <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
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
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 pl-0 md:pl-12">
            Laatst bijgewerkt op: 30 december 2025
          </p>
        </header>

        <main className="bg-white dark:bg-[#182823] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2A4037] p-6 md:p-10 lg:p-12 overflow-hidden">
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">1.</span>
              Introductie
            </h2>
            <p className="text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300">
              Welkom bij Konsensi Budgetbeheer. Door gebruik te maken van onze diensten ga je akkoord met de onderstaande algemene voorwaarden. Lees deze zorgvuldig door voordat je onze website of applicatie gebruikt.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-primary opacity-80">2.</span>
              Definities
            </h2>
            <ul className="space-y-3 text-[15px] leading-[1.7] text-gray-600 dark:text-gray-300 list-disc list-inside marker:text-primary">
              <li>
                <strong className="font-medium text-gray-800 dark:text-gray-200">Diensten:</strong> De online financiële diensten en tools aangeboden door Konsensi.
              </li>
              <li>
                <strong className="font-medium text-gray-800 dark:text-gray-200">Gebruiker:</strong> Iedere natuurlijke persoon die gebruik maakt van de Diensten.
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

