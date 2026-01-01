import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '' });
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Calculate password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength({ strength: 0, label: '', color: '' });
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;

    let label = '';
    let color = '';
    if (strength <= 1) {
      label = 'Zwak';
      color = 'bg-red-500';
    } else if (strength <= 3) {
      label = 'Gemiddeld';
      color = 'bg-yellow-500';
    } else {
      label = 'Sterk';
      color = 'bg-green-500';
    }

    setPasswordStrength({ strength, label, color });
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    if (confirmPassword.length > 0) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: 'Fout',
        description: 'Wachtwoorden komen niet overeen.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      navigate('/password-saved');
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
    <div className="bg-gray-100 dark:bg-[#0a0a0a] min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
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

      <div className="w-full max-w-[480px] bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2a2a2a] p-8 md:p-12 relative flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-1 mb-10">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-16 w-auto"
            />
          </div>
        </div>

        {/* Headings */}
        <div className="w-full text-center mb-8">
          <h2 className="text-gray-900 dark:text-white text-[32px] font-bold leading-tight mb-3">
            Nieuw wachtwoord instellen
          </h2>
          <p className="text-gray-600 dark:text-[#a1a1a1] text-base leading-normal">
            Kies een nieuw, sterk wachtwoord voor je account.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* New Password Field */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-[#a1a1a1] dark:text-[#a1a1a1] text-sm font-semibold pl-1" htmlFor="new-password">
              Nieuw wachtwoord
            </label>
            <div className="group flex items-center w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-[12px] px-4 py-3.5 gap-3 transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 hover:border-gray-300 dark:hover:border-[#4a4a4a]">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-500 text-[20px]">lock</span>
              <input
                className="flex-1 bg-transparent border-none p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 text-base"
                id="new-password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-[#a1a1a1] flex items-center justify-center transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2 px-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-medium ${passwordStrength.color === 'bg-red-500' ? 'text-red-500' : passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-500' : 'text-green-500'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-[#111] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="text-[#a1a1a1] dark:text-[#a1a1a1] text-sm font-semibold pl-1" htmlFor="confirm-password">
              Bevestig nieuw wachtwoord
            </label>
            <div className="group flex items-center w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-[12px] px-4 py-3.5 gap-3 transition-all duration-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 hover:border-gray-300 dark:hover:border-[#4a4a4a] relative">
              <span className="material-symbols-outlined text-gray-500 dark:text-gray-500 text-[20px]">lock</span>
              <input
                className="flex-1 bg-transparent border-none p-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 text-base"
                id="confirm-password"
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex items-center gap-3">
                {confirmPassword.length > 0 && (
                  <span className={`material-symbols-outlined text-[20px] ${passwordsMatch ? 'text-primary' : 'text-red-500'}`}>
                    {passwordsMatch ? 'check_circle' : 'cancel'}
                  </span>
                )}
                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-[#a1a1a1] flex items-center justify-center transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="mt-8 px-6 py-3 rounded-[12px] bg-primary hover:bg-[#34d399] active:bg-[#059669] text-black font-semibold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-200 transform active:scale-[0.98] w-full flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Opslaan...' : 'Opslaan'}
            {!loading && (
              <span className="material-symbols-outlined text-black" style={{ fontSize: '20px' }}>
                arrow_forward
              </span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <Link
          className="mt-8 text-gray-600 dark:text-[#a1a1a1] text-[15px] font-medium hover:text-primary dark:hover:text-primary hover:underline transition-colors flex items-center gap-2"
          to="/login"
        >
          ← Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}

