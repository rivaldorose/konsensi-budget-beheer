import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export default function EmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
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

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'E-mail opnieuw verstuurd! ✅',
        description: 'Check je inbox opnieuw.',
      });
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Kon e-mail niet opnieuw versturen.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      <div className="relative w-full max-w-[480px] bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2a2a2a] p-12 flex flex-col items-center text-center">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="absolute top-6 right-6 relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

        {/* Logo Section */}
        <div className="flex flex-col items-center gap-1 mb-10">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-16 w-auto"
            />
          </div>
          <span className="text-sm font-normal text-primary tracking-wide">Budgetbeheer</span>
        </div>

        {/* Icon: Mail Check */}
        <div className="mb-8">
          <span className="material-symbols-outlined text-[64px] text-primary leading-none">
            mark_email_read
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-[32px] leading-tight text-gray-900 dark:text-white mb-3">
          E-mail verstuurd!
        </h1>

        {/* Subtitle */}
        <p className="text-base text-gray-600 dark:text-[#a1a1a1] mb-8 leading-relaxed">
          We hebben een e-mail gestuurd naar je opgegeven adres. Volg de instructies om je wachtwoord opnieuw in te stellen.
        </p>

        {/* Action Section */}
        <div className="w-full flex flex-col items-center">
          {/* Reminder Text */}
          <p className="text-sm text-gray-600 dark:text-[#a1a1a1] mb-6">
            Controleer ook je spam-map als je de e-mail niet ziet.
          </p>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full group flex items-center justify-center gap-3 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-[14px] px-4 transition-all duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-[#a1a1a1] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              refresh
            </span>
            <span className="font-semibold text-[15px] text-gray-700 dark:text-[#a1a1a1] group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {resending ? 'Versturen...' : 'Opnieuw versturen'}
            </span>
          </button>

          {/* Back to Login Link */}
          <Link
            className="text-[15px] text-gray-600 dark:text-[#a1a1a1] hover:text-primary dark:hover:text-primary hover:underline transition-colors flex items-center gap-1 mt-1"
            to="/login"
          >
            ← Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
