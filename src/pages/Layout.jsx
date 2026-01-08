
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { MonthlyCheck } from "@/api/entities";
import { Debt } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Home,
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  CreditCard,
  Coins,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  UserCircle,
  Plus,
  X,
  Settings,
  HelpCircle,
  Heart,
  AlertTriangle,
  Lightbulb,
  ArrowLeftRight,
  Calendar,
  PiggyBank,
  Check,
  Globe,
  ChevronLeft,
  Shield,
  Mail,
  MessageCircle,
  BarChart3
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageProvider, useTranslation } from "@/components/utils/LanguageContext";
import AddLoanModal from "@/components/loans/AddLoanModal";
import TourProvider, { useTour } from "@/components/onboarding/TourProvider";
import PageHelpButton from "@/components/onboarding/PageHelpButton";
import ScanDebtModal from "@/components/debts/ScanDebtModal";


import PostponedPaymentTracker from "@/components/checks/PostponedPaymentTracker";
import { ErrorBoundary } from "@/components/utils/ErrorBoundary";


// Main Layout wrapper component
export default function Layout({ children, currentPageName }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <TourProvider>
            <LayoutWithProvider children={children} currentPageName={currentPageName} />
          </TourProvider>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

// Inner layout component that can safely use useTranslation
function LayoutWithProvider({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  
  const { t, language, changeLanguage } = useTranslation();
  const { toast } = useToast();
  const { startPageTour, startFullOnboarding } = useTour();
  
  // Dark mode state
  const [darkMode, setDarkMode] = React.useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode to document
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Check if we're on auth pages or error pages (case-insensitive, handle trailing slashes)
  const currentPath = location.pathname.toLowerCase().replace(/\/$/, '');
  const isAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/onboarding' || 
                     currentPath === '/forgot-password' || currentPath === '/email-sent' || 
                     currentPath === '/reset-password' || currentPath === '/password-saved' ||
                     currentPath === '/terms' || currentPath === '/privacy' ||
                     currentPath === '/maintenance';
  

  const [fabPosition, setFabPosition] = React.useState({ x: null, y: null });
  const fabRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const didDrag = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  
  const pagesWithCustomFab = []; // Pagina's waar de algemene FAB verborgen moet worden
  
  React.useEffect(() => {
    try {
      const savedPos = localStorage.getItem('konsensiFabPosition');
      if (savedPos) {
        const parsedPos = JSON.parse(savedPos);
        if (typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
          setFabPosition(parsedPos);
        }
      }
    } catch (error) {
      console.error("Failed to load FAB position from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    try {
      if (fabPosition.x !== null && fabPosition.y !== null) {
        localStorage.setItem('konsensiFabPosition', JSON.stringify(fabPosition));
      } else {
        localStorage.removeItem('konsensiFabPosition');
      }
    } catch (error) {
      console.error("Failed to save FAB position to localStorage", error);
    }
  }, [fabPosition]);

  const getNavTranslation = (key, lang) => {
    const translations = {
        'nav.home': { nl: 'Thuis', en: 'Home', es: 'Inicio', pl: 'Główna', de: 'Start', fr: 'Accueil', tr: 'Ana Sayfa', ar: 'الرئيسية' },
        'nav.dashboard': { nl: 'Dashboard', en: 'Dashboard', es: 'Panel', pl: 'Panel', de: 'Dashboard', fr: 'Tableau de bord', tr: 'Panel', ar: 'لوحة القيادة' },
        'nav.balance': { nl: 'Balans', en: 'Balance', es: 'Balance', pl: 'Balans', de: 'Gleichgewicht', fr: 'Solde', tr: 'Bakiye', ar: 'الرصيد' },
        'nav.income': { nl: 'Inkomsten', en: 'Income', es: 'Ingresos', pl: 'Dochód', de: 'Einkommen', fr: 'Revenu', tr: 'Gelir', ar: 'الدخل' },
        'nav.workSchedule': { nl: 'Werkrooster', en: 'Work Schedule', es: 'Horario de trabajo', pl: 'Grafik pracy', de: 'Arbeitsplan', fr: 'Planning de travail', tr: 'Çalışma programı', ar: 'جدول العمل' },
        'nav.monthlyExpenses': { nl: 'Vaste lasten', en: 'Fixed costs', es: 'Costos fijos', pl: 'Koszty stałe', de: 'Fixkosten', fr: 'Frais fixes', tr: 'Sabit masraflar', ar: 'التكاليف الثابتة' },
        'nav.budgetPlan': { nl: 'Budgetplan', en: 'Budget Plan', es: 'Presupuesto', pl: 'Plan budżetowy', de: 'Budgetplan', fr: 'Budget', tr: 'Bütçe Planı', ar: 'خطة الميزانية' },
        'nav.potjes': { nl: 'Potjes', en: 'Pots', es: 'Fondos', pl: 'Słoiki', de: 'Töpfe', fr: 'Cagnottes', tr: 'Kumbaralar', ar: 'الأوعية الادخارية' },
        'nav.checkIn': { nl: 'Check-in', en: 'Check-in', es: 'Check-in', pl: 'Meldowanie', de: 'Check-in', fr: 'Check-in', tr: 'Giriş yap', ar: 'تسجيل الدخول' },
        'debts.title': { nl: 'Betaalachterstanden', en: 'Payment Arrears', es: 'Atrasos de pago', pl: 'Zaległości płatnicze', de: 'Zahlungsrückstände', fr: 'Arriérés de paiement', tr: 'Ödeme Gecikmeleri', ar: 'المتأخرات' },
        'nav.adempauze': { nl: 'Adempauze', en: 'Breathing space', es: 'Respiro', pl: 'Chwila oddechu', de: 'Atempause', fr: 'Pause', tr: 'Nefes Molası', ar: 'فترة راحة' },
        'nav.pennyForPenny': { nl: 'Cent voor Cent', en: 'Penny for Penny', es: 'Céntimo a Céntimo', pl: 'Grosz do Grosza', de: 'Cent für Cent', fr: 'Sou par Sou', tr: 'Kuruş Kuruş', ar: 'فلس بفلس' },
        'nav.settings': { nl: 'Instellingen', en: 'Settings', es: 'Ajustes', pl: 'Ustawienia', de: 'Einstellungen', fr: 'Paramètres', tr: 'Ayarlar', ar: 'الإعدادات' },
        'nav.help': { nl: 'Hulp & Contact', en: 'Help & Contact', es: 'Ayuda y Contacto', pl: 'Pomoc i Kontakt', de: 'Hilfe & Kontakt', fr: 'Aide & Kontakt', tr: 'Yardım ve İ iletişimi', ar: 'المساعدة والاتصال' },
        'nav.newsletter': { nl: 'Nieuwsbrief', en: 'Newsletter', es: 'Boletín', pl: 'Biuletyn', de: 'Newsletter', fr: 'Newsletter', tr: 'Bülten', ar: 'الرسالة الإخبارية' },
        'nav.feedback': { nl: 'Feedback', en: 'Feedback', es: 'Comentarios', pl: 'Opinia', de: 'Feedback', fr: 'Retour', tr: 'Geri Bildirim', ar: 'ملاحظات' }
    };
    return translations[key]?.[lang] || t(key);
  };
  
  const addModalTranslations = {
    title: { 
        nl: 'Wat wil je toevoegen?', 
        en: 'What do you want to add?', 
        es: '¿Qué quieres añadir?', 
        pl: 'Co chcesz dodać?', 
        de: 'Was möchten Sie hinzufügen?', 
        fr: 'Que souhaitez-vous ajouter ?', 
        tr: 'Ne eklemek istersiniz?',
        ar: 'ماذا تريد أن تضيف؟'
    },
    addIncome: {
        title: { nl: 'Nieuw inkomen', en: 'New Income', es: 'Nuevos Ingresos', pl: 'Nowy dochód', de: 'Neues Einkommen', fr: 'Nouveau revenu', tr: 'Yeni Gelir', ar: 'دخل جديد' },
        description: { nl: 'Voeg vast of extra inkomen toe', en: 'Add fixed or extra income', es: 'Añadir ingresos fijos o extras', pl: 'Dodaj stały of dodatkowy dochód', de: 'Festes oder zusätzliches Einkommen hinzufügen', fr: 'Ajouter un revenu fixe ou supplémentaire', tr: 'Sabit of ek gelir ekleyin', ar: 'أضف دخلاً ثابتاً أو إضافياً' }
    },
    addFixedCost: {
        title: { nl: 'Vaste lasten', en: 'Fixed Cost', es: 'Costo Fijo', pl: 'Koszt stały', de: 'Fixkosten', fr: 'Coût fixe', tr: 'Sabit Maliyet', ar: 'التكاليف الثابتة' },
        description: { nl: 'Voeg maandelijkse kosten toe', en: 'Add monthly expenses', es: 'Añadir gastos mensuales', pl: 'Dodaj miesięczne uitdaje', de: 'Monatliche Ausgaben hinzufügen', fr: 'Ajouter des dépenses mensuelles', tr: 'Aylık giderleri ekleyin', ar: 'أضف المصاريف الشهرية' }
    },
    addPot: {
        title: { nl: 'Nieuw potje', en: 'New Pot', es: 'Nuevo Fondo', pl: 'Nowy słoik', de: 'Neuer Topf', fr: 'Nouveau pot', tr: 'Yeni Kumbara', ar: 'وعاء ادخار جديد' },
        description: { nl: 'Maak een spaarpot aan', en: 'Create a savings pot', es: 'Crear un fondo de ahorro', pl: 'Utwórz słoik oszczędnościowy', de: 'Einen Spartopf erstellen', fr: 'Créer eine cagnotte', tr: 'Birikim kumbarası oluşturun', ar: 'أنشئ وعاء ادخار' }
    },
    addLoan: {
        title: { nl: 'Nieuwe lening', en: 'New Loan', es: 'Nuevo Préstamo', pl: 'Nowa pożyczka', de: 'Neues Darlehen', fr: 'Nouveau prêt', tr: 'Yeni Kredi', ar: 'قرض جديد' },
        description: { nl: 'Voeg een lening of voorschot toe', en: 'Add a loan or advance', es: 'Añadir un préstamo o adelanto', pl: 'Dodaj pożyczkę of zaliczkę', de: 'Ein Darlehen oder einen Vorschuss hinzufügen', fr: 'Ajouter een prêt ou een Vorauszahlung', tr: 'Kredi veya avans ekleyin', ar: 'أضف قرضاً أو سلفة' }
    },
    addDebt: {
        title: { nl: 'Nieuwe schuld', en: 'New Debt', es: 'Nueva Deuda', pl: 'Nowy dług', de: 'Neue Schuld', fr: 'Nouvelle dette', tr: 'Yeni Borç', ar: 'دين جديد' },
        description: { nl: 'Voeg een betaalachterstand toe', en: 'Add a payment arrear', es: 'Añadir een atraso de pago', pl: 'Dodaj zaległość w betalingen', de: 'Einen Zahlungsrückstand hinzufügen', fr: 'Ajouter een arriéré de paiement', tr: 'Ödeme gecikmesi ekleyin', ar: 'أضf متäخرات دفع' }
    }
  };

  const [user, setUser] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = React.useState(true);
  
  const [balansOpen, setBalansOpen] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showLoanModal, setShowLoanModal] = React.useState(false);
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  const [showScanBonModal, setShowScanBonModal] = React.useState(false);
  const [showScanDebtModal, setShowScanDebtModal] = React.useState(false);
  const [scannedData, setScannedData] = React.useState(null);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [availablePots, setAvailablePots] = React.useState([]);

  React.useEffect(() => {
    const loadPots = async () => {
      if (showConfirmModal && user) {
        try {
          const { Pot } = await import('@/api/entities');
          const pots = await Pot.filter({ user_id: user.id });
          setAvailablePots(pots.filter(p => p.pot_type === 'expense'));
        } catch (error) {
          console.error('Error loading pots:', error);
        }
      }
    };
    loadPots();
  }, [showConfirmModal, user]);

  React.useEffect(() => {
    // Handle root route redirect
    if (location.pathname === '/') {
      const handleRootRedirect = async () => {
        try {
          
          const userData = await User.me();
          
          
          if (!userData) {
            window.location.href = '/login';
          } else if (!userData.onboarding_completed) {
            window.location.href = '/onboarding';
          } else {
            window.location.href = '/Dashboard';
          }
        } catch (error) {
          
          console.error('Error checking auth for root redirect:', error);
          window.location.href = '/login';
        }
      };
      handleRootRedirect();
      return;
    }

    // Skip auth check on auth pages (login, signup, onboarding)
    if (isAuthPage) {
      setCheckingOnboarding(false);
      return;
    }

    const loadInitialUser = async () => {
      try {
        
        const userData = await User.me();
        
        
        if (!userData) {
          // Redirect to login if not logged in (only log if not on auth pages)
          window.location.href = '/login';
          return;
        }
        
        if (userData && !userData.onboarding_completed && userData.monthly_income && userData.monthly_income > 0) {
          console.log('🔧 Detected completed onboarding without flag - fixing now...');
          try {
            await User.updateMe({ onboarding_completed: true });
            userData.onboarding_completed = true;
            console.log('✅ Onboarding flag set to true');
          } catch (error) {
            console.error('Failed to set onboarding flag:', error);
          }
        }
        
        
        setUser(userData);
      } catch (error) {
        
        console.error("Error loading user:", error);
        setUser(null);
        // Redirect to login on error
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/onboarding' && !currentPath.includes('login') && !currentPath.includes('onboarding')) {
          window.location.href = '/login';
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };
    loadInitialUser();
  }, [location.pathname, isAuthPage]);



  React.useEffect(() => {
    if (!user) return;

    const checkInVisibility = async () => {
        try {
            const today = new Date();
            const currentMonthStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(today.getFullYear(), today.getMonth(), 1));
            const currentDay = today.getDate();

            // Load monthly checks for current month
            let existingChecks = [];
            try {
              // Only try to load if MonthlyCheck is available
              if (MonthlyCheck && typeof MonthlyCheck.filter === 'function') {
                existingChecks = await MonthlyCheck.filter({
                    month: currentMonthStr,
                    user_id: user.id
                });
              }
            } catch (error) {
              console.warn('Monthly checks not available:', error.message);
              existingChecks = [];
            }

            if (existingChecks.length > 0) {
                setShowCheckIn(false);
                return;
            }

            // Load monthly costs and debts
            const [monthlyCosts, debts] = await Promise.all([
              (async () => {
                try {
                  const result = await MonthlyCost.filter({ status: 'actief', user_id: user.id });
                  return result;
                } catch (error) {
                  console.error('Error loading monthly costs:', error);
                  return [];
                }
              })(),
              (async () => {
                try {
                  const result = await Debt.filter({ status: 'betalingsregeling', user_id: user.id });
                  return result;
                } catch (error) {
                  console.error('Error loading debts:', error);
                  return [];
                }
              })()
            ]);

            const pastDueCosts = monthlyCosts.filter(c => c.payment_date <= currentDay);
            const pastDueDebts = debts.filter(debt => {
                if (!debt.payment_plan_date) return false;
                try {
                    const paymentDay = new Date(debt.payment_plan_date).getDate();
                    return paymentDay <= currentDay;
                } catch (e) {
                    return false;
                }
            });

            const hasPastDueItem = pastDueCosts.length > 0 || pastDueDebts.length > 0;
            setShowCheckIn(hasPastDueItem);
        } catch (error) {
            console.error('Error in checkInVisibility:', error);
            setShowCheckIn(false);
        }
    };

    checkInVisibility();
  }, [user, location.pathname, language]);


  const handleFabDragMove = React.useCallback((e) => {
    if (!isDragging.current) return;
    didDrag.current = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const fabElement = fabRef.current;
    if (!fabElement) return;

    const newX = clientX - dragStart.current.offsetX;
    const newY = clientY - dragStart.current.offsetY;

    const clampedX = Math.max(0, Math.min(newX, window.innerWidth - fabElement.offsetWidth));
    const clampedY = Math.max(0, Math.min(newY, window.innerHeight - fabElement.offsetHeight));

    setFabPosition({ x: clampedX, y: clampedY });
  }, []);

  const handleFabDragEnd = React.useCallback(() => {
    isDragging.current = false;
    window.removeEventListener('mousemove', handleFabDragMove);
    window.removeEventListener('mouseup', handleFabDragEnd);
    window.removeEventListener('touchmove', handleFabDragMove);
    window.removeEventListener('touchend', handleFabDragEnd);
    
    setTimeout(() => {
        didDrag.current = false;
    }, 0);
  }, [handleFabDragMove]);

  const handleFabDragStart = React.useCallback((e) => {
    isDragging.current = true;
    didDrag.current = false;

    const fabElement = fabRef.current;
    if (!fabElement) return;

    const rect = fabElement.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragStart.current = {
      x: clientX,
      y: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };

    setFabPosition({ x: rect.left, y: rect.top });

    window.addEventListener('mousemove', handleFabDragMove);
    window.addEventListener('mouseup', handleFabDragEnd);
    window.addEventListener('touchmove', handleFabDragMove);
    window.addEventListener('touchend', handleFabDragEnd);
  }, [handleFabDragMove, handleFabDragEnd]);

  React.useEffect(() => {
      return () => {
          if (isDragging.current) {
              handleFabDragEnd();
          }
      };
  }, [handleFabDragEnd]);
  
  const isActive = React.useCallback(
    (path) => {
      if (!path) return false;
      const targetUrl = createPageUrl(path);
      if (['Dashboard', 'Potjes', 'VasteLastenCheck', 'AdminFAQ', 'AdminNewsletter', 'AdminSupport', 'AdminResearch'].includes(path)) { 
        return location.pathname === targetUrl;
      }
      return location.pathname.startsWith(targetUrl);
    },
    [location.pathname]
  );
  
  const navigationItems = React.useMemo(() => {
    const items = [
      {
        titleKey: "nav.dashboard",
        path: "Dashboard",
        icon: Home,
        type: "link"
      },
      {
        titleKey: "nav.balance",
        icon: DollarSign,
        type: "dropdown",
        subItems: [
          {
            titleKey: "nav.income",
            path: "Income",
            icon: TrendingUp
          },
          {
            titleKey: "nav.monthlyExpenses",
            path: "MaandelijkseLasten",
            icon: Receipt
          },
        ]
      },

      {
        titleKey: "nav.budgetPlan",
        path: "BudgetPlan",
        icon: PieChart,
        type: "link"
      },
      {
        titleKey: "nav.potjes",
        path: "Potjes",
        icon: PiggyBank,
        type: "link"
      },
      {
        titleKey: "nav.checkIn",
        path: "VasteLastenCheck",
        icon: Check,
        type: "link"
      },
      {
        titleKey: "debts.title",
        path: "Debts",
        icon: CreditCard,
        type: "link"
      },
      {
        titleKey: "nav.adempauze",
        path: "Adempauze",
        icon: Heart,
        type: "link"
      },
      {
        titleKey: "nav.pennyForPenny",
        path: "CentVoorCent",
        icon: Coins,
        type: "link"
      },
    ];
    return items;
  }, []);

  const isBalansActive = React.useCallback(() => {
    return navigationItems
      .find(item => item.titleKey === 'nav.balance')
      ?.subItems.some(sub => isActive(sub.path));
  }, [isActive, navigationItems]);


  const mobileNavItems = React.useMemo(() => [
    {
      titleKey: "nav.home",
      path: "Dashboard",
      icon: Home,
    },
    {
      titleKey: "nav.potjes",
      path: "Potjes",
      icon: PiggyBank,
    },
    {
      titleKey: "debts.title",
      path: "Debts",
      icon: CreditCard,
    },
    {
      titleKey: "nav.budgetPlan",
      path: "BudgetPlan",
      icon: PieChart,
    }
  ], []);

  const bottomNavigationItems = React.useMemo(() => [
    {
      titleKey: "nav.feedback",
      path: "Feedback",
      icon: MessageCircle,
      type: "link"
    },
    {
      titleKey: "nav.settings",
      path: "Settings",
      icon: Settings,
      type: "link"
    },
    {
      titleKey: "nav.help",
      path: "HelpSupport",
      icon: HelpCircle,
      type: "link"
    }
  ], []);

  React.useEffect(() => {
    setBalansOpen(isBalansActive());
  }, [isBalansActive]);


  const fetchNotifications = React.useCallback(async () => {
    
    if (!user?.id || !notificationsEnabled) return;

    try {
      const allNotifications = await Notification.filter({ user_id: user.id }, '-created_at');
      
      
      setNotifications(allNotifications || []);
      const unread = (allNotifications || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.warn("Notifications unavailable, disabling feature:", error);
      setNotificationsEnabled(false);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, notificationsEnabled]);

  React.useEffect(() => {
    if (user && notificationsEnabled) {
      fetchNotifications();
      
      const interval = setInterval(() => {
        if (notificationsEnabled) {
          fetchNotifications().catch(() => {
            setNotificationsEnabled(false);
          });
        }
      }, 120000);
      
      return () => clearInterval(interval);
    }
  }, [user, notificationsEnabled, fetchNotifications]);

  const handleMarkAsRead = React.useCallback(async (notificationId) => {
    if (!notificationsEnabled) return;
    
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.warn("Failed to mark as read:", error);
    }
  }, [notificationsEnabled]);

  const handleMarkAllAsRead = React.useCallback(async () => {
    if (!notificationsEnabled) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;
      
      await Promise.allSettled(
        unreadNotifications.map(notif => 
          Notification.update(notif.id, { is_read: true }).catch(err => {
            console.warn("Failed to mark notification as read:", notif.id, err);
            return null;
          })
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.warn("Failed to mark all as read:", error);
    }
  }, [notifications, notificationsEnabled]);

  const handleLogout = React.useCallback(async () => {
    try {
      await User.logout();
      navigate(createPageUrl('Login'));
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [navigate]);
  
  const languages = [
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true }
  ];

  const getNotificationIcon = React.useCallback((type) => {
    switch(type) {
      case 'fixed_cost': return <Receipt className="w-5 h-5 text-blue-500" />;
      case 'pot_warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'loan': return <ArrowLeftRight className="w-5 h-5 text-purple-500" />;
      case 'check_in': return <Calendar className="w-5 h-5 text-cyan-500" />;
      case 'motivation': return <Heart className="w-5 h-5 text-green-500" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'debt': return <CreditCard className="w-5 h-5 text-red-500" />;
      case 'income': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  }, []);

  const getTimeAgo = React.useCallback((date) => {
    try {
      if (!date) return 'Recent';
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Recent';

      const now = new Date();
      const diffMs = now - parsedDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Zojuist';
      if (diffMins < 60) return `${diffMins} min geleden`;
      if (diffHours < 24) return `${diffHours} uur geleden`;
      if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
      return new Intl.DateTimeFormat(language || 'nl', { day: 'numeric', month: 'short' }).format(parsedDate);
    } catch (e) {
      console.error('Error formatting time ago:', e);
      return 'Recent';
    }
  }, [language]);
  
  const groupedNotifications = React.useMemo(() => {
    const groups = { today: [], yesterday: [], earlier: [] };
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    notifications.forEach(notif => {
      try {
        if (!notif.created_date) {
          groups.earlier.push(notif);
          return;
        }
        const date = new Date(notif.created_date);
        if (isNaN(date.getTime())) {
          groups.earlier.push(notif);
          return;
        }
        if (date >= todayStart && date < tomorrowStart) {
          groups.today.push(notif);
        } else if (date >= yesterdayStart && date < todayStart) {
          groups.yesterday.push(notif);
        } else {
          groups.earlier.push(notif);
        }
      } catch (e) {
        console.error('Error grouping notification:', e);
        groups.earlier.push(notif);
      }
    });
    return groups;
  }, [notifications]);


  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
          <p className="text-gray-600 text-sm mt-4">{t('common.pleaseWait')}</p>
        </div>
      </div>
    );
  }
  
  // If on login/onboarding page, render without sidebar/header
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  const isAnyModalOpen = showAddModal || showLoanModal || showScanBonModal || showConfirmModal;

  return (
    <div className={`flex min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-sans antialiased transition-colors duration-200 ${isAnyModalOpen ? 'overflow-hidden' : ''}`} dir={languages.find(l => l.code === language)?.rtl ? 'rtl' : 'ltr'}>
      <style>{`
        :root {
          --konsensi-primary: #10b77f;
          --konsensi-accent: #34d399;
          --konsensi-accent-light: #d1fae5;
          --konsensi-primary-dark: #059669;
          --konsensi-dark: #10221c;
          --konsensi-card: #1a2c26;
          --konsensi-card-elevated: #2A3F36;
          --konsensi-border: #2A3F36;
        }
        .mobile-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 72px; background: white; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-around; align-items: center; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05); z-index: 1000; }
        .nav-item-mobile { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 12px; min-width: 64px; cursor: pointer; transition: all 0.2s ease; text-decoration: none; color: #6B7280; }
        .nav-item-mobile.active { color: var(--konsensi-primary); }
        .nav-item-mobile svg { width: 24px; height: 24px; transition: transform 0.2s ease; }
        .nav-item-mobile.active svg { transform: scale(1.1); }
        .nav-label-mobile { font-size: 11px; font-weight: 600; }
        .fab-button { z-index: 1001; cursor: grab; user-select: none; touch-action: none; }
        .fab-button.default-pos { position: relative; margin: 0; }
        .fab-button.default-pos .fab { margin-top: -28px; }
        .fab-button.fixed-pos { position: fixed; }
        .fab-button.dragging { transition: none; z-index: 1002; cursor: grabbing; }
        .fab { width: 56px; height: 56px; background: linear-gradient(135deg, var(--konsensi-primary) 0%, #6A994E 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(56, 102, 65, 0.4); transition: transform 0.2s ease, box-shadow 0.2s ease; border: 4px solid white; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        .fab:active { transform: scale(0.95); }
        .fab.dragging { transform: scale(1.1); box-shadow: 0 8px 30px rgba(56, 102, 65, 0.5); }
        .fab svg { width: 28px; height: 28px; color: white; pointer-events: none; }
        .mobile-header { position: sticky; top: 0; z-index: 40; background: #11221c; border-bottom: 1px solid #23483c; padding: 12px 16px; }
        .mobile-content { padding-bottom: 88px; min-height: 100vh; }
        @media (min-width: 768px) {
          .mobile-bottom-nav, .mobile-header, .fab-button { display: none; }
          .mobile-content { padding-bottom: 0; min-height: auto; }
        }
        @media (min-width: 768px) {
          .desktop-header { display: flex !important; position: sticky; top: 0; z-index: 50; }
          .main-content-wrapper { width: 100%; overflow-x: hidden; }
        }
        .add-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 2000; animation: fadeIn 0.2s ease; }
        .add-modal-content { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-radius: 24px 24px 0 0; padding: 24px 20px; padding-bottom: calc(24px + env(safe-area-inset-bottom)); animation: slideUp 0.3s ease; max-height: 80vh; overflow-y: auto; z-index: 2001; }
        .add-modal-content::-webkit-scrollbar { width: 6px; }
        .add-modal-content::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .add-modal-content::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .add-modal-content::-webkit-scrollbar-thumb:hover { background: #555; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .add-option { display: flex; align-items: center; gap: 16px; padding: 20px; background: white; border: 2px solid #E5E7EB; border-radius: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease; }
        .add-option:active { transform: scale(0.98); background: #F9FAFB; }
        .add-option-icon { font-size: 32px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #F3F4F6; border-radius: 12px; }
        .add-option-text h3 { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 2px; }
        .add-option-text p { font-size: 13px; color: #6B7280; }
      `}</style>

      <div className="flex-grow flex flex-col w-full">
        {/* Desktop Header - New Konsensi Design */}
        <nav className="w-full bg-konsensi-dark dark:bg-[#0a0a0a] h-16 px-8 flex items-center justify-center sticky top-0 z-50 border-b border-konsensi-dark/50 dark:border-[#2a2a2a] transition-colors duration-200">
          <div className="w-full max-w-[1400px] flex items-center justify-between">
            {/* Logo & Brand */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 text-white">
              <img 
                src="/logo%20header.png" 
                alt="Konsensi Logo" 
                className="h-14 w-auto"
                onError={(e) => {
                  // Fallback to regular logo if header logo fails
                  e.target.src = "/logo.png";
                }}
              />
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to={createPageUrl('Dashboard')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPageName === 'Dashboard'
                    ? 'text-white'
                    : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              
              {/* Balans Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                      isBalansActive()
                        ? 'text-white'
                        : 'text-[#a1a1a1] hover:text-white'
                    }`}
                  >
                    Balans
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#1a1a1a] border border-[#2a2a2a]">
                  <DropdownMenuItem asChild>
                    <Link 
                      to={createPageUrl('Income')}
                      className="text-white hover:bg-[#2a2a2a] flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Inkomen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      to={createPageUrl('MaandelijkseLasten')}
                      className="text-white hover:bg-[#2a2a2a] flex items-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      Uitgaven
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link 
                to={createPageUrl('BudgetPlan')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPageName === 'BudgetPlan'
                    ? 'text-white'
                    : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                Budgetplan
              </Link>
              
              <Link
                to={createPageUrl('Potjes')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPageName === 'Potjes'
                    ? 'text-white'
                    : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                Potjes
              </Link>

              <Link
                to={createPageUrl('Debts')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPageName === 'Debts'
                    ? 'text-white'
                    : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                Betaalachterstanden
              </Link>

              <Link
                to={createPageUrl('CentVoorCent')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentPageName === 'CentVoorCent'
                    ? 'text-white'
                    : 'text-[#a1a1a1] hover:text-white'
                }`}
              >
                Cent voor cent
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <div className="flex items-center bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-full p-1 border border-[#3a3a3a] dark:border-[#3a3a3a]">
                <button 
                  aria-label="Switch to light mode" 
                  onClick={() => setDarkMode(false)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    !darkMode 
                      ? 'bg-[#3a3a3a] text-primary shadow-sm border border-white/5' 
                      : 'text-[#6b7280] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">light_mode</span>
                </button>
                <button 
                  aria-label="Current theme: Dark mode" 
                  onClick={() => setDarkMode(true)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    darkMode 
                      ? 'bg-[#3a3a3a] text-primary shadow-sm border border-white/5' 
                      : 'text-[#6b7280] hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>dark_mode</span>
                </button>
              </div>

              {/* Adem Pauze (Heart Icon) */}
              <Link 
                to={createPageUrl('Adempauze')}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#6b7280] dark:text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] dark:hover:bg-[#2a2a2a] transition-all"
                title="Adem pauze"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Settings Button (Gear Icon) */}
              <Link 
                to={createPageUrl('Settings')}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#6b7280] dark:text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] dark:hover:bg-[#2a2a2a] transition-all"
                title="Instellingen"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <span className="hidden xl:block text-sm font-medium text-white group-hover:text-primary transition-colors">
                      {user?.voornaam || user?.full_name || user?.name || user?.email?.split('@')[0] || 'Gebruiker'}
                    </span>
                    <div 
                      className="w-9 h-9 rounded-full bg-cover bg-center border border-[#3a3a3a] dark:border-[#3a3a3a] group-hover:border-primary transition-all"
                      style={user?.profielfoto_url ? { backgroundImage: `url(${user.profielfoto_url})` } : {}}
                    >
                      {!user?.profielfoto_url && (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-black font-bold text-sm rounded-full">
                          {user?.voornaam?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border border-[#2a2a2a]">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium capitalize">{user?.voornaam || user?.full_name || user?.name || user?.email?.split('@')[0] || 'Gebruiker'}</span>
                      <span className="text-xs text-[#a1a1a1]">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Settings')} className="text-white hover:bg-[#2a2a2a]">
                    <UserCircle className="w-4 h-4 mr-2" />
                    {t('profile.accountDetails')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Settings')} className="text-white hover:bg-[#2a2a2a]">
                    <Settings className="w-4 h-4 mr-2" />
                    {t('nav.settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-[#2a2a2a]">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('profile.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>

        {/* Mobile Header - New Konsensi Design */}
        <nav className="md:hidden w-full bg-konsensi-dark dark:bg-[#0a0a0a] h-16 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-konsensi-dark/50 dark:border-[#2a2a2a] transition-colors duration-200">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 text-white">
            <img 
              src="/logo%20header.png" 
              alt="Konsensi Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback to regular logo if header logo fails
                e.target.src = "/logo.png";
              }}
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="flex items-center bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-full p-0.5 border border-[#3a3a3a] dark:border-[#3a3a3a]">
              <button 
                aria-label="Switch to light mode" 
                onClick={() => setDarkMode(false)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  !darkMode 
                    ? 'bg-[#3a3a3a] text-primary' 
                    : 'text-[#6b7280]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
              </button>
              <button 
                aria-label="Switch to dark mode" 
                onClick={() => setDarkMode(true)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  darkMode 
                    ? 'bg-[#3a3a3a] text-primary' 
                    : 'text-[#6b7280]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>dark_mode</span>
              </button>
            </div>

            {/* Adem Pauze (Heart Icon) */}
            <Link 
              to={createPageUrl('Adempauze')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#6b7280] dark:text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] dark:hover:bg-[#2a2a2a] transition-all"
              title="Adem pauze"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Settings Button (Gear Icon) */}
            <Link 
              to={createPageUrl('Settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#6b7280] dark:text-[#6b7280] hover:text-white hover:bg-[#2a2a2a] dark:hover:bg-[#2a2a2a] transition-all"
              title="Instellingen"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div 
                  className="w-9 h-9 rounded-full bg-cover bg-center border border-[#3a3a3a] dark:border-[#3a3a3a] cursor-pointer"
                  style={user?.profielfoto_url ? { backgroundImage: `url(${user.profielfoto_url})` } : {}}
                >
                  {!user?.profielfoto_url && (
                    <div className="w-full h-full flex items-center justify-center bg-primary text-black font-bold text-xs rounded-full">
                      {user?.voornaam?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border border-[#2a2a2a]">
                <DropdownMenuLabel className="text-white">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">{user?.voornaam || user?.full_name || user?.name || user?.email?.split('@')[0] || 'Gebruiker'}</span>
                    <span className="text-xs text-[#a1a1a1]">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Settings')} className="text-white hover:bg-[#2a2a2a]">
                  <UserCircle className="w-4 h-4 mr-2" />
                  {t('profile.accountDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = createPageUrl('Settings')} className="text-white hover:bg-[#2a2a2a]">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-[#2a2a2a]">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('profile.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
        
        {/* Main Content */}
        <div className="main-content-wrapper mobile-content md:pt-16 transition-all duration-300">
          <PostponedPaymentTracker />
          
          <main className="flex-1 px-4 pt-16 pb-6 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

            {/* Feedback FAB Button */}
            <Link
              to={createPageUrl('Feedback')}
              className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ zIndex: 1002, right: '16px' }}
              title="Feedback geven"
            >
              <MessageCircle className="w-6 h-6" />
            </Link>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-nav md:hidden">
          {mobileNavItems.slice(0, 2).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.titleKey}
                to={createPageUrl(item.path)}
                className={`nav-item-mobile ${active ? 'active' : ''}`}
              >
                <item.icon />
                <span className="nav-label-mobile">{getNavTranslation(item.titleKey, language)}</span>
              </Link>
            );
          })}

          {!pagesWithCustomFab.includes(currentPageName) && (
            <div
              ref={fabRef}
              className={`fab-button ${fabPosition.x !== null ? 'fixed-pos' : 'default-pos'} ${isDragging.current ? 'dragging' : ''}`}
              style={fabPosition.x !== null ? { left: `${fabPosition.x}px`, top: `${fabPosition.y}px`} : {}}
              onMouseDown={handleFabDragStart}
              onTouchStart={handleFabDragStart}
              onClick={(e) => {
                if (didDrag.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (fabPosition.x !== null) {
                    setFabPosition({ x: null, y: null });
                }
                setShowAddModal(true);
              }}
            >
              <button
                className={`fab ${isDragging.current ? 'dragging' : ''}`}
                aria-label={t('addmodal.add')}
                onClick={(e) => e.preventDefault()}
              >
                <Plus />
              </button>
            </div>
          )}

          {mobileNavItems.slice(2).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.titleKey}
                to={createPageUrl(item.path)}
                className={`nav-item-mobile ${active ? 'active' : ''}`}
              >
                <item.icon />
                <span className="nav-label-mobile">{getNavTranslation(item.titleKey, language)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Add Modal */}
        {showAddModal && (
          <>
            <div
              className="add-modal-overlay"
              onClick={() => setShowAddModal(false)}
            />
            <div className="add-modal-content">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{addModalTranslations.title[language] || addModalTranslations.title['nl']}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full" > <X className="w-5 h-5" /> </button>
              </div>
              <div className="space-y-3">
                <button className="add-option" onClick={() => { setShowAddModal(false); setShowScanBonModal(true); }} > 
                  <div className="add-option-icon"> 
                    <Receipt className="w-7 h-7 text-gray-700" /> 
                  </div> 
                  <div className="add-option-text"> 
                    <h3>📸 Scan Bon</h3> 
                    <p>Scan een kassabon of factuur</p> 
                  </div> 
                </button>

                <button className="add-option" onClick={() => { setShowAddModal(false); window.location.href = createPageUrl('Income'); }} > <div className="add-option-icon"> <TrendingUp className="w-7 h-7 text-gray-700" /> </div> <div className="add-option-text"> <h3>{addModalTranslations.addIncome.title[language] || addModalTranslations.addIncome.title['nl']}</h3> <p>{addModalTranslations.addIncome.description[language] || addModalTranslations.addIncome.description['nl']}</p> </div> </button>
                <button className="add-option" onClick={() => { setShowAddModal(false); window.location.href = createPageUrl('MaandelijkseLasten'); }} > <div className="add-option-icon"> <Receipt className="w-7 h-7 text-gray-700" /> </div> <div className="add-option-text"> <h3>{addModalTranslations.addFixedCost.title[language] || addModalTranslations.addFixedCost.title['nl']}</h3> <p>{addModalTranslations.addFixedCost.description[language] || addModalTranslations.addFixedCost.description['nl']}</p> </div> </button>
                <button className="add-option" onClick={() => { setShowAddModal(false); window.location.href = createPageUrl('Potjes'); }} > <div className="add-option-icon"> <PiggyBank className="w-7 h-7 text-gray-700" /> </div> <div className="add-option-text"> <h3>{addModalTranslations.addPot.title[language] || addModalTranslations.addPot.title['nl']}</h3> <p>{addModalTranslations.addPot.description[language] || addModalTranslations.addPot.description['nl']}</p> </div> </button>
                <button className="add-option" onClick={() => { setShowAddModal(false); setShowLoanModal(true); }} > <div className="add-option-icon"> <ArrowLeftRight className="w-7 h-7 text-gray-700" /> </div> <div className="add-option-text"> <h3>{addModalTranslations.addLoan.title[language] || addModalTranslations.addLoan.title['nl']}</h3> <p>{addModalTranslations.addLoan.description[language] || addModalTranslations.addLoan.description['nl']}</p> </div> </button>
                <button className="add-option" onClick={() => { setShowAddModal(false); setShowScanDebtModal(true); }} > <div className="add-option-icon" style={{ fontSize: '32px' }}> 📸 </div> <div className="add-option-text"> <h3>Scan Incassobrief</h3> <p>Scan een incassobrief of aanmaning</p> </div> </button>
              </div>
            </div>
          </>
        )}

        <AddLoanModal 
          isOpen={showLoanModal}
          onClose={() => setShowLoanModal(false)}
          onLoanAdded={() => { }}
        />

        <ScanDebtModal
          isOpen={showScanDebtModal}
          onClose={() => setShowScanDebtModal(false)}
          onDebtScanned={async (debtData) => {
            try {
              await Debt.create(debtData);
              toast({ 
                title: "✅ Schuld toegevoegd!",
                description: "Je kunt nu de volgende brief scannen"
              });
            } catch (error) {
              console.error("Error saving scanned debt:", error);
              toast({ 
                title: "Fout bij opslaan", 
                description: error.message,
                variant: "destructive" 
              });
            }
          }}
        />

        {showScanBonModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">📸 Scan je bon</h2>
                <button onClick={() => setShowScanBonModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">Upload een foto van je kassabon of factuur</p>
                  
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    id="bon-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        toast({ title: '📸 Bon wordt verwerkt...' });
                        
                        // Upload file to Supabase Storage
                        const uploadResult = await UploadFile({ file });
                        
                        // TODO: Implement ExtractDataFromUploadedFile with Supabase Edge Function
                        // For now, show manual input form
                          setScannedData({
                          merchant: 'Gescande bon',
                          date: new Date().toISOString().split('T')[0],
                          amount: 0,
                          category: 'overig'
                          });
                          setShowScanBonModal(false);
                          setShowConfirmModal(true);
                          
                          toast({ 
                          title: '✅ Foto geüpload!', 
                          description: 'Vul de gegevens handmatig in' 
                          });
                      } catch (error) {
                        console.error('Scan error:', error);
                        toast({ 
                          title: '❌ Fout bij uploaden', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      }
                    }}
                  />
                  
                  <label htmlFor="bon-upload">
                    <Button type="button" className="bg-green-500 hover:bg-green-600" asChild>
                      <span className="cursor-pointer">
                        📷 Maak foto / Upload
                      </span>
                    </Button>
                  </label>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>💡 <strong>Tip:</strong> Zorg voor een duidelijke foto met goed licht</p>
                  <p>📝 De AI extraheert automatisch: winkel, datum, bedrag en categorie</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && scannedData && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">✅ Controleer je bon</h2>
                <button onClick={() => {
                  setShowConfirmModal(false);
                  setScannedData(null);
                }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📋 Controleer de gescande gegevens en kies aan welk potje dit gekoppeld moet worden
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Winkel / Beschrijving</label>
                  <input
                    type="text"
                    value={scannedData.merchant}
                    onChange={(e) => setScannedData({...scannedData, merchant: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={scannedData.amount}
                      onChange={(e) => setScannedData({...scannedData, amount: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                    <input
                      type="date"
                      value={scannedData.date}
                      onChange={(e) => setScannedData({...scannedData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏺 Koppel aan potje (optioneel)
                  </label>
                  <select
                    value={scannedData.selectedPot || ''}
                    onChange={(e) => setScannedData({...scannedData, selectedPot: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Geen potje (algemene uitgave)</option>
                    {availablePots.map(pot => (
                      <option key={pot.id} value={pot.name}>
                        {pot.icon} {pot.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Kies een potje om de uitgave automatisch te koppelen
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setScannedData(null);
                    }}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={async (e) => {
                      try {
                        const button = e.currentTarget;
                        if (button) button.disabled = true;
                        
                        await Transaction.create({
                          type: 'expense',
                          amount: scannedData.amount,
                          category: scannedData.selectedPot || scannedData.category,
                          description: scannedData.merchant,
                          date: scannedData.date
                        });
                        
                        setShowConfirmModal(false);
                        setScannedData(null);
                        
                        setTimeout(() => {
                          toast({ 
                            title: '✅ Uitgave opgeslagen!', 
                            description: scannedData.selectedPot 
                              ? `Gekoppeld aan ${scannedData.selectedPot}` 
                              : 'Als algemene uitgave'
                          });
                        }, 100);
                        
                      } catch (error) {
                        console.error('Error saving transaction:', error);
                        toast({ 
                          title: '❌ Fout bij opslaan', 
                          description: error.message,
                          variant: 'destructive' 
                        });
                      }
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    💾 Opslaan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
