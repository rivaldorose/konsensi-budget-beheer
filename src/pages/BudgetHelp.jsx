import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function BudgetHelp() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // NIBUD richtlijnen - gebaseerd op gemiddelde Nederlandse huishoudens
    // Bron: NIBUD Budgethandboek en Persoonlijk Budgetadvies
    const nibudCategories = [
        { name: 'Wonen', percentage: 30, color: 'bg-blue-500', icon: 'home', description: 'Huur/hypotheek inclusief servicekosten' },
        { name: 'Energie & Water', percentage: 8, color: 'bg-cyan-500', icon: 'bolt', description: 'Gas, elektra en water' },
        { name: 'Boodschappen', percentage: 12, color: 'bg-yellow-500', icon: 'shopping_cart', description: 'Voeding en huishoudelijke producten' },
        { name: 'Verzekeringen', percentage: 8, color: 'bg-orange-500', icon: 'security', description: 'Zorg, WA, inboedel, reis' },
        { name: 'Vervoer', percentage: 8, color: 'bg-purple-500', icon: 'directions_car', description: 'Auto, OV, fiets' },
        { name: 'Telefoon & Internet', percentage: 3, color: 'bg-indigo-500', icon: 'wifi', description: 'Abonnementen communicatie' },
        { name: 'Kleding & Persoonlijk', percentage: 5, color: 'bg-pink-500', icon: 'checkroom', description: 'Kleding, verzorging' },
        { name: 'Reserveringen', percentage: 10, color: 'bg-amber-500', icon: 'event', description: 'Vakantie, verjaardagen, reparaties' },
        { name: 'Sparen & Buffer', percentage: 10, color: 'bg-primary', icon: 'savings', description: 'Noodfonds en lange termijn' },
        { name: 'Vrije ruimte', percentage: 6, color: 'bg-gray-400', icon: 'celebration', description: 'Ontspanning, hobby\'s, uitjes' },
    ];

    // Alle bespaartips - wisselen wekelijks
    const allTips = [
        // Week 1-4: Boodschappen & Voeding
        { tip: 'Maak een weekmenu en boodschappenlijst. Zo voorkom je impulsgaankopen en verspilling.', category: 'Boodschappen' },
        { tip: 'Vergelijk prijzen met apps zoals Too Good To Go of supermarkt-apps voor kortingen.', category: 'Boodschappen' },
        { tip: 'Koop huismerken in plaats van A-merken. Vaak dezelfde kwaliteit, veel goedkoper.', category: 'Boodschappen' },
        { tip: 'Kook voor meerdere dagen en vries porties in. Scheelt tijd én geld.', category: 'Boodschappen' },

        // Week 5-8: Energie & Wonen
        { tip: 'Vergelijk jaarlijks je energieleverancier. Overstappen kan honderden euro\'s besparen.', category: 'Energie' },
        { tip: 'Zet de thermostaat 1 graad lager. Bespaart tot 7% op je stookkosten.', category: 'Energie' },
        { tip: 'Gebruik LED-lampen en zet apparaten helemaal uit (geen standby).', category: 'Energie' },
        { tip: 'Douche korter: 5 minuten in plaats van 10 bespaart €150+ per jaar.', category: 'Energie' },

        // Week 9-12: Abonnementen & Verzekeringen
        { tip: 'Check welke streaming diensten je echt gebruikt. Wissel maandelijks af.', category: 'Abonnementen' },
        { tip: 'Bel je provider en vraag om korting. Vaak krijg je een beter tarief.', category: 'Abonnementen' },
        { tip: 'Vergelijk je verzekeringen jaarlijks via Independer of Pricewise.', category: 'Verzekeringen' },
        { tip: 'Verhoog je eigen risico zorgverzekering als je weinig zorgkosten hebt.', category: 'Verzekeringen' },

        // Week 13-16: Vervoer
        { tip: 'Carpool met collega\'s of buren. Deel de kosten en help het milieu.', category: 'Vervoer' },
        { tip: 'Check of een OV-abonnement voordeliger is dan losse kaartjes.', category: 'Vervoer' },
        { tip: 'Onderhoud je auto regelmatig. Voorkomt dure reparaties later.', category: 'Vervoer' },
        { tip: 'Fiets korte afstanden. Gratis, gezond en snel in de stad.', category: 'Vervoer' },

        // Week 17-20: Sparen & Algemeen
        { tip: 'Betaal jezelf eerst: zet direct na je salaris een vast bedrag apart.', category: 'Sparen' },
        { tip: 'Gebruik de 24-uurs regel: wacht een dag voor grote aankopen.', category: 'Sparen' },
        { tip: 'Check of je recht hebt op toeslagen via toeslagen.nl.', category: 'Toeslagen' },
        { tip: 'Vraag je gemeente naar kwijtschelding gemeentelijke belastingen.', category: 'Toeslagen' },

        // Week 21-24: Extra tips
        { tip: 'Verkoop spullen die je niet meer gebruikt via Marktplaats of Vinted.', category: 'Extra inkomen' },
        { tip: 'Gebruik cashback apps zoals Scoupy of shopbuddies.', category: 'Besparen' },
        { tip: 'Ga naar de bieb voor boeken, tijdschriften en zelfs games.', category: 'Vrije tijd' },
        { tip: 'Plan gratis activiteiten: wandelen, musea op bepaalde dagen, festivals.', category: 'Vrije tijd' },
    ];

    // Bereken welke 4 tips te tonen op basis van weeknummer
    const currentTips = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

        // Roteer door de tips op basis van weeknummer
        const startIndex = ((weekNumber - 1) * 4) % allTips.length;
        const tips = [];
        for (let i = 0; i < 4; i++) {
            tips.push(allTips[(startIndex + i) % allTips.length]);
        }
        return tips;
    }, []);

    // Bereken weeknummer voor weergave
    const weekNumber = useMemo(() => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-sans">
            {/* Main Content Area */}
            <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12">
                {/* Header Section */}
                <div className="flex flex-col gap-4 mb-10">
                    <Link
                        to="/BudgetPlan"
                        className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1 transition-all w-fit"
                    >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        Terug naar Budgetplan
                    </Link>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold text-3xl md:text-4xl text-[#1F2937] dark:text-white leading-tight">
                            Hulp bij je Budget
                        </h1>
                        <p className="text-base text-gray-500 dark:text-[#a1a1a1] max-w-2xl">
                            Leer hoe je een realistisch budget opstelt en je doelen bereikt met onze handige gidsen en tools.
                        </p>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN (Main Educational Content) - Spans 7 cols (~60%) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        {/* Card 1: Intro / Steps */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 md:p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <h2 className="font-semibold text-xl text-[#1F2937] dark:text-white">Stap voor Stap naar Overzicht</h2>
                            </div>
                            <div className="relative flex flex-col gap-8 pl-2">
                                {/* Connecting Line */}
                                <div className="absolute left-[19px] top-10 bottom-4 w-[2px] bg-gray-200 dark:bg-[#2a2a2a]"></div>

                                {/* Step 1 */}
                                <div className="relative flex gap-5 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-primary text-primary font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,183,127,0.2)]">
                                            1
                                        </div>
                                    </div>
                                    <div className="pt-1 flex-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Bereken je netto inkomen</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed mb-3">
                                            Start met wat er daadwerkelijk binnenkomt. Check je loonstrookjes en toeslagen. Dit is de basis van je financiële plan.
                                        </p>
                                        <Link
                                            to="/Income"
                                            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            Vul je inkomen in
                                        </Link>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative flex gap-5 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-primary text-primary font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,183,127,0.2)]">
                                            2
                                        </div>
                                    </div>
                                    <div className="pt-1 flex-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Zet je vaste lasten op een rij</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed mb-3">
                                            Maak onderscheid tussen <span className="text-[#1F2937] dark:text-white font-medium">vaste lasten</span> (huur, energie) en <span className="text-[#1F2937] dark:text-white font-medium">variabele kosten</span> (boodschappen, leuke dingen).
                                        </p>
                                        <Link
                                            to="/MaandelijkseLasten"
                                            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            Beheer je vaste lasten
                                        </Link>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative flex gap-5 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-primary text-primary font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,183,127,0.2)]">
                                            3
                                        </div>
                                    </div>
                                    <div className="pt-1 flex-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Gebruik de potjes-methode</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed mb-3">
                                            Verdeel wat overblijft over digitale potjes. Zo weet je precies wat je nog kunt uitgeven per categorie.
                                        </p>
                                        <Link
                                            to="/Potjes"
                                            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            Stel je potjes in
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: NIBUD Guidelines */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 md:p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-xl text-[#1F2937] dark:text-white">NIBUD Budget Richtlijnen</h2>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">2024</span>
                            </div>
                            <p className="text-gray-500 dark:text-[#a1a1a1] text-sm mb-6">
                                Gemiddelde verdeling van netto inkomen voor een gezond huishoudboekje, gebaseerd op NIBUD onderzoek.
                            </p>

                            {/* Visual Breakdown */}
                            <div className="flex flex-col gap-4">
                                {nibudCategories.map((category) => (
                                    <div key={category.name}>
                                        <div className="flex justify-between text-sm font-medium mb-1.5">
                                            <span className={`flex items-center gap-2 ${
                                                category.name === 'Sparen & Buffer' ? 'text-primary' :
                                                category.name === 'Wonen' ? 'text-blue-500' :
                                                category.name === 'Energie & Water' ? 'text-cyan-500' :
                                                category.name === 'Boodschappen' ? 'text-yellow-600 dark:text-yellow-500' :
                                                category.name === 'Vervoer' ? 'text-purple-500' :
                                                category.name === 'Verzekeringen' ? 'text-orange-500' :
                                                category.name === 'Telefoon & Internet' ? 'text-indigo-500' :
                                                category.name === 'Kleding & Persoonlijk' ? 'text-pink-500' :
                                                category.name === 'Reserveringen' ? 'text-amber-500' :
                                                'text-gray-500 dark:text-gray-400'
                                            }`}>
                                                <span className="material-symbols-outlined text-[16px]">{category.icon}</span>
                                                {category.name}
                                            </span>
                                            <span className="text-[#1F2937] dark:text-white">{category.percentage}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${category.color} rounded-full transition-all duration-500`}
                                                    style={{ width: `${category.percentage * 3}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 w-24 text-right hidden sm:block">{category.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* NIBUD Link */}
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                                <a
                                    href="https://persoonlijkbudgetadvies.nibud.nl/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                                >
                                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    Bereken jouw persoonlijke advies op nibud.nl
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Sidebar / Actionable) - Spans 5 cols (~40%) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Card 3: Quick Tips - Weekly rotating */}
                        <div className="bg-primary/5 dark:bg-[rgba(16,185,129,0.05)] border border-primary/20 dark:border-primary/30 rounded-[24px] p-6 md:p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">💡</span>
                                    <h2 className="font-semibold text-lg text-[#1F2937] dark:text-white">Snelle Bespaartips</h2>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1a1a] px-2 py-1 rounded-full">
                                    Week {weekNumber}
                                </span>
                            </div>
                            <ul className="flex flex-col gap-4">
                                {currentTips.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary mt-0.5 text-[20px] shrink-0">check_circle</span>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{item.tip}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">{item.category}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
                                Tips wisselen elke week
                            </p>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <h3 className="font-semibold text-[#1F2937] dark:text-white mb-4">Direct aan de slag</h3>
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/BudgetPlan"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group"
                                >
                                    <div className="size-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">pie_chart</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-[#1F2937] dark:text-white block">Budgetplan bekijken</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Je huidige overzicht</span>
                                    </div>
                                    <span className="material-symbols-outlined text-primary text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>

                                <Link
                                    to="/VasteLastenCheck"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors group"
                                >
                                    <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                                        <span className="material-symbols-outlined">fact_check</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-[#1F2937] dark:text-white block">Vaste Lasten Check</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Vergelijk met NIBUD</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>

                                <Link
                                    to="/Wishlist"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors group"
                                >
                                    <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                                        <span className="material-symbols-outlined">favorite</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-[#1F2937] dark:text-white block">Wenslijst</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Spaar voor je wensen</span>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        {/* Extra Resources Card */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <h3 className="font-semibold text-[#1F2937] dark:text-white mb-4">Handige Links</h3>
                            <div className="flex flex-col gap-3">
                                <a
                                    href="https://www.nibud.nl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    NIBUD - Budget richtlijnen
                                </a>
                                <a
                                    href="https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/toeslagen"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    Toeslagen aanvragen
                                </a>
                                <a
                                    href="https://www.geldfit.nl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    Geldfit - Financiële hulp
                                </a>
                                <a
                                    href="https://www.zelfjeschuldenregelen.nl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                    Zelf je schulden regelen
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
