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
      if (!userData || !userData.id) {
        throw new Error('Gebruikersgegevens niet gevonden');
      }
      setUser(userData);
      const userFilter = { user_id: userData.id };

      console.log('Fetching potjes data for user:', userData.id);

      // Fetch each entity individually with try-catch
      let allPots = [];
      let allIncomes = [];
      let allCosts = [];
      let allDebts = [];
      let allTransactions = [];

      try {
        allPots = await Pot.filter(userFilter);
        console.log('Pots loaded:', allPots?.length || 0);
      } catch (err) {
        console.error('Pot.filter error:', err);
        allPots = [];
      }

      try {
        allIncomes = await Income.filter(userFilter);
        console.log('Incomes loaded:', allIncomes?.length || 0);
      } catch (err) {
        console.error('Income.filter error:', err);
        allIncomes = [];
      }

      try {
        allCosts = await MonthlyCost.filter(userFilter);
        console.log('Costs loaded:', allCosts?.length || 0);
      } catch (err) {
        console.error('MonthlyCost.filter error:', err);
        allCosts = [];
      }

      try {
        allDebts = await Debt.filter(userFilter);
        console.log('Debts loaded:', allDebts?.length || 0);
      } catch (err) {
        console.error('Debt.filter error:', err);
        allDebts = [];
      }

      try {
        allTransactions = await Transaction.filter(userFilter);
        console.log('Transactions loaded:', allTransactions?.length || 0);
      } catch (err) {
        console.error('Transaction.filter error:', err);
        allTransactions = [];
      }

      // Ensure all values are arrays and filter out any null/undefined items
      allPots = Array.isArray(allPots) ? allPots.filter(item => item && typeof item === 'object') : [];
      allIncomes = Array.isArray(allIncomes) ? allIncomes.filter(item => item && typeof item === 'object') : [];
      allCosts = Array.isArray(allCosts) ? allCosts.filter(item => item && typeof item === 'object') : [];
      allDebts = Array.isArray(allDebts) ? allDebts.filter(item => item && typeof item === 'object') : [];
      allTransactions = Array.isArray(allTransactions) ? allTransactions.filter(item => item && typeof item === 'object') : [];

      console.log('Filtered data counts:', {
        pots: allPots.length,
        incomes: allIncomes.length,
        costs: allCosts.length,
        debts: allDebts.length,
        transactions: allTransactions.length
      });

      // Try to create Bad Habits pot if it doesn't exist
      try {
        const hasBadHabits = allPots.some(p => p && p.name === 'Bad Habits');
        if (!hasBadHabits) {
          console.log('Creating Bad Habits pot...');
          await Pot.create({
            user_id: userData.id,
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
          // Reload pots after creation
          try {
            allPots = await Pot.filter(userFilter);
            allPots = Array.isArray(allPots) ? allPots.filter(item => item && typeof item === 'object') : [];
          } catch (reloadErr) {
            console.error('Error reloading pots after Bad Habits creation:', reloadErr);
          }
        }
      } catch (badHabitsErr) {
        console.error('Error creating Bad Habits pot:', badHabitsErr);
        // Continue without Bad Habits pot
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
        .filter(d => d && d.status === 'betalingsregeling' && d.monthly_payment)
        .reduce((sum, debt) => sum + (debt.monthly_payment || 0), 0);

      // Try to calculate VTBL
      try {
        const vtbl = await vtblService.calculateVtbl(allIncomes, allCosts, allDebts);
        if (vtbl && typeof vtbl === 'object') {
          vtbl.vasteLasten = totalFixedCosts;
          vtbl.huidigeRegelingen = activeDebtPayments;
          setVtblData(vtbl);
        } else {
          console.warn('Invalid VTBL data returned');
          setVtblData({
            vasteLasten: totalFixedCosts,
            huidigeRegelingen: activeDebtPayments,
            vrij: 0
          });
        }
      } catch (vtblErr) {
        console.error('Error calculating VTBL:', vtblErr);
        // Set default VTBL data
        setVtblData({
          vasteLasten: totalFixedCosts,
          huidigeRegelingen: activeDebtPayments,
          vrij: 0
        });
      }

      const monthStart = getStartOfMonth(new Date());
      const monthEnd = getEndOfMonth(new Date());

      const spendingsMap = {};
      allPots.forEach(pot => {
        if (pot && pot.pot_type === 'expense') {
          try {
            const potTransactions = allTransactions.filter(tx => {
              // Comprehensive null/undefined checks
              if (!tx || typeof tx !== 'object') return false;
              if (!tx.date || !tx.type || !tx.category) return false;

              try {
                const txDate = new Date(tx.date);
                // Check if date is valid
                if (isNaN(txDate.getTime())) return false;

                const isInMonth = txDate >= monthStart && txDate <= monthEnd;
                const isExpense = tx.type === 'expense';
                const categoryMatches = tx.category === pot.name;
                return isInMonth && isExpense && categoryMatches;
              } catch (err) {
                console.error('Error processing transaction:', err, tx);
                return false;
              }
            });
            const totalSpent = potTransactions.reduce((sum, tx) => {
              const amount = parseFloat(tx?.amount);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            spendingsMap[pot.id] = totalSpent;
          } catch (err) {
            console.error('Error calculating spending for pot:', pot?.name, err);
            spendingsMap[pot.id] = 0;
          }
        } else {
          spendingsMap[pot.id] = 0;
        }
      });
      
      setPotjeSpendings(spendingsMap);

      const notifications = [];
      allPots.forEach(pot => {
        if (!pot || typeof pot !== 'object') return;
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
    if (!Array.isArray(potjes)) return 0;
    return potjes.reduce((sum, pot) => {
      if (!pot || typeof pot !== 'object') return sum;
      return sum + (parseFloat(pot.monthly_budget) || 0);
    }, 0);
  }, [potjes]);

  const fixedCostsAndArrangements = vtblData ? (vtblData.vasteLasten + vtblData.huidigeRegelingen) : 0;
  const availableForPots = totalIncome - fixedCostsAndArrangements;
  const remaining = availableForPots - totalAllocated;

  const sortedPotjes = useMemo(() => {
    if (!Array.isArray(potjes)) return [];
    return [...potjes].filter(p => p && typeof p === 'object').sort((a, b) => {
      if (!a || !b) return 0;
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
    try {
      if (!Array.isArray(potjes) || !potjeSpendings || typeof potjeSpendings !== 'object') {
        return [];
      }
      const categoryMap = {};
      potjes
        .filter(p => p && typeof p === 'object' && p.pot_type === 'expense' && p.category)
        .forEach(pot => {
          if (!pot.category) return;
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
      return Object.values(categoryMap).filter(c => c && (c.budget > 0 || c.spent > 0));
    } catch (err) {
      console.error('Error calculating potjesChartData:', err);
      return [];
    }
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
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body">
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 bg-status-red/10 dark:bg-accent-red/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-status-red dark:text-accent-red !text-[40px]">warning</span>
          </div>
          <h2 className="text-2xl font-bold text-[#131d0c] dark:text-text-primary mb-2">Fout bij laden</h2>
          <p className="text-gray-600 dark:text-text-secondary mb-6 max-w-md">{error}</p>
          <button onClick={fetchData} className="bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-bold px-6 py-3 rounded-[24px] shadow-sm transition-all">
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (!totalIncome || totalIncome === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body">
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
            className="bg-primary dark:bg-primary-green text-white dark:text-[#0a0a0a] font-bold px-6 py-3 rounded-[24px] shadow-sm transition-all hover:bg-primary-dark dark:hover:bg-light-green"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-[24px] border border-[#E5E7EB] dark:border-[#2A3F36] bg-white dark:bg-transparent text-[#0d1b17] dark:text-white hover:bg-gray-50 dark:hover:bg-[#2A3F36] transition-colors font-bold text-sm shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span>Info</span>
            </button>
            <button 
            onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-[#B2FF78] dark:bg-primary-green text-brand-dark dark:text-dark-bg hover:bg-[#a3eb6d] dark:hover:bg-light-green transition-colors font-bold text-sm shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">add</span>
              <span>Potje Toevoegen</span>
            </button>
          </div>
        </header>

        {/* Envelope Overview Card */}
        <section className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-[#131d0c] dark:text-white text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 dark:text-blue-400">account_balance_wallet</span>
                Budget Overzicht
              </h3>
              <p className="text-gray-500 dark:text-[#a1a1a1] text-sm mt-1">Je totale inkomen verdeeld over je uitgaven</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Income */}
            <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-4 border border-green-100 dark:border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 !text-[20px]">trending_up</span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Inkomen</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalIncome)}</div>
              {vtblData && (
                <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Vast: {formatCurrency(vtblData.vastInkomen || 0)} + Extra: {formatCurrency(totalIncome - (vtblData.vastInkomen || 0))}
                </div>
              )}
            </div>

            {/* Fixed Expenses */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 border border-red-100 dark:border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 !text-[20px]">payments</span>
                <span className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Vaste Lasten</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">-{formatCurrency(fixedCostsAndArrangements)}</div>
              <div className="text-xs text-red-500 dark:text-red-500/80 mt-1">Automatisch afgeschreven</div>
            </div>

            {/* Available */}
            <div className={`rounded-xl p-4 border ${availableForPots > 0 ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' : 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined !text-[20px] ${availableForPots > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>savings</span>
                <span className={`text-sm font-semibold uppercase tracking-wide ${availableForPots > 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>Beschikbaar</span>
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${availableForPots > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(Math.max(0, availableForPots))}
              </div>
              {showLowBudgetWarning && (
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">warning</span> Tekort deze maand
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Warning Banner */}
        {showLowBudgetWarning && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 !text-[24px]">warning</span>
              </div>
              <div className="flex-1">
                <h4 className="text-amber-800 dark:text-amber-400 font-bold text-lg mb-1">Geen ruimte voor potjes</h4>
                <p className="text-amber-700 dark:text-amber-300/80 text-sm leading-relaxed mb-3">
                  Je vaste lasten en betalingsregelingen ({formatCurrency(fixedCostsAndArrangements)}) zijn momenteel hoger dan of gelijk aan je inkomen ({formatCurrency(totalIncome)}).
                </p>
                <div className="flex items-start gap-2 bg-amber-100 dark:bg-amber-500/15 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 !text-[18px] mt-0.5 flex-shrink-0">lightbulb</span>
                  <p className="text-amber-800 dark:text-amber-300 text-sm">
                    Bekijk je vaste lasten en betalingsregelingen om te zien waar je kunt besparen, of verhoog je inkomen door extra werk of toeslagen aan te vragen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NIBUD Comparison Chart */}
        {potjesChartData.length > 0 && (
          <section className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-6 md:p-8 shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2A3F36] relative group overflow-hidden">
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
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[300px] group cursor-pointer gap-4"
               onClick={() => setShowModal(true)}>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 !text-[32px]">add</span>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[#131d0c] dark:text-white">Potje Toevoegen</h3>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a1] mt-1">Maak een nieuw spaardoel of budget</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="bg-green-500 dark:bg-green-500 hover:bg-green-600 dark:hover:bg-green-400 text-white dark:text-[#0a0a0a] font-semibold px-6 py-3 rounded-xl shadow-sm transition-all"
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
            const isSavingsType = potje.pot_type === 'savings' || potje.pot_type === 'btw_reserve';
            const savingsProgress = isSavingsType && potje.target_amount
              ? Math.min(100, ((potje.current_amount || 0) / potje.target_amount) * 100)
              : 0;
            const savingsRemaining = isSavingsType
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
                  className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl ${potje.pot_type === 'btw_reserve' ? 'bg-amber-100 dark:bg-amber-500/20' : isSavingsType ? 'bg-green-100 dark:bg-green-500/20' : potje.name === 'Bad Habits' ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-blue-100 dark:bg-blue-500/20'} flex items-center justify-center text-2xl`}>
                      {potje.pot_type === 'btw_reserve' ? <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">account_balance</span> : (potje.icon || '💰')}
                    </div>
                    <span className={`${potje.pot_type === 'btw_reserve' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : isSavingsType ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1]'} text-xs font-semibold px-3 py-1 rounded-full`}>
                      {potje.pot_type === 'btw_reserve' ? 'BTW Reserve' : isSavingsType ? 'Sparen' : 'Uitgaven'}
                    </span>
                  </div>
                  
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-[#131d0c] dark:text-white mb-1">{potje.name}</h3>
                    {potje.description ? (
                      <p className="text-gray-500 dark:text-[#a1a1a1] text-sm italic">"{potje.description}"</p>
                    ) : (
                      <p className="text-gray-500 dark:text-[#a1a1a1] text-sm">&nbsp;</p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-[#a1a1a1]">
                      <span className="font-medium">{potje.pot_type === 'btw_reserve' ? 'Te reserveren:' : isSavingsType ? 'Doel:' : 'Budget:'}</span>
                      <span className="font-bold text-[#131d0c] dark:text-white">{formatCurrency(potje.pot_type === 'btw_reserve' ? (potje.target_amount || 0) : isSavingsType ? (potje.target_amount || 0) : (potje.monthly_budget || 0))}</span>
                    </div>

                    <div className="bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-3 w-full overflow-hidden">
                      {potje.pot_type === 'btw_reserve' ? (
                        <div
                          className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${savingsProgress}%` }}
                        ></div>
                      ) : isSavingsType ? (
                        <div
                          className="bg-green-500 dark:bg-green-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${savingsProgress}%` }}
                        ></div>
                      ) : (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${potjeProgress >= 100 ? 'bg-red-500 dark:bg-red-400' : potjeProgress >= 75 ? 'bg-orange-500 dark:bg-orange-400' : 'bg-blue-500 dark:bg-blue-400'}`}
                          style={{ width: `${Math.min(potjeProgress, 100)}%` }}
                        ></div>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-[#6b7280] block mb-1">
                          {potje.pot_type === 'btw_reserve' ? 'Gereserveerd' : isSavingsType ? 'Gespaard' : 'Uitgegeven'}
                        </span>
                        <span className={`text-2xl font-bold ${potje.pot_type === 'btw_reserve' ? 'text-amber-600 dark:text-amber-400' : isSavingsType ? 'text-green-600 dark:text-green-400' : 'text-[#131d0c] dark:text-white'}`}>
                          {isSavingsType ? formatCurrency(potje.current_amount || 0) : formatCurrency(spent)}
                        </span>
                      </div>
                      <div className="text-right">
                        {potje.pot_type === 'btw_reserve' ? (
                          <>
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold block">
                              Voor BTW aangifte
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#6b7280] mt-1 block flex items-center justify-end gap-1">
                              <span className="material-symbols-outlined !text-[14px]">event</span> Elk kwartaal
                            </span>
                          </>
                        ) : isSavingsType ? (
                          <>
                            <span className="text-sm text-gray-600 dark:text-[#a1a1a1] font-medium block">
                              Nog {formatCurrency(savingsRemaining)} te gaan
                            </span>
                            {potje.target_date && (
                              <span className="text-xs text-gray-500 dark:text-[#6b7280] mt-1 block flex items-center justify-end gap-1">
                                <span className="material-symbols-outlined !text-[14px]">flag</span> {new Date(potje.target_date).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                            {!potje.target_date && (
                              <span className="text-xs text-gray-500 dark:text-[#6b7280] mt-1 block flex items-center justify-end gap-1">
                                <span className="material-symbols-outlined !text-[14px]">flag</span> Geen datum
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={`text-sm font-semibold block ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} te veel` : `${formatCurrency(remaining)} over`}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-[#6b7280] mt-1 block flex items-center justify-end gap-1">
                              <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
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
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                        NIBUD: {nibudPercentage}%
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-[#2a2a2a]">
                    {potje.pot_type === 'btw_reserve' ? (
                      <button
                        onClick={() => handleViewActivity(potje)}
                        className="flex-1 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined !text-[18px]">receipt_long</span> Bekijk facturen
                      </button>
                    ) : isSavingsType ? (
                      <>
                        <button
                          onClick={() => handleOpenDeposit(potje)}
                          className="flex-1 bg-green-500 dark:bg-green-500 hover:bg-green-600 dark:hover:bg-green-400 text-white dark:text-[#0a0a0a] py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined !text-[18px]">add</span> Storten
                        </button>
                        <button
                          onClick={() => handleSelectPot(potje)}
                          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#3a3a3a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] transition-colors"
                        >
                          <span className="material-symbols-outlined !text-[20px]">edit</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleViewActivity(potje)}
                        className="flex-1 bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#3a3a3a] text-[#131d0c] dark:text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined !text-[18px]">receipt_long</span> Bekijk activiteit
                      </button>
                    )}
                  </div>
                </article>
            );
          })}

            {/* Add New Jar Card */}
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1a1a1a] hover:bg-green-50 dark:hover:bg-green-500/10 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[300px] group cursor-pointer gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] group-hover:bg-green-100 dark:group-hover:bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                <span className="material-symbols-outlined text-gray-400 dark:text-[#6b7280] group-hover:text-green-600 dark:group-hover:text-green-400 !text-[32px] transition-colors">add</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[#131d0c] dark:text-white">Potje Toevoegen</h3>
                <p className="text-sm text-gray-500 dark:text-[#a1a1a1] mt-1">Maak een nieuw spaardoel of budget</p>
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
