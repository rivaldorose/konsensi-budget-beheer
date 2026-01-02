import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white antialiased min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 overflow-x-hidden">
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
              <h1 className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-bold tracking-tight">
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
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium pl-12">
            Laatst bijgewerkt op: 30 december 2025
          </p>
        </header>

        <div className="bg-white dark:bg-[#1a2c26] rounded-2xl shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2a3c36] p-8 sm:p-10 mb-12">
          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">1. Introductie</h2>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              Konsensi hecht grote waarde aan de bescherming van uw persoonsgegevens. In dit Privacybeleid leggen we uit welke gegevens we verzamelen en waarom.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">2. Welke gegevens verzamelen wij?</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
              <li>
                <strong className="font-medium text-gray-900 dark:text-gray-200">Persoonsgegevens:</strong> Naam, e-mailadres, telefoonnummer, adres, financiële gegevens (inkomen, uitgaven, schulden).
              </li>
              <li>
                <strong className="font-medium text-gray-900 dark:text-gray-200">Gebruiksgegevens:</strong> Informatie over hoe u onze Diensten gebruikt (IP-adres, browsertype, bezochte pagina's).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-gray-900 dark:text-white text-xl font-semibold mb-4">3. Hoe gebruiken wij uw gegevens?</h2>
            <h3 className="text-gray-800 dark:text-gray-200 text-lg font-medium mb-2">3.1. Diensten leveren</h3>
            <p className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
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

