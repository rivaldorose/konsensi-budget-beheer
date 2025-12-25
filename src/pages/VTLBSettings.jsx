
import React, { useState, useEffect } from 'react';
import { Download, Upload, ChevronRight, ChevronLeft, HelpCircle, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { User } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";

const VTLBSettingsForm = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true); // Added loading state
  const [saving, setSaving] = useState(false); // New saving state
  const [vtlbSettings, setVtlbSettings] = useState({
    persoonlijkeSituatie: {
      leeftijd: '',
      burgerlijkeStaat: '',
      aantalKinderen: 0,
      kinderenLeeftijden: [],
      aantalPersonenHuishouden: 1,
      coOuderschap: false,
      coOuderschapPercentage: 50
    },
    woonSituatie: {
      gemeente: '',
      typeWoning: '',
      woonoppervlakte: '',
      energielabel: '',
      wozWaarde: '',
      maandelijkseWoonlasten: ''
    },
    werkReizen: {
      afstandWoonWerk: '',
      vervoersmiddel: '',
      werkdagenPerWeek: 5,
      typeDienstverband: ''
    },
    zorg: {
      chronischeAandoening: false,
      maandelijkseMedicijnkosten: '',
      typeZorgverzekering: '',
      eigenRisicoGebruikt: ''
    },
    toeslagen: {
      zorgtoeslag: { actief: false, bedrag: '' },
      huurtoeslag: { actief: false, bedrag: '' },
      kinderopvangtoeslag: { actief: false, bedrag: '' },
      kindgebondenBudget: { actief: false, bedrag: '' },
      gemeentelijkeKwijtschelding: false
    },
    schulden: {
      alimentatieBetalen: { actief: false, bedrag: '' },
      alimentatieOntvangen: { actief: false, bedrag: '' },
      bewindvoering: { actief: false, kosten: '' },
      schuldhulpverleningActief: false
    },
    overigeLasten: {
      studiekosten: '',
      vakbondscontributie: '',
      verplichteBeroepskosten: '',
      mantelzorgtaken: false
    }
  });

  // ✅ AUTO-FILL met bestaande data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const userData = await User.me();
        
        // Check of er al opgeslagen VTLB settings zijn
        if (userData.vtlb_settings) {
          setVtlbSettings(userData.vtlb_settings);
          setLoading(false);
          return;
        }

        // If no saved settings, pre-fill from other user data and costs
        const costs = await MonthlyCost.filter({ created_by: userData.email });

        setVtlbSettings(prevSettings => {
          const newSettings = { ...prevSettings };

          // PERSOONLIJKE SITUATIE
          if (userData.age) {
            newSettings.persoonlijkeSituatie.leeftijd = userData.age.toString();
          }
          // Note: burgerlijkeStaat not directly available in userData as per schema, so left empty for now.
          // aantalKinderen, kinderenLeeftijden, aantalPersonenHuishouden, coOuderschap, coOuderschapPercentage - not directly available

          // WOONSITUATIE
          if (userData.stad) {
            newSettings.woonSituatie.gemeente = userData.stad;
          }
          // woonoppervlakte, energielabel, wozWaarde - not directly available

          // WERK & REIZEN
          if (userData.income_source) {
            // Map income_source naar dienstverband type
            const sourceMap = {
              'vast_salaris': 'vast',
              'freelance': 'zzp',
              'stufi': 'student',
              'uitkering': 'uitkering',
              'werkloos': 'uitkering'
            };
            newSettings.werkReizen.typeDienstverband = sourceMap[userData.income_source] || '';
          }
          // afstandWoonWerk, vervoersmiddel, werkdagenPerWeek - not directly available

          // WOONLASTEN - haal huur/hypotheek uit MonthlyCost
          const woonCost = costs.find(c =>
            c.category === 'wonen' &&
            (c.name.toLowerCase().includes('huur') || c.name.toLowerCase().includes('hypotheek'))
          );
          if (woonCost) {
            newSettings.woonSituatie.maandelijkseWoonlasten = woonCost.amount.toString();
            if (woonCost.name.toLowerCase().includes('hypotheek')) {
              newSettings.woonSituatie.typeWoning = 'koopwoning';
            } else if (woonCost.name.toLowerCase().includes('huur')) {
              // Default to 'huur-sociaal', can be refined if distinction between social/private rent is stored
              newSettings.woonSituatie.typeWoning = 'huur-sociaal';
            }
          }

          // ZORG - not directly available

          // TOESLAGEN, SCHULDEN, OVERIGE LASTEN - not directly available

          return newSettings;
        });
      } catch (error) {
        console.error('Error loading existing data for VTLB settings:', error);
        toast({
          title: "⚠️ Fout bij laden data",
          description: "Niet alle bestaande gegevens konden worden opgehaald.",
          variant: "warning"
        });
      } finally {
        setLoading(false);
      }
    };

    loadExistingData();
  }, []);

  const steps = [
    'Persoonlijke Situatie',
    'Woonsituatie',
    'Werk & Reizen',
    'Zorg',
    'Toeslagen & Regelingen',
    'Schulden & Verplichtingen',
    'Overige Lasten'
  ];

  const nederlandseGemeenten = [
    'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven',
    'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen',
    'Apeldoorn', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort',
    'Haarlemmermeer', 'Enschede', 'Zwolle', 'Zoetermeer', 'Leiden',
    'Maastricht', 'Dordrecht', 'Ede', 'Alphen aan den Rijn', 'Westland',
    'Alkmaar', 'Emmen', 'Venlo', 'Delft', 'Deventer',
    'Leeuwarden', 'Sittard-Geleen', 'Helmond', 'Hilversum', 'Hengelo',
    'Purmerend', 'Oss', 'Roosendaal', 'Schiedam', 'Spijkenisse',
    'Lelystad', 'Vlaardingen', 'Almelo', 'Hoorn', 'Velsen',
    'Bergen op Zoom', 'Amstelveen', 'Katwijk', 'Zeist', 'Nieuwegein'
  ];

  const Tooltip = ({ text }) => (
    <div className="group relative inline-block ml-2">
      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
      <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-xs bg-gray-900 text-white rounded-lg shadow-xl -left-24 top-6">
        {text}
        <div className="absolute -top-1 left-24 w-2 h-2 bg-gray-900 transform rotate-45"></div>
      </div>
    </div>
  );

  const updateSettings = (category, field, value) => {
    setVtlbSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateNestedSettings = (category, field, subfield, value) => {
    setVtlbSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: {
          ...prev[category][field],
          [subfield]: value
        }
      }
    }));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(vtlbSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vtlb-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "✅ Settings geëxporteerd",
      description: "Je VTLB settings zijn opgeslagen als JSON bestand",
      variant: "success"
    });
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setVtlbSettings(imported);
          toast({
            title: "✅ Settings geïmporteerd",
            description: "Je VTLB settings zijn succesvol geladen",
            variant: "success"
          });
        } catch (error) {
          toast({
            title: "❌ Import mislukt",
            description: "Het bestand is geen geldig JSON formaat",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // ✅ NIEUWE FUNCTIE: Opslaan naar User entity
  const saveSettings = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({ vtlb_settings: vtlbSettings });
      toast({
        title: "✅ Settings opgeslagen",
        description: "Je VTLB instellingen zijn opgeslagen en worden gebruikt in berekeningen",
        variant: "success"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "❌ Fout bij opslaan",
        description: "Er ging iets mis bij het opslaan van je instellingen",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Leeftijd *
                <Tooltip text="Uw huidige leeftijd bepaalt bepaalde normbedragen volgens NVVK-richtlijnen" />
              </Label>
              <Input
                type="number"
                min="18"
                max="120"
                placeholder="bijv. 35"
                value={vtlbSettings.persoonlijkeSituatie.leeftijd}
                onChange={(e) => updateSettings('persoonlijkeSituatie', 'leeftijd', e.target.value)}
              />
              {vtlbSettings.persoonlijkeSituatie.leeftijd && (
                <p className="text-xs text-green-600 mt-1">✓ Automatisch ingevuld</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Burgerlijke Staat *</Label>
              <Select
                value={vtlbSettings.persoonlijkeSituatie.burgerlijkeStaat}
                onValueChange={(value) => updateSettings('persoonlijkeSituatie', 'burgerlijkeStaat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer uw burgerlijke staat..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alleenstaand">Alleenstaand</SelectItem>
                  <SelectItem value="getrouwd">Getrouwd</SelectItem>
                  <SelectItem value="samenwonend">Samenwonend</SelectItem>
                  <SelectItem value="gescheiden">Gescheiden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Aantal Kinderen
                <Tooltip text="Aantal kinderen waarvoor u zorgt of onderhoudsplicht heeft" />
              </Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={vtlbSettings.persoonlijkeSituatie.aantalKinderen}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  updateSettings('persoonlijkeSituatie', 'aantalKinderen', count);
                  updateSettings('persoonlijkeSituatie', 'kinderenLeeftijden', Array(count).fill(''));
                }}
              />
            </div>

            {vtlbSettings.persoonlijkeSituatie.aantalKinderen > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <p className="text-sm font-medium text-blue-900">Leeftijden van uw kinderen:</p>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: vtlbSettings.persoonlijkeSituatie.aantalKinderen }).map((_, index) => (
                    <div key={index}>
                      <Label className="text-sm mb-1">Kind {index + 1}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="Leeftijd"
                        value={vtlbSettings.persoonlijkeSituatie.kinderenLeeftijden[index] || ''}
                        onChange={(e) => {
                          const newAges = [...vtlbSettings.persoonlijkeSituatie.kinderenLeeftijden];
                          newAges[index] = e.target.value;
                          updateSettings('persoonlijkeSituatie', 'kinderenLeeftijden', newAges);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2">Aantal Personen in Huishouden *</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={vtlbSettings.persoonlijkeSituatie.aantalPersonenHuishouden}
                onChange={(e) => updateSettings('persoonlijkeSituatie', 'aantalPersonenHuishouden', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="co-ouderschap"
                checked={vtlbSettings.persoonlijkeSituatie.coOuderschap}
                onCheckedChange={(checked) => updateSettings('persoonlijkeSituatie', 'coOuderschap', checked)}
              />
              <Label htmlFor="co-ouderschap" className="text-sm font-medium cursor-pointer flex items-center">
                Co-ouderschap
                <Tooltip text="Geeft aan of u kinderen deelt met een ex-partner volgens een co-ouderschapsregeling" />
              </Label>
            </div>

            {vtlbSettings.persoonlijkeSituatie.coOuderschap && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <Label className="text-sm font-medium mb-3 block">
                  Co-ouderschap Percentage: {vtlbSettings.persoonlijkeSituatie.coOuderschapPercentage}%
                </Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  value={vtlbSettings.persoonlijkeSituatie.coOuderschapPercentage}
                  onChange={(e) => updateSettings('persoonlijkeSituatie', 'coOuderschapPercentage', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Gemeente *
                <Tooltip text="De gemeente waar u woont bepaalt lokale normbedragen en gemeentelijke regelingen" />
              </Label>
              <Select
                value={vtlbSettings.woonSituatie.gemeente}
                onValueChange={(value) => updateSettings('woonSituatie', 'gemeente', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer uw gemeente..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {nederlandseGemeenten.map(gem => (
                    <SelectItem key={gem} value={gem}>{gem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vtlbSettings.woonSituatie.gemeente && (
                <p className="text-xs text-green-600 mt-1">✓ Automatisch ingevuld</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Type Woning *</Label>
              <Select
                value={vtlbSettings.woonSituatie.typeWoning}
                onValueChange={(value) => updateSettings('woonSituatie', 'typeWoning', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type woning..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="huur-sociaal">🏘️ Huur - Sociaal</SelectItem>
                  <SelectItem value="huur-particulier">🏠 Huur - Particulier</SelectItem>
                  <SelectItem value="koopwoning">🏡 Koopwoning</SelectItem>
                </SelectContent>
              </Select>
              {vtlbSettings.woonSituatie.typeWoning && (
                <p className="text-xs text-green-600 mt-1">✓ Automatisch ingevuld</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Woonoppervlakte (m²)</Label>
              <Input
                type="number"
                min="0"
                placeholder="bijv. 75"
                value={vtlbSettings.woonSituatie.woonoppervlakte}
                onChange={(e) => updateSettings('woonSituatie', 'woonoppervlakte', e.target.value)}
              />
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Energielabel
                <Tooltip text="Het energielabel van uw woning beïnvloedt de normkosten voor energie" />
              </Label>
              <Select
                value={vtlbSettings.woonSituatie.energielabel}
                onValueChange={(value) => updateSettings('woonSituatie', 'energielabel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer energielabel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A++++">A++++ (Zeer zuinig)</SelectItem>
                  <SelectItem value="A+++">A+++</SelectItem>
                  <SelectItem value="A++">A++</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="E">E</SelectItem>
                  <SelectItem value="F">F</SelectItem>
                  <SelectItem value="G">G (Minst zuinig)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {vtlbSettings.woonSituatie.typeWoning === 'koopwoning' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <Label className="flex items-center text-sm font-medium mb-2">
                  WOZ-Waarde (€)
                  <Tooltip text="De WOZ-waarde van uw woning zoals vermeld op de aanslag" />
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="bijv. 350000"
                  value={vtlbSettings.woonSituatie.wozWaarde}
                  onChange={(e) => updateSettings('woonSituatie', 'wozWaarde', e.target.value)}
                />
              </div>
            )}

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Maandelijkse Woonlasten (€) *
                <Tooltip text={vtlbSettings.woonSituatie.typeWoning === 'koopwoning' ? "Uw maandelijkse hypotheekbedrag" : "Uw maandelijkse huur"} />
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={vtlbSettings.woonSituatie.typeWoning === 'koopwoning' ? "bijv. 1250" : "bijv. 850"}
                value={vtlbSettings.woonSituatie.maandelijkseWoonlasten}
                onChange={(e) => updateSettings('woonSituatie', 'maandelijkseWoonlasten', e.target.value)}
              />
              {vtlbSettings.woonSituatie.maandelijkseWoonlasten && (
                <p className="text-xs text-green-600 mt-1">✓ Automatisch ingevuld</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Afstand Wonen-Werken Enkele Reis (km)
                <Tooltip text="De afstand van uw huis naar uw werk in kilometers (enkele reis)" />
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="bijv. 15"
                value={vtlbSettings.werkReizen.afstandWoonWerk}
                onChange={(e) => updateSettings('werkReizen', 'afstandWoonWerk', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Vervoersmiddel *</Label>
              <Select
                value={vtlbSettings.werkReizen.vervoersmiddel}
                onValueChange={(value) => updateSettings('werkReizen', 'vervoersmiddel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hoe reist u naar uw werk..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ov">🚆 Openbaar Vervoer</SelectItem>
                  <SelectItem value="auto">🚗 Auto</SelectItem>
                  <SelectItem value="fiets">🚴 Fiets</SelectItem>
                  <SelectItem value="combinatie">🔄 Combinatie</SelectItem>
                  <SelectItem value="thuiswerken">🏠 Thuiswerken</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Werkdagen per Week</Label>
              <Input
                type="number"
                min="1"
                max="7"
                value={vtlbSettings.werkReizen.werkdagenPerWeek}
                onChange={(e) => updateSettings('werkReizen', 'werkdagenPerWeek', parseInt(e.target.value) || 5)}
              />
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Type Dienstverband *
                <Tooltip text="Uw arbeidsrelatie beïnvloedt de stabiliteitsinschatting van uw inkomen" />
              </Label>
              <Select
                value={vtlbSettings.werkReizen.typeDienstverband}
                onValueChange={(value) => updateSettings('werkReizen', 'typeDienstverband', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type dienstverband..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vast">📝 Vast Contract</SelectItem>
                  <SelectItem value="tijdelijk">⏰ Tijdelijk Contract</SelectItem>
                  <SelectItem value="zzp">💼 ZZP / Freelance</SelectItem>
                  <SelectItem value="uitkering">🏛️ Uitkering</SelectItem>
                  <SelectItem value="student">🎓 Student</SelectItem>
                </SelectContent>
              </Select>
              {vtlbSettings.werkReizen.typeDienstverband && (
                <p className="text-xs text-green-600 mt-1">✓ Automatisch ingevuld</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="chronisch"
                checked={vtlbSettings.zorg.chronischeAandoening}
                onCheckedChange={(checked) => updateSettings('zorg', 'chronischeAandoening', checked)}
              />
              <Label htmlFor="chronisch" className="text-sm font-medium cursor-pointer flex items-center">
                Chronische Aandoening
                <Tooltip text="Heeft u een chronische aandoening waarvoor u structureel medicatie nodig heeft?" />
              </Label>
            </div>

            {vtlbSettings.zorg.chronischeAandoening && (
              <div className="p-4 bg-red-50 rounded-lg">
                <Label className="flex items-center text-sm font-medium mb-2">
                  Maandelijkse Medicijnkosten (€)
                  <Tooltip text="Gemiddelde maandelijkse kosten voor medicatie (na aftrek van vergoedingen)" />
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="bijv. 45"
                  value={vtlbSettings.zorg.maandelijkseMedicijnkosten}
                  onChange={(e) => updateSettings('zorg', 'maandelijkseMedicijnkosten', e.target.value)}
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium mb-2">Type Zorgverzekering *</Label>
              <Select
                value={vtlbSettings.zorg.typeZorgverzekering}
                onValueChange={(value) => updateSettings('zorg', 'typeZorgverzekering', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type zorgverzekering..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basis">🏥 Alleen Basisverzekering</SelectItem>
                  <SelectItem value="basis-aanvullend">💊 Basis + Aanvullende Verzekering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Eigen Risico Gebruikt Dit Jaar
                <Tooltip text="Heeft u dit jaar al (een deel van) uw eigen risico opgemaakt?" />
              </Label>
              <Select
                value={vtlbSettings.zorg.eigenRisicoGebruikt}
                onValueChange={(value) => updateSettings('zorg', 'eigenRisicoGebruikt', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nee">❌ Nee, nog niet gebruikt</SelectItem>
                  <SelectItem value="gedeeltelijk">⚠️ Gedeeltelijk gebruikt</SelectItem>
                  <SelectItem value="volledig">✅ Volledig opgemaakt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 mb-4">
              Vink aan welke toeslagen u ontvangt en vul het maandelijkse bedrag in.
            </p>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="zorgtoeslag"
                  checked={vtlbSettings.toeslagen.zorgtoeslag.actief}
                  onCheckedChange={(checked) => updateNestedSettings('toeslagen', 'zorgtoeslag', 'actief', checked)}
                />
                <Label htmlFor="zorgtoeslag" className="text-sm font-medium cursor-pointer flex items-center">
                  Zorgtoeslag
                  <Tooltip text="Tegemoetkoming in de kosten van de zorgverzekering" />
                </Label>
              </div>
              {vtlbSettings.toeslagen.zorgtoeslag.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.toeslagen.zorgtoeslag.bedrag}
                  onChange={(e) => updateNestedSettings('toeslagen', 'zorgtoeslag', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="huurtoeslag"
                  checked={vtlbSettings.toeslagen.huurtoeslag.actief}
                  onCheckedChange={(checked) => updateNestedSettings('toeslagen', 'huurtoeslag', 'actief', checked)}
                />
                <Label htmlFor="huurtoeslag" className="text-sm font-medium cursor-pointer flex items-center">
                  Huurtoeslag
                  <Tooltip text="Bijdrage in de woonlasten voor huurwoningen" />
                </Label>
              </div>
              {vtlbSettings.toeslagen.huurtoeslag.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.toeslagen.huurtoeslag.bedrag}
                  onChange={(e) => updateNestedSettings('toeslagen', 'huurtoeslag', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="kinderopvang"
                  checked={vtlbSettings.toeslagen.kinderopvangtoeslag.actief}
                  onCheckedChange={(checked) => updateNestedSettings('toeslagen', 'kinderopvangtoeslag', 'actief', checked)}
                />
                <Label htmlFor="kinderopvang" className="text-sm font-medium cursor-pointer flex items-center">
                  Kinderopvangtoeslag
                  <Tooltip text="Vergoeding voor kosten van kinderopvang" />
                </Label>
              </div>
              {vtlbSettings.toeslagen.kinderopvangtoeslag.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.toeslagen.kinderopvangtoeslag.bedrag}
                  onChange={(e) => updateNestedSettings('toeslagen', 'kinderopvangtoeslag', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="kindbudget"
                  checked={vtlbSettings.toeslagen.kindgebondenBudget.actief}
                  onCheckedChange={(checked) => updateNestedSettings('toeslagen', 'kindgebondenBudget', 'actief', checked)}
                />
                <Label htmlFor="kindbudget" className="text-sm font-medium cursor-pointer flex items-center">
                  Kindgebonden Budget
                  <Tooltip text="Extra tegemoetkoming voor gezinnen met kinderen" />
                </Label>
              </div>
              {vtlbSettings.toeslagen.kindgebondenBudget.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.toeslagen.kindgebondenBudget.bedrag}
                  onChange={(e) => updateNestedSettings('toeslagen', 'kindgebondenBudget', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
              <Checkbox
                id="kwijtschelding"
                checked={vtlbSettings.toeslagen.gemeentelijkeKwijtschelding}
                onCheckedChange={(checked) => updateSettings('toeslagen', 'gemeentelijkeKwijtschelding', checked)}
              />
              <Label htmlFor="kwijtschelding" className="text-sm font-medium cursor-pointer flex items-center">
                Gemeentelijke Kwijtschelding Actief
                <Tooltip text="Heeft u kwijtschelding van gemeentelijke belastingen?" />
              </Label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="alimentatie-betalen"
                  checked={vtlbSettings.schulden.alimentatieBetalen.actief}
                  onCheckedChange={(checked) => updateNestedSettings('schulden', 'alimentatieBetalen', 'actief', checked)}
                />
                <Label htmlFor="alimentatie-betalen" className="text-sm font-medium cursor-pointer flex items-center">
                  Alimentatie Betalen
                  <Tooltip text="Maandelijks alimentatiebedrag dat u betaalt aan ex-partner of kinderen" />
                </Label>
              </div>
              {vtlbSettings.schulden.alimentatieBetalen.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.schulden.alimentatieBetalen.bedrag}
                  onChange={(e) => updateNestedSettings('schulden', 'alimentatieBetalen', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="alimentatie-ontvangen"
                  checked={vtlbSettings.schulden.alimentatieOntvangen.actief}
                  onCheckedChange={(checked) => updateNestedSettings('schulden', 'alimentatieOntvangen', 'actief', checked)}
                />
                <Label htmlFor="alimentatie-ontvangen" className="text-sm font-medium cursor-pointer flex items-center">
                  Alimentatie Ontvangen
                  <Tooltip text="Maandelijks alimentatiebedrag dat u ontvangt" />
                </Label>
              </div>
              {vtlbSettings.schulden.alimentatieOntvangen.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bedrag per maand (€)"
                  value={vtlbSettings.schulden.alimentatieOntvangen.bedrag}
                  onChange={(e) => updateNestedSettings('schulden', 'alimentatieOntvangen', 'bedrag', e.target.value)}
                />
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="bewindvoering"
                  checked={vtlbSettings.schulden.bewindvoering.actief}
                  onCheckedChange={(checked) => updateNestedSettings('schulden', 'bewindvoering', 'actief', checked)}
                />
                <Label htmlFor="bewindvoering" className="text-sm font-medium cursor-pointer flex items-center">
                  Bewindvoering Actief
                  <Tooltip text="Heeft u een bewindvoerder die uw financiën beheert?" />
                </Label>
              </div>
              {vtlbSettings.schulden.bewindvoering.actief && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Maandelijkse kosten (€)"
                  value={vtlbSettings.schulden.bewindvoering.kosten}
                  onChange={(e) => updateNestedSettings('schulden', 'bewindvoering', 'kosten', e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center space-x-2 p-4 bg-yellow-50 rounded-lg">
              <Checkbox
                id="schuldhulp"
                checked={vtlbSettings.schulden.schuldhulpverleningActief}
                onCheckedChange={(checked) => updateSettings('schulden', 'schuldhulpverleningActief', checked)}
              />
              <Label htmlFor="schuldhulp" className="text-sm font-medium cursor-pointer flex items-center">
                Schuldhulpverlening Actief
                <Tooltip text="Bent u momenteel in schuldhulpverlening?" />
              </Label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Maandelijkse Studiekosten (€)
                <Tooltip text="Collegegeld, studieboeken, studiemateriaal per maand" />
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="bijv. 150"
                value={vtlbSettings.overigeLasten.studiekosten}
                onChange={(e) => updateSettings('overigeLasten', 'studiekosten', e.target.value)}
              />
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Vakbondscontributie per Maand (€)
                <Tooltip text="Maandelijkse bijdrage aan vakbond of beroepsvereniging" />
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="bijv. 15"
                value={vtlbSettings.overigeLasten.vakbondscontributie}
                onChange={(e) => updateSettings('overigeLasten', 'vakbondscontributie', e.target.value)}
              />
            </div>

            <div>
              <Label className="flex items-center text-sm font-medium mb-2">
                Verplichte Beroepskosten per Maand (€)
                <Tooltip text="Kosten die u moet maken voor uw werk (bijv. verplichte kleding, gereedschap, certificeringen)" />
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="bijv. 50"
                value={vtlbSettings.overigeLasten.verplichteBeroepskosten}
                onChange={(e) => updateSettings('overigeLasten', 'verplichteBeroepskosten', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 p-4 bg-purple-50 rounded-lg">
              <Checkbox
                id="mantelzorg"
                checked={vtlbSettings.overigeLasten.mantelzorgtaken}
                onCheckedChange={(checked) => updateSettings('overigeLasten', 'mantelzorgtaken', checked)}
              />
              <Label htmlFor="mantelzorg" className="text-sm font-medium cursor-pointer flex items-center">
                Mantelzorgtaken
                <Tooltip text="Zorgt u structureel voor een ziek familielid? Dit kan invloed hebben op vrijstellingen" />
              </Label>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg mt-6">
              <p className="text-sm font-medium text-blue-900 mb-2">✅ Bijna Klaar!</p>
              <p className="text-xs text-blue-700">
                U heeft alle stappen doorlopen. Klik op "Opslaan" om uw instellingen te bewaren.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Stap niet gevonden</div>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Settings laden...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = createPageUrl('Settings')}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Terug
        </Button>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 lowercase">VTLB instellingen</h1>
        <p className="text-gray-600 mt-1">
          Vul uw situatie in voor een nauwkeurige VTLB-berekening
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`text-xs ${index === currentStep ? 'text-[var(--konsensi-primary)] font-semibold' : 'text-gray-400'}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[var(--konsensi-primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-center">
              <CardTitle className="text-lg">{steps[currentStep]}</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Stap {currentStep + 1} van {steps.length}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-8">
            {renderStep()}
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Vorige
            </Button>

            {currentStep === steps.length - 1 ? (
              <div className="flex space-x-2">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
                <Button
                  onClick={exportSettings}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporteren
                </Button>
                <label className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                  >
                    <div>
                      <Upload className="w-4 h-4 mr-2" />
                      Importeren
                    </div>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
              >
                Volgende
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VTLBSettingsForm;
