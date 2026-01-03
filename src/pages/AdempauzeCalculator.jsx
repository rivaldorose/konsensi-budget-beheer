import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function AdempauzeCalculator() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nettoIncome: 0,
    rentMortgage: 0,
    healthInsurance: 0,
    otherFixedCosts: 0,
    householdSize: 1,
    childrenUnder18: 0
  });
  const [beslagvrijeVoet, setBeslagvrijeVoet] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
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
    calculateBeslagvrijeVoet();
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

      // Load income
      const incomes = await Income.filter({ created_by: userData.email });
      const monthlyIncome = incomes
        .filter(i => i.income_type === 'vast' && i.is_active !== false)
        .reduce((sum, i) => sum + (i.monthly_equivalent || i.amount || 0), 0);

      // Load fixed costs
      const costs = await MonthlyCost.filter({ created_by: userData.email });
      const healthInsurance = costs.find(c => c.category === 'zorgverzekering' || c.name?.toLowerCase().includes('zorg'))?.amount || 0;
      const rentMortgage = costs.find(c => c.category === 'huisvesting' || c.name?.toLowerCase().includes('huur') || c.name?.toLowerCase().includes('hypotheek'))?.amount || 0;
      const otherFixedCosts = costs
        .filter(c => c.category !== 'zorgverzekering' && c.category !== 'huisvesting')
        .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

      // Load household info from user
      const householdSize = userData.vtlb_settings?.persoonlijkeSituatie?.aantalKinderen 
        ? 1 + (userData.vtlb_settings.persoonlijkeSituatie.aantalKinderen || 0)
        : 1;
      const childrenUnder18 = userData.vtlb_settings?.persoonlijkeSituatie?.aantalKinderen || 0;

      setFormData({
        nettoIncome: monthlyIncome || 0,
        rentMortgage: rentMortgage || 0,
        healthInsurance: healthInsurance || 0,
        otherFixedCosts: otherFixedCosts || 0,
        householdSize: householdSize,
        childrenUnder18: childrenUnder18
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

  const calculateBeslagvrijeVoet = () => {
    // Basis beslagvrije voet 2025
    let basisBedrag = 1626;

    // Aanpassing voor gezinssituatie
    if (formData.householdSize >= 2) {
      // Gehuwd/samenwonend
      basisBedrag = 2280;
    }

    // Aanpassing voor kinderen
    if (formData.childrenUnder18 > 0) {
      basisBedrag += formData.childrenUnder18 * 125;
    }

    setBeslagvrijeVoet(basisBedrag);

    // Check if income is below beslagvrije voet
    const isBelow = formData.nettoIncome <= basisBedrag;
    setIsEligible(isBelow);
  };

  const handleActivate = async () => {
    try {
      await User.updateMyUserData({
        adempauze_active: true,
        adempauze_activated_at: new Date().toISOString(),
        adempauze_trigger: 'calculator',
        adempauze_protection_status: isEligible ? 'volledig' : 'gedeeltelijk'
      });
      toast({
        title: 'Adempauze geactiveerd!',
        description: 'Je hebt nu de rust om je situatie op orde te brengen.'
      });
      window.location.href = createPageUrl('Adempauze');
    } catch (error) {
      console.error("Error activating adempauze:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij activeren'
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
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white flex flex-col">
      {/* Header */}
      <header className="bg-primary dark:bg-[#1a2c26] h-16 shadow-[0_2px_4px_rgba(0,0,0,0.1)] dark:border-b dark:border-[#2A3F36] sticky top-0 z-50">
        <div className="h-full max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌳</span>
            <span className="font-display font-bold text-white tracking-wide">
              KONSENSI <span className="font-normal opacity-90">Budgetbeheer</span>
            </span>
          </div>
          {/* Middle: Nav Items (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors opacity-80 hover:opacity-100" href={createPageUrl('Dashboard')}>Dashboard</a>
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors opacity-80 hover:opacity-100" href={createPageUrl('BudgetPlan')}>Balans</a>
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors opacity-80 hover:opacity-100" href={createPageUrl('debts')}>Schulden</a>
            <a className="text-accent dark:text-primary font-display font-medium text-sm flex items-center gap-1" href={createPageUrl('Adempauze')}>
              <span className="material-symbols-outlined text-sm">spa</span>
              Adempauze
            </a>
          </nav>
          {/* Right: User Area */}
          <div className="flex items-center gap-4">
            <button 
              className="text-white hover:text-accent dark:hover:text-primary transition-colors material-symbols-outlined"
              onClick={toggleTheme}
            >
              {darkMode ? 'light_mode' : 'dark_mode'}
            </button>
            <div className="h-4 w-[1px] bg-white/20"></div>
            <button className="text-white font-display text-sm font-medium hover:text-accent dark:hover:text-primary">NL</button>
            <button className="text-white hover:text-accent dark:hover:text-primary transition-colors material-symbols-outlined">settings</button>
            <div className="flex items-center gap-3 pl-2 border-l border-white/20">
              <span className="bg-purple-badge text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:block">Level 9</span>
              <span className="text-white font-body text-sm hidden sm:block">{user?.voornaam || 'Gebruiker'}</span>
              <div 
                className="h-8 w-8 rounded-full bg-cover bg-center border-2 border-accent cursor-pointer"
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto p-8 flex flex-col items-center">
        <div className="w-full mb-8">
          <div className="flex items-center gap-4 mb-4 group cursor-pointer w-fit" onClick={() => window.location.href = createPageUrl('Adempauze')}>
            <span className="material-symbols-outlined text-[#6B7280] dark:text-gray-400 text-2xl group-hover:text-primary dark:group-hover:text-primary transition-colors">arrow_back</span>
            <h1 className="font-display font-bold text-[32px] text-[#1F2937] dark:text-white leading-tight">Adempauze Check: Beslagvrije Voet</h1>
          </div>
          <p className="font-body text-[#6B7280] dark:text-gray-400 text-[16px] pl-10">
            Bereken of je inkomen onder de beslagvrije voet valt.
          </p>
        </div>

        <div className="w-full bg-white dark:bg-[#1a2c26] rounded-3xl border border-[#E5E7EB] dark:border-[#2A3F36] shadow-soft dark:shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Jouw Inkomen Section */}
            <div className="mb-8">
              <h2 className="font-display font-semibold text-[20px] text-[#1F2937] dark:text-white mb-5">Jouw Inkomen</h2>
              <p className="font-body text-[14px] text-[#6B7280] dark:text-gray-400 mb-4">
                Gebruik je verwachte maandinkomen voor deze berekening.
              </p>
              <div className="max-w-md">
                <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Netto Maandinkomen</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">euro</span>
                  </div>
                  <input 
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                    placeholder="0.00" 
                    type="number"
                    value={formData.nettoIncome || ''}
                    onChange={(e) => setFormData({...formData, nettoIncome: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <button className="mt-4 flex items-center gap-2 text-success dark:text-success hover:text-success-dark dark:hover:text-success/80 hover:underline font-body text-sm font-medium transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
                Extra inkomen toevoegen (optioneel)
              </button>
            </div>

            <hr className="border-gray-100 dark:border-[#2A3F36] my-8" />

            {/* Jouw Situatie & Essentiële Kosten Section */}
            <div>
              <h2 className="font-display font-semibold text-[20px] text-[#1F2937] dark:text-white mb-6">Jouw Situatie & Essentiële Kosten</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Huur/Hypotheek */}
                <div>
                  <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Huur/Hypotheek</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">euro</span>
                    </div>
                    <input 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                      placeholder="0.00" 
                      type="number" 
                      value={formData.rentMortgage || ''}
                      onChange={(e) => setFormData({...formData, rentMortgage: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Zorgverzekering */}
                <div>
                  <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Zorgverzekering</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">euro</span>
                    </div>
                    <input 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                      placeholder="0.00" 
                      type="number" 
                      value={formData.healthInsurance || ''}
                      onChange={(e) => setFormData({...formData, healthInsurance: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Overige Vaste Lasten */}
                <div className="md:col-span-2">
                  <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Overige Vaste Lasten (excl. schulden)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">euro</span>
                    </div>
                    <input 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                      placeholder="0.00" 
                      type="number" 
                      value={formData.otherFixedCosts || ''}
                      onChange={(e) => setFormData({...formData, otherFixedCosts: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Aantal gezinsleden */}
                <div>
                  <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Aantal gezinsleden (incl. jezelf)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">group</span>
                    </div>
                    <input 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                      placeholder="1" 
                      type="number" 
                      min="1"
                      value={formData.householdSize || ''}
                      onChange={(e) => setFormData({...formData, householdSize: parseInt(e.target.value) || 1})}
                    />
                        </div>
                      </div>

                {/* Aantal kinderen onder 18 */}
                <div>
                  <label className="block font-body font-semibold text-[14px] text-[#374151] dark:text-gray-300 mb-2">Aantal kinderen onder 18</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-lg">child_care</span>
                    </div>
                    <input 
                      className="w-full pl-11 pr-4 py-3.5 bg-[#F9FAFB] dark:bg-[#1a2c26]-elevated border border-[#E5E7EB] dark:border-[#2A3F36] rounded-[24px] text-[#1F2937] dark:text-white font-body text-[16px] focus:ring-0 focus:border-success dark:focus:border-success focus:bg-white dark:focus:bg-dark-card focus:shadow-sm transition-all outline-none" 
                      placeholder="0" 
                      type="number" 
                      min="0"
                      value={formData.childrenUnder18 || ''}
                      onChange={(e) => setFormData({...formData, childrenUnder18: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            </div>
                </div>

          {/* Result Section */}
          <div className="bg-success/10 dark:bg-success/10 border-t-2 border-success dark:border-success p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="font-display font-bold text-[20px] text-[#1F2937] dark:text-white">Jouw Beslagvrije Voet</h3>
              <span className="font-display font-bold text-[36px] text-success dark:text-success">{formatCurrency(beslagvrijeVoet)}</span>
            </div>
            <div className={`bg-white/50 dark:bg-white/5 rounded-[24px] p-4 text-center border border-success/20 dark:border-success/20 mb-6`}>
              <p className={`font-body text-[16px] ${isEligible ? 'text-success dark:text-success' : 'text-warning dark:text-warning'} font-medium mb-1`}>
                Jouw inkomen valt <strong>{isEligible ? 'onder' : 'boven'}</strong> de beslagvrije voet.
              </p>
              <p className="font-body text-[14px] text-[#6B7280] dark:text-gray-400">
                {isEligible 
                  ? 'Je komt in aanmerking voor Adempauze. Je inkomen is beschermd.'
                  : `Je inkomen is €${formatCurrency(formData.nettoIncome - beslagvrijeVoet)} boven de beslagvrije voet. Je komt mogelijk nog steeds in aanmerking voor Adempauze.`
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <button 
                className="px-6 py-4 rounded-[24px] border border-[#E5E7EB] dark:border-[#2A3F36] bg-white dark:bg-[#1a2c26] text-success dark:text-success font-display font-semibold text-sm hover:bg-[#F3F4F6] dark:hover:bg-dark-card-elevated transition-colors w-full sm:w-auto"
                onClick={() => window.location.href = createPageUrl('Adempauze')}
              >
                Terug naar Adempauze
              </button>
              <button 
                className="px-8 py-4 rounded-[24px] bg-success dark:bg-success text-white font-display font-semibold text-sm hover:bg-success-dark dark:hover:bg-success/80 transition-colors w-full sm:w-auto shadow-sm flex items-center justify-center gap-2"
                onClick={handleActivate}
              >
                Activeer Adempauze
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
      </div>
      </main>
    </div>
  );
}
