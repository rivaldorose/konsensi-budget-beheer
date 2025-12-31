import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { formatCurrency } from "@/components/utils/formatters";
import { startOfMonth, endOfMonth } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

export default function Adempauze() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [beslagvrijeVoet, setBeslagvrijeVoet] = useState(0);
  const [protectionStatus, setProtectionStatus] = useState('volledig');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [generatedBrief, setGeneratedBrief] = useState('');
  const [completedActions, setCompletedActions] = useState([]);
  
  const { toast } = useToast();
  const { language } = useTranslation();

  const calculateBeslagvrijeVoet = (monthlyIncome, vtlbSettings) => {
    let basisBedrag = 1626;

    if (vtlbSettings && vtlbSettings.persoonlijkeSituatie) {
      const { burgerlijkeStaat, aantalKinderen } = vtlbSettings.persoonlijkeSituatie;

      if (burgerlijkeStaat === 'samenwonend' || burgerlijkeStaat === 'getrouwd') {
        basisBedrag = 2280;
      }

      if (aantalKinderen > 0) {
        basisBedrag += aantalKinderen * 125;
      }
    }

    if (monthlyIncome <= basisBedrag) {
      return { beslagvrijeVoet: monthlyIncome, status: 'volledig' };
    }

    const beslagbaar = Math.max(0, (monthlyIncome - basisBedrag) * 0.10);
    
    return { 
      beslagvrijeVoet: monthlyIncome - beslagbaar, 
      status: 'gedeeltelijk' 
    };
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      setUser(currentUser);
      
      setCompletedActions(currentUser.adempauze_actions_completed || []);

      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());

      const userFilter = { user_id: currentUser.id };
      const fallbackFilter = { created_by: currentUser.email };

      const [allIncomes, costs, debts] = await Promise.all([
        Income.filter(userFilter).catch(() => Income.filter(fallbackFilter)),
        MonthlyCost.filter(userFilter).catch(() => MonthlyCost.filter({ ...fallbackFilter, status: 'actief' })),
        Debt.filter(userFilter).catch(() => Debt.filter(fallbackFilter))
      ]);

      const regularIncomes = allIncomes.filter(i => {
        if (i.income_type !== 'vast') return false;
        if (i.start_date) {
          const startDate = new Date(i.start_date);
          const endDate = i.end_date ? new Date(i.end_date) : null;
          const isAfterStart = monthStart >= new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          const isBeforeEnd = !endDate || monthEnd <= new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
          return isAfterStart && isBeforeEnd;
        }
        return i.is_active !== false;
      });

      const monthlyIncome = regularIncomes.reduce((sum, i) => sum + (i.monthly_equivalent || i.amount || 0), 0);
      setTotalIncome(monthlyIncome);

      const activeDebts = debts.filter(d => d.status !== 'afbetaald');
      const debtSum = activeDebts.reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);
      setTotalDebt(debtSum);

      const { beslagvrijeVoet: calculatedBeslagvrijeVoet, status } = calculateBeslagvrijeVoet(monthlyIncome, currentUser.vtlb_settings);
      setBeslagvrijeVoet(calculatedBeslagvrijeVoet);
      setProtectionStatus(status);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActivate = async () => {
    try {
      await User.updateMe({
        adempauze_active: true,
        adempauze_activated_at: new Date().toISOString(),
        adempauze_trigger: 'manual'
      });
      toast({
        title: "✅ Adempauze geactiveerd!",
        description: "Je hebt nu de rust om je situatie op orde te brengen."
      });
      loadData();
    } catch (error) {
      console.error("Error activating adempauze:", error);
      toast({
        title: "❌ Fout",
        description: "Kon adempauze niet activeren",
        variant: "destructive"
      });
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm("Weet je zeker dat je Adempauze wilt deactiveren?")) {
      try {
        await User.updateMe({
          adempauze_active: false
        });
        toast({ 
          title: "✅ Adempauze gedeactiveerd",
          description: "Je kunt de adempauze altijd opnieuw activeren."
        });
        loadData();
      } catch (error) {
        console.error("Error deactivating adempauze:", error);
        toast({
          title: "❌ Fout",
          description: "Kon adempauze niet deactiveren",
          variant: "destructive"
        });
      }
    }
  };

  const generateBrief = () => {
    const brief = `Geachte heer/mevrouw,

Hierbij informeer ik u dat ik tijdelijk niet in staat ben om betalingen te verrichten aan uw organisatie.

Persoonlijke gegevens:
Naam: ${user?.full_name || user?.voornaam || '[Uw naam]'}
Adres: ${user?.adres || '[Uw adres]'}
Postcode: ${user?.postcode || '[Uw postcode]'}
Stad: ${user?.stad || '[Uw stad]'}

Financiële situatie:
Mijn huidige maandelijkse inkomen bedraagt €${totalIncome.toFixed(2)}.
Ik heb momenteel €${totalDebt.toFixed(2)} aan openstaande schulden bij meerdere crediteuren.

Vanwege mijn financiële situatie heb ik een Adempauze nodig om mijn situatie te stabiliseren. 
Ik neem op korte termijn contact op met professionele schuldhulpverlening om een structurele oplossing te vinden.

Ik verzoek u vriendelijk om:
- Tijdelijk geen betalingen van mij te verwachten
- Geen incassomaatregelen te treffen tijdens deze periode
- Mij de tijd te geven om met hulp van schuldhulpverlening een haalbaar betalingsvoorstel op te stellen

Zodra ik met schuldhulpverlening tot een afspraak ben gekomen, zal ik u hierover informeren.

Met vriendelijke groet,
${user?.full_name || user?.voornaam || '[Uw naam]'}
${new Date().toLocaleDateString('nl-NL')}`;

    setGeneratedBrief(brief);
    setShowBriefModal(true);
  };

  const handleActionComplete = async (actionKey) => {
    try {
      const newCompleted = completedActions.includes(actionKey)
        ? completedActions.filter(a => a !== actionKey)
        : [...completedActions, actionKey];
      
      await User.updateMe({
        adempauze_actions_completed: newCompleted
      });
      
      setCompletedActions(newCompleted);
      toast({ 
        title: completedActions.includes(actionKey) ? "Actie gemarkeerd als niet voltooid" : "✅ Actie voltooid!",
        description: completedActions.includes(actionKey) ? "" : "Goed gedaan! 🎉"
      });
    } catch (error) {
      console.error("Error updating action:", error);
      toast({ 
        title: "❌ Fout bij opslaan", 
        variant: "destructive" 
      });
    }
  };

  const steps = [
    {
      key: 'inform_creditors',
      title: "Informeer je schuldeisers",
      description: "Stuur een brief naar al je schuldeisers om hen op de hoogte te brengen van je situatie en de adempauze aan te vragen.",
      action: () => generateBrief(),
      actionLabel: "Genereer Brief"
    },
    {
      key: 'contact_help',
      title: "Neem contact op met schuldhulpverlening",
      description: "Zoek professionele hulp bij jou in de buurt voor begeleiding bij het oplossen van je schulden.",
      links: [
        { label: "Juridisch Loket", url: "https://www.juridischloket.nl/schulden/" },
        { label: "Vind je gemeente", url: "https://www.vng.nl/gemeenten" },
        { label: "Geldfit", url: "https://www.geldfit.nl/schuldhulpverlening" }
      ]
    },
    {
      key: 'apply_benefits',
      title: "Meld je aan voor uitkering (indien nodig)",
      description: "Heb je momenteel geen inkomen? Controleer of je recht hebt op een uitkering en vraag deze aan.",
      links: [
        { label: "UWV Website", url: "https://www.uwv.nl/" }
      ]
    }
  ];

  const faqs = [
    {
      q: "Wat houdt de adempauze precies in?",
      a: "De adempauze is een periode waarin schuldeisers hun incasso-activiteiten tijdelijk opschorten. Dit geeft jou de tijd om je financiën op orde te brengen zonder extra druk."
    },
    {
      q: "Hoe lang duurt de adempauze?",
      a: "De adempauze duurt standaard 6 maanden, maar kan in overleg met een schuldhulpverlener worden verlengd indien nodig."
    },
    {
      q: "Worden mijn schulden kwijtgescholden?",
      a: "Nee, tijdens de adempauze worden schulden niet kwijtgescholden. Het doel is om rust te creëren zodat je een betalingsregeling of sanering kunt voorbereiden."
    },
    {
      q: "Wat gebeurt er met lopende verplichtingen?",
      a: "Je lopende verplichtingen, zoals huur, energie en verzekeringen, moet je wel gewoon blijven betalen om nieuwe schulden te voorkomen."
    },
    {
      q: "Heeft dit invloed op mijn BKR-registratie?",
      a: "De adempauze zelf wordt niet geregistreerd bij het BKR, maar je achterstanden staan daar mogelijk al wel geregistreerd."
    },
    {
      q: "Kan een deurwaarder toch beslag leggen?",
      a: "Nee, tijdens een officiële adempauze die is ingesteld door de rechter of gemeente mogen deurwaarders geen beslag leggen op je spullen of inkomen."
    },
    {
      q: "Is deze hulp gratis?",
      a: "Schuldhulpverlening via de gemeente is in principe gratis voor inwoners. Er kunnen wel kosten verbonden zijn aan bewindvoering als je daarvoor kiest."
    },
    {
      q: "Wat moet ik doen na de adempauze?",
      a: "Samen met je hulpverlener heb je dan een plan gemaakt. Dit kan een schuldregeling zijn, of een saneringskrediet waarmee je schulden worden afgekocht."
    },
    {
      q: "Kan ik de adempauze zelf aanvragen?",
      a: "Je kunt zelf contact opnemen met de gemeente, maar de officiële toekenning loopt via een beschikking van de gemeente of de rechter."
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
      </div>
    );
  }

  // If adempauze is active, show active state
  if (user?.adempauze_active) {
    return (
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 md:gap-12">
        {/* Status Card */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border-l-4 border-secondary">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">💚</span>
            <div>
              <h2 className="font-montserrat font-bold text-xl text-primary">Adempauze is actief</h2>
              <p className="text-sm text-gray-sub">
                Geactiveerd op {user?.adempauze_activated_at ? new Date(user.adempauze_activated_at).toLocaleDateString('nl-NL') : 'onbekende datum'}
              </p>
            </div>
          </div>
          <p className="text-gray-text mb-4">
            Je hebt nu de rust om je situatie op orde te brengen. Volg de stappen hieronder om te beginnen met je herstel.
          </p>
          <button 
            onClick={handleDeactivate}
            className="px-6 py-2.5 rounded-xl border border-red-500 text-red-600 font-bold hover:bg-red-50 transition-colors text-sm"
          >
            Deactiveer Adempauze
          </button>
        </section>

        {/* Show the same content as inactive state but with active indicator */}
        {/* ... rest of the content ... */}
      </main>
    );
  }

  // Inactive state - show full page
  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 md:gap-12">
      {/* Hero Section */}
      <section className="w-full bg-[#f0fee6] rounded-3xl p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-soft transition-all duration-300">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-success/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">💚</div>
        <h2 className="font-montserrat font-extrabold text-3xl md:text-5xl text-primary mb-4 leading-tight">
              Tijd voor een Adempauze
        </h2>
        <p className="font-lato text-lg text-gray-text max-w-2xl leading-relaxed">
              Even geen stress van schuldeisers. Zo krijg je de rust en ruimte om je financiën op orde te brengen.
        </p>
      </section>

      {/* 1. Waarom een Adempauze? */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">❓</span>
          <h3 className="font-montserrat font-bold text-2xl text-primary">Waarom een adempauze?</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A */}
          <div className="bg-green-50 rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-green-100">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 text-2xl">🛡️</div>
            <h4 className="font-montserrat font-semibold text-lg text-primary mb-2">Rust van aanmaningen</h4>
            <p className="font-lato text-sm text-gray-600 leading-relaxed">
              Geen incasso, geen deurwaarders. Je krijgt tijd om rustig je plan te maken.
            </p>
          </div>
          {/* Card B */}
          <div className="bg-blue-50 rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-blue-100">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 text-2xl">🗓️</div>
            <h4 className="font-montserrat font-semibold text-lg text-primary mb-2">Overzicht creëren</h4>
            <p className="font-lato text-sm text-gray-600 leading-relaxed">
              Focus op je financiën in kaart brengen zonder de druk van schuldeisers in je nek.
            </p>
          </div>
          {/* Card C */}
          <div className="bg-purple-50 rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-purple-100">
            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-4 text-2xl">🎯</div>
            <h4 className="font-montserrat font-semibold text-lg text-primary mb-2">Focus op inkomen</h4>
            <p className="font-lato text-sm text-gray-600 leading-relaxed">
              Gebruik deze tijd om werk te vinden of manieren te zoeken om je inkomen te verhogen.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Jouw Bescherming */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border-l-4 border-secondary overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">🛡️</span>
          <h3 className="font-montserrat font-bold text-2xl text-primary">Jouw Bescherming</h3>
              </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-end">
          {/* Income */}
          <div className="flex flex-col gap-1">
            <span className="font-lato text-xs font-bold text-gray-sub uppercase tracking-wider">Jouw inkomen</span>
            <span className="font-montserrat font-bold text-2xl md:text-3xl text-primary">
              {formatCurrency(totalIncome)}
              <span className="text-lg text-gray-400 font-medium">/maand</span>
            </span>
              </div>
          {/* Debt */}
          <div className="flex flex-col gap-1">
            <span className="font-lato text-xs font-bold text-gray-sub uppercase tracking-wider">Openstaande schulden</span>
            <span className="font-montserrat font-bold text-2xl md:text-3xl text-warning">
              {formatCurrency(totalDebt)}
              <span className="text-lg text-gray-400 font-medium"> totaal</span>
            </span>
              </div>
          {/* Badge */}
          <div className="flex md:justify-end">
            <div className="inline-flex items-center gap-2 bg-success text-white px-6 py-3 rounded-full shadow-md hover:scale-105 transition-transform cursor-default">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span className="font-montserrat font-semibold text-sm">Volledig beschermd</span>
                </div>
                </div>
                </div>
        {/* Info Box */}
        <div className="bg-[#ecfdf5] rounded-xl p-5 border border-success/10 flex flex-col md:flex-row gap-4 items-start">
          <div className="text-success mt-1">
            <span className="material-symbols-outlined">info</span>
              </div>
          <div className="flex-1">
            <p className="text-sm md:text-[15px] text-[#059669] font-medium leading-relaxed mb-2">
              Je bent volledig beschermd. Je houdt jouw volledige inkomen van {formatCurrency(totalIncome)} per maand. Er kan niets worden ingehouden.
            </p>
            <p className="text-xs text-gray-500 italic">
                  * Deze berekening is een indicatie. Aan deze berekening kunnen geen rechten worden ontleend. Voor een exacte berekening neem contact op met een schuldhulpverlener.
                </p>
              </div>
        </div>
      </section>

      {/* 3. Wat moet je doen? */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-2xl">📋</span>
          <h3 className="font-montserrat font-bold text-2xl text-primary">Wat moet je doen?</h3>
        </div>
        <div className="flex flex-col gap-4">
              {steps.map((step, index) => {
                const isCompleted = completedActions.includes(step.key);
                return (
              <div 
                key={step.key}
                className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-card transition-shadow"
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-secondary' : 
                    index === 1 ? 'bg-secondary/50' : 
                    'bg-secondary/30'
                  }`}>
                    <span className="font-montserrat font-bold text-xl text-primary">{index + 1}</span>
                  </div>
                </div>
                        <div className="flex-1">
                  <h4 className="font-montserrat font-semibold text-lg text-primary mb-2">{step.title}</h4>
                  <p className="font-lato text-[15px] text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap items-center gap-4">
                            {step.action && (
                      <button 
                                  onClick={step.action}
                        className="bg-success hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm"
                                >
                        <span className="material-symbols-outlined text-[18px]">description</span>
                                  {step.actionLabel}
                      </button>
                            )}
                    {step.links && step.links.map((link, linkIndex) => (
                                  <a
                                    key={linkIndex}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-4 py-2 rounded-lg transition-colors text-sm border border-blue-100"
                                  >
                        {link.label} ›
                                  </a>
                                ))}
                    {step.key === 'apply_benefits' && (
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleActionComplete(step.key);
                        }}
                        className="text-sm text-gray-500 hover:text-primary underline decoration-gray-300 underline-offset-4"
                      >
                        Sla deze stap over
                      </a>
                    )}
                    {step.key === 'inform_creditors' && (
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleActionComplete(step.key);
                        }}
                        className="text-sm text-gray-500 hover:text-primary underline decoration-gray-300 underline-offset-4"
                      >
                        Markeer als gedaan
                      </a>
                    )}
                          </div>
                        </div>
                      </div>
                );
              })}
            </div>
      </section>

      {/* 4. Veelgestelde Vragen */}
      <section className="max-w-4xl mx-auto w-full mb-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <h3 className="font-montserrat font-bold text-2xl text-primary text-center">❓ Veelgestelde vragen</h3>
          </div>
        <div className="flex flex-col gap-3">
              {faqs.map((faq, index) => (
            <details 
              key={index}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              open={expandedFaq === index}
            >
              <summary 
                className="flex items-center justify-between p-5 cursor-pointer list-none"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <span className="font-montserrat font-semibold text-primary">{faq.q}</span>
                <span className={`material-symbols-outlined text-gray-400 transition-transform duration-200 ${
                  expandedFaq === index ? 'rotate-180' : ''
                }`}>expand_more</span>
              </summary>
              <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                <p className="font-lato text-[15px] text-gray-600 mt-4 leading-relaxed">{faq.a}</p>
                    </div>
            </details>
              ))}
            </div>
      </section>

      {/* CTA Section */}
      <section className="flex flex-col items-center justify-center pb-16">
        <button 
              onClick={handleActivate}
          className="group relative bg-success hover:bg-emerald-600 text-white font-montserrat font-bold text-xl px-12 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center gap-3"
            >
          <span className="text-2xl group-hover:animate-pulse">💚</span>
              Activeer Adempauze
        </button>
        <p className="mt-4 text-gray-sub text-xs text-center font-lato">
          Door te activeren ga je akkoord met de voorwaarden van Adempauze
        </p>
      </section>

        {/* Brief Modal */}
      <Dialog open={showBriefModal} onOpenChange={setShowBriefModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Brief voor schuldeisers</DialogTitle>
          </DialogHeader>
                  <textarea
                    value={generatedBrief}
                    onChange={(e) => setGeneratedBrief(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none"
                  />
          <DialogFooter>
                    <Button
              variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBrief);
                toast({ 
                  title: "✅ Brief gekopieerd!", 
                  description: "De brief is gekopieerd naar je klembord."
                });
                      }}
                    >
                      Kopieer Brief
                    </Button>
            <Button onClick={() => setShowBriefModal(false)}>
                      Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
