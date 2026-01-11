import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
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
        navigate('/Dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });


      if (error) {
        throw error;
      }

      // Wait for session to be stored using onAuthStateChange
      await new Promise((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            resolve(session);
          }
        });
        
        // Fallback timeout
        setTimeout(() => {
          subscription.unsubscribe();
          resolve(null);
        }, 2000);
      });

      // Verify session is stored
      const sessionCheck = await supabase.auth.getSession();

      if (!sessionCheck.data?.session) {
        throw new Error('Session not available after login');
      }

      toast({
        title: 'Ingelogd!',
        description: 'Welkom terug!',
      });
      
      
      // Use window.location.href for a full page reload to ensure session is available
      window.location.href = '/Dashboard';
    } catch (error) {
      
      console.error('Auth error:', error);
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Er is iets misgegaan. Probeer het opnieuw.';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          errorMessage = 'Ongeldige email of wachtwoord. Controleer je gegevens en probeer het opnieuw.';
        } else if (error.message.includes('Email rate limit')) {
          errorMessage = 'Te veel login pogingen. Wacht even en probeer het later opnieuw.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Dit account bestaat niet. Controleer je email adres.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Set error state for inline display
      setError(errorMessage);
      
      // Also show toast notification
      toast({
        title: 'Inloggen mislukt',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden bg-[#F8F8F8] dark:bg-[#0a0a0a]">
      {/* Left Side - Login Form */}
      <div className="relative flex w-full flex-col justify-center bg-white dark:bg-[#1a2c26] px-8 py-12 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] lg:w-1/2 lg:px-20 xl:px-24 z-10">
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

        <div className="mx-auto flex w-full max-w-[480px] flex-col">
          {/* Logo */}
          <div className="mb-12 flex items-center">
            <img 
              src="/logo.png" 
              alt="Konsensi Logo" 
              className="h-20 w-auto"
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-10">
            <h1 className="font-heading text-[32px] font-bold leading-tight text-gray-900 dark:text-white mb-2">
              Welkom terug!
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Log in op je account om verder te gaan
            </p>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[20px] flex-shrink-0 mt-0.5">error</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Inloggen mislukt</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
            
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="email">
                E-mailadres
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  id="email"
                  placeholder="naam@voorbeeld.nl"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="password">
                Wachtwoord
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3.5 pl-11 pr-11 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  className="h-5 w-5 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary focus:ring-0 focus:ring-offset-0 transition-colors checked:border-primary checked:bg-primary"
                  type="checkbox"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">Onthoud mij</span>
              </label>
              <Link
                className="text-sm font-medium text-primary hover:text-primary-dark hover:underline transition-colors"
                to="/forgot-password"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 px-6 text-base font-heading font-bold text-white shadow-glow transition-all hover:bg-primary-dark hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] active:bg-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Bezig...' : 'Inloggen'}</span>
              {!loading && (
                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="mx-4 flex-shrink-0 text-sm text-gray-400">of</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-[15px] text-gray-500 dark:text-gray-400">
                Nog geen account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
                >
                  Registreer nu
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#3D6456_0%,#10B981_100%)] px-12 py-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center justify-center max-w-[480px]">
          {/* Image */}
          <div className="relative z-20">
            <img
              alt="Konsensi Financial Illustration"
              className="h-auto w-full max-w-[450px] drop-shadow-2xl rounded-2xl object-contain bg-transparent"
              src="/login .png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
