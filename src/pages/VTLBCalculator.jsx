import React, { useState, useEffect } from 'react';
import { User, MonthlyCost, Debt } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function VTLBCalculator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    projectedIncome: 0,
    householdType: 'Alleenstaand',
    numberOfChildren: 0,
    rentMortgage: 0
  });
  const [baseData, setBaseData] = useState({
    monthlyIncome: 0,
    fixedCosts: 0,
    currentArrangements: 0
  });
  const [calculation, setCalculation] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    availableBudget: 0,
    afloscapaciteit: 0,
    fixedCosts: 0,
    currentArrangements: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateAfloscapaciteit();
  }, [formData, baseData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await User.me();
      setUser(userData);

      // Load fixed costs
      const costs = await MonthlyCost.filter({ user_id: userData.id });
      const totalFixedCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      // Load debts with payment arrangements (betalingsregeling)
      const debts = await Debt.filter({ user_id: userData.id });
      const debtsWithArrangements = debts.filter(debt =>
        debt.status === 'betalingsregeling' || debt.status === 'payment_arrangement'
      );
      const currentArrangements = debtsWithArrangements.reduce((sum, debt) =>
        sum + parseFloat(debt.monthly_payment || 0), 0
      );

      // Calculate initial values
      const monthlyIncome = parseFloat(userData.monthly_income || 0);

      // Store base data for live calculations
      setBaseData({
        monthlyIncome: monthlyIncome,
        fixedCosts: totalFixedCosts,
        currentArrangements: currentArrangements
      });

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
    // Use base data plus form adjustments for live calculation
    const totalIncome = baseData.monthlyIncome + (formData.projectedIncome || 0);
    const totalExpenses = baseData.fixedCosts + baseData.currentArrangements + (formData.rentMortgage || 0);
    const availableBudget = totalIncome - totalExpenses;
    const afloscapaciteit = Math.max(0, availableBudget * 0.15);

    setCalculation({
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      availableBudget: availableBudget,
      afloscapaciteit: afloscapaciteit,
      fixedCosts: baseData.fixedCosts,
      currentArrangements: baseData.currentArrangements
    });
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-[#3a3a3a]"></div>
          <p className="text-gray-600 dark:text-[#a1a1a1] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white antialiased flex flex-col">
      {/* Main Content Area */}
      <main className="flex-grow flex justify-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-[900px] flex flex-col">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 cursor-pointer group w-fit" onClick={() => window.location.href = createPageUrl('debts')}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-[#a1a1a1] group-hover:border-[#10b981] group-hover:text-[#10b981] transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1a1] group-hover:text-[#10b981] transition-colors">Terug naar overzicht</span>
            </div>
            <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2">Jouw Afloscapaciteit</h1>
            <p className="text-gray-500 dark:text-[#a1a1a1] text-base md:text-lg font-normal max-w-2xl">
              Bereken hoeveel je per maand kunt aflossen op je schulden op basis van je huidige situatie.
            </p>
          </div>

          {/* Main Calculation Card */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-sm border border-gray-100 dark:border-[#2a2a2a] overflow-hidden flex flex-col">
            <div className="p-8 md:p-10 space-y-10">
              {/* Section 1: Inkomsten */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#10b981]/10 rounded-full text-[#10b981]">
                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Inkomsten</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 dark:text-[#a1a1a1] text-sm font-semibold">
                      Vast inkomen <span className="font-normal text-xs text-gray-400">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Salaris & Toeslagen</span>
                      <span className="text-[#10b981] font-bold font-mono text-lg">
                        {formatCurrency(calculation.totalIncome - formData.projectedIncome)}
                      </span>
                    </div>
                  </div>
                  {/* Editable Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Geprojecteerd inkomen</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 dark:text-[#6b7280] font-bold">€</span>
                      </div>
                      <input
                        className="form-input block w-full h-[56px] pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all text-lg"
                        placeholder="0.00"
                        type="number"
                        value={formData.projectedIncome || ''}
                        onChange={(e) => setFormData({...formData, projectedIncome: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-2 text-[#10b981] hover:text-[#0d9668] hover:underline decoration-2 underline-offset-4 transition-all text-sm font-bold w-fit px-2 py-1">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Extra inkomen toevoegen
                </button>
              </section>

              <hr className="border-gray-100 dark:border-[#2a2a2a]" />

              {/* Section 2: Uitgaven */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Uitgaven</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 dark:text-[#a1a1a1] text-sm font-semibold">
                      Vaste lasten <span className="font-normal text-xs text-gray-400">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Huur, G/W/L, Verzekering</span>
                      <span className="text-red-500 font-bold font-mono text-lg">
                        - {formatCurrency(calculation.fixedCosts)}
                      </span>
                    </div>
                  </div>
                  {/* Read-only Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 dark:text-[#a1a1a1] text-sm font-semibold">
                      Betalingsregelingen <span className="font-normal text-xs text-gray-400">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Lopende afspraken</span>
                      <span className="text-red-500 font-bold font-mono text-lg">
                        - {formatCurrency(calculation.currentArrangements)}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-2 text-[#10b981] hover:text-[#0d9668] hover:underline decoration-2 underline-offset-4 transition-all text-sm font-bold w-fit px-2 py-1">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Extra uitgaven toevoegen
                </button>
              </section>

              <hr className="border-gray-100 dark:border-[#2a2a2a]" />

              {/* Section 3: Woonsituatie */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Jouw woonsituatie</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Type huishouden</label>
                    <div className="relative">
                      <select
                        className="form-select block w-full h-[56px] pl-4 pr-10 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-medium focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] cursor-pointer"
                        value={formData.householdType}
                        onChange={(e) => setFormData({...formData, householdType: e.target.value})}
                      >
                        <option>Alleenstaand</option>
                        <option>Gehuwd / Samenwonend</option>
                        <option>Alleenstaande ouder</option>
                      </select>
                    </div>
                  </div>
                  {/* Number Input */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Aantal kinderen</label>
                    <div className="flex items-center h-[56px] border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden focus-within:ring-1 focus-within:ring-[#10b981] focus-within:border-[#10b981]">
                      <button
                        className="px-4 h-full text-gray-500 dark:text-[#a1a1a1] hover:text-[#10b981] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                        onClick={() => setFormData({...formData, numberOfChildren: Math.max(0, formData.numberOfChildren - 1)})}
                      >
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <input
                        className="w-full h-full border-none bg-transparent text-center font-bold text-gray-900 dark:text-white focus:ring-0 p-0"
                        min="0"
                        type="number"
                        value={formData.numberOfChildren}
                        onChange={(e) => setFormData({...formData, numberOfChildren: parseInt(e.target.value) || 0})}
                      />
                      <button
                        className="px-4 h-full text-gray-500 dark:text-[#a1a1a1] hover:text-[#10b981] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                        onClick={() => setFormData({...formData, numberOfChildren: formData.numberOfChildren + 1})}
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Optional Field */}
                <div className="flex flex-col gap-2 mt-6">
                  <label className="text-gray-900 dark:text-white text-sm font-bold">
                    Huur/Hypotheek
                    <span className="font-normal text-gray-500 dark:text-[#a1a1a1]"> (indien niet in vaste lasten)</span>
                  </label>
                  <div className="relative group max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 dark:text-[#6b7280] font-bold">€</span>
                    </div>
                    <input
                      className="form-input block w-full h-[56px] pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
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
            <div className="bg-[#10b981]/10 border-t-2 border-[#10b981] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-gray-900 dark:text-white text-lg font-bold">Jouw Afloscapaciteit per maand</p>
                <p className="text-gray-500 dark:text-[#a1a1a1] text-sm max-w-sm">
                  Dit is het bedrag dat je maandelijks veilig kunt besteden aan het aflossen van je schulden.
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[#10b981] font-extrabold text-4xl tracking-tight">
                  {formatCurrency(calculation.afloscapaciteit)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs font-bold text-[#10b981] uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Beschikbaar
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-8 mb-12">
            <button
              className="w-full bg-[#10b981] hover:bg-[#0d9668] text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-[#10b981]/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
              onClick={handleSave}
            >
              <span className="material-symbols-outlined">save</span>
              Opslaan & Terug naar overzicht
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center px-4 pb-8">
            <p className="text-sm text-gray-500 dark:text-[#6b7280]">
              Deze berekening is een indicatie op basis van de ingevulde gegevens. <br className="hidden md:block"/>
              Raadpleeg altijd een financieel adviseur voor een officiële VTLB berekening.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
