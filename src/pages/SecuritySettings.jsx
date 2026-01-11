import React, { useState, useEffect } from 'react';
import { Shield, Monitor, Trash2, Smartphone, QrCode, Copy, Check, X } from 'lucide-react';
import { User } from '@/api/entities';
import { SecuritySettings as SecuritySettingsEntity } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { createPageUrl } from '@/utils';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        const existing = await SecuritySettingsEntity.filter({ user_id: userData.id });
        if (existing.length > 0) {
          const s = existing[0];
          setSettings(s);
          setTwoFactorEnabled(s.two_factor_enabled ?? false);
        }

        // Load active sessions
        await loadSessions();
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };
    loadData();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      // Get current session info
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Parse user agent to get device info
        const userAgent = navigator.userAgent;
        const deviceInfo = parseUserAgent(userAgent);

        // Get approximate location using timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const location = getLocationFromTimezone(timezone);

        // Current session
        const currentSession = {
          id: 'current',
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          location: location,
          lastActive: 'Nu actief',
          isCurrent: true,
          createdAt: session.created_at || new Date().toISOString()
        };

        setSessions([currentSession]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const parseUserAgent = (ua) => {
    let browser = 'Onbekend';
    let os = 'Onbekend';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) { os = 'Android'; device = 'Mobiel'; }
    else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobiel'; }

    return { browser, os, device };
  };

  const getLocationFromTimezone = (timezone) => {
    // Map common Dutch timezones to cities
    const tzMap = {
      'Europe/Amsterdam': 'Nederland',
      'Europe/Berlin': 'Duitsland',
      'Europe/London': 'Verenigd Koninkrijk',
      'Europe/Paris': 'Frankrijk',
      'Europe/Brussels': 'België'
    };
    return tzMap[timezone] || timezone.split('/').pop().replace('_', ' ');
  };

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const handleSetup2FA = async () => {
    try {
      // Generate a TOTP secret
      const secret = generateTOTPSecret();
      setTotpSecret(secret);

      // Generate QR code URL for Google Authenticator
      const email = user?.email || 'user@konsensi.nl';
      const issuer = 'Konsensi';
      const otpauthUrl = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

      // Use QR code API to generate image
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
      setQrCodeUrl(qrUrl);
      setShowSetup2FA(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({ title: 'Fout bij instellen 2FA', variant: 'destructive' });
    }
  };

  const generateTOTPSecret = () => {
    // Generate a random base32 secret (16 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  // TOTP verification functions
  const verifyTOTP = async (secret, code) => {
    try {
      const timeStep = 30;
      const currentTime = Math.floor(Date.now() / 1000);
      const counter = Math.floor(currentTime / timeStep);

      console.log('[2FA Setup Debug] Verifying code:', code);
      console.log('[2FA Setup Debug] Counter:', counter);

      // Check current time window and adjacent windows (for clock drift)
      for (let i = -2; i <= 2; i++) {
        const expectedCode = await generateTOTPCode(secret, counter + i);
        console.log(`[2FA Setup Debug] Window ${i}: expected=${expectedCode}, matches=${expectedCode === code}`);
        if (expectedCode === code) {
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('TOTP verification error:', e);
      return false;
    }
  };

  const generateTOTPCode = async (secret, counter) => {
    try {
      const secretBytes = base32Decode(secret);
      const counterBytes = new Uint8Array(8);
      let tempCounter = counter;
      for (let i = 7; i >= 0; i--) {
        counterBytes[i] = tempCounter & 0xff;
        tempCounter = Math.floor(tempCounter / 256);
      }

      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
      const hmac = new Uint8Array(signature);

      const offset = hmac[hmac.length - 1] & 0x0f;
      const binary =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const otp = binary % 1000000;
      return otp.toString().padStart(6, '0');
    } catch (e) {
      console.error('Error generating TOTP:', e);
      return null;
    }
  };

  const base32Decode = (encoded) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanedInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = '';
    for (const char of cleanedInput) {
      const val = alphabet.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return new Uint8Array(bytes);
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: 'Voer een 6-cijferige code in', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      // Verify the TOTP code before saving
      const isValid = await verifyTOTP(totpSecret, verificationCode);

      if (!isValid) {
        toast({
          title: 'Ongeldige code',
          description: 'De ingevoerde code is onjuist. Controleer de code in je authenticator app.',
          variant: 'destructive'
        });
        setIsVerifying(false);
        return;
      }

      // Code is valid, save the 2FA settings
      const data = {
        two_factor_enabled: true,
        totp_secret: totpSecret
      };

      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      } else {
        const created = await SecuritySettingsEntity.create({ ...data, user_id: user.id });
        setSettings(created);
      }

      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      setVerificationCode('');
      toast({ title: 'Twee-factor authenticatie ingeschakeld!' });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({ title: 'Verificatie mislukt', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    const confirmed = window.confirm('Weet je zeker dat je twee-factor authenticatie wilt uitschakelen? Dit maakt je account minder veilig.');
    if (!confirmed) return;

    try {
      const data = {
        two_factor_enabled: false,
        totp_secret: null
      };

      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      }

      setTwoFactorEnabled(false);
      setTotpSecret('');
      toast({ title: 'Twee-factor authenticatie uitgeschakeld' });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({ title: 'Fout bij uitschakelen', variant: 'destructive' });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleLogoutSession = async (sessionId) => {
    if (sessionId === 'current') {
      const confirmed = window.confirm('Weet je zeker dat je wilt uitloggen?');
      if (confirmed) {
        await supabase.auth.signOut();
        window.location.href = createPageUrl('Onboarding');
      }
    }
  };

  const Toggle = ({ enabled, onToggle }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        className="sr-only peer"
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
      />
      <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-konsensi-green/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-konsensi-green"></div>
    </label>
  );

  return (
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          {/* Page Header - Fixed */}
          <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">settings</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Beheer je profiel, notificaties en app-voorkeuren</p>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-[#0d1b17] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('HelpSupport')}
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span>Hulp</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar Navigation - Fixed */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Settings') ? 'fill-1' : ''}`} style={isActiveRoute('Settings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    account_circle
                  </span>
                  <span className={`text-sm ${isActiveRoute('Settings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('SecuritySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('SecuritySettings') ? 'fill-1' : ''}`} style={isActiveRoute('SecuritySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    shield
                  </span>
                  <span className={`text-sm ${isActiveRoute('SecuritySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Account & Beveiliging</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('DisplaySettings') ? 'fill-1' : ''}`} style={isActiveRoute('DisplaySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    tune
                  </span>
                  <span className={`text-sm ${isActiveRoute('DisplaySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>App Voorkeuren</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </Link>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Help Center</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content Section - Scrollable */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 overflow-y-auto lg:max-h-full">
              <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Account & Beveiliging</h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Beheer je accountgegevens en beveiligingsinstellingen</p>
              </div>

              <div className="flex flex-col gap-8">
                {/* Two-Factor Authentication with Google Authenticator */}
                <div className="flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="mt-1">
                        <Shield className="w-5 h-5 text-konsensi-green" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Twee-factor authenticatie (2FA)</h3>
                          {twoFactorEnabled && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                              Actief
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Gebruik Google Authenticator of een andere TOTP-app voor extra beveiliging bij het inloggen.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2FA Setup/Status */}
                  <div className="mt-4 pl-9">
                    {!twoFactorEnabled && !showSetup2FA && (
                      <button
                        onClick={handleSetup2FA}
                        className="flex items-center gap-2 px-4 py-2.5 bg-konsensi-green hover:bg-konsensi-green/90 text-white font-medium rounded-[24px] transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Stel 2FA in met Google Authenticator</span>
                      </button>
                    )}

                    {twoFactorEnabled && !showSetup2FA && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
                          <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-full">
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-green-700 dark:text-green-400 font-medium">2FA is ingeschakeld</p>
                            <p className="text-green-600 dark:text-green-500 text-sm">Je account is extra beveiligd</p>
                          </div>
                        </div>
                        <button
                          onClick={handleDisable2FA}
                          className="self-start text-red-500 hover:text-red-600 text-sm font-medium hover:underline"
                        >
                          2FA uitschakelen
                        </button>
                      </div>
                    )}

                    {/* 2FA Setup Modal/Card */}
                    {showSetup2FA && (
                      <div className="mt-2 p-6 bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-gray-900 dark:text-white font-semibold">Google Authenticator instellen</h4>
                          <button
                            onClick={() => setShowSetup2FA(false)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-full transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                          {/* QR Code */}
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                              {qrCodeUrl ? (
                                <img src={qrCodeUrl} alt="QR Code voor 2FA" className="w-[180px] h-[180px]" />
                              ) : (
                                <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-100 rounded-lg">
                                  <QrCode className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
                              Scan met Google Authenticator
                            </p>
                          </div>

                          {/* Instructions */}
                          <div className="flex-1 flex flex-col gap-4">
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                <strong>Stap 1:</strong> Download Google Authenticator op je telefoon
                              </p>
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                <strong>Stap 2:</strong> Scan de QR-code of voer de code handmatig in:
                              </p>

                              {/* Secret Key */}
                              <div className="flex items-center gap-2 p-3 bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                                <code className="flex-1 text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                                  {totpSecret}
                                </code>
                                <button
                                  onClick={copySecret}
                                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-md transition-colors"
                                  title="Kopieer code"
                                >
                                  {copiedSecret ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                                <strong>Stap 3:</strong> Voer de 6-cijferige code in uit de app:
                              </p>
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="000000"
                                  className="flex-1 px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-konsensi-green/50 focus:border-konsensi-green"
                                  maxLength={6}
                                />
                                <button
                                  onClick={handleVerify2FA}
                                  disabled={verificationCode.length !== 6 || isVerifying}
                                  className="px-6 py-2.5 bg-konsensi-green hover:bg-konsensi-green/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-xl transition-colors"
                                >
                                  {isVerifying ? 'Bezig...' : 'Verifieer'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] w-full"></div>

                {/* Active Sessions - Live Data */}
                <div className="flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-1">
                      <Monitor className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg">Actieve sessies</h3>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          Live
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Bekijk waar je momenteel bent ingelogd.</p>
                    </div>
                  </div>
                  <div className="pl-9 flex flex-col gap-3 w-full">
                    {loadingSessions ? (
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-konsensi-green rounded-full animate-spin"></div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Sessies laden...</span>
                      </div>
                    ) : sessions.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm p-4">Geen actieve sessies gevonden.</p>
                    ) : (
                      sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#2a2a2a]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {session.device === 'Mobiel' ? (
                                <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 dark:text-white text-sm font-medium">
                                  {session.device} ({session.browser}, {session.os})
                                </span>
                                {session.isCurrent && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                                    Deze sessie
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-[13px]">
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                                  <span>{session.location}</span>
                                </div>
                                <span>•</span>
                                <span>{session.lastActive}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleLogoutSession(session.id)}
                            className="mt-3 sm:mt-0 self-start sm:self-center text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                          >
                            {session.isCurrent ? 'Uitloggen' : 'Afmelden'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] w-full"></div>

                {/* Delete Account */}
                <div className="flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <h3 className="text-red-500 font-semibold text-lg">Account Verwijderen</h3>
                      <p className="text-red-500/80 text-sm">Je kunt je account permanent verwijderen. Dit kan niet ongedaan gemaakt worden.</p>
                      <button className="mt-4 self-start px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-[24px] transition-colors shadow-lg shadow-red-500/20">
                        Account verwijderen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
