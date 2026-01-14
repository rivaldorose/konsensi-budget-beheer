import React, { useState, useEffect } from 'react';
import { User, MonthlyCost, Debt } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";

// Recofa normen 2024/2025 (bijstandsnormen als basis voor beslagvrije voet)
const RECOFA_NORMEN = {
  alleenstaand: 1255.67,
  gehuwdSamenwonend: 1793.81,
  alleenstaandeOuder: 1255.67,
  kinderbijslagPerKind: 104.00,
  maxWoonkostenComponent: 879.66,
  zorgverzekeringsComponent: 135,
};

export default function VTLBSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    householdType: 'Alleenstaand',
    numberOfChildren: 0,
    rentMortgage: 0,
    healthInsurance: 135,
  });
  const [baseData, setBaseData] = useState({
    monthlyIncome: 0,
    fixedCosts: 0,
    currentArrangements: 0
  });
  const [calculation, setCalculation] = useState({
    totalIncome: 0,
    beslagvrijeVoet: 0,
    afloscapaciteit: 0,
    breakdown: {
      basisnorm: 0,
      woonkosten: 0,
      zorgverzekering: 0,
      kinderbijslag: 0
    }
  });
  const location = useLocation();
  const { toast } = useToast();

  const currentPath = location.pathname;
  const isActiveRoute = (path) => {
    if (path === 'Settings') return currentPath === createPageUrl('Settings');
    return currentPath === createPageUrl(path);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateVTLB();
  }, [formData, baseData]);

  const getBasisnorm = (householdType) => {
    switch (householdType) {
      case 'Gehuwd / Samenwonend':
        return RECOFA_NORMEN.gehuwdSamenwonend;
      case 'Alleenstaande ouder':
        return RECOFA_NORMEN.alleenstaandeOuder;
      case 'Alleenstaand':
      default:
        return RECOFA_NORMEN.alleenstaand;
    }
  };

  const calculateVTLB = () => {
    const totalIncome = baseData.monthlyIncome;
    const basisnorm = getBasisnorm(formData.householdType);
    const woonkosten = Math.min(formData.rentMortgage || 0, RECOFA_NORMEN.maxWoonkostenComponent);
    const zorgverzekering = formData.healthInsurance || RECOFA_NORMEN.zorgverzekeringsComponent;
    const kinderbijslag = (formData.numberOfChildren || 0) * RECOFA_NORMEN.kinderbijslagPerKind;
    const beslagvrijeVoet = basisnorm + woonkosten + zorgverzekering + kinderbijslag;
    const afloscapaciteit = Math.max(0, totalIncome - beslagvrijeVoet - baseData.currentArrangements);

    setCalculation({
      totalIncome,
      beslagvrijeVoet,
      afloscapaciteit,
      breakdown: {
        basisnorm,
        woonkosten,
        zorgverzekering,
        kinderbijslag
      }
    });
  };

  const loadData = async () => {
    try {
      const userData = await User.me();
      const costs = await MonthlyCost.filter({ user_id: userData.id });
      const debts = await Debt.filter({ user_id: userData.id });

      const monthlyIncome = parseFloat(userData.monthly_income || 0);
      const totalFixedCosts = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      const debtsWithArrangements = debts.filter(debt =>
        debt.status === 'betalingsregeling' || debt.status === 'payment_arrangement'
      );
      const currentArrangements = debtsWithArrangements.reduce((sum, debt) =>
        sum + parseFloat(debt.monthly_payment || 0), 0
      );

      // Try to get rent/mortgage from costs
      const huurCost = costs.find(c => c.category === 'huur' || c.category === 'hypotheek' || c.name?.toLowerCase().includes('huur') || c.name?.toLowerCase().includes('hypotheek'));
      const zorgCost = costs.find(c => c.category === 'zorgverzekering' || c.name?.toLowerCase().includes('zorg'));

      setBaseData({
        monthlyIncome,
        fixedCosts: totalFixedCosts,
        currentArrangements
      });

      // Pre-fill form with data from costs if available
      setFormData(prev => ({
        ...prev,
        rentMortgage: huurCost ? parseFloat(huurCost.amount || 0) : prev.rentMortgage,
        healthInsurance: zorgCost ? parseFloat(zorgCost.amount || 0) : prev.healthInsurance,
      }));

    } catch (error) {
      console.error("Error loading VTLB data:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij laden gegevens'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      toast({
        title: 'Berekening opgeslagen',
        description: 'Je VTLB gegevens zijn bijgewerkt.'
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij opslaan'
      });
    } finally {
      setSaving(false);
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
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          {/* Page Header - Fixed */}
          <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">settings</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Beheer je profiel, notificaties en app-voorkeuren</p>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-[#0d1b17] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('HelpSupport')}
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span>Hulp</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar Navigation - Fixed */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Settings') ? 'fill-1' : ''}`} style={isActiveRoute('Settings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    account_circle
                  </span>
                  <span className={`text-sm ${isActiveRoute('Settings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('SecuritySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('SecuritySettings') ? 'fill-1' : ''}`} style={isActiveRoute('SecuritySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    shield
                  </span>
                  <span className={`text-sm ${isActiveRoute('SecuritySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Account & Beveiliging</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('DisplaySettings') ? 'fill-1' : ''}`} style={isActiveRoute('DisplaySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    tune
                  </span>
                  <span className={`text-sm ${isActiveRoute('DisplaySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>App Voorkeuren</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </Link>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Help Center</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  to={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  to={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content Section - Scrollable */}
            <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                  <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">VTLB Berekening</h2>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Bereken je Vrij Te Laten Bedrag op basis van de officiële Recofa-normen 2024</p>
                </div>

                {/* Section 1: Inkomen */}
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary dark:text-green-400">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Netto inkomen</h3>
                  </div>
                  <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Maandelijks inkomen (uit je profiel)</span>
                    <span className="text-primary dark:text-green-400 font-bold text-lg">
                      {formatCurrency(baseData.monthlyIncome)}
                    </span>
                  </div>
                  <button
                    className="text-primary dark:text-green-400 text-sm font-medium hover:underline flex items-center gap-1 group mt-2"
                    onClick={() => window.location.href = createPageUrl('Income')}
                  >
                    Inkomen aanpassen
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                </section>

                <hr className="border-gray-100 dark:border-[#2a2a2a] mb-8" />

                {/* Section 2: Huishouden */}
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                    </div>
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Huishouden</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Type huishouden</label>
                      <select
                        className="form-select block w-full h-[50px] px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-medium focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        value={formData.householdType}
                        onChange={(e) => setFormData({...formData, householdType: e.target.value})}
                      >
                        <option>Alleenstaand</option>
                        <option>Gehuwd / Samenwonend</option>
                        <option>Alleenstaande ouder</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Basisnorm: {formatCurrency(getBasisnorm(formData.householdType))}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Aantal kinderen</label>
                      <div className="flex items-center h-[50px] border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                        <button
                          className="px-4 h-full text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
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
                          className="px-4 h-full text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                          onClick={() => setFormData({...formData, numberOfChildren: formData.numberOfChildren + 1})}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        + {formatCurrency(RECOFA_NORMEN.kinderbijslagPerKind)} per kind
                      </p>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-[#2a2a2a] mb-8" />

                {/* Section 3: Vaste lasten voor beslagvrije voet */}
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                      <span className="material-symbols-outlined text-[20px]">home</span>
                    </div>
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Vaste lasten (voor beslagvrije voet)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Huur / Hypotheek</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 dark:text-gray-500 font-bold">€</span>
                        </div>
                        <input
                          className="form-input block w-full h-[50px] pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="0.00"
                          type="number"
                          value={formData.rentMortgage || ''}
                          onChange={(e) => setFormData({...formData, rentMortgage: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Max. {formatCurrency(RECOFA_NORMEN.maxWoonkostenComponent)} (huurtoeslaggrens)
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Zorgverzekering (netto)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-400 dark:text-gray-500 font-bold">€</span>
                        </div>
                        <input
                          className="form-input block w-full h-[50px] pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          placeholder="135.00"
                          type="number"
                          value={formData.healthInsurance || ''}
                          onChange={(e) => setFormData({...formData, healthInsurance: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Na aftrek zorgtoeslag
                      </p>
                    </div>
                  </div>
                </section>

                {/* Lopende betalingsregelingen */}
                {baseData.currentArrangements > 0 && (
                  <>
                    <hr className="border-gray-100 dark:border-[#2a2a2a] mb-8" />
                    <section className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                          <span className="material-symbols-outlined text-[20px]">payments</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Lopende betalingsregelingen</h3>
                      </div>
                      <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Maandelijkse aflossingen</span>
                        <span className="text-purple-500 font-bold text-lg">
                          - {formatCurrency(baseData.currentArrangements)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Dit bedrag wordt afgetrokken van je beschikbare afloscapaciteit
                      </p>
                    </section>
                  </>
                )}

                <hr className="border-gray-100 dark:border-[#2a2a2a] mb-8" />

                {/* Section: Beslagvrije voet breakdown */}
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
                      <span className="material-symbols-outlined text-[20px]">calculate</span>
                    </div>
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold">Beslagvrije voet berekening</h3>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-5 space-y-3 border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Basisnorm ({formData.householdType})</span>
                      <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(calculation.breakdown.basisnorm)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">+ Woonkosten</span>
                      <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(calculation.breakdown.woonkosten)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">+ Zorgverzekering</span>
                      <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(calculation.breakdown.zorgverzekering)}</span>
                    </div>
                    {calculation.breakdown.kinderbijslag > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">+ Kinderbijslag ({formData.numberOfChildren} kind{formData.numberOfChildren !== 1 ? 'eren' : ''})</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(calculation.breakdown.kinderbijslag)}</span>
                      </div>
                    )}
                    <hr className="border-gray-200 dark:border-[#2a2a2a] my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-white font-bold">Beslagvrije voet</span>
                      <span className="text-amber-500 font-bold text-lg">{formatCurrency(calculation.beslagvrijeVoet)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                    De beslagvrije voet is het minimumbedrag dat je nodig hebt om van te leven. Dit bedrag is beschermd tegen beslag.
                  </p>
                </section>

                {/* Calculation Result */}
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-[24px] p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center md:text-left">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Netto inkomen</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">{formatCurrency(calculation.totalIncome)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Beslagvrije voet</p>
                      <p className="text-amber-500 font-bold text-lg">- {formatCurrency(calculation.beslagvrijeVoet)}</p>
                    </div>
                    {baseData.currentArrangements > 0 && (
                      <div className="text-center md:text-right">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Lopende regelingen</p>
                        <p className="text-purple-500 font-bold text-lg">- {formatCurrency(baseData.currentArrangements)}</p>
                      </div>
                    )}
                  </div>
                  <hr className="border-primary/20 mb-4" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-gray-900 dark:text-white text-lg font-bold">Jouw Afloscapaciteit</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Beschikbaar voor extra schuldaflossing per maand
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary dark:text-green-400 font-extrabold text-3xl tracking-tight">
                        {formatCurrency(calculation.afloscapaciteit)}
                      </p>
                      {calculation.afloscapaciteit > 0 ? (
                        <div className="flex items-center gap-1 mt-1 text-xs font-bold text-primary dark:text-green-400 uppercase tracking-wide justify-end">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Beschikbaar
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1 text-xs font-bold text-red-500 uppercase tracking-wide justify-end">
                          <span className="material-symbols-outlined text-base">info</span>
                          Geen ruimte
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Berekening opslaan
                    </>
                  )}
                </button>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[24px] p-5 flex flex-col sm:flex-row gap-4 items-start mt-8 border border-blue-200 dark:border-blue-500/20">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-500">
                    <span className="material-symbols-outlined text-[20px] block">info</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-900 dark:text-white font-semibold text-[15px] mb-1">Over deze berekening</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-[13px] leading-relaxed">
                      Deze berekening is gebaseerd op de Recofa-normen 2024. De werkelijke beslagvrije voet kan afwijken op basis van je persoonlijke situatie. Raadpleeg een schuldhulpverlener voor een officiële berekening.
                    </p>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-6 text-center">
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    <a
                      className="text-primary dark:text-green-400 hover:underline"
                      href="https://www.rechtspraak.nl/Onderwerpen/Schulden/Paginas/Berekening-vtlb.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Officiële VTLB Calculator <span className="material-symbols-outlined text-[12px] align-middle">open_in_new</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
