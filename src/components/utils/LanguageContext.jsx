import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Translation } from '@/api/entities';
import { User } from '@/api/entities';

const LanguageContext = createContext();

// Fallback translations for missing keys
const fallbackTranslations = {
  // Common
  'common.pleaseWait': { nl: 'Even geduld...', en: 'Please wait...' },
  'common.chooseLanguage': { nl: 'Kies taal', en: 'Choose language' },
  'common.cancel': { nl: 'Annuleren', en: 'Cancel' },
  'common.save': { nl: 'Opslaan', en: 'Save' },
  'common.close': { nl: 'Sluiten', en: 'Close' },
  'common.gotIt': { nl: 'Begrepen', en: 'Got it' },
  'common.delete': { nl: 'Verwijderen', en: 'Delete' },
  'common.edit': { nl: 'Bewerken', en: 'Edit' },
  'common.add': { nl: 'Toevoegen', en: 'Add' },
  'common.back': { nl: 'Terug', en: 'Back' },
  'common.next': { nl: 'Volgende', en: 'Next' },
  'common.loading': { nl: 'Laden...', en: 'Loading...' },
  'common.error': { nl: 'Fout', en: 'Error' },
  'common.success': { nl: 'Gelukt', en: 'Success' },

  // Navigation
  'nav.adempauze': { nl: 'Adempauze', en: 'Breathing Space' },
  'nav.settings': { nl: 'Instellingen', en: 'Settings' },
  'nav.dashboard': { nl: 'Dashboard', en: 'Dashboard' },
  'nav.debts': { nl: 'Schulden', en: 'Debts' },
  'nav.income': { nl: 'Inkomen', en: 'Income' },
  'nav.expenses': { nl: 'Uitgaven', en: 'Expenses' },

  // Notifications
  'notifications.title': { nl: 'Meldingen', en: 'Notifications' },
  'notifications.noNew': { nl: 'Geen nieuwe meldingen', en: 'No new notifications' },

  // Profile
  'profile.accountDetails': { nl: 'Accountgegevens', en: 'Account Details' },
  'profile.logout': { nl: 'Uitloggen', en: 'Logout' },

  // Add modal
  'addmodal.add': { nl: 'Toevoegen', en: 'Add' },

  // Debt related
  'addDescription': { nl: 'Voeg een nieuwe schuld toe aan je overzicht', en: 'Add a new debt to your overview' },
  'creditorName': { nl: 'Schuldeiser', en: 'Creditor name' },
  'principalAmount': { nl: 'Hoofdsom', en: 'Principal amount' },
  'originDate': { nl: 'Ontstaan datum', en: 'Origin date' },
  'optionalCosts': { nl: 'Optionele kosten', en: 'Optional costs' },
  'collectionCosts': { nl: 'Incassokosten', en: 'Collection costs' },
  'interestAmount': { nl: 'Rente bedrag', en: 'Interest amount' },
  'interestRateLabel': { nl: 'Rentepercentage', en: 'Interest rate' },
  'interestRateDescription': { nl: 'Jaarlijks rentepercentage op de schuld', en: 'Annual interest rate on the debt' },
  'totalDebtAmount': { nl: 'Totale schuld', en: 'Total debt amount' },
  'status': { nl: 'Status', en: 'Status' },
  'selectStatusPlaceholder': { nl: 'Selecteer status', en: 'Select status' },
  'statusOptions.notActive': { nl: 'Niet actief', en: 'Not active' },
  'statusOptions.waiting': { nl: 'Wachtend', en: 'Waiting' },
  'statusOptions.paymentPlan': { nl: 'Betalingsregeling', en: 'Payment plan' },
  'statusOptions.paidOff': { nl: 'Afbetaald', en: 'Paid off' },
  'notes': { nl: 'Notities', en: 'Notes' },
  'notesPlaceholder': { nl: 'Optionele notities over deze schuld...', en: 'Optional notes about this debt...' },

  // Strategy related
  'strategy.activePlanTitle': { nl: 'Actief Aflossingsplan', en: 'Active Repayment Plan' },
  'strategy.monthlyBudget': { nl: 'Maandelijks budget', en: 'Monthly budget' },
  'strategy.debtFree': { nl: 'Schuldenvrij op', en: 'Debt free by' },
  'strategy.currentFocus': { nl: 'Huidige focus', en: 'Current focus' },
  'strategy.nextUp': { nl: 'Daarna', en: 'Next up' },
  'strategy.snowball.title': { nl: 'Sneeuwbal Methode', en: 'Snowball Method' },
  'strategy.avalanche.title': { nl: 'Lawine Methode', en: 'Avalanche Method' },
  'strategy.explanation.subtitle': { nl: 'Hoe deze strategie werkt', en: 'How this strategy works' },
  'strategy.explanation.whatIsIt.title': { nl: 'Wat is het?', en: 'What is it?' },
  'strategy.explanation.yourSituation.title': { nl: 'Jouw situatie', en: 'Your situation' },
  'strategy.explanation.yourSituation.p1': { nl: 'Met je budget van {budget}/maand:', en: 'With your budget of {budget}/month:' },
  'strategy.explanation.step1': { nl: 'Stap 1', en: 'Step 1' },
  'strategy.explanation.step2': { nl: 'Stap 2', en: 'Step 2' },
  'strategy.explanation.andSoOn': { nl: 'en zo verder voor {count} schulden', en: 'and so on for {count} debts' },
  'strategy.explanation.whySmart.title': { nl: 'Waarom slim?', en: 'Why is it smart?' },
  'strategy.explanation.disadvantage.title': { nl: 'Nadeel', en: 'Disadvantage' },
  'strategy.explanation.whichToChoose.title': { nl: 'Welke kiezen?', en: 'Which to choose?' },
  'strategy.explanation.chooseSnowballIf.title': { nl: 'Kies Sneeuwbal als:', en: 'Choose Snowball if:' },
  'strategy.explanation.chooseAvalancheIf.title': { nl: 'Kies Lawine als:', en: 'Choose Avalanche if:' },
  'strategy.explanation.chooseSnowballIf.li1': { nl: 'Je snelle motivatie nodig hebt', en: 'You need quick motivation' },
  'strategy.explanation.chooseSnowballIf.li2': { nl: 'Je moeite hebt om vol te houden', en: 'You struggle to stay committed' },
  'strategy.explanation.chooseSnowballIf.li3': { nl: 'Psychologische overwinningen belangrijk zijn', en: 'Psychological wins are important' },
  'strategy.explanation.chooseAvalancheIf.li1': { nl: 'Je gedisciplineerd bent', en: 'You are disciplined' },
  'strategy.explanation.chooseAvalancheIf.li2': { nl: 'Je het meeste wilt besparen', en: 'You want to save the most' },
  'strategy.explanation.chooseAvalancheIf.li3': { nl: 'Je hoge rente schulden hebt', en: 'You have high interest debts' },
  'strategy.explanation.snowball.whatIsIt.p1': { nl: 'De sneeuwbal methode richt zich op de kleinste schuld eerst.', en: 'The snowball method focuses on the smallest debt first.' },
  'strategy.explanation.snowball.whatIsIt.p2': { nl: 'Dit geeft je snelle overwinningen en motivatie.', en: 'This gives you quick wins and motivation.' },
  'strategy.explanation.snowball.step1.p1': { nl: 'Dit is je kleinste schuld.', en: 'This is your smallest debt.' },
  'strategy.explanation.snowball.step1.p2': { nl: 'Afbetaald in {months} maanden.', en: 'Paid off in {months} months.' },
  'strategy.explanation.snowball.step2.p1': { nl: 'Je volgende kleinste schuld.', en: 'Your next smallest debt.' },
  'strategy.explanation.snowball.step2.p2': { nl: 'Afbetaald in {months} maanden.', en: 'Paid off in {months} months.' },
  'strategy.explanation.snowball.whySmart.li1': { nl: 'Snelle resultaten houden je gemotiveerd', en: 'Quick results keep you motivated' },
  'strategy.explanation.snowball.whySmart.li2': { nl: 'Minder schuldeisers = minder stress', en: 'Fewer creditors = less stress' },
  'strategy.explanation.snowball.disadvantage.li1': { nl: 'Kan meer rente kosten op lange termijn', en: 'May cost more interest in the long run' },
  'strategy.explanation.snowball.disadvantage.li2': { nl: 'Niet altijd de meest efficiënte optie', en: 'Not always the most efficient option' },
  'strategy.explanation.avalanche.whatIsIt.p1': { nl: 'De lawine methode richt zich op de hoogste rente eerst.', en: 'The avalanche method focuses on the highest interest first.' },
  'strategy.explanation.avalanche.whatIsIt.p2': { nl: 'Dit bespaart je het meeste geld op lange termijn.', en: 'This saves you the most money in the long run.' },
  'strategy.explanation.avalanche.step1.p1': { nl: 'Hoogste rente: {interest_rate}% ({interest_cost}/maand rente)', en: 'Highest interest: {interest_rate}% ({interest_cost}/month interest)' },
  'strategy.explanation.avalanche.step1.p2': { nl: 'Door deze eerst af te betalen, bespaar je het meeste.', en: 'By paying this off first, you save the most.' },
  'strategy.explanation.avalanche.step1.p3': { nl: 'Afbetaald in {months} maanden.', en: 'Paid off in {months} months.' },
  'strategy.explanation.avalanche.step2.p1': { nl: 'Volgende hoogste rente: {interest_rate}%', en: 'Next highest interest: {interest_rate}%' },
  'strategy.explanation.avalanche.step2.p2': { nl: 'Je budget van {budget} gaat nu volledig hierheen.', en: 'Your budget of {budget} now goes entirely here.' },
  'strategy.explanation.avalanche.step2.p3': { nl: 'Afbetaald in {months} maanden.', en: 'Paid off in {months} months.' },
  'strategy.explanation.avalanche.whySmart.li1': { nl: 'Bespaart het meeste op rentekosten', en: 'Saves the most on interest costs' },
  'strategy.explanation.avalanche.whySmart.li2': { nl: 'Snelste weg naar schuldenvrij', en: 'Fastest path to debt-free' },
  'strategy.explanation.avalanche.whySmart.li3': { nl: 'Je bespaart {savings} aan rente!', en: 'You save {savings} in interest!' },
  'strategy.explanation.avalanche.disadvantage.li1': { nl: 'Kan {months} maanden duren voor eerste afbetaling', en: 'Can take {months} months for first payoff' },
  'strategy.explanation.avalanche.disadvantage.li2': { nl: 'Vereist meer discipline en geduld', en: 'Requires more discipline and patience' },

  // Financial breakdown
  'financialBreakdown.title': { nl: 'Financieel Overzicht', en: 'Financial Overview' },
  'financialBreakdown.noData': { nl: 'Geen gegevens beschikbaar', en: 'No data available' },
  'financialBreakdown.totalIncome': { nl: 'Totaal inkomen', en: 'Total income' },

  // FAQ
  'help.faqTitle': { nl: 'Veelgestelde vragen', en: 'Frequently Asked Questions' },
  'faq.searchPlaceholder': { nl: 'Zoek in vragen...', en: 'Search questions...' },
  'faq.noResults': { nl: 'Geen resultaten gevonden', en: 'No results found' },
  'faq.category.general': { nl: 'Algemeen', en: 'General' },
  'faq.category.debts': { nl: 'Schulden', en: 'Debts' },
  'faq.category.budget': { nl: 'Budget', en: 'Budget' }
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('nl');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      // TEMPORARY BYPASS: Skip database calls when unavailable
      // TODO: Remove this bypass when database is back online
      const BYPASS_AUTH = false;

      if (BYPASS_AUTH) {
        console.log('⚠️ LANGUAGE BYPASS ACTIVE - Using defaults');
        setTranslations({});
        setLanguage('nl');
        setLoading(false);
        return;
      }

      try {
        const [translationData, user] = await Promise.all([
          Translation.list(undefined, 1000).catch(() => []),
          User.me().catch(() => null)
        ]);

        const formatted = translationData.reduce((acc, item) => {
          acc[item.key] = {
            nl: item.nl,
            en: item.en,
            es: item.es,
            pl: item.pl,
            de: item.de,
            fr: item.fr,
            tr: item.tr,
            ar: item.ar,
          };
          return acc;
        }, {});
        setTranslations(formatted);

        if (user && user.language_preference) {
          setLanguage(user.language_preference);

          // Set RTL for Arabic
          if (user.language_preference === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
          } else {
            document.documentElement.setAttribute('dir', 'ltr');
          }
        }
      } catch (error) {
        console.error("Failed to bootstrap language context:", error);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    
    // Set RTL for Arabic
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, []);

  const t = useCallback((key, options = {}) => {
    if (loading) return '...'; 

    // First check database translations, then fallback translations
    const translationSet = translations[key] || fallbackTranslations[key];
    let translation = translationSet ? (translationSet[language] || translationSet['nl']) : key;

    if (!translationSet) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    if (translation) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, options[optionKey]);
      });
    }

    return translation || key;
  }, [language, translations, loading]);

  const value = { language, changeLanguage, t, translations, loading };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-500 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Instellingen laden...</p>
            </div>
        </div>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}