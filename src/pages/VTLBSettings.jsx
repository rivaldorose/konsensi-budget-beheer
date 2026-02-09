import React, { useState, useEffect } from 'react';
import { User, MonthlyCost, Debt, Income } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLocation, Link } from "react-router-dom";
import { incomeService, debtService } from "@/components/services";
import {
  berekenVTLB,
  vtlbSettingsToProfiel,
  VTLB_NORMEN,
  formatLeefsituatie,
  formatWerksituatie,
} from "@/services/vtlbService";

export default function VTLBSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Huishouden
    leefsituatie: 'alleenstaand',
    aantalKinderen: 0,

    // Woonsituatie
    typeWoning: 'huur_sociaal',
    woonlasten: 0,

    // Werk & Reizen
    werksituatie: 'geen',
    afstandWerk: 0,
    werkdagen: 5,

    // Zorg & Gezondheid
    chronischeZiekte: false,
    medicijnkosten: 0,

    // Verplichtingen
    alimentatie: 0,
    studiekosten: 0,
    kinderopvangKosten: 0,
    gemeentebelasting: 0,
    vakbond: 0,
  });

  const [baseData, setBaseData] = useState({
    nettoInkomen: 0,
    bestaandeRegelingen: 0,
    vasteLasten: 0,  // Totaal maandelijkse vaste lasten
  });

  const [vtlbResult, setVtlbResult] = useState(null);
  const [expandedSection, setExpandedSection] = useState('huishouden');

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
    // Herbereken VTLB bij elke wijziging
    // Let op: vasteLasten worden nu ook meegegeven aan de berekening!
    const profiel = vtlbSettingsToProfiel(
      formData,
      baseData.nettoInkomen,
      baseData.bestaandeRegelingen,
      baseData.vasteLasten  // Vaste maandlasten meenemen!
    );
    const result = berekenVTLB(profiel);
    setVtlbResult(result);
  }, [formData, baseData]);

  const loadData = async () => {
    try {
      const userData = await User.me();
      const [incomes, costs, debts] = await Promise.all([
        Income.filter({ user_id: userData.id }),
        MonthlyCost.filter({ user_id: userData.id }),
        Debt.filter({ user_id: userData.id }),
      ]);

      // Bereken inkomen
      const incomeData = incomeService.processIncomeData(incomes, new Date());
      const nettoInkomen = incomeData.total || parseFloat(userData.monthly_income) || 0;

      // Bereken bestaande regelingen
      const arrangementsResult = debtService.getActiveArrangementPayments(debts);
      const bestaandeRegelingen = arrangementsResult.total;

      // ============================================
      // VTLB-SPECIFIEKE KOSTEN UIT VASTE LASTEN HALEN
      // ============================================
      const activeCosts = costs.filter(c => c.status === 'actief');

      // Helper functie om kosten te vinden op categorie of naam
      const findCostByCategory = (category, ...namePatterns) => {
        return activeCosts.find(c =>
          c.category === category ||
          namePatterns.some(pattern => c.name?.toLowerCase().includes(pattern.toLowerCase()))
        );
      };

      const sumCostsByCategory = (category, ...namePatterns) => {
        return activeCosts
          .filter(c =>
            c.category === category ||
            namePatterns.some(pattern => c.name?.toLowerCase().includes(pattern.toLowerCase()))
          )
          .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
      };

      // Haal VTLB-specifieke kosten uit vaste lasten
      const huurCost = findCostByCategory('huur', 'huur');
      const hypotheekCost = findCostByCategory('hypotheek', 'hypotheek');
      const woonkostenUitLasten = (huurCost ? parseFloat(huurCost.amount) : 0) +
                                   (hypotheekCost ? parseFloat(hypotheekCost.amount) : 0);

      const kinderopvangUitLasten = sumCostsByCategory('kinderopvang', 'kinderopvang', 'creche', 'bso', 'gastouder');
      const alimentatieUitLasten = sumCostsByCategory('alimentatie', 'alimentatie', 'partneralimentatie', 'kinderalimentatie');
      const vakbondUitLasten = sumCostsByCategory('vakbond', 'vakbond', 'fnv', 'cnv', 'contributie');
      const studiekostenUitLasten = sumCostsByCategory('studiekosten', 'studie', 'opleiding', 'cursus', 'collegegeld');
      const gemeentebelastingUitLasten = sumCostsByCategory('gemeentebelasting', 'gemeentebelasting', 'ozb', 'rioolheffing', 'afvalstoffenheffing') * 12; // Naar jaar
      const zorgkostenUitLasten = sumCostsByCategory('zorgkosten', 'medicijn', 'apotheek', 'eigen bijdrage');

      // Bereken totale vaste lasten EXCLUSIEF wat al in VTLB zit
      // Dit zijn de "overige" vaste lasten die niet specifiek in VTLB worden meegenomen
      const vtlbSpecifiekeCategorieen = ['huur', 'hypotheek', 'kinderopvang', 'alimentatie', 'vakbond', 'studiekosten', 'gemeentebelasting', 'zorgkosten'];
      const vasteLasten = activeCosts
        .filter(c =>
          // Exclude VTLB-specifieke categorieën (die worden apart meegenomen)
          !vtlbSpecifiekeCategorieen.includes(c.category) &&
          // Exclude op naam-basis
          !c.name?.toLowerCase().includes('huur') &&
          !c.name?.toLowerCase().includes('hypotheek') &&
          !c.name?.toLowerCase().includes('kinderopvang') &&
          !c.name?.toLowerCase().includes('alimentatie') &&
          !c.name?.toLowerCase().includes('vakbond') &&
          !c.name?.toLowerCase().includes('studie') &&
          !c.name?.toLowerCase().includes('gemeentebelasting')
        )
        .reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

      // Laad opgeslagen VTLB settings
      const savedSettings = userData.vtlb_settings || {};

      setBaseData({
        nettoInkomen,
        bestaandeRegelingen,
        vasteLasten,  // Vaste maandlasten (energie, verzekeringen, abonnementen, etc.) EXCLUSIEF VTLB-specifieke
      });

      // Vul formData in met saved settings OF automatisch uit vaste lasten
      setFormData(prev => ({
        ...prev,
        ...savedSettings,
        // Woonlasten: saved OF uit vaste lasten
        woonlasten: savedSettings.woonlasten || woonkostenUitLasten || 0,
        // Kinderopvang: saved OF uit vaste lasten
        kinderopvangKosten: savedSettings.kinderopvangKosten || kinderopvangUitLasten || 0,
        // Alimentatie: saved OF uit vaste lasten
        alimentatie: savedSettings.alimentatie || alimentatieUitLasten || 0,
        // Vakbond: saved OF uit vaste lasten
        vakbond: savedSettings.vakbond || vakbondUitLasten || 0,
        // Studiekosten: saved OF uit vaste lasten
        studiekosten: savedSettings.studiekosten || studiekostenUitLasten || 0,
        // Gemeentebelasting (per jaar): saved OF uit vaste lasten
        gemeentebelasting: savedSettings.gemeentebelasting || gemeentebelastingUitLasten || 0,
        // Medicijnkosten: saved OF uit vaste lasten
        medicijnkosten: savedSettings.medicijnkosten || zorgkostenUitLasten || 0,
      }));

    } catch (error) {
      console.error("Error loading VTLB data:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij laden gegevens',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userData = await User.me();
      await User.update(userData.id, {
        vtlb_settings: formData,
      });

      toast({
        title: 'VTLB instellingen opgeslagen',
        description: `Afloscapaciteit: €${vtlbResult?.afloscapaciteit?.toFixed(2) || 0}/maand`,
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij opslaan',
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
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
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
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col">
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">calculate</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">VTLB Berekening</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Bereken je Vrij Te Laten Bedrag volgens officiële WSNP-normen</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:sticky lg:top-8">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                  to={createPageUrl('Settings')}
                >
                  <span className="material-symbols-outlined">account_circle</span>
                  <span className="text-sm font-medium">Mijn Profiel</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className="material-symbols-outlined">calculate</span>
                  <span className="text-sm font-bold">VTLB Berekening</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all"
                  to={createPageUrl('DisplaySettings')}
                >
                  <span className="material-symbols-outlined">tune</span>
                  <span className="text-sm font-medium">App Voorkeuren</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 w-full space-y-6">
              {/* VTLB Result Card */}
              {vtlbResult && (
                <div className={`rounded-[24px] p-6 border-2 ${
                  vtlbResult.statusColor === 'green'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : vtlbResult.statusColor === 'orange'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Netto inkomen</p>
                      <p className="text-gray-900 dark:text-white font-bold text-lg">{formatCurrency(vtlbResult.nettoInkomen)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">VTLB (Beslagvrije voet)</p>
                      <p className="text-amber-600 dark:text-amber-400 font-bold text-lg">- {formatCurrency(vtlbResult.vtlbTotaal)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Vaste lasten</p>
                      <p className="text-orange-600 dark:text-orange-400 font-bold text-lg">- {formatCurrency(vtlbResult.vasteLasten || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Lopende regelingen</p>
                      <p className="text-purple-600 dark:text-purple-400 font-bold text-lg">- {formatCurrency(vtlbResult.bestaandeRegelingen)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Afloscapaciteit</p>
                      <p className={`font-extrabold text-2xl ${
                        vtlbResult.statusColor === 'green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : vtlbResult.statusColor === 'orange'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(vtlbResult.afloscapaciteit)}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-center gap-2 text-sm font-bold ${
                    vtlbResult.statusColor === 'green'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : vtlbResult.statusColor === 'orange'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    <span className="material-symbols-outlined text-base">
                      {vtlbResult.statusColor === 'green' ? 'check_circle' : vtlbResult.statusColor === 'orange' ? 'warning' : 'error'}
                    </span>
                    {vtlbResult.statusLabel}
                  </div>

                  {vtlbResult.is95ProcentRegel && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ⚠️ 95% regel toegepast: VTLB is gemaximeerd op 95% van je inkomen
                    </p>
                  )}
                </div>
              )}

              {/* Settings Form */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] overflow-hidden">

                {/* Section: Inkomen (read-only) */}
                <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white text-lg font-bold">Netto Inkomen</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Automatisch uit je inkomensgegevens</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">Maandelijks inkomen</span>
                    <span className="text-primary font-bold text-lg">{formatCurrency(baseData.nettoInkomen)}</span>
                  </div>
                  <button
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1 mt-2"
                    onClick={() => window.location.href = createPageUrl('Income')}
                  >
                    Inkomen aanpassen <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>

                {/* Section: Huishouden */}
                <div className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <button
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => toggleSection('huishouden')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Huishouden</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {formatLeefsituatie(formData.leefsituatie)}
                          {formData.aantalKinderen > 0 && `, ${formData.aantalKinderen} kind${formData.aantalKinderen > 1 ? 'eren' : ''}`}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedSection === 'huishouden' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {expandedSection === 'huishouden' && (
                    <div className="px-6 pb-6 space-y-4">
                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Leefsituatie</label>
                        <select
                          className="form-select w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-medium"
                          value={formData.leefsituatie}
                          onChange={(e) => setFormData({ ...formData, leefsituatie: e.target.value })}
                        >
                          <option value="alleenstaand">Alleenstaand</option>
                          <option value="alleenstaande_ouder">Alleenstaande ouder</option>
                          <option value="samenwonend_beiden">Samenwonend (beiden werken)</option>
                          <option value="samenwonend_een">Samenwonend (1 inkomen)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Basis VTLB: {formatCurrency(VTLB_NORMEN.basis[formData.leefsituatie])}
                        </p>
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Aantal thuiswonende kinderen</label>
                        <div className="flex items-center h-12 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
                          <button
                            className="px-4 h-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                            onClick={() => setFormData({ ...formData, aantalKinderen: Math.max(0, formData.aantalKinderen - 1) })}
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <input
                            className="w-full h-full border-none bg-transparent text-center font-bold text-gray-900 dark:text-white"
                            type="number"
                            min="0"
                            max="10"
                            value={formData.aantalKinderen}
                            onChange={(e) => setFormData({ ...formData, aantalKinderen: parseInt(e.target.value) || 0 })}
                          />
                          <button
                            className="px-4 h-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                            onClick={() => setFormData({ ...formData, aantalKinderen: Math.min(10, formData.aantalKinderen + 1) })}
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Kindertoeslag: +€315 (1e), +€280 (2e), +€245 (3e), +€210 (4e+)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Woonsituatie */}
                <div className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <button
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => toggleSection('wonen')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                        <span className="material-symbols-outlined text-[20px]">home</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Woonsituatie</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Woonlasten: {formatCurrency(formData.woonlasten)}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedSection === 'wonen' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {expandedSection === 'wonen' && (
                    <div className="px-6 pb-6 space-y-4">
                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Maandelijkse woonlasten (huur/hypotheek)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.woonlasten || ''}
                            onChange={(e) => setFormData({ ...formData, woonlasten: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Woonkosten boven €{VTLB_NORMEN.woonkosten.huurtoeslag_grens.toFixed(2)} worden voor 90% meegenomen
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Werk & Reizen */}
                <div className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <button
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => toggleSection('werk')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-full text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-[20px]">work</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Werk & Reizen</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {formatWerksituatie(formData.werksituatie)}
                          {formData.afstandWerk > 0 && `, ${formData.afstandWerk}km woon-werk`}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedSection === 'werk' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {expandedSection === 'werk' && (
                    <div className="px-6 pb-6 space-y-4">
                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Werksituatie</label>
                        <select
                          className="form-select w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-medium"
                          value={formData.werksituatie}
                          onChange={(e) => setFormData({ ...formData, werksituatie: e.target.value })}
                        >
                          <option value="geen">Geen werk</option>
                          <option value="vast">Vast contract</option>
                          <option value="tijdelijk">Tijdelijk contract</option>
                          <option value="zzp">ZZP / Zelfstandig</option>
                          <option value="uitkering">Uitkering</option>
                          <option value="student">Student</option>
                        </select>
                        {['vast', 'tijdelijk', 'zzp'].includes(formData.werksituatie) && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ Arbeidstoeslag: +€{VTLB_NORMEN.correcties.arbeidstoeslag}/maand
                          </p>
                        )}
                      </div>

                      {['vast', 'tijdelijk', 'zzp'].includes(formData.werksituatie) && (
                        <>
                          <div>
                            <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Afstand woon-werk (enkele reis in km)</label>
                            <input
                              className="form-input w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                              type="number"
                              step="0.5"
                              value={formData.afstandWerk || ''}
                              onChange={(e) => setFormData({ ...formData, afstandWerk: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                            />
                            {formData.afstandWerk > VTLB_NORMEN.reiskosten.minimum_afstand && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ Reiskosten worden meegenomen (afstand > 10km)
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Werkdagen per week</label>
                            <input
                              className="form-input w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                              type="number"
                              min="1"
                              max="7"
                              value={formData.werkdagen}
                              onChange={(e) => setFormData({ ...formData, werkdagen: parseInt(e.target.value) || 5 })}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Section: Zorg & Gezondheid */}
                <div className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <button
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => toggleSection('zorg')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500/10 rounded-full text-pink-500">
                        <span className="material-symbols-outlined text-[20px]">favorite</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Zorg & Gezondheid</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {formData.chronischeZiekte ? `Chronische aandoening, €${formData.medicijnkosten}/maand` : 'Geen bijzonderheden'}
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedSection === 'zorg' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {expandedSection === 'zorg' && (
                    <div className="px-6 pb-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="chronischeZiekte"
                          checked={formData.chronischeZiekte}
                          onChange={(e) => setFormData({ ...formData, chronischeZiekte: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="chronischeZiekte" className="text-gray-700 dark:text-gray-300 font-medium">
                          Chronische ziekte of aandoening
                        </label>
                      </div>

                      {formData.chronischeZiekte && (
                        <div>
                          <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Structurele medicijnkosten per maand</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                            <input
                              className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                              type="number"
                              step="0.01"
                              value={formData.medicijnkosten || ''}
                              onChange={(e) => setFormData({ ...formData, medicijnkosten: parseFloat(e.target.value) || 0 })}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Eigen risico zorgverzekering (+€{VTLB_NORMEN.correcties.eigen_risico}/maand) wordt automatisch meegenomen
                      </p>
                    </div>
                  )}
                </div>

                {/* Section: Verplichtingen */}
                <div className="border-b border-gray-100 dark:border-[#2a2a2a]">
                  <button
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                    onClick={() => toggleSection('verplichtingen')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-gray-900 dark:text-white text-lg font-bold">Overige Verplichtingen</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Alimentatie, studiekosten, kinderopvang, etc.
                        </p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedSection === 'verplichtingen' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {expandedSection === 'verplichtingen' && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Alimentatie (betalen/maand)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.alimentatie || ''}
                            onChange={(e) => setFormData({ ...formData, alimentatie: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Studiekosten per maand</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.studiekosten || ''}
                            onChange={(e) => setFormData({ ...formData, studiekosten: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Kinderopvang per maand</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.kinderopvangKosten || ''}
                            onChange={(e) => setFormData({ ...formData, kinderopvangKosten: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">70% wordt meegenomen in VTLB</p>
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Gemeentebelasting per jaar</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.gemeentebelasting || ''}
                            onChange={(e) => setFormData({ ...formData, gemeentebelasting: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Wordt per maand berekend</p>
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-gray-300 text-sm font-semibold block mb-2">Vakbondscontributie per maand</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
                          <input
                            className="form-input w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-semibold"
                            type="number"
                            step="0.01"
                            value={formData.vakbond || ''}
                            onChange={(e) => setFormData({ ...formData, vakbond: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* VTLB Breakdown */}
                {vtlbResult && (
                  <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <h3 className="text-gray-900 dark:text-white text-lg font-bold mb-4">VTLB Opbouw</h3>
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Basisbedrag ({formatLeefsituatie(vtlbResult.leefsituatie)})</span>
                        <span className="font-medium">{formatCurrency(vtlbResult.breakdown.basisBedrag)}</span>
                      </div>
                      {vtlbResult.breakdown.kinderToeslag > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">+ Kindertoeslag ({vtlbResult.aantalKinderen} kind{vtlbResult.aantalKinderen > 1 ? 'eren' : ''})</span>
                          <span className="font-medium text-green-600">{formatCurrency(vtlbResult.breakdown.kinderToeslag)}</span>
                        </div>
                      )}
                      {vtlbResult.breakdown.woonkostenCorrectie > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">+ Woonkosten correctie</span>
                          <span className="font-medium text-green-600">{formatCurrency(vtlbResult.breakdown.woonkostenCorrectie)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">+ Eigen risico zorgverzekering</span>
                        <span className="font-medium">{formatCurrency(vtlbResult.breakdown.eigenRisico)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">+ Reservering</span>
                        <span className="font-medium">{formatCurrency(vtlbResult.breakdown.reservering)}</span>
                      </div>
                      {vtlbResult.breakdown.arbeidsToeslag > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">+ Arbeidstoeslag</span>
                          <span className="font-medium text-green-600">{formatCurrency(vtlbResult.breakdown.arbeidsToeslag)}</span>
                        </div>
                      )}
                      {vtlbResult.breakdown.individueleLasten > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">+ Individuele lasten</span>
                          <span className="font-medium text-green-600">{formatCurrency(vtlbResult.breakdown.individueleLasten)}</span>
                        </div>
                      )}
                      <hr className="border-gray-200 dark:border-[#2a2a2a] my-2" />
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-white">Totaal VTLB</span>
                        <span className="text-amber-600">{formatCurrency(vtlbResult.vtlbTotaal)}</span>
                      </div>

                      {/* Vaste lasten sectie */}
                      {(vtlbResult.vasteLasten || 0) > 0 && (
                        <>
                          <hr className="border-gray-200 dark:border-[#2a2a2a] my-2" />
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Vaste maandlasten</span>
                            <span className="font-medium text-orange-600">- {formatCurrency(vtlbResult.vasteLasten)}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Energie, verzekeringen, abonnementen, etc. (excl. huur)
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="p-6">
                  <button
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base h-12 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                        Instellingen opslaan
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[24px] p-5 border border-blue-200 dark:border-blue-500/20">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-blue-500 text-[20px] flex-shrink-0 mt-0.5">info</span>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1">Disclaimer</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                      Deze berekening is een indicatie op basis van de VTLB-normen. Voor officiële berekeningen, neem contact op met een schuldhulpverlener of je gemeente. De werkelijke beslagvrije voet kan afwijken op basis van je persoonlijke situatie.
                    </p>
                    <a
                      className="text-primary text-xs font-medium hover:underline mt-2 inline-flex items-center gap-1"
                      href="https://www.rechtspraak.nl/Onderwerpen/Schulden/Paginas/Berekening-vtlb.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Officiële VTLB Calculator
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
