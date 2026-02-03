import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Forward, X, ChevronDown, ChevronUp, Calendar, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { formatCurrency } from '@/components/utils/formatters';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

export default function ActiveStrategyWidget({ strategy, schedule, debts, onDeactivate }) {
    const { t } = useTranslation();
    const [showFullPlan, setShowFullPlan] = useState(false);

    if (!strategy || !schedule || schedule.length === 0) {
        return null;
    }

    let currentFocusDebt = null;
    for (const scheduleItem of schedule) {
        const debt = debts.find(d => d.id === scheduleItem.debt_id);
        if (debt && debt.status !== 'afbetaald') {
            currentFocusDebt = debt;
            break;
        }
    }

    const getNextDebts = () => {
        if (!currentFocusDebt) return [];
        const currentOrder = schedule.find(s => s.debt_id === currentFocusDebt.id)?.payment_order;
        if (currentOrder === undefined) return [];
        return schedule
            .filter(s => s.payment_order > currentOrder)
            .slice(0, 2)
            .map(s => debts.find(d => d.id === s.debt_id)?.creditor_name)
            .filter(Boolean);
    };

    const nextDebts = getNextDebts();

    const progress = currentFocusDebt ? ((currentFocusDebt.amount_paid || 0) / (currentFocusDebt.amount || 1)) * 100 : 100;
    const debtFreeDate = new Date(strategy.debt_free_date);

    const isSnowball = strategy.strategy_type === 'snowball';
    const isAvalanche = strategy.strategy_type === 'avalanche';
    const primaryIcon = isSnowball ? '❄️' : isAvalanche ? '⚡' : '⚖️';

    // Calculate totals
    const totalDebt = schedule.reduce((sum, item) => {
        const debt = debts.find(d => d.id === item.debt_id);
        return sum + (debt ? (debt.amount - debt.amount_paid) : 0);
    }, 0);

    const totalPaid = schedule.reduce((sum, item) => {
        const debt = debts.find(d => d.id === item.debt_id);
        return sum + (debt?.amount_paid || 0);
    }, 0);

    const overallProgress = totalDebt > 0 ? (totalPaid / (totalDebt + totalPaid)) * 100 : 0;

    return (
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{primaryIcon}</span>
                        <h3 className="text-lg font-bold text-text-main dark:text-text-primary capitalize">{t('strategy.activePlanTitle')}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.href = createPageUrl('AflossingsOverzicht')}
                            className="bg-white dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-border-accent text-xs"
                        >
                            <Calendar className="w-4 h-4 mr-1.5"/> Volledig overzicht
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowFullPlan(!showFullPlan)}
                            className="text-primary dark:text-primary-green hover:bg-primary/10 dark:hover:bg-primary-green/10 text-xs"
                        >
                            {showFullPlan ? <ChevronUp className="w-4 h-4 mr-1.5"/> : <ChevronDown className="w-4 h-4 mr-1.5"/>}
                            {showFullPlan ? 'Minder' : 'Meer info'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDeactivate}
                            className="text-text-muted dark:text-text-tertiary hover:bg-gray-100 dark:hover:bg-dark-card-elevated text-xs"
                        >
                            <X className="w-4 h-4 mr-1.5"/> Wijzig
                        </Button>
                    </div>
                </div>
            </div>

            <div className="px-6 pb-6 space-y-4">
                {/* Quick stats */}
                <div className="flex flex-wrap justify-between items-center gap-4 text-sm bg-gray-50 dark:bg-dark-card-elevated p-3 rounded-xl border border-gray-100 dark:border-dark-border-accent">
                    <div>
                        <p className="text-text-muted dark:text-text-tertiary text-xs">Strategie</p>
                        <p className="font-bold text-text-main dark:text-text-primary capitalize">{t(`strategy.${strategy.strategy_type}.title`)}</p>
                    </div>
                    <div>
                        <p className="text-text-muted dark:text-text-tertiary text-xs">{t('strategy.monthlyBudget')}</p>
                        <p className="font-bold text-primary dark:text-primary-green">{formatCurrency(strategy.monthly_budget)}</p>
                    </div>
                    <div>
                        <p className="text-text-muted dark:text-text-tertiary text-xs">{t('strategy.debtFree')}</p>
                        <p className="font-bold text-text-main dark:text-text-primary">{format(debtFreeDate, 'MMM yyyy', { locale: nl })}</p>
                    </div>
                </div>

                {/* Current focus */}
                {currentFocusDebt ? (
                    <div className="bg-gray-50 dark:bg-dark-card-elevated p-4 rounded-xl border border-gray-100 dark:border-dark-border-accent">
                        <div className="flex items-center gap-2 mb-2">
                           <Target className="w-5 h-5 text-primary dark:text-primary-green"/>
                           <h4 className="font-semibold text-lg text-text-main dark:text-text-primary">{t('strategy.currentFocus')}: {currentFocusDebt.creditor_name}</h4>
                        </div>

                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="text-text-muted dark:text-text-secondary">{formatCurrency(currentFocusDebt.amount_paid)}</span>
                            <span className="text-text-main dark:text-text-primary">{formatCurrency(currentFocusDebt.amount)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                ) : (
                    <div className="bg-primary/5 dark:bg-primary-green/10 p-4 rounded-xl border border-primary/20 dark:border-primary-green/20 text-center">
                        <h4 className="font-semibold text-lg text-primary dark:text-primary-green">Alle schulden in dit plan zijn afgelost!</h4>
                    </div>
                )}

                {nextDebts.length > 0 && (
                     <div className="text-sm flex items-center gap-2 text-text-muted dark:text-text-secondary">
                        <Forward className="w-4 h-4"/>
                        <span>{t('strategy.nextUp')}: <strong className="text-text-main dark:text-text-primary">{nextDebts.join(', ')}</strong></span>
                    </div>
                )}

                {/* EXPANDED VIEW */}
                {showFullPlan && (
                    <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-dark-border pt-4">
                        {/* Overall progress */}
                        <div className="bg-gray-50 dark:bg-dark-card-elevated p-4 rounded-xl border border-gray-100 dark:border-dark-border-accent">
                            <h3 className="font-semibold mb-3 flex items-center gap-2 text-text-main dark:text-text-primary">
                                <TrendingDown className="w-5 h-5 text-primary dark:text-primary-green"/>
                                Totale voortgang
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted dark:text-text-secondary">Al betaald</span>
                                    <span className="font-bold text-primary dark:text-primary-green">{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted dark:text-text-secondary">Nog te gaan</span>
                                    <span className="font-bold text-status-orange dark:text-accent-orange">{formatCurrency(totalDebt)}</span>
                                </div>
                                <Progress value={overallProgress} className="h-3" />
                                <p className="text-xs text-center text-text-muted dark:text-text-tertiary mt-1">
                                    {overallProgress.toFixed(1)}% voltooid
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-gray-50 dark:bg-dark-card-elevated p-4 rounded-xl border border-gray-100 dark:border-dark-border-accent">
                            <h3 className="font-semibold mb-3 flex items-center gap-2 text-text-main dark:text-text-primary">
                                <Calendar className="w-5 h-5 text-status-blue dark:text-accent-blue"/>
                                Jouw aflos-volgorde
                            </h3>
                            <div className="space-y-3">
                                {schedule.map((item, index) => {
                                    const debt = debts.find(d => d.id === item.debt_id);
                                    if (!debt) return null;

                                    const isCompleted = debt.status === 'afbetaald';
                                    const isCurrent = debt.id === currentFocusDebt?.id;
                                    const debtProgress = ((debt.amount_paid || 0) / (debt.amount || 1)) * 100;

                                    return (
                                        <div
                                            key={item.debt_id}
                                            className={`p-3 rounded-xl border-2 ${
                                                isCurrent ? 'border-primary/30 dark:border-primary-green/30 bg-primary/5 dark:bg-primary-green/5' :
                                                isCompleted ? 'border-primary/20 dark:border-primary-green/20 bg-primary/5 dark:bg-primary-green/5' :
                                                'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                                                        isCurrent ? 'bg-primary dark:bg-primary-green text-white dark:text-dark-bg' :
                                                        isCompleted ? 'bg-primary dark:bg-primary-green text-white dark:text-dark-bg' :
                                                        'bg-gray-200 dark:bg-dark-card-elevated text-text-muted dark:text-text-tertiary'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-text-main dark:text-text-primary">{debt.creditor_name}</p>
                                                        <p className="text-xs text-text-muted dark:text-text-tertiary">
                                                            {formatCurrency(debt.amount_paid)} / {formatCurrency(debt.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isCompleted && (
                                                    <span className="text-primary dark:text-primary-green font-semibold text-sm">Afgelost</span>
                                                )}
                                                {isCurrent && (
                                                    <span className="text-primary dark:text-primary-green font-semibold text-sm">Nu bezig</span>
                                                )}
                                            </div>
                                            <Progress value={debtProgress} className="h-2 mb-1" />
                                            <p className="text-xs text-text-muted dark:text-text-tertiary">
                                                Verwacht afgelost: {format(new Date(item.estimated_payoff_date), 'MMMM yyyy', { locale: nl })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Key Stats */}
                        <div className="bg-gray-50 dark:bg-dark-card-elevated p-4 rounded-xl border border-gray-100 dark:border-dark-border-accent">
                            <h3 className="font-semibold mb-3 text-text-main dark:text-text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined !text-[18px] text-primary dark:text-primary-green">analytics</span>
                                Belangrijke cijfers
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-text-muted dark:text-text-tertiary">Totale rente</p>
                                    <p className="font-bold text-status-red dark:text-accent-red">{formatCurrency(strategy.total_interest)}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-text-tertiary">Totale duur</p>
                                    <p className="font-bold text-text-main dark:text-text-primary">{strategy.total_months} maanden</p>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-text-tertiary">Aantal schulden</p>
                                    <p className="font-bold text-text-main dark:text-text-primary">{schedule.length}</p>
                                </div>
                                <div>
                                    <p className="text-text-muted dark:text-text-tertiary">Maand budget</p>
                                    <p className="font-bold text-primary dark:text-primary-green">{formatCurrency(strategy.monthly_budget)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
