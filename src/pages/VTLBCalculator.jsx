import React, { useState, useEffect } from 'react';
import { User, MonthlyCost, Debt } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";

// Recofa normen 2025 (bijstandsnormen als basis voor beslagvrije voet)
// Bron: https://www.rijksoverheid.nl/onderwerpen/bijstand/vraag-en-antwoord/hoe-hoog-is-de-bijstand
// Bron maximumbedragen: https://www.salarisvanmorgen.nl/2025/01/08/beslagvrije-voet-in-2025-nieuwe-maximumbedragen/
const RECOFA_NORMEN = {
  // Basisbedragen per maand (netto bijstandsnorm per 1 januari 2025, excl. vakantietoeslag)
  alleenstaand: 1278.18,           // 70% van gehuwdennorm
  gehuwdSamenwonend: 1825.97,      // 100% gehuwdennorm voor beide partners samen
  alleenstaandeOuder: 1278.18,     // Zelfde als alleenstaand, plus kinderbijslag/kindgebonden budget

  // Kinderbijslag gemiddeld per kind per maand (2025)
  kinderbijslagPerKind: 108.00,    // Gemiddelde voor kinderen 0-17 jaar

  // Woonkosten component (maximale huurtoeslaggrens als richtlijn)
  maxWoonkostenComponent: 900.07,  // Maximale subsidiabele huur 2025

  // Zorgverzekering (verplichte basispremie minus zorgtoeslag)
  zorgverzekeringsComponent: 140,  // Gemiddelde na zorgtoeslag 2025

  // Maximum beslagvrije voet per 1 januari 2025 (ter referentie)
  maxBeslagvrijeVoet: {
    alleenstaand: 2071.24,
    alleenstaandeOuder: 2242.24,
    gehuwdSamenwonendZonderKinderen: 2739.03,
    gehuwdSamenwonendMetKinderen: 2855.96,
  }
};

