import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { SecuritySettings as SecuritySettingsEntity } from '@/api/entities';

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

  // 2FA states
  const [show2FAStep, setShow2FAStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingSession, setPendingSession] = useState(null);
  const [pendingUserId, setPendingUserId] = useState(null);

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

      // Check if user has 2FA enabled
      const userId = data.user?.id;
      if (userId) {
        try {
          const securitySettings = await SecuritySettingsEntity.filter({ user_id: userId });
          if (securitySettings.length > 0 && securitySettings[0].two_factor_enabled) {
            // User has 2FA enabled, show 2FA step
            setPendingSession(data.session);
            setPendingUserId(userId);
            setShow2FAStep(true);
            setLoading(false);
            return;
          }
        } catch (settingsError) {
          console.error('Error checking 2FA settings:', settingsError);
          // Continue with login if we can't check 2FA settings
        }
      }

      // No 2FA, proceed with login
      await completeLogin();
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

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (twoFactorCode.length !== 6) {
      setError('Voer een geldige 6-cijferige code in.');
      setLoading(false);
      return;
    }

    try {
      // Get the stored TOTP secret for verification
      const securitySettings = await SecuritySettingsEntity.filter({ user_id: pendingUserId });

      if (securitySettings.length === 0 || !securitySettings[0].totp_secret) {
        throw new Error('2FA configuratie niet gevonden.');
      }

      const storedSecret = securitySettings[0].totp_secret;
      console.log('[2FA Debug] Stored secret from DB:', storedSecret);

      // Verify the TOTP code
      // Note: In a production environment, this should be done server-side
      const isValid = await verifyTOTP(storedSecret, twoFactorCode);

      if (!isValid) {
        setError('Ongeldige verificatiecode. Probeer opnieuw.');
        setLoading(false);
        return;
      }

      // Code is valid, complete login
      await completeLogin();
    } catch (error) {
      console.error('2FA verification error:', error);
      setError(error.message || 'Verificatie mislukt. Probeer opnieuw.');
      setLoading(false);
    }
  };

  // TOTP verification using Web Crypto API
  // Based on RFC 6238 - TOTP: Time-Based One-Time Password Algorithm
  const verifyTOTP = async (secret, code) => {
    try {
      const timeStep = 30;
      const currentTime = Math.floor(Date.now() / 1000);
      const counter = Math.floor(currentTime / timeStep);

      console.log('[2FA Debug] Current time:', new Date().toISOString());
      console.log('[2FA Debug] Unix timestamp:', currentTime);
      console.log('[2FA Debug] Counter:', counter);
      console.log('[2FA Debug] Secret:', secret);
      console.log('[2FA Debug] Input code:', code);

      // Check current time window and adjacent windows (for clock drift)
      for (let i = -2; i <= 2; i++) {
        const expectedCode = await generateTOTPCode(secret, counter + i);
        console.log(`[2FA Debug] Window ${i}: expected=${expectedCode}, matches=${expectedCode === code}`);
        if (expectedCode === code) {
          console.log('[2FA Debug] Code verified successfully!');
          return true;
        }
      }
      console.log('[2FA Debug] No matching code found');
      return false;
    } catch (e) {
      console.error('TOTP verification error:', e);
      return false;
    }
  };

  // Generate TOTP code from secret and counter using HMAC-SHA1
  const generateTOTPCode = async (secret, counter) => {
    try {
      // Decode base32 secret
      const secretBytes = base32Decode(secret);
      console.log('[2FA Debug] Secret bytes:', Array.from(secretBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Convert counter to 8-byte array (big-endian) using DataView for accuracy
      const counterBuffer = new ArrayBuffer(8);
      const counterView = new DataView(counterBuffer);
      // Split counter into high and low 32-bit parts
      counterView.setUint32(0, Math.floor(counter / 0x100000000), false); // high 32 bits
      counterView.setUint32(4, counter >>> 0, false); // low 32 bits
      const counterBytes = new Uint8Array(counterBuffer);
      console.log('[2FA Debug] Counter bytes:', Array.from(counterBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Import key for HMAC-SHA1
      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      // Generate HMAC
      const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
      const hmac = new Uint8Array(signature);
      console.log('[2FA Debug] HMAC:', Array.from(hmac).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Dynamic truncation (RFC 4226)
      const offset = hmac[19] & 0x0f;
      const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      // Generate 6-digit code
      const otp = binary % 1000000;
      const otpString = otp.toString().padStart(6, '0');
      console.log('[2FA Debug] Binary:', binary, 'OTP:', otpString);
      return otpString;
    } catch (e) {
      console.error('Error generating TOTP:', e);
      return null;
    }
  };

  // Base32 decoder (RFC 4648)
  const base32Decode = (encoded) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    // Remove spaces, dashes and convert to uppercase
    const cleanedInput = encoded.toUpperCase().replace(/[\s-]/g, '');

    // Remove padding
    const unpadded = cleanedInput.replace(/=+$/, '');

    let bits = '';
    for (const char of unpadded) {
      const val = alphabet.indexOf(char);
      if (val === -1) {
        console.warn('[2FA Debug] Invalid base32 character:', char);
        continue;
      }
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }

    console.log('[2FA Debug] Base32 decoded:', cleanedInput, '-> bytes length:', bytes.length);
    return new Uint8Array(bytes);
  };

  const completeLogin = async () => {
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
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleBack = () => {
    setShow2FAStep(false);
    setTwoFactorCode('');
    setPendingSession(null);
    setPendingUserId(null);
    setError('');
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/Dashboard`,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth will redirect to the provider's login page
      // User will be redirected back after successful authentication
    } catch (error) {
      console.error('OAuth error:', error);

      let errorMessage = 'Er is iets misgegaan met de social login. Probeer het opnieuw.';
      if (error.message) {
        if (error.message.includes('provider is not enabled')) {
          errorMessage = 'Deze login methode is momenteel niet beschikbaar.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      toast({
        title: 'Login mislukt',
        description: errorMessage,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden bg-[#F8F8F8] dark:bg-[#0a0a0a]">
      {/* Left Side - Login Form */}
      <div className="relative flex w-full flex-col justify-center bg-white dark:bg-[#1a1a1a] px-8 py-12 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] lg:w-1/2 lg:px-20 xl:px-24 z-10">
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

          {/* Conditional rendering: Normal login or 2FA step */}
          {!show2FAStep ? (
            <>
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
                  <span className="mx-4 flex-shrink-0 text-sm text-gray-400">of log in met</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                {/* Social Login Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3.5 px-6 text-base font-medium text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Doorgaan met Google</span>
                  </button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center mt-4">
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
            </>
          ) : (
            <>
              {/* 2FA Verification Step */}
              <div className="mb-10">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  <span className="text-sm font-medium">Terug</span>
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl">
                    <span className="material-symbols-outlined text-primary text-[28px]">security</span>
                  </div>
                  <div>
                    <h1 className="font-heading text-[28px] font-bold leading-tight text-gray-900 dark:text-white">
                      Verificatie vereist
                    </h1>
                    <p className="text-base text-gray-500 dark:text-gray-400">
                      Voer de code uit je authenticator app in
                    </p>
                  </div>
                </div>
              </div>

              {/* 2FA Form */}
              <form className="flex flex-col gap-6" onSubmit={handle2FASubmit}>
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[20px] flex-shrink-0 mt-0.5">error</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Verificatie mislukt</p>
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

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-[20px] flex-shrink-0 mt-0.5">info</span>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Open Google Authenticator of je TOTP-app en voer de 6-cijferige code in die wordt weergegeven voor Konsensi.
                    </p>
                  </div>
                </div>

                {/* 2FA Code Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="twoFactorCode">
                    Authenticatie code
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">pin</span>
                    </div>
                    <input
                      className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-4 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:bg-white dark:focus:bg-gray-700 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-center text-2xl font-mono tracking-[0.5em]"
                      id="twoFactorCode"
                      placeholder="000000"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setTwoFactorCode(value);
                        setError('');
                      }}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 px-6 text-base font-heading font-bold text-white shadow-glow transition-all hover:bg-primary-dark hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] active:bg-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loading ? 'Verifiëren...' : 'Verifieer en inloggen'}</span>
                  {!loading && (
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">
                      check
                    </span>
                  )}
                </button>

                {/* Help Text */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Problemen met inloggen?{' '}
                    <Link
                      to="/HelpSupport"
                      className="font-medium text-primary hover:text-primary-dark hover:underline transition-colors"
                    >
                      Neem contact op met support
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
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
