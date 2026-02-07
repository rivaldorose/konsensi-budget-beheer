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

const POT_ICONS = [
  { icon: 'flight_takeoff', label: 'Reizen' },
  { icon: 'home', label: 'Huis' },
  { icon: 'directions_car', label: 'Vervoer' },
  { icon: 'devices', label: 'Tech' },
  { icon: 'redeem', label: 'Cadeaus' },
  { icon: 'shield', label: 'Noodfonds' },
  { icon: 'school', label: 'Educatie' },
  { icon: 'celebration', label: 'Feesten' },
];

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
  const { toast } = useToast();

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

      let allPots = [];
      let allIncomes = [];
      let allCosts = [];
      let allDebts = [];
      let allTransactions = [];

      try {
        allPots = await Pot.filter(userFilter);
      } catch (err) {
        console.error('Pot.filter error:', err);
        allPots = [];
      }

      try {
        allIncomes = await Income.filter(userFilter);
      } catch (err) {
        console.error('Income.filter error:', err);
        allIncomes = [];
      }

      try {
        allCosts = await MonthlyCost.filter(userFilter);
      } catch (err) {
        console.error('MonthlyCost.filter error:', err);
        allCosts = [];
      }

      try {
        allDebts = await Debt.filter(userFilter);
      } catch (err) {
        console.error('Debt.filter error:', err);
        allDebts = [];
      }

      try {
        allTransactions = await Transaction.filter(userFilter);
      } catch (err) {
        console.error('Transaction.filter error:', err);
        allTransactions = [];
      }

      allPots = Array.isArray(allPots) ? allPots.filter(item => item && typeof item === 'object') : [];
      allIncomes = Array.isArray(allIncomes) ? allIncomes.filter(item => item && typeof item === 'object') : [];
      allCosts = Array.isArray(allCosts) ? allCosts.filter(item => item && typeof item === 'object') : [];
      allDebts = Array.isArray(allDebts) ? allDebts.filter(item => item && typeof item === 'object') : [];
      allTransactions = Array.isArray(allTransactions) ? allTransactions.filter(item => item && typeof item === 'object') : [];

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

      try {
        const vtbl = await vtblService.calculateVtbl(allIncomes, allCosts, allDebts);
        if (vtbl && typeof vtbl === 'object') {
          vtbl.vasteLasten = totalFixedCosts;
          vtbl.huidigeRegelingen = activeDebtPayments;
          setVtblData(vtbl);
        } else {
          setVtblData({
            vasteLasten: totalFixedCosts,
            huidigeRegelingen: activeDebtPayments,
            vrij: 0
          });
        }
      } catch (vtblErr) {
        console.error('Error calculating VTBL:', vtblErr);
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
              if (!tx || typeof tx !== 'object') return false;
              if (!tx.date || !tx.type || !tx.category) return false;

              try {
                const txDate = new Date(tx.date);
                if (isNaN(txDate.getTime())) return false;

                const isInMonth = txDate >= monthStart && txDate <= monthEnd;
                const isExpense = tx.type === 'expense';
                const categoryMatches = tx.category === pot.name;
                return isInMonth && isExpense && categoryMatches;
              } catch (err) {
                return false;
              }
            });
            const totalSpent = potTransactions.reduce((sum, tx) => {
              const amount = parseFloat(tx?.amount);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            spendingsMap[pot.id] = totalSpent;
          } catch (err) {
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
              message: `🎉 ${pot.icon} ${pot.name} doel bereikt!`
            });
          } else if (progress >= 75) {
            notifications.push({
              type: 'info',
              message: `🎯 ${pot.icon} ${pot.name} is bijna vol!`
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
            message: `${pot.icon} ${pot.name} is bijna op`
          });
        } else if (remaining < 0) {
          notifications.push({
            type: 'danger',
            message: `${pot.icon} ${pot.name} heeft een tekort`
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

  // Calculate total savings
  const totalSavings = useMemo(() => {
    if (!Array.isArray(potjes)) return 0;
    return potjes
      .filter(p => p && (p.pot_type === 'savings' || p.pot_type === 'btw_reserve'))
      .reduce((sum, pot) => sum + (pot.current_amount || 0), 0);
  }, [potjes]);

  // Get next goal (closest to completion)
  const nextGoal = useMemo(() => {
    if (!Array.isArray(potjes)) return null;
    const savingsPots = potjes.filter(p => p && p.pot_type === 'savings' && p.target_amount > 0);
    if (savingsPots.length === 0) return null;

    return savingsPots.reduce((closest, pot) => {
      const progress = (pot.current_amount || 0) / pot.target_amount * 100;
      const closestProgress = closest ? (closest.current_amount || 0) / closest.target_amount * 100 : 0;
      if (progress < 100 && (!closest || progress > closestProgress)) {
        return pot;
      }
      return closest;
    }, null);
  }, [potjes]);

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

  // Get icon for pot
  const getPotIcon = (pot) => {
    if (pot.pot_type === 'btw_reserve') return 'lock';
    if (pot.pot_type === 'savings') {
      const iconMatch = POT_ICONS.find(i => pot.name?.toLowerCase().includes(i.label.toLowerCase()));
      return iconMatch?.icon || 'savings';
    }
    return 'account_balance_wallet';
  };

  // Calculate progress for circular ring
  const getProgressOffset = (current, target) => {
    if (!target || target <= 0) return 100;
    const progress = Math.min(100, (current / target) * 100);
    return 100 - progress;
  };

  // Get status badge for pot
  const getPotStatus = (pot) => {
    if (pot.pot_type === 'btw_reserve') {
      return { label: 'Gereserveerd', color: 'warning' };
    }
    if (pot.pot_type === 'savings') {
      const progress = pot.target_amount ? (pot.current_amount || 0) / pot.target_amount * 100 : 0;
      if (progress >= 100) {
        return { label: 'Voltooid', color: 'success' };
      }
      return { label: pot.category || 'Sparen', color: 'default' };
    }
    return { label: pot.category || 'Uitgaven', color: 'default' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#3D6456]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-red-500 !text-[40px]">warning</span>
        </div>
        <h2 className="text-2xl font-bold text-[#3D6456] dark:text-white mb-2">Fout bij laden</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{error}</p>
        <button onClick={fetchData} className="bg-[#10B981] text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#10B981]/20 hover:-translate-y-0.5 transition-all">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  if (!totalIncome || totalIncome === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-dark-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-amber-500 !text-[40px]">warning</span>
        </div>
        <h2 className="text-2xl font-bold text-[#3D6456] dark:text-white mb-2">Geen inkomen ingevoerd</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          Om je potjes in te kunnen stellen heb je eerst inkomen nodig.
        </p>
        <button
          onClick={() => window.location.href = createPageUrl('Income')}
          className="bg-[#10B981] text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-[#10B981]/20 hover:-translate-y-0.5 transition-all"
        >
          Inkomen invoeren
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-dark-bg">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 py-6 space-y-8">

        {/* Budget Distribution Bar */}
        <section className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03),0_2px_8px_-2px_rgba(0,0,0,0.02)] p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <h3 className="text-[#3D6456] dark:text-primary-green text-sm font-extrabold uppercase tracking-tight">Budget Verdeling</h3>
            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#3D6456]"></span>
                Vast: {formatCurrency(fixedCostsAndArrangements)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#b2ff78]"></span>
                Potjes: {formatCurrency(totalAllocated)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                Vrij: {formatCurrency(Math.max(0, availableForPots - totalAllocated))}
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full flex overflow-hidden">
            <div
              className="h-full bg-[#3D6456]"
              style={{ width: `${totalIncome > 0 ? (fixedCostsAndArrangements / totalIncome) * 100 : 0}%` }}
            ></div>
            <div
              className="h-full bg-[#b2ff78]"
              style={{ width: `${totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0}%` }}
            ></div>
            <div
              className="h-full bg-gray-200 dark:bg-gray-600"
              style={{ width: `${totalIncome > 0 ? (Math.max(0, availableForPots - totalAllocated) / totalIncome) * 100 : 0}%` }}
            ></div>
          </div>
        </section>

        {/* Hero Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Savings Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-[#3D6456] to-[#2D4A40] rounded-2xl p-8 flex justify-between items-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Totaal Spaarsaldo</p>
              <h2 className="text-4xl md:text-5xl font-black">{formatCurrency(totalSavings)}</h2>
              <p className="text-[#b2ff78] text-sm font-bold mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                {sortedPotjes.filter(p => p.pot_type === 'savings').length} spaarpotjes actief
              </p>
            </div>
            <div className="w-48 h-20 relative z-10 opacity-40">
              <svg className="w-full h-full" viewBox="0 0 200 60">
                <path d="M0,50 Q25,45 50,30 T100,25 T150,10 T200,5" fill="none" stroke="white" strokeLinecap="round" strokeWidth="3"></path>
              </svg>
            </div>
            <div className="absolute right-[-5%] bottom-[-20%] size-64 bg-[#b2ff78]/10 rounded-full blur-3xl"></div>
          </div>

          {/* Next Goal Card */}
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 border border-gray-100 dark:border-dark-border shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03),0_2px_8px_-2px_rgba(0,0,0,0.02)] flex flex-col justify-center">
            <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Volgende Doel</p>
            {nextGoal ? (
              <>
                <h3 className="text-[#3D6456] dark:text-white text-2xl font-black">{nextGoal.name}</h3>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981]"
                      style={{ width: `${nextGoal.target_amount ? Math.min(100, (nextGoal.current_amount || 0) / nextGoal.target_amount * 100) : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-[#3D6456] dark:text-white">
                    {nextGoal.target_amount ? Math.round((nextGoal.current_amount || 0) / nextGoal.target_amount * 100) : 0}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[#3D6456] dark:text-white text-xl font-black">Geen doel</h3>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Maak een spaarpotje aan</p>
              </>
            )}
          </div>
        </section>

        {/* Potjes Grid Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[#3D6456] dark:text-white text-xl font-extrabold">Mijn Potjes</h3>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-card-elevated rounded text-gray-400 dark:text-gray-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">info</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedPotjes.map(pot => {
              const isSavingsType = pot.pot_type === 'savings' || pot.pot_type === 'btw_reserve';
              const spent = potjeSpendings[pot.id] || 0;
              const progress = isSavingsType
                ? (pot.target_amount ? Math.min(100, (pot.current_amount || 0) / pot.target_amount * 100) : 0)
                : (pot.monthly_budget ? Math.min(100, spent / pot.monthly_budget * 100) : 0);
              const remaining = isSavingsType
                ? (pot.target_amount || 0) - (pot.current_amount || 0)
                : (pot.monthly_budget || 0) - spent;
              const status = getPotStatus(pot);
              const isCompleted = isSavingsType && progress >= 100;
              const isReserved = pot.pot_type === 'btw_reserve';

              return (
                <div
                  key={pot.id}
                  className={`bg-white dark:bg-dark-card rounded-xl p-5 border ${
                    isReserved
                      ? 'border-2 border-[#FF9900]/10 hover:border-[#FF9900]/30'
                      : 'border-gray-100 dark:border-dark-border hover:border-[#b2ff78]/50'
                  } shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03),0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all group cursor-pointer`}
                  onClick={() => handleSelectPot(pot)}
                >
                  {/* Header with Icon and Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="relative size-12">
                      <svg className="size-full" viewBox="0 0 36 36">
                        <circle
                          className="stroke-gray-100 dark:stroke-gray-700"
                          cx="18" cy="18" fill="none" r="16" strokeWidth="2"
                        ></circle>
                        <circle
                          className={`${
                            isCompleted ? 'stroke-[#10B981]' :
                            isReserved ? 'stroke-[#FF9900]' :
                            'stroke-[#10B981]'
                          }`}
                          cx="18" cy="18" fill="none" r="16"
                          strokeDasharray="100"
                          strokeDashoffset={getProgressOffset(
                            isSavingsType ? (pot.current_amount || 0) : spent,
                            isSavingsType ? (pot.target_amount || 1) : (pot.monthly_budget || 1)
                          )}
                          strokeWidth="2"
                          style={{
                            transition: 'stroke-dashoffset 0.35s',
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%'
                          }}
                        ></circle>
                      </svg>
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        isCompleted ? 'text-[#10B981]' :
                        isReserved ? 'text-[#FF9900]' :
                        'text-[#3D6456] dark:text-white'
                      } group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-lg">{getPotIcon(pot)}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${
                      status.color === 'success'
                        ? 'text-[#10B981] bg-[#10B981]/10'
                        : status.color === 'warning'
                        ? 'text-[#FF9900] bg-orange-50 dark:bg-orange-500/10'
                        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800'
                    }`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Content */}
                  <h4 className="text-[#3D6456] dark:text-white text-base font-bold mb-1 truncate">{pot.name}</h4>
                  <p className="text-[#3D6456] dark:text-white text-lg font-extrabold mb-1">
                    {formatCurrency(isSavingsType ? (pot.current_amount || 0) : spent)}
                    <span className="text-gray-300 dark:text-gray-600 text-xs font-normal">
                      {' '}/ {formatCurrency(isSavingsType ? (pot.target_amount || 0) : (pot.monthly_budget || 0))}
                    </span>
                  </p>
                  <p className={`text-[11px] font-bold flex items-center gap-1 ${
                    isCompleted
                      ? 'text-[#10B981]'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <>
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Doel bereikt
                      </>
                    ) : isReserved ? (
                      `Vrij op ${pot.target_date ? new Date(pot.target_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : 'onbekend'}`
                    ) : isSavingsType ? (
                      `Nog ${formatCurrency(remaining)} te gaan`
                    ) : remaining >= 0 ? (
                      `Nog ${formatCurrency(remaining)} over`
                    ) : (
                      <span className="text-red-500">{formatCurrency(Math.abs(remaining))} tekort</span>
                    )}
                  </p>
                </div>
              );
            })}

            {/* Add New Pot Card */}
            <div
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#b2ff78] hover:bg-white dark:hover:bg-dark-card transition-all group min-h-[180px]"
              onClick={() => setShowModal(true)}
            >
              <div className="size-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600 mb-2 group-hover:bg-[#b2ff78]/20 group-hover:text-[#3D6456]">
                <span className="material-symbols-outlined text-xl">add</span>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-xs font-bold group-hover:text-[#3D6456] dark:group-hover:text-white">Nieuw Potje</p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#3D6456] text-white p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold text-sm">Nieuw Spaardoel</span>
        </button>
      </div>

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
