import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { Pot } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { vtblService, incomeService } from "@/components/services";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/components/utils/formatters";
import PotjeModal from "../components/potjes/PotjeModal";
import PotjesInfoModal from "../components/potjes/PotjesInfoModal";
import PotDepositModal from "../components/potjes/PotDepositModal";
import PotActivityModal from "../components/potjes/PotActivityModal";
import PotjesComparisonChart from "@/components/centvoorcent/PotjesComparisonChart";
import WishlistManager from "../components/potjes/WishlistManager";

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

const NIBUD_PERCENTAGES = {
  'wonen': 35,
  'eten_drinken': 15,
  'vervoer': 10,
  'uitgaan': 8,
  'zorg': 6,
  'energie': 5,
  'telefoon_internet': 3,
  'kleding': 5,
  'sparen_buffer': 12,
  'overig': 1
};

const NIBUD_LABELS = {
  'wonen': 'Wonen',
  'eten_drinken': 'Eten & Drinken',
  'vervoer': 'Vervoer',
  'uitgaan': 'Uitgaan',
  'zorg': 'Zorg',
  'energie': 'Energie',
  'telefoon_internet': 'Telefoon/Internet',
  'kleding': 'Kleding',
  'sparen_buffer': 'Sparen/Buffer',
  'overig': 'Overig'
};

