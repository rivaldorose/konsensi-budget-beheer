import React, { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@/api/entities";
import { incomeService, debtService, monthlyCostService } from '@/components/services';
import { Income } from "@/api/entities";
import { Debt } from "@/api/entities";
import { DebtPayment } from "@/api/entities";
import { Pot } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { DebtStrategy } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { motion } from "framer-motion";
import FinancialBreakdown from "../components/dashboard/FinancialBreakdown";
import { formatCurrency } from "@/components/utils/formatters";
import {
  DollarSign,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  XCircle,
  Clock,
  Euro,
  Tag,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import StartgidsWidget from "../components/dashboard/StartgidsWidget";
import GamificationWidget from "@/components/gamification/GamificationWidget";
import AchievementsModal from "@/components/gamification/AchievementsModal";


import PersonalizedAdviceWidget from "@/components/dashboard/PersonalizedAdviceWidget";
import { Transaction } from "@/api/entities";

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
  const [isDebtVisible, setIsDebtVisible] = useState(true);
  const [graphView, setGraphView] = useState('month');
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

  const t = useCallback((key, options) => {
    let translation = dashboardTranslations[key]?.[language];
    if (translation) {
      if (options) {
        Object.keys(options).forEach(optionKey => {
          translation = translation.replace(`{${optionKey}}`, options[optionKey]);
        });
      }
      return translation;
    }
    return tFromHook(key, options);
  }, [language, tFromHook]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await User.me();
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }
      setUser(currentUser);
      
      // Try user_id first, fallback to created_by
      const userFilter = { user_id: currentUser.id };
      const userFilterFallback = { created_by: currentUser.id };

      const now = new Date();

      // Helper to filter with fallback
      const filterWithFallback = async (Entity, filter) => {
        try {
          return await Entity.filter(filter);
        } catch {
          try {
            return await Entity.filter(userFilterFallback);
          } catch {
            return [];
          }
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
        filterWithFallback(DebtStrategy, { ...userFilter, is_active: true }),
        filterWithFallback(Transaction, userFilter),
      ]);

      // Sort payments by date descending
      allPayments.sort((a, b) => {
        const dateA = new Date(a.payment_date || a.created_at);
        const dateB = new Date(b.payment_date || b.created_at);
        return dateB - dateA;
      });

      // Sort transactions by date descending and limit to 200
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at);
        const dateB = new Date(b.date || b.created_at);
        return dateB - dateA;
      });
      allTransactions = allTransactions.slice(0, 200);

      const incomeData = incomeService.processIncomeData(allIncomes, now);
      const monthlyCostsResult = monthlyCostService.processMonthlyCostsData(allMonthlyCosts);
      
      const monthStart = getStartOfMonth(now);
      const monthEnd = getEndOfMonth(now);
      const paidThisMonth = allPayments
        .filter(p => {
          const pDate = new Date(p.payment_date);
          return pDate >= monthStart && pDate <= monthEnd;
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const activeDebtPaymentsResult = debtService.getActiveArrangementPayments(allDebts);

      const totalIncome = Number(incomeData?.total) || 0;
      const fixedIncomeForBreakdown = Number(incomeData?.fixed) || 0;
      const totalFixedCosts = Number(monthlyCostsResult?.total) || 0;
      const activeDebtPaymentsSum = Number(activeDebtPaymentsResult?.total) || 0;

      const remainingDebts = allDebts.filter(d => d.status !== 'afbetaald');
      const remainingDebt = remainingDebts.reduce((sum, d) => sum + ((Number(d.amount) || 0) - (Number(d.amount_paid) || 0)), 0);

      const totalPaidAllTime = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const totalOriginalDebt = allDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      
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
        const monthlyTotal = allPayments
          .filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate >= monthStart && pDate <= monthEnd;
          })
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
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
        const weeklyTotal = allPayments
          .filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate >= weekStart && pDate <= weekEnd;
          })
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
          name: `Wk ${weekNumber}`,
          [paidPerMonthKey]: weeklyTotal,
        };
      });

      const avgMonthlyPayment = monthlyGraphData.reduce((sum, data) => sum + (data[paidPerMonthKey] || 0), 0) / (monthlyGraphData.filter(d => d[paidPerMonthKey] > 0).length || 1);
      const monthsUntilFree = avgMonthlyPayment > 0 && remainingDebt > 0 ? Math.ceil(remainingDebt / avgMonthlyPayment) : 0;

      const totalPotjesBudget = pots.reduce((sum, p) => sum + (Number(p.monthly_budget) || 0), 0);
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

          upcomingCosts.sort((a, b) => a.next_due_date.getTime() - b.next_due_date.getTime());
          
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
      const needsCheckIn = allMonthlyCosts.some(cost => {
          if (!cost.is_active) return false;

          const paymentDay = cost.payment_date;
          if (!paymentDay) return false;

          let dueDateForCurrentMonth = new Date(now.getFullYear(), now.getMonth(), paymentDay);

          if (dueDateForCurrentMonth <= now) {
              const lastCheckedInDate = cost.last_checked_in_date ? new Date(cost.last_checked_in_date) : null;
              if (!lastCheckedInDate || lastCheckedInDate < startOfCurrentMonth) {
                  return true;
              }
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
      }));

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err);
      toast({ title: t('common.error'), description: t('dashboard.errorLoading'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [t, toast, language]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-300"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-sm w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">{t('common.error')}</h2>
          <p className="text-gray-600 mt-2">{t('dashboard.errorLoading')}</p>
          <Button onClick={loadDashboardData} className="mt-4">Try Again</Button>
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
  } = dashboardData;

  const chartData = graphView === 'week' ? weeklyGraphData : monthlyGraphData;
  
  const currentMonthFormatted = (() => {
    try {
      return new Intl.DateTimeFormat(language || 'nl', { month: 'long', year: 'numeric' }).format(today);
    } catch (e) {
      return '';
    }
  })();

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
              {t('dashboard.welcomeBack', { name: userName })} 👋
            </h1>
            <p className="text-sm md:text-base text-gray-500 capitalize">{formattedDate}</p>
          </div>
        </div>
      </div>

      {user && !user.onboarding_completed && 
       allIncomes.length === 0 && allMonthlyCosts.length === 0 && debts.length === 0 && pots.length === 0 && (
        <StartgidsWidget 
          allIncomes={allIncomes}
          allMonthlyCosts={allMonthlyCosts}
          allDebts={debts}
          allPots={pots}
          user={user}
          onRefresh={loadDashboardData}
        />
      )}

      <GamificationWidget compact={false} onViewAll={() => setShowAchievementsModal(true)} />





      {/* Gepersonaliseerd Advies Widget */}
      <PersonalizedAdviceWidget 
        financialData={{
          totalIncome,
          totalFixedCosts: totalExpenses,
          totalDebt: remainingDebt,
          debtPaidThisMonth: totalPaidThisMonth,
          monthlyDebtPayment: dashboardData.activeDebtPaymentsSum,
          pots: pots,
          transactions: allTransactions.filter(t => {
            const tDate = new Date(t.date);
            const monthStart = getStartOfMonth(new Date());
            return tDate >= monthStart;
          }),
          previousMonthTransactions: allTransactions.filter(t => {
            const tDate = new Date(t.date);
            const prevMonthStart = getStartOfMonth(subMonths(new Date(), 1));
            const prevMonthEnd = getEndOfMonth(subMonths(new Date(), 1));
            return tDate >= prevMonthStart && tDate <= prevMonthEnd;
          }),
          monthlyCosts: allMonthlyCosts,
          debts: debts,
        }}
        maxItems={3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card data-tour="income-summary" className="bg-white shadow-sm rounded-xl border-none">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-blue-100 flex items-center justify-center rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">{currentMonthFormatted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mt-2">{t('dashboard.totalIncome')}</p>
                  <p className="font-bold text-2xl text-gray-900">{formatCurrency(totalIncome || 0, { decimals: 0 })}</p>
                </div>
              </CardContent>
            </Card>
            <Card data-tour="expenses-summary" className="bg-white shadow-sm rounded-xl border-none">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-gray-100 flex items-center justify-center rounded-lg">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-500">{currentMonthFormatted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mt-2">{t('dashboard.expenses')}</p>
                  <p className="font-bold text-2xl text-gray-900">{formatCurrency(totalExpenses || 0, { decimals: 0 })}</p>
                </div>
              </CardContent>
            </Card>
            <Card data-tour="debt-paid" className="bg-white shadow-sm rounded-xl border-2 border-emerald-300">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-emerald-100 flex items-center justify-center rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-none capitalize">
                    {t('dashboard.proud')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mt-2 capitalize">{t('dashboard.paidOff')}</p>
                  <p className="font-bold text-2xl text-gray-900">{formatCurrency(totalPaidThisMonth || 0, { decimals: 0 })}</p>
                  <p className="text-xs text-gray-500 capitalize">{t('dashboard.thisMonth')}</p>
                </div>
              </CardContent>
            </Card>
            <Card data-tour="total-debt" className="bg-white shadow-sm rounded-xl border-none">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 bg-gray-100 flex items-center justify-center rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsDebtVisible(!isDebtVisible)}>
                    {isDebtVisible ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mt-2 capitalize">{t('dashboard.totalDebt')}</p>
                  {isDebtVisible ? (
                    <p className="font-bold text-2xl text-gray-900">{formatCurrency(remainingDebt || 0, { decimals: 0 })}</p>
                  ) : (
                    <p className="font-bold text-2xl text-gray-900">€ ****</p>
                  )}
                  <p className="text-xs text-gray-500">{t('dashboard.weWillGetThere')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {showCheckIn && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = createPageUrl('VasteLastenCheck')}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">⏰</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-orange-900 mb-1">
                        {t('dashboard.checkInReminder')}
                      </h3>
                      <p className="text-orange-700 text-sm">
                        {t('dashboard.checkInReminderText')}
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Card className="bg-white shadow-sm rounded-xl border-none col-span-1 md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold capitalize">{t('dashboard.debtJourney')}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 capitalize">{t('dashboard.yourProgress')}</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={graphView === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGraphView('month')}
                    className={`text-xs ${graphView === 'month' ? 'bg-green-500 text-white shadow-sm hover:bg-green-600' : ''}`}
                  >
                    Maand
                  </Button>
                  <Button
                    variant={graphView === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGraphView('week')}
                    className={`text-xs ${graphView === 'week' ? 'bg-green-500 text-white shadow-sm hover:bg-green-600' : ''}`}
                  >
                    Week
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-800 capitalize">{t('dashboard.totalPaidAllTime')}</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidAllTime || 0)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-800 capitalize">{t('dashboard.progress')}</p>
                    <p className="text-2xl font-bold text-purple-600">{(Number(progressPercentage) || 0).toFixed(0)}%</p>
                  </div>
                </div>
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value || 0, { decimals: 0 })} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#e5e7eb' }} formatter={(value) => formatCurrency(value || 0)} />
                      <Area type="monotone" dataKey={t('dashboard.paidPerMonth')} stroke="#16a34a" fillOpacity={1} fill="url(#colorUv)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {monthsUntilDebtFree > 0 && (
                  <div className="bg-green-500 text-white rounded-lg p-4 text-center">
                    <p className="font-bold capitalize">{t('dashboard.onTheWayToFreedom')}</p>
                    <p className="text-sm">{t('dashboard.monthsUntilFree', { amount: formatCurrency(monthlyPaymentRate || 0, { decimals: 0 }), months: monthsUntilDebtFree })}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <FinancialBreakdown
            breakdownData={breakdownData}
            totalIncome={totalIncome}
            t={t}
          />

          <Card className="bg-white shadow-sm rounded-xl border-none">
            <CardHeader>
              <CardTitle className="text-base font-medium capitalize flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{t('dashboard.upcomingPayments')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(nextPayment || nextCost) ? (
                <>
                  {nextPayment && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded-full">
                          <Tag className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm capitalize">{t('dashboard.nextDebtPayment')}</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const date = new Date(nextPayment.date);
                                if (isNaN(date.getTime())) return 'Onbekend';
                                return new Intl.DateTimeFormat(language || 'nl', { day: 'numeric', month: 'long' }).format(date);
                              } catch (e) {
                                return 'Onbekend';
                              }
                            })()} - {nextPayment.name}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-blue-600">{formatCurrency(nextPayment.amount || 0)}</p>
                    </div>
                  )}
                  {nextCost && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 flex items-center justify-center rounded-full">
                          <Euro className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm capitalize">{t('dashboard.nextFixedCost')}</p>
                          <p className="text-xs text-gray-500">
                            {(() => {
                              try {
                                const date = new Date(nextCost.date);
                                if (isNaN(date.getTime())) return 'Onbekend';
                                return new Intl.DateTimeFormat(language || 'nl', { day: 'numeric', month: 'long' }).format(date);
                              } catch (e) {
                                return 'Onbekend';
                              }
                            })()} - {nextCost.name}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-orange-600">{formatCurrency(nextCost.amount || 0)}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">{t('dashboard.noUpcomingPayments')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AchievementsModal 
        isOpen={showAchievementsModal} 
        onClose={() => setShowAchievementsModal(false)} 
      />
      </motion.div>
  );
}