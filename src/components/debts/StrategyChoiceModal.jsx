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
        <div className="bg-gray-50 dark:bg-dark-card-elevated rounded-2xl p-6 border border-gray-200 dark:border-dark-border-accent">
            <h3 className="text-lg font-semibold text-text-main dark:text-text-primary mb-4">Vergelijking Rentekosten</h3>
            <div className="flex items-end justify-center gap-8 h-48">
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-text-muted dark:text-text-secondary mb-2">
                        {formatCurrency(snowballInterest)}
                    </span>
                    <div
                        className="w-16 bg-status-blue dark:bg-accent-blue rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(snowballHeight, 10)}%` }}
                    />
                    <span className="text-xs text-text-muted dark:text-text-tertiary mt-2">Sneeuwbal</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-text-muted dark:text-text-secondary mb-2">
                        {formatCurrency(avalancheInterest)}
                    </span>
                    <div
                        className="w-16 bg-status-purple dark:bg-accent-purple rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(avalancheHeight, 10)}%` }}
                    />
                    <span className="text-xs text-text-muted dark:text-text-tertiary mt-2">Lawine</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-medium text-text-muted dark:text-text-secondary mb-2">
                        {formatCurrency(proportionalInterest)}
                    </span>
                    <div
                        className="w-16 bg-primary dark:bg-primary-green rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(proportionalHeight, 10)}%` }}
                    />
                    <span className="text-xs text-text-muted dark:text-text-tertiary mt-2">Gelijkmatig</span>
                </div>
            </div>
            <p className="text-center text-sm text-text-muted dark:text-text-tertiary mt-4">
                Lagere balk = minder rente betalen
            </p>
        </div>
    );
};

