import React from 'react';
import { useTranslation } from '@/components/utils/LanguageContext';

export default function Maintenance() {
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased">
      {/* Main Content Card */}
      <main className="w-full max-w-[600px] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#E5E7EB] dark:border-[#333] p-8 md:p-12 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-8 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-[80px]" style={{fontSize: '80px'}}>construction</span>
        </div>
        
        {/* Title */}
        <h1 className="text-[#1F2937] dark:text-white text-[32px] font-bold leading-tight mb-4 tracking-tight">
          Onderhoud gepland
        </h1>
        
        {/* Subtitle */}
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal leading-relaxed max-w-[400px] mb-6">
          We zijn bezig met belangrijke updates om Konsensi nog beter te maken.
        </p>
        
        {/* Estimated Return */}
        <div className="mb-10 px-4 py-2 bg-[#F3F4F6] dark:bg-[#333] rounded-lg inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[#3D6456] dark:text-[#8BBDB1] text-[20px]">schedule</span>
          <p className="text-[#3D6456] dark:text-[#8BBDB1] text-lg font-semibold leading-normal">
            Verwacht terug: Binnen 2 uur
          </p>
        </div>
        
        {/* Button */}
        <a 
          className="mb-8 inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-[#E5E7EB] dark:border-[#4B5563] bg-transparent hover:bg-[#F9FAFB] dark:hover:bg-[#2C2C2E] hover:border-[#D1D5DB] transition-colors duration-200 px-6 py-3 min-h-[48px] min-w-[160px]" 
          href="https://konsensi.nl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="text-[#6B7280] dark:text-[#E5E7EB] text-sm font-semibold leading-normal">Ga naar Konsensi.nl</span>
        </a>
        
        {/* Footer Info */}
        <div className="flex items-center justify-center gap-2 text-[#9CA3AF] dark:text-[#6B7280]">
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          <p className="text-sm font-normal">
            Volg onze social media voor live updates.
          </p>
        </div>
      </main>
      
      {/* Footer / Branding Area */}
      <div className="mt-8 opacity-50">
        <p className="text-xs text-[#9CA3AF]">© 2024 Konsensi Budget Beheer</p>
      </div>
    </div>
  );
}
