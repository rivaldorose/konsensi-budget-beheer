import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PasswordSaved() {
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

  return (
    <div className="bg-gray-100 dark:bg-[#0a0a0a] font-display min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
      {/* Theme Toggle - Outside the card, top right */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="absolute top-6 right-6 relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 z-10"
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

      <main className="w-full max-w-[480px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-8 py-12 md:p-12 flex flex-col items-center relative overflow-hidden">
        {/* Header: Logo Section */}
        <header className="flex flex-col items-center gap-2 mb-10">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-16 w-auto"
            />
          </div>
        </header>

        {/* Icon Section */}
        <div className="mb-8 flex items-center justify-center">
          <div className="text-primary">
            <span className="material-symbols-outlined text-[64px]">
              check_circle
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3 mb-8 w-full">
          <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight text-center">
            Wachtwoord succesvol gewijzigd!
          </h2>
          <p className="text-gray-600 dark:text-[#a1a1a1] text-base font-normal leading-relaxed text-center max-w-[360px]">
            Je wachtwoord is veilig bijgewerkt. Je kunt nu inloggen met je nieuwe gegevens.
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full flex flex-col items-center gap-6">
          <Link
            to="/login"
            className="group w-full flex items-center justify-center gap-3 bg-primary hover:bg-[#34d399] active:bg-[#059669] text-black text-base font-semibold py-4 px-6 rounded-[12px] shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Naar inloggen</span>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>

          {/* Reminder Text */}
          <p className="text-sm text-gray-600 dark:text-[#a1a1a1] italic text-center">
            Vergeet niet je nieuwe wachtwoord te onthouden!
          </p>
        </div>
      </main>
    </div>
  );
}

