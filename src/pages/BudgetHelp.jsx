import React, { useState, useEffect } from 'react';
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

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const nibudCategories = [
        { name: 'Wonen', percentage: 35, color: 'bg-blue-500', icon: 'home', description: 'Huur of hypotheek, incl. G/W/L' },
        { name: 'Boodschappen', percentage: 15, color: 'bg-yellow-500', icon: 'shopping_cart', description: 'Boodschappen voor het huishouden' },
        { name: 'Vervoer', percentage: 10, color: 'bg-purple-500', icon: 'directions_car', description: 'Auto, OV of fiets' },
        { name: 'Verzekeringen', percentage: 10, color: 'bg-orange-500', icon: 'security', description: 'Zorg, aansprakelijkheid, inboedel' },
        { name: 'Sparen & Buffer', percentage: 10, color: 'bg-primary', icon: 'savings', description: 'Buffer voor onvoorziene uitgaven' },
    ];

    const tips = [
        'Check jaarlijks je energieleverancier en verzekeringen. Overstappen loont vaak direct.',
        'Maak een boodschappenlijstje en doe één keer per week grote boodschappen.',
        'Zeg abonnementen op die je niet of nauwelijks gebruikt (streaming, tijdschriften).',
        'Kook voor meerdere dagen en vries porties in voor later.',
    ];

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
                                    <div className="pt-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Bereken je netto inkomen</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed">
                                            Start met wat er daadwerkelijk binnenkomt. Check je loonstrookjes en toeslagen. Dit is de basis van je financiële plan.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="relative flex gap-5 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-primary text-primary font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,183,127,0.2)]">
                                            2
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Zet uitgaven op een rij</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed">
                                            Maak onderscheid tussen <span className="text-[#1F2937] dark:text-white font-medium">vaste lasten</span> (huur, energie) en <span className="text-[#1F2937] dark:text-white font-medium">variabele kosten</span> (boodschappen, leuke dingen).
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="relative flex gap-5 z-10">
                                    <div className="flex flex-col items-center">
                                        <div className="size-10 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-primary text-primary font-bold flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,183,127,0.2)]">
                                            3
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-[#1F2937] dark:text-white font-semibold text-lg mb-1">Gebruik de potjes-methode</h3>
                                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm leading-relaxed">
                                            Reserveer maandelijks een vast bedrag voor onvoorziene uitgaven. Zo kom je nooit voor verrassingen te staan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: NIBUD Guidelines */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 md:p-8 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-semibold text-xl text-[#1F2937] dark:text-white">NIBUD Budget Richtlijnen</h2>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">Advies</span>
                            </div>
                            <p className="text-gray-500 dark:text-[#a1a1a1] text-sm mb-6">
                                Het NIBUD adviseert globaal de volgende verdeling voor een gezond huishoudboekje.
                            </p>

                            {/* Visual Breakdown */}
                            <div className="flex flex-col gap-5">
                                {nibudCategories.map((category) => (
                                    <div key={category.name}>
                                        <div className="flex justify-between text-sm font-medium mb-2">
                                            <span className={`flex items-center gap-2 ${
                                                category.name === 'Sparen & Buffer' ? 'text-primary' :
                                                category.name === 'Wonen' ? 'text-blue-500' :
                                                category.name === 'Boodschappen' ? 'text-yellow-600 dark:text-yellow-500' :
                                                category.name === 'Vervoer' ? 'text-purple-500' :
                                                'text-orange-500'
                                            }`}>
                                                <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
                                                {category.name}
                                            </span>
                                            <span className="text-[#1F2937] dark:text-white">~{category.percentage}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${category.color} rounded-full transition-all duration-500`}
                                                style={{ width: `${category.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Sidebar / Actionable) - Spans 5 cols (~40%) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Card 3: Quick Tips */}
                        <div className="bg-primary/5 dark:bg-[rgba(16,185,129,0.05)] border border-primary/20 dark:border-primary/30 rounded-[24px] p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">💡</span>
                                <h2 className="font-semibold text-lg text-[#1F2937] dark:text-white">Snelle Bespaartips</h2>
                            </div>
                            <ul className="flex flex-col gap-4">
                                {tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary mt-0.5 text-[20px]">check_circle</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Card 4: Contact Coach */}
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 md:p-8 flex flex-col items-center text-center shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                            <div className="size-16 rounded-full bg-primary/10 dark:bg-[#1a2e26] flex items-center justify-center mb-4 border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-[32px]">support_agent</span>
                            </div>
                            <h2 className="font-bold text-xl text-[#1F2937] dark:text-white mb-2">Kom je er niet uit?</h2>
                            <p className="text-gray-500 dark:text-[#a1a1a1] text-sm mb-6 leading-relaxed">
                                Soms is het fijn als iemand even met je meekijkt. Onze budgetcoaches staan voor je klaar om je persoonlijk advies te geven.
                            </p>
                            <a
                                href="mailto:support@konsensi.nl?subject=Hulp bij budget"
                                className="w-full bg-primary hover:bg-[#059669] text-white font-bold py-3 px-6 rounded-[24px] transition-colors flex items-center justify-center gap-2 group"
                            >
                                Praat met een coach
                                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </a>
                            <p className="text-xs text-gray-400 dark:text-[#a1a1a1] mt-3">Eerste gesprek is gratis</p>
                        </div>

                        {/* Extra Small Card: Downloads */}
                        <a
                            href="/budget-template.xlsx"
                            download
                            className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-5 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-500 dark:text-white group-hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">description</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[#1F2937] dark:text-white font-medium text-sm">Download Template</span>
                                    <span className="text-gray-400 dark:text-[#a1a1a1] text-xs">Excel Sheet (.xlsx)</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">download</span>
                        </a>

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
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
