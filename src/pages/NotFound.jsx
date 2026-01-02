import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/components/utils/LanguageContext';

export default function NotFound() {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#0d1b17] dark:text-white antialiased">
      {/* Top Navigation Bar */}
      <div className="w-full flex justify-center border-b border-solid border-[#e7f3ef] dark:border-[#1E2D28] bg-white/50 dark:bg-[#10221c]/50 backdrop-blur-sm fixed top-0 z-50">
        <div className="layout-content-container flex flex-col max-w-[960px] flex-1 px-4 sm:px-10">
          <header className="flex items-center justify-between whitespace-nowrap py-3">
            <Link to="/Dashboard" className="flex items-center gap-4 text-[#0d1b17] dark:text-white">
              <div className="size-6 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-[#0d1b17] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Konsensi</h2>
            </Link>
          </header>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 pt-20">
        <div className="layout-content-container flex flex-col items-center justify-center w-full max-w-[960px] flex-1">
          {/* Error Card */}
          <div className="flex flex-col items-center bg-white dark:bg-[#1a2c26] rounded-[24px] p-8 md:p-12 shadow-soft border border-[#E5E7EB] dark:border-[#2A3F36] max-w-[600px] w-full mx-auto transition-all duration-300">
            {/* Icon */}
            <div className="mb-8">
              <span className="material-symbols-outlined text-[#EF4444] text-[80px]" style={{fontSize: '80px'}}>sentiment_dissatisfied</span>
            </div>
            
            {/* Text Content */}
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <h1 className="text-[#1F2937] dark:text-white text-[32px] font-bold leading-tight tracking-[-0.015em]">
                Oeps! Pagina niet gevonden.
              </h1>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal leading-relaxed max-w-[400px]">
                De pagina die je zoekt bestaat niet of is verplaatst.
              </p>
            </div>
            
            {/* Action Button */}
            <Link 
              to="/Dashboard"
              className="flex min-w-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] px-8 py-4 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <span className="truncate">Terug naar Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
