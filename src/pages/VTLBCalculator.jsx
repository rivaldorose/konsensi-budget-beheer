import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function VTLBCalculator() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    projectedIncome: 0,
    householdType: 'Alleenstaand',
    numberOfChildren: 0,
    rentMortgage: 0
  });
  const [calculation, setCalculation] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    availableBudget: 0,
    afloscapaciteit: 0
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
  }, []);

  useEffect(() => {
    calculateAfloscapaciteit();
  }, [formData]);

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

      // Load fixed costs
      const costs = await MonthlyCost.filter({ created_by: userData.email });
      const totalFixedCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      // Calculate initial values
      const monthlyIncome = userData.monthly_income || 0;
      const currentArrangements = 0; // Would need to fetch from debts/payment plans

      // Calculate available budget
      const availableBudget = monthlyIncome - totalFixedCosts - currentArrangements;
      const afloscapaciteit = Math.max(0, availableBudget * 0.15);

      setCalculation({
        totalIncome: monthlyIncome,
        totalExpenses: totalFixedCosts + currentArrangements,
        availableBudget: availableBudget,
        afloscapaciteit: afloscapaciteit,
        fixedCosts: totalFixedCosts,
        currentArrangements: currentArrangements
      });
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

  const calculateAfloscapaciteit = () => {
    const totalIncome = calculation.totalIncome + formData.projectedIncome;
    const totalExpenses = calculation.fixedCosts + calculation.currentArrangements + formData.rentMortgage;
    const availableBudget = totalIncome - totalExpenses;
    const afloscapaciteit = Math.max(0, availableBudget * 0.15);

    setCalculation(prev => ({
      ...prev,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      availableBudget: availableBudget,
      afloscapaciteit: afloscapaciteit
    }));
  };

  const handleSave = async () => {
    try {
      // Save calculation or navigate back
      toast({
        title: 'Berekening opgeslagen',
        description: 'Je afloscapaciteit is bijgewerkt.'
      });
      window.location.href = createPageUrl('debts');
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij opslaan'
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white antialiased flex flex-col">
      {/* Top Navigation Bar */}
      <div className="relative w-full bg-[#f8fcfa] dark:bg-[#112218] border-b border-[#e7f3ef] dark:border-[#234832]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-primary dark:text-primary">
                <span className="material-symbols-outlined text-[28px] font-bold">savings</span>
              </div>
              <h2 className="text-[#0d1b17] dark:text-white text-xl font-extrabold tracking-tight">Konsensi</h2>
            </div>
            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-8 ml-12">
              <a className="text-primary dark:text-white font-bold text-sm border-b-2 border-primary dark:border-primary py-5" href={createPageUrl('debts')}>Schulden</a>
              <a className="text-[#0d1b17] dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors text-sm font-medium" href={createPageUrl('Adempauze')}>Adempauze</a>
              <a className="text-[#0d1b17] dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors text-sm font-medium" href={createPageUrl('BudgetPlan')}>Budget</a>
            </div>
            {/* Tools & Profile */}
            <div className="flex flex-1 justify-end items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-[24px] bg-[#e7f3ef] dark:bg-[#234832] hover:bg-[#cfe7df] dark:hover:bg-primary/20 text-[#0d1b17] dark:text-white transition-colors"
                  onClick={toggleTheme}
                >
                  <span className="material-symbols-outlined text-[20px]">contrast</span>
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-[24px] bg-[#e7f3ef] dark:bg-[#234832] hover:bg-[#cfe7df] dark:hover:bg-primary/20 text-[#0d1b17] dark:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">language</span>
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-[24px] bg-[#e7f3ef] dark:bg-[#234832] hover:bg-[#cfe7df] dark:hover:bg-primary/20 text-[#0d1b17] dark:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
              </div>
              <div className="h-8 w-[1px] bg-gray-200 dark:bg-[#234832] mx-2"></div>
              <div 
                className="bg-center bg-no-repeat bg-cover rounded-full h-10 w-10 cursor-pointer ring-2 ring-white dark:ring-[#234832] shadow-sm"
                style={{
                  backgroundImage: user?.profielfoto_url 
                    ? `url(${user.profielfoto_url})` 
                    : 'none',
                  backgroundColor: user?.profielfoto_url ? 'transparent' : '#8B5CF6'
                }}
              >
                {!user?.profielfoto_url && (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(user?.voornaam?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex justify-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-[900px] dark:max-w-[1000px] flex flex-col">
          {/* Page Header */}
          <div className="mb-8 dark:mb-10">
            <div className="flex items-center gap-3 dark:gap-4 mb-4 dark:mb-2 cursor-pointer group w-fit" onClick={() => window.location.href = createPageUrl('debts')}>
              <div className="flex items-center justify-center w-8 h-8 dark:size-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent text-text-sub dark:text-text-muted group-hover:border-primary dark:group-hover:bg-white/10 group-hover:text-primary dark:group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </div>
              <span className="text-sm font-medium text-text-sub dark:text-text-muted group-hover:text-primary dark:group-hover:text-white transition-colors">Terug naar overzicht</span>
            </div>
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2">Jouw Afloscapaciteit</h1>
            <p className="text-text-sub dark:text-text-muted text-base md:text-lg font-normal max-w-2xl dark:pl-[56px]">
              Bereken hoeveel je per maand kunt aflossen op je schulden op basis van je huidige situatie.
            </p>
          </div>

          {/* Main Calculation Card */}
          <div className="bg-white dark:bg-background-card rounded-[24px] shadow-soft dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-border-subtle overflow-hidden flex flex-col">
            <div className="p-8 md:p-10 dark:p-6 dark:md:p-10 space-y-10">
              {/* Section 1: Inkomsten */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 dark:size-8 bg-[#e7f3ef] dark:bg-primary/20 rounded-[24px] dark:rounded-full text-primary">
                    <span className="material-symbols-outlined dark:text-[20px]">account_balance_wallet</span>
                  </div>
                  <h3 className="text-text-main dark:text-white text-xl font-bold">Inkomsten</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:gap-5">
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2 opacity-80 dark:flex-row dark:items-center dark:justify-between dark:p-4 dark:rounded-[24px] dark:bg-white/5 dark:border dark:border-transparent">
                    <label className="text-text-sub dark:text-text-muted text-sm font-semibold">
                      Vast inkomen <span className="font-normal text-xs text-gray-400 dark:opacity-70">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] dark:h-auto px-4 rounded-[24px] bg-gray-50 dark:bg-transparent border border-transparent flex items-center justify-between">
                      <span className="text-text-main dark:hidden font-medium">Salaris & Toeslagen</span>
                      <span className="text-primary dark:text-primary font-bold font-mono text-lg dark:text-lg">
                        {formatCurrency(calculation.totalIncome - formData.projectedIncome)}
                      </span>
                    </div>
                  </div>
                  {/* Editable Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-text-main dark:text-text-muted text-sm font-bold dark:font-semibold dark:ml-1">Geprojecteerd inkomen</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 dark:text-text-muted dark:material-symbols-outlined font-bold dark:group-focus-within:text-primary dark:transition-colors">€</span>
                      </div>
                      <input 
                        className="form-input block w-full h-[56px] dark:py-3.5 pl-10 dark:pl-12 pr-4 rounded-[24px] border border-gray-200 dark:border-border-subtle bg-[#f9fafb] dark:bg-background-input text-text-main dark:text-white font-semibold dark:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-primary dark:focus:border-primary/50 focus:ring-1 dark:focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-background-input transition-all shadow-sm dark:shadow-inner text-lg dark:text-lg" 
                        placeholder="0.00" 
                        type="number" 
                        value={formData.projectedIncome || ''}
                        onChange={(e) => setFormData({...formData, projectedIncome: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                <button className="mt-4 dark:mt-0 flex items-center gap-2 text-primary dark:text-primary hover:text-primary-dark dark:hover:text-primary-hover hover:underline decoration-2 underline-offset-4 transition-all text-sm font-bold dark:font-semibold w-fit px-2 py-1 dark:py-1 dark:rounded">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Extra inkomen toevoegen
                </button>
              </section>

              <hr className="border-gray-100 dark:h-px dark:bg-gradient-to-r dark:from-transparent dark:via-[#333] dark:to-transparent" />

              {/* Section 2: Uitgaven */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 dark:size-8 bg-red-50 dark:bg-danger/20 rounded-[24px] dark:rounded-full text-red-500 dark:text-danger">
                    <span className="material-symbols-outlined dark:text-[20px]">payments</span>
                  </div>
                  <h3 className="text-text-main dark:text-white text-xl font-bold">Uitgaven</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:gap-5">
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2 opacity-80 dark:flex-row dark:items-center dark:justify-between dark:p-4 dark:rounded-[24px] dark:bg-white/5 dark:border dark:border-transparent">
                    <label className="text-text-sub dark:text-text-muted text-sm font-semibold">
                      Vaste lasten <span className="font-normal text-xs text-gray-400 dark:opacity-70">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] dark:h-auto px-4 rounded-[24px] bg-gray-50 dark:bg-transparent border border-transparent flex items-center justify-between">
                      <span className="text-text-main dark:hidden font-medium">Huur, G/W/L, Verzekering</span>
                      <span className="text-red-500 dark:text-danger font-bold font-mono text-lg dark:text-lg">
                        - {formatCurrency(calculation.fixedCosts)}
                      </span>
                    </div>
                  </div>
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2 opacity-80 dark:flex-row dark:items-center dark:justify-between dark:p-4 dark:rounded-[24px] dark:bg-white/5 dark:border dark:border-transparent">
                    <label className="text-text-sub dark:text-text-muted text-sm font-semibold">
                      Betalingsregelingen <span className="font-normal text-xs text-gray-400 dark:opacity-70">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] dark:h-auto px-4 rounded-[24px] bg-gray-50 dark:bg-transparent border border-transparent flex items-center justify-between">
                      <span className="text-text-main dark:hidden font-medium">Lopende afspraken</span>
                      <span className="text-red-500 dark:text-danger font-bold font-mono text-lg dark:text-lg">
                        - {formatCurrency(calculation.currentArrangements)}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="mt-4 dark:mt-0 flex items-center gap-2 text-primary dark:text-primary hover:text-primary-dark dark:hover:text-primary-hover hover:underline decoration-2 underline-offset-4 transition-all text-sm font-bold dark:font-semibold w-fit px-2 py-1 dark:py-1 dark:rounded">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Extra uitgaven toevoegen
                </button>
              </section>

              <hr className="border-gray-100 dark:h-px dark:bg-gradient-to-r dark:from-transparent dark:via-[#333] dark:to-transparent" />

              {/* Section 3: Woonsituatie */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 dark:size-8 bg-blue-50 dark:bg-white/10 rounded-[24px] dark:rounded-full text-blue-600 dark:text-white">
                    <span className="material-symbols-outlined dark:text-[20px]">real_estate_agent</span>
                  </div>
                  <h3 className="text-text-main dark:text-white text-xl font-bold">Jouw woonsituatie</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-text-main dark:text-text-muted text-sm font-bold dark:font-semibold dark:ml-1">Type huishouden</label>
                    <div className="relative">
                      <select 
                        className="form-select block w-full h-[56px] dark:py-3.5 pl-4 pr-10 rounded-[24px] border border-gray-200 dark:border-border-subtle bg-[#f9fafb] dark:bg-background-input text-text-main dark:text-white font-medium dark:font-medium focus:border-primary dark:focus:border-primary/50 focus:ring-1 dark:focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-background-input cursor-pointer shadow-sm dark:appearance-none" 
                        value={formData.householdType}
                        onChange={(e) => setFormData({...formData, householdType: e.target.value})}
                      >
                        <option>Alleenstaand</option>
                        <option>Gehuwd / Samenwonend</option>
                        <option>Alleenstaande ouder</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted dark:block hidden">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  </div>
                  {/* Number Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-text-main dark:text-text-muted text-sm font-bold dark:font-semibold dark:ml-1">Aantal kinderen</label>
                    <div className="flex items-center h-[56px] dark:h-auto border border-gray-200 dark:border-border-subtle rounded-[24px] bg-[#f9fafb] dark:bg-background-input overflow-hidden focus-within:ring-1 dark:focus-within:ring-2 focus-within:ring-primary focus-within:border-primary dark:focus-within:border-primary/50 shadow-sm">
                      <button 
                        className="px-4 h-full dark:py-3.5 text-gray-500 dark:text-text-muted hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setFormData({...formData, numberOfChildren: Math.max(0, formData.numberOfChildren - 1)})}
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <input 
                        className="w-full h-full dark:h-auto border-none bg-transparent text-center font-bold dark:font-medium text-text-main dark:text-white focus:ring-0 p-0" 
                        min="0" 
                        type="number" 
                        value={formData.numberOfChildren}
                        onChange={(e) => setFormData({...formData, numberOfChildren: parseInt(e.target.value) || 0})}
                      />
                      <button 
                        className="px-4 h-full dark:py-3.5 text-gray-500 dark:text-text-muted hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        onClick={() => setFormData({...formData, numberOfChildren: formData.numberOfChildren + 1})}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Optional Field */}
                <div className="flex flex-col gap-2 mt-6 dark:md:col-span-2">
                  <label className="text-text-main dark:text-text-muted text-sm font-bold dark:font-semibold dark:ml-1">
                    Huur/Hypotheek 
                    <span className="font-normal text-text-sub dark:opacity-70">(indien niet in vaste lasten)</span>
                  </label>
                  <div className="relative group max-w-md dark:max-w-none">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 dark:text-text-muted dark:material-symbols-outlined font-bold dark:group-focus-within:text-primary dark:transition-colors">€</span>
                    </div>
                    <input 
                      className="form-input block w-full h-[56px] dark:py-3.5 pl-10 dark:pl-12 pr-4 rounded-[24px] border border-gray-200 dark:border-border-subtle bg-[#f9fafb] dark:bg-background-input text-text-main dark:text-white font-semibold dark:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-primary dark:focus:border-primary/50 focus:ring-1 dark:focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-background-input transition-all shadow-sm dark:shadow-inner" 
                      placeholder="0.00" 
                      type="number" 
                      value={formData.rentMortgage || ''}
                      onChange={(e) => setFormData({...formData, rentMortgage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Calculation Result Section */}
            <div className="bg-primary/10 dark:bg-[#0dba52]/10 border-t-2 border-primary dark:border-primary p-8 md:p-10 dark:p-6 dark:md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-1 dark:space-y-1">
                <p className="text-text-main dark:text-white text-lg font-bold">Jouw Afloscapaciteit per maand</p>
                <p className="text-text-sub dark:text-text-muted text-sm max-w-sm dark:max-w-md">
                  Dit is het bedrag dat je maandelijks veilig kunt besteden aan het aflossen van je schulden.
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-primary dark:text-primary font-extrabold text-4xl dark:text-4xl dark:md:text-5xl tracking-tight">
                  {formatCurrency(calculation.afloscapaciteit)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-bold text-primary dark:text-primary/70 uppercase tracking-wide dark:font-medium">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Beschikbaar
                </div>
              </div>
              {/* Save Button (Dark Mode) */}
              <div className="mt-8 dark:mt-8 pt-6 dark:pt-6 border-t dark:border-t-primary/20 w-full dark:block hidden">
                <button 
                  className="w-full bg-primary dark:bg-primary hover:bg-primary-dark dark:hover:bg-primary-hover text-white dark:text-background-page font-extrabold dark:font-extrabold text-lg py-4 px-8 rounded-[24px] shadow-lg dark:shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                  onClick={handleSave}
                >
                  <span className="material-symbols-outlined">save</span>
                  Opslaan & Terug naar overzicht
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Actions (Light Mode) */}
          <div className="mt-8 mb-12 dark:hidden">
            <button 
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg h-14 rounded-[24px] shadow-lg shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
              onClick={handleSave}
            >
              <span className="material-symbols-outlined">save</span>
              Opslaan & Terug naar overzicht
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-8 dark:mt-8 text-center px-4 pb-8 dark:pb-8">
            <p className="text-sm text-gray-600 dark:text-gray-600">
              Deze berekening is een indicatie op basis van de ingevulde gegevens. <br className="hidden md:block"/>
              Raadpleeg altijd een financieel adviseur voor een officiële VTLB berekening.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
