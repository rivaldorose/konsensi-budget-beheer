import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FAQSettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Algemeen');
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === createPageUrl(path);
  };

  const categories = ['Algemeen', 'Account', 'Budget', 'Schulden', 'Technisch'];

  const faqs = [
    {
      question: 'Wat is Konsensi precies?',
      answer: 'Konsensi Budgetbeheer is een digitale tool die je helpt om je inkomsten, uitgaven en schulden overzichtelijk te beheren. We bieden gepersonaliseerd advies, handige overzichten en tools om je financieel weer op de rit te krijgen, allemaal in een veilige omgeving.',
      category: 'Algemeen'
    },
    {
      question: 'Hoe werkt de budgetfunctie?',
      answer: 'De budgetfunctie analyseert je banktransacties en categoriseert deze automatisch. Hierdoor zie je direct hoeveel je uitgeeft aan boodschappen, wonen en vrije tijd. Je kunt limieten instellen en meldingen ontvangen als je bijna over je budget heen gaat.',
      category: 'Budget'
    },
    {
      question: 'Hoe voeg ik mijn inkomsten toe?',
      answer: 'Je kunt inkomsten handmatig toevoegen via het tabblad \'Budget\' of door je bankrekening te koppelen. Bij een koppeling worden je salaris en toeslagen automatisch herkend en toegevoegd aan je maandoverzicht.',
      category: 'Account'
    },
    {
      question: 'Wat is de beslagvrije voet?',
      answer: 'De beslagvrije voet is het deel van je inkomen waar een schuldeiser geen beslag op mag leggen. Dit bedrag heb je minimaal nodig om van te leven (huur, eten, verzekering). Konsensi helpt je dit bedrag correct te berekenen.',
      category: 'Schulden'
    },
    {
      question: 'Hoe activeer ik een Adempauze?',
      answer: 'Een Adempauze kun je aanvragen via de knop (blad-icoon) in de bovenbalk of via je profielinstellingen. Dit zet tijdelijk bepaalde meldingen en actieve trajecten op pauze om je financiële stress te verminderen.',
      category: 'Algemeen'
    },
    {
      question: 'Kan ik mijn gegevens exporteren?',
      answer: 'Ja, via Instellingen > Gegevensbeheer kun je al je transacties en budgetoverzichten exporteren naar een CSV- of PDF-bestand. Handig voor je eigen administratie of voor een hulpverlener.',
      category: 'Account'
    },
    {
      question: 'Hoe neem ik contact op met support?',
      answer: 'Je kunt contact opnemen via de chatknop rechtsonder in het scherm of een e-mail sturen naar support@konsensi.nl. We streven ernaar om binnen 24 uur te reageren op werkdagen.',
      category: 'Technisch'
    },
    {
      question: 'Is mijn data veilig?',
      answer: 'Absoluut. Wij gebruiken bank-grade encryptie om je gegevens te beschermen. Je gegevens worden nooit verkocht aan derden en je hebt altijd volledige controle over wat je deelt.',
      category: 'Technisch'
    },
    {
      question: 'Hoe wijzig ik mijn wachtwoord?',
      answer: 'Ga naar \'Instellingen\' > \'Beveiliging\' om je wachtwoord te wijzigen. We raden aan om een sterk wachtwoord te gebruiken en dit elke 6 maanden te vernieuwen.',
      category: 'Account'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'Algemeen' || faq.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex flex-col overflow-hidden">
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full max-w-[1400px] flex flex-col gap-6 h-full">
          <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a2c26] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-4 lg:p-6 flex flex-col flex-shrink-0 lg:max-h-full lg:overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </Link>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('Privacy')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
                </Link>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <Link
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
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
                      ? 'bg-secondary text-[#0d1b17] dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white'
                  }`}
                  to={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  to={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </Link>
                <Link
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card-elevated hover:text-[#0d1b17] dark:hover:text-white transition-all"
                  to={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </Link>
              </nav>
            </aside>

            {/* Main Content Section */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a2c26] rounded-[24px] lg:rounded-[20px] shadow-sm dark:shadow-lg border dark:border-[#2A3F36] p-6 md:p-8 lg:p-10 overflow-y-auto lg:max-h-full">
              <div className="mb-8">
                <h2 className="text-[#0d1b17] dark:text-white font-bold text-2xl">Veelgestelde Vragen</h2>
                <p className="text-gray-600 dark:text-gray-400 text-[15px] mt-1">Vind snel antwoorden op de meest gestelde vragen</p>
              </div>

              {/* Search & Filter Card */}
              <div className="bg-white dark:bg-[#1a2c26]-elevated rounded-3xl p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] mb-8">
                {/* Search Bar */}
                <div className="mb-8">
                  <label className="relative flex w-full items-center">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 dark:text-gray-500">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input 
                      className="block w-full rounded-[24px] border-none bg-white dark:bg-[#1a2c26] border border-gray-100 dark:border-[#2A3F36] py-4 pl-12 pr-4 text-[#1F2937] dark:text-white placeholder:text-[#6B7280] dark:placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-primary/50 text-base" 
                      placeholder="Zoek naar een vraag..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </label>
                </div>
                {/* Categories Chips */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105 ${
                        selectedCategory === category
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-white dark:bg-[#1a2c26] border border-gray-100 dark:border-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2A3F36] hover:text-[#1F2937] dark:hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="flex flex-col gap-4">
                {filteredFaqs.map((faq, index) => (
                  <details 
                    key={index}
                    className="group bg-white dark:bg-[#1a2c26]-elevated rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-[#2A3F36] overflow-hidden"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between p-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-dark-card">
                      <span className="text-gray-900 dark:text-white text-lg font-bold">{faq.question}</span>
                      <div className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-[#1a2c26] border border-gray-100 dark:border-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] transition-transform duration-300 group-open:rotate-180 group-open:bg-primary/10 dark:group-open:bg-primary/20 group-open:text-primary">
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </summary>
                    <div className="px-6 pb-6 pt-2">
                      <div className="h-px w-full bg-gray-100 dark:bg-dark-border mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="mt-12 flex justify-center">
                <button 
                  className="flex items-center gap-2 px-6 py-3 rounded-[24px] border border-gray-200 dark:border-[#2A3F36] text-primary dark:text-primary font-bold hover:bg-white dark:hover:bg-dark-card-elevated hover:border-primary/30 dark:hover:border-primary/50 hover:shadow-sm transition-all bg-transparent"
                  onClick={() => window.location.href = createPageUrl('HelpSupport')}
                >
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                  <span>Nog steeds hulp nodig? Neem contact op</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

