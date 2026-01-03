import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Income } from "@/api/entities";
import { Pot } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function VasteLastenCheck() {
  const [darkMode, setDarkMode] = useState(false);
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
  }, []);

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

      // Load monthly costs
      const costs = await MonthlyCost.filter({ user_id: userData.id });
      
      // Get today's date
      const today = new Date();
      const currentDay = today.getDate();

      // Filter costs that are due today (assuming they have a due_date or we calculate based on day of month)
      const dueToday = costs.filter(cost => {
        // If cost has a due_date, check if it's today
        if (cost.due_date) {
          const dueDate = new Date(cost.due_date);
          return dueDate.toDateString() === today.toDateString();
        }
        // Otherwise, check if the day of month matches (for recurring costs)
        if (cost.due_day) {
          return parseInt(cost.due_day) === currentDay;
        }
        return false;
      });

      // If no costs due today, show first cost as example
      if (dueToday.length === 0 && costs.length > 0) {
        const firstCost = costs[0];
        setDuePayments([{
          id: firstCost.id,
          name: firstCost.name || 'Onbekende kosten',
          amount: parseFloat(firstCost.amount) || 0,
          category: firstCost.category || 'Overig',
          due_date: firstCost.due_date || new Date().toISOString()
        }]);
      } else {
        setDuePayments(dueToday.map(cost => ({
          id: cost.id,
          name: cost.name || 'Onbekende kosten',
          amount: parseFloat(cost.amount) || 0,
          category: cost.category || 'Overig',
          due_date: cost.due_date || new Date().toISOString()
        })));
      }

      // Load income for next payment
      const incomes = await Income.filter({ user_id: userData.id });
      const nextIncome = incomes
        .filter(i => i.income_type === 'vast' && i.is_active !== false)
        .reduce((sum, i) => sum + (i.monthly_equivalent || i.amount || 0), 0);

      // Calculate other expenses (excluding the current payment)
      const otherExpenses = costs
        .filter(c => c.id !== duePayments[0]?.id)
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

      const availableAfterSalary = nextIncome - otherExpenses - (duePayments[0]?.amount || 0);

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
      toast({
        title: 'Betaling gemarkeerd als betaald',
        description: `${payment.name} is succesvol gemarkeerd.`
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#0d1b17] dark:text-white font-display antialiased overflow-x-hidden flex flex-col">
      {/* Global Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7f3ef] dark:border-b-[#2a2a2a] bg-white dark:bg-[#11221c] px-10 py-3 relative z-30">
        <div className="flex items-center gap-4 text-[#0d1b17] dark:text-white">
          <div className="size-8 flex items-center text-primary">
            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-[#0d1b17] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Konsensi</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden lg:flex items-center gap-9">
            <a className="text-primary dark:text-primary font-bold text-sm leading-normal border-b-2 border-primary dark:border-primary py-1" href={createPageUrl('BudgetPlan')}>Balans</a>
            <a className="text-[#0d1b17] dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary dark:hover:text-white transition-colors" href={createPageUrl('Dashboard')}>Transacties</a>
            <a className="text-[#0d1b17] dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary dark:hover:text-white transition-colors" href={createPageUrl('BudgetPlan')}>Budgetplan</a>
            <a className="text-[#0d1b17] dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary dark:hover:text-white transition-colors" href={createPageUrl('Potjes')}>Spaardoele</a>
            <a className="text-[#0d1b17] dark:text-gray-400 text-sm font-medium leading-normal hover:text-primary dark:hover:text-white transition-colors" href={createPageUrl('CentVoorCent')}>Inzichten</a>
          </nav>
          <div className="flex gap-3 items-center">
            <button 
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-[24px] h-10 px-4 bg-[#10b77f] dark:bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0e9f6e] dark:hover:bg-primary/80 transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('Adempauze')}
            >
              <span className="truncate">Adempauze</span>
            </button>
            <div className="flex gap-2">
              <button 
                className="flex items-center justify-center rounded-[24px] size-10 bg-[#e7f3ef] dark:bg-white/10 text-[#0d1b17] dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-white/20 transition-colors"
                onClick={toggleTheme}
              >
                <span className="material-symbols-outlined text-[20px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
              </button>
              <button className="flex items-center justify-center rounded-[24px] size-10 bg-[#e7f3ef] dark:bg-white/10 text-[#0d1b17] dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">language</span>
              </button>
              <button className="flex items-center justify-center rounded-[24px] size-10 bg-[#e7f3ef] dark:bg-white/10 text-[#0d1b17] dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-[#e7f3ef] dark:border-[#2a2a2a] cursor-pointer"
              style={{
                backgroundImage: user?.profielfoto_url 
                  ? `url(${user.profielfoto_url})` 
                  : 'none',
                backgroundColor: user?.profielfoto_url ? 'transparent' : '#8B5CF6'
              }}
            >
              {!user?.profielfoto_url && (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                  {(user?.voornaam?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 px-4 relative z-10">
        {/* Page Header */}
        <div className="w-full max-w-[800px] text-center mb-8">
          <h1 className="text-[#1F2937] dark:text-white text-4xl font-extrabold leading-tight tracking-tight mb-3">Vaste Lasten Check</h1>
          <p className="text-[#6B7280] dark:text-gray-400 text-lg font-normal">
            Tijd om je vaste lasten te controleren voor {monthNames[currentMonth.getMonth()]}.
          </p>
        </div>

        {/* Main Check Card */}
        {currentPayment && (
          <div className="w-full max-w-[800px] bg-white dark:bg-[#1a2c26] rounded-[24px] p-8 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36]">
            {/* Card Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full dark:rounded-[24px] bg-primary/10 dark:bg-[#11221c] flex items-center justify-center text-primary border dark:border-border-dark/50">
                  <span className="material-symbols-outlined text-3xl dark:text-2xl">event_available</span>
                </div>
                <div>
                  <p className="text-[#1F2937] dark:text-white text-xl font-bold">{currentPayment.name}</p>
                  <p className="text-[#6B7280] dark:text-text-secondary text-sm font-medium md:hidden">
                    Vervaldatum: {formatDate(currentPayment.due_date)}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[#1F2937] dark:text-white text-2xl font-bold">{formatCurrency(currentPayment.amount)}</p>
                <p className="text-[#6B7280] dark:text-text-secondary text-sm font-medium">
                  Vervaldatum: {formatDate(currentPayment.due_date)}
                </p>
              </div>
            </div>

            {/* Status Banner */}
            <div className="mb-8 flex items-center gap-3 bg-primary/10 dark:bg-primary/10 border-l-4 border-primary dark:border-primary p-4 rounded-[24px]">
              <span className="material-symbols-outlined text-primary dark:text-primary">info</span>
              <p className="text-primary dark:text-primary text-sm font-bold">
                Deze betaling is vandaag verschuldigd.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="flex-1 max-w-[240px] cursor-pointer items-center justify-center rounded-[24px] h-12 px-8 bg-primary dark:bg-primary text-white text-base font-bold hover:bg-[#0e9f6e] dark:hover:bg-primary/80 transition-colors shadow-sm flex gap-2"
                onClick={() => handlePaid(currentPayment)}
              >
                <span className="material-symbols-outlined">check_circle</span>
                <span>Ja, betaald</span>
              </button>
              <button 
                className="flex-1 max-w-[240px] cursor-pointer items-center justify-center rounded-[24px] h-12 px-8 bg-transparent border-2 border-gray-200 dark:border-border-dark text-[#6B7280] dark:text-text-secondary text-base font-bold hover:bg-gray-50 dark:hover:bg-[#222] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-colors flex gap-2"
                onClick={() => handleNotPaid(currentPayment)}
              >
                <span className="material-symbols-outlined">cancel</span>
                <span>Nee, niet betaald</span>
              </button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#0d1b17]/40 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-[600px] bg-white dark:bg-[#1a2c26] rounded-[24px] p-8 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#1F2937] dark:text-white text-xl font-bold">Waarmee betaal je {selectedPayment.name}?</h2>
                <button 
                  className="text-[#9CA3AF] dark:text-text-secondary hover:text-[#6B7280] dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
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
              <div className="mb-6 flex items-start gap-3 bg-red-50 dark:bg-danger/10 border-l-4 border-red-500 dark:border-danger rounded-[24px] p-4">
                <span className="material-symbols-outlined text-red-500 dark:text-danger shrink-0">error</span>
                <p className="text-red-500 dark:text-danger text-sm font-bold pt-0.5">
                  Je hebt een betaling gemist. Laten we kijken hoe we dit oplossen.
                </p>
              </div>

              {/* Financial Overview */}
              <div className="flex flex-col gap-3 mb-6 bg-[#F9FAFB] dark:bg-[#111] rounded-[24px] p-5 border dark:border-border-dark">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1F2937] dark:text-white">
                    <div className="size-6 bg-green-100 dark:bg-[#11221c] rounded-full flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px] dark:text-xs">arrow_upward</span>
                    </div>
                    <span className="text-sm font-medium">Volgend inkomen</span>
                  </div>
                  <span className="text-primary dark:text-primary font-bold text-sm">{formatCurrency(financialOverview.nextIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1F2937] dark:text-white">
                    <div className="size-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 dark:text-danger">
                      <span className="material-symbols-outlined text-[16px] dark:text-xs">arrow_downward</span>
                    </div>
                    <span className="text-sm font-medium">Andere verplichte uitgaven</span>
                  </div>
                  <span className="text-red-500 dark:text-danger font-bold text-sm">{formatCurrency(-financialOverview.otherExpenses)}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-[#2A3F36] my-1"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1F2937] dark:text-white text-base font-bold">Beschikbaar na je salaris</span>
                  <span className={`font-extrabold text-base ${financialOverview.availableAfterSalary < 0 ? 'text-red-500 dark:text-danger' : 'text-primary dark:text-primary'}`}>
                    {formatCurrency(financialOverview.availableAfterSalary)}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 mb-8">
                <label className="block text-xs font-bold text-[#6B7280] dark:text-text-secondary uppercase tracking-wider mb-2">Kies een oplossing</label>
                
                {/* Potje Dropdown */}
                {potjes.length > 0 && (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#6B7280] dark:text-text-secondary">savings</span>
                    </div>
                    <select 
                      className="block w-full pl-10 pr-10 py-3.5 text-base border border-gray-200 dark:border-border-dark bg-white dark:bg-[#222] text-[#1F2937] dark:text-white rounded-[24px] focus:ring-primary focus:border-primary dark:focus:border-primary appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSolutionSelect('potje', e.target.value);
                        }
                      }}
                    >
                      <option value="">Gebruik potje</option>
                      {potjes.map(potje => (
                        <option key={potje.id} value={potje.id}>
                          {potje.name} (€{formatCurrency(potje.balance || 0)})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-[#6B7280] dark:text-text-secondary">expand_more</span>
                    </div>
                  </div>
                )}

                {/* Reserve Button */}
                <button 
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[24px] border ${
                    selectedSolution === 'reserve' 
                      ? 'border-primary dark:border-primary bg-primary/10 dark:bg-primary/10' 
                      : 'border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-[#222] hover:border-primary dark:hover:border-primary'
                  } text-[#1F2937] dark:text-white transition-all text-sm font-bold`}
                  onClick={() => handleSolutionSelect('reserve')}
                >
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                  Gebruik algemene reserve
                </button>

                {/* Deferral Button */}
                <button 
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[24px] border ${
                    selectedSolution === 'uitstel' 
                      ? 'border-primary dark:border-primary bg-primary/10 dark:bg-primary/10' 
                      : 'border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-[#222] hover:border-primary dark:hover:border-primary'
                  } text-[#1F2937] dark:text-white transition-all text-sm font-bold`}
                  onClick={() => handleSolutionSelect('uitstel')}
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  Verzoek om uitstel bij schuldeiser
                </button>

                {/* Link */}
                <div className="text-center mt-2">
                  <a className="text-primary dark:text-primary text-sm font-bold hover:underline" href={createPageUrl('BudgetPlan')}>
                    Pas budgetplan handmatig aan
                  </a>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
                <button 
                  className="px-6 py-3 rounded-[24px] text-[#6B7280] dark:text-text-secondary font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
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
                  className={`px-6 py-3 rounded-[24px] font-bold text-sm flex items-center gap-2 ${
                    selectedSolution 
                      ? 'bg-primary dark:bg-primary text-white hover:bg-[#0e9f6e] dark:hover:bg-primary/80' 
                      : 'bg-gray-200 dark:bg-primary/20 text-gray-400 dark:text-primary/50 cursor-not-allowed'
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
