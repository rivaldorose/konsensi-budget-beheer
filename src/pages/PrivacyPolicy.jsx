import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      await User.me();
      setIsLoggedIn(true);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const isActiveRoute = (path) => {
    if (path === 'PrivacyPolicy') return true;
    return location.pathname === createPageUrl(path);
  };

  const handleAccept = () => {
    navigate(-1);
  };

  // Privacy content component to avoid duplication
  const PrivacyContent = () => (
    <div className="space-y-8">
      {/* Intro */}
      <section>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed italic">
          <strong className="text-[#1F2937] dark:text-white">Konsensi Budget & Schuldbeheer App</strong><br />
          Versie 1.0 - Januari 2025
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mt-4">
          Dit privacybeleid beschrijft hoe Konsensi BudgetBeheer B.V. ("Konsensi", "wij", "ons") persoonsgegevens verzamelt, gebruikt en beschermt in het kader van de Konsensi App. Wij hechten groot belang aan uw privacy en verwerken uw gegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG/GDPR).
        </p>
      </section>

      {/* 1. Verwerkingsverantwoordelijke */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">1. Verwerkingsverantwoordelijke</h3>
        <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed space-y-1">
          <p><strong className="text-[#1F2937] dark:text-white">Konsensi BudgetBeheer B.V.</strong></p>
          <p>KVK-nummer: 97041858</p>
          <p>Onderdeel van: MacAndrew Holdings B.V. (KVK: 96734647)</p>
          <p>Vestigingsadres: St.-Jacobsstraat 6 A p/a KVK, 3511BR Utrecht</p>
          <p>E-mail: <a className="text-primary hover:underline" href="mailto:privacy@konsensi-budgetbeheer.nl">privacy@konsensi-budgetbeheer.nl</a></p>
          <p>Website: <a className="text-primary hover:underline" href="https://www.konsensi-budgetbeheer.nl" target="_blank" rel="noopener noreferrer">www.konsensi-budgetbeheer.nl</a></p>
        </div>
      </section>

      {/* 2. Welke Gegevens Verzamelen Wij? */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">2. Welke Gegevens Verzamelen Wij?</h3>

        <h4 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">2.1 Accountgegevens</h4>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          Bij het aanmaken van een account verzamelen wij: naam, e-mailadres, geboortedatum (om leeftijd te verifiëren), en optioneel telefoonnummer.
        </p>

        <h4 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">2.2 Financiële Gegevens</h4>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          Gegevens die u zelf invoert: inkomsten en bronnen daarvan, uitgaven en categorieën, schulden en schuldeisers, financiële doelstellingen en aflossingsplannen.
        </p>

        <h4 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">2.3 Gebruiksgegevens</h4>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          Automatisch verzamelde gegevens: app-interacties en gebruikspatronen, apparaatinformatie (type, besturingssysteem), IP-adres en locatiegegevens (indien toestemming), crash-reports en foutmeldingen.
        </p>

        <h4 className="text-[#1F2937] dark:text-white text-lg font-medium mb-2">2.4 Communicatiegegevens</h4>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          Berichten en feedback die u naar ons stuurt, supportgesprekken, en enquêteresponsen.
        </p>
      </section>

      {/* 3. Doeleinden van Verwerking */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">3. Doeleinden van Verwerking</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          Wij verwerken uw persoonsgegevens voor de volgende doeleinden:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>Het leveren van de Konsensi-diensten (budgetbeheer, schuldinzicht)</li>
          <li>Het personaliseren van AI-gestuurde financiële inzichten en coaching</li>
          <li>Het versturen van notificaties en herinneringen</li>
          <li>Het verbeteren en ontwikkelen van de App</li>
          <li>Het bieden van klantenondersteuning</li>
          <li>Het voldoen aan wettelijke verplichtingen</li>
          <li>Het voorkomen van fraude en misbruik</li>
        </ul>
      </section>

      {/* 4. Rechtsgronden voor Verwerking */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">4. Rechtsgronden voor Verwerking</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          Wij baseren de verwerking van uw persoonsgegevens op de volgende rechtsgronden:
        </p>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Uitvoering overeenkomst:</strong> Voor het leveren van de diensten waarvoor u zich heeft aangemeld.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Toestemming:</strong> Voor het verzenden van marketingcommunicatie, gebruik van locatiegegevens, en verwerking van bijzondere categorieën gegevens.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Gerechtvaardigd belang:</strong> Voor het verbeteren van onze diensten, beveiliging en fraudepreventie.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Wettelijke verplichting:</strong> Voor het voldoen aan fiscale en administratieve verplichtingen.</li>
        </ul>
      </section>

      {/* 5. AI en Geautomatiseerde Besluitvorming */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">5. AI en Geautomatiseerde Besluitvorming</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>5.1 De Konsensi App maakt gebruik van kunstmatige intelligentie (AI) voor het genereren van gepersonaliseerde financiële inzichten en suggesties.</li>
          <li>5.2 Deze AI-systemen analyseren de door u ingevoerde financiële gegevens om patronen te herkennen en relevante adviezen te formuleren.</li>
          <li>5.3 Er vindt geen volledig geautomatiseerde besluitvorming plaats met rechtsgevolgen of aanmerkelijke gevolgen voor u. AI-output is altijd ter ondersteuning en informatie.</li>
          <li>5.4 U heeft het recht om menselijke tussenkomst te vragen bij AI-gegenereerde inzichten.</li>
        </ul>
      </section>

      {/* 6. Delen van Gegevens */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">6. Delen van Gegevens</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          6.1 Wij verkopen uw persoonsgegevens niet aan derden.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          6.2 Wij kunnen gegevens delen met:
        </p>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Verwerkers:</strong> Dienstverleners die namens ons werken (hosting, analytics, communicatie) en gebonden zijn aan verwerkersovereenkomsten.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Partners:</strong> Alleen met uw expliciete toestemming, bijvoorbeeld voor koppeling met financiële instellingen of schuldhulpverleners.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Autoriteiten:</strong> Indien wettelijk vereist of bij gerechtelijk bevel.</li>
        </ul>
      </section>

      {/* 7. Bewaartermijnen */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">7. Bewaartermijnen</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk:
        </p>
        <ul className="space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Accountgegevens:</strong> Tot 2 jaar na beëindiging van het account, tenzij wettelijke bewaarplichten langer vereisen.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Financiële gegevens:</strong> Tot 2 jaar na beëindiging, of zolang u actief gebruiker bent.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Gebruiksgegevens:</strong> Geanonimiseerd na 12 maanden.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Communicatiegegevens:</strong> Tot 3 jaar voor supportdoeleinden.</li>
        </ul>
      </section>

      {/* 8. Beveiliging */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">8. Beveiliging</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>8.1 Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen verlies, ongeautoriseerde toegang, wijziging of openbaarmaking.</li>
          <li>8.2 Maatregelen omvatten: encryptie van gegevens in transit en in rust, toegangscontrole en authenticatie, regelmatige beveiligingsaudits, training van medewerkers.</li>
          <li>8.3 Ondanks deze maatregelen kan geen enkele methode van elektronische overdracht of opslag 100% veilig worden gegarandeerd.</li>
        </ul>
      </section>

      {/* 9. Uw Rechten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">9. Uw Rechten</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          Op grond van de AVG heeft u de volgende rechten:
        </p>
        <ul className="space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Recht op inzage:</strong> U kunt opvragen welke gegevens wij over u verwerken.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht op rectificatie:</strong> U kunt onjuiste gegevens laten corrigeren.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht op verwijdering:</strong> U kunt verzoeken om verwijdering van uw gegevens ('recht om vergeten te worden').</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht op beperking:</strong> U kunt vragen om beperking van de verwerking.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht op overdraagbaarheid:</strong> U kunt uw gegevens in een gestructureerd formaat ontvangen.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht op bezwaar:</strong> U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Recht om toestemming in te trekken:</strong> Waar verwerking is gebaseerd op toestemming.</li>
        </ul>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mt-4">
          U kunt deze rechten uitoefenen door contact met ons op te nemen via <a className="text-primary hover:underline" href="mailto:privacy@konsensi-budgetbeheer.nl">privacy@konsensi-budgetbeheer.nl</a>. Wij reageren binnen 30 dagen.
        </p>
      </section>

      {/* 10. Cookies en Tracking */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">10. Cookies en Tracking</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          10.1 De App en website maken gebruik van cookies en vergelijkbare technologieën.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          10.2 Wij gebruiken:
        </p>
        <ul className="space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Functionele cookies:</strong> Noodzakelijk voor werking van de App.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Analytische cookies:</strong> Voor inzicht in gebruik en verbetering (met toestemming).</li>
        </ul>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mt-3">
          10.3 U kunt cookievoorkeuren beheren via de App-instellingen of uw browserinstellingen.
        </p>
      </section>

      {/* 11. Internationale Doorgifte */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">11. Internationale Doorgifte</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>11.1 Uw gegevens worden primair verwerkt binnen de Europese Economische Ruimte (EER).</li>
          <li>11.2 Indien doorgifte naar landen buiten de EER noodzakelijk is, zorgen wij voor passende waarborgen zoals standaardcontractbepalingen (SCC's) of adequaatheidsbesluiten.</li>
        </ul>
      </section>

      {/* 12. Minderjarigen */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">12. Minderjarigen</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>12.1 De Konsensi App is bedoeld voor gebruikers van 18 jaar en ouder.</li>
          <li>12.2 Wij verzamelen niet bewust gegevens van personen jonger dan 18 jaar. Indien wij ontdekken dat dit toch is gebeurd, verwijderen wij deze gegevens onmiddellijk.</li>
        </ul>
      </section>

      {/* 13. Wijzigingen in dit Privacybeleid */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">13. Wijzigingen in dit Privacybeleid</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>13.1 Wij kunnen dit privacybeleid van tijd tot tijd wijzigen.</li>
          <li>13.2 Materiële wijzigingen worden minimaal 30 dagen vooraf aangekondigd via de App of per e-mail.</li>
          <li>13.3 De meest recente versie is altijd beschikbaar in de App en op onze website.</li>
        </ul>
      </section>

      {/* 14. Klachten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">14. Klachten</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>14.1 Heeft u klachten over de verwerking van uw persoonsgegevens? Neem dan contact met ons op via <a className="text-primary hover:underline" href="mailto:privacy@konsensi-budgetbeheer.nl">privacy@konsensi-budgetbeheer.nl</a>.</li>
          <li>14.2 U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (<a className="text-primary hover:underline" href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">www.autoriteitpersoonsgegevens.nl</a>).</li>
        </ul>
      </section>

      {/* 15. Contact */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">15. Contact</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          Voor vragen over dit privacybeleid kunt u contact opnemen met:
        </p>
        <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed space-y-1">
          <p><strong className="text-[#1F2937] dark:text-white">Konsensi BudgetBeheer B.V.</strong></p>
          <p>KVK-nummer: 97041858</p>
          <p>Adres: St.-Jacobsstraat 6 A p/a KVK, 3511BR Utrecht</p>
          <p>Functionaris Gegevensbescherming: <a className="text-primary hover:underline" href="mailto:privacy@konsensi-budgetbeheer.nl">privacy@konsensi-budgetbeheer.nl</a></p>
          <p>Website: <a className="text-primary hover:underline" href="https://www.konsensi-budgetbeheer.nl" target="_blank" rel="noopener noreferrer">www.konsensi-budgetbeheer.nl</a></p>
        </div>
      </section>

      {/* Footer */}
      <section className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm italic">
          Dit privacybeleid is voor het laatst bijgewerkt in januari 2025.
        </p>
      </section>
    </div>
  );

  // Logged-in view with settings sidebar
  if (isLoggedIn && !loading) {
    return (
      <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
        <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
          <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
            {/* Page Header */}
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
              {/* Sidebar Navigation */}
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
                    className="group flex items-center gap-4 px-4 py-3 rounded-[24px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30 transition-all"
                    to={createPageUrl('PrivacyPolicy')}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
                    <span className="font-bold text-sm">Privacybeleid</span>
                  </Link>
                </nav>
              </aside>

              {/* Main Content Section */}
              <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                  <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                    <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Privacybeleid</h2>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Versie 1.0 - Januari 2025</p>
                  </div>

                  <PrivacyContent />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading state
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

  // Not logged in view (original)
  return (
    <div className="bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 overflow-x-hidden">
      <div className="w-full max-w-[1000px] flex flex-col">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
              <h1 className="text-[#1F2937] dark:text-white text-3xl sm:text-4xl font-bold tracking-tight">
                Privacybeleid
              </h1>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                className="sr-only peer"
                type="checkbox"
                checked={darkMode}
                onChange={toggleTheme}
              />
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner transition-colors duration-300 flex items-center justify-between px-1.5 peer-focus:ring-2 peer-focus:ring-primary/50">
                <span className="material-symbols-outlined text-[18px] text-gray-400 dark:text-gray-500">light_mode</span>
                <span className="material-symbols-outlined text-[18px] text-gray-400 dark:text-gray-500">dark_mode</span>
              </div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${darkMode ? 'translate-x-8' : 'translate-x-0'}`}>
                <span className={`material-symbols-outlined text-[16px] text-yellow-500 absolute transition-all duration-300 ${darkMode ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'}`}>
                  light_mode
                </span>
                <span className={`material-symbols-outlined text-[16px] text-primary absolute transition-all duration-300 ${darkMode ? 'scale-100 rotate-0' : 'scale-0 rotate-90'}`}>
                  dark_mode
                </span>
              </div>
            </label>
          </div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium pl-12">
            Versie 1.0 - Januari 2025
          </p>
        </header>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] p-8 sm:p-10 mb-12">
          <PrivacyContent />
        </div>

        <div className="flex flex-col items-center justify-center gap-6 mb-12">
          <button
            onClick={handleAccept}
            className="flex items-center justify-center w-full max-w-[480px] h-[52px] bg-primary hover:bg-primary-dark text-white text-base font-bold rounded-[24px] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Ik begrijp en ga akkoord
          </button>
          <Link
            to="/login"
            className="text-gray-600 dark:text-gray-400 hover:text-primary text-sm font-medium underline transition-colors"
          >
            Terug naar login
          </Link>
        </div>
      </div>
    </div>
  );
}
