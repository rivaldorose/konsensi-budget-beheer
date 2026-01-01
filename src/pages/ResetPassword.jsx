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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    <div className="bg-[#F8F8F8] min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-card border border-[#E5E7EB] p-8 md:p-12 relative flex flex-col items-center">
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
          <h2 className="text-[#1F2937] text-[32px] font-bold leading-tight mb-3">
            Nieuw wachtwoord instellen
          </h2>
          <p className="text-[#6B7280] text-base leading-normal">
            Kies een nieuw, sterk wachtwoord voor je account.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          {/* New Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#374151] text-sm font-semibold" htmlFor="new-password">
              Nieuw wachtwoord
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-11 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
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
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  ></div>
                </div>
                <p className={`text-xs font-medium text-right ${passwordStrength.color === 'bg-red-500' ? 'text-red-600' : passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[#374151] text-sm font-semibold" htmlFor="confirm-password">
              Bevestig wachtwoord
            </label>
            <div className="relative group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <input
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-11 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                id="confirm-password"
                placeholder="••••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword.length > 0 && (
                <span className={`material-symbols-outlined absolute right-12 text-[20px] ${passwordsMatch ? 'text-primary' : 'text-red-500'}`}>
                  {passwordsMatch ? 'check_circle' : 'cancel'}
                </span>
              )}
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="mt-4 w-full bg-primary text-white font-semibold text-base py-4 rounded-xl shadow-btn hover:bg-primary-dark hover:scale-[1.02] active:bg-primary-darker active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Opslaan...' : 'Wachtwoord instellen'}
            {!loading && (
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                arrow_forward
              </span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <Link
          className="mt-8 text-[#6B7280] text-[15px] font-medium hover:text-primary hover:underline transition-colors flex items-center gap-2"
          to="/login"
        >
          ← Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}