export default function Potjes() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [potjes, setPotjes] = useState([]);
  const [potjeSpendings, setPotjeSpendings] = useState({});
  const [potNotifications, setPotNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);
  const [vtblData, setVtblData] = useState(null);
  const [error, setError] = useState(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [depositPot, setDepositPot] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [activityPot, setActivityPot] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNIBUDChart, setShowNIBUDChart] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await User.me();
      setUser(userData);
      const userFilter = { created_by: userData.email };
      
      let [allPots, allIncomes, allCosts, allDebts, allTransactions] = await Promise.all([
        Pot.filter(userFilter),
        Income.filter(userFilter),
        MonthlyCost.filter(userFilter),
        Debt.filter(userFilter),
        Transaction.filter(userFilter)
      ]);

      const hasBadHabits = allPots.some(p => p.name === 'Bad Habits');
      if (!hasBadHabits) {
        await Pot.create({
          name: 'Bad Habits',
          icon: '🍔',
          description: 'Uitgaven die je eigenlijk niet nodig had (fastfood, impulsaankopen, etc.)',
          pot_type: 'expense',
          category: 'uitgaan',
          is_essential: false,
          monthly_budget: 50,
          spending_frequency: 'flexible',
          payment_day: 1,
          display_order: 999
        });
        allPots = await Pot.filter(userFilter);
      }

      setPotjes(allPots.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));

      const incomeData = incomeService.processIncomeData(allIncomes, new Date());
      const totalMonthlyIncome = incomeData.total;
      setTotalIncome(totalMonthlyIncome);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeCosts = allCosts.filter(cost => {
        if (cost.start_date) {
          const startDate = new Date(cost.start_date);
          startDate.setHours(0, 0, 0, 0);
          const endDate = cost.end_date ? new Date(cost.end_date) : null;
          if (endDate) endDate.setHours(0, 0, 0, 0);
          const isAfterStart = today >= startDate;
          const isBeforeEnd = !endDate || today <= endDate;
          return isAfterStart && isBeforeEnd;
        }
        return cost.status === 'actief';
      });
      
      const totalFixedCosts = activeCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const activeDebtPayments = allDebts
        .filter(d => d.status === 'betalingsregeling' && d.monthly_payment)
        .reduce((sum, debt) => sum + (debt.monthly_payment || 0), 0);

      const vtbl = await vtblService.calculateVtbl(allIncomes, allCosts, allDebts);
      vtbl.vasteLasten = totalFixedCosts;
      vtbl.huidigeRegelingen = activeDebtPayments;
      setVtblData(vtbl);

      const monthStart = getStartOfMonth(new Date());
      const monthEnd = getEndOfMonth(new Date());

      const spendingsMap = {};
      allPots.forEach(pot => {
        if (pot.pot_type === 'expense') { 
          const potTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            const isInMonth = txDate >= monthStart && txDate <= monthEnd;
            const isExpense = tx.type === 'expense'; 
            const categoryMatches = tx.category === pot.name;
            return isInMonth && isExpense && categoryMatches;
          });
          const totalSpent = potTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
          spendingsMap[pot.id] = totalSpent;
        } else {
          spendingsMap[pot.id] = 0;
        }
      });
      
      setPotjeSpendings(spendingsMap);

      const notifications = [];
      allPots.forEach(pot => {
        if (pot.pot_type === 'savings') {
          const progress = pot.target_amount ? ((pot.current_amount || 0) / pot.target_amount) * 100 : 0;
          if (progress >= 100) {
            notifications.push({
              type: 'success',
              message: `🎉 ${pot.icon} ${pot.name} doel bereikt! Je hebt ${formatCurrency(pot.current_amount)} gespaard!`
            });
          } else if (progress >= 75) {
            notifications.push({
              type: 'info',
              message: `🎯 ${pot.icon} ${pot.name} is bijna vol! Nog ${formatCurrency((pot.target_amount || 0) - (pot.current_amount || 0))} te gaan`
            });
          }
          return;
        }

        const spent = spendingsMap[pot.id] || 0;
        const remaining = (pot.monthly_budget || 0) - spent;
        const percentage = (pot.monthly_budget || 0) > 0 ? (spent / pot.monthly_budget) * 100 : 0;

        if (percentage >= 90 && remaining > 0) {
          notifications.push({
            type: 'warning',
            message: `${pot.icon} ${pot.name} is bijna op (${formatCurrency(remaining)} over)`
          });
        } else if (remaining < 0) {
          notifications.push({
            type: 'danger',
            message: `${pot.icon} ${pot.name} heeft een tekort van ${formatCurrency(Math.abs(remaining))}`
          });
        }
      });
      setPotNotifications(notifications);

    } catch (error) {
      console.error('Error fetching potjes data:', error);
      setError(error.message);
      toast({ title: 'Fout bij laden', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAllocated = useMemo(() => {
    return potjes.reduce((sum, pot) => sum + (parseFloat(pot.monthly_budget) || 0), 0);
  }, [potjes]);

  const fixedCostsAndArrangements = vtblData ? (vtblData.vasteLasten + vtblData.huidigeRegelingen) : 0;
  const availableForPots = totalIncome - fixedCostsAndArrangements;
  const remaining = availableForPots - totalAllocated;

  const sortedPotjes = useMemo(() => {
    return [...potjes].sort((a, b) => {
      if (a.pot_type !== b.pot_type) {
        return a.pot_type === 'savings' ? -1 : 1;
      }
      if (a.is_essential !== b.is_essential) {
        return a.is_essential ? -1 : 1;
      }
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [potjes]);

  const potjesChartData = useMemo(() => {
    const categoryMap = {};
    potjes.filter(p => p.pot_type === 'expense' && p.category).forEach(pot => {
      if (!categoryMap[pot.category]) {
        categoryMap[pot.category] = {
          category: pot.category,
          label: NIBUD_LABELS[pot.category] || pot.category,
          budget: 0,
          spent: 0,
          nibud_advice: totalIncome * (NIBUD_PERCENTAGES[pot.category] || 0) / 100,
          nibud_percentage: NIBUD_PERCENTAGES[pot.category] || 0
        };
      }
      categoryMap[pot.category].budget += pot.monthly_budget || 0;
      categoryMap[pot.category].spent += potjeSpendings[pot.id] || 0;
    });
    return Object.values(categoryMap).filter(c => c.budget > 0 || c.spent > 0);
  }, [potjes, potjeSpendings, totalIncome]);

  const handleSelectPot = useCallback((pot) => {
    setSelectedPot(pot);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedPot(null);
  }, []);

  const handlePotSaved = useCallback(() => {
    setShowModal(false);
    setSelectedPot(null);
    fetchData();
  }, [fetchData]);

  const handleOpenDeposit = useCallback((pot) => {
    setDepositPot(pot);
    setShowDepositModal(true);
  }, []);

  const handleDepositComplete = useCallback(() => {
    setShowDepositModal(false);
    setDepositPot(null);
    fetchData();
  }, [fetchData]);

  const handleViewActivity = useCallback((pot) => {
    setActivityPot(pot);
    setShowActivityModal(true);
  }, []);

  const handleTransactionDeleted = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-dark-bg text-[#131d0c] dark:text-text-primary font-body">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 bg-status-red/10 dark:bg-accent-red/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-status-red dark:text-accent-red !text-[40px]">warning</span>
          </div>
          <h2 className="text-2xl font-bold text-[#131d0c] dark:text-text-primary mb-2">Fout bij laden</h2>
          <p className="text-gray-600 dark:text-text-secondary mb-6 max-w-md">{error}</p>
          <button onClick={fetchData} className="bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-bold px-6 py-3 rounded-xl shadow-sm transition-all">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (!totalIncome || totalIncome === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-dark-bg text-[#131d0c] dark:text-text-primary font-body">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 bg-status-orange/10 dark:bg-accent-orange/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-status-orange dark:text-accent-orange !text-[40px]">warning</span>
          </div>
          <h2 className="text-2xl font-bold text-[#131d0c] dark:text-text-primary mb-2">Geen inkomen ingevoerd</h2>
          <p className="text-gray-600 dark:text-text-secondary mb-6 max-w-md">
            Om je potjes in te kunnen stellen heb je eerst inkomen nodig.
          </p>
          <button
            onClick={() => window.location.href = createPageUrl('Income')}
            className="bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-bold px-6 py-3 rounded-xl shadow-sm transition-all hover:bg-primary-dark dark:hover:bg-light-green"
          >
            Inkomen invoeren
          </button>
        </div>
      </div>
    );
  }

  const showLowBudgetWarning = availableForPots <= 0 && totalIncome > 0;

  return (
    <div className="min-h-screen bg-background-light dark:bg-dark-bg text-[#131d0c] dark:text-text-primary font-body antialiased">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20">
        <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
          <input className="sr-only" id="theme-toggle" type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>light_mode</span>
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>dark_mode</span>
            <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">🏺</span>
              <h1 className="text-brand-dark dark:text-text-primary text-3xl md:text-4xl font-display font-extrabold tracking-tight">Mijn Potjes</h1>
            </div>
            <p className="text-gray-500 dark:text-text-secondary font-medium ml-1">Verdeel je inkomen over verschillende enveloppes</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-transparent text-gray-700 dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors font-bold text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span>Info</span>
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B2FF78] dark:bg-primary-green text-brand-dark dark:text-dark-bg hover:bg-[#a3eb6d] dark:hover:bg-light-green transition-colors font-bold text-sm shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add</span>
              <span>Potje Toevoegen</span>
            </button>
          </div>
        </header>

        {/* Envelope Overview Card */}
        <section className="bg-gradient-to-br from-[#E0F2FE] dark:from-[#3b82f630] to-[#F0F9FF] dark:to-[#3b82f610] rounded-card p-6 md:p-8 shadow-soft dark:shadow-soft border border-blue-100 dark:border-brand-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-gray-900 dark:text-text-primary text-xl font-display font-bold">🧾 Enveloppe Overzicht</h3>
              <p className="text-gray-500 dark:text-text-secondary text-sm">Je totale inkomen verdeeld over je uitgaven</p>
            </div>
            <button className="text-brand-blue dark:text-brand-blue hover:text-blue-600 dark:hover:text-blue-400 text-sm font-semibold flex items-center gap-1 transition-colors">
              Details bekijken <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 divide-y md:divide-y-0 md:divide-x divide-blue-200/50 dark:divide-white/10">
            {/* Income */}
            <div className="flex flex-col gap-2 pt-4 md:pt-0">
              <div className="flex items-center gap-2 text-gray-600 dark:text-text-secondary mb-1">
                <span className="material-symbols-outlined text-status-green dark:text-primary-green">savings</span>
                <span className="text-sm font-bold uppercase tracking-wide">Totaal Inkomen</span>
              </div>
              <div className="text-3xl font-display font-extrabold text-gray-900 dark:text-text-primary">{formatCurrency(totalIncome)}</div>
              {vtblData && (
                <div className="text-xs text-gray-500 dark:text-text-tertiary font-medium">
                  Vast: {formatCurrency(vtblData.vastInkomen || 0)} + Extra: {formatCurrency(totalIncome - (vtblData.vastInkomen || 0))}
                </div>
              )}
            </div>
            {/* Fixed Expenses */}
            <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8 lg:pl-12">
              <div className="flex items-center gap-2 text-gray-600 dark:text-text-secondary mb-1">
                <span className="material-symbols-outlined text-status-red dark:text-accent-red">payments</span>
                <span className="text-sm font-bold uppercase tracking-wide">Vaste Lasten + Regelingen</span>
              </div>
              <div className="text-3xl font-display font-extrabold text-status-red dark:text-accent-red">-{formatCurrency(fixedCostsAndArrangements)}</div>
              <div className="text-xs text-gray-500 dark:text-text-tertiary font-medium">Automatisch afgeschreven</div>
            </div>
            {/* Available */}
            <div className="flex flex-col gap-2 pt-4 md:pt-0 md:pl-8 lg:pl-12">
              <div className="flex items-center gap-2 text-gray-600 dark:text-text-secondary mb-1">
                <span className="material-symbols-outlined text-status-orange dark:text-accent-orange">pie_chart</span>
                <span className="text-sm font-bold uppercase tracking-wide">Beschikbaar voor Potjes</span>
              </div>
              <div className="text-3xl font-display font-extrabold text-status-orange dark:text-accent-orange">{formatCurrency(Math.max(0, availableForPots))}</div>
              {showLowBudgetWarning && (
                <div className="text-xs text-status-orange dark:text-accent-orange/80 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">warning</span> Tekort deze maand
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Warning Banner */}
        {showLowBudgetWarning && (
          <div className="bg-[#FFFBEB] dark:bg-[#f59e0b20] border border-[#FCD34D] dark:border-brand-orange rounded-xl p-4 flex items-start gap-4 shadow-sm">
            <div className="bg-[#FCD34D] dark:bg-brand-orange/20 text-[#92400E] dark:text-brand-orange p-2 rounded-lg shrink-0 border border-[#FCD34D] dark:border-brand-orange/30">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <h4 className="text-[#92400E] dark:text-brand-orange font-bold text-lg mb-1">Geen ruimte voor potjes</h4>
              <p className="text-[#B45309] dark:text-text-secondary text-sm leading-relaxed mb-2">
                Je vaste lasten en betalingsregelingen ({formatCurrency(fixedCostsAndArrangements)}) zijn momenteel hoger dan of gelijk aan je inkomen ({formatCurrency(totalIncome)}).
              </p>
              <div className="flex items-start gap-2 bg-[#FEF3C7] dark:bg-brand-orange/10 p-3 rounded-lg border border-[#FCD34D] dark:border-brand-orange/20">
                <span className="material-symbols-outlined text-[#D97706] dark:text-brand-orange text-[18px] mt-0.5">lightbulb</span>
                <p className="text-[#92400E] dark:text-text-secondary text-xs font-medium">
                  Bekijk je vaste lasten en betalingsregelingen om te zien waar je kunt besparen, of verhoog je inkomen door extra werk of toeslagen aan te vragen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NIBUD Comparison Chart */}
        {potjesChartData.length > 0 && (
          <section className="bg-white dark:bg-dark-card rounded-card p-6 md:p-8 shadow-soft dark:shadow-soft border border-gray-100 dark:border-dark-border relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-brand-dark dark:text-text-primary text-xl font-display font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-blue dark:text-brand-blue">analytics</span>
                  Potjes Vergelijking met NIBUD
                </h3>
                <p className="text-gray-400 dark:text-text-tertiary text-sm mt-1">Geldig voor huishoudens van 1 persoon</p>
              </div>
              <button 
                onClick={() => setShowNIBUDChart(!showNIBUDChart)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card-elevated rounded-full transition-colors text-gray-400 dark:text-text-secondary"
              >
                <span className={`material-symbols-outlined transition-transform ${showNIBUDChart ? 'rotate-180' : ''}`}>keyboard_arrow_up</span>
              </button>
            </div>
            {showNIBUDChart && (
              <PotjesComparisonChart 
                categoryData={potjesChartData}
                totalIncome={totalIncome}
              />
            )}
          </section>
        )}

        {/* Wishlist Manager */}
        {user && <WishlistManager userEmail={user.email} />}

        {/* Savings Jars Grid */}
        {sortedPotjes.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-card border-2 border-dashed border-gray-300 dark:border-dark-border bg-gray-50/50 dark:bg-transparent hover:bg-[#B2FF78]/10 dark:hover:bg-primary-green/10 hover:border-[#B2FF78] dark:hover:border-primary-green transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[300px] group cursor-pointer gap-4">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-dark-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-dark-border">
              <span className="material-symbols-outlined text-brand-dark dark:text-primary-green text-3xl">add</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-display font-bold text-brand-dark dark:text-text-primary">Potje Toevoegen</h3>
              <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">Maak een nieuw spaardoel of budget</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#B2FF78] dark:bg-primary-green text-brand-dark dark:text-dark-bg font-bold px-6 py-3 rounded-xl shadow-sm transition-all hover:bg-[#a3eb6d] dark:hover:bg-light-green"
            >
              Eerste potje maken
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {sortedPotjes.map(potje => {
              const spent = potjeSpendings[potje.id] || 0;
              const remaining = (potje.monthly_budget || 0) - spent;
              const potjeProgress = (potje.monthly_budget || 0) > 0 ? (spent / potje.monthly_budget) * 100 : 0;
              const savingsProgress = potje.pot_type === 'savings' && potje.target_amount
                ? Math.min(100, ((potje.current_amount || 0) / potje.target_amount) * 100)
                : 0;
              const savingsRemaining = potje.pot_type === 'savings'
                ? (potje.target_amount || 0) - (potje.current_amount || 0)
                : 0;
              const nibudPercentage = potje.category ? NIBUD_PERCENTAGES[potje.category] : null;
              const nibudAmount = nibudPercentage && totalIncome > 0 
                ? Math.round((totalIncome * nibudPercentage) / 100)
                : null;
              const nibudLabel = potje.category ? NIBUD_LABELS[potje.category] : null;

              return (
                <article 
                  key={potje.id}
                  className="bg-white dark:bg-dark-card rounded-card p-6 shadow-soft dark:shadow-soft hover:shadow-lift dark:hover:shadow-lift transition-shadow duration-300 relative border border-transparent hover:border-gray-100 dark:hover:border-dark-border-accent group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl ${potje.pot_type === 'savings' ? 'bg-gray-50 dark:bg-dark-card-elevated' : potje.name === 'Bad Habits' ? 'bg-orange-50 dark:bg-accent-orange/10' : 'bg-blue-50 dark:bg-accent-blue/10'} flex items-center justify-center text-2xl border ${potje.pot_type === 'savings' ? 'border-gray-100 dark:border-dark-border' : potje.name === 'Bad Habits' ? 'border-orange-100 dark:border-accent-orange/20' : 'border-blue-100 dark:border-accent-blue/20'}`}>
                      {potje.icon || '💰'}
                    </div>
                    <span className={`${potje.pot_type === 'savings' ? 'bg-[#B2FF78]/30 dark:bg-primary-green/15 text-green-800 dark:text-primary-green border border-[#B2FF78] dark:border-primary-green/30' : 'bg-gray-100 dark:bg-dark-card-elevated text-gray-600 dark:text-text-secondary border border-gray-200 dark:border-dark-border-accent'} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full`}>
                      {potje.pot_type === 'savings' ? 'Sparen' : 'Uitgaven'}
                    </span>
                  </div>
                  
                  <div className="mb-5">
                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-text-primary mb-1">{potje.name}</h3>
                    {potje.description ? (
                      <p className="text-gray-500 dark:text-text-secondary text-sm italic">"{potje.description}"</p>
                    ) : (
                      <p className="text-gray-500 dark:text-text-secondary text-sm"> </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs text-gray-400 dark:text-text-secondary">
                      <span>{potje.pot_type === 'savings' ? 'Maandelijks:' : 'Budget:'} {formatCurrency(potje.monthly_budget || 0)}</span>
                    </div>
                    
                    <div className="bg-gray-100 dark:bg-dark-card-elevated rounded-full h-3 w-full overflow-hidden">
                      {potje.pot_type === 'savings' ? (
                        <div 
                          className="bg-[#B2FF78] dark:bg-primary-green h-full rounded-full transition-all duration-500" 
                          style={{ width: `${savingsProgress}%` }}
                        ></div>
                      ) : (
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${potjeProgress >= 100 ? 'bg-status-red dark:bg-accent-red' : potjeProgress >= 75 ? 'bg-status-orange dark:bg-accent-orange' : 'bg-status-blue dark:bg-brand-blue'}`}
                          style={{ width: `${Math.min(potjeProgress, 100)}%` }}
                        ></div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-text-secondary block mb-1">
                          {potje.pot_type === 'savings' ? 'Gespaard' : 'Uitgegeven'}
                        </span>
                        <span className={`text-2xl font-bold ${potje.pot_type === 'savings' ? 'text-status-green dark:text-primary-green' : 'text-gray-900 dark:text-text-primary'}`}>
                          {potje.pot_type === 'savings' ? formatCurrency(potje.current_amount || 0) : formatCurrency(spent)}
                        </span>
                      </div>
                      <div className="text-right">
                        {potje.pot_type === 'savings' ? (
                          <>
                            <span className="text-xs text-gray-400 dark:text-text-secondary font-medium block">
                              Nog {formatCurrency(savingsRemaining)} te gaan
                            </span>
                            {potje.target_date && (
                              <span className="text-[10px] text-gray-400 dark:text-text-tertiary mt-1 block flex items-center justify-end gap-1">
                                <span className="material-symbols-outlined text-[12px]">flag</span> {new Date(potje.target_date).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                            {!potje.target_date && (
                              <span className="text-[10px] text-gray-400 dark:text-text-tertiary mt-1 block flex items-center justify-end gap-1">
                                <span className="material-symbols-outlined text-[12px]">flag</span> Geen datum
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={`text-xs font-medium block ${remaining < 0 ? 'text-status-red dark:text-accent-red' : 'text-status-green dark:text-primary-green'}`}>
                              {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} te veel` : `${formatCurrency(remaining)} over`}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-text-tertiary mt-1 block flex items-center justify-end gap-1">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span> 
                              {potje.spending_frequency && potje.spending_frequency !== 'flexible' ? (
                                <>Maandelijks - dag {potje.payment_day || 1}</>
                              ) : (
                                <>Dag {new Date().getDate()}</>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {nibudAmount !== null && nibudLabel && (
                      <div className="text-[10px] text-brand-blue dark:text-brand-blue font-bold mt-1">
                        NIBUD: {nibudPercentage}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-dark-border">
                    {potje.pot_type === 'savings' ? (
                      <>
                        <button 
                          onClick={() => handleOpenDeposit(potje)}
                          className="flex-1 bg-[#B2FF78] dark:bg-primary-green hover:bg-[#a3eb6d] dark:hover:bg-light-green text-brand-dark dark:text-dark-bg py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">sync_alt</span> Storten
                        </button>
                        <button 
                          onClick={() => handleSelectPot(potje)}
                          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card-elevated text-gray-600 dark:text-text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleViewActivity(potje)}
                        className="flex-1 bg-white dark:bg-transparent border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card-elevated text-gray-700 dark:text-text-primary py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span> Bekijk activiteit
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Add New Jar Card */}
            <button 
              onClick={() => setShowModal(true)}
              className="rounded-card border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] bg-gray-50/50 dark:bg-transparent hover:bg-[#B2FF78]/10 dark:hover:bg-primary-green/10 hover:border-[#B2FF78] dark:hover:border-primary-green transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[300px] group cursor-pointer gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-dark-card shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-dark-border">
                <span className="material-symbols-outlined text-brand-dark dark:text-primary-green text-3xl">add</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-display font-bold text-brand-dark dark:text-text-primary">Potje Toevoegen</h3>
                <p className="text-sm text-gray-500 dark:text-text-secondary mt-1">Maak een nieuw spaardoel of budget</p>
              </div>
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <PotjeModal 
        pot={selectedPot}
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handlePotSaved}
      />
     
      <PotjesInfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        notifications={potNotifications}
      />

      <PotDepositModal 
        pot={depositPot}
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setDepositPot(null);
        }}
        onDeposited={handleDepositComplete}
      />

      <PotActivityModal 
        pot={activityPot}
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setActivityPot(null);
        }}
        spent={activityPot ? (potjeSpendings[activityPot.id] || 0) : 0}
        onTransactionDeleted={handleTransactionDeleted}
      />
    </div>
  );
}
