import React, { useState, useEffect, useCallback } from 'react';
import { Pot } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/components/utils/formatters';
import PotDepositModal from './PotDepositModal';
import PotPaymentModal from './PotPaymentModal';

const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

function PotIcon({ icon, className = "text-4xl" }) {
  if (!icon) return <span className={className}>📦</span>;
  if (emojiRegex.test(icon)) return <span className={className}>{icon}</span>;
  return <span className={`material-symbols-outlined ${className}`}>{icon}</span>;
}

export default function PotDetailModal({ pot, isOpen, onClose, onUpdate, spent = 0, onEdit, onViewActivity }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!pot) return;
    setLoading(true);
    try {
      const user = await User.me();
      if (!user?.id) return;

      const allTx = await Transaction.filter({ user_id: user.id });
      if (!Array.isArray(allTx)) {
        setTransactions([]);
        return;
      }

      let filtered;
      if (pot.pot_type === 'expense') {
        // For expense pots, filter by category matching pot name (current month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        filtered = allTx.filter(tx => {
          if (!tx?.date || !tx?.type || !tx?.category) return false;
          try {
            const txDate = new Date(tx.date);
            if (isNaN(txDate.getTime())) return false;
            const isInMonth = txDate >= monthStart && txDate <= monthEnd;
            const isExpense = tx.type === 'expense';
            const categoryMatches = tx.category?.toLowerCase() === pot.name?.toLowerCase();
            return isInMonth && isExpense && categoryMatches;
          } catch { return false; }
        });
      } else {
        // For savings/btw_reserve, filter by category matching pot name
        filtered = allTx.filter(tx => {
          if (!tx?.category) return false;
          return tx.category === pot.name;
        });
      }

      const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted.slice(0, 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [pot]);

  useEffect(() => {
    if (isOpen && pot) {
      fetchTransactions();
    }
  }, [isOpen, pot, fetchTransactions]);

  if (!isOpen || !pot) return null;

  const isExpense = pot.pot_type === 'expense';
  const isSavingsType = pot.pot_type === 'savings' || pot.pot_type === 'btw_reserve';
  const isReserved = pot.pot_type === 'btw_reserve';

  // Progress calculations
  const budget = parseFloat(pot.budget || pot.monthly_budget || 0);
  const current = isSavingsType ? (pot.current_amount || 0) : spent;
  const target = isSavingsType ? (pot.target_amount || 1) : (budget || 1);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const remaining = isSavingsType ? (target - current) : (budget - spent);
  const isCompleted = isSavingsType && progress >= 100;
  const isOverBudget = isExpense && remaining < 0;

  // Stroke for progress ring
  const circumference = 289;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Ring color
  const ringColorClass = isCompleted
    ? 'stroke-[#10B981]'
    : isReserved
    ? 'stroke-[#FF9900]'
    : isOverBudget
    ? 'stroke-red-500'
    : 'stroke-[#10B981]';

  // Icon color
  const iconColorClass = isCompleted
    ? 'text-[#10B981]'
    : isReserved
    ? 'text-[#FF9900]'
    : isOverBudget
    ? 'text-red-500'
    : 'text-[#3D6456] dark:text-[#10B981]';

  const handleWithdraw = async () => {
    const amount = prompt('Hoeveel wil je opnemen?');
    if (!amount || isNaN(parseFloat(amount))) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      toast({ title: 'Voer een geldig bedrag in', variant: 'destructive' });
      return;
    }

    if (withdrawAmount > (pot.current_amount || 0)) {
      toast({ title: 'Je kunt niet meer opnemen dan het huidige saldo', variant: 'destructive' });
      return;
    }

    try {
      await Pot.update(pot.id, {
        current_amount: (pot.current_amount || 0) - withdrawAmount
      });

      await Transaction.create({
        type: 'expense',
        amount: withdrawAmount,
        category: pot.name,
        description: `Opname uit ${pot.name}`,
        date: new Date().toISOString().split('T')[0],
      });

      toast({ title: `${formatCurrency(withdrawAmount)} opgenomen uit ${pot.name}` });
      onUpdate?.();
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast({ title: 'Fout bij opnemen', variant: 'destructive' });
    }
  };

  const handleDepositComplete = () => {
    setShowDepositModal(false);
    onUpdate?.();
  };

  const handlePaymentAdded = () => {
    setShowPaymentModal(false);
    onUpdate?.();
  };

  const handleDeleteTransaction = async (txId) => {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) return;
    try {
      await Transaction.delete(txId);
      toast({ title: 'Transactie verwijderd' });
      fetchTransactions();
      // Also trigger parent refresh for spending recalculation
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  // Generate month labels for chart
  const getMonthLabels = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('nl-NL', { month: 'short' }));
    }
    return months;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div
          className="bg-white dark:bg-[#1a1a1a] w-full max-w-[1100px] max-h-[90vh] rounded-[24px] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative flex flex-col overflow-hidden border border-gray-100 dark:border-[#2a2a2a]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-6 border-b border-gray-50 dark:border-[#2a2a2a] flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-[32px] text-[#1F2937] dark:text-white font-bold font-montserrat">{pot.name}</h1>
              <span className={`px-3 py-1 text-[12px] font-bold rounded tracking-wider uppercase ${
                isReserved
                  ? 'bg-orange-50 dark:bg-orange-500/10 text-[#FF9900]'
                  : isExpense
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-[#F3F4F6] dark:bg-[#10b98126] text-[#6B7280] dark:text-[#10B981]'
              }`}>
                {isReserved ? 'Gereserveerd' : isExpense ? 'Enveloppe' : pot.category || 'Sparen'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors group"
            >
              <span className="material-symbols-outlined text-[32px] text-[#6B7280] dark:text-[#a1a1a1] group-hover:text-[#1F2937] dark:group-hover:text-white">close</span>
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E5E7EB transparent' }}>
            {/* Progress Card */}
            <div className="bg-[#F8F8F8] dark:bg-[#2a2a2a] rounded-[24px] p-8 flex flex-col md:flex-row items-center gap-8 md:gap-12 border border-gray-100 dark:border-[#3a3a3a]">
              {/* Progress Ring */}
              <div className="relative size-32 flex-shrink-0">
                <svg className="size-full" viewBox="0 0 100 100">
                  <circle
                    className="stroke-white dark:stroke-[#1a1a1a]"
                    cx="50" cy="50" fill="none" r="46" strokeWidth="3"
                  />
                  <circle
                    className={ringColorClass}
                    cx="50" cy="50" fill="none" r="46"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="3"
                    style={{
                      transition: 'stroke-dashoffset 0.35s',
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50% 50%'
                    }}
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center ${iconColorClass}`}>
                  <PotIcon icon={pot.icon} className="text-4xl" />
                </div>
              </div>

              {/* Amount Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-[13px] font-bold text-[#9CA3AF] dark:text-[#a1a1a1] uppercase tracking-widest mb-1">
                  {isExpense ? 'Uitgegeven' : 'Huidig Saldo'}
                </p>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <h2 className={`text-4xl md:text-[48px] font-extrabold leading-none font-montserrat ${
                    isOverBudget ? 'text-red-500' : 'text-[#10B981]'
                  }`}>
                    {formatCurrency(current)}
                  </h2>
                  <span className="text-lg md:text-[20px] font-semibold text-[#9CA3AF] dark:text-[#6b7280]">
                    {isExpense ? `van ${formatCurrency(budget)}` : `van ${formatCurrency(target)}`}
                  </span>
                </div>
              </div>

              {/* Remaining Info */}
              <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-gray-200 dark:border-[#3a3a3a] pt-6 md:pt-0 md:pl-12">
                {isExpense ? (
                  <>
                    <p className={`text-[18px] font-semibold mb-1 ${
                      isOverBudget ? 'text-red-500' : 'text-[#1F2937] dark:text-white'
                    }`}>
                      {isOverBudget
                        ? `${formatCurrency(Math.abs(remaining))} tekort`
                        : budget > 0
                        ? `Nog ${formatCurrency(remaining)} over`
                        : 'Geen budget ingesteld'
                      }
                    </p>
                    <p className="text-[14px] text-[#6B7280] dark:text-[#a1a1a1]">
                      {budget > 0 ? `${Math.round(progress)}% gebruikt` : `${transactions.length} transacties deze maand`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[18px] font-semibold text-[#1F2937] dark:text-white mb-1">
                      {isCompleted ? 'Doel bereikt!' : `Nog ${formatCurrency(Math.max(0, remaining))} te gaan`}
                    </p>
                    {pot.target_date && (
                      <p className="text-[14px] text-[#6B7280] dark:text-[#a1a1a1]">
                        Streefdatum: {formatDate(pot.target_date)}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              {/* Chart Area */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                  <h3 className="text-[#1F2937] dark:text-white font-bold text-lg mb-6 font-montserrat">
                    {isExpense ? 'Uitgavenverloop' : 'Besparingsverloop'}
                  </h3>
                  <div className="h-64 flex flex-col justify-between">
                    <div className="relative w-full h-full flex-1">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
                        <defs>
                          <linearGradient id={`chartGrad-${pot.id}`} x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: isExpense ? '#3B82F6' : '#10B981', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: isExpense ? '#3B82F6' : '#10B981', stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>
                        {isExpense ? (
                          <>
                            {/* Budget line */}
                            {budget > 0 && (
                              <line x1="0" y1="40" x2="600" y2="40" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="8,4" />
                            )}
                            <path
                              d="M0,190 C50,185 100,175 150,165 S250,145 300,130 S400,110 450,95 S550,80 600,70 V200 H0 Z"
                              fill={`url(#chartGrad-${pot.id})`}
                              opacity="0.1"
                            />
                            <path
                              d="M0,190 C50,185 100,175 150,165 S250,145 300,130 S400,110 450,95 S550,80 600,70"
                              fill="none"
                              stroke="#3B82F6"
                              strokeLinecap="round"
                              strokeWidth="3"
                            />
                          </>
                        ) : (
                          <>
                            <path
                              d="M0,180 C50,175 100,160 150,155 S250,130 300,120 S400,90 450,85 S550,65 600,60 V200 H0 Z"
                              fill={`url(#chartGrad-${pot.id})`}
                              opacity="0.1"
                            />
                            <path
                              d="M0,180 C50,175 100,160 150,155 S250,130 300,120 S400,90 450,85 S550,65 600,60"
                              fill="none"
                              stroke="#10B981"
                              strokeLinecap="round"
                              strokeWidth="3"
                            />
                          </>
                        )}
                      </svg>
                    </div>
                    <div className="flex justify-between mt-4 text-[11px] font-bold text-[#9CA3AF] dark:text-[#6b7280] uppercase tracking-tighter">
                      {getMonthLabels().map((label, idx) => (
                        <span key={idx}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Insight */}
                <div className={`border rounded-[24px] p-6 ${
                  isExpense
                    ? 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20'
                    : 'bg-[#B2FF7810] dark:bg-[#10b9811a] border-[#10B981]'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${isExpense ? 'text-blue-500' : 'text-[#10B981]'}`}>auto_awesome</span>
                    <p className={`text-[15px] leading-relaxed ${
                      isExpense ? 'text-blue-700 dark:text-blue-400' : 'text-[#3D6456] dark:text-[#10B981]'
                    }`}>
                      {isExpense
                        ? isOverBudget
                          ? `Let op! Je hebt ${formatCurrency(Math.abs(remaining))} meer uitgegeven dan je budget. Probeer de komende dagen zuiniger te zijn.`
                          : budget > 0 && progress > 75
                          ? `Je hebt al ${Math.round(progress)}% van je budget gebruikt. Je hebt nog ${formatCurrency(remaining)} over voor deze maand.`
                          : budget > 0
                          ? `Goed bezig! Je hebt nog ${formatCurrency(remaining)} over van je budget. Dat is ${Math.round(100 - progress)}% van je maandbudget.`
                          : `Je hebt deze maand ${formatCurrency(spent)} uitgegeven aan ${pot.name}. Stel een budget in om je uitgaven bij te houden.`
                        : isCompleted
                        ? 'Gefeliciteerd! Je hebt je doel bereikt. Tijd voor een nieuw doel?'
                        : `Je bent op schema! Als je elke maand €25 extra opzij zet, bereik je je doel eerder.`
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] space-y-3">
                  <h3 className="text-xs font-bold text-[#9CA3AF] dark:text-[#6b7280] uppercase tracking-widest mb-4">Snelle Acties</h3>

                  {isExpense ? (
                    <>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full py-4 bg-[#3B82F6] text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">payment</span> Betaling Toevoegen
                      </button>
                      <button
                        onClick={() => onEdit?.(pot)}
                        className="w-full py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-[#3a3a3a] text-[#1F2937] dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span> Potje Bewerken
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowDepositModal(true)}
                        className="w-full py-4 bg-[#10B981] text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">add_circle</span> Storten
                      </button>
                      <button
                        onClick={handleWithdraw}
                        className="w-full py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-white text-[#1F2937] dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">remove_circle</span> Opnemen
                      </button>
                      <button
                        onClick={() => onEdit?.(pot)}
                        className="w-full py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-[#3a3a3a] text-[#1F2937] dark:text-[#a1a1a1] rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span> Doel Aanpassen
                      </button>
                    </>
                  )}
                </div>

                {/* Budget Overview for expense pots */}
                {isExpense && budget > 0 && (
                  <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                    <h3 className="text-xs font-bold text-[#9CA3AF] dark:text-[#6b7280] uppercase tracking-widest mb-4">Budget Overzicht</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#6B7280] dark:text-[#a1a1a1]">Maandbudget</span>
                        <span className="font-bold text-[#1F2937] dark:text-white">{formatCurrency(budget)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#6B7280] dark:text-[#a1a1a1]">Uitgegeven</span>
                        <span className="font-bold text-red-500">{formatCurrency(spent)}</span>
                      </div>
                      <div className="h-px bg-gray-100 dark:bg-[#3a3a3a]" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#6B7280] dark:text-[#a1a1a1]">Resterend</span>
                        <span className={`font-extrabold text-lg ${isOverBudget ? 'text-red-500' : 'text-[#10B981]'}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-gray-100 dark:bg-[#3a3a3a] rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-[#3B82F6]'}`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pt-4 pb-4">
              <h3 className="text-[20px] font-bold text-[#1F2937] dark:text-white mb-6 font-montserrat">
                {isExpense ? 'Uitgaven deze Maand' : 'Recente Activiteit'}
              </h3>
              <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] overflow-hidden shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                {loading ? (
                  <div className="p-8 text-center text-[#6B7280] dark:text-[#a1a1a1]">Laden...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-[#6B7280] dark:text-[#a1a1a1]">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 block mb-2">
                      {isExpense ? 'receipt_long' : 'savings'}
                    </span>
                    {isExpense ? 'Nog geen uitgaven deze maand' : 'Nog geen activiteit'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                    {transactions.map((tx, idx) => {
                      const isIncome = tx.type === 'income' || tx.description?.includes('Storting');
                      return (
                        <div key={tx.id || idx} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-full flex items-center justify-center ${
                              isIncome
                                ? 'bg-[#10B981]/10 text-[#10B981]'
                                : 'bg-gray-100 dark:bg-white/5 text-[#6B7280] dark:text-[#a1a1a1]'
                            }`}>
                              <span className="material-symbols-outlined">
                                {isIncome ? 'add' : 'remove'}
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-[#1F2937] dark:text-white">{tx.description || 'Transactie'}</p>
                              <p className="text-sm text-[#6B7280] dark:text-[#a1a1a1]">{formatDate(tx.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={`font-bold text-lg ${
                              isIncome
                                ? 'text-[#10B981]'
                                : 'text-[#1F2937] dark:text-white'
                            }`}>
                              {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTransaction(tx.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal (for savings pots) */}
      <PotDepositModal
        pot={pot}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposited={handleDepositComplete}
      />

      {/* Payment Modal (for expense pots) */}
      <PotPaymentModal
        pot={pot}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentAdded={handlePaymentAdded}
      />
    </>
  );
}
