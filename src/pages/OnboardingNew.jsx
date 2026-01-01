import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Income, MonthlyCost, Debt, User } from '@/api/entities';
import { useToast } from '@/components/ui/toast';

export default function OnboardingNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [loading, setLoading] = useState(false);
  
  // Form state across all steps
  const [formData, setFormData] = useState({
    // Step 1: Goals (welkom)
    goals: [],
    
    // Step 2: Income
    incomes: [],
    
    // Step 3: Monthly Costs
    monthlyCosts: [],
    
    // Step 4: Debts
    hasDebts: null,
    debts: [],
    
    // Summary counts
    incomeCount: 0,
    costCount: 0,
    debtCount: 0
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleNext = () => {
    // If on step 4 and user has debts, go to step 5 (add debts)
    if (step === 4 && formData.hasDebts === true) {
      setStep(5);
    }
    // If on step 4 and user has no debts, go to step 6 (success)
    else if (step === 4 && formData.hasDebts === false) {
      setStep(6);
    }
    // If on step 5 (debts add), go to step 6 (success)
    else if (step === 5) {
      setStep(6);
    }
    // Otherwise just increment
    else if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = async () => {
    if (step === 5 || step === 6) {
      await completeOnboarding();
    } else {
      handleNext();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Save all data to Supabase
      await saveAllData();
      
      // Mark onboarding as complete
      await User.updateMe({
        onboarding_completed: true,
        onboarding_step: null
      });

      toast({
        title: 'Onboarding voltooid! ✅',
        description: 'Welkom bij Konsensi!',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Fout',
        description: 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAllData = async () => {
    try {
      // Save incomes
      for (const income of formData.incomes) {
        if (income.description && income.amount) {
          await Income.create({
            description: income.description,
            amount: parseFloat(income.amount),
            frequency: income.frequency || 'monthly',
            day_of_month: income.payment_date || 25,
            income_type: 'vast',
            category: 'salaris',
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          });
        }
      }

      // Save monthly costs
      for (const cost of formData.monthlyCosts) {
        if (cost.name && cost.amount) {
          await MonthlyCost.create({
            name: cost.name,
            amount: parseFloat(cost.amount),
            payment_date: parseInt(cost.payment_date) || 25,
            category: cost.category || 'overig',
            status: 'active',
            start_date: new Date().toISOString().split('T')[0]
          });
        }
      }

      // Save debts if user has debts
      if (formData.hasDebts === true) {
        for (const debt of formData.debts) {
          if (debt.creditor && debt.total_amount) {
            await Debt.create({
              creditor_name: debt.creditor,
              total_amount: parseFloat(debt.total_amount),
              monthly_payment: parseFloat(debt.monthly_payment) || 0,
              payment_date: parseInt(debt.payment_date) || 25,
              status: 'actief',
              description: `Schuld aan ${debt.creditor}`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  };

  const progressPercentage = step === 6 ? 100 : (step / 5) * 100;

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep formData={formData} setFormData={setFormData} darkMode={darkMode} />;
      case 2:
        return <IncomeStep formData={formData} setFormData={setFormData} darkMode={darkMode} />;
      case 3:
        return <MonthlyCostsStep formData={formData} setFormData={setFormData} darkMode={darkMode} />;
      case 4:
        return <DebtsCheckStep formData={formData} setFormData={setFormData} darkMode={darkMode} />;
      case 5:
        if (formData.hasDebts === true) {
          return <DebtsAddStep formData={formData} setFormData={setFormData} darkMode={darkMode} />;
        }
        return <SuccessStep formData={formData} darkMode={darkMode} />;
      case 6:
        return <SuccessStep formData={formData} darkMode={darkMode} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
          <input
            className="sr-only"
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
          <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>
              light_mode
            </span>
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>
              dark_mode
            </span>
            <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
          </div>
        </label>
      </div>

      <div className="relative w-full max-w-[600px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-[24px] shadow-modal p-8 md:p-12 flex flex-col">
        {/* Skip Link */}
        <button
          onClick={handleSkip}
          className="absolute top-8 right-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-[#a1a1a1] text-sm font-medium transition-colors z-10"
        >
          Overslaan
        </button>

        {/* Progress Section */}
        <div className="flex flex-col mb-8">
          {/* Step Indicators */}
          <div className="flex items-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-base ${
                  stepNum < step
                    ? 'bg-primary text-black'
                    : stepNum === step
                    ? 'bg-primary text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-gray-200 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#3a3a3a] text-gray-400 dark:text-[#6b7280]'
                }`}
              >
                {stepNum < step ? (
                  <span className="material-symbols-outlined text-[20px]">check</span>
                ) : (
                  stepNum
                )}
              </div>
            ))}
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Terug
          </button>
          {step < 6 ? (
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary-dark text-black font-display font-bold px-8 py-3 rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,183,127,0.39)] hover:shadow-[0_6px_20px_rgba(16,183,127,0.23)] hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              Volgende
            </button>
          ) : (
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-black font-display font-bold px-8 py-3 rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,183,127,0.39)] hover:shadow-[0_6px_20px_rgba(16,183,127,0.23)] hover:-translate-y-0.5 active:translate-y-0 text-sm disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Start met Konsensi'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep({ formData, setFormData, darkMode }) {
  const [selectedGoals, setSelectedGoals] = useState(formData.goals || []);

  const goals = [
    { id: 'income', label: 'Inkomsten bijhouden', icon: 'account_balance_wallet' },
    { id: 'expenses', label: 'Uitgaven beheren', icon: 'trending_down' },
    { id: 'debts', label: 'Schulden afbetalen', icon: 'credit_card' }
  ];

  const toggleGoal = (goalId) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(g => g !== goalId)
      : [...selectedGoals, goalId];
    setSelectedGoals(newGoals);
    setFormData({ ...formData, goals: newGoals });
  };

  return (
    <>
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white text-center mb-3">
          Welkom bij Konsensi!
        </h1>
        <p className="text-base text-gray-500 dark:text-[#a1a1a1] text-center leading-relaxed font-body max-w-md">
          We helpen je in een paar stappen om je financiën in kaart te brengen. Dit duurt slechts enkele minuten.
        </p>
      </div>

      {/* Goal Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`group relative flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer hover:-translate-y-0.5 transition-all ${
              selectedGoals.includes(goal.id)
                ? 'border-primary bg-primary/10 dark:bg-primary/20'
                : 'border-gray-200 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#2a2a2a] hover:border-primary'
            }`}
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/15 mb-4 group-hover:bg-primary/25 transition-smooth">
              <span className="material-symbols-outlined text-[48px] text-primary">
                {goal.icon}
              </span>
            </div>
            <h3 className="font-display font-semibold text-base text-gray-900 dark:text-white text-center">
              {goal.label}
            </h3>
          </button>
        ))}
      </div>
    </>
  );
}

function IncomeStep({ formData, setFormData, darkMode }) {
  const [incomes, setIncomes] = useState(formData.incomes.length > 0 ? formData.incomes : [{ description: '', amount: '', frequency: 'monthly', payment_date: '25' }]);

  const updateIncomes = (newIncomes) => {
    setIncomes(newIncomes);
    setFormData({ ...formData, incomes: newIncomes, incomeCount: newIncomes.filter(i => i.description && i.amount).length });
  };

  const addIncome = () => {
    updateIncomes([...incomes, { description: '', amount: '', frequency: 'monthly', payment_date: '25' }]);
  };

  const removeIncome = (index) => {
    updateIncomes(incomes.filter((_, i) => i !== index));
  };

  const updateIncome = (index, field, value) => {
    const newIncomes = [...incomes];
    newIncomes[index][field] = value;
    updateIncomes(newIncomes);
  };

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[48px]">monetization_on</span>
        </div>
        <h1 className="text-2xl md:text-[28px] font-display font-bold text-gray-900 dark:text-white text-center mb-2">
          Voeg je inkomsten toe
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-[#a1a1a1] text-center max-w-sm leading-relaxed">
          Voer je salaris, toeslagen of andere inkomsten in
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {incomes.map((income, index) => (
          <div key={index} className="relative bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-5">
            {incomes.length > 1 && (
              <button
                onClick={() => removeIncome(index)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Naam</label>
                <input
                  type="text"
                  value={income.description}
                  onChange={(e) => updateIncome(index, 'description', e.target.value)}
                  placeholder="bijv. Salaris, Zorgtoeslag"
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Bedrag</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 material-symbols-outlined text-[16px]">euro</span>
                  <input
                    type="number"
                    value={income.amount}
                    onChange={(e) => updateIncome(index, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Frequentie</label>
                <div className="relative">
                  <select
                    value={income.frequency}
                    onChange={(e) => updateIncome(index, 'frequency', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="monthly">Maandelijks</option>
                    <option value="weekly">Wekelijks</option>
                    <option value="biweekly">Per 2 weken</option>
                    <option value="yearly">Jaarlijks</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Betaaldag</label>
                <div className="relative">
                  <select
                    value={income.payment_date}
                    onChange={(e) => updateIncome(index, 'payment_date', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="1">1e van de maand</option>
                    <option value="25">25e van de maand</option>
                    <option value="last">Laatste dag</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addIncome}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] text-gray-500 dark:text-[#a1a1a1] hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-medium text-sm">Nog één toevoegen</span>
        </button>
      </div>
    </>
  );
}

function MonthlyCostsStep({ formData, setFormData, darkMode }) {
  const [costs, setCosts] = useState(formData.monthlyCosts.length > 0 ? formData.monthlyCosts : [{ name: '', amount: '', category: 'wonen', payment_date: '25' }]);

  const updateCosts = (newCosts) => {
    setCosts(newCosts);
    setFormData({ ...formData, monthlyCosts: newCosts, costCount: newCosts.filter(c => c.name && c.amount).length });
  };

  const addCost = () => {
    updateCosts([...costs, { name: '', amount: '', category: 'wonen', payment_date: '25' }]);
  };

  const removeCost = (index) => {
    updateCosts(costs.filter((_, i) => i !== index));
  };

  const updateCost = (index, field, value) => {
    const newCosts = [...costs];
    newCosts[index][field] = value;
    updateCosts(newCosts);
  };

  const categories = [
    { value: 'wonen', label: 'Wonen' },
    { value: 'verzekeringen', label: 'Verzekeringen' },
    { value: 'vervoer', label: 'Vervoer' },
    { value: 'abonnementen', label: 'Abonnementen' },
    { value: 'overig', label: 'Overig' }
  ];

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[48px]">home</span>
        </div>
        <h1 className="text-[28px] font-display font-bold text-gray-900 dark:text-white text-center mb-2 leading-tight">
          Voeg je vaste lasten toe
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-[#a1a1a1] text-center max-w-md mx-auto">
          Voer je huur, energie, verzekeringen en andere vaste kosten in
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {costs.map((cost, index) => (
          <div key={index} className="relative bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-5">
            {costs.length > 1 && (
              <button
                onClick={() => removeCost(index)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Naam</label>
                <input
                  type="text"
                  value={cost.name}
                  onChange={(e) => updateCost(index, 'name', e.target.value)}
                  placeholder="bijv. Huur woning"
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Bedrag</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 material-symbols-outlined text-[16px]">euro</span>
                  <input
                    type="number"
                    value={cost.amount}
                    onChange={(e) => updateCost(index, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Categorie</label>
                <div className="relative">
                  <select
                    value={cost.category}
                    onChange={(e) => updateCost(index, 'category', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#a1a1a1] mb-2">Betaaldag</label>
                <div className="relative">
                  <select
                    value={cost.payment_date}
                    onChange={(e) => updateCost(index, 'payment_date', e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="1">1e van de maand</option>
                    <option value="25">25e van de maand</option>
                    <option value="last">Laatste werkdag</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addCost}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] text-gray-500 dark:text-[#a1a1a1] hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="font-medium text-sm">Nog één toevoegen</span>
        </button>
      </div>
    </>
  );
}

function DebtsCheckStep({ formData, setFormData, darkMode }) {
  const handleDebtChoice = (hasDebts) => {
    setFormData({ ...formData, hasDebts });
  };

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[48px]">credit_card</span>
        </div>
        <h1 className="text-2xl sm:text-[28px] font-display font-bold text-center text-gray-900 dark:text-white leading-tight mb-2">
          Heb je schulden?
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-[#a1a1a1] text-center max-w-[90%]">
          Als je betalingsachterstanden hebt, voeg ze hier toe zodat we je kunnen helpen
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        <label className="relative flex items-start sm:items-center gap-4 p-6 rounded-[16px] border-2 cursor-pointer transition-all duration-200 hover:-translate-y-[2px] group bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#3a3a3a] hover:border-primary">
          <input
            type="radio"
            name="debt_status"
            value="yes"
            checked={formData.hasDebts === true}
            onChange={() => handleDebtChoice(true)}
            className="sr-only peer"
          />
          <div className="shrink-0 pt-1 sm:pt-0">
            <span className="material-symbols-outlined text-amber-500 text-[24px]">error</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-display font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
              Ja, ik heb schulden
            </span>
            <span className="text-[14px] text-gray-500 dark:text-[#a1a1a1] mt-1">
              Ik wil mijn schulden toevoegen
            </span>
          </div>
        </label>

        <label className="relative flex items-start sm:items-center gap-4 p-6 rounded-[16px] border-2 cursor-pointer transition-all duration-200 hover:-translate-y-[2px] bg-primary/5 dark:bg-[rgba(16,185,129,0.1)] border-primary">
          <input
            type="radio"
            name="debt_status"
            value="no"
            checked={formData.hasDebts === false}
            onChange={() => handleDebtChoice(false)}
            className="sr-only peer"
          />
          <div className="shrink-0 pt-1 sm:pt-0">
            <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-display font-semibold text-gray-900 dark:text-white">
              Nee, geen schulden
            </span>
            <span className="text-[14px] text-primary mt-1 font-medium">
              Geweldig! Blijf zo doorgaan
            </span>
          </div>
        </label>
      </div>
    </>
  );
}

function DebtsAddStep({ formData, setFormData, darkMode }) {
  const [debts, setDebts] = useState(formData.debts.length > 0 ? formData.debts : [{ creditor: '', total_amount: '', monthly_payment: '', payment_date: '25' }]);

  const updateDebts = (newDebts) => {
    setDebts(newDebts);
    setFormData({ ...formData, debts: newDebts, debtCount: newDebts.filter(d => d.creditor && d.total_amount).length });
  };

  const addDebt = () => {
    updateDebts([...debts, { creditor: '', total_amount: '', monthly_payment: '', payment_date: '25' }]);
  };

  const removeDebt = (index) => {
    updateDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (index, field, value) => {
    const newDebts = [...debts];
    newDebts[index][field] = value;
    updateDebts(newDebts);
  };

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="size-20 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary text-[40px]">credit_card</span>
        </div>
        <h1 className="text-white font-display font-bold text-[28px] text-center mb-2">
          Voeg je schulden toe
        </h1>
        <p className="text-[#a1a1a1] font-body text-[15px] text-center max-w-sm leading-relaxed">
          Voer je betalingsachterstanden in, zodat we je kunnen helpen
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {debts.map((debt, index) => (
          <div key={index} className="relative bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-5">
            {debts.length > 1 && (
              <button
                onClick={() => removeDebt(index)}
                className="absolute top-3 right-3 p-2 rounded-lg text-[#6b7280] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-[#a1a1a1] uppercase tracking-wider pl-1 mb-1.5">Schuldeiser</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] material-symbols-outlined text-[18px]">domain</span>
                  <input
                    type="text"
                    value={debt.creditor}
                    onChange={(e) => updateDebt(index, 'creditor', e.target.value)}
                    placeholder="bijv. DUO, CJIB, Energieleverancier"
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl text-white placeholder-[#525252] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1a1] uppercase tracking-wider pl-1 mb-1.5">Totale schuld</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ef4444] material-symbols-outlined text-[18px]">euro_symbol</span>
                  <input
                    type="number"
                    value={debt.total_amount}
                    onChange={(e) => updateDebt(index, 'total_amount', e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl text-white placeholder-[#525252] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1a1] uppercase tracking-wider pl-1 mb-1.5">Maandelijkse aflossing</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[18px]">trending_down</span>
                  <input
                    type="number"
                    value={debt.monthly_payment}
                    onChange={(e) => updateDebt(index, 'monthly_payment', e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl text-white placeholder-[#525252] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-[#a1a1a1] uppercase tracking-wider pl-1 mb-1.5">Betaaldag</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[18px]">calendar_month</span>
                  <select
                    value={debt.payment_date}
                    onChange={(e) => updateDebt(index, 'payment_date', e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none text-sm cursor-pointer"
                  >
                    <option value="1">1e van de maand</option>
                    <option value="15">15e van de maand</option>
                    <option value="25">25e van de maand</option>
                    <option value="last">Laatste dag</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addDebt}
          className="w-full group flex items-center justify-center gap-2 py-4 px-4 bg-transparent border-2 border-dashed border-[#3a3a3a] rounded-xl text-[#a1a1a1] hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add</span>
          <span className="font-medium">Nog één toevoegen</span>
        </button>
      </div>
    </>
  );
}

function SuccessStep({ formData, darkMode }) {
  return (
    <>
      <div className="flex flex-col items-center justify-center mb-10 text-center">
        <div className="w-[100px] h-[100px] rounded-full bg-primary/20 flex items-center justify-center mb-5 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-[64px]">check_circle</span>
        </div>
        <h1 className="font-display font-bold text-gray-900 dark:text-white text-4xl mb-2 leading-tight">
          Je bent klaar!
        </h1>
        <p className="text-gray-500 dark:text-[#a1a1a1] text-base font-normal max-w-[500px] mx-auto leading-relaxed">
          Je financiële gegevens zijn opgeslagen. Je kunt nu beginnen met het beheren van je budget.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-[32px] mb-3">trending_up</span>
          <span className="font-body text-[12px] text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wider font-bold mb-2">Inkomsten</span>
          <span className="font-display font-bold text-[32px] text-primary leading-none">{formData.incomeCount || 0}</span>
          <span className="font-body text-[14px] text-gray-500 dark:text-[#a1a1a1] mt-1">toegevoegd</span>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-[32px] mb-3">trending_down</span>
          <span className="font-body text-[12px] text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wider font-bold mb-2">Uitgaven</span>
          <span className="font-display font-bold text-[32px] text-primary leading-none">{formData.costCount || 0}</span>
          <span className="font-body text-[14px] text-gray-500 dark:text-[#a1a1a1] mt-1">toegevoegd</span>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl p-6 text-center flex flex-col items-center shadow-sm">
          <span className="material-symbols-outlined text-primary text-[32px] mb-3">credit_card</span>
          <span className="font-body text-[12px] text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wider font-bold mb-2">Schulden</span>
          <span className="font-display font-bold text-[32px] text-primary leading-none">{formData.debtCount || 0}</span>
          <span className="font-body text-[14px] text-gray-500 dark:text-[#a1a1a1] mt-1">toegevoegd</span>
        </div>
      </div>
    </>
  );
}

