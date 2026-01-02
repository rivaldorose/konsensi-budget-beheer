import React, { useState, useEffect } from 'react';
import { User } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

export default function Adempauze() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wellbeing, setWellbeing] = useState(null);
  const [completedActions, setCompletedActions] = useState([]);
  const [userData, setUserData] = useState({
    income: 0,
    debts: 0,
    status: 'volledig',
    activatedAt: null,
    daysActive: 0
  });
  const { toast } = useToast();

  const nextSteps = [
    { key: 'inform_creditors', label: 'Informeer schuldeisers', completed: false },
    { key: 'contact_debt_help', label: 'Contact schuldhulpverlening', completed: false },
    { key: 'apply_benefits', label: 'Vraag uitkering aan', completed: false },
    { key: 'make_budget', label: 'Maak budgetplan', completed: false },
    { key: 'find_work', label: 'Vind werk/verhoog inkomen', completed: false }
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

      // Load income
      const incomes = await Income.filter({ created_by: userData.email });
      const monthlyIncome = incomes
        .filter(i => i.income_type === 'vast' && i.is_active !== false)
        .reduce((sum, i) => sum + (i.monthly_equivalent || i.amount || 0), 0);

      // Load debts
      const debts = await Debt.filter({ created_by: userData.email });
      const activeDebts = debts.filter(d => d.status !== 'afbetaald');
      const totalDebt = activeDebts.reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);

      // Calculate days active
      const activatedAt = userData.adempauze_activated_at 
        ? new Date(userData.adempauze_activated_at) 
        : new Date();
      const daysActive = Math.floor((new Date() - activatedAt) / (1000 * 60 * 60 * 24));

      setUserData({
        income: monthlyIncome,
        debts: totalDebt,
        status: userData.adempauze_protection_status || 'volledig',
        activatedAt: activatedAt,
        daysActive: daysActive
      });

      // Load completed actions
      setCompletedActions(userData.adempauze_actions_completed || []);

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

  const handleWellbeingSelect = async (mood) => {
    setWellbeing(mood);
    try {
      // Save wellbeing check
      await User.updateMyUserData({ 
        adempauze_wellbeing: mood,
        adempauze_wellbeing_checked_at: new Date().toISOString()
      });
      toast({
        title: 'Welzijn bijgewerkt',
        description: 'Bedankt voor het delen van hoe je je voelt.'
      });
    } catch (error) {
      console.error("Error saving wellbeing:", error);
    }
  };

  const handleActionToggle = async (actionKey) => {
    const newCompleted = completedActions.includes(actionKey)
      ? completedActions.filter(a => a !== actionKey)
      : [...completedActions, actionKey];
    
    setCompletedActions(newCompleted);
    
    try {
      await User.updateMyUserData({
        adempauze_actions_completed: newCompleted
      });
    } catch (error) {
      console.error("Error saving action:", error);
      // Revert on error
      setCompletedActions(completedActions);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm("Weet je zeker dat je Adempauze wilt deactiveren?")) {
      try {
        await User.updateMyUserData({
          adempauze_active: false
        });
        toast({
          title: 'Adempauze gedeactiveerd',
          description: 'Je kunt de adempauze altijd opnieuw activeren.'
        });
        window.location.href = createPageUrl('Dashboard');
      } catch (error) {
        console.error("Error deactivating adempauze:", error);
        toast({
          variant: 'destructive',
          title: 'Fout bij deactiveren'
        });
      }
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

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('nl-NL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  const wellbeingOptions = [
    { emoji: '😢', label: 'Slecht', value: 'slecht' },
    { emoji: '😕', label: 'Gaat', value: 'gaat' },
    { emoji: '😐', label: 'Oké', value: 'oke' },
    { emoji: '🙂', label: 'Goed', value: 'goed' },
    { emoji: '😊', label: 'Top!', value: 'top' }
  ];

    return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-body dark:text-white flex flex-col">
      {/* Top Navigation Bar */}
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
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors" href={createPageUrl('Dashboard')}>Dashboard</a>
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors" href={createPageUrl('BudgetPlan')}>Balans</a>
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors" href={createPageUrl('debts')}>Schulden</a>
            <a className="text-white font-display font-medium text-sm hover:text-accent dark:hover:text-primary transition-colors" href={createPageUrl('Settings')}>Instellingen</a>
          </nav>
          {/* Right: User Area */}
          <div className="flex items-center gap-6">
            <button className="text-white hover:text-accent dark:hover:text-primary transition-colors material-symbols-outlined">search</button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                className="sr-only peer" 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleTheme}
              />
              <div className="w-14 h-7 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/20 flex items-center justify-between px-1.5">
                <span className="material-symbols-outlined text-[16px] text-yellow-300 z-10 select-none">light_mode</span>
                <span className="material-symbols-outlined text-[16px] text-white/80 z-10 select-none">dark_mode</span>
              </div>
            </label>
            <div className="flex items-center gap-3 pl-2 border-l border-white/20">
              <span className="bg-purple-badge text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Level 9</span>
              <span className="text-white font-body text-sm hidden sm:block">{user?.voornaam || 'Gebruiker'}</span>
              <div 
                className="h-8 w-8 rounded-full bg-cover bg-center border-2 border-accent"
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

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-[1400px] mx-auto p-4 md:p-8">
        {/* Status Banner */}
        <section className="bg-success dark:bg-success rounded-3xl p-6 md:p-8 border-l-[6px] border-l-success-dark dark:border-l-success-dark shadow-green dark:shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative overflow-hidden group">
          {/* Decorative circle */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white dark:bg-white/5 rounded-full pointer-events-none"></div>
          <div className="flex items-start md:items-center gap-6 z-10">
            <div className="bg-white/20 dark:bg-white/10 p-3 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
              <span className="material-symbols-outlined text-white text-3xl">spa</span>
            </div>
            <div>
              <h1 className="text-white font-display font-bold text-2xl leading-tight">Adempauze is actief</h1>
              <p className="text-white/90 dark:text-white/80 font-body text-sm mt-1">
                Geactiveerd op {userData.activatedAt ? formatDate(userData.activatedAt) : formatDate(new Date())}
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 z-10 w-full md:w-auto">
            <p className="text-white dark:text-white/90 font-body text-[15px] leading-relaxed max-w-[500px]">
              Je hebt nu de rust om je situatie op orde te brengen. Neem de tijd voor jezelf en je financiële gezondheid.
            </p>
            <button 
              className="bg-white dark:bg-white text-success dark:text-success hover:bg-white/95 dark:hover:bg-white/90 transition-colors font-display font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2 group-hover:scale-105 duration-200"
              onClick={handleDeactivate}
            >
              <span>Deactiveer Adempauze</span>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-8 items-start">
          {/* LEFT COLUMN: Content */}
          <div className="flex flex-col gap-8">
            {/* 1. WELZIJN CHECK */}
            <div className="bg-white dark:bg-[#1a2c26] rounded-3xl p-8 shadow-soft dark:shadow-lg border dark:border-[#2A3F36]">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-text-main dark:text-white font-display font-bold text-xl">💭 Hoe voel je je vandaag?</h2>
              </div>
              <div className="grid grid-cols-5 gap-4 mb-4">
                {wellbeingOptions.map((option, index) => {
                  const isSelected = wellbeing === option.value;
                  return (
                    <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer">
                      <button 
                        className={`w-full aspect-square max-w-[80px] rounded-xl border-2 ${
                          isSelected 
                            ? 'border-success dark:border-success bg-accent dark:bg-success/20 shadow-sm scale-110 ring-2 ring-accent dark:ring-success ring-offset-2' 
                            : 'border-gray-200 dark:border-[#2A3F36] hover:border-success dark:hover:border-success hover:bg-accent/30 dark:hover:bg-success/10 hover:scale-105'
                        } transition-all duration-200 flex items-center justify-center text-3xl md:text-4xl`}
                        onClick={() => handleWellbeingSelect(option.value)}
                      >
                        {option.emoji}
                      </button>
                      <span className={`font-body text-xs ${
                        isSelected 
                          ? 'text-success dark:text-success font-bold' 
                          : 'text-text-sub dark:text-[#9CA3AF] font-medium group-hover:text-success dark:group-hover:text-success'
                      } transition-colors`}>
                        {option.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-text-sub dark:text-[#9CA3AF] font-body text-[13px] italic text-center md:text-left mt-2">
                We houden je voortgang bij om je te ondersteunen
              </p>
              </div>

            {/* 2. RUST & HERSTEL TIPS */}
            <div className="bg-white dark:bg-[#1a2c26] rounded-3xl p-8 shadow-soft dark:shadow-lg border dark:border-[#2A3F36]">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
                <div>
                  <h2 className="text-text-main dark:text-white font-display font-bold text-xl flex items-center gap-2">
                    🌿 Rust & Herstel Activiteiten
                  </h2>
                  <p className="text-text-body/80 dark:text-[#9CA3AF] font-body text-sm mt-1">
                    Hier zijn een paar dingen die kunnen helpen om weer rustig te worden:
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: 'directions_walk', title: 'Wandelen', text: 'Maak een korte wandeling voor frisse lucht en beweging.' },
                  { icon: 'local_cafe', title: 'Thee moment', text: 'Zet een kop thee en drink deze zonder afleiding op.' },
                  { icon: 'self_improvement', title: 'Ademhaling', text: 'Doe een 4-7-8 ademhalingsoefening voor directe rust.' },
                  { icon: 'menu_book', title: 'Gezonde Afleiding', text: 'Lees een hoofdstuk uit een boek of luister muziek.' },
                  { icon: 'nature_people', title: 'Naar Buiten', text: 'Zoek een park of natuurgebied op in de buurt.' },
                  { icon: 'edit_note', title: 'Schrijf het op', text: 'Schrijf je gedachten van je af in een dagboek.' }
                ].map((tip, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-[#1a2c26]-elevated rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 group cursor-pointer border dark:border-[#2A3F36]">
                    <div className="bg-white dark:bg-[#1a2c26] w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-sm text-primary dark:text-success group-hover:text-success dark:group-hover:text-success transition-colors border dark:border-[#2A3F36]">
                      <span className="material-symbols-outlined">{tip.icon}</span>
                </div>
                    <h3 className="font-display font-semibold text-[17px] text-text-main dark:text-white mb-1">{tip.title}</h3>
                    <p className="font-body text-sm text-text-body dark:text-[#9CA3AF] leading-relaxed">{tip.text}</p>
                  </div>
                ))}
                </div>
              </div>
              
            {/* 3. AANDACHTSPUNTEN REMINDER */}
            <div className="bg-accent-soft dark:bg-accent/10 border-2 border-accent dark:border-accent rounded-3xl p-6 flex gap-4 items-start">
              <div className="bg-white/80 dark:bg-warning/20 p-2 rounded-full shrink-0 text-warning dark:text-warning">
                <span className="material-symbols-outlined icon-filled">warning</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-[16px] text-text-main dark:text-white mb-1">Vergeet niet je essentiële rekeningen te betalen</h3>
                <p className="font-body text-sm text-text-body dark:text-[#9CA3AF] leading-relaxed">
                  Tijdens je adempauze worden schulden gepauzeerd, maar je moet nog steeds je lopende kosten zoals huur, energie en boodschappen betalen.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="flex flex-col gap-6 sticky top-24">
            {/* 1. JE STATUS */}
            <div className="bg-white dark:bg-[#1a2c26] rounded-3xl p-6 shadow-soft dark:shadow-lg border border-gray-100 dark:border-[#2A3F36]">
              <h2 className="text-text-main dark:text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">analytics</span>
                Je Status
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#2A3F36] pb-3">
                  <span className="text-text-sub dark:text-[#9CA3AF] font-body text-sm">Inkomen</span>
                  <span className="text-success dark:text-success font-display font-semibold text-base">
                    {formatCurrency(userData.income)}/mnd
                  </span>
                    </div>
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-[#2A3F36] pb-3">
                  <span className="text-text-sub dark:text-[#9CA3AF] font-body text-sm">Schulden</span>
                  <span className="text-warning dark:text-warning font-display font-semibold text-base">
                    {formatCurrency(userData.debts)}
                  </span>
                        </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-text-sub dark:text-[#9CA3AF] font-body text-sm">Status</span>
                  <span className="bg-success/10 dark:bg-success/20 text-success-dark dark:text-success text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Volledig Beschermd
                  </span>
            </div>
          </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2A3F36] flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-text-sub dark:text-[#9CA3AF] font-body text-xs">Actief sinds</span>
                  <span className="text-text-body dark:text-white font-body text-sm font-medium">
                    {userData.activatedAt ? formatDate(userData.activatedAt) : formatDate(new Date())}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-text-sub dark:text-[#9CA3AF] font-body text-xs">Dagen actief</span>
                  <span className="text-text-body dark:text-white font-body text-sm font-medium">
                    {userData.daysActive} dagen
                  </span>
          </div>
        </div>
            </div>

            {/* 2. VOLGENDE STAPPEN */}
            <div className="bg-white dark:bg-[#1a2c26] rounded-3xl p-6 shadow-soft dark:shadow-lg border border-gray-100 dark:border-[#2A3F36]">
              <h2 className="text-text-main dark:text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-info dark:text-info">check_circle</span>
                Volgende Stappen
              </h2>
              <div className="flex flex-col gap-3 mb-6">
                {nextSteps.map((step, index) => {
                  const isCompleted = completedActions.includes(step.key);
  return (
                    <label key={index} className={`flex items-start gap-3 cursor-pointer group ${isCompleted ? 'opacity-60' : ''}`}>
                      <input 
                        checked={isCompleted}
                        className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-[#2A3F36] text-success dark:text-success focus:ring-success/20 cursor-pointer" 
                        type="checkbox"
                        onChange={() => handleActionToggle(step.key)}
                      />
                      <span className={`text-text-body dark:text-white font-body text-sm ${
                        isCompleted ? 'line-through decoration-gray-400 dark:decoration-gray-600' : 'group-hover:text-text-main dark:group-hover:text-white'
                      } transition-colors`}>
                        {step.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              <button 
                className="w-full bg-info dark:bg-info hover:bg-info/90 dark:hover:bg-info/80 text-white font-display font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
                onClick={() => window.location.href = createPageUrl('Dashboard')}
              >
                Bekijk Actieplan
              </button>
            </div>

            {/* 3. MOTIVATIE CARD */}
            <div className="bg-purple-soft dark:bg-purple-badge/10 rounded-2xl p-6 text-center border border-purple-100 dark:border-purple-badge/20">
              <div className="text-4xl mb-3 block">💪</div>
              <h3 className="text-text-main dark:text-white font-display font-bold text-base mb-2">"Je bent niet alleen. 💚"</h3>
              <p className="text-text-sub dark:text-[#9CA3AF] font-body text-[13px] leading-relaxed">
                Deze momenten gaan voorbij. Je doet het goed door even te pauzeren.
              </p>
                  </div>
                </div>
        </div>
      </main>
      {/* Simple Footer spacer */}
      <div className="h-12 w-full"></div>
    </div>
  );
}