const NewStrategyCard = ({
    type,
    title,
    subtitle,
    icon,
    iconBg,
    borderColor,
    borderColorDark,
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
            className={`bg-white dark:bg-dark-card rounded-2xl border-2 transition-all duration-200 cursor-pointer
                ${isSelected
                    ? `${borderColor} ${borderColorDark} ring-2 ring-offset-2 dark:ring-offset-dark-bg ring-primary dark:ring-primary-green`
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-accent'
                }`}
            onClick={() => onSelect(type)}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-text-main dark:text-text-primary">{title}</h3>
                            {isSelected && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 dark:bg-primary-green/15 text-primary dark:text-primary-green">
                                    <Check className="w-3 h-3 mr-1" />
                                    Geselecteerd
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-muted dark:text-text-secondary mt-0.5">{subtitle}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="mt-4 flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-text-muted dark:text-text-tertiary" />
                    </div>
                ) : result && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-dark-card-elevated rounded-xl p-3">
                            <div className="flex items-center gap-2 text-text-muted dark:text-text-tertiary text-xs mb-1">
                                <Clock className="w-3.5 h-3.5" />
                                Schuldenvrij
                            </div>
                            <p className="text-sm font-semibold text-text-main dark:text-text-primary">
                                {result.total_months} maanden
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-dark-card-elevated rounded-xl p-3">
                            <div className="flex items-center gap-2 text-text-muted dark:text-text-tertiary text-xs mb-1">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Totale rente
                            </div>
                            <p className="text-sm font-semibold text-text-main dark:text-text-primary">
                                {formatCurrency(result.total_interest)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 dark:border-dark-border">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary transition-colors"
                >
                    <span>Meer informatie</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                    <div className="px-5 pb-5 space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-text-main dark:text-text-primary mb-2">Hoe het werkt</h4>
                            <p className="text-sm text-text-muted dark:text-text-secondary">{howItWorks}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-dark-card-elevated rounded-xl p-4">
                            <h4 className="text-sm font-medium text-text-main dark:text-text-primary mb-2">Voorbeeld</h4>
                            <p className="text-sm text-text-muted dark:text-text-secondary">{example}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-text-main dark:text-text-primary mb-2">Waarom deze kiezen?</h4>
                            <p className="text-sm text-text-muted dark:text-text-secondary">{whyChoose}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-primary dark:text-primary-green mb-2">Voordelen</h4>
                                <ul className="space-y-1">
                                    {pros.map((pro, idx) => (
                                        <li key={idx} className="text-sm text-text-muted dark:text-text-secondary flex items-start gap-2">
                                            <Check className="w-4 h-4 text-primary dark:text-primary-green flex-shrink-0 mt-0.5" />
                                            {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-status-red dark:text-accent-red mb-2">Nadelen</h4>
                                <ul className="space-y-1">
                                    {cons.map((con, idx) => (
                                        <li key={idx} className="text-sm text-text-muted dark:text-text-secondary flex items-start gap-2">
                                            <X className="w-4 h-4 text-status-red dark:text-accent-red flex-shrink-0 mt-0.5" />
                                            {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {result?.schedule && result.schedule.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-text-main dark:text-text-primary mb-2">Aflosvolgorde</h4>
                                <ol className="space-y-1">
                                    {result.schedule.slice(0, 4).map((item, idx) => (
                                        <li key={item.debt_id} className="text-sm text-text-muted dark:text-text-secondary flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-dark-card-elevated flex items-center justify-center text-xs font-medium text-text-main dark:text-text-primary">
                                                {idx + 1}
                                            </span>
                                            <span className="truncate">{item.debt_name}</span>
                                            <span className="text-text-muted dark:text-text-tertiary ml-auto">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </li>
                                    ))}
                                    {result.schedule.length > 4 && (
                                        <li className="text-sm text-text-muted dark:text-text-tertiary pl-7">
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

    useEffect(() => {
        if (!isOpen) {
            setStrategies(null);
            setIsLoading(false);
            setIsActivating(false);
            setSelectedStrategy(null);
        }
    }, [isOpen]);

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

    const handleSelectStrategy = (strategyType) => {
        setSelectedStrategy(strategyType);
    };

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

    const strategyConfigs = [
        {
            type: 'snowball',
            title: 'Sneeuwbal',
            subtitle: 'Begin klein, bouw momentum op',
            icon: <span className="text-2xl">❄️</span>,
            iconBg: 'bg-blue-100 dark:bg-accent-blue/15',
            borderColor: 'border-status-blue',
            borderColorDark: 'dark:border-accent-blue',
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
            icon: <Zap className="w-6 h-6 text-status-purple dark:text-accent-purple" />,
            iconBg: 'bg-purple-100 dark:bg-accent-purple/15',
            borderColor: 'border-status-purple',
            borderColorDark: 'dark:border-accent-purple',
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
            icon: <Scale className="w-6 h-6 text-primary dark:text-primary-green" />,
            iconBg: 'bg-emerald-100 dark:bg-primary-green/15',
            borderColor: 'border-primary',
            borderColorDark: 'dark:border-primary-green',
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
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white dark:bg-dark-bg border-gray-200 dark:border-dark-border">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-dark-border">
                    <DialogTitle className="text-2xl font-bold text-text-main dark:text-text-primary">
                        Kies je Aflosstrategie
                    </DialogTitle>
                    <DialogDescription className="text-text-muted dark:text-text-secondary">
                        Selecteer de strategie die het beste bij jouw situatie past.
                        {monthlyBudget > 0 && (
                            <span className="block mt-1 text-primary dark:text-primary-green font-semibold">
                                Je beschikbaar budget (VTLB) is {formatCurrency(monthlyBudget)} per maand.
                            </span>
                        )}
                        {(!monthlyBudget || monthlyBudget <= 0) && (
                            <span className="block mt-1 text-status-orange dark:text-accent-orange font-semibold">
                                Vul eerst je VTLB-berekening in om je afloscapaciteit te bepalen.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                    {(!monthlyBudget || monthlyBudget <= 0) ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-5xl text-text-muted dark:text-text-tertiary mb-4 block">calculate</span>
                            <h3 className="text-lg font-semibold text-text-main dark:text-text-primary mb-2">Geen budget beschikbaar</h3>
                            <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
                                Ga naar de VTLB-calculator om je afloscapaciteit te berekenen.
                            </p>
                            <Button
                                onClick={() => window.location.href = '/vtlb-calculator'}
                                className="bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold"
                            >
                                VTLB Berekenen
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
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

                            {strategies && !isLoading && (
                                <StrategyComparisonChart strategies={strategies} />
                            )}
                        </>
                    )}
                </div>

                {monthlyBudget > 0 && (
                    <div className="border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-card p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {selectedStrategy ? (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary-green/15 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-primary dark:text-primary-green" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-main dark:text-text-primary">
                                                {getSelectedStrategyName()} geselecteerd
                                            </p>
                                            <p className="text-xs text-text-muted dark:text-text-tertiary">
                                                Klik op bevestigen om te starten
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-text-muted dark:text-text-secondary">
                                        Selecteer een strategie om verder te gaan
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-gray-200 dark:border-dark-border text-text-main dark:text-text-primary hover:bg-gray-100 dark:hover:bg-dark-card-elevated"
                                >
                                    Annuleren
                                </Button>
                                <Button
                                    onClick={handleConfirmStrategy}
                                    disabled={!selectedStrategy || isActivating}
                                    className="bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                )}
            </DialogContent>
        </Dialog>
    );
}
