import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Pot } from '@/api/entities';
import { formatCurrency } from '@/components/utils/formatters';
import { 
    PiggyBank, 
    TrendingUp, 
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BudgetOverviewCard({ userEmail, onPlanBudget, onRefresh }) {
    const [pots, setPots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    const loadBudgets = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔄 BudgetOverviewCard: Loading budgets...');
            const { User } = await import('@/api/entities');
            const user = await User.me();
            if (!user) return;
            const potsData = await Pot.filter({ user_id: user.id });
            console.log('📦 Loaded pots:', potsData.length, potsData);
            const expensePots = potsData.filter(p => p.pot_type === 'expense' && (p.budget || 0) > 0);
            console.log('💰 Expense pots with budget:', expensePots.length, expensePots);
            setPots(expensePots);
        } catch (error) {
            console.error('Error loading budgets:', error);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    // Expose loadBudgets to parent via onRefresh callback
    useEffect(() => {
        if (onRefresh) {
            console.log('🎯 BudgetOverviewCard: Setting refresh callback');
            onRefresh(loadBudgets);
        }
    }, [onRefresh, loadBudgets]);

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardContent className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
                </CardContent>
            </Card>
        );
    }

    if (pots.length === 0) {
        return null;
    }

    const totalBudget = pots.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const totalSpent = pots.reduce((sum, p) => sum + (parseFloat(p.spent) || 0), 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const getAdviceForPot = (pot) => {
        const budget = parseFloat(pot.budget) || 0;
        const spent = parseFloat(pot.spent) || 0;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;

        if (percentage >= 100) {
            return {
                icon: AlertTriangle,
                color: 'text-red-600',
                bg: 'bg-red-50',
                message: 'Budget op! Probeer te besparen.'
            };
        } else if (percentage >= 80) {
            return {
                icon: AlertTriangle,
                color: 'text-orange-600',
                bg: 'bg-orange-50',
                message: 'Bijna op, let op je uitgaven.'
            };
        } else if (percentage >= 50) {
            return {
                icon: TrendingUp,
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                message: 'Goed bezig, nog genoeg over.'
            };
        } else {
            return {
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50',
                message: 'Perfect! Ruim binnen budget.'
            };
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-blue-600" />
                        💰 Jouw Budget Overzicht
                        <Badge variant="outline" className="ml-2">
                            {formatCurrency(totalBudget)}
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPlanBudget();
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Aanpassen
                        </Button>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="space-y-6">
                {/* Totaal Overzicht */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm text-gray-600">Totaal Budget</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(totalBudget)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Nog Over</p>
                            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(totalRemaining)}
                            </p>
                        </div>
                    </div>
                    <Progress value={Math.min(overallProgress, 100)} className="h-3 mb-2" />
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Uitgegeven: {formatCurrency(totalSpent)}</span>
                        <span>{Math.round(overallProgress)}%</span>
                    </div>
                </div>

                {/* Per Categorie */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Per Categorie
                    </h3>
                    
                    {pots.map((pot) => {
                        const budget = parseFloat(pot.budget) || 0;
                        const spent = parseFloat(pot.spent) || 0;
                        const remaining = budget - spent;
                        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                        const advice = getAdviceForPot(pot);
                        const AdviceIcon = advice.icon;

                        return (
                            <motion.div
                                key={pot.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl border-2 ${
                                    percentage >= 100 ? 'border-red-200 bg-red-50' :
                                    percentage >= 80 ? 'border-orange-200 bg-orange-50' :
                                    'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{pot.icon || '💰'}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{pot.name}</p>
                                            <div className={`flex items-center gap-1 text-xs ${advice.color} mt-1`}>
                                                <AdviceIcon className="w-3 h-3" />
                                                <span>{advice.message}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-bold ${remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                            {formatCurrency(remaining)}
                                        </p>
                                        <p className="text-xs text-gray-500">over</p>
                                    </div>
                                </div>

                                <Progress 
                                    value={Math.min(percentage, 100)} 
                                    className={`h-2 mb-2 ${
                                        percentage >= 100 ? '[&>div]:bg-red-500' :
                                        percentage >= 80 ? '[&>div]:bg-orange-500' :
                                        '[&>div]:bg-green-500'
                                    }`}
                                />

                                <div className="flex justify-between items-center">
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-gray-600">
                                            Uitgegeven: <span className="font-medium text-gray-900">{formatCurrency(spent)}</span>
                                        </span>
                                        <span className="text-gray-400">van</span>
                                        <span className="text-gray-600">
                                            Budget: <span className="font-medium text-gray-900">{formatCurrency(budget)}</span>
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {Math.round(percentage)}%
                                    </Badge>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Tips sectie */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-purple-900 mb-1">💡 Budget Tip</p>
                            <p className="text-sm text-purple-800">
                                {totalRemaining > 0 
                                    ? `Super! Je hebt nog ${formatCurrency(totalRemaining)} over. Overweeg om dit als buffer te bewaren of te sparen voor een doel.`
                                    : totalRemaining === 0
                                    ? 'Perfect! Je hebt precies je budget gebruikt. Houd dit vol!'
                                    : `Let op: je zit ${formatCurrency(Math.abs(totalRemaining))} over budget. Probeer de komende dagen te besparen.`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
            )}
        </Card>
    );
}