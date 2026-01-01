import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/toast';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '' });
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default to light for signup
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

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

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!termsAccepted) {
      toast({
        title: 'Fout',
        description: 'Je moet akkoord gaan met de voorwaarden.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: 'Check je email! 📧',
          description: 'We hebben een bevestigingslink gestuurd naar je email.',
        });
      } else {
        // Auto sign in after signup
        toast({
          title: 'Account aangemaakt! ✅',
          description: 'Welkom bij Konsensi!',
        });
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthWidth = () => {
    if (passwordStrength.strength <= 1) return '1/3';
    if (passwordStrength.strength <= 3) return '2/3';
    return 'full';
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white dark:bg-background-dark">
      {/* LEFT SIDE: Form Section */}
      <div className="relative flex w-full lg:w-1/2 flex-col justify-center overflow-y-auto bg-white dark:bg-[#0a0a0a] shadow-subtle px-6 py-10 lg:px-20 lg:py-16 z-10">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
          <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
            <input
              className="sr-only"
              id="theme-toggle"
              type="checkbox"
              checked={darkMode}
              onChange={toggleTheme}
            />
            <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>
                light_mode
              </span>
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>
                dark_mode
              </span>
              <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
            </div>
          </label>
        </div>

        <div className="mx-auto w-full max-w-[480px] animate-fade-in">
          {/* Logo */}
          <div className="mb-12 flex items-center">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-20 w-auto"
            />
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display font-bold text-[32px] text-text-main dark:text-white leading-tight mb-2">
              Maak je account aan
            </h1>
            <p className="font-body text-base text-text-sub dark:text-[#a1a1a1]">
              Start vandaag nog met budgetteren
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div>
              <label className="block font-body font-semibold text-sm text-gray-700 dark:text-[#a1a1a1] mb-2" htmlFor="fullname">
                Volledige naam
              </label>
              <div className="group flex w-full items-center rounded-xl bg-input-bg dark:bg-[#1a1a1a] border border-input-border dark:border-[#2a2a2a] px-4 py-3.5 focus-within:border-primary focus-within:bg-white dark:focus-within:bg-[#1a1a1a] focus-within:shadow-glow transition-all">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 mr-3 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  person
                </span>
                <input
                  className="w-full bg-transparent border-none p-0 text-text-main dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base"
                  id="fullname"
                  placeholder="Voor- en achternaam"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block font-body font-semibold text-sm text-gray-700 dark:text-[#a1a1a1] mb-2" htmlFor="email">
                E-mailadres
              </label>
              <div className="group flex w-full items-center rounded-xl bg-input-bg dark:bg-[#1a1a1a] border border-input-border dark:border-[#2a2a2a] px-4 py-3.5 focus-within:border-primary focus-within:bg-white dark:focus-within:bg-[#1a1a1a] focus-within:shadow-glow transition-all">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 mr-3 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  mail
                </span>
                <input
                  className="w-full bg-transparent border-none p-0 text-text-main dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base"
                  id="email"
                  placeholder="naam@voorbeeld.nl"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-body font-semibold text-sm text-gray-700 dark:text-[#a1a1a1] mb-2" htmlFor="password">
                Wachtwoord
              </label>
              <div className="group flex w-full items-center rounded-xl bg-input-bg dark:bg-[#1a1a1a] border border-input-border dark:border-[#2a2a2a] px-4 py-3.5 focus-within:border-primary focus-within:bg-white dark:focus-within:bg-[#1a1a1a] focus-within:shadow-glow transition-all">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 mr-3 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <input
                  className="w-full bg-transparent border-none p-0 text-text-main dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white focus:outline-none flex items-center"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className={`strength-bar h-full rounded-full ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs font-body text-right ${passwordStrength.color === 'bg-red-500' ? 'text-red-600' : passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block font-body font-semibold text-sm text-gray-700 dark:text-[#a1a1a1] mb-2" htmlFor="confirm-password">
                Bevestig wachtwoord
              </label>
              <div className="group flex w-full items-center rounded-xl bg-input-bg dark:bg-[#1a1a1a] border border-input-border dark:border-[#2a2a2a] px-4 py-3.5 focus-within:border-primary focus-within:bg-white dark:focus-within:bg-[#1a1a1a] focus-within:shadow-glow transition-all">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 mr-3 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <input
                  className="w-full bg-transparent border-none p-0 text-text-main dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-base"
                  id="confirm-password"
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword.length > 0 && (
                  <span className={`material-symbols-outlined ml-2 ${passwordsMatch ? 'text-primary' : 'text-red-500'}`} style={{ fontSize: '20px' }}>
                    {passwordsMatch ? 'check_circle' : 'cancel'}
                  </span>
                )}
                <button
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white focus:outline-none flex items-center ml-2"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mt-1 mb-2 checkbox-wrapper">
              <label className="relative flex items-center cursor-pointer">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <div className="h-5 w-5 rounded border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] transition-colors peer-focus:ring-2 peer-focus:ring-primary/20 flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary">
                  <svg className="hidden w-3.5 h-3.5 text-white pointer-events-none peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                  </svg>
                </div>
              </label>
              <p className="text-sm text-text-sub dark:text-[#a1a1a1] leading-snug">
                Ik ga akkoord met de{' '}
                <a className="text-primary hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                  Algemene Voorwaarden
                </a>
                {' '}en{' '}
                <a className="text-primary hover:underline" href="#" onClick={(e) => e.preventDefault()}>
                  Privacybeleid
                </a>
                .
              </p>
            </div>

            {/* Submit Button */}
            <button
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-4 text-white shadow-button transition-all hover:bg-primary-hover hover:scale-[1.02] active:bg-primary-active active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              <span className="font-display font-semibold text-base">
                {loading ? 'Bezig...' : 'Account aanmaken'}
              </span>
              {!loading && (
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: '20px' }}>
                  arrow_forward
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-[#2a2a2a]"></div>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-[15px] text-text-sub dark:text-[#a1a1a1]">Heb je al een account? </span>
              <Link className="text-[15px] font-semibold text-primary hover:text-primary-hover hover:underline" to="/login">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Visual */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative p-16 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D6456] to-[#10B981] z-0"></div>
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 pointer-events-none"></div>
        {/* Floating shapes */}
        <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-[#10B981] opacity-20 blur-3xl"></div>
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-[520px]">
          {/* Illustration */}
          <div className="relative w-full max-w-[400px]">
            <img
              className="w-full drop-shadow-2xl object-contain bg-transparent"
              alt="Konsensi Sign Up Illustration"
              src="/sign up.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

