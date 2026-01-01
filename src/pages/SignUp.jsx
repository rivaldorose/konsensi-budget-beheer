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
    return true; // Default to dark for signup
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
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background-dark dark:bg-background-dark">
      {/* LEFT SIDE: Form Section */}
      <div className="relative flex w-full flex-1 flex-col justify-center bg-[#0a0a0a] dark:bg-[#0a0a0a] px-6 py-12 lg:w-1/2 lg:px-20 z-10">
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
            <h1 className="text-[32px] font-bold leading-tight text-white mb-2 dark:text-white">
              Maak je account aan
            </h1>
            <p className="text-base text-[#a1a1a1] dark:text-[#a1a1a1] font-normal">
              Start vandaag nog met budgetteren
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a1a1a1] dark:text-[#a1a1a1]" htmlFor="fullname">
                Volledige naam
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-gray-500 dark:text-gray-500 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  person
                </span>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] dark:border-[#2a2a2a] bg-[#1a1a1a] dark:bg-[#1a1a1a] py-3.5 pl-12 pr-4 text-white dark:text-white placeholder-gray-500 dark:placeholder-gray-500 shadow-sm transition-all focus:border-primary focus:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] focus:ring-1 focus:ring-primary outline-none"
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a1a1a1] dark:text-[#a1a1a1]" htmlFor="email">
                E-mailadres
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-gray-500 dark:text-gray-500 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  mail
                </span>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] dark:border-[#2a2a2a] bg-[#1a1a1a] dark:bg-[#1a1a1a] py-3.5 pl-12 pr-4 text-white dark:text-white placeholder-gray-500 dark:placeholder-gray-500 shadow-sm transition-all focus:border-primary focus:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] focus:ring-1 focus:ring-primary outline-none"
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a1a1a1] dark:text-[#a1a1a1]" htmlFor="password">
                Wachtwoord
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-gray-500 dark:text-gray-500 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] dark:border-[#2a2a2a] bg-[#1a1a1a] dark:bg-[#1a1a1a] py-3.5 pl-12 pr-12 text-white dark:text-white placeholder-gray-500 dark:placeholder-gray-500 shadow-sm transition-all focus:border-primary focus:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] focus:ring-1 focus:ring-primary outline-none"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  className="absolute right-4 flex items-center justify-center text-gray-500 dark:text-gray-500 hover:text-white dark:hover:text-white transition-colors cursor-pointer rounded-full p-1 hover:bg-white/5"
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
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="h-1.5 w-full rounded-full bg-[#2a2a2a] dark:bg-[#2a2a2a] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${passwordStrength.color} shadow-[0_0_10px_rgba(234,179,8,0.5)]`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs font-medium text-right ${passwordStrength.color.replace('bg-', 'text-')}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#a1a1a1] dark:text-[#a1a1a1]" htmlFor="confirm-password">
                Bevestig wachtwoord
              </label>
              <div className="relative flex items-center group">
                <span className="material-symbols-outlined absolute left-4 text-gray-500 dark:text-gray-500 transition-colors group-focus-within:text-primary" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <input
                  className="w-full rounded-xl border border-[#2a2a2a] dark:border-[#2a2a2a] bg-[#1a1a1a] dark:bg-[#1a1a1a] py-3.5 pl-12 pr-12 text-white dark:text-white placeholder-gray-500 dark:placeholder-gray-500 shadow-sm transition-all focus:border-primary focus:bg-[#1a1a1a] dark:focus:bg-[#1a1a1a] focus:ring-1 focus:ring-primary outline-none"
                  id="confirm-password"
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword.length > 0 && (
                  <span className={`material-symbols-outlined absolute right-12 ${passwordsMatch ? 'text-primary' : 'text-red-500'}`} style={{ fontSize: '20px' }}>
                    {passwordsMatch ? 'check_circle' : 'cancel'}
                  </span>
                )}
                <button
                  className="absolute right-4 flex items-center justify-center text-gray-500 dark:text-gray-500 hover:text-white dark:hover:text-white transition-colors cursor-pointer rounded-full p-1 hover:bg-white/5"
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
            <div className="mt-2 flex items-start gap-3">
              <div className="relative flex h-5 items-center">
                <input
                  className="peer h-5 w-5 appearance-none rounded border border-[#2a2a2a] dark:border-[#2a2a2a] bg-[#1a1a1a] dark:bg-[#1a1a1a] transition-all checked:border-primary checked:bg-primary hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-[#0a0a0a] cursor-pointer"
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <span className="material-symbols-outlined pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" style={{ fontSize: '16px' }}>
                  check
                </span>
              </div>
              <label className="text-sm leading-relaxed text-[#a1a1a1] dark:text-[#a1a1a1] select-none cursor-pointer" htmlFor="terms">
                Ik ga akkoord met de{' '}
                <a className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-[#34d399] hover:decoration-primary" href="#" onClick={(e) => e.preventDefault()}>
                  Algemene Voorwaarden
                </a>
                {' '}en{' '}
                <a className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-[#34d399] hover:decoration-primary" href="#" onClick={(e) => e.preventDefault()}>
                  Privacybeleid
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-[0_4px_14px_0_rgba(16,183,127,0.39)] transition-all hover:bg-emerald-600 hover:shadow-[0_6px_20px_rgba(16,183,127,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Bezig...' : 'Account aanmaken'}
              {!loading && (
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: '20px' }}>
                  arrow_forward
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-[#2a2a2a] dark:bg-[#2a2a2a]"></div>

            {/* Login Link */}
            <p className="text-center text-[15px] text-[#a1a1a1] dark:text-[#a1a1a1]">
              Heb je al een account?{' '}
              <Link className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:text-[#34d399] hover:decoration-primary" to="/login">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Illustration Section */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gradient-to-br from-[#059669] to-[#10b981] relative overflow-hidden p-12">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] translate-y-1/3 -translate-x-1/3 rounded-full bg-black/10 blur-3xl"></div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-[440px]">
          {/* Illustration Area */}
          <div className="relative flex items-center justify-center">
            <img
              className="relative w-full max-w-[450px] drop-shadow-2xl object-contain bg-transparent"
              alt="Konsensi Sign Up Illustration"
              src="/sign up.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

