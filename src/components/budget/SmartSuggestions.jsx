import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyCost } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Pot } from "@/api/entities";
import { Debt } from "@/api/entities";
import { formatCurrency } from "@/components/utils/formatters";
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';

export default function SmartSuggestions({ userEmail, totalIncome }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userEmail) {
            generateSuggestions();
        }
    }, [userEmail, totalIncome]);

    const generateSuggestions = async () => {
        if (!userEmail) return;
        
        try {
            setLoading(true);

            const { User } = await import('@/api/entities');
            const user = await User.me();
            if (!user) return;
            const [costs, transactions, pots, debts] = await Promise.all([
                MonthlyCost.filter({ user_id: user.id, status: 'actief' }),
                Transaction.filter({ user_id: user.id }),
                Pot.filter({ user_id: user.id }),
                Debt.filter({ user_id: user.id })
            ]);

            const tips = [];

            // 1. Analyseer abonnementen en streaming diensten
            const subscriptions = costs.filter(c => 
                c.category === 'abonnementen' || 
                c.category === 'streaming_diensten'
            );
            
            if (subscriptions.length > 0) {
                const totalSubscriptions = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
                const subscriptionNames = subscriptions.map(s => s.name).join(', ');
                
                if (subscriptions.length >= 3) {
                    tips.push({
                        type: 'warning',
                        color: 'yellow',
                        title: 'Veel abonnementen',
                        message: `Je hebt ${subscriptions.length} abonnementen (${subscriptionNames}) voor totaal ${formatCurrency(totalSubscriptions)}/maand. Gebruik je ze allemaal actief?`
                    });
                }
                
                // Check voor dubbele streaming diensten
                const streamingServices = subscriptions.filter(s => 
                    s.name?.toLowerCase().includes('netflix') ||
                    s.name?.toLowerCase().includes('disney') ||
                    s.name?.toLowerCase().includes('videoland') ||
                    s.name?.toLowerCase().includes('hbo') ||
                    s.name?.toLowerCase().includes('prime') ||
                    s.name?.toLowerCase().includes('viaplay')
                );
                
                if (streamingServices.length >= 2) {
                    tips.push({
                        type: 'info',
                        color: 'blue',
                        title: 'Meerdere streamingdiensten',
                        message: `Je hebt ${streamingServices.length} streamingdiensten. Overweeg om er eentje per maand te wisselen in plaats van allemaal tegelijk.`
                    });
                }
            }

            // 2. Analyseer weekend vs doordeweeks uitgaven
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            
            const recentTransactions = transactions.filter(tx => {
                if (!tx || !tx.date) return false;
                const txDate = new Date(tx.date);
                return tx.type === 'expense' && txDate >= thirtyDaysAgo;
            });

            if (recentTransactions.length > 0) {
                let weekendTotal = 0;
                let weekdayTotal = 0;
                let weekendCount = 0;
                let weekdayCount = 0;

                recentTransactions.forEach(tx => {
                    const txDate = new Date(tx.date);
                    const dayOfWeek = txDate.getDay();
                    const amount = parseFloat(tx.amount) || 0;
                    
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        weekendTotal += amount;
                        weekendCount++;
                    } else {
                        weekdayTotal += amount;
                        weekdayCount++;
                    }
                });

                const avgWeekend = weekendCount > 0 ? weekendTotal / weekendCount : 0;
                const avgWeekday = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;

                if (avgWeekend > avgWeekday * 1.5 && weekendTotal > 50) {
                    tips.push({
                        type: 'info',
                        color: 'blue',
                        title: 'Weekend uitgaven',
                        message: `Je geeft gemiddeld ${formatCurrency(avgWeekend - avgWeekday)} meer uit per transactie in het weekend. Probeer grote boodschappen doordeweeks te doen.`
                    });
                }
            }

            // 3. Analyseer categorie uitgaven vs budget
            const expensePots = pots.filter(p => p.pot_type === 'expense');
            
            for (const pot of expensePots) {
                const potTransactions = recentTransactions.filter(tx => 
                    tx.category === pot.name
                );
                const spent = potTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
                const budget = pot.monthly_budget || 0;
                
                if (budget > 0 && spent > budget * 0.9) {
                    tips.push({
                        type: 'warning',
                        color: 'orange',
                        title: `${pot.icon || '💰'} ${pot.name} bijna op`,
                        message: `Je hebt ${formatCurrency(spent)} uitgegeven van je ${formatCurrency(budget)} budget. Nog ${formatCurrency(Math.max(0, budget - spent))} over.`
                    });
                }
            }

            // 4. Analyseer vaste lasten percentage
            const totalFixedCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
            
            if (totalIncome > 0) {
                const fixedPercentage = (totalFixedCosts / totalIncome) * 100;
                
                if (fixedPercentage > 50) {
                    tips.push({
                        type: 'warning',
                        color: 'red',
                        title: 'Hoge vaste lasten',
                        message: `Je vaste lasten zijn ${Math.round(fixedPercentage)}% van je inkomen. Probeer dit onder de 50% te houden voor meer financiële vrijheid.`
                    });
                } else if (fixedPercentage < 40) {
                    tips.push({
                        type: 'success',
                        color: 'green',
                        title: 'Gezonde vaste lasten',
                        message: `Goed bezig! Je vaste lasten zijn ${Math.round(fixedPercentage)}% van je inkomen. Dit geeft je ruimte om te sparen.`
                    });
                }
            }

            // 5. Analyseer schulden
            const activeDebts = debts.filter(d => 
                d.status === 'betalingsregeling' || 
                d.status === 'wachtend'
            );
            
            if (activeDebts.length > 0) {
                const totalDebt = activeDebts.reduce((sum, d) => 
                    sum + ((d.amount || 0) - (d.amount_paid || 0)), 0
                );
                const monthlyPayments = activeDebts.reduce((sum, d) => 
                    sum + (d.monthly_payment || 0), 0
                );
                
                if (monthlyPayments > 0 && totalDebt > 0) {
                    const monthsToPayoff = Math.ceil(totalDebt / monthlyPayments);
                    tips.push({
                        type: 'info',
                        color: 'purple',
                        title: 'Schuld afbetaling',
                        message: `Met je huidige aflossingn van ${formatCurrency(monthlyPayments)}/maand ben je over ongeveer ${monthsToPayoff} maanden schuldenvrij. Hou vol!`
                    });
                }
            }

            // 6. Analyseer boodschappen uitgaven
            const groceryTransactions = recentTransactions.filter(tx =>
                tx.category?.toLowerCase().includes('boodschap') ||
                tx.category?.toLowerCase().includes('eten') ||
                tx.category?.toLowerCase().includes('food')
            );
            
            if (groceryTransactions.length >= 5) {
                const totalGroceries = groceryTransactions.reduce((sum, tx) => 
                    sum + (parseFloat(tx.amount) || 0), 0
                );
                const avgPerVisit = totalGroceries / groceryTransactions.length;
                
                if (avgPerVisit > 50) {
                    tips.push({
                        type: 'info',
                        color: 'blue',
                        title: 'Boodschappen tip',
                        message: `Je gemiddelde boodschappenuitgave is ${formatCurrency(avgPerVisit)}. Maak een boodschappenlijstje om impulaankopen te voorkomen.`
                    });
                }
            }

            // 7. Check energie kosten
            const energyCosts = costs.filter(c => c.category === 'utilities' || c.category === 'energie');
            if (energyCosts.length > 0) {
                const totalEnergy = energyCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
                
                if (totalEnergy > 200) {
                    tips.push({
                        type: 'info',
                        color: 'green',
                        title: 'Energie besparen',
                        message: `Je energiekosten zijn ${formatCurrency(totalEnergy)}/maand. Vergelijk regelmatig energieleveranciers via bv. Gaslicht.com of Pricewise.`
                    });
                }
            }

            // Fallback als er geen specifieke tips zijn
            if (tips.length === 0) {
                tips.push({
                    type: 'success',
                    color: 'green',
                    title: '50/30/20 Regel',
                    message: 'Probeer 50% voor noodzakelijk, 30% voor wensen, 20% voor sparen/schulden af te lossen.'
                });
            }

            // Maximaal 4 tips tonen
            setSuggestions(tips.slice(0, 4));
            
        } catch (error) {
            console.error('Error generating suggestions:', error);
            setSuggestions([{
                type: 'info',
                color: 'gray',
                title: 'Tip',
                message: 'Voeg meer transacties toe om gepersonaliseerde tips te krijgen.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-50 text-blue-900',
            green: 'bg-green-50 text-green-900',
            yellow: 'bg-yellow-50 text-yellow-900',
            orange: 'bg-orange-50 text-orange-900',
            red: 'bg-red-50 text-red-900',
            purple: 'bg-purple-50 text-purple-900',
            gray: 'bg-gray-50 text-gray-900'
        };
        return colors[color] || colors.gray;
    };

    const getDotColor = (color) => {
        const colors = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            orange: 'bg-orange-500',
            red: 'bg-red-500',
            purple: 'bg-purple-500',
            gray: 'bg-gray-500'
        };
        return colors[color] || colors.gray;
    };

    if (loading) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        Slimme Suggesties
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Analyseren...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Slimme Suggesties
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                        <div 
                            key={index} 
                            className={`flex items-start gap-3 p-3 rounded-lg ${getColorClasses(suggestion.color)}`}
                        >
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getDotColor(suggestion.color)}`} />
                            <div>
                                <p className="text-sm font-medium">{suggestion.title}</p>
                                <p className="text-sm opacity-80">{suggestion.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}