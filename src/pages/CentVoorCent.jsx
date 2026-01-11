import React, { useState, useEffect } from 'react';
import { User, MonthlyCost, Pot, Debt, DebtPayment } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

// ALGEMENE TIPS - Deze ziet iedereen in de app
const ALGEMENE_TIPS = [
  {
    icon: 'lightbulb',
    title: 'De 50/30/20 Regel',
    text: 'Besteed 50% aan vaste lasten, 30% aan leuke dingen, en spaar 20% van je inkomen.',
    type: 'general'
  },
  {
    icon: 'shopping_cart',
    title: 'Boodschappen',
    text: 'Maak een boodschappenlijstje en ga nooit met honger naar de supermarkt.',
    type: 'general'
  },
  {
    icon: 'receipt_long',
    title: 'Abonnementen',
    text: 'Check maandelijks je abonnementen. Vaak betaal je voor dingen die je niet gebruikt.',
    type: 'general'
  },
  {
    icon: 'savings',
    title: 'Noodfonds',
    text: 'Probeer minimaal 3 maanden aan vaste lasten als buffer op te bouwen.',
    type: 'general'
  },
  {
    icon: 'compare_arrows',
    title: 'Vergelijken loont',
    text: 'Vergelijk jaarlijks je energie, verzekeringen en internet. Bespaar honderden euros!',
    type: 'general'
  },
  {
    icon: 'event',
    title: 'Automatisch sparen',
    text: 'Zet een automatische overschrijving naar je spaarrekening op de dag dat je salaris binnenkomt.',
    type: 'general'
  }
];

