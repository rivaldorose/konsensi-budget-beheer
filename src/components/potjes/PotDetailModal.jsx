import React, { useState, useEffect, useCallback } from 'react';
import { Pot } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/components/utils/formatters';
import PotDepositModal from './PotDepositModal';

const POT_ICONS = {
  'flight_takeoff': 'Reizen',
  'home': 'Huis',
  'directions_car': 'Vervoer',
  'devices': 'Tech',
  'redeem': 'Cadeaus',
  'shield': 'Noodfonds',
  'school': 'Educatie',
  'celebration': 'Feesten',
  'savings': 'Sparen',
  'lock': 'Gereserveerd',
};

export default function PotDetailModal({ pot, isOpen, onClose, onUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    if (!pot) return;
    setLoading(true);
    try {
      const allTx = await Transaction.filter({ category: pot.name });
      // Sort by date descending
      const sorted = (allTx || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted.slice(0, 10)); // Last 10 transactions
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

  const isSavingsType = pot.pot_type === 'savings' || pot.pot_type === 'btw_reserve';
  const current = isSavingsType ? (pot.current_amount || 0) : 0;
  const target = isSavingsType ? (pot.target_amount || 1) : (pot.monthly_budget || 1);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const remaining = target - current;
  const isCompleted = progress >= 100;

  // Calculate stroke-dashoffset for progress ring (circumference = 2 * PI * r = 2 * 3.14159 * 46 ≈ 289)
  const circumference = 289;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get icon
  const getPotIcon = () => {
    if (pot.pot_type === 'btw_reserve') return 'lock';
    const iconMatch = Object.entries(POT_ICONS).find(([icon, label]) =>
      pot.name?.toLowerCase().includes(label.toLowerCase())
    );
    return iconMatch?.[0] || 'flight_takeoff';
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = async () => {
    const amount = prompt('Hoeveel wil je opnemen?');
    if (!amount || isNaN(parseFloat(amount))) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      toast({ title: 'Voer een geldig bedrag in', variant: 'destructive' });
      return;
    }

    if (withdrawAmount > current) {
      toast({ title: 'Je kunt niet meer opnemen dan het huidige saldo', variant: 'destructive' });
      return;
    }

    try {
      await Pot.update(pot.id, {
        current_amount: current - withdrawAmount
      });

      // Record transaction
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
    fetchTransactions();
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div
          className="bg-white dark:bg-[#1a1a1a] w-full max-w-[1100px] max-h-[90vh] rounded-[24px] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative flex flex-col overflow-hidden border border-gray-100 dark:border-[#2a2a2a]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-6 border-b border-gray-50 dark:border-[#2a2a2a] flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-[32px] text-[#1F2937] dark:text-white font-bold font-montserrat">{pot.name}</h1>
              <span className="px-3 py-1 bg-[#F3F4F6] dark:bg-[#10b98126] text-[#6B7280] dark:text-[#10B981] text-[12px] font-bold rounded tracking-wider uppercase">
                {pot.category || (isSavingsType ? 'Sparen' : 'Uitgaven')}
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
                    className={`${isCompleted ? 'stroke-[#10B981]' : pot.pot_type === 'btw_reserve' ? 'stroke-[#FF9900]' : 'stroke-[#10B981]'}`}
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
                <div className="absolute inset-0 flex items-center justify-center text-[#3D6456] dark:text-[#10B981]">
                  <span className="material-symbols-outlined text-4xl">{getPotIcon()}</span>
                </div>
              </div>

              {/* Amount Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-[13px] font-bold text-[#9CA3AF] dark:text-[#a1a1a1] uppercase tracking-widest mb-1">Huidig Saldo</p>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <h2 className="text-4xl md:text-[48px] text-[#10B981] font-extrabold leading-none font-montserrat">
                    {formatCurrency(current)}
                  </h2>
                  <span className="text-lg md:text-[20px] font-semibold text-[#9CA3AF] dark:text-[#6b7280]">
                    van {formatCurrency(target)}
                  </span>
                </div>
              </div>

              {/* Remaining Info */}
              <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-gray-200 dark:border-[#3a3a3a] pt-6 md:pt-0 md:pl-12">
                <p className="text-[18px] font-semibold text-[#1F2937] dark:text-white mb-1">
                  {isCompleted ? 'Doel bereikt!' : `Nog ${formatCurrency(Math.max(0, remaining))} te gaan`}
                </p>
                {pot.target_date && (
                  <p className="text-[14px] text-[#6B7280] dark:text-[#a1a1a1]">
                    Streefdatum: {formatDate(pot.target_date)}
                  </p>
                )}
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              {/* Chart Area */}
              <div className="space-y-8">
                <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                  <h3 className="text-[#1F2937] dark:text-white font-bold text-lg mb-6 font-montserrat">Besparingsverloop</h3>
                  <div className="h-64 flex flex-col justify-between">
                    <div className="relative w-full h-full flex-1">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
                        <defs>
                          <linearGradient id="chartGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,180 C50,175 100,160 150,155 S250,130 300,120 S400,90 450,85 S550,65 600,60 V200 H0 Z"
                          fill="url(#chartGrad)"
                          opacity="0.1"
                        />
                        <path
                          d="M0,180 C50,175 100,160 150,155 S250,130 300,120 S400,90 450,85 S550,65 600,60"
                          fill="none"
                          stroke="#10B981"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between mt-4 text-[11px] font-bold text-[#9CA3AF] dark:text-[#6b7280] uppercase tracking-tighter">
                      <span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Insight */}
                <div className="bg-[#B2FF7810] dark:bg-[#10b9811a] border border-[#10B981] rounded-[24px] p-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#10B981]">auto_awesome</span>
                    <p className="text-[15px] leading-relaxed text-[#3D6456] dark:text-[#10B981]">
                      {isCompleted
                        ? 'Gefeliciteerd! Je hebt je doel bereikt. Tijd voor een nieuw doel?'
                        : `Je bent op schema! Als je elke maand €25 extra opzij zet, bereik je je doel eerder.`
                      }
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] space-y-3">
                  <h3 className="text-xs font-bold text-[#9CA3AF] dark:text-[#6b7280] uppercase tracking-widest mb-4">Snelle Acties</h3>
                  <button
                    onClick={handleDeposit}
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
                    onClick={onClose}
                    className="w-full py-4 bg-white dark:bg-transparent border border-gray-200 dark:border-[#3a3a3a] text-[#1F2937] dark:text-[#a1a1a1] rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span> Doel Aanpassen
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pt-4 pb-4">
              <h3 className="text-[20px] font-bold text-[#1F2937] dark:text-white mb-6 font-montserrat">Recente Activiteit</h3>
              <div className="bg-white dark:bg-[#2a2a2a] border border-gray-100 dark:border-[#3a3a3a] rounded-[24px] overflow-hidden shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)]">
                {loading ? (
                  <div className="p-8 text-center text-[#6B7280] dark:text-[#a1a1a1]">Laden...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-[#6B7280] dark:text-[#a1a1a1]">Nog geen activiteit</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-[#3a3a3a]">
                    {transactions.map((tx, idx) => (
                      <div key={tx.id || idx} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`size-10 rounded-full flex items-center justify-center ${
                            tx.type === 'income' || tx.description?.includes('Storting')
                              ? 'bg-[#10B981]/10 text-[#10B981]'
                              : 'bg-gray-100 dark:bg-white/5 text-[#6B7280] dark:text-[#a1a1a1]'
                          }`}>
                            <span className="material-symbols-outlined">
                              {tx.type === 'income' || tx.description?.includes('Storting') ? 'add' : 'remove'}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-[#1F2937] dark:text-white">{tx.description || 'Transactie'}</p>
                            <p className="text-sm text-[#6B7280] dark:text-[#a1a1a1]">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                        <p className={`font-bold text-lg ${
                          tx.type === 'income' || tx.description?.includes('Storting')
                            ? 'text-[#10B981]'
                            : 'text-[#1F2937] dark:text-white'
                        }`}>
                          {tx.type === 'income' || tx.description?.includes('Storting') ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      <PotDepositModal
        pot={pot}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposited={handleDepositComplete}
      />
    </>
  );
}
