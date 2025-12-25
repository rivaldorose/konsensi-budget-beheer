
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingDown, Target, Award, DollarSign, Clock, ArrowLeft, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { User } from '@/api/entities';
import { Debt } from '@/api/entities';
import { DebtStrategy } from '@/api/entities';
import { DebtPayoffSchedule } from '@/api/entities';
import { useTranslation } from '@/components/utils/LanguageContext';
import { formatCurrency } from '@/components/utils/formatters';
import { format, addMonths, differenceInMonths, startOfMonth } from 'date-fns';
import { nl } from 'date-fns/locale';
import { createPageUrl } from '@/utils';

export default function AflossingsOverzicht() {
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // Added refreshKey state
    const [strategy, setStrategy] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [debts, setDebts] = useState([]);
    const { t } = useTranslation();

    const loadData = async () => { // loadData function defined here
        try {
            const user = await User.me();
            const [activeStrategyData, allSchedules, debtsData] = await Promise.all([
                DebtStrategy.filter({ created_by: user.email, is_active: true }, "-created_date", 1),
                DebtPayoffSchedule.filter({ created_by: user.email }),
                Debt.filter({ created_by: user.email })
            ]);

            if (activeStrategyData.length > 0) {
                const strat = activeStrategyData[0];
                setStrategy(strat);
                const stratSchedule = allSchedules
                    .filter(item => item.strategy_id === strat.id)
                    .sort((a, b) => a.payment_order - b.payment_order);
                setSchedule(stratSchedule);
            }
            setDebts(debtsData);
        } catch (error) {
            console.error("Error loading payoff plan:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]); // useEffect now depends on refreshKey

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!strategy || schedule.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Geen actief aflosplan</h2>
                    <p className="text-gray-600 mb-6">Je hebt nog geen aflossingsstrategie gekozen</p>
                    <Button onClick={() => window.location.href = createPageUrl('Debts')}>
                        Naar schulden pagina
                    </Button>
                </div>
            </div>
        );
    }

    const isSnowball = strategy.strategy_type === 'snowball';
    const primaryColor = isSnowball ? 'blue' : 'purple';
    const primaryIcon = isSnowball ? '❄️' : '⚡';

    // Calculate progress
    const totalDebt = schedule.reduce((sum, item) => {
        const debt = debts.find(d => d.id === item.debt_id);
        return sum + (debt ? (debt.amount - debt.amount_paid) : 0);
    }, 0);

    const totalPaid = schedule.reduce((sum, item) => {
        const debt = debts.find(d => d.id === item.debt_id);
        return sum + (debt?.amount_paid || 0);
    }, 0);

    const overallProgress = totalDebt > 0 ? (totalPaid / (totalDebt + totalPaid)) * 100 : 0;

    // Find current focus
    let currentFocusDebt = null;
    for (const scheduleItem of schedule) {
        const debt = debts.find(d => d.id === scheduleItem.debt_id);
        if (debt && debt.status !== 'afbetaald') {
            currentFocusDebt = debt;
            break;
        }
    }

    const monthsRemaining = currentFocusDebt 
        ? differenceInMonths(new Date(strategy.debt_free_date), new Date())
        : 0;

    // Generate month-by-month timeline
    const generateTimeline = () => {
        const timeline = [];
        const startDate = startOfMonth(new Date());
        
        for (let i = 0; i < Math.min(strategy.total_months, 24); i++) {
            const monthDate = addMonths(startDate, i);
            const monthKey = format(monthDate, 'yyyy-MM');
            
            // Find which debt(s) are being paid this month
            const activeDebts = schedule.filter(item => {
                const debt = debts.find(d => d.id === item.debt_id);
                if (!debt) return false;
                const payoffDate = new Date(item.estimated_payoff_date);
                return monthDate <= payoffDate && debt.status !== 'afbetaald';
            });

            timeline.push({
                month: monthDate,
                monthLabel: format(monthDate, 'MMM yyyy', { locale: nl }),
                payment: strategy.monthly_budget,
                activeDebts: activeDebts.map(item => {
                    const debt = debts.find(d => d.id === item.debt_id);
                    return debt ? debt.creditor_name : 'Onbekend';
                })
            });
        }
        
        return timeline;
    };

    const timeline = generateTimeline();

    // Milestones
    const completedDebts = debts.filter(d => d.status === 'afbetaald').length;
    const totalDebtsInPlan = schedule.length;
    const milestones = [
        { label: 'Eerste schuld afgelost', reached: completedDebts >= 1, icon: '🎯' },
        { label: 'Halverwege!', reached: completedDebts >= Math.floor(totalDebtsInPlan / 2), icon: '🔥' },
        { label: 'Laatste loodjes', reached: completedDebts >= totalDebtsInPlan - 1, icon: '🏁' },
        { label: 'Schuldenvrij!', reached: completedDebts === totalDebtsInPlan, icon: '🎉' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => window.location.href = createPageUrl('Debts')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <span className="text-4xl">{primaryIcon}</span>
                                Mijn Aflosplan
                            </h1>
                            <p className="text-gray-600 capitalize">
                                {t(`strategy.${strategy.strategy_type}.title`)} methode
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Maandelijks budget</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(strategy.monthly_budget)}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Schuldenvrij op</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {format(new Date(strategy.debt_free_date), 'MMM yyyy', { locale: nl })}
                                    </p>
                                </div>
                                <Calendar className="w-8 h-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Nog te gaan</p>
                                    <p className="text-2xl font-bold text-gray-900">{monthsRemaining} mnd</p>
                                </div>
                                <Clock className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Totale rente</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(strategy.total_interest)}</p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overall Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-6 h-6 text-green-600" />
                            Totale Voortgang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Al betaald</span>
                                <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                            </div>
                            <Progress value={overallProgress} className="h-4" />
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Nog te gaan</span>
                                <span className="font-bold text-orange-600">{formatCurrency(totalDebt)}</span>
                            </div>
                            <p className="text-center text-2xl font-bold text-gray-900">
                                {overallProgress.toFixed(1)}% voltooid
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Focus */}
                {currentFocusDebt && (
                    <Card className={`border-2 border-${primaryColor}-500 bg-${primaryColor}-50/50`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className={`w-6 h-6 text-${primaryColor}-600`} />
                                Huidige Focus: {currentFocusDebt.creditor_name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{formatCurrency(currentFocusDebt.amount_paid)}</span>
                                    <span>{formatCurrency(currentFocusDebt.amount)}</span>
                                </div>
                                <Progress 
                                    value={((currentFocusDebt.amount_paid || 0) / (currentFocusDebt.amount || 1)) * 100} 
                                    className="h-3"
                                    indicatorClassName={`bg-${primaryColor}-500`}
                                />
                                <p className="text-sm text-center text-gray-600">
                                    Nog {formatCurrency((currentFocusDebt.amount || 0) - (currentFocusDebt.amount_paid || 0))} te gaan
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Milestones */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-6 h-6 text-yellow-500" />
                            Mijlpalen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {milestones.map((milestone, index) => (
                                <div 
                                    key={index}
                                    className={`p-4 rounded-lg border-2 text-center ${
                                        milestone.reached 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">{milestone.icon}</div>
                                    <p className={`text-sm font-medium ${
                                        milestone.reached ? 'text-green-800' : 'text-gray-600'
                                    }`}>
                                        {milestone.label}
                                    </p>
                                    {milestone.reached && (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            Maand-voor-Maand Tijdlijn (eerste 24 maanden)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {timeline.map((item, index) => (
                                <div 
                                    key={index}
                                    className={`p-3 rounded-lg flex items-center justify-between ${
                                        index === 0 
                                            ? 'bg-blue-50 border-2 border-blue-500' 
                                            : 'bg-gray-50 border border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold ${
                                            index === 0 ? 'text-blue-600' : 'text-gray-400'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.monthLabel}</p>
                                            <p className="text-xs text-gray-600">
                                                {item.activeDebts.length > 0 
                                                    ? item.activeDebts.join(', ')
                                                    : 'Geen actieve schulden'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{formatCurrency(item.payment)}</p>
                                        <p className="text-xs text-gray-500">betaling</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Schulden overzicht */}
                <Card>
                    <CardHeader>
                        <CardTitle>Volledige Aflos-volgorde</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                        className={`p-4 rounded-lg border-2 ${
                                            isCurrent ? `border-${primaryColor}-500 bg-${primaryColor}-50` : 
                                            isCompleted ? 'border-green-500 bg-green-50' : 
                                            'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                                    isCurrent ? `bg-${primaryColor}-600 text-white` :
                                                    isCompleted ? 'bg-green-600 text-white' :
                                                    'bg-gray-300 text-gray-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-lg">{debt.creditor_name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatCurrency(debt.amount_paid)} / {formatCurrency(debt.amount)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {isCompleted && (
                                                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm">
                                                        <CheckCircle2 className="w-4 h-4" /> Afgelost
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className={`text-${primaryColor}-600 font-semibold text-sm`}>
                                                        ← Huidige focus
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Progress value={debtProgress} className="h-2 mb-2" />
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{debtProgress.toFixed(1)}% voltooid</span>
                                            <span>Verwacht: {format(new Date(item.estimated_payoff_date), 'MMMM yyyy', { locale: nl })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