export default function CentVoorCent() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setUser(userData);

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

      // Previous month expenses (simplified - could load actual previous month data)
      const previousMonthExpenses = totalExpenses * 0.9; // Placeholder for now

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
        debtsWithArrangements,
        costs
      });

      // Generate dynamic reflection based on data
      const goodThings = [];
      const attentionPoints = [];

      // Positive reflections
      if (remaining > 0) {
        goodThings.push({ emoji: '💚', text: `Je hebt ${formatCurrency(remaining)} overgehouden deze maand!` });
      }
      if (savingsPercentage >= 20) {
        goodThings.push({ emoji: '🎉', text: `Geweldig! Je hebt ${savingsPercentage}% van je inkomen bespaard.` });
      }
      if (debtPaidThisMonth > 0) {
        goodThings.push({ emoji: '💪', text: `Je hebt ${formatCurrency(debtPaidThisMonth)} afgelost op je schulden.` });
      }
      if (debtsWithArrangements.length > 0) {
        goodThings.push({ emoji: '✅', text: `Je hebt ${debtsWithArrangements.length} actieve betalingsregeling(en) lopen.` });
      }

      // Attention points
      if (remaining < 0) {
        attentionPoints.push({ emoji: '⚠️', text: `Let op: je uitgaven zijn ${formatCurrency(Math.abs(remaining))} hoger dan je inkomen.` });
      }
      if (debtRemaining > 0) {
        const monthsToPayoff = monthlyArrangements > 0 ? Math.ceil(debtRemaining / monthlyArrangements) : 0;
        attentionPoints.push({ emoji: '📊', text: `Nog ${formatCurrency(debtRemaining)} schuld te gaan${monthsToPayoff > 0 ? ` (±${monthsToPayoff} maanden)` : ''}.` });
      }
      if (savingsPercentage < 10 && remaining > 0) {
        attentionPoints.push({ emoji: '💡', text: 'Probeer minimaal 10% van je inkomen te sparen.' });
      }

      // Default messages if no data
      if (goodThings.length === 0) {
        goodThings.push({ emoji: '📝', text: 'Voeg je inkomen en uitgaven toe om inzichten te krijgen.' });
      }
      if (attentionPoints.length === 0 && debtTotal === 0) {
        attentionPoints.push({ emoji: '🎯', text: 'Geen schulden! Blijf zo doorgaan.' });
      }

      setReflection({ goodThings, attentionPoints });

      // Generate PERSONAL advice based on user data
      const personalAdviceList = [];
      if (debtRemaining > 0 && monthlyArrangements > 0) {
        const monthsLeft = Math.ceil(debtRemaining / monthlyArrangements);
        personalAdviceList.push({
          icon: 'savings',
          title: 'Aflossen',
          text: `Met je huidige aflossing van ${formatCurrency(monthlyArrangements)}/maand ben je over ${monthsLeft} maanden schuldenvrij.`,
          type: 'personal'
        });
      }
      if (remaining > 100) {
        personalAdviceList.push({
          icon: 'trending_up',
          title: 'Extra aflossen',
          text: `Je hebt ${formatCurrency(remaining)} over. Overweeg extra af te lossen om sneller schuldenvrij te zijn.`,
          type: 'personal'
        });
      }
      if (totalFixedCosts > totalIncome * 0.5) {
        personalAdviceList.push({
          icon: 'content_cut',
          title: 'Vaste lasten',
          text: 'Je vaste lasten zijn meer dan 50% van je inkomen. Kijk of je ergens kunt besparen.',
          type: 'personal'
        });
      }
      if (savingsPercentage < 10 && remaining > 0) {
        personalAdviceList.push({
          icon: 'account_balance',
          title: 'Sparen',
          text: `Je spaart nu ${savingsPercentage}%. Probeer richting 10-20% te werken voor een gezonde buffer.`,
          type: 'personal'
        });
      }
      if (debtTotal > 0 && monthlyArrangements === 0) {
        personalAdviceList.push({
          icon: 'handshake',
          title: 'Betalingsregeling',
          text: 'Je hebt schulden maar nog geen betalingsregeling. Neem contact op met je schuldeisers.',
          type: 'personal'
        });
      }

      setAdvice(personalAdviceList);

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

  // Generate iCal file for calendar reminder
  const generateICalEvent = (title, description, dueDate, amount) => {
    const startDate = new Date(dueDate);
    const endDate = new Date(dueDate);
    endDate.setHours(endDate.getHours() + 1);

    const formatICalDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Konsensi//Betalingsherinnering//NL
BEGIN:VEVENT
UID:${Date.now()}@konsensi.app
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(startDate)}
DTEND:${formatICalDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}\\n\\nBedrag: €${amount.toFixed(2)}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Morgen: ${title}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Over 2 uur: ${title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  const downloadCalendarReminder = (item, type) => {
    const today = new Date();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), item.due_day || 1);

    // If due day has passed, set for next month
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const title = type === 'cost'
      ? `Betaling: ${item.name || item.category}`
      : `Aflossing: ${item.creditor_name || item.name}`;

    const description = type === 'cost'
      ? `Vaste lasten betaling voor ${item.name || item.category}`
      : `Betalingsregeling aflossing voor ${item.creditor_name || item.name}`;

    const amount = type === 'cost'
      ? parseFloat(item.amount || 0)
      : parseFloat(item.monthly_payment || 0);

    const icsContent = generateICalEvent(title, description, dueDate, amount);

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Herinnering gedownload!',
      description: 'Open het bestand om toe te voegen aan je agenda.'
    });
  };

  const addAllRemindersToCalendar = () => {
    // Combine all costs and arrangements
    const allItems = [
      ...(monthlyData.costs || []).map(c => ({ ...c, type: 'cost' })),
      ...(monthlyData.debtsWithArrangements || []).map(d => ({ ...d, type: 'arrangement' }))
    ];

    if (allItems.length === 0) {
      toast({
        title: 'Geen betalingen gevonden',
        description: 'Voeg eerst vaste lasten of betalingsregelingen toe.',
        variant: 'destructive'
      });
      return;
    }

    // Generate combined calendar events
    const today = new Date();
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Konsensi//Betalingsherinneringen//NL
`;

    allItems.forEach((item, index) => {
      let dueDate = new Date(today.getFullYear(), today.getMonth(), item.due_day || 1);
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const title = item.type === 'cost'
        ? `Betaling: ${item.name || item.category}`
        : `Aflossing: ${item.creditor_name || item.name}`;

      const amount = item.type === 'cost'
        ? parseFloat(item.amount || 0)
        : parseFloat(item.monthly_payment || 0);

      const formatICalDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const endDate = new Date(dueDate);
      endDate.setHours(endDate.getHours() + 1);

      icsContent += `BEGIN:VEVENT
UID:${Date.now()}-${index}@konsensi.app
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(dueDate)}
DTEND:${formatICalDate(endDate)}
SUMMARY:${title}
DESCRIPTION:Bedrag: €${amount.toFixed(2)}
RRULE:FREQ=MONTHLY
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Morgen: ${title}
END:VALARM
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'konsensi_betalingsherinneringen.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: `${allItems.length} herinneringen gedownload!`,
      description: 'Open het bestand om toe te voegen aan je agenda.'
    });
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased">
      {/* Main Content Wrapper */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-primary-dark dark:text-white text-[32px] font-extrabold leading-tight">Cent voor Cent</h2>
            <p className="text-text-tertiary dark:text-text-secondary text-base">Jouw maandelijkse financiële reflectie</p>
          </div>
          <button 
            className="flex items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] px-4 py-2.5 text-text-main dark:text-white font-semibold shadow-sm hover:border-primary dark:hover:border-konsensi-green transition-colors cursor-pointer group"
            onClick={() => {/* Open month picker */}}
          >
            <span className="material-symbols-outlined text-text-tertiary dark:text-text-secondary group-hover:text-primary dark:group-hover:text-konsensi-green transition-colors">calendar_month</span>
            <span>{formatMonthYear(selectedMonth)}</span>
            <span className="material-symbols-outlined text-text-tertiary dark:text-text-secondary">arrow_drop_down</span>
          </button>
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
                <span className="bg-accent-green dark:bg-konsensi-green/15 text-white dark:text-konsensi-green text-xs font-bold px-2.5 py-1 rounded-full border dark:border-konsensi-green/20">
                  Goede maand! 💚
                </span>
                <span className="text-primary-dark dark:text-konsensi-green text-sm font-bold">
                  {monthlyData.savingsPercentage}% gespaard
                </span>
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
              <div className="bg-primary/20 dark:bg-konsensi-green/15 rounded-[24px] p-4 flex items-center gap-3 border dark:border-konsensi-green/20">
                <span className="material-symbols-outlined text-primary-dark dark:text-konsensi-green">celebration</span>
                <p className="text-primary-dark dark:text-konsensi-green text-sm font-semibold">
                  Je gaf slechts {expensePercentage}% van je inkomen uit deze maand! 🎉
                </p>
              </div>
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
                <div className="h-6 w-full bg-gray-100 dark:bg-[#1a1a1a]-elevated rounded-full overflow-hidden mb-2 border dark:border-[#2a2a2a]">
                  <div 
                    className="h-full bg-gradient-to-r from-red-400 to-red-600 dark:from-red-500 dark:to-konsensi-red transition-all duration-500" 
                    style={{ width: `${monthlyData.debtTotal > 0 ? ((monthlyData.debtPaid / monthlyData.debtTotal) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-text-tertiary dark:text-text-secondary text-sm font-medium">€{monthlyData.debtPaid.toFixed(2)} afgelost deze maand</p>
              </div>
              <div>
                <span className="inline-flex items-center gap-2 bg-blue-50 dark:bg-konsensi-blue/15 text-blue-600 dark:text-konsensi-blue text-sm font-bold px-4 py-2 dark:py-3 rounded-[24px] dark:rounded-[24px] border dark:border-konsensi-blue/20">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  Als je €500/maand aflost, ben je over 27 maanden schuldenvrij! 📅
                </span>
              </div>
            </div>
            {/* Right Part: Breakdown Box */}
            <div className="lg:w-[350px] bg-background-light dark:bg-[#1a1a1a]-elevated rounded-2xl dark:rounded-[24px] p-6 flex flex-col justify-center gap-4 border dark:border-[#2a2a2a]">
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

        {/* 5. PERSOONLIJK ADVIES */}
        {advice.length > 0 && (
          <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 mb-8 border-l-4 border-primary dark:border-l-konsensi-green border dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-6 dark:mb-8">
              <h3 className="text-primary-dark dark:text-white text-2xl font-bold flex items-center gap-2 dark:gap-3">
                <span className="material-symbols-outlined dark:text-text-secondary">person</span> Jouw persoonlijke advies
              </h3>
              <span className="bg-primary/20 dark:bg-konsensi-green/20 text-primary-dark dark:text-konsensi-green text-xs font-bold px-2.5 py-1 rounded-full">
                Op basis van jouw data
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {advice.map((item, index) => (
                <div
                  key={index}
                  className="bg-primary/10 dark:bg-konsensi-green/10 rounded-2xl p-6 flex flex-col gap-3 dark:gap-4 group cursor-pointer hover:bg-primary/20 dark:hover:bg-konsensi-green/15 transition-colors border border-transparent hover:border-primary dark:hover:border-konsensi-green/30"
                >
                  <div className="text-primary-dark dark:text-konsensi-green mb-2 dark:mb-1 transform group-hover:scale-110 transition-transform origin-left">
                    <span className="material-symbols-outlined text-4xl">{item.icon}</span>
                  </div>
                  <h4 className="text-primary-dark dark:text-white text-lg font-bold dark:font-semibold">{item.title}</h4>
                  <p className="text-text-secondary dark:text-text-secondary text-[15px] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. ALGEMENE TIPS */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 mb-8 border-l-4 border-amber-500 dark:border-l-amber-400 border dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-6 dark:mb-8">
            <h3 className="text-primary-dark dark:text-white text-2xl font-bold flex items-center gap-2 dark:gap-3">
              <span className="material-symbols-outlined text-amber-500 dark:text-amber-400">tips_and_updates</span> Slimme geldzaken tips
            </h3>
            <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
              Algemeen
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ALGEMENE_TIPS.slice(0, 3).map((tip, index) => (
              <div
                key={index}
                className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 flex flex-col gap-3 dark:gap-4 group cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors border border-transparent hover:border-amber-400 dark:hover:border-amber-500/30"
              >
                <div className="text-amber-600 dark:text-amber-400 mb-2 dark:mb-1 transform group-hover:scale-110 transition-transform origin-left">
                  <span className="material-symbols-outlined text-4xl">{tip.icon}</span>
                </div>
                <h4 className="text-amber-800 dark:text-white text-lg font-bold dark:font-semibold">{tip.title}</h4>
                <p className="text-text-secondary dark:text-text-secondary text-[15px] leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
          {/* Show more tips toggle */}
          <details className="mt-6">
            <summary className="cursor-pointer text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">expand_more</span>
              Meer tips bekijken
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {ALGEMENE_TIPS.slice(3).map((tip, index) => (
                <div
                  key={index}
                  className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-6 flex flex-col gap-3 dark:gap-4 group cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors border border-transparent hover:border-amber-400 dark:hover:border-amber-500/30"
                >
                  <div className="text-amber-600 dark:text-amber-400 mb-2 dark:mb-1 transform group-hover:scale-110 transition-transform origin-left">
                    <span className="material-symbols-outlined text-4xl">{tip.icon}</span>
                  </div>
                  <h4 className="text-amber-800 dark:text-white text-lg font-bold dark:font-semibold">{tip.title}</h4>
                  <p className="text-text-secondary dark:text-text-secondary text-[15px] leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* 7. BETALINGSHERINNERINGEN */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-card dark:shadow-dark-card hover:shadow-card-hover dark:hover:shadow-dark-hover hover:-translate-y-0.5 transition-all duration-300 mb-8 border-l-4 border-blue-500 dark:border-l-blue-400 border dark:border-[#2a2a2a]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-primary-dark dark:text-white text-2xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">notifications_active</span> Betalingsherinneringen
            </h3>
            <button
              onClick={addAllRemindersToCalendar}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-lg">calendar_add_on</span>
              Alle herinneringen toevoegen aan agenda
            </button>
          </div>

          <p className="text-text-secondary dark:text-text-secondary mb-6">
            Krijg een herinnering in je agenda voor je vaste lasten en betalingsregelingen. De herinnering wordt 1 dag van tevoren verstuurd.
          </p>

          {/* Vaste Lasten */}
          {(monthlyData.costs?.length > 0 || monthlyData.debtsWithArrangements?.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vaste Lasten Column */}
              <div>
                <h4 className="text-text-main dark:text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500">receipt_long</span> Vaste Lasten
                </h4>
                <div className="space-y-3">
                  {(monthlyData.costs || []).slice(0, 5).map((cost, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border dark:border-[#2a2a2a]">
                      <div className="flex-1">
                        <p className="text-text-main dark:text-white font-medium text-sm">{cost.name || cost.category}</p>
                        <p className="text-text-tertiary dark:text-text-secondary text-xs">
                          {cost.due_day ? `Elke ${cost.due_day}e van de maand` : 'Geen datum ingesteld'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-orange-500 dark:text-konsensi-orange font-bold">{formatCurrency(cost.amount || 0)}</span>
                        <button
                          onClick={() => downloadCalendarReminder(cost, 'cost')}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Toevoegen aan agenda"
                        >
                          <span className="material-symbols-outlined text-lg">event</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(monthlyData.costs || []).length === 0 && (
                    <p className="text-text-tertiary dark:text-text-secondary text-sm italic">Geen vaste lasten gevonden</p>
                  )}
                </div>
              </div>

              {/* Betalingsregelingen Column */}
              <div>
                <h4 className="text-text-main dark:text-white font-semibold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-500">handshake</span> Betalingsregelingen
                </h4>
                <div className="space-y-3">
                  {(monthlyData.debtsWithArrangements || []).map((debt, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3 border dark:border-[#2a2a2a]">
                      <div className="flex-1">
                        <p className="text-text-main dark:text-white font-medium text-sm">{debt.creditor_name || debt.name}</p>
                        <p className="text-text-tertiary dark:text-text-secondary text-xs">
                          {debt.payment_plan_date ? `Elke ${new Date(debt.payment_plan_date).getDate()}e van de maand` : 'Geen datum ingesteld'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-500 dark:text-purple-400 font-bold">{formatCurrency(debt.monthly_payment || 0)}</span>
                        <button
                          onClick={() => downloadCalendarReminder(debt, 'arrangement')}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Toevoegen aan agenda"
                        >
                          <span className="material-symbols-outlined text-lg">event</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(monthlyData.debtsWithArrangements || []).length === 0 && (
                    <p className="text-text-tertiary dark:text-text-secondary text-sm italic">Geen betalingsregelingen gevonden</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">event_busy</span>
              <p className="text-text-tertiary dark:text-text-secondary">
                Voeg vaste lasten of betalingsregelingen toe om herinneringen te kunnen instellen.
              </p>
            </div>
          )}
        </section>

        {/* 7. VERGELIJKING */}
        <section className="max-w-[600px] mb-12">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm dark:border dark:border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h5 className="text-primary-dark dark:text-white font-bold dark:font-semibold text-lg mb-1 dark:mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base dark:text-text-secondary">trending_up</span> Vergelijking
              </h5>
              <div className="text-sm text-text-secondary dark:text-text-secondary font-body space-y-1">
                <span className="block">Vorige maand: {formatCurrency(monthlyData.previousMonthExpenses)} uitgegeven</span>
                <span className="block font-semibold dark:text-text-primary">Deze maand: {formatCurrency(monthlyData.totalExpenses)} uitgegeven</span>
              </div>
            </div>
            <div className={`bg-accent-orange/10 dark:bg-konsensi-orange/15 text-accent-orange dark:text-konsensi-orange font-bold px-4 py-2 rounded-[24px] dark:rounded-[24px] text-sm whitespace-nowrap border dark:border-konsensi-orange/20 flex items-center gap-2`}>
              <span>{expenseDiff >= 0 ? '+' : ''}{formatCurrency(expenseDiff)} meer uitgegeven</span>
              <span className="material-symbols-outlined text-sm">warning</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
