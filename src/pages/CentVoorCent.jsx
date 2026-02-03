import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, MonthlyCost, Pot, Debt, DebtPayment } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { gamificationService } from "@/services/gamificationService";

// ALLE SLIMME TIPS - Er worden er 3 per maand getoond (roteert automatisch)
const ALLE_TIPS = [
  { icon: 'lightbulb', title: 'De 50/30/20 Regel', text: 'Besteed 50% aan vaste lasten, 30% aan leuke dingen, en spaar 20% van je inkomen.' },
  { icon: 'shopping_cart', title: 'Boodschappen', text: 'Maak een boodschappenlijstje en ga nooit met honger naar de supermarkt.' },
  { icon: 'receipt_long', title: 'Abonnementen', text: 'Check maandelijks je abonnementen. Vaak betaal je voor dingen die je niet gebruikt.' },
  { icon: 'savings', title: 'Noodfonds', text: 'Probeer minimaal 3 maanden aan vaste lasten als buffer op te bouwen.' },
  { icon: 'compare_arrows', title: 'Vergelijken loont', text: 'Vergelijk jaarlijks je energie, verzekeringen en internet. Bespaar honderden euros!' },
  { icon: 'event', title: 'Automatisch sparen', text: 'Zet een automatische overschrijving naar je spaarrekening op de dag dat je salaris binnenkomt.' },
  { icon: 'local_offer', title: 'Cashback', text: 'Gebruik cashback-apps en acties bij je dagelijkse boodschappen. Het telt allemaal op!' },
  { icon: 'restaurant', title: 'Minder uit eten', text: 'Kook vaker thuis. Gemiddeld bespaar je zo €200-300 per maand.' },
  { icon: 'water_drop', title: 'Energie besparen', text: 'Korter douchen en verwarming een graad lager kan tientallen euros per maand schelen.' },
  { icon: 'directions_bus', title: 'Vervoerskosten', text: 'Overweeg de fiets of OV in plaats van de auto voor korte ritten.' },
  { icon: 'loyalty', title: 'Aanbiedingen', text: 'Plan je boodschappen rond aanbiedingen. Gebruik apps zoals Too Good To Go.' },
  { icon: 'sell', title: 'Verkoop ongebruikte spullen', text: 'Heb je spullen die je niet meer gebruikt? Verkoop ze op Marktplaats of Vinted.' },
];

// Get 3 tips that rotate based on month
const getMonthlyTips = (month, year) => {
  const seed = month + year * 12;
  const shuffled = [...ALLE_TIPS].sort((a, b) => {
    const hashA = ((seed * 31 + ALLE_TIPS.indexOf(a)) * 17) % 100;
    const hashB = ((seed * 31 + ALLE_TIPS.indexOf(b)) * 17) % 100;
    return hashA - hashB;
  });
  return shuffled.slice(0, 3);
};

