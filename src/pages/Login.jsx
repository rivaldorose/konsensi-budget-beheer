import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    // #region agent log
    const imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAKU8ojJdUefYP9ZGYgNyFzApPlfgxguGrGWsHgxNl_eqzsgcSjbdc0LxVjRX0ZoQspG9GZB6-x0R5C6FkCB3CmpGb68zSxRYfKKfU4WAGSCv7OxlarK5k0r8w0Mjj90W9mUUEZ8uLyLWcgvYliMzuzt-sUDbmhSZFH8ZWFa5zdf0TsHUbhJJwbuhDUCTlFV8HFaPy_Nqa8z-T1jeNMnuAnMIoXKZ51_y35oolrPjuWTnxX5oV-1mG1su2iPhcFPW7eipy9Sxc916A";
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:35',message:'Login component mounted - image URL in code',data:{imageUrlPrefix:imageUrl.substring(0,80)+'...',urlLength:imageUrl.length,pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
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
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Ingelogd! ✅',
          description: 'Welkom terug!',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
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
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Left Side - Login Form */}
      <div className="relative flex w-full flex-col justify-center bg-white dark:bg-surface-dark px-8 py-12 shadow-soft lg:w-1/2 lg:px-20 xl:px-24 z-10">
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
          <div className="mb-12 flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px] text-brand-dark dark:text-primary">forest</span>
            <div className="flex flex-col leading-none">
              <span className="font-heading text-2xl font-bold tracking-tight text-brand-dark dark:text-white">KONSENSI</span>
              <span className="text-sm font-medium tracking-wide text-primary uppercase">Budgetbeheer</span>
            </div>
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
              <a
                className="text-sm font-medium text-primary hover:text-primary-dark hover:underline transition-colors"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast({
                    title: 'Wachtwoord vergeten',
                    description: 'Neem contact op met support voor hulp bij het resetten van je wachtwoord.',
                  });
                }}
              >
                Wachtwoord vergeten?
              </a>
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
                <button
                  type="button"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  Registreer nu
                </button>
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

        <div className="relative z-10 flex flex-col items-center max-w-[480px]">
          {/* Image */}
          <div className="mb-12 relative z-20">
            <img
              alt="Konsensi Financial Illustration"
              className="h-auto w-full max-w-[450px] drop-shadow-2xl rounded-2xl object-contain bg-transparent"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKU8ojJdUefYP9ZGYgNyFzApPlfgxguGrGWsHgxNl_eqzsgcSjbdc0LxVjRX0ZoQspG9GZB6-x0R5C6FkCB3CmpGb68zSxRYfKKfU4WAGSCv7OxlarK5k0r8w0Mjj90W9mUUEZ8uLyLWcgvYliMzuzt-sUDbmhSZFH8ZWFa5zdf0TsHUbhJJwbuhDUCTlFV8HFaPy_Nqa8z-T1jeNMnuAnMIoXKZ51_y35oolrPjuWTnxX5oV-1mG1su2iPhcFPW7eipy9Sxc916A"
              onLoad={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:284',message:'Image loaded successfully',data:{src:e.target.src,width:e.target.naturalWidth,height:e.target.naturalHeight,computedDisplay:window.getComputedStyle(e.target).display,computedVisibility:window.getComputedStyle(e.target).visibility,computedOpacity:window.getComputedStyle(e.target).opacity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
              }}
              onError={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:292',message:'Image failed to load',data:{src:e.target.src,error:'Image load error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.error('Image failed to load', e);
              }}
              ref={(img) => {
                if (img) {
                  // #region agent log
                  setTimeout(() => {
                    const styles = window.getComputedStyle(img);
                    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.jsx:301',message:'Image ref - initial state',data:{src:img.src,srcUrl:img.currentSrc||img.src,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,display:styles.display,visibility:styles.visibility,opacity:styles.opacity,width:styles.width,height:styles.height,parentDisplay:window.getComputedStyle(img.parentElement).display},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                  }, 100);
                  // #endregion
                }
              }}
              style={{ display: 'block' }}
            />
          </div>

          {/* Testimonial Card */}
          <div className="w-full rounded-2xl border border-white/30 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
            <div className="mb-4 text-green-300">
              <span className="material-symbols-outlined text-[32px]">format_quote</span>
            </div>
            <p className="mb-6 text-lg font-medium leading-relaxed text-white">
              "Konsensi heeft me geholpen om weer grip op mijn financiën te krijgen! Het is overzichtelijk, snel en geeft me rust."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/30 bg-white/20">
                <img
                  alt="User Avatar"
                  className="h-full w-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzZnZrhF4NnwzsgPqobjmpkEmtdAIhVqpoOV9W00OkUE_ubC7LKdq0r9HsgQMJldF_NbuUoz6DFY2RykbQfO0Gj8bjS4ypuckKroFyoLBPFGwlj7JcIwGZ3BI9Xzcxf63sK26FWTmKJrNtMZpxLOaTVE68yYD_aDw0-YInMDmn8F8Xg5SSCepGNmr3XLP7CxUMveUhNk2FkDfPffmIe-sETkQOv5UvYpptaGAvtlLGDUUOoUyxpLYXVi0n8lEggpybbvYH4Fdi6Gs"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white">— Lisa, 24 jaar</p>
                <p className="text-xs text-white/70 italic">Student & Freelancer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
