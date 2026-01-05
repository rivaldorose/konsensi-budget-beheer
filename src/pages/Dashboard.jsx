import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User, Income, Debt, DebtPayment, Pot, MonthlyCost, DebtStrategy, Transaction } from "@/api/entities";
import { incomeService, debtService, monthlyCostService } from '@/components/services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { motion } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";
import { XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AchievementsModal from "@/components/gamification/AchievementsModal";
import PersonalizedAdviceWidget from "@/components/dashboard/PersonalizedAdviceWidget";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCards from "@/components/dashboard/StatCards";
import DebtJourneyChart from "@/components/dashboard/DebtJourneyChart";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import UpcomingPayments from "@/components/dashboard/UpcomingPayments";
import DashboardAlerts from "@/components/dashboard/DashboardAlerts";
import GamificationStats from "@/components/dashboard/GamificationStats";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { gamificationService } from "@/services/gamificationService";
import { dashboardService } from "@/services/dashboardService";

const createPageUrl = (pageName) => `/${pageName.toLowerCase()}`;

// Native date helpers
const getStartOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
};

const subMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

const subWeeks = (date, weeks) => {
  const d = new Date(date);
  d.setDate(d.getDate() - (weeks * 7));
  return d;
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const dashboardTranslations = {
  'dashboard.welcomeBack': { nl: 'Welkom terug, {name}', en: 'Welcome back, {name}', es: 'Bienvenido de vuelta, {name}', pl: 'Witaj z powrotem, {name}', de: 'Willkommen zurück, {name}', fr: 'Content de vous revoir, {name}', tr: 'Tekrar hoş geldin, {name}', ar: 'مرحبًا بعودتك، {name}' },
  'dashboard.totalIncome': { nl: 'totaal inkomen', en: 'total income', es: 'ingreso total', pl: 'dochód całkowity', de: 'Gesamteinkommen', fr: 'revenu total', tr: 'toplam gelir', ar: 'إجمالي الدخل' },
  'dashboard.expenses': { nl: 'uitgaven', en: 'expenses', es: 'gastos', pl: 'wydatki', de: 'Ausgaben', fr: 'dépenses', tr: 'giderler', ar: 'المصروفات' },
  'dashboard.proud': { nl: 'trots', en: 'proud', es: 'orgulloso', pl: 'duma', de: 'stolz', fr: 'fier', tr: 'gururlu', ar: 'فخور' },
  'dashboard.paidOff': { nl: 'afbetaald', en: 'paid off', es: 'pagado', pl: 'spłacono', de: 'abbezahlt', fr: 'remboursé', tr: 'ödendi', ar: 'مدفوع' },
  'dashboard.thisMonth': { nl: 'deze maand', en: 'this month', es: 'este mes', pl: 'w tym miesiącu', de: 'diesen Monat', fr: 'ce mois-ci', tr: 'bu ay', ar: 'هذا الشهر' },
  'dashboard.totalDebt': { nl: 'totale schuld', en: 'total debt', es: 'deuda total', pl: 'dług całkowity', de: 'Gesamtschulden', fr: 'dette totale', tr: 'toplam borç', ar: 'إجمالي الدين' },
  'dashboard.weWillGetThere': { nl: 'we komen er samen uit', en: 'we\'ll get there together', es: 'lo lograremos juntos', pl: 'damy radę razem', de: 'wir schaffen das zusammen', fr: 'on y arrivera ensemble', tr: 'birlikte başaracağız', ar: 'سننجح معًا' },
  'dashboard.debtJourney': { nl: 'Schuldenreis', en: 'Debt Journey', es: 'Viaje de Deudas', pl: 'Podróż przez długi', de: 'Schuldenreise', fr: 'Parcours de la dette', tr: 'Borç Yolculuğu', ar: 'رحلة الديون' },
  'dashboard.yourProgress': { nl: 'Jouw Vooruitgang', en: 'Your Progress', es: 'Tu Progreso', pl: 'Twoje Postępy', de: 'Dein Fortschritt', fr: 'Votre Progression', tr: 'İlerlemen', ar: 'التقدم' },
  'dashboard.totalPaidAllTime': { nl: 'Totaal Afbetaald', en: 'Total Paid Off', es: 'Total Pagado', pl: 'Spłacono w sumie', de: 'Insgesamt abbezahlt', fr: 'Total Remboursé', tr: 'Toplam Ödenen', ar: 'إجمالي المدفوع' },
  'dashboard.progress': { nl: 'Voortgang', en: 'Progress', es: 'Progreso', pl: 'Postęp', de: 'Fortschritt', fr: 'Progression', tr: 'İlerleme', ar: 'التقدم' },
  'dashboard.paidPerMonth': { nl: 'betaald per maand', en: 'paid per month', es: 'pagado por mes', pl: 'spłacono miesięcznie', de: 'pro Monat gezahlt', fr: 'payé par maand', tr: 'aylık ödenen', ar: 'المدفوع شهريًا' },
  'dashboard.onTheWayToFreedom': { nl: 'Op weg naar vrijheid', en: 'On the way to freedom', es: 'En camino a la libertad', pl: 'W drodze do wolności', de: 'Auf dem Weg in die Freiheit', fr: 'En route vers la liberté', tr: 'Özgürlüğe giden yolda', ar: 'في طريقنا إلى الحرية' },
  'dashboard.monthsUntilFree': { nl: 'Met {amount}/maand ben je over {months} maanden schuldenvrij', en: 'With {amount}/month you will be debt free in {months} months', es: 'Con {amount}/mes estarás libre de deudas en {months} meses', pl: 'Z {amount}/miesiąc będziesz wolny od długów za {months} miesięcy', de: 'Mit {amount}/Monat sind Sie in {months} Monaten schuldenfrei', fr: 'Avec {amount}/mois, vous serez libre de dettes dans {months} mois', tr: 'Aylık {amount} ile {months} ay içinde borçsuz olacaksınız', ar: 'مع {amount}/شهر ستكون خاليًا من الديون خلال {months} شهر' },
  'dashboard.upcomingPayments': { nl: 'Aankomende betalingen', en: 'Upcoming Payments', es: 'Próximos Pagos', pl: 'Nadchodzące płatności', de: 'Anstehende Zahlungen', fr: 'Paiements à venir', tr: 'Yaklaşan Ödemeler', ar: 'الدفعات القادمة' },
  'dashboard.nextDebtPayment': { nl: 'Volgende schuldbetaling', en: 'Next Debt Payment', es: 'Próximo Pago de Deuda', pl: 'Następna spłata długu', de: 'Nächste Schuldenzahlung', fr: 'Prochain paiement de la dette', tr: 'Sonraki Borç Ödemesi', ar: 'الدفع التالي للدين' },
  'dashboard.nextFixedCost': { nl: 'Volgende vaste last', en: 'Next Fixed Cost', es: 'Próximo Costo Fijo', pl: 'Następny koszt stały', de: 'Nächste Fixkosten', fr: 'Prochain coût fixe', tr: 'Sonraki Sabit Gider', ar: 'التكلفة الثابتة القادمة' },
  'dashboard.noUpcomingPayments': { nl: 'Geen aankomende betalingen.', en: 'No upcoming payments.', es: 'No hay pagos próximos.', pl: 'Brak nadkomende betalingen.', de: 'Keine anstehenden Zahlungen.', fr: 'Pas de paiements à venir.', tr: 'Yaklaşan ödeme yok.', ar: 'لا توجد دفعات قادمة.' },
  'dashboard.checkInReminder': { nl: 'Check-in Vereist!', en: 'Check-in Required!', es: '¡Registro Requerido!', pl: 'Wymagana odprawa!', de: 'Check-in erforderlich!', fr: 'Enregistrement requis!', tr: 'Giriş Gerekli!', ar: 'التحقق مطلوب!' },
  'dashboard.checkInReminderText': { nl: 'Er zijn betalingen die gecheckt moeten worden deze maand. Klik hier om je check-in te doen.', en: 'There are payments that need to be checked this month. Click here to do your check-in.', es: 'Hay pagos que deben ser verificados este mes. Haz clic aquí para hacer tu registro.', pl: 'Istnieją płatności, które należy sprawdzić w tym miesiącu. Kliknij hier om je check-in te doen.', de: 'Es gibt Zahlungen, die diesen Monat überprüft werden müssen. Klicken Sie hier, um Ihren Check-in durchzuführen.', fr: 'Il y a des paiements qui doivent être vérifiés ce mois-ci. Cliquez ici pour effectuer votre enregistrement.', tr: 'Bu ay kontrol edilmesi gereken ödemeler var. Girişinizi yapmak için buraya tıklayın.', ar: 'هناك مدفوعات تحتاج إلى التحقق منها هذا الشهر. انقر هنا للقيام بالتحقق الخاص بك.' },
  'financialBreakdown.title': { nl: 'Financieel Overzicht', en: 'Financial Breakdown', es: 'Desglose Financiero', pl: 'Zestawienie finansowe', de: 'Finanzübersicht', fr: 'Répartition financière', tr: 'Finansal Döküm', ar: 'التفصيل المالي' },
  'financialBreakdown.noData': { nl: 'Voeg data toe voor een overzicht.', en: 'Add data for an overview.', es: 'Agregue datos para un resumen.', pl: 'Dodaj dane, aby zobaczyć przegląd.', de: 'Fügen Sie Daten für eine Übersicht hinzu.', fr: 'Ajoutez des données voor an overzicht.', tr: 'Genel bakış için veri ekleyin.', ar: 'أضف بيانات للحصول على نظرة عامة.' },
  'financialBreakdown.income': { nl: 'Inkomen', en: 'Income', es: 'Ingresos', pl: 'Dochód', de: 'Einkommen', fr: 'Revenu', tr: 'Gelir', ar: 'الدخل' },
  'financialBreakdown.fixedCosts': { nl: 'Vaste Lasten', en: 'Fixed Costs', es: 'Costos Fijos', pl: 'Koszty stałe', de: 'Fixkosten', fr: 'Frais fixes', tr: 'Sabit Giderler', ar: 'التكاليف الثابتة' },
  'financialBreakdown.paymentPlans': { nl: 'Betalingsregelingen', en: 'Payment Plans', es: 'Planes de Pago', pl: 'Plany spłat', de: 'Zahlungspläne', fr: 'Plans de paiement', tr: 'Ödeme Planları', ar: 'خطط الدفع' },
  'financialBreakdown.pots': { nl: 'Potjes', en: 'Pots', es: 'Fondos', pl: 'Słoiki', de: 'Töpfe', fr: 'Cagnottes', tr: 'Kumbaralar', ar: 'الأوعية' },
  'financialBreakdown.freeToSpend': { nl: 'Vrij te besteden', en: 'Free to Spend', es: 'Libre para Gastar', pl: 'Do wydania', de: 'Frei verfügbar', fr: 'Libre à dépenser', tr: 'Harcanabilir', ar: 'الحر للإنفاق' },
  'financialBreakdown.debt': { nl: 'Schuld', en: 'Debt', es: 'Deuda', pl: 'Dług', de: 'Schulden', fr: 'Dette', tr: 'Borç', ar: 'الدين' },
  'financialBreakdown.totalIncome': { nl: 'totaal inkomen', en: 'total income', es: 'ingreso total', pl: 'dochód całkowity', de: 'Gesamteinkommen', fr: 'revenu total', tr: 'toplam gelir', ar: 'إجمالي الدخل' },
  'common.user': { nl: 'Gebruiker', en: 'User', es: 'Usuario', pl: 'Użytkownik', de: 'Benutzer', fr: 'Utilisateur', tr: 'Kullanıcı', ar: 'المستخدم' },
  'common.error': { nl: 'Fout', en: 'Error', es: 'Error', pl: 'Błąd', de: 'Fehler', fr: 'Erreur', tr: 'Hata', ar: 'خطأ' },
  'dashboard.errorLoading': { nl: 'Laden van dashboard data mislukt.', en: 'Failed to load dashboard data.', es: 'Error al cargar los datos del panel.', pl: 'Nie udało się załadować danych pulpitu.', de: 'Laden der Dashboard-Daten fehlgeschlagen.', fr: 'Échec du chargement des données du tableau de bord.', tr: 'Kontrol paneli verileri yüklenemedi.', ar: 'فشل تحميل بيانات لوحة التحكم.' },
  'dashboard.viewDetails': { nl: 'Bekijk details', en: 'View details', es: 'Ver detalles', pl: 'Zobacz szczegóły', de: 'Details anzeigen', fr: 'Voir les détails', tr: 'Detayları gör', ar: 'عرض التفاصيل' },
  'common.today': { nl: 'Vandaag', en: 'Today', es: 'Hoy', pl: 'Dziś', de: 'Heute', fr: 'Aujourd\'hui', tr: 'Bugün', ar: 'اليوم' },
  'common.yesterday': { nl: 'Gisteren', en: 'Yesterday', es: 'Ayer', pl: 'Wczoraj', de: 'Gestern', fr: 'Hier', tr: 'Dün', ar: 'أمس' },
  'common.earlier': { nl: 'Eerder', en: 'Earlier', es: 'Anterior', pl: 'Wcześniej', de: 'Früher', fr: 'Plus tôt', tr: 'Daha eerder', ar: 'في وقت سابق' },
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [debtVisible, setDebtVisible] = useState(true); // For toggling debt visibility
  const [gamificationData, setGamificationData] = useState({
    level: 1,
    currentXP: 0,
    totalXP: 100,
    badges: [],
    dailyMotivation: "",
    weekGoalPercentage: 0,
  });
  const [dashboardData, setDashboardData] = useState({
    userName: '',
    totalIncome: 0,
    totalExpenses: 0,
    totalPaidThisMonth: 0,
    remainingDebt: 0,
    totalPaidAllTime: 0,
    progressPercentage: 0,
    monthlyGraphData: [],
    weeklyGraphData: [],
    monthsUntilDebtFree: 0,
    monthlyPaymentRate: 0,
    breakdownData: [],
    nextPayment: null,
    nextCost: null,
    debts: [],
    pots: [],
    fixedCosts: [],
    activeDebtPaymentsSum: 0,
    totalPotjesBudget: 0,
    activeStrategy: null,
    showCheckIn: false,
    allIncomes: [],
    allMonthlyCosts: [],
    allTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { toast } = useToast();
  const { t: tFromHook, language } = useTranslation();
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Use useCallback for t function to avoid useMemo issues
  const t = useCallback((key, options) => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:177',message:'t function called',data:{key,hasTFromHook:!!tFromHook,language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
    
    let translation = dashboardTranslations[key]?.[language];
    if (translation) {
      if (options) {
        Object.keys(options).forEach(optionKey => {
          translation = translation.replace(`{${optionKey}}`, options[optionKey]);
        });
      }
      return translation;
    }
    if (tFromHook && typeof tFromHook === 'function') {
      return tFromHook(key, options);
    }
    return key; // Fallback if tFromHook is not available
  }, [language, tFromHook]);

  const loadDashboardData = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:209',message:'loadDashboardData started',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    setLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:213',message:'User.me() result',data:{hasUser:!!currentUser,userId:currentUser?.id,userEmail:currentUser?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }
      setUser(currentUser);
      
      // Use user_id for all queries
      const userFilter = { user_id: currentUser.id };
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:220',message:'userFilter created',data:{userFilter,userId:currentUser.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      const now = new Date();

      // Helper to filter with error handling
      const filterWithFallback = async (Entity, filter) => {
        const entityName = Entity?.name || Entity?.tableName || 'unknown';
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:225',message:'filterWithFallback called',data:{entityName,filter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        try {
          const result = await Entity.filter(filter);
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:228',message:'filterWithFallback success',data:{entityName,resultLength:result?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          return result;
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:230',message:'filterWithFallback error',data:{entityName,errorCode:error?.code,errorMessage:error?.message,errorHint:error?.hint,errorDetails:error?.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error(`Error filtering ${entityName}:`, error);
          return [];
        }
      };

      let [
        allIncomes,
        allMonthlyCosts,
        allDebts,
        allPayments,
        pots,
        activeStrategies,
        allTransactions,
      ] = await Promise.all([
        filterWithFallback(Income, userFilter),
        filterWithFallback(MonthlyCost, userFilter),
        filterWithFallback(Debt, userFilter),
        filterWithFallback(DebtPayment, userFilter),
        filterWithFallback(Pot, userFilter),
        filterWithFallback(DebtStrategy, userFilter),
        filterWithFallback(Transaction, userFilter),
      ]);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:250',message:'all queries completed',data:{incomesLength:allIncomes?.length,costsLength:allMonthlyCosts?.length,debtsLength:allDebts?.length,paymentsLength:allPayments?.length,potsLength:pots?.length,strategiesLength:activeStrategies?.length,transactionsLength:allTransactions?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Sort payments by date descending (with null safety)
      if (Array.isArray(allPayments)) {
        allPayments.sort((a, b) => {
          const dateA = a?.payment_date || a?.created_at;
          const dateB = b?.payment_date || b?.created_at;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB) - new Date(dateA);
        });
      } else {
        allPayments = [];
      }

      // Sort transactions by date descending and limit to 200 (with null safety)
      if (Array.isArray(allTransactions)) {
        allTransactions.sort((a, b) => {
          const dateA = a?.date || a?.created_at;
          const dateB = b?.date || b?.created_at;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return new Date(dateB) - new Date(dateA);
        });
        allTransactions = allTransactions.slice(0, 200);
      } else {
        allTransactions = [];
      }

      const incomeData = incomeService.processIncomeData(allIncomes, now);
      const monthlyCostsResult = monthlyCostService.processMonthlyCostsData(allMonthlyCosts);
      
      const monthStart = getStartOfMonth(now);
      const monthEnd = getEndOfMonth(now);
      const paidThisMonth = (allPayments || [])
        .filter(p => {
          if (!p?.payment_date) return false;
          try {
            const pDate = new Date(p.payment_date);
            return !isNaN(pDate.getTime()) && pDate >= monthStart && pDate <= monthEnd;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);

      const activeDebtPaymentsResult = debtService.getActiveArrangementPayments(allDebts);

      const totalIncome = Number(incomeData?.total) || 0;
      const fixedIncomeForBreakdown = Number(incomeData?.fixed) || 0;
      const totalFixedCosts = Number(monthlyCostsResult?.total) || 0;
      const activeDebtPaymentsSum = Number(activeDebtPaymentsResult?.total) || 0;

      const remainingDebts = (allDebts || []).filter(d => d?.status !== 'afbetaald');
      const remainingDebt = remainingDebts.reduce((sum, d) => sum + ((Number(d?.amount) || 0) - (Number(d?.amount_paid) || 0)), 0);

      const totalPaidAllTime = (allPayments || []).reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
      const totalOriginalDebt = (allDebts || []).reduce((sum, d) => sum + (Number(d?.amount) || 0), 0);
      
      let progressPercentage = 0;
      if (totalOriginalDebt > 0) {
          const rawPercentage = (totalPaidAllTime / totalOriginalDebt) * 100;
          progressPercentage = isNaN(rawPercentage) ? 0 : rawPercentage;
      }

      // Monthly graph
      const last6Months = Array.from({ length: 6 }, (_, i) => getStartOfMonth(subMonths(now, i))).reverse();
      const paidPerMonthKey = t('dashboard.paidPerMonth');
      const monthlyGraphData = last6Months.map(monthStart => {
        const monthEnd = getEndOfMonth(monthStart);
        const monthlyTotal = (allPayments || [])
          .filter(p => {
            if (!p?.payment_date) return false;
            try {
              const pDate = new Date(p.payment_date);
              return !isNaN(pDate.getTime()) && pDate >= monthStart && pDate <= monthEnd;
            } catch {
              return false;
            }
          })
          .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
        const monthName = new Intl.DateTimeFormat(language || 'nl', { month: 'short' }).format(monthStart);
        return {
          name: monthName,
          [paidPerMonthKey]: monthlyTotal,
        };
      });

      // Weekly graph
      const last12Weeks = Array.from({ length: 12 }, (_, i) => getStartOfWeek(subWeeks(now, i))).reverse();
      const weeklyGraphData = last12Weeks.map(weekStart => {
        const weekEnd = getEndOfWeek(weekStart);
        const weekNumber = getWeekNumber(weekStart);
        const weeklyTotal = (allPayments || [])
          .filter(p => {
            if (!p?.payment_date) return false;
            try {
              const pDate = new Date(p.payment_date);
              return !isNaN(pDate.getTime()) && pDate >= weekStart && pDate <= weekEnd;
            } catch {
              return false;
            }
          })
          .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0);
        return {
          name: `Wk ${weekNumber}`,
          [paidPerMonthKey]: weeklyTotal,
        };
      });

      const avgMonthlyPayment = monthlyGraphData.reduce((sum, data) => sum + (data[paidPerMonthKey] || 0), 0) / (monthlyGraphData.filter(d => d[paidPerMonthKey] > 0).length || 1);
      const monthsUntilFree = avgMonthlyPayment > 0 && remainingDebt > 0 ? Math.ceil(remainingDebt / avgMonthlyPayment) : 0;

      const totalPotjesBudget = (pots || []).reduce((sum, p) => sum + (Number(p?.monthly_budget) || 0), 0);
      const freeToSpend = Math.max(0, fixedIncomeForBreakdown - totalFixedCosts - activeDebtPaymentsSum - totalPotjesBudget);
      const newBreakdownData = [];
      if (totalFixedCosts > 0) newBreakdownData.push({ name: t('financialBreakdown.fixedCosts'), value: totalFixedCosts });
      if (activeDebtPaymentsSum > 0) newBreakdownData.push({ name: t('financialBreakdown.paymentPlans'), value: activeDebtPaymentsSum });
      if (totalPotjesBudget > 0) newBreakdownData.push({ name: t('financialBreakdown.pots'), value: totalPotjesBudget });
      if (freeToSpend > 0) newBreakdownData.push({ name: t('financialBreakdown.freeToSpend'), value: freeToSpend });

      const activeStrategy = activeStrategies.length > 0 ? activeStrategies[0] : null;

      let nextPayment = null;
      let nextCost = null;
      const allMonthlyCostsActive = monthlyCostsResult?.items;

      if (allMonthlyCostsActive && allMonthlyCostsActive.length > 0) {
          const today = new Date();
          let upcomingCosts = [];

          allMonthlyCostsActive.forEach(cost => {
              const paymentDay = cost.payment_date;
              if (!paymentDay) return;

              let nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);

              if (nextPaymentDate < today) {
                  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              }
              
              upcomingCosts.push({
                  ...cost,
                  next_due_date: nextPaymentDate
              });
          });

          upcomingCosts.sort((a, b) => {
            if (!a?.next_due_date || !b?.next_due_date) return 0;
            try {
              return a.next_due_date.getTime() - b.next_due_date.getTime();
            } catch {
              return 0;
            }
          });
          
          const nextUpcomingCostItem = upcomingCosts[0];

          if (nextUpcomingCostItem) {
              nextCost = {
                  type: 'fixed_cost',
                  name: nextUpcomingCostItem.name,
                  amount: Number(nextUpcomingCostItem.amount) || 0,
                  date: nextUpcomingCostItem.next_due_date.toISOString().split('T')[0],
              };
          }
      }

      const startOfCurrentMonth = getStartOfMonth(now);
      const needsCheckIn = (allMonthlyCosts || []).some(cost => {
          if (!cost?.is_active) return false;

          const paymentDay = cost?.payment_date;
          if (!paymentDay) return false;

          try {
            let dueDateForCurrentMonth = new Date(now.getFullYear(), now.getMonth(), paymentDay);
            if (isNaN(dueDateForCurrentMonth.getTime())) return false;

            if (dueDateForCurrentMonth <= now) {
                const lastCheckedInDate = cost?.last_checked_in_date ? new Date(cost.last_checked_in_date) : null;
                if (!lastCheckedInDate || isNaN(lastCheckedInDate.getTime()) || lastCheckedInDate < startOfCurrentMonth) {
                    return true;
                }
            }
          } catch {
            return false;
          }
          return false;
      });

      setDashboardData(prev => ({
        ...prev,
        userName: currentUser.voornaam || t('common.user'),
        totalIncome: totalIncome,
        totalExpenses: totalFixedCosts,
        totalPaidThisMonth: paidThisMonth,
        remainingDebt: remainingDebt,
        totalPaidAllTime: totalPaidAllTime,
        progressPercentage: progressPercentage,
        monthlyGraphData: monthlyGraphData,
        weeklyGraphData: weeklyGraphData,
        monthsUntilDebtFree: monthsUntilFree,
        monthlyPaymentRate: avgMonthlyPayment,
        breakdownData: newBreakdownData,
        nextPayment: nextPayment,
        nextCost: nextCost,
        debts: allDebts,
        pots: pots,
        fixedCosts: monthlyCostsResult?.items || [],
        activeDebtPaymentsSum: activeDebtPaymentsSum,
        totalPotjesBudget: totalPotjesBudget,
        activeStrategy: activeStrategy,
        showCheckIn: needsCheckIn,
        allIncomes: allIncomes,
        allMonthlyCosts: allMonthlyCosts,
        allTransactions: allTransactions,
        allPayments: allPayments,
      }));

    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:500',message:'loadDashboardData error',data:{errorMessage:err?.message,errorStack:err?.stack,errorName:err?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error("Failed to load dashboard data:", err);
      setError(err);
      toast({ title: t('common.error'), description: t('dashboard.errorLoading'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [t, toast, language]);

  const loadGamificationData = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:495',message:'loadGamificationData called',data:{hasUserId:!!user?.id,userId:user?.id,language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!user?.id) return;
    
    try {
      const [levelData, badges, motivation, weekGoal] = await Promise.all([
        gamificationService.getUserLevel(user.id),
        gamificationService.getUserBadges(user.id),
        gamificationService.getDailyMotivation(language || 'nl'),
        gamificationService.getWeekGoal(user.id),
      ]);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:504',message:'gamification data loaded',data:{hasLevelData:!!levelData,hasBadges:!!badges,hasMotivation:!!motivation,hasWeekGoal:!!weekGoal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      setGamificationData({
        level: levelData?.level || 1,
        currentXP: levelData?.current_xp || 0,
        totalXP: levelData?.xp_to_next_level || 100,
        badges: (badges || []).map(b => b?.badge_type).filter(Boolean),
        dailyMotivation: motivation?.quote || "",
        weekGoalPercentage: weekGoal?.percentage || 0,
      });
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:515',message:'gamification error',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error("Error loading gamification data:", error);
      // Don't throw - gamification data is not critical
    }
  }, [user?.id, language]);

  // All useEffect hooks must come after all other hooks (useState, useMemo, useCallback)
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:160',message:'Before useToast hook',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  }, []);
  // #endregion
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:165',message:'After useToast, before useTranslation',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  }, []);
  // #endregion
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/0a454eb1-d3d1-4c43-8c8e-e087d82e49ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.jsx:172',message:'After useTranslation hook',data:{hasTFromHook:!!tFromHook,language},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
  }, [tFromHook, language]);
  // #endregion

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (user?.id) {
      loadGamificationData();
    }
  }, [user?.id, loadGamificationData]);

  // Prepare data for components - useMemo hooks must be before early returns
  const monthlyChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(new Date(), 5 - i);
      const monthEnd = getEndOfMonth(monthDate);
      const monthStart = getStartOfMonth(monthDate);

      const monthlyTotal = (dashboardData.allPayments || [])
        .filter(p => {
          const dateStr = p?.payment_date || p?.created_at;
          if (!dateStr) return false;
          try {
            const pDate = new Date(dateStr);
            return !isNaN(pDate.getTime()) && pDate >= monthStart && pDate <= monthEnd;
          } catch {
            return false;
          }
        })
        .reduce((sum, p) => sum + (Number(p?.amount) || 0), 0) || 0;

      return {
        month: new Intl.DateTimeFormat("nl-NL", { month: "short" }).format(monthDate),
        amount: monthlyTotal,
      };
    });
    return last6Months;
  }, [dashboardData.allPayments]);

  const upcomingPaymentsData = useMemo(() => {
    const payments = [];
    const nextCost = dashboardData.nextCost;
    const nextPayment = dashboardData.nextPayment;
    if (nextCost) {
      payments.push({
        type: "fixed_cost",
        name: nextCost.name,
        amount: nextCost.amount,
        date: nextCost.date,
      });
    }
    if (nextPayment) {
      payments.push({
        type: "debt",
        name: nextPayment.name,
        amount: nextPayment.amount,
        date: nextPayment.date,
      });
    }
    return payments;
  }, [dashboardData.nextCost, dashboardData.nextPayment]);

  const financialBreakdownData = useMemo(() => {
    return {
      totalIncome: dashboardData.totalIncome || 0,
      fixedCosts: dashboardData.totalExpenses || 0,
      paymentPlans: dashboardData.activeDebtPaymentsSum || 0,
      pots: dashboardData.totalPotjesBudget || 0,
    };
  }, [dashboardData.totalIncome, dashboardData.totalExpenses, dashboardData.activeDebtPaymentsSum, dashboardData.totalPotjesBudget]);

  const today = new Date();
  const formattedDate = (() => {
    try {
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return new Intl.DateTimeFormat(language || 'nl', options).format(today);
    } catch (e) {
      return today.toLocaleDateString();
    }
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] p-4">
        <div className="text-center p-8 md:p-12 bg-white dark:bg-[#1a2c26] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] max-w-sm w-full">
          <XCircle className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1F2937] dark:text-white">{t('common.error')}</h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mt-2">{t('dashboard.errorLoading')}</p>
          <Button onClick={loadDashboardData} className="mt-4 bg-primary hover:bg-primary-dark text-white">Probeer opnieuw</Button>
        </div>
      </div>
    );
  }

  const {
    userName,
    totalIncome,
    totalExpenses,
    totalPaidThisMonth,
    remainingDebt,
    totalPaidAllTime,
    progressPercentage,
    monthlyGraphData,
    weeklyGraphData,
    monthsUntilDebtFree,
    monthlyPaymentRate,
    breakdownData,
    nextPayment,
    nextCost,
    showCheckIn,
    allIncomes = [],
    allMonthlyCosts = [],
    debts = [],
    pots = [],
    allTransactions = [],
    allPayments = [],
  } = dashboardData;
  
  const currentMonthFormatted = (() => {
    try {
      return new Intl.DateTimeFormat(language || 'nl', { month: 'long', year: 'numeric' }).format(today);
    } catch (e) {
      return '';
    }
  })();

  return (
    <div className="flex-grow max-w-[1600px] mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
      {/* Left Column */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
        {/* Welcome Card */}
        <WelcomeCard
          user={user}
          level={gamificationData.level}
          currentXP={gamificationData.currentXP}
          totalXP={gamificationData.totalXP}
          badges={gamificationData.badges}
        />

        {/* Stat Cards - Always show */}
        <StatCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalPaidThisMonth={totalPaidThisMonth}
          currentMonth={new Date()}
        />

        {/* Debt Journey Chart - Always show */}
        <DebtJourneyChart
          monthlyData={monthlyChartData}
          totalPaid={totalPaidAllTime}
          progressPercentage={progressPercentage}
        />
                  </div>

      {/* Right Column */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
        {/* Total Remaining Debt Card - Always show */}
        <div className="bg-konsensi-dark dark:bg-card-bg dark:border dark:border-border-main text-white rounded-[2rem] p-6 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-white">description</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 dark:bg-card-elevated rounded-full border border-transparent dark:border-border-accent">
                  <span className="material-symbols-outlined text-primary dark:text-konsensi-primary">account_balance_wallet</span>
                </div>
                <p className="text-primary dark:text-konsensi-primary font-bold text-sm">Totale Restschuld</p>
              </div>
              {/* Eye icon to toggle visibility */}
              <button
                onClick={() => setDebtVisible(!debtVisible)}
                className="p-2 hover:bg-white/10 dark:hover:bg-card-elevated rounded-full transition-colors"
                aria-label={debtVisible ? "Verberg bedrag" : "Toon bedrag"}
              >
                <span className="material-symbols-outlined text-white dark:text-text-secondary text-xl">
                  {debtVisible ? "visibility" : "visibility_off"}
                </span>
              </button>
            </div>
            <p className="font-header text-4xl font-extrabold mb-2">
              {debtVisible ? formatCurrency(remainingDebt || 0, { decimals: 0 }) : "€ •••••"}
            </p>
            <p className="text-sm text-white/70 dark:text-text-secondary">Geen paniek, we komen er samen uit.</p>
          </div>
        </div>

        {/* Financial Overview - Always show */}
        <FinancialOverview {...financialBreakdownData} />

        {/* Gamification Stats - Always show */}
        {(() => {
          // Calculate days on track based on payment consistency
          const daysOnTrack = (() => {
            if (!allPayments || allPayments.length === 0) return 7; // Default to 7 if no data
            // Simple calculation: count days since first payment
            const sortedPayments = [...allPayments].sort((a, b) => {
              const dateA = a?.payment_date ? new Date(a.payment_date) : new Date(0);
              const dateB = b?.payment_date ? new Date(b.payment_date) : new Date(0);
              return dateA - dateB;
            });
            const firstPayment = sortedPayments[0];
            if (!firstPayment?.payment_date) return 7; // Default to 7 if no valid payment
            try {
              const firstDate = new Date(firstPayment.payment_date);
              if (isNaN(firstDate.getTime())) return 7;
              const daysDiff = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));
              return Math.max(1, Math.min(daysDiff, 30)); // Cap at 30 days, minimum 1
            } catch {
              return 7;
            }
          })();

          // Calculate savings pot amount from pots
          const calculatedAmount = (pots || []).reduce((sum, pot) => {
            return sum + (Number(pot?.current_amount) || 0);
          }, 0);
          const savingsPotAmount = calculatedAmount > 0 ? calculatedAmount : 12.5; // Default to 12.5 if no pots

          return <GamificationStats daysOnTrack={daysOnTrack} savingsPotAmount={savingsPotAmount} />;
        })()}

        {/* Upcoming Payments - Always show */}
        <UpcomingPayments payments={upcomingPaymentsData} />

        {/* Dashboard Alerts - Always show */}
        <DashboardAlerts
          alerts={[
            {
              type: 'warning',
              icon: 'warning',
              title: 'Uitgaven: €45 over budget',
              action: 'Bekijk details',
              link: '/budget'
            },
            {
              type: 'info',
              icon: 'lightbulb',
              title: 'Mindset: Lees nieuwe post',
              subtitle: '5 min leestijd',
              link: '/mindset'
            }
          ]}
        />
                        </div>

      {/* Footer */}
      <div className="lg:col-span-12">
        <DashboardFooter
          dailyMotivation={gamificationData.dailyMotivation}
          weekGoalPercentage={gamificationData.weekGoalPercentage}
          onNextAction={() => window.location.href = createPageUrl("VasteLastenCheck")}
        />
      </div>

      {/* Achievements Modal */}
      <AchievementsModal 
        isOpen={showAchievementsModal} 
        onClose={() => setShowAchievementsModal(false)} 
      />
    </div>
  );
}