import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Navigate to email sent page
      navigate('/email-sent', { state: { email } });
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
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

      <main className="w-full max-w-[480px] bg-white dark:bg-[#1a2c26] border border-gray-100 dark:border-[#2A3F36] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] p-8 md:p-12 relative flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-1 mb-10">
          <div className="flex items-center mb-1">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-16 w-auto"
            />
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center w-full mb-8">
          <h1 className="font-display font-bold text-3xl leading-tight text-[#1F2937] dark:text-white mb-3">
            Wachtwoord vergeten?
          </h1>
          <p className="text-base text-[#6B7280] dark:text-[#9CA3AF] font-normal leading-relaxed px-2">
            Geen probleem! Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          {/* Email Field */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2" htmlFor="email">
              E-mailadres
            </label>
            <div className="group relative flex items-center w-full rounded-[24px] bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20">
              <div className="pl-4 text-gray-400 dark:text-gray-500">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  mail
                </span>
              </div>
              <input
                className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 py-3.5 px-3"
                id="email"
                name="email"
                placeholder="naam@voorbeeld.nl"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="w-full mt-8 bg-primary hover:bg-[#34d399] active:bg-[#059669] text-black font-display font-semibold text-base py-4 px-6 rounded-[24px] shadow-[0_4px_12px_rgba(16,185,129,0.2)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? 'Versturen...' : 'Herstel link versturen'}</span>
            {!loading && (
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                arrow_forward
              </span>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              className="text-[15px] text-gray-600 dark:text-[#a1a1a1] hover:text-primary dark:hover:text-primary underline decoration-1 underline-offset-4 transition-colors"
              to="/login"
            >
              ← Terug naar inloggen
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
