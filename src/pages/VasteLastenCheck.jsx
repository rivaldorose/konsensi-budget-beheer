import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Income } from "@/api/entities";
import { Pot } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { gamificationService, XP_REWARDS } from "@/services/gamificationService";

export default function VasteLastenCheck() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [duePayments, setDuePayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [financialOverview, setFinancialOverview] = useState({
    nextIncome: 0,
    otherExpenses: 0,
    availableAfterSalary: 0
  });
  const [potjes, setPotjes] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [selectedPotje, setSelectedPotje] = useState(null);
  const { toast } = useToast();

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setUser(userData);

      // Load monthly costs
      const costs = await MonthlyCost.filter({ user_id: userData.id });

      // Get today's date and tomorrow's date
      const today = new Date();
      const currentDay = today.getDate();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDate();

      // Get the current month's last day to handle month boundaries
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      // Filter costs that are due tomorrow OR today (show 1 day before AND on the day)
      // Only show active costs that haven't been paid this month
      const dueSoon = costs.filter(cost => {
        if (cost.status !== 'actief') return false;

        const paymentDay = parseInt(cost.payment_date);
        if (isNaN(paymentDay)) return false;

        // Check if already paid this month
        if (cost.last_paid) {
          const lastPaid = new Date(cost.last_paid);
          if (lastPaid.getMonth() === today.getMonth() && lastPaid.getFullYear() === today.getFullYear()) {
            return false; // Already paid this month
          }
        }

        // Check if due tomorrow or today
        // Handle month boundary: if today is the last day of month and payment_date > lastDayOfMonth
        const effectivePaymentDay = Math.min(paymentDay, lastDayOfMonth);

        return effectivePaymentDay === currentDay || effectivePaymentDay === tomorrowDay;
      });

      // Map the due payments with correct date formatting
      const mappedPayments = dueSoon.map(cost => {
        const paymentDay = Math.min(parseInt(cost.payment_date), lastDayOfMonth);
        const dueDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);

        return {
          id: cost.id,
          name: cost.name || 'Onbekende kosten',
          amount: parseFloat(cost.amount) || 0,
          category: cost.category || 'Overig',
          payment_day: paymentDay,
          due_date: dueDate.toISOString(),
          is_today: paymentDay === currentDay,
          is_tomorrow: paymentDay === tomorrowDay
        };
      });

      // Sort: today's payments first, then tomorrow's
      mappedPayments.sort((a, b) => {
        if (a.is_today && !b.is_today) return -1;
        if (!a.is_today && b.is_today) return 1;
        return a.payment_day - b.payment_day;
      });

      setDuePayments(mappedPayments);

      // Load income for next payment
      const incomes = await Income.filter({ user_id: userData.id });
      const nextIncome = incomes
        .filter(i => i.income_type === 'vast' && i.is_active !== false)
        .reduce((sum, i) => sum + (i.monthly_equivalent || i.amount || 0), 0);

      // Calculate other expenses (excluding the current payment)
      const currentPaymentId = mappedPayments[0]?.id;
      const otherExpenses = costs
        .filter(c => c.id !== currentPaymentId && (c.status === 'actief' || c.status === 'active' || c.is_active === true))
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

      const currentPaymentAmount = mappedPayments[0]?.amount || 0;
      const availableAfterSalary = nextIncome - otherExpenses - currentPaymentAmount;

      setFinancialOverview({
        nextIncome,
        otherExpenses,
        availableAfterSalary
      });

      // Load potjes
      const userPotjes = await Pot.filter({ user_id: userData.id });
      setPotjes(userPotjes);

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

  const handlePaid = async (payment) => {
    try {
      // Mark payment as paid
      await MonthlyCost.update(payment.id, {
        last_paid: new Date().toISOString(),
        payment_status: 'paid'
      });

      // Award XP for paying fixed cost
      let xpAwarded = 0;
      try {
        if (user?.id) {
          await gamificationService.addXP(user.id, XP_REWARDS.FIXED_COST_PAID, "fixed_cost_paid");
          xpAwarded = XP_REWARDS.FIXED_COST_PAID;
        }
      } catch (xpError) {
        console.error("Error awarding XP:", xpError);
      }

      toast({
        title: 'Betaling gemarkeerd als betaald',
        description: `${payment.name} is succesvol gemarkeerd.${xpAwarded > 0 ? ` +${xpAwarded} XP` : ''}`
      });
      loadData();
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij opslaan'
      });
    }
  };

  const handleNotPaid = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSolutionSelect = (solution, potjeId = null) => {
    setSelectedSolution(solution);
    setSelectedPotje(potjeId);
  };

  const handleConfirmSolution = async () => {
    if (!selectedSolution) {
      toast({
        variant: 'destructive',
        title: 'Selecteer een oplossing'
      });
      return;
    }

    try {
      if (selectedSolution === 'potje' && selectedPotje) {
        // Deduct from potje
        const potje = potjes.find(p => p.id === selectedPotje);
        if (potje && potje.balance >= selectedPayment.amount) {
          await Pot.update(selectedPotje, {
            balance: potje.balance - selectedPayment.amount
          });
          toast({
            title: 'Betaling voltooid',
            description: `€${selectedPayment.amount.toFixed(2)} is afgeschreven van ${potje.name}.`
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Onvoldoende saldo',
            description: `Het potje heeft niet genoeg saldo.`
          });
          return;
        }
      } else if (selectedSolution === 'reserve') {
        // Use general reserve (would need to implement reserve logic)
        toast({
          title: 'Reserve gebruikt',
          description: 'De betaling is betaald uit de algemene reserve.'
        });
      } else if (selectedSolution === 'uitstel') {
        // Request deferral
        toast({
          title: 'Uitstel aangevraagd',
          description: 'Je hebt uitstel aangevraagd bij de schuldeiser.'
        });
      }

      // Mark payment as handled
      await MonthlyCost.update(selectedPayment.id, {
        payment_status: 'postponed',
        payment_solution: selectedSolution
      });

      setShowPaymentModal(false);
      setSelectedPayment(null);
      setSelectedSolution(null);
      setSelectedPotje(null);
      loadData();
    } catch (error) {
      console.error("Error processing solution:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij verwerken oplossing'
      });
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nl-NL', { 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary"></div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  const currentPayment = duePayments[0] || null;

  // Check if there are no due payments
  if (!currentPayment) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col">
        <main className="flex-grow flex flex-col items-center justify-center py-12 px-4">
          <div className="w-full max-w-[600px] text-center">
            <div className="size-20 mx-auto mb-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
            </div>
            <h1 className="text-[#1F2937] dark:text-white text-3xl font-extrabold mb-4">Alles onder controle!</h1>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg mb-8">
              Je hebt geen vaste lasten die vandaag of morgen betaald moeten worden.
            </p>
            <button
              className="px-8 py-3 bg-primary dark:bg-primary text-white rounded-[24px] font-bold hover:bg-[#0e9f6e] dark:hover:bg-primary/80 transition-colors"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
            >
              Terug naar Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col">
      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 px-4">
        {/* Page Header */}
        <div className="w-full max-w-[800px] text-center mb-8">
          <h1 className="text-[#1F2937] dark:text-white text-4xl font-extrabold leading-tight tracking-tight mb-3">Vaste Lasten Check</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg font-normal">
            Tijd om je vaste lasten te controleren voor {monthNames[currentMonth.getMonth()]}.
          </p>
        </div>

        {/* Main Check Card */}
        <div className="w-full max-w-[800px] bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-[#2a2a2a]">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">event_available</span>
              </div>
              <div>
                <p className="text-[#1F2937] dark:text-white text-xl font-bold">{currentPayment.name}</p>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium md:hidden">
                  Vervaldatum: {formatDate(currentPayment.due_date)}
                </p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[#1F2937] dark:text-white text-2xl font-bold">{formatCurrency(currentPayment.amount)}</p>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">
                Vervaldatum: {formatDate(currentPayment.due_date)}
              </p>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`mb-8 flex items-center gap-3 p-4 rounded-[16px] border-l-4 ${
            currentPayment.is_today
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500'
              : 'bg-blue-50 dark:bg-blue-500/10 border-blue-500'
          }`}>
            <span className={`material-symbols-outlined ${
              currentPayment.is_today ? 'text-amber-500' : 'text-blue-500'
            }`}>info</span>
            <p className={`text-sm font-bold ${
              currentPayment.is_today
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-blue-700 dark:text-blue-400'
            }`}>
              {currentPayment.is_today
                ? 'Deze betaling is vandaag verschuldigd.'
                : 'Deze betaling is morgen verschuldigd.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="flex-1 max-w-[240px] cursor-pointer items-center justify-center rounded-[24px] h-12 px-8 bg-primary text-white text-base font-bold hover:bg-[#0e9f6e] transition-colors shadow-sm flex gap-2 mx-auto sm:mx-0"
              onClick={() => handlePaid(currentPayment)}
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>Ja, betaald</span>
            </button>
            <button
              className="flex-1 max-w-[240px] cursor-pointer items-center justify-center rounded-[24px] h-12 px-8 bg-transparent border-2 border-gray-200 dark:border-[#3a3a3a] text-[#6B7280] dark:text-[#9CA3AF] text-base font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#4a4a4a] transition-colors flex gap-2 mx-auto sm:mx-0"
              onClick={() => handleNotPaid(currentPayment)}
            >
              <span className="material-symbols-outlined">cancel</span>
              <span>Nee, niet betaald</span>
            </button>
          </div>
        </div>

        {/* Show remaining payments if there are more */}
        {duePayments.length > 1 && (
          <div className="w-full max-w-[800px] mt-6">
            <h3 className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-bold uppercase tracking-wider mb-3">
              Nog {duePayments.length - 1} andere betaling{duePayments.length > 2 ? 'en' : ''} binnenkort
            </h3>
            <div className="space-y-3">
              {duePayments.slice(1).map(payment => (
                <div
                  key={payment.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-[16px] p-4 border border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#6B7280] dark:text-[#9CA3AF] text-xl">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-[#1F2937] dark:text-white font-bold text-sm">{payment.name}</p>
                      <p className="text-[#6B7280] dark:text-[#9CA3AF] text-xs">
                        {payment.is_today ? 'Vandaag' : 'Morgen'} • {formatDate(payment.due_date)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#1F2937] dark:text-white font-bold">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-[600px] bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 shadow-xl border border-gray-100 dark:border-[#2a2a2a] flex flex-col relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#1F2937] dark:text-white text-xl font-bold">Waarmee betaal je {selectedPayment.name}?</h2>
                <button
                  className="text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                    setSelectedSolution(null);
                    setSelectedPotje(null);
                  }}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Warning Banner */}
              <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 rounded-[16px] p-4">
                <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
                <p className="text-red-600 dark:text-red-400 text-sm font-bold pt-0.5">
                  Je hebt een betaling gemist. Laten we kijken hoe we dit oplossen.
                </p>
              </div>

              {/* Financial Overview */}
              <div className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-[#0a0a0a] rounded-[16px] p-5 border border-gray-100 dark:border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1F2937] dark:text-white">
                    <div className="size-6 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </div>
                    <span className="text-sm font-medium">Volgend inkomen</span>
                  </div>
                  <span className="text-primary font-bold text-sm">{formatCurrency(financialOverview.nextIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1F2937] dark:text-white">
                    <div className="size-6 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </div>
                    <span className="text-sm font-medium">Andere verplichte uitgaven</span>
                  </div>
                  <span className="text-red-500 font-bold text-sm">{formatCurrency(-financialOverview.otherExpenses)}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-[#3a3a3a] my-1"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1F2937] dark:text-white text-base font-bold">Beschikbaar na je salaris</span>
                  <span className={`font-extrabold text-base ${financialOverview.availableAfterSalary < 0 ? 'text-red-500' : 'text-primary'}`}>
                    {formatCurrency(financialOverview.availableAfterSalary)}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 mb-8">
                <label className="block text-xs font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider mb-2">Kies een oplossing</label>

                {/* Potje Dropdown */}
                {potjes.length > 0 && (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#6B7280] dark:text-[#9CA3AF]">savings</span>
                    </div>
                    <select
                      className="block w-full pl-10 pr-10 py-3.5 text-base border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white rounded-[16px] focus:ring-primary focus:border-primary appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSolutionSelect('potje', e.target.value);
                        }
                      }}
                    >
                      <option value="">Gebruik potje</option>
                      {potjes.map(potje => (
                        <option key={potje.id} value={potje.id}>
                          {potje.name} ({formatCurrency(potje.balance || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#6B7280] dark:text-[#9CA3AF]">expand_more</span>
                    </div>
                  </div>
                )}

                {/* Reserve Button */}
                <button
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[16px] border ${
                    selectedSolution === 'reserve'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-primary'
                  } text-[#1F2937] dark:text-white transition-all text-sm font-bold`}
                  onClick={() => handleSolutionSelect('reserve')}
                >
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                  Gebruik algemene reserve
                </button>

                {/* Deferral Button */}
                <button
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[16px] border ${
                    selectedSolution === 'uitstel'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 dark:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-primary'
                  } text-[#1F2937] dark:text-white transition-all text-sm font-bold`}
                  onClick={() => handleSolutionSelect('uitstel')}
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  Verzoek om uitstel bij schuldeiser
                </button>

                {/* Link */}
                <div className="text-center mt-2">
                  <a className="text-primary text-sm font-bold hover:underline" href={createPageUrl('BudgetPlan')}>
                    Pas budgetplan handmatig aan
                  </a>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                <button
                  className="px-6 py-3 rounded-[16px] text-[#6B7280] dark:text-[#9CA3AF] font-bold text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                    setSelectedSolution(null);
                    setSelectedPotje(null);
                  }}
                >
                  Annuleren
                </button>
                <button
                  className={`px-6 py-3 rounded-[16px] font-bold text-sm flex items-center gap-2 ${
                    selectedSolution
                      ? 'bg-primary text-white hover:bg-[#0e9f6e]'
                      : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#6B7280] cursor-not-allowed'
                  } transition-colors`}
                  disabled={!selectedSolution}
                  onClick={handleConfirmSolution}
                >
                  <span>Bevestig oplossing</span>
                  {!selectedSolution && <span className="material-symbols-outlined text-sm">lock</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
