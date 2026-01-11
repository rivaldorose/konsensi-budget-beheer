import React, { useState, useEffect } from "react";
import { Bell, BellRing, BellDot, Lightbulb, Mail, Smartphone, Calendar, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Unlink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";
import NotificationRulesManager from "@/components/notifications/NotificationRulesManager";
import { User } from "@/api/entities";

// Google Calendar API Config
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// Microsoft Graph API Config
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
const MICROSOFT_SCOPES = 'Calendars.ReadWrite';

export default function NotificationSettings() {
  const [darkMode, setDarkMode] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Calendar integration state
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [microsoftCalendarConnected, setMicrosoftCalendarConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isConnectingMicrosoft, setIsConnectingMicrosoft] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [microsoftEmail, setMicrosoftEmail] = useState('');

  const [notifications, setNotifications] = useState({
    budgetOverschreden: true,
    schuldherinneringen: true,
    potjeVol: false,
    nieuwAdvies: true,
    emailNotifications: true,
    pushNotifications: true,
    calendarReminders: true,
    reminderDaysBefore: 3
  });
  const location = useLocation();
  const { toast } = useToast();

  // Load calendar connection status from user data
  useEffect(() => {
    const loadCalendarStatus = async () => {
      try {
        const userData = await User.me();
        if (userData) {
          setGoogleCalendarConnected(!!userData.google_calendar_connected);
          setMicrosoftCalendarConnected(!!userData.microsoft_calendar_connected);
          setGoogleEmail(userData.google_calendar_email || '');
          setMicrosoftEmail(userData.microsoft_calendar_email || '');
        }
      } catch (error) {
        console.warn('Could not load calendar status:', error);
      }
    };
    loadCalendarStatus();
  }, []);

  // Google Calendar OAuth
  const connectGoogleCalendar = async () => {
    if (!GOOGLE_CLIENT_ID) {
      toast({
        title: 'Configuratie ontbreekt',
        description: 'Google Calendar is nog niet geconfigureerd. Neem contact op met support.',
        variant: 'destructive'
      });
      return;
    }

    setIsConnectingGoogle(true);

    try {
      // Create OAuth URL
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const state = btoa(JSON.stringify({ returnUrl: window.location.pathname }));

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GOOGLE_SCOPES);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      // Open popup for OAuth
      const popup = window.open(authUrl.toString(), 'google-auth', 'width=500,height=600,scrollbars=yes');

      // Listen for message from popup
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'google-oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          // Save connection status
          try {
            await User.updateMe({
              google_calendar_connected: true,
              google_calendar_email: event.data.email || 'Verbonden'
            });
            setGoogleCalendarConnected(true);
            setGoogleEmail(event.data.email || 'Verbonden');
            toast({
              title: 'Google Calendar gekoppeld!',
              description: 'Je betalingsherinneringen worden nu automatisch toegevoegd aan je Google Calendar.'
            });
          } catch (error) {
            console.error('Error saving Google connection:', error);
          }
          setIsConnectingGoogle(false);
        } else if (event.data?.type === 'google-oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: 'Koppeling mislukt',
            description: event.data.error || 'Er ging iets mis bij het koppelen van Google Calendar.',
            variant: 'destructive'
          });
          setIsConnectingGoogle(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setIsConnectingGoogle(false);
      }, 120000);

    } catch (error) {
      console.error('Google Calendar connection error:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het verbinden met Google Calendar.',
        variant: 'destructive'
      });
      setIsConnectingGoogle(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await User.updateMe({
        google_calendar_connected: false,
        google_calendar_email: null,
        google_calendar_token: null
      });
      setGoogleCalendarConnected(false);
      setGoogleEmail('');
      toast({
        title: 'Google Calendar ontkoppeld',
        description: 'Je kalender is niet langer verbonden met Konsensi.'
      });
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: 'Fout',
        description: 'Kon Google Calendar niet ontkoppelen.',
        variant: 'destructive'
      });
    }
  };

  // Microsoft Calendar OAuth
  const connectMicrosoftCalendar = async () => {
    if (!MICROSOFT_CLIENT_ID) {
      toast({
        title: 'Configuratie ontbreekt',
        description: 'Microsoft Calendar is nog niet geconfigureerd. Neem contact op met support.',
        variant: 'destructive'
      });
      return;
    }

    setIsConnectingMicrosoft(true);

    try {
      // Create OAuth URL
      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
      const state = btoa(JSON.stringify({ returnUrl: window.location.pathname }));

      const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', `openid profile email ${MICROSOFT_SCOPES}`);
      authUrl.searchParams.set('response_mode', 'query');
      authUrl.searchParams.set('state', state);

      // Open popup for OAuth
      const popup = window.open(authUrl.toString(), 'microsoft-auth', 'width=500,height=600,scrollbars=yes');

      // Listen for message from popup
      const handleMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'microsoft-oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          // Save connection status
          try {
            await User.updateMe({
              microsoft_calendar_connected: true,
              microsoft_calendar_email: event.data.email || 'Verbonden'
            });
            setMicrosoftCalendarConnected(true);
            setMicrosoftEmail(event.data.email || 'Verbonden');
            toast({
              title: 'Microsoft Calendar gekoppeld!',
              description: 'Je betalingsherinneringen worden nu automatisch toegevoegd aan je Outlook Calendar.'
            });
          } catch (error) {
            console.error('Error saving Microsoft connection:', error);
          }
          setIsConnectingMicrosoft(false);
        } else if (event.data?.type === 'microsoft-oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: 'Koppeling mislukt',
            description: event.data.error || 'Er ging iets mis bij het koppelen van Microsoft Calendar.',
            variant: 'destructive'
          });
          setIsConnectingMicrosoft(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Fallback timeout
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setIsConnectingMicrosoft(false);
      }, 120000);

    } catch (error) {
      console.error('Microsoft Calendar connection error:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het verbinden met Microsoft Calendar.',
        variant: 'destructive'
      });
      setIsConnectingMicrosoft(false);
    }
  };

  const disconnectMicrosoftCalendar = async () => {
    try {
      await User.updateMe({
        microsoft_calendar_connected: false,
        microsoft_calendar_email: null,
        microsoft_calendar_token: null
      });
      setMicrosoftCalendarConnected(false);
      setMicrosoftEmail('');
      toast({
        title: 'Microsoft Calendar ontkoppeld',
        description: 'Je kalender is niet langer verbonden met Konsensi.'
      });
    } catch (error) {
      console.error('Error disconnecting Microsoft:', error);
      toast({
        title: 'Fout',
        description: 'Kon Microsoft Calendar niet ontkoppelen.',
        variant: 'destructive'
      });
    }
  };

  // Check push notification permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Niet ondersteund',
        description: 'Je browser ondersteunt geen push notificaties.',
        variant: 'destructive'
      });
      return;
    }

    setIsRequestingPermission(true);

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        // Show a test notification
        new Notification('Konsensi Notificaties', {
          body: 'Push notificaties zijn succesvol ingeschakeld!',
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'test-notification'
        });

        toast({
          title: 'Push notificaties ingeschakeld!',
          description: 'Je ontvangt nu meldingen in je browser.'
        });

        // Update user preferences in database
        try {
          await User.updateMe({ push_notifications_enabled: true });
        } catch (error) {
          console.warn('Could not save push notification preference:', error);
        }
      } else if (permission === 'denied') {
        toast({
          title: 'Notificaties geblokkeerd',
          description: 'Je hebt notificaties geblokkeerd. Wijzig dit in je browserinstellingen.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Fout',
        description: 'Er ging iets mis bij het inschakelen van notificaties.',
        variant: 'destructive'
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Send a test notification
  const sendTestNotification = () => {
    if (pushPermission !== 'granted') {
      toast({
        title: 'Schakel eerst notificaties in',
        description: 'Klik op "Notificaties inschakelen" om push notificaties te activeren.',
        variant: 'destructive'
      });
      return;
    }

    new Notification('Test Notificatie', {
      body: 'Dit is een test notificatie van Konsensi. Als je dit ziet, werken je notificaties!',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'test-notification-' + Date.now()
    });

    toast({
      title: 'Test notificatie verzonden!',
      description: 'Check je browser notificaties.'
    });
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // TODO: Save to backend
    toast({ title: 'Notificatie-instellingen opgeslagen!' });
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
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Privacy')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
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
                <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Notificaties</h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Kies welke notificaties je wilt ontvangen</p>
              </div>

              <div className="flex flex-col gap-6">
                {/* Budget overschreden */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <BellRing className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Budget overschreden</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang een melding als je je budget overschrijdt.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.budgetOverschreden} onToggle={() => handleToggle('budgetOverschreden')} />
                </div>

                {/* Schuldherinneringen */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <BellDot className="w-5 h-5 text-accent-red" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Schuldherinneringen</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Herinneringen voor aankomende betalingen en achterstanden.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.schuldherinneringen} onToggle={() => handleToggle('schuldherinneringen')} />
                </div>

                {/* Potje vol */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Bell className="w-5 h-5 text-konsensi-green" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Potje vol</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang een melding wanneer je een spaarpotje vol hebt.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.potjeVol} onToggle={() => handleToggle('potjeVol')} />
                </div>

                {/* Nieuw advies */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Lightbulb className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Nieuw advies</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Meldingen over gepersonaliseerd financieel advies en tips.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.nieuwAdvies} onToggle={() => handleToggle('nieuwAdvies')} />
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-dark-border my-4"></div>

                {/* Email notifications */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Mail className="w-5 h-5 text-[#0d1b17] dark:text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">E-mail notificaties</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang alle meldingen via e-mail.</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.emailNotifications} onToggle={() => handleToggle('emailNotifications')} />
                </div>

                {/* Push notifications */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Smartphone className="w-5 h-5 text-[#0d1b17] dark:text-white" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Push notificaties</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Ontvang meldingen direct in je browser.</p>
                      </div>
                    </div>
                    <Toggle enabled={notifications.pushNotifications} onToggle={() => handleToggle('pushNotifications')} />
                  </div>

                  {/* Push notification permission status */}
                  {notifications.pushNotifications && (
                    <div className="pl-9 space-y-4">
                      {/* Permission status indicator */}
                      <div className={`p-4 rounded-xl border ${
                        pushPermission === 'granted'
                          ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                          : pushPermission === 'denied'
                          ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                          : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20'
                      }`}>
                        <div className="flex items-start gap-3">
                          {pushPermission === 'granted' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                          ) : pushPermission === 'denied' ? (
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              pushPermission === 'granted'
                                ? 'text-green-700 dark:text-green-400'
                                : pushPermission === 'denied'
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-yellow-700 dark:text-yellow-400'
                            }`}>
                              {pushPermission === 'granted'
                                ? 'Push notificaties zijn ingeschakeld'
                                : pushPermission === 'denied'
                                ? 'Push notificaties zijn geblokkeerd'
                                : 'Push notificaties zijn nog niet ingeschakeld'
                              }
                            </p>
                            <p className={`text-xs mt-1 ${
                              pushPermission === 'granted'
                                ? 'text-green-600 dark:text-green-400/80'
                                : pushPermission === 'denied'
                                ? 'text-red-600 dark:text-red-400/80'
                                : 'text-yellow-600 dark:text-yellow-400/80'
                            }`}>
                              {pushPermission === 'granted'
                                ? 'Je ontvangt meldingen in je browser wanneer er iets belangrijks gebeurt.'
                                : pushPermission === 'denied'
                                ? 'Ga naar je browserinstellingen om notificaties toe te staan voor deze website.'
                                : 'Klik op de knop hieronder om notificaties in te schakelen.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3">
                        {pushPermission !== 'granted' && pushPermission !== 'denied' && (
                          <button
                            onClick={requestPushPermission}
                            disabled={isRequestingPermission}
                            className="flex items-center gap-2 px-4 py-2 bg-konsensi-green hover:bg-konsensi-green-light text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                          >
                            {isRequestingPermission ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Bezig...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                Notificaties inschakelen
                              </>
                            )}
                          </button>
                        )}

                        {pushPermission === 'granted' && (
                          <button
                            onClick={sendTestNotification}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors"
                          >
                            <BellRing className="w-4 h-4" />
                            Test notificatie sturen
                          </button>
                        )}

                        {pushPermission === 'denied' && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-[18px]">info</span>
                            <span>Open browserinstellingen om notificaties te deblokkeren</span>
                          </div>
                        )}
                      </div>

                      {/* Browser support info */}
                      {!('Notification' in window) && (
                        <div className="p-3 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Je browser ondersteunt geen push notificaties. Probeer een moderne browser zoals Chrome, Firefox, of Edge.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-gray-200 dark:bg-dark-border my-4"></div>

                {/* Calendar Reminders Section */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-900 dark:text-white text-lg font-semibold">Kalender Herinneringen</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Instellingen voor kalenderherinneringen bij betalingen en belangrijke data.</p>
                    </div>
                  </div>

                  {/* Calendar reminders toggle */}
                  <div className="flex items-center justify-between gap-4 pl-9">
                    <div className="flex flex-col">
                      <h4 className="text-gray-900 dark:text-white text-base font-medium">Kalenderherinneringen inschakelen</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Voeg automatisch herinneringen toe aan je kalender voor betalingen.</p>
                    </div>
                    <Toggle enabled={notifications.calendarReminders} onToggle={() => handleToggle('calendarReminders')} />
                  </div>

                  {/* Reminder days before */}
                  {notifications.calendarReminders && (
                    <div className="flex items-center justify-between gap-4 pl-9">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex flex-col">
                          <h4 className="text-gray-900 dark:text-white text-base font-medium">Dagen van tevoren herinneren</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Hoeveel dagen voor een betaling wil je een herinnering ontvangen?</p>
                        </div>
                      </div>
                      <select
                        className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-2 px-4 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-konsensi-green/20 focus:border-konsensi-green"
                        value={notifications.reminderDaysBefore}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          reminderDaysBefore: parseInt(e.target.value)
                        }))}
                      >
                        <option value={1}>1 dag</option>
                        <option value={2}>2 dagen</option>
                        <option value={3}>3 dagen</option>
                        <option value={5}>5 dagen</option>
                        <option value={7}>1 week</option>
                      </select>
                    </div>
                  )}

                  {/* Email for calendar reminders */}
                  {notifications.calendarReminders && notifications.emailNotifications && (
                    <div className="pl-9 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex flex-col">
                          <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">E-mail herinneringen actief</p>
                          <p className="text-blue-600 dark:text-blue-400/80 text-xs mt-1">
                            Je ontvangt e-mailherinneringen {notifications.reminderDaysBefore} {notifications.reminderDaysBefore === 1 ? 'dag' : 'dagen'} voor elke geplande betaling.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Calendar Integration Section */}
                  {notifications.calendarReminders && (
                    <div className="pl-9 space-y-4">
                      <h4 className="text-gray-900 dark:text-white text-base font-medium">Kalender koppelen</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm -mt-2">
                        Koppel je kalender om betalingsherinneringen automatisch toe te voegen.
                      </p>

                      {/* Google Calendar */}
                      <div className={`p-4 rounded-xl border ${
                        googleCalendarConnected
                          ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                          : 'bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#3a3a3a]'
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] flex items-center justify-center">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium">Google Calendar</p>
                              {googleCalendarConnected && googleEmail && (
                                <p className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {googleEmail}
                                </p>
                              )}
                              {!googleCalendarConnected && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Niet verbonden</p>
                              )}
                            </div>
                          </div>
                          {googleCalendarConnected ? (
                            <button
                              onClick={disconnectGoogleCalendar}
                              className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Unlink className="w-4 h-4" />
                              Ontkoppelen
                            </button>
                          ) : (
                            <button
                              onClick={connectGoogleCalendar}
                              disabled={isConnectingGoogle}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {isConnectingGoogle ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Verbinden...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-4 h-4" />
                                  Koppelen
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Microsoft Calendar */}
                      <div className={`p-4 rounded-xl border ${
                        microsoftCalendarConnected
                          ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                          : 'bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#3a3a3a]'
                      }`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] flex items-center justify-center">
                              <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#0078D4" d="M11.5 2v9.5H2V2h9.5zm1 0H22v9.5h-9.5V2zM2 12.5h9.5V22H2v-9.5zm10.5 0H22V22h-9.5v-9.5z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium">Microsoft Outlook</p>
                              {microsoftCalendarConnected && microsoftEmail && (
                                <p className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {microsoftEmail}
                                </p>
                              )}
                              {!microsoftCalendarConnected && (
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Niet verbonden</p>
                              )}
                            </div>
                          </div>
                          {microsoftCalendarConnected ? (
                            <button
                              onClick={disconnectMicrosoftCalendar}
                              className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Unlink className="w-4 h-4" />
                              Ontkoppelen
                            </button>
                          ) : (
                            <button
                              onClick={connectMicrosoftCalendar}
                              disabled={isConnectingMicrosoft}
                              className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] hover:bg-[#106EBE] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {isConnectingMicrosoft ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Verbinden...
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-4 h-4" />
                                  Koppelen
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info about what gets synced */}
                      {(googleCalendarConnected || microsoftCalendarConnected) && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div className="flex flex-col">
                              <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">Automatische synchronisatie actief</p>
                              <p className="text-blue-600 dark:text-blue-400/80 text-xs mt-1">
                                Betalingsherinneringen voor je vaste lasten en schulden worden automatisch {notifications.reminderDaysBefore} {notifications.reminderDaysBefore === 1 ? 'dag' : 'dagen'} van tevoren aan je kalender toegevoegd.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info about calendar export */}
                  <div className="pl-9 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-xl border border-gray-100 dark:border-[#3a3a3a]">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">info</span>
                      <div className="flex flex-col">
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Kalenderbestand downloaden</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                          Op de Cent voor Cent pagina kun je ook een .ics bestand downloaden om betalingsherinneringen handmatig aan je agenda toe te voegen (Apple Calendar, etc.).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-start">
                <button 
                  className="bg-konsensi-green hover:bg-konsensi-green-light text-white px-8 py-4 rounded-[24px] font-bold transition-colors duration-200"
                  onClick={handleSave}
                >
                  Wijzigingen opslaan
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
