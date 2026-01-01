import React from 'react';
import { Link } from 'react-router-dom';

export default function PasswordSaved() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[480px] bg-white dark:bg-[#1A2C26] border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-modal px-8 py-12 md:p-12 flex flex-col items-center relative overflow-hidden">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>

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
          <div className="rounded-full bg-primary/10 p-4 animate-scale-in">
            <span className="material-symbols-outlined text-[64px] text-primary">
              check_circle
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3 mb-8 w-full">
          <h2 className="text-text-main dark:text-white text-[32px] font-bold leading-tight text-center">
            Wachtwoord opgeslagen!
          </h2>
          <p className="text-text-sub dark:text-gray-300 text-base font-normal leading-relaxed text-center max-w-[360px]">
            Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen met je nieuwe gegevens.
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full flex flex-col items-center">
          <Link
            to="/login"
            className="group w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-base font-semibold py-4 px-6 rounded-xl shadow-btn transition-all duration-200 transform hover:scale-[1.02]"
          >
            <span>Naar inloggen</span>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>

          {/* Reminder Text */}
          <p className="mt-6 text-sm text-gray-400 dark:text-gray-500 italic text-center">
            Vergeet niet je nieuwe wachtwoord te onthouden!
          </p>
        </div>
      </main>
    </div>
  );
}