export default function CentVoorCent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Check URL params from archive navigation
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    if (yearParam && monthParam !== null) {
      return new Date(parseInt(yearParam), parseInt(monthParam), 1);
    }
    // Default to previous month (the month we're summarizing)
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  });
  const [monthlyData, setMonthlyData] = useState({
    totalIncome: 0,
    regularIncome: 0,
    extraIncome: 0,
    totalExpenses: 0,
    fixedCosts: 0,
    potsBudget: 0,
    remaining: 0,
    savingsPercentage: 0,
    debtTotal: 0,
    debtPaid: 0,
    debtRemaining: 0,
    previousMonthExpenses: 0
  });
  const [reflection, setReflection] = useState({
    goodThings: [],
    attentionPoints: []
  });
  const [advice, setAdvice] = useState([]);
  const [summaryStatus, setSummaryStatus] = useState({
    isNewSummaryAvailable: false,
    hasViewedThisMonth: false,
    summaryMonth: null
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    loadData();
  }, [selectedMonth]);

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

  // Check if a new monthly summary is available (only on 1st-7th of the month)
  const checkSummaryAvailability = async (userId) => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Summary is only "new" in the first 7 days of the month
    const isFirstWeekOfMonth = currentDay <= 7;

    // The summary month is the previous month
    const summaryMonth = new Date(currentYear, currentMonth - 1, 1);
    const summaryMonthKey = `${summaryMonth.getFullYear()}-${String(summaryMonth.getMonth() + 1).padStart(2, '0')}`;

    // Check if user has already viewed this month's summary
    const viewedKey = `cent_voor_cent_viewed_${userId}_${summaryMonthKey}`;
    const hasViewed = localStorage.getItem(viewedKey) === 'true';

    return {
      isNewSummaryAvailable: isFirstWeekOfMonth && !hasViewed,
      hasViewedThisMonth: hasViewed,
      summaryMonth: summaryMonth,
      summaryMonthKey: summaryMonthKey,
      isFirstWeekOfMonth: isFirstWeekOfMonth
    };
  };

  // Mark summary as viewed and award XP
  const markSummaryAsViewed = async (userId, summaryMonthKey) => {
    const viewedKey = `cent_voor_cent_viewed_${userId}_${summaryMonthKey}`;

    // Only award XP if this is the first time viewing this month's summary
    if (localStorage.getItem(viewedKey) !== 'true') {
      localStorage.setItem(viewedKey, 'true');

      // Award XP for viewing the NEW monthly summary
      try {
        const summaryResult = await gamificationService.recordSummaryView(userId);
        if (summaryResult.xpAwarded) {
          toast({
            title: '📊 Maandoverzicht bekeken!',
            description: `+${summaryResult.xpAmount} XP voor het bekijken van je maandelijkse samenvatting.`
          });
        }
      } catch (xpError) {
        console.error("Error awarding summary XP:", xpError);
      }

      return true;
    }
    return false;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setUser(userData);

      // Check if new summary is available
      const summaryAvailability = await checkSummaryAvailability(userData.id);
      setSummaryStatus(summaryAvailability);

      // Get current month date range
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      // Get previous month for comparison
      const prevMonthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
      const prevMonthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 0);

      // Load income
      const monthlyIncome = userData.monthly_income || 0;
      const regularIncome = monthlyIncome;
      const extraIncome = 0; // Would need to fetch from extra income sources

      // Load fixed costs
      const costs = await MonthlyCost.filter({ user_id: userData.id });
      const totalFixedCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      // Load pots budget
      const pots = await Pot.filter({ user_id: userData.id });
      const totalPotsBudget = pots.reduce((sum, pot) => sum + parseFloat(pot.target_amount || 0), 0);

      // Load debt data
      const debts = await Debt.filter({ user_id: userData.id });
      const debtTotal = debts.reduce((sum, debt) => sum + parseFloat(debt.amount || 0), 0);
      const debtPaidTotal = debts.reduce((sum, debt) => sum + parseFloat(debt.amount_paid || 0), 0);
      const debtRemaining = debtTotal - debtPaidTotal;

      // Load debt payments for this month
      const payments = await DebtPayment.filter({ user_id: userData.id });
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });
      const debtPaidThisMonth = monthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

      // Load payment arrangements for monthly obligations
      const debtsWithArrangements = debts.filter(debt =>
        debt.status === 'betalingsregeling' || debt.status === 'payment_arrangement'
      );
      const monthlyArrangements = debtsWithArrangements.reduce((sum, debt) =>
        sum + parseFloat(debt.monthly_payment || 0), 0
      );

      // Calculate totals
      const totalIncome = regularIncome + extraIncome;
      const totalExpenses = totalFixedCosts + totalPotsBudget + monthlyArrangements;
      const remaining = totalIncome - totalExpenses;
      const savingsPercentage = totalIncome > 0 ? Math.round((remaining / totalIncome) * 100) : 0;

      // Load ACTUAL previous month expenses from debt payments
      const prevMonthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= prevMonthStart && paymentDate <= prevMonthEnd;
      });
      const prevDebtPaidMonth = prevMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const previousMonthExpenses = totalFixedCosts + totalPotsBudget + prevDebtPaidMonth;

      // Format previous month name
      const prevMonthName = new Intl.DateTimeFormat('nl-NL', { month: 'long' }).format(prevMonthStart);

      setMonthlyData({
        totalIncome,
        regularIncome,
        extraIncome,
        totalExpenses,
        fixedCosts: totalFixedCosts,
        potsBudget: totalPotsBudget,
        monthlyArrangements,
        remaining,
        savingsPercentage,
        debtTotal,
        debtPaid: debtPaidThisMonth,
        debtPaidTotal,
        debtRemaining,
        previousMonthExpenses,
        previousMonthName: prevMonthName,
        prevDebtPaidMonth,
        debtsWithArrangements,
        costs
      });

      // Generate dynamic reflection based on ACTUAL data
      const goodThings = [];
      const attentionPoints = [];

      // Only show positive reflections when they are truly positive
      if (remaining > 0 && savingsPercentage >= 20) {
        goodThings.push({ emoji: '🎉', text: `Je hebt ${savingsPercentage}% van je inkomen gespaard. Dat is uitstekend!` });
      } else if (remaining > 0 && savingsPercentage >= 10) {
        goodThings.push({ emoji: '💚', text: `Je hebt ${formatCurrency(remaining)} overgehouden (${savingsPercentage}% van je inkomen).` });
      } else if (remaining > 0 && savingsPercentage > 0) {
        goodThings.push({ emoji: '📊', text: `Je hebt ${formatCurrency(remaining)} overgehouden (${savingsPercentage}%). Probeer richting 10% te werken.` });
      }

      if (debtPaidThisMonth > 0) {
        goodThings.push({ emoji: '💪', text: `Je hebt ${formatCurrency(debtPaidThisMonth)} afgelost op je schulden deze maand.` });
      }
      if (debtsWithArrangements.length > 0) {
        goodThings.push({ emoji: '✅', text: `${debtsWithArrangements.length} actieve betalingsregeling(en) lopen netjes door.` });
      }
      if (totalIncome > 0 && totalFixedCosts > 0 && totalFixedCosts <= totalIncome * 0.5) {
        goodThings.push({ emoji: '🏠', text: `Je vaste lasten zijn ${Math.round((totalFixedCosts / totalIncome) * 100)}% van je inkomen. Dat is gezond.` });
      }

      // Attention points - honest and specific
      if (remaining < 0) {
        attentionPoints.push({ emoji: '🚨', text: `Je uitgaven zijn ${formatCurrency(Math.abs(remaining))} hoger dan je inkomen. Dit is niet houdbaar.` });
      } else if (remaining === 0) {
        attentionPoints.push({ emoji: '⚠️', text: 'Je geeft precies zoveel uit als je verdient. Er is geen ruimte voor onverwachte kosten.' });
      } else if (savingsPercentage < 5 && remaining > 0) {
        attentionPoints.push({ emoji: '💡', text: `Je houdt maar ${savingsPercentage}% over. Probeer minimaal 10% te besparen voor een buffer.` });
      }

      if (debtRemaining > 0 && monthlyArrangements > 0) {
        const monthsToPayoff = Math.ceil(debtRemaining / monthlyArrangements);
        attentionPoints.push({ emoji: '📅', text: `Nog ${formatCurrency(debtRemaining)} schuld open. Bij ${formatCurrency(monthlyArrangements)}/maand duurt het nog ±${monthsToPayoff} maanden.` });
      } else if (debtRemaining > 0 && monthlyArrangements === 0) {
        attentionPoints.push({ emoji: '🚨', text: `Je hebt ${formatCurrency(debtRemaining)} aan openstaande schulden zonder actieve betalingsregeling.` });
      }

      if (totalIncome > 0 && totalFixedCosts > totalIncome * 0.5) {
        attentionPoints.push({ emoji: '📊', text: `Je vaste lasten zijn ${Math.round((totalFixedCosts / totalIncome) * 100)}% van je inkomen. Dat is aan de hoge kant.` });
      }

      // Only show defaults when truly no data
      if (goodThings.length === 0 && totalIncome === 0) {
        goodThings.push({ emoji: '📝', text: 'Voeg je inkomen en uitgaven toe om inzichten te krijgen.' });
      } else if (goodThings.length === 0) {
        goodThings.push({ emoji: '📊', text: 'Deze maand zijn er geen duidelijke positieve punten. Bekijk je aandachtspunten hiernaast.' });
      }
      if (attentionPoints.length === 0 && debtTotal === 0 && remaining > 0) {
        attentionPoints.push({ emoji: '🎯', text: 'Geen schulden en positief saldo. Blijf zo doorgaan!' });
      } else if (attentionPoints.length === 0) {
        attentionPoints.push({ emoji: '✨', text: 'Geen specifieke aandachtspunten deze maand.' });
      }

      setReflection({ goodThings, attentionPoints });

      // Generate PERSONAL advice based on actual financial situation
      const personalAdviceList = [];

      // Advice based on spending vs income
      if (remaining < 0) {
        personalAdviceList.push({
          icon: 'warning',
          title: 'Tekort aanpakken',
          text: `Je geeft ${formatCurrency(Math.abs(remaining))} meer uit dan je verdient. Bekijk je vaste lasten (${formatCurrency(totalFixedCosts)}) en kijk waar je kunt besparen.`,
          type: 'personal'
        });
      } else if (remaining > 0 && debtRemaining > 0 && remaining > 50) {
        personalAdviceList.push({
          icon: 'trending_up',
          title: 'Extra aflossen?',
          text: `Je hebt ${formatCurrency(remaining)} over deze maand. Door ${formatCurrency(Math.min(remaining * 0.5, debtRemaining))} extra af te lossen, ben je sneller schuldenvrij.`,
          type: 'personal'
        });
      }

      // Advice based on debt situation
      if (debtRemaining > 0 && monthlyArrangements > 0) {
        const monthsLeft = Math.ceil(debtRemaining / monthlyArrangements);
        personalAdviceList.push({
          icon: 'calendar_month',
          title: `Nog ${monthsLeft} maanden`,
          text: `Met ${formatCurrency(monthlyArrangements)}/maand aflossing ben je rond ${new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(new Date(new Date().setMonth(new Date().getMonth() + monthsLeft)))} schuldenvrij.`,
          type: 'personal'
        });
      } else if (debtTotal > 0 && monthlyArrangements === 0) {
        personalAdviceList.push({
          icon: 'handshake',
          title: 'Start een betalingsregeling',
          text: `Je hebt ${formatCurrency(debtRemaining)} aan schulden zonder actieve regeling. Ga naar Schulden > Stappenplan om contact op te nemen met je schuldeisers.`,
          type: 'personal'
        });
      }

      // Advice based on fixed costs ratio (only when income > 0)
      if (totalIncome > 0 && totalFixedCosts > totalIncome * 0.6) {
        personalAdviceList.push({
          icon: 'content_cut',
          title: 'Vaste lasten te hoog',
          text: `Je vaste lasten zijn ${Math.round((totalFixedCosts / totalIncome) * 100)}% van je inkomen (max aanbevolen: 50%). Vergelijk je energie- en internetprovider of bekijk je abonnementen.`,
          type: 'personal'
        });
      } else if (totalIncome > 0 && totalFixedCosts > totalIncome * 0.5) {
        personalAdviceList.push({
          icon: 'tune',
          title: 'Vaste lasten optimaliseren',
          text: `Je vaste lasten zijn ${Math.round((totalFixedCosts / totalIncome) * 100)}% van je inkomen. Kleine besparingen op energie of verzekeringen kunnen al helpen.`,
          type: 'personal'
        });
      }

      // Savings advice
      if (savingsPercentage >= 0 && savingsPercentage < 10 && remaining > 0 && debtTotal === 0) {
        personalAdviceList.push({
          icon: 'account_balance',
          title: 'Buffer opbouwen',
          text: `Je spaart nu ${savingsPercentage}%. Een noodfonds van 3 maanden vaste lasten (${formatCurrency(totalFixedCosts * 3)}) beschermt je tegen onverwachte kosten.`,
          type: 'personal'
        });
      }

      // Only show top 3 most relevant pieces of advice
      setAdvice(personalAdviceList.slice(0, 3));

      // Only award XP if this is a NEW monthly summary (first week of month, not yet viewed)
      if (summaryAvailability.isNewSummaryAvailable) {
        await markSummaryAsViewed(userData.id, summaryAvailability.summaryMonthKey);
        // Update status after marking as viewed
        setSummaryStatus(prev => ({
          ...prev,
          isNewSummaryAvailable: false,
          hasViewedThisMonth: true
        }));
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij laden gegevens'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatMonthYear = (date) => {
    return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
  };

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      options.push(date);
    }
    return options;
  };

  const changeMonth = (months) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + months);
    setSelectedMonth(newDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  const expensePercentage = monthlyData.totalIncome > 0 
    ? Math.round((monthlyData.totalExpenses / monthlyData.totalIncome) * 100) 
    : 0;

  const potsPercentage = monthlyData.totalIncome > 0 
    ? Math.round((monthlyData.potsBudget / monthlyData.totalIncome) * 100) 
    : 0;

  const savingsPercentage = monthlyData.totalIncome > 0 
    ? Math.round((monthlyData.remaining / monthlyData.totalIncome) * 100) 
    : 0;

  const expenseDiff = monthlyData.totalExpenses - monthlyData.previousMonthExpenses;

  // Calculate days until next summary
  const getDaysUntilNextSummary = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffTime = nextMonth - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if we should show the "waiting" state
  const showWaitingState = !summaryStatus.isFirstWeekOfMonth && !summaryStatus.hasViewedThisMonth;

  // If we're outside the first week and haven't viewed, show waiting state
  if (showWaitingState && !loading) {
    const daysUntil = getDaysUntilNextSummary();
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased">
        <main className="flex-1 w-full max-w-[800px] mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 md:p-12 shadow-card dark:shadow-dark-card border dark:border-[#2a2a2a] text-center max-w-lg w-full">
            {/* Animated Calendar Icon */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl animate-pulse"></div>
              <div className="relative w-full h-full bg-white dark:bg-[#2a2a2a] rounded-2xl border-2 border-blue-500/30 dark:border-blue-400/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-blue-500 dark:text-blue-400">calendar_month</span>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Nog even geduld...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              Je maandelijkse samenvatting is beschikbaar op de <strong className="text-blue-600 dark:text-blue-400">1e van de maand</strong>.
            </p>

            {/* Countdown */}
            <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-6 mb-6 border dark:border-[#2a2a2a]">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Volgende samenvatting over</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl md:text-5xl font-extrabold text-blue-600 dark:text-blue-400">{daysUntil}</span>
                <span className="text-xl text-gray-600 dark:text-gray-400">{daysUntil === 1 ? 'dag' : 'dagen'}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-left">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">lightbulb</span>
                <div>
                  <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm mb-1">Waarom wachten?</p>
                  <p className="text-amber-700 dark:text-amber-400 text-sm">
                    We verzamelen al je financiële gegevens van deze maand om je een compleet en nuttig overzicht te geven.
                    Je krijgt een melding zodra je samenvatting klaar is!
                  </p>
                </div>
              </div>
            </div>

            {/* XP Teaser */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined text-purple-500 dark:text-purple-400">stars</span>
              <span className="text-gray-600 dark:text-gray-400">
                Bekijk je samenvatting voor <strong className="text-purple-600 dark:text-purple-400">+10 XP</strong>
              </span>
            </div>
          </div>

          {/* Previous summaries link */}
          <button
            onClick={() => navigate('/CentVoorCentArchief')}
            className="mt-6 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-green text-sm flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">history</span>
            Bekijk eerdere samenvattingen
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased">
      {/* Main Content Wrapper */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8">
        {/* New Summary Banner - shown when viewing for the first time */}
        {summaryStatus.hasViewedThisMonth && summaryStatus.isFirstWeekOfMonth && (
          <div className="mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-500/20 dark:border-green-500/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-300">Samenvatting bekeken!</p>
              <p className="text-sm text-green-700 dark:text-green-400">Je hebt je maandoverzicht van {formatMonthYear(summaryStatus.summaryMonth)} bekeken.</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-primary-dark dark:text-white text-[32px] font-extrabold leading-tight">Cent voor Cent</h2>
            <p className="text-text-tertiary dark:text-text-secondary text-base">Jouw maandelijkse financiële reflectie</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/CentVoorCentArchief')}
              className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] px-4 py-2.5 text-text-muted dark:text-text-secondary font-semibold shadow-sm hover:border-primary dark:hover:border-konsensi-green hover:text-primary dark:hover:text-konsensi-green transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-lg">history</span>
              <span>Archief</span>
            </button>
            <button
              className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] px-4 py-2.5 text-text-main dark:text-white font-semibold shadow-sm hover:border-primary dark:hover:border-konsensi-green transition-colors cursor-pointer group"
              onClick={() => {/* Open month picker */}}
            >
              <span className="material-symbols-outlined text-text-tertiary dark:text-text-secondary group-hover:text-primary dark:group-hover:text-konsensi-green transition-colors">calendar_month</span>
              <span>{formatMonthYear(selectedMonth)}</span>
              <span className="material-symbols-outlined text-text-tertiary dark:text-text-secondary">arrow_drop_down</span>
            </button>
          </div>
        </header>

        {/* 1. MAAND SAMENVATTING (Hero Section) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card A: Inkomen */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 group border dark:border-[#2a2a2a]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent-green/10 dark:bg-[#1a1a1a]-elevated rounded-2xl text-accent-green dark:text-konsensi-green border dark:border-[#2a2a2a]">
                <span className="material-symbols-outlined icon-filled text-3xl">savings</span>
              </div>
              <span className="text-text-tertiary dark:text-text-secondary text-xs font-bold uppercase tracking-wider">Totaal Inkomen</span>
            </div>
            <div className="mb-2">
              <span className="text-accent-green dark:text-konsensi-green text-4xl lg:text-5xl font-extrabold tracking-tight">
                {formatCurrency(monthlyData.totalIncome)}
              </span>
            </div>
            <p className="text-text-secondary dark:text-text-secondary text-sm font-medium">
              Regulier: {formatCurrency(monthlyData.regularIncome)} <span className="text-gray-300 dark:text-dark-border mx-1">|</span> Extra: {formatCurrency(monthlyData.extraIncome)}
            </p>
          </div>

          {/* Card B: Uitgaven */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 border dark:border-[#2a2a2a]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent-orange/10 dark:bg-[#1a1a1a]-elevated rounded-2xl text-accent-orange dark:text-konsensi-orange border dark:border-[#2a2a2a]">
                <span className="material-symbols-outlined icon-filled text-3xl">payments</span>
              </div>
              <span className="text-text-tertiary dark:text-text-secondary text-xs font-bold uppercase tracking-wider">Totaal Uitgaven</span>
            </div>
            <div className="mb-2">
              <span className="text-accent-orange dark:text-konsensi-orange text-4xl lg:text-5xl font-extrabold tracking-tight">
                {formatCurrency(monthlyData.totalExpenses)}
              </span>
            </div>
            <p className="text-text-secondary dark:text-text-secondary text-sm font-medium">Vaste lasten + potjes</p>
          </div>

          {/* Card C: Verschil */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden border dark:border-[#2a2a2a]">
            <div className="absolute inset-0 bg-primary/10 dark:bg-konsensi-green/5 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white dark:bg-[#1a1a1a]-elevated rounded-2xl text-primary-dark dark:text-konsensi-green shadow-sm border dark:border-[#2a2a2a]">
                  <span className="material-symbols-outlined icon-filled text-3xl text-accent-green dark:text-konsensi-green">auto_awesome</span>
                </div>
                <span className="text-text-main dark:text-text-secondary text-xs font-bold uppercase tracking-wider opacity-60">Overgebleven</span>
              </div>
              <div className="mb-3">
                <span className="text-accent-green dark:text-konsensi-green text-4xl lg:text-5xl font-extrabold tracking-tight">
                  {formatCurrency(monthlyData.remaining)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {monthlyData.remaining > 0 && monthlyData.savingsPercentage >= 20 ? (
                  <span className="bg-accent-green dark:bg-konsensi-green/15 text-white dark:text-konsensi-green text-xs font-bold px-2.5 py-1 rounded-full border dark:border-konsensi-green/20">
                    Sterke maand! {monthlyData.savingsPercentage}% gespaard
                  </span>
                ) : monthlyData.remaining > 0 && monthlyData.savingsPercentage >= 10 ? (
                  <span className="bg-accent-green/80 dark:bg-konsensi-green/15 text-white dark:text-konsensi-green text-xs font-bold px-2.5 py-1 rounded-full border dark:border-konsensi-green/20">
                    {monthlyData.savingsPercentage}% gespaard
                  </span>
                ) : monthlyData.remaining > 0 ? (
                  <span className="bg-amber-400 dark:bg-amber-500/15 text-white dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border dark:border-amber-500/20">
                    Maar {monthlyData.savingsPercentage}% over
                  </span>
                ) : monthlyData.remaining === 0 ? (
                  <span className="bg-gray-400 dark:bg-gray-500/15 text-white dark:text-gray-400 text-xs font-bold px-2.5 py-1 rounded-full border dark:border-gray-500/20">
                    Niks overgehouden
                  </span>
                ) : (
                  <span className="bg-red-500 dark:bg-red-500/15 text-white dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full border dark:border-red-500/20">
                    Tekort van {formatCurrency(Math.abs(monthlyData.remaining))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. VISUALISATIE SECTIE */}
        <section className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left: Income vs Expenses */}
          <div className="w-full lg:w-[60%] bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between border dark:border-[#2a2a2a]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-primary-dark dark:text-white text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">bar_chart</span> Inkomen vs Uitgaven
              </h3>
            </div>
            <div className="flex flex-col gap-6 flex-1 justify-center">
              {/* Income Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-secondary">
                  <span>Inkomen</span>
                  <span>{formatCurrency(monthlyData.totalIncome)}</span>
                </div>
                <div className="h-14 dark:h-[60px] w-full bg-background-light dark:bg-[#1a1a1a]-elevated rounded-[24px] overflow-hidden relative group cursor-pointer border dark:border-[#2a2a2a]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary/60 dark:bg-konsensi-green group-hover:bg-primary dark:group-hover:bg-konsensi-green-light transition-colors flex items-center justify-end px-4" 
                    style={{ width: '100%' }}
                  >
                    <span className="text-primary-dark dark:text-black font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 dark:bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">100%</span>
                  </div>
                </div>
              </div>
              {/* Expenses Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold text-text-secondary dark:text-text-secondary">
                  <span>Uitgaven</span>
                  <span>{formatCurrency(monthlyData.totalExpenses)}</span>
                </div>
                <div className="h-14 dark:h-[60px] w-full bg-background-light dark:bg-[#1a1a1a]-elevated rounded-[24px] overflow-hidden relative group cursor-pointer border dark:border-[#2a2a2a]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-accent-orange dark:bg-konsensi-orange group-hover:opacity-90 transition-all duration-500 ease-out flex items-center justify-end px-4" 
                    style={{ width: `${expensePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-6 dark:mt-8 pt-6 dark:pt-6 border-t dark:border-t-dark-border">
              {expensePercentage > 100 ? (
                <div className="bg-red-500/10 dark:bg-red-500/15 rounded-[24px] p-4 flex items-center gap-3 border dark:border-red-500/20">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">warning</span>
                  <p className="text-red-700 dark:text-red-400 text-sm font-semibold">
                    Je gaf {expensePercentage}% van je inkomen uit. Je leeft boven je budget.
                  </p>
                </div>
              ) : expensePercentage > 90 ? (
                <div className="bg-amber-500/10 dark:bg-amber-500/15 rounded-[24px] p-4 flex items-center gap-3 border dark:border-amber-500/20">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">
                    Je gaf {expensePercentage}% van je inkomen uit. Er is weinig ruimte over.
                  </p>
                </div>
              ) : expensePercentage > 70 ? (
                <div className="bg-blue-500/10 dark:bg-blue-500/15 rounded-[24px] p-4 flex items-center gap-3 border dark:border-blue-500/20">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                  <p className="text-blue-700 dark:text-blue-400 text-sm font-semibold">
                    Je gaf {expensePercentage}% van je inkomen uit. {100 - expensePercentage}% bleef over.
                  </p>
                </div>
              ) : expensePercentage > 0 ? (
                <div className="bg-primary/20 dark:bg-konsensi-green/15 rounded-[24px] p-4 flex items-center gap-3 border dark:border-konsensi-green/20">
                  <span className="material-symbols-outlined text-primary-dark dark:text-konsensi-green">check_circle</span>
                  <p className="text-primary-dark dark:text-konsensi-green text-sm font-semibold">
                    Je gaf {expensePercentage}% van je inkomen uit. Je houdt {100 - expensePercentage}% over!
                  </p>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-500/10 rounded-[24px] p-4 flex items-center gap-3 border dark:border-gray-500/20">
                  <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">info</span>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">
                    Geen inkomsten- of uitgavendata voor deze maand.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Breakdown */}
          <div className="w-full lg:w-[40%] bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 border dark:border-[#2a2a2a]">
            <div className="flex justify-between items-center mb-6 dark:mb-8">
              <h3 className="text-primary-dark dark:text-white text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">pie_chart</span> Uitgaven Breakdown
              </h3>
            </div>
            <div className="flex flex-col gap-6">
              {/* Item 1 */}
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-text-secondary dark:text-white font-semibold group-hover:text-accent-orange dark:group-hover:text-konsensi-orange transition-colors">Potjes budget</span>
                  <span className="text-text-main dark:text-white font-bold">{formatCurrency(monthlyData.potsBudget)}</span>
                </div>
                <div className="h-2 w-full bg-background-light dark:bg-[#1a1a1a]-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-orange dark:bg-konsensi-orange rounded-full dark:shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                    style={{ width: `${potsPercentage}%` }}
                  ></div>
                </div>
              </div>
              {/* Item 2 */}
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-text-secondary dark:text-white font-semibold group-hover:text-primary dark:group-hover:text-konsensi-green transition-colors">Bespaard</span>
                  <span className="text-text-main dark:text-white font-bold">{formatCurrency(monthlyData.remaining)}</span>
                </div>
                <div className="h-2 w-full bg-background-light dark:bg-[#1a1a1a]-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary dark:bg-konsensi-green rounded-full dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${savingsPercentage}%` }}
                  ></div>
                </div>
              </div>
              {/* Item 3 */}
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-text-secondary dark:text-text-secondary font-semibold">Overig</span>
                  <span className="text-text-main dark:text-text-secondary font-bold">{formatCurrency(monthlyData.fixedCosts - monthlyData.potsBudget)}</span>
                </div>
                <div className="h-2 w-full bg-background-light dark:bg-[#1a1a1a]-elevated rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-300 dark:bg-text-tertiary rounded-full opacity-50" 
                    style={{ width: `${Math.max(1, 100 - potsPercentage - savingsPercentage)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. REFLECTIE SECTIE */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 mb-8 border dark:border-[#2a2a2a]">
          <h3 className="text-primary-dark dark:text-white text-2xl font-bold mb-6 dark:mb-8 flex items-center gap-2 dark:gap-3">
            <span className="material-symbols-outlined dark:text-text-secondary">psychology</span> Reflectie van deze maand
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Wat ging goed */}
            <div className="flex flex-col gap-4">
              <h4 className="text-accent-green dark:text-konsensi-green text-lg font-bold flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">check_circle</span> Wat ging goed
              </h4>
              {reflection.goodThings.map((item, index) => (
                <div key={index} className="bg-accent-green/5 dark:bg-konsensi-green/10 p-4 rounded-2xl dark:rounded-[24px] flex gap-4 items-start border border-accent-green/10 dark:border-konsensi-green/20 hover:bg-accent-green/10 dark:hover:bg-konsensi-green/15 transition-colors">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="text-text-secondary dark:text-text-secondary font-medium text-[15px] leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Right: Aandachtspunten */}
            <div className="flex flex-col gap-4">
              <h4 className="text-accent-orange dark:text-konsensi-orange text-lg font-bold flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">warning</span> Aandachtspunten
              </h4>
              {reflection.attentionPoints.map((item, index) => (
                <div key={index} className="bg-accent-orange/5 dark:bg-konsensi-orange/10 p-4 rounded-2xl dark:rounded-[24px] flex gap-4 items-start border border-accent-orange/10 dark:border-konsensi-orange/20 hover:bg-accent-orange/10 dark:hover:bg-konsensi-orange/15 transition-colors">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="text-text-secondary dark:text-text-secondary font-medium text-[15px] leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SCHULD PROGRESS */}
        {monthlyData.debtTotal > 0 && (
          <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 mb-8 border-l-4 border-accent-orange dark:border-l-konsensi-orange flex flex-col lg:flex-row gap-8 border dark:border-[#2a2a2a]">
            {/* Left Part */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary-dark dark:text-white text-3xl">credit_card</span>
                <h3 className="text-primary-dark dark:text-white text-2xl font-bold">Schulden Voortgang</h3>
              </div>
              <div className="mb-6 dark:mb-8">
                <p className="text-text-tertiary dark:text-text-secondary text-sm font-bold uppercase mb-1 dark:mb-2">Totale Schuld</p>
                <p className="text-accent-red dark:text-konsensi-red text-4xl dark:text-[36px] font-extrabold tracking-tight mb-4">
                  {formatCurrency(monthlyData.debtRemaining)}
                </p>
                {/* Progress Bar */}
                <div className="h-6 w-full bg-gray-100 dark:bg-[#0a0a0a] rounded-full overflow-hidden mb-2 border dark:border-[#2a2a2a]">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 dark:from-red-500 dark:to-konsensi-red transition-all duration-500" 
                    style={{ width: `${monthlyData.debtTotal > 0 ? ((monthlyData.debtPaid / monthlyData.debtTotal) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-text-tertiary dark:text-text-secondary text-sm font-medium">€{monthlyData.debtPaid.toFixed(2)} afgelost deze maand</p>
              </div>
              <div className="space-y-2">
                {monthlyData.monthlyArrangements > 0 && monthlyData.debtRemaining > 0 ? (
                  <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-konsensi-blue/15 text-blue-600 dark:text-konsensi-blue text-sm font-bold px-4 py-2 dark:py-3 rounded-[24px] border dark:border-konsensi-blue/20">
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                    Met je huidige aflossing van {formatCurrency(monthlyData.monthlyArrangements)}/maand ben je over {Math.ceil(monthlyData.debtRemaining / monthlyData.monthlyArrangements)} maanden schuldenvrij! 📅
                  </span>
                ) : monthlyData.debtRemaining > 0 ? (
                  <span className="inline-flex items-center gap-2 bg-orange-50 dark:bg-konsensi-orange/15 text-orange-600 dark:text-konsensi-orange text-sm font-bold px-4 py-2 dark:py-3 rounded-[24px] border dark:border-konsensi-orange/20">
                    <span className="material-symbols-outlined text-lg">info</span>
                    Er zijn nog geen actieve betalingsregelingen. Start een stappenplan om een regeling te treffen.
                  </span>
                ) : null}
                <p className="text-[11px] text-text-tertiary dark:text-text-secondary leading-relaxed px-1">
                  <span className="material-symbols-outlined text-[13px] align-middle mr-0.5">info</span>
                  Berekening op basis van je huidige actieve betalingsregelingen en totale openstaande schuld. Zonder rekening te houden met rente, incassokosten of wijzigingen in je afloscapaciteit.
                </p>
              </div>
            </div>
            {/* Right Part: Breakdown Box */}
            <div className="lg:w-[350px] bg-background-light dark:bg-[#0a0a0a] rounded-2xl dark:rounded-[24px] p-6 flex flex-col justify-center gap-4 border dark:border-[#2a2a2a]">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary dark:text-text-secondary text-sm font-medium">Afgelost deze maand</span>
                <span className="text-[#8B5CF6] dark:text-konsensi-purple font-bold">{formatCurrency(monthlyData.debtPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary dark:text-text-secondary text-sm font-medium">Extra aflossingen</span>
                <span className="text-accent-green dark:text-konsensi-green font-bold">{formatCurrency(0)}</span>
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-dark-border my-1 dark:my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-main dark:text-white font-bold">Resterend</span>
                <span className="text-accent-red dark:text-konsensi-red font-bold text-lg">{formatCurrency(monthlyData.debtRemaining)}</span>
              </div>
            </div>
          </section>
        )}

        {/* 5. PERSOONLIJK ADVIES & SLIMME TIPS - Combined Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Persoonlijk Advies */}
          {advice.length > 0 && (
            <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-primary dark:border-l-konsensi-green border dark:border-[#2a2a2a]">
              <div className="flex items-center gap-3 mb-6 dark:mb-8 flex-wrap">
                <h3 className="text-primary-dark dark:text-white text-xl font-bold flex items-center gap-2 dark:gap-3">
                  <span className="material-symbols-outlined dark:text-text-secondary">person</span> Persoonlijk advies
                </h3>
                <span className="bg-primary/20 dark:bg-konsensi-green/20 text-primary-dark dark:text-konsensi-green text-xs font-bold px-2.5 py-1 rounded-full">
                  Op basis van jouw data
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {advice.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="bg-primary/10 dark:bg-konsensi-green/10 rounded-2xl p-4 flex gap-4 items-start group cursor-pointer hover:bg-primary/20 dark:hover:bg-konsensi-green/15 transition-colors border border-transparent hover:border-primary dark:hover:border-konsensi-green/30"
                  >
                    <div className="text-primary-dark dark:text-konsensi-green transform group-hover:scale-110 transition-transform shrink-0">
                      <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-primary-dark dark:text-white text-base font-bold dark:font-semibold mb-1">{item.title}</h4>
                      <p className="text-text-secondary dark:text-text-secondary text-sm leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Slimme Geldzaken Tips - 3 tips die per maand roteren */}
          <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 border-l-4 border-amber-500 dark:border-l-amber-400 border dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-6 dark:mb-8 flex-wrap">
              <h3 className="text-primary-dark dark:text-white text-xl font-bold flex items-center gap-2 dark:gap-3">
                <span className="material-symbols-outlined text-amber-500 dark:text-amber-400">tips_and_updates</span> Slimme tips
              </h3>
              <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {formatMonthYear(selectedMonth)}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {getMonthlyTips(selectedMonth.getMonth(), selectedMonth.getFullYear()).map((tip, index) => (
                <div
                  key={index}
                  className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 flex gap-4 items-start group cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors border border-transparent hover:border-amber-400 dark:hover:border-amber-500/30"
                >
                  <div className="text-amber-600 dark:text-amber-400 transform group-hover:scale-110 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-3xl">{tip.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-amber-800 dark:text-white text-base font-bold dark:font-semibold mb-1">{tip.title}</h4>
                    <p className="text-text-secondary dark:text-text-secondary text-sm leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 7. VERGELIJKING MET VORIGE MAAND */}
        <section className="max-w-[700px] mb-12">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm dark:border dark:border-[#2a2a2a]">
            <h5 className="text-primary-dark dark:text-white font-bold dark:font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base dark:text-text-secondary">compare_arrows</span> Vergelijking met {monthlyData.previousMonthName || 'vorige maand'}
            </h5>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 border dark:border-[#2a2a2a]">
                <p className="text-xs text-text-tertiary dark:text-text-secondary font-medium uppercase mb-1 capitalize">{monthlyData.previousMonthName || 'Vorige maand'}</p>
                <p className="text-xl font-bold text-text-main dark:text-text-primary">{formatCurrency(monthlyData.previousMonthExpenses)}</p>
                {monthlyData.prevDebtPaidMonth > 0 && (
                  <p className="text-xs text-text-muted dark:text-text-tertiary mt-1">w.v. {formatCurrency(monthlyData.prevDebtPaidMonth)} schulden</p>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 border dark:border-[#2a2a2a]">
                <p className="text-xs text-text-tertiary dark:text-text-secondary font-medium uppercase mb-1 capitalize">{formatMonthYear(selectedMonth).split(' ')[0]}</p>
                <p className="text-xl font-bold text-text-main dark:text-text-primary">{formatCurrency(monthlyData.totalExpenses)}</p>
                {monthlyData.debtPaid > 0 && (
                  <p className="text-xs text-text-muted dark:text-text-tertiary mt-1">w.v. {formatCurrency(monthlyData.debtPaid)} schulden</p>
                )}
              </div>
            </div>
            <div className={`${
              expenseDiff > 0
                ? 'bg-accent-orange/10 dark:bg-konsensi-orange/15 border-accent-orange/20 dark:border-konsensi-orange/20'
                : expenseDiff < 0
                ? 'bg-accent-green/10 dark:bg-konsensi-green/15 border-accent-green/20 dark:border-konsensi-green/20'
                : 'bg-gray-100 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20'
            } rounded-xl p-3 border flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${
                  expenseDiff > 0 ? 'text-accent-orange dark:text-konsensi-orange' :
                  expenseDiff < 0 ? 'text-accent-green dark:text-konsensi-green' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {expenseDiff > 0 ? 'trending_up' : expenseDiff < 0 ? 'trending_down' : 'trending_flat'}
                </span>
                <span className={`text-sm font-semibold ${
                  expenseDiff > 0 ? 'text-accent-orange dark:text-konsensi-orange' :
                  expenseDiff < 0 ? 'text-accent-green dark:text-konsensi-green' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {expenseDiff > 0
                    ? `${formatCurrency(expenseDiff)} meer uitgegeven dan ${monthlyData.previousMonthName || 'vorige maand'}`
                    : expenseDiff < 0
                    ? `${formatCurrency(Math.abs(expenseDiff))} minder uitgegeven dan ${monthlyData.previousMonthName || 'vorige maand'}`
                    : `Zelfde uitgaven als ${monthlyData.previousMonthName || 'vorige maand'}`
                  }
                </span>
              </div>
              {monthlyData.previousMonthExpenses > 0 && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  expenseDiff > 0 ? 'bg-accent-orange/20 text-accent-orange dark:bg-konsensi-orange/20 dark:text-konsensi-orange' :
                  expenseDiff < 0 ? 'bg-accent-green/20 text-accent-green dark:bg-konsensi-green/20 dark:text-konsensi-green' :
                  'bg-gray-200 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400'
                }`}>
                  {expenseDiff > 0 ? '+' : ''}{Math.round((expenseDiff / monthlyData.previousMonthExpenses) * 100)}%
                </span>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
