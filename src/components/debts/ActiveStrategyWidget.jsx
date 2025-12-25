import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Snowflake, Edit, Info, Target, Forward, X, ChevronDown, ChevronUp, Calendar, TrendingDown } from 'lucide-react';
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
    const primaryColor = isSnowball ? 'blue' : 'purple';
    const primaryIcon = isSnowball ? '❄️' : '⚡';

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
        <Card className={`mb-6 border-2 border-${primaryColor}-500 bg-${primaryColor}-50/50`}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{primaryIcon}</span>
                        <span className="capitalize">{t('strategy.activePlanTitle')}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.href = createPageUrl('AflossingsOverzicht')}
                            className="bg-white hover:bg-gray-50"
                        >
                            <Calendar className="w-4 h-4 mr-2"/> Volledig overzicht
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowFullPlan(!showFullPlan)}
                            className={`text-${primaryColor}-700 hover:bg-${primaryColor}-100`}
                        >
                            {showFullPlan ? <ChevronUp className="w-4 h-4 mr-2"/> : <ChevronDown className="w-4 h-4 mr-2"/>}
                            {showFullPlan ? 'Minder' : 'Meer info'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onDeactivate} 
                            className={`text-${primaryColor}-700 hover:bg-${primaryColor}-100`}
                        >
                            <X className="w-4 h-4 mr-2"/> Wijzig
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Quick stats */}
                <div className={`flex flex-wrap justify-between items-center gap-4 text-sm bg-white p-3 rounded-lg border border-${primaryColor}-200`}>
                    <div>
                        <p className="text-muted-foreground">{t('strategy.strategy')}</p>
                        <p className="font-bold capitalize">{t(`strategy.${strategy.strategy_type}.title`)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">{t('strategy.monthlyBudget')}</p>
                        <p className="font-bold">{formatCurrency(strategy.monthly_budget)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">{t('strategy.debtFree')}</p>
                        <p className="font-bold">{format(debtFreeDate, 'MMM yyyy', { locale: nl })}</p>
                    </div>
                </div>

                {/* Current focus */}
                {currentFocusDebt ? (
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                           <Target className={`w-5 h-5 text-${primaryColor}-600`}/>
                           <h4 className="font-semibold text-lg">{t('strategy.currentFocus')}: {currentFocusDebt.creditor_name}</h4>
                        </div>
                       
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span>{formatCurrency(currentFocusDebt.amount_paid)}</span>
                            <span>{formatCurrency(currentFocusDebt.amount)}</span>
                        </div>
                        <Progress value={progress} className="h-2" indicatorClassName={`bg-${primaryColor}-500`}/>
                    </div>
                ) : (
                    <div className="bg-white p-4 rounded-lg border text-center">
                        <h4 className="font-semibold text-lg text-green-600">🎉 Alle schulden in dit plan zijn afgelost!</h4>
                    </div>
                )}
                
                {nextDebts.length > 0 && (
                     <div className="text-sm flex items-center gap-2 text-muted-foreground">
                        <Forward className="w-4 h-4"/>
                        <span>{t('strategy.nextUp')}: <strong>{nextDebts.join(', ')}</strong></span>
                    </div>
                )}

                {/* EXPANDED VIEW */}
                {showFullPlan && (
                    <div className="mt-6 space-y-4 border-t pt-4">
                        {/* Overall progress */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-green-600"/>
                                Totale voortgang
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Al betaald</span>
                                    <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Nog te gaan</span>
                                    <span className="font-bold text-orange-600">{formatCurrency(totalDebt)}</span>
                                </div>
                                <Progress value={overallProgress} className="h-3" />
                                <p className="text-xs text-center text-gray-600 mt-1">
                                    {overallProgress.toFixed(1)}% voltooid
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600"/>
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
                                            className={`p-3 rounded-lg border-2 ${
                                                isCurrent ? `border-${primaryColor}-500 bg-${primaryColor}-50` : 
                                                isCompleted ? 'border-green-300 bg-green-50' : 
                                                'border-gray-200 bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                                                        isCurrent ? `bg-${primaryColor}-600 text-white` :
                                                        isCompleted ? 'bg-green-600 text-white' :
                                                        'bg-gray-300 text-gray-600'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold">{debt.creditor_name}</p>
                                                        <p className="text-xs text-gray-600">
                                                            {formatCurrency(debt.amount_paid)} / {formatCurrency(debt.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isCompleted && (
                                                    <span className="text-green-600 font-semibold text-sm">✓ Afgelost</span>
                                                )}
                                                {isCurrent && (
                                                    <span className={`text-${primaryColor}-600 font-semibold text-sm`}>← Nu bezig</span>
                                                )}
                                            </div>
                                            <Progress value={debtProgress} className="h-2 mb-1" />
                                            <p className="text-xs text-gray-500">
                                                Verwacht afgelost: {format(new Date(item.estimated_payoff_date), 'MMMM yyyy', { locale: nl })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Key Stats */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-semibold mb-3">📊 Belangrijke cijfers</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-600">Totale rente</p>
                                    <p className="font-bold text-red-600">{formatCurrency(strategy.total_interest)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Totale duur</p>
                                    <p className="font-bold">{strategy.total_months} maanden</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Aantal schulden</p>
                                    <p className="font-bold">{schedule.length}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Maand budget</p>
                                    <p className="font-bold text-blue-600">{formatCurrency(strategy.monthly_budget)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}