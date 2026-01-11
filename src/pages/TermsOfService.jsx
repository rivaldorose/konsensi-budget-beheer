import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";

export default function TermsOfService() {
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
    if (path === 'TermsOfService') return true;
    return location.pathname === createPageUrl(path);
  };

  const handleAccept = () => {
    navigate(-1);
  };

  // Terms content component to avoid duplication
  const TermsContent = () => (
    <div className="space-y-8">
      {/* Intro */}
      <section>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed italic">
          <strong className="text-[#1F2937] dark:text-white">Konsensi Budget & Schuldbeheer App</strong><br />
          Versie 1.0 - Januari 2025
        </p>
      </section>

      {/* Artikel 1 - Definities */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 1 - Definities</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          In deze algemene voorwaarden wordt verstaan onder:
        </p>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li><strong className="text-[#1F2937] dark:text-white">Konsensi:</strong> de besloten vennootschap Konsensi BudgetBeheer B.V., gevestigd te Utrecht, ingeschreven bij de Kamer van Koophandel onder nummer 97041858, onderdeel van MacAndrew Holdings B.V., aanbieder van de Konsensi applicatie.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Gebruiker:</strong> de natuurlijke persoon die gebruik maakt van de Konsensi App en akkoord is gegaan met deze algemene voorwaarden.</li>
          <li><strong className="text-[#1F2937] dark:text-white">App:</strong> de Konsensi mobiele applicatie en/of webapplicatie, inclusief alle functionaliteiten voor budget- en schuldbeheer.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Account:</strong> het persoonlijke gebruikersaccount van de Gebruiker waarmee toegang wordt verkregen tot de App.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Diensten:</strong> alle diensten die Konsensi via de App aanbiedt, waaronder budgetbeheer, schuldinzicht, AI-gestuurde financiële coaching, en educatieve content.</li>
          <li><strong className="text-[#1F2937] dark:text-white">Financiële Gegevens:</strong> alle gegevens met betrekking tot inkomsten, uitgaven, schulden, en financiële doelstellingen van de Gebruiker.</li>
        </ul>
      </section>

      {/* Artikel 2 - Toepasselijkheid */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 2 - Toepasselijkheid</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>2.1 Deze algemene voorwaarden zijn van toepassing op elk gebruik van de App en alle overeenkomsten tussen Konsensi en de Gebruiker.</li>
          <li>2.2 Door het aanmaken van een Account of het gebruiken van de App, verklaart de Gebruiker deze voorwaarden te hebben gelezen, begrepen en geaccepteerd.</li>
          <li>2.3 Konsensi behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen worden minimaal 30 dagen vooraf aangekondigd via de App of per e-mail.</li>
          <li>2.4 Indien de Gebruiker niet akkoord gaat met gewijzigde voorwaarden, kan het Account worden opgezegd conform Artikel 9.</li>
        </ul>
      </section>

      {/* Artikel 3 - Toegang en Registratie */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 3 - Toegang en Registratie</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>3.1 Om gebruik te maken van de App dient de Gebruiker een Account aan te maken door waarheidsgetrouwe en volledige informatie te verstrekken.</li>
          <li>3.2 De App is primair bedoeld voor jongeren en jongvolwassenen tussen 18 en 27 jaar. Gebruikers dienen minimaal 18 jaar oud te zijn.</li>
          <li>3.3 De Gebruiker is verantwoordelijk voor het geheimhouden van inloggegevens en voor alle activiteiten die via het Account plaatsvinden.</li>
          <li>3.4 Bij vermoeden van ongeautoriseerd gebruik dient de Gebruiker Konsensi onmiddellijk te informeren.</li>
          <li>3.5 Konsensi behoudt zich het recht voor om Accounts te weigeren, op te schorten of te beëindigen bij schending van deze voorwaarden.</li>
        </ul>
      </section>

      {/* Artikel 4 - Beschrijving van de Diensten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 4 - Beschrijving van de Diensten</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          4.1 Konsensi biedt een platform voor persoonlijk financieel beheer, bestaande uit:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          <li>Budgetbeheer en -planning tools</li>
          <li>Schuldinzicht en aflossingstracking</li>
          <li>AI-gestuurde financiële coaching en adviezen</li>
          <li>Educatieve content over financiële geletterdheid</li>
          <li>Notificaties en herinneringen</li>
          <li>Optionele koppeling met externe financiële dienstverleners</li>
        </ul>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          4.2 De App verstrekt geen financieel advies in de zin van de Wet op het financieel toezicht (Wft). De geboden informatie is uitsluitend informatief en educatief van aard.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          4.3 Konsensi garandeert niet dat gebruik van de App leidt tot specifieke financiële resultaten.
        </p>
      </section>

      {/* Artikel 5 - AI-Functionaliteiten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 5 - AI-Functionaliteiten</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>5.1 De App maakt gebruik van kunstmatige intelligentie (AI) voor het genereren van gepersonaliseerde inzichten en suggesties.</li>
          <li>5.2 AI-gegenereerde content is gebaseerd op door de Gebruiker verstrekte gegevens en algoritmes. Deze content vormt geen professioneel financieel, juridisch of fiscaal advies.</li>
          <li>5.3 De Gebruiker blijft te allen tijde zelf verantwoordelijk voor financiële beslissingen.</li>
          <li>5.4 Konsensi streeft naar nauwkeurigheid van AI-output, maar kan niet garanderen dat deze foutloos is.</li>
        </ul>
      </section>

      {/* Artikel 6 - Gebruikersverplichtingen */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 6 - Gebruikersverplichtingen</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          6.1 De Gebruiker verplicht zich:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          <li>Correcte en actuele informatie te verstrekken</li>
          <li>De App niet te gebruiken voor illegale doeleinden</li>
          <li>Geen inbreuk te maken op rechten van derden of Konsensi</li>
          <li>De App niet te reverse-engineeren, hacken of anderszins te manipuleren</li>
          <li>Geen schadelijke software te uploaden of verspreiden</li>
        </ul>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          6.2 De Gebruiker vrijwaart Konsensi tegen claims van derden die voortvloeien uit schending van deze verplichtingen.
        </p>
      </section>

      {/* Artikel 7 - Intellectueel Eigendom */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 7 - Intellectueel Eigendom</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>7.1 Alle intellectuele eigendomsrechten op de App, inclusief software, design, teksten, logo's en merken, berusten bij Konsensi of haar licentiegevers.</li>
          <li>7.2 De Gebruiker verkrijgt een beperkt, niet-exclusief, niet-overdraagbaar gebruiksrecht voor persoonlijk gebruik van de App.</li>
          <li>7.3 Het is niet toegestaan om zonder voorafgaande schriftelijke toestemming content uit de App te kopiëren, verspreiden of commercieel te exploiteren.</li>
        </ul>
      </section>

      {/* Artikel 8 - Kosten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 8 - Kosten</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>8.1 Het gebruik van de Konsensi App is volledig gratis voor Gebruikers.</li>
          <li>8.2 Er worden geen kosten in rekening gebracht voor het aanmaken van een Account of het gebruik van de functionaliteiten van de App.</li>
        </ul>
      </section>

      {/* Artikel 9 - Beëindiging */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 9 - Beëindiging</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          9.1 De Gebruiker kan het Account op elk moment beëindigen via de instellingen in de App of door contact op te nemen met Konsensi.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          9.2 Bij beëindiging worden persoonsgegevens verwijderd conform het Privacybeleid, tenzij wettelijke bewaarplichten van toepassing zijn.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-2">
          9.3 Konsensi kan het Account beëindigen bij:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>Schending van deze voorwaarden</li>
          <li>Frauduleus gedrag</li>
          <li>Langdurige inactiviteit (na voorafgaande waarschuwing)</li>
        </ul>
      </section>

      {/* Artikel 10 - Aansprakelijkheid */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 10 - Aansprakelijkheid</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-2">
          10.1 Konsensi is niet aansprakelijk voor:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-4">
          <li>Financiële beslissingen genomen op basis van informatie uit de App</li>
          <li>Indirecte schade, gevolgschade of gederfde winst</li>
          <li>Tijdelijke onbeschikbaarheid van de App door onderhoud of technische storingen</li>
          <li>Handelingen van derden, waaronder cyberaanvallen</li>
        </ul>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          10.2 De aansprakelijkheid van Konsensi is in alle gevallen beperkt tot het bedrag dat de Gebruiker in de voorafgaande 12 maanden aan Konsensi heeft betaald, met een maximum van €100,-.
        </p>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          10.3 Voorgaande beperkingen gelden niet bij opzet of grove schuld van Konsensi.
        </p>
      </section>

      {/* Artikel 11 - Beschikbaarheid en Onderhoud */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 11 - Beschikbaarheid en Onderhoud</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>11.1 Konsensi streeft naar 24/7 beschikbaarheid maar garandeert dit niet.</li>
          <li>11.2 Voor gepland onderhoud wordt de Gebruiker waar mogelijk vooraf geïnformeerd.</li>
          <li>11.3 Konsensi behoudt zich het recht voor de App te wijzigen, uit te breiden of functionaliteiten te verwijderen.</li>
        </ul>
      </section>

      {/* Artikel 12 - Privacy */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 12 - Privacy</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>12.1 Konsensi verwerkt persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG) en het Privacybeleid.</li>
          <li>12.2 Het volledige Privacybeleid is beschikbaar in de App en op de website van Konsensi.</li>
          <li>12.3 Door gebruik van de App stemt de Gebruiker in met de verwerking van gegevens zoals beschreven in het Privacybeleid.</li>
        </ul>
      </section>

      {/* Artikel 13 - Klachten */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 13 - Klachten</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>13.1 Klachten kunnen worden ingediend via <a className="text-primary hover:underline" href="mailto:support@konsensi-budgetbeheer.nl">support@konsensi-budgetbeheer.nl</a> of via het contactformulier in de App.</li>
          <li>13.2 Konsensi streeft ernaar klachten binnen 14 werkdagen te behandelen.</li>
          <li>13.3 Bij onopgeloste geschillen kan de Gebruiker zich wenden tot een erkende geschillencommissie of de bevoegde rechter.</li>
        </ul>
      </section>

      {/* Artikel 14 - Toepasselijk Recht en Geschillen */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 14 - Toepasselijk Recht en Geschillen</h3>
        <ul className="space-y-3 text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed">
          <li>14.1 Op deze voorwaarden en alle overeenkomsten is Nederlands recht van toepassing.</li>
          <li>14.2 Geschillen worden bij uitsluiting voorgelegd aan de bevoegde rechter te Amsterdam.</li>
          <li>14.3 Indien een bepaling van deze voorwaarden nietig of vernietigbaar is, laat dit de geldigheid van de overige bepalingen onverlet.</li>
        </ul>
      </section>

      {/* Artikel 15 - Contact */}
      <section>
        <h3 className="text-[#1F2937] dark:text-white text-xl font-semibold mb-4">Artikel 15 - Contact</h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed mb-3">
          Voor vragen over deze voorwaarden kunt u contact opnemen met:
        </p>
        <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px] leading-relaxed space-y-1">
          <p><strong className="text-[#1F2937] dark:text-white">Konsensi BudgetBeheer B.V.</strong></p>
          <p>KVK-nummer: 97041858</p>
          <p>Adres: St.-Jacobsstraat 6 A p/a KVK, 3511BR Utrecht</p>
          <p>E-mail: <a className="text-primary hover:underline" href="mailto:support@konsensi-budgetbeheer.nl">support@konsensi-budgetbeheer.nl</a></p>
          <p>Website: <a className="text-primary hover:underline" href="https://www.konsensi-budgetbeheer.nl" target="_blank" rel="noopener noreferrer">www.konsensi-budgetbeheer.nl</a></p>
        </div>
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
                    className="group flex items-center gap-4 px-4 py-3 rounded-[24px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30 transition-all"
                    to={createPageUrl('TermsOfService')}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    <span className="font-bold text-sm">Algemene Voorwaarden</span>
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

              {/* Main Content Section */}
              <div className="flex-1 w-full overflow-y-auto lg:max-h-full">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10 w-full">
                  <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                    <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Algemene Voorwaarden</h2>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Versie 1.0 - Januari 2025</p>
                  </div>

                  <TermsContent />
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
    <div className="bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-display transition-colors duration-200 antialiased min-h-screen w-full flex flex-col items-center py-10 px-4 md:px-8">
      <div className="w-full max-w-[1000px]">
        <header className="mb-8 md:mb-12">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="flex items-center justify-center p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all group"
              >
                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
              </button>
              <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-[#1F2937] dark:text-white leading-tight">
                Algemene Voorwaarden
              </h1>
            </div>
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="sr-only">Use dark mode settings</span>
              <span className={`pointer-events-none relative inline-block h-9 w-9 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                <span className={`material-symbols-outlined absolute inset-0 flex h-full w-full items-center justify-center text-yellow-500 transition-opacity duration-200 ease-in ${darkMode ? 'opacity-0' : 'opacity-100'}`}>
                  light_mode
                </span>
                <span className={`material-symbols-outlined absolute inset-0 flex h-full w-full items-center justify-center text-primary transition-opacity duration-200 ease-in ${darkMode ? 'opacity-100' : 'opacity-0'}`}>
                  dark_mode
                </span>
              </span>
            </button>
          </div>
          <p className="text-sm font-medium text-[#6B7280] dark:text-[#9CA3AF] pl-0 md:pl-12">
            Versie 1.0 - Januari 2025
          </p>
        </header>

        <main className="bg-white dark:bg-[#1a2c26] rounded-[24px] shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] p-6 md:p-10 lg:p-12 overflow-hidden">
          <TermsContent />
        </main>

        <div className="mt-12 mb-8 flex flex-col items-center justify-center gap-6">
          <button
            onClick={handleAccept}
            className="bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-10 rounded-[24px] shadow-lg shadow-primary/25 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] w-full sm:w-auto min-w-[280px]"
          >
            Ik begrijp en ga akkoord
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors hover:underline"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    </div>
  );
}
