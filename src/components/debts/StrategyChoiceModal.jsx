import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, Check, TrendingDown, Clock, Zap, Scale, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import { calculateStrategies, activateStrategy } from '@/api/functions';
import { formatCurrency } from '@/components/utils/formatters';

// Strategy comparison chart component
const StrategyComparisonChart = ({ strategies }) => {
    if (!strategies) return null;

    const snowballInterest = strategies.snowball?.total_interest || 0;
    const avalancheInterest = strategies.avalanche?.total_interest || 0;
    const proportionalInterest = strategies.proportional?.total_interest || 0;

    const maxInterest = Math.max(snowballInterest, avalancheInterest, proportionalInterest, 1);

    const snowballHeight = (snowballInterest / maxInterest) * 100;
    const avalancheHeight = (avalancheInterest / maxInterest) * 100;
    const proportionalHeight = (proportionalInterest / maxInterest) * 100;

    return (
        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2a]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vergelijking Rentekosten</h3>
            <div className="flex items-end justify-center gap-8 h-48">
                {/* Sneeuwbal */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {formatCurrency(snowballInterest)}
                    </span>
                    <div
                        className="w-16 bg-blue-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(snowballHeight, 10)}%` }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Sneeuwbal</span>
                </div>
                {/* Lawine */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {formatCurrency(avalancheInterest)}
                    </span>
                    <div
                        className="w-16 bg-purple-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(avalancheHeight, 10)}%` }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Lawine</span>
                </div>
                {/* Gelijkmatig */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {formatCurrency(proportionalInterest)}
                    </span>
                    <div
                        className="w-16 bg-emerald-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(proportionalHeight, 10)}%` }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Gelijkmatig</span>
                </div>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Lagere balk = minder rente betalen
            </p>
        </div>
    );
};

// New Strategy Card Component with expanded details
const NewStrategyCard = ({
    type,
    title,
    subtitle,
    icon,
    iconBg,
    borderColor,
    howItWorks,
    example,
    whyChoose,
    pros,
    cons,
    result,
    isSelected,
    onSelect,
    isLoading
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 transition-all duration-200 cursor-pointer
                ${isSelected
                    ? `${borderColor} ring-2 ring-offset-2 dark:ring-offset-[#0a0a0a] ring-emerald-500`
                    : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
                }`}
            onClick={() => onSelect(type)}
        >
            {/* Header */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                            {isSelected && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                    <Check className="w-3 h-3 mr-1" />
                                    Geselecteerd
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                    </div>
                </div>

                {/* Result summary */}
                {isLoading ? (
                    <div className="mt-4 flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : result && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                                <Clock className="w-3.5 h-3.5" />
                                Schuldenvrij
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {result.total_months} maanden
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Totale rente
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(result.total_interest)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Expandable Details */}
            <div className="border-t border-gray-100 dark:border-[#2a2a2a]">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    <span>Meer informatie</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4">
                        {/* How it works */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Hoe het werkt</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{howItWorks}</p>
                        </div>

                        {/* Example */}
                        <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Voorbeeld</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{example}</p>
                        </div>

                        {/* Why choose */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Waarom deze kiezen?</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{whyChoose}</p>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">Voordelen</h4>
                                <ul className="space-y-1">
                                    {pros.map((pro, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Nadelen</h4>
                                <ul className="space-y-1">
                                    {cons.map((con, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                            <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Payment order preview */}
                        {result?.schedule && result.schedule.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Aflosvolgorde</h4>
                                <ol className="space-y-1">
                                    {result.schedule.slice(0, 4).map((item, idx) => (
                                        <li key={item.debt_id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-[#2a2a2a] flex items-center justify-center text-xs font-medium">
                                                {idx + 1}
                                            </span>
                                            <span className="truncate">{item.debt_name}</span>
                                            <span className="text-gray-400 dark:text-gray-500 ml-auto">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </li>
                                    ))}
                                    {result.schedule.length > 4 && (
                                        <li className="text-sm text-gray-400 dark:text-gray-500 pl-7">
                                            + {result.schedule.length - 4} meer schulden
                                        </li>
                                    )}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function StrategyChoiceModal({ isOpen, onClose, monthlyBudget, onStrategyChosen }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [strategies, setStrategies] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStrategies(null);
            setIsLoading(false);
            setIsActivating(false);
            setSelectedStrategy(null);
        }
    }, [isOpen]);

    // Fetch strategies when modal opens
    const fetchStrategies = useCallback(async () => {
        if (!monthlyBudget || monthlyBudget <= 0) return;

        setIsLoading(true);
        try {
            const { data } = await calculateStrategies({ monthly_budget: monthlyBudget });
            setStrategies(data);
        } catch (error) {
            console.error('Error calculating strategies:', error);
            toast({
                title: 'Fout',
                description: 'Kon strategieën niet berekenen',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }, [monthlyBudget, toast]);

    useEffect(() => {
        if (isOpen && monthlyBudget > 0) {
            fetchStrategies();
        }
    }, [isOpen, monthlyBudget, fetchStrategies]);

    // Handle strategy selection
    const handleSelectStrategy = (strategyType) => {
        setSelectedStrategy(strategyType);
    };

    // Handle confirm/activate strategy
    const handleConfirmStrategy = async () => {
        if (!selectedStrategy) {
            toast({
                title: 'Selecteer een strategie',
                description: 'Kies eerst een aflosstrategie',
                variant: 'destructive'
            });
            return;
        }

        setIsActivating(true);
        try {
            const response = await activateStrategy({
                strategy_type: selectedStrategy,
                monthly_budget: monthlyBudget,
            });

            if (response?.data?.success) {
                toast({
                    title: 'Strategie geactiveerd!',
                    description: response.data.message || 'Je aflosstrategie is opgeslagen',
                });

                onClose();

                // Give database time to commit, then refresh
                setTimeout(() => {
                    if (onStrategyChosen) {
                        onStrategyChosen();
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }, 1500);
            } else {
                throw new Error(response?.data?.error || 'Kon strategie niet activeren');
            }
        } catch (error) {
            console.error('Error activating strategy:', error);
            toast({
                title: 'Fout',
                description: error.message || 'Kon strategie niet activeren',
                variant: 'destructive'
            });
        } finally {
            setIsActivating(false);
        }
    };

    // Strategy configurations
    const strategyConfigs = [
        {
            type: 'snowball',
            title: 'Sneeuwbal',
            subtitle: 'Begin klein, bouw momentum op',
            icon: <span className="text-2xl">❄️</span>,
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            borderColor: 'border-blue-500',
            howItWorks: 'Je begint met het afbetalen van je kleinste schuld terwijl je minimale betalingen doet op de rest. Zodra de kleinste schuld is afgelost, gebruik je dat vrijgekomen geld voor de volgende kleinste schuld.',
            example: 'Stel je hebt 3 schulden: €500, €2.000 en €5.000. Je richt je eerst volledig op de €500, dan de €2.000, en als laatste de €5.000.',
            whyChoose: 'Perfect voor mensen die motivatie nodig hebben. Het snel afbetalen van kleinere schulden geeft je een gevoel van vooruitgang en houdt je gemotiveerd.',
            pros: ['Snelle winsten voor motivatie', 'Minder schulden om bij te houden', 'Psychologisch bevredigend'],
            cons: ['Mogelijk meer rente betalen', 'Niet de snelste methode'],
        },
        {
            type: 'avalanche',
            title: 'Lawine',
            subtitle: 'Minimaliseer je totale kosten',
            icon: <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
            iconBg: 'bg-purple-100 dark:bg-purple-900/30',
            borderColor: 'border-purple-500',
            howItWorks: 'Je richt je eerst op de schuld met het hoogste rentepercentage, ongeacht het bedrag. Dit bespaart je het meeste geld op de lange termijn.',
            example: 'Als je een creditcard met 18% rente en een lening met 5% rente hebt, betaal je eerst de creditcard af, ook al is de lening misschien kleiner.',
            whyChoose: 'De mathematisch optimale strategie. Als je gedisciplineerd bent en wilt besparen op rentekosten, is dit de beste keuze.',
            pros: ['Laagste totale kosten', 'Snelst schuldenvrij', 'Financieel optimaal'],
            cons: ['Kan langer duren voor eerste afbetaling', 'Vereist meer discipline'],
        },
        {
            type: 'proportional',
            title: 'Gelijkmatige Verdeling',
            subtitle: 'Eerlijk verdelen over alle schulden',
            icon: <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            borderColor: 'border-emerald-500',
            howItWorks: 'Je verdeelt je beschikbare budget proportioneel over alle schulden op basis van hun omvang. Grotere schulden krijgen meer, kleinere krijgen minder.',
            example: 'Met €300 budget en schulden van €1.000 en €2.000 gaat €100 naar de kleinere en €200 naar de grotere schuld.',
            whyChoose: 'Ideaal als je goede relaties wilt behouden met alle schuldeisers en niemand wilt laten wachten.',
            pros: ['Eerlijk voor alle partijen', 'Voorkomt conflicten', 'Eenvoudig te begrijpen'],
            cons: ['Niet optimaal voor rente', 'Minder motiverende tussenwinsten'],
        },
    ];

    const getSelectedStrategyName = () => {
        const config = strategyConfigs.find(s => s.type === selectedStrategy);
        return config?.title || '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a]">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kies je Aflosstrategie
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        Selecteer de strategie die het beste bij jouw situatie past. Je maandelijks budget is {formatCurrency(monthlyBudget)}.
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                    {/* Strategy Cards */}
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                        {strategyConfigs.map((config) => (
                            <NewStrategyCard
                                key={config.type}
                                {...config}
                                result={strategies?.[config.type]}
                                isSelected={selectedStrategy === config.type}
                                onSelect={handleSelectStrategy}
                                isLoading={isLoading}
                            />
                        ))}
                    </div>

                    {/* Comparison Chart */}
                    {strategies && !isLoading && (
                        <StrategyComparisonChart strategies={strategies} />
                    )}
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {selectedStrategy ? (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {getSelectedStrategyName()} geselecteerd
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Klik op bevestigen om te starten
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Selecteer een strategie om verder te gaan
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-gray-200 dark:border-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            >
                                Annuleren
                            </Button>
                            <Button
                                onClick={handleConfirmStrategy}
                                disabled={!selectedStrategy || isActivating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isActivating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Bezig...
                                    </>
                                ) : (
                                    'Bevestigen'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