export default function VTLBCalculator() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    projectedIncome: 0,
    householdType: 'Alleenstaand',
    numberOfChildren: 0,
    rentMortgage: 0,
    healthInsurance: 135, // Standaard zorgverzekeringspremie
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
    fixedCosts: 0,
    currentArrangements: 0,
    maxBeslagvrijeVoet: 0,
    isMaxCapped: false,
    breakdown: {
      basisnorm: 0,
      woonkosten: 0,
      zorgverzekering: 0,
      kinderbijslag: 0
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateVTLB();
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

  const getMaxBeslagvrijeVoet = (householdType, numberOfChildren) => {
    const hasChildren = numberOfChildren > 0;
    switch (householdType) {
      case 'Gehuwd / Samenwonend':
        return hasChildren
          ? RECOFA_NORMEN.maxBeslagvrijeVoet.gehuwdSamenwonendMetKinderen
          : RECOFA_NORMEN.maxBeslagvrijeVoet.gehuwdSamenwonendZonderKinderen;
      case 'Alleenstaande ouder':
        return RECOFA_NORMEN.maxBeslagvrijeVoet.alleenstaandeOuder;
      case 'Alleenstaand':
      default:
        return RECOFA_NORMEN.maxBeslagvrijeVoet.alleenstaand;
    }
  };

  const calculateVTLB = () => {
    const totalIncome = baseData.monthlyIncome + (formData.projectedIncome || 0);

    // 1. Bereken basisnorm op basis van huishoudtype
    const basisnorm = getBasisnorm(formData.householdType);

    // 2. Woonkosten component (werkelijke huur/hypotheek, max. de huurtoeslaggrens)
    const woonkosten = Math.min(formData.rentMortgage || 0, RECOFA_NORMEN.maxWoonkostenComponent);

    // 3. Zorgverzekering (werkelijke premie)
    const zorgverzekering = formData.healthInsurance || RECOFA_NORMEN.zorgverzekeringsComponent;

    // 4. Kinderbijslag/kindgebonden budget per kind
    const kinderbijslag = (formData.numberOfChildren || 0) * RECOFA_NORMEN.kinderbijslagPerKind;

    // 5. Bereken totale beslagvrije voet
    // Formule: Basisnorm + Woonkosten + Zorgverzekering + Kinderbijslag
    const berekendeBeslagvrijeVoet = basisnorm + woonkosten + zorgverzekering + kinderbijslag;

    // 6. Haal het wettelijk maximum op basis van huishoudtype
    const maxBeslagvrijeVoet = getMaxBeslagvrijeVoet(formData.householdType, formData.numberOfChildren);

    // 7. De beslagvrije voet is het minimum van de berekende waarde en het wettelijk maximum
    const beslagvrijeVoet = Math.min(berekendeBeslagvrijeVoet, maxBeslagvrijeVoet);

    // 8. Bereken overige vaste lasten (lasten die niet in de beslagvrije voet zitten)
    // De huur/hypotheek en zorgverzekering zitten al in de beslagvrije voet, dus die trekken we af
    const lastenInBeslagvrijeVoet = woonkosten + zorgverzekering;
    const overigeVasteLasten = Math.max(0, baseData.fixedCosts - lastenInBeslagvrijeVoet);

    // 9. Afloscapaciteit = Netto inkomen - Beslagvrije voet - Overige vaste lasten - Lopende betalingsregelingen
    const afloscapaciteit = Math.max(0, totalIncome - beslagvrijeVoet - overigeVasteLasten - baseData.currentArrangements);

    setCalculation({
      totalIncome: totalIncome,
      beslagvrijeVoet: beslagvrijeVoet,
      afloscapaciteit: afloscapaciteit,
      fixedCosts: baseData.fixedCosts,
      overigeVasteLasten: overigeVasteLasten,
      currentArrangements: baseData.currentArrangements,
      maxBeslagvrijeVoet: maxBeslagvrijeVoet,
      isMaxCapped: berekendeBeslagvrijeVoet > maxBeslagvrijeVoet,
      breakdown: {
        basisnorm: basisnorm,
        woonkosten: woonkosten,
        zorgverzekering: zorgverzekering,
        kinderbijslag: kinderbijslag
      }
    });
  };

  const handleSave = async () => {
    try {
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
            <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-2">VTLB Berekening</h1>
            <p className="text-gray-500 dark:text-[#a1a1a1] text-base md:text-lg font-normal max-w-2xl">
              Bereken je Vrij Te Laten Bedrag (VTLB) op basis van de officiële Recofa-normen 2025.
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
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-500 dark:text-[#a1a1a1] text-sm font-semibold">
                      Netto inkomen <span className="font-normal text-xs text-gray-400">(uit je profiel)</span>
                    </label>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Salaris & Toeslagen</span>
                      <span className="text-[#10b981] font-bold font-mono text-lg">
                        {formatCurrency(baseData.monthlyIncome)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Extra inkomen (optioneel)</label>
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
                <div className="mt-4 p-4 bg-[#10b981]/5 dark:bg-[#10b981]/10 rounded-xl border border-[#10b981]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Totaal netto inkomen</span>
                    <span className="text-[#10b981] font-bold text-xl">{formatCurrency(calculation.totalIncome)}</span>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-[#2a2a2a]" />

              {/* Section 2: Huishouden */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Huishouden</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                      Basisnorm: {formatCurrency(getBasisnorm(formData.householdType))}
                    </p>
                  </div>
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
                    <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                      + {formatCurrency(RECOFA_NORMEN.kinderbijslagPerKind)} per kind
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-[#2a2a2a]" />

              {/* Section 3: Vaste lasten voor beslagvrije voet */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                    <span className="material-symbols-outlined text-[20px]">home</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Vaste lasten (voor beslagvrije voet)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Huur / Hypotheek</label>
                    <div className="relative group">
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
                    <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                      Max. {formatCurrency(RECOFA_NORMEN.maxWoonkostenComponent)} (huurtoeslaggrens)
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-sm font-bold">Zorgverzekering (netto)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 dark:text-[#6b7280] font-bold">€</span>
                      </div>
                      <input
                        className="form-input block w-full h-[56px] pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                        placeholder="135.00"
                        type="number"
                        value={formData.healthInsurance || ''}
                        onChange={(e) => setFormData({...formData, healthInsurance: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                      Na aftrek zorgtoeslag
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-[#2a2a2a]" />

              {/* Section 4: Overige vaste lasten */}
              {calculation.overigeVasteLasten > 0 && (
                <>
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-500/10 rounded-full text-red-500">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </div>
                      <h3 className="text-gray-900 dark:text-white text-xl font-bold">Overige vaste lasten</h3>
                    </div>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Abonnementen, energie, etc.</span>
                      <span className="text-red-500 font-bold font-mono text-lg">
                        - {formatCurrency(calculation.overigeVasteLasten)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-2">
                      Vaste lasten die niet in de beslagvrije voet zitten (totaal: {formatCurrency(baseData.fixedCosts)}, waarvan {formatCurrency(baseData.fixedCosts - calculation.overigeVasteLasten)} al in huur/zorg)
                    </p>
                  </section>
                  <hr className="border-gray-100 dark:border-[#2a2a2a]" />
                </>
              )}

              {/* Section 4b: Lopende betalingsregelingen */}
              {baseData.currentArrangements > 0 && (
                <>
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                      </div>
                      <h3 className="text-gray-900 dark:text-white text-xl font-bold">Lopende betalingsregelingen</h3>
                    </div>
                    <div className="w-full h-[56px] px-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white font-medium">Maandelijkse aflossingen</span>
                      <span className="text-purple-500 font-bold font-mono text-lg">
                        - {formatCurrency(baseData.currentArrangements)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-2">
                      Dit bedrag wordt afgetrokken van je beschikbare afloscapaciteit
                    </p>
                  </section>
                  <hr className="border-gray-100 dark:border-[#2a2a2a]" />
                </>
              )}

              {/* Section 5: Beslagvrije voet breakdown */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
                    <span className="material-symbols-outlined text-[20px]">calculate</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white text-xl font-bold">Beslagvrije voet berekening</h3>
                </div>
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-6 space-y-3">
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
                  {calculation.isMaxCapped && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="material-symbols-outlined text-amber-500 text-sm">info</span>
                      <span className="text-xs text-amber-700 dark:text-amber-400">
                        Gemaximeerd op wettelijk maximum van {formatCurrency(calculation.maxBeslagvrijeVoet)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs mt-2">
                    <span className="text-gray-400 dark:text-gray-500">Wettelijk maximum ({formData.householdType})</span>
                    <span className="text-gray-400 dark:text-gray-500">{formatCurrency(calculation.maxBeslagvrijeVoet)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#6b7280] mt-3">
                  De beslagvrije voet is het minimumbedrag dat je nodig hebt om van te leven. Dit bedrag is beschermd tegen beslag.
                </p>
              </section>
            </div>

            {/* Calculation Result Section */}
            <div className="bg-[#10b981]/10 border-t-2 border-[#10b981] p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center md:text-left">
                  <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium mb-1">Netto inkomen</p>
                  <p className="text-gray-900 dark:text-white font-bold text-xl">{formatCurrency(calculation.totalIncome)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium mb-1">Beslagvrije voet</p>
                  <p className="text-amber-500 font-bold text-xl">- {formatCurrency(calculation.beslagvrijeVoet)}</p>
                </div>
                {calculation.overigeVasteLasten > 0 && (
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium mb-1">Overige vaste lasten</p>
                    <p className="text-red-500 font-bold text-xl">- {formatCurrency(calculation.overigeVasteLasten)}</p>
                  </div>
                )}
                {baseData.currentArrangements > 0 && (
                  <div className="text-center md:text-right">
                    <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium mb-1">Lopende regelingen</p>
                    <p className="text-purple-500 font-bold text-xl">- {formatCurrency(baseData.currentArrangements)}</p>
                  </div>
                )}
              </div>
              <hr className="border-[#10b981]/30 mb-6" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-gray-900 dark:text-white text-lg font-bold">Jouw Afloscapaciteit</p>
                  <p className="text-gray-500 dark:text-[#a1a1a1] text-sm">
                    Beschikbaar voor extra schuldaflossing per maand
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#10b981] font-extrabold text-4xl tracking-tight">
                    {formatCurrency(calculation.afloscapaciteit)}
                  </p>
                  {calculation.afloscapaciteit > 0 ? (
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-[#10b981] uppercase tracking-wide justify-end">
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
          <div className="text-center px-4 pb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Over deze berekening</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Deze berekening is gebaseerd op de Recofa-normen 2025. De werkelijke beslagvrije voet kan afwijken
                    op basis van je persoonlijke situatie. Raadpleeg een schuldhulpverlener voor een officiële berekening.
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
