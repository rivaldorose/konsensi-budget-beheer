import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';

export default function EmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);

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
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-[480px] bg-white dark:bg-[#1a2c26] rounded-3xl shadow-modal border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center text-center">
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

        {/* Icon: Mail Check */}
        <div className="mb-8 p-4 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[64px] text-primary leading-none">
            mark_email_read
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-[32px] leading-tight text-gray-800 dark:text-white mb-3">
          E-mail verstuurd!
        </h1>

        {/* Subtitle */}
        <p className="font-body text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          We hebben een e-mail gestuurd naar je opgegeven adres. Volg de instructies om je wachtwoord opnieuw in te stellen.
        </p>

        {/* Action Section */}
        <div className="w-full flex flex-col items-center">
          {/* Reminder Text */}
          <p className="font-body text-sm text-gray-500 dark:text-gray-500 mb-6">
            Controleer ook je spam-map als je de e-mail niet ziet.
          </p>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full group flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-3.5 px-4 transition-all duration-200 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors">
              refresh
            </span>
            <span className="font-body font-semibold text-[15px] text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
              {resending ? 'Versturen...' : 'Opnieuw versturen'}
            </span>
          </button>

          {/* Back to Login Link */}
          <Link
            className="font-body text-[15px] text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:underline transition-colors flex items-center gap-1 group/link"
            to="/login"
          >
            <span className="inline-block transition-transform duration-200 group-hover/link:-translate-x-1">←</span>
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
