import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CheckCircle2, Shield, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { formatCurrency } from "@/components/utils/formatters";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

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

      const [allIncomes, costs, debts] = await Promise.all([
        Income.filter({ created_by: currentUser.email }),
        MonthlyCost.filter({ created_by: currentUser.email, status: 'actief' }),
        Debt.filter({ created_by: currentUser.email })
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
      await User.updateMyUserData({
        adempauze_active: true,
        adempauze_activated_at: new Date().toISOString(),
        adempauze_trigger: 'manual'
      });
      toast({ title: "Adempauze geactiveerd!" });
      loadData();
    } catch (error) {
      console.error("Error activating adempauze:", error);
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm("Weet je zeker dat je Adempauze wilt deactiveren?")) {
      try {
        await User.updateMyUserData({
          adempauze_active: false
        });
        toast({ title: "Adempauze gedeactiveerd" });
        loadData();
      } catch (error) {
        console.error("Error deactivating adempauze:", error);
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
      
      await User.updateMyUserData({
        adempauze_actions_completed: newCompleted
      });
      
      setCompletedActions(newCompleted);
      toast({ 
        title: completedActions.includes(actionKey) ? "Actie gemarkeerd als niet voltooid" : "Actie voltooid! 🎉",
        variant: "success"
      });
    } catch (error) {
      console.error("Error updating action:", error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    }
  };

  const steps = [
    {
      key: 'inform_creditors',
      title: "Informeer je schuldeisers",
      description: "Stuur een brief naar al je schuldeisers dat je tijdelijk niet kunt betalen vanwege je financiële situatie.",
      icon: "📧",
      action: () => generateBrief(),
      actionLabel: "Genereer Brief"
    },
    {
      key: 'contact_help',
      title: "Neem contact op met schuldhulpverlening",
      description: "Krijg professionele begeleiding bij je financiële situatie.",
      icon: "📞",
      links: [
        { label: "Juridisch Loket", url: "https://www.juridischloket.nl/schulden/" },
        { label: "Vind je gemeente", url: "https://www.vng.nl/gemeenten" },
        { label: "Geldfit", url: "https://www.geldfit.nl/schuldhulpverlening" }
      ]
    },
    {
      key: 'apply_benefits',
      title: "Meld je aan voor uitkering (indien nodig)",
      description: "Als je geen inkomen hebt, vraag dan een tijdelijke uitkering aan bij de sociale dienst.",
      icon: "💰",
      links: [
        { label: "UWV", url: "https://www.uwv.nl/" }
      ]
    }
  ];

  const faqs = [
    {
      q: "Wat is Adempauze precies?",
      a: "Adempauze is een periode waarin je tijdelijk stopt met het betalen van schulden (behalve huur en energie) om je financiële situatie te stabiliseren. Het geeft je de ruimte om professionele hulp te zoeken zonder de stress van schuldeisers."
    },
    {
      q: "Hoe lang duurt een Adempauze?",
      a: "Normaal gesproken 1-3 maanden, afhankelijk van je situatie. Het doel is om zo snel mogelijk weer stabiliteit te vinden en een duurzame oplossing te maken met schuldhulpverlening."
    },
    {
      q: "Wat gebeurt er met mijn schulden tijdens Adempauze?",
      a: "Je schulden blijven bestaan en de rente kan doorlopen. Maar je krijgt de tijd om je situatie op orde te brengen voordat je weer gaat aflossen. Het is belangrijk om wel je schuldeisers te informeren."
    },
    {
      q: "Moet ik alle schuldeisers informeren?",
      a: "Ja, het is belangrijk dat je transparant bent en iedereen op de hoogte brengt van je situatie. Gebruik onze briefgenerator om dit makkelijk te doen."
    },
    {
      q: "Welke betalingen moet ik wel blijven doen?",
      a: "Je moet altijd blijven betalen voor essentiële zaken: huur/hypotheek, energie (gas/water/licht), en zorgverzekering. Deze kun je niet uitstellen."
    },
    {
      q: "Kunnen schuldeisers nog steeds aanmaningen sturen?",
      a: "Ja, dat kunnen ze. Maar als je ze hebt geïnformeerd over je Adempauze en je werkt aan een oplossing met schuldhulpverlening, zullen veel schuldeisers begrip tonen."
    },
    {
      q: "Wat als ik helemaal geen inkomen heb?",
      a: "Als je geen inkomen hebt, kun je een uitkering aanvragen bij het UWV of je gemeente. Check de link bij stap 3 hierboven. Je hebt recht op een basisinkomen."
    },
    {
      q: "Kan ik mijn inkomen beschermen tegen beslag?",
      a: "Ja! Er is een beslagvrije voet. Dit betekent dat er altijd een minimumbedrag overblijft voor je levensonderhoud. Dit bedrag kan niet worden ingehouden. Zie 'Jouw Bescherming' hierboven."
    },
    {
      q: "Hoe kom ik weer uit Adempauze?",
      a: "Zodra je met schuldhulpverlening een realistisch plan hebt gemaakt en je inkomen weer stabiel is, kun je Adempauze deactiveren en beginnen met aflossen volgens je plan."
    }
  ];

  const selfCareOptions = [
    {
      icon: "🚶",
      title: "Ga even wandelen",
      description: "Beweging helpt je hoofd leeg te maken. Een korte wandeling van 10-15 minuten kan al wonderen doen. Loop een rondje door je buurt, of ga naar een park bij jou in de buurt. Laat je telefoon thuis of zet hem op vliegtuigmodus."
    },
    {
      icon: "🧘",
      title: "Mediteer of doe ademhalingsoefeningen",
      description: "Rustige ademhaling helpt direct tegen stress. Probeer de 4-7-8 techniek: adem 4 seconden in via je neus, houd 7 seconden vast, adem 8 seconden uit via je mond. Herhaal dit 3 tot 5 keer. Apps zoals Headspace of Calm hebben ook gratis geleide meditaties."
    },
    {
      icon: "🎵",
      title: "Luister naar rustgevende muziek",
      description: "Muziek kan je helpen ontspannen en afstand te nemen van je zorgen. Zet een rustige playlist op - denk aan lo-fi beats, natuurgeluiden, of klassieke piano muziek. Ga zitten of liggen en focus alleen op de muziek voor 10-15 minuten."
    },
    {
      icon: "☕",
      title: "Neem een bewust thee- of koffiemoment",
      description: "Zet een kopje thee of koffie en neem 10 minuten de tijd om alleen maar te zitten. Geen telefoon, geen tv. Focus op de warmte van het kopje, de geur, de smaak. Dit korte ritueel geeft je brein rust."
    },
    {
      icon: "📖",
      title: "Schrijf je gedachten op",
      description: "Soms helpt het om alles wat door je hoofd gaat op te schrijven. Pak een papiertje en pen (of je notities app) en schrijf gewoon wat je voelt. Het hoeft niet netjes of logisch - gewoon alles eruit gooien. Dit kan helpen om perspectief te krijgen."
    },
    {
      icon: "🎨",
      title: "Doe iets creatiefs",
      description: "Creativiteit helpt je brein ontspannen. Teken, kleur, puzzel, of doe iets met je handen. Het maakt niet uit wat - het gaat erom dat je even met iets anders bezig bent. Geen druk om iets moois te maken."
    },
    {
      icon: "📞",
      title: "Praat met iemand",
      description: "Bel of app een vriend, familielid, of iemand die je vertrouwt. Praat over hoe je je voelt, of juist over iets helemaal anders. Verbinding met iemand anders kan enorm helpen.\n\nHeb je niemand om mee te praten? Deze hulplijnen staan altijd voor je klaar:\n• 113 Zelfmoordpreventie: 0800-0113 (24/7, gratis)\n• Sensoor (voor jongeren): 0900-1450 (24/7)\n• Luisterlijn: 088-0767000 (24/7)"
    },
    {
      icon: "🛀",
      title: "Neem tijd voor zelfzorg",
      description: "Doe iets wat goed voelt voor je lichaam. Neem een warme douche, doe een gezichtsmasker, verzorg je huid, of neem een bad als je dat hebt. Fysieke zelfzorg helpt ook mentaal. Focus op het moment, niet op je zorgen."
    },
    {
      icon: "🌬️",
      title: "Doe een korte adem-oefening",
      description: "Box Breathing (4-4-4-4):\n1. Adem 4 seconden in door je neus\n2. Houd 4 seconden je adem vast\n3. Adem 4 seconden uit door je mond\n4. Wacht 4 seconden voor je weer inademt\n\nHerhaal 5 keer. Deze techniek wordt gebruikt door professionals om snel te kalmeren."
    },
    {
      icon: "📺",
      title: "Neem gezonde afleiding",
      description: "Soms heb je gewoon even afleiding nodig, en dat is oké. Kijk een luchtige serie of film, luister naar een podcast, lees een boek, of speel een game. Zet wel een limiet voor jezelf (bijv. 1 uur) zodat je niet te lang wegglucht van wat je moet doen."
    },
    {
      icon: "🌳",
      title: "Ga naar buiten",
      description: "Frisse lucht en zonlicht (of zelfs bewolkt weer) kunnen je humeur verbeteren. Ga je tuin in, op je balkon, of loop even naar buiten. Zelfs 5 minuten kan al helpen. Kijk naar de lucht, de bomen, voel de wind. Het haalt je uit je hoofd."
    }
  ];

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!user?.adempauze_active) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-white" fill="white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tijd voor een Adempauze
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Even geen stress van schuldeisers. Zo krijg je de rust en ruimte om je financiën op orde te brengen.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Waarom section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Waarom een adempauze?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">Rust van aanmaningen en telefoontjes.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">Tijd om je situatie in kaart te brengen.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">Focus op het verhogen van je inkomen.</p>
              </div>
            </CardContent>
          </Card>

          {/* Jouw Bescherming Card */}
          <Card className="mb-8 border-l-4 border-l-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Jouw Bescherming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jouw inkomen</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}/maand</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Openstaande schulden</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebt)} totaal</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jouw status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    protectionStatus === 'volledig' 
                      ? 'bg-green-200 text-green-900' 
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {protectionStatus === 'volledig' ? 'volledig beschermd' : 'gedeeltelijk beschermd'}
                  </span>
                </div>
              </div>
              
              <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 mb-2">
                  <strong>
                    {protectionStatus === 'volledig' 
                      ? 'Je bent volledig beschermd' 
                      : 'Je bent gedeeltelijk beschermd'}
                  </strong>
                </p>
                <p className="text-sm text-green-900">
                  {protectionStatus === 'volledig' 
                    ? `Je houdt jouw volledige inkomen van ${formatCurrency(totalIncome)} per maand. Er kan niets worden ingehouden.`
                    : `Je houdt altijd minimaal ${formatCurrency(beslagvrijeVoet)} per maand over. Van het bedrag daarboven kan maximaal ${formatCurrency(Math.max(0, totalIncome - beslagvrijeVoet))} worden ingehouden.`
                  }
                </p>
                <p className="text-xs text-green-800 mt-3 italic">
                  * Deze berekening is een indicatie. Aan deze berekening kunnen geen rechten worden ontleend. Voor een exacte berekening neem contact op met een schuldhulpverlener.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stappen */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Wat moet je doen?</h2>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isCompleted = completedActions.includes(step.key);
                return (
                  <Card key={index} className={`hover:shadow-md transition-shadow ${isCompleted ? 'border-l-4 border-green-500 bg-green-50' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{step.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {index + 1}. {step.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{step.description}</p>
                          
                          <div className="space-y-4">
                            {step.action && (
                              <div>
                                <Button 
                                  onClick={step.action}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  {step.actionLabel}
                                </Button>
                              </div>
                            )}
                            
                            {step.links && (
                              <div className="flex flex-wrap gap-2">
                                {step.links.map((link, linkIndex) => (
                                  <a
                                    key={linkIndex}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                  >
                                    {link.label}
                                    <ChevronRight className="w-4 h-4" />
                                  </a>
                                ))}
                              </div>
                            )}
                            
                            <div>
                              <Button
                                variant={isCompleted ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleActionComplete(step.key)}
                                className={isCompleted ? 'border-green-500 text-green-700 hover:bg-green-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                              >
                                {isCompleted ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Voltooid
                                  </>
                                ) : (
                                  'Markeer als gedaan'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Veelgestelde vragen</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                      <motion.div
                        animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </motion.div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-4 pb-4 text-gray-600">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          </div>

          {/* Activeer button */}
          <div className="text-center">
            <Button 
              onClick={handleActivate}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg"
            >
              <Heart className="w-5 h-5 mr-2" />
              Activeer Adempauze
            </Button>
          </div>
        </div>

        {/* Brief Modal */}
        {showBriefModal && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowBriefModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
                <CardHeader>
                  <CardTitle>Brief voor schuldeisers</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={generatedBrief}
                    onChange={(e) => setGeneratedBrief(e.target.value)}
                    className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedBrief);
                        toast({ title: "Brief gekopieerd naar klembord!", variant: "success" });
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Kopieer Brief
                    </Button>
                    <Button variant="outline" onClick={() => setShowBriefModal(false)}>
                      Sluiten
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  }

  // Active state - NIEUWE CONTENT HIERONDER
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Card */}
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-green-600" fill="currentColor" />
              <div>
                <h2 className="text-xl font-bold text-green-900">Adempauze is actief</h2>
                <p className="text-sm text-green-700">
                  Geactiveerd op {user?.adempauze_activated_at ? new Date(user.adempauze_activated_at).toLocaleDateString('nl-NL') : 'onbekende datum'}
                </p>
              </div>
            </div>
            <p className="text-green-800 mb-4">
              Je hebt nu de rust om je situatie op orde te brengen. Volg de stappen hierboven om te beginnen met je herstel.
            </p>
            <Button onClick={handleDeactivate} variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
              Deactiveer Adempauze
            </Button>
          </CardContent>
        </Card>

        {/* Welkom bericht voor zelfzorg tips */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">💚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Je hebt een adempauze genomen. Goed gedaan.
            </h2>
            <p className="text-gray-700 text-lg">
              Hier zijn een paar dingen die kunnen helpen om weer rustig te worden:
            </p>
          </CardContent>
        </Card>

        {/* Zelfzorg opties */}
        <div className="space-y-4">
          {selfCareOptions.map((option, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{option.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{option.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Afsluitend bericht */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Je bent niet alleen. 💚
            </h3>
            <p className="text-gray-700 text-lg mb-2">
              Deze momenten gaan voorbij.
            </p>
            <p className="text-gray-700 text-lg">
              Je doet het goed door te pauzeren.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}