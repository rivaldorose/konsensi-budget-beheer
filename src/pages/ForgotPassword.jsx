import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    <div className="bg-[#F8F8F8] dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-[480px] bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-[24px] shadow-modal p-8 md:p-12 relative flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
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
          <h1 className="font-display font-bold text-[32px] leading-tight text-gray-800 dark:text-white mb-3">
            Wachtwoord vergeten?
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 font-normal leading-relaxed px-2">
            Geen probleem! Vul je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          {/* Email Field */}
          <div className="flex flex-col gap-2 mb-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1" htmlFor="email">
              E-mailadres
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors duration-200" style={{ fontSize: '20px' }}>
                  mail
                </span>
              </div>
              <input
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl py-3.5 pl-11 pr-4 outline-none transition-all duration-200 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-300 dark:hover:border-gray-500"
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
            className="w-full mt-8 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-display font-semibold text-base py-4 px-6 rounded-xl shadow-button flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:underline transition-colors duration-200 group/back"
              to="/login"
            >
              <span className="transition-transform duration-200 group-hover/back:-translate-x-1">←</span>
              Terug naar inloggen
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
