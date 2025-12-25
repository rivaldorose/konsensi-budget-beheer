import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Income } from '@/api/entities';
import { MonthlyCost } from '@/api/entities';
import { Debt } from '@/api/entities';
import { Pot } from '@/api/entities';
import { User } from '@/api/entities';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Lightbulb, Mail, Copy, ArrowRight, ShieldCheck, Wallet, X } from 'lucide-react';

// Native date helpers
const getStartOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

const generateFutureIncomeEvents = (incomes, periodInDays) => {
    const today = getStartOfToday();
    const endDate = addDays(today, periodInDays);
    let events = [];

    incomes.forEach(income => {
        if (income.frequency === 'monthly' && income.day_of_month) {
            let currentDate = new Date(today.getFullYear(), today.getMonth(), income.day_of_month);
            if (currentDate < today) {
                currentDate = addMonths(currentDate, 1);
            }
            while (currentDate <= endDate) {
                events.push({ date: currentDate, amount: income.amount, description: income.description });
                currentDate = addMonths(currentDate, 1);
            }
        }
    });

    return events.sort((a, b) => a.date - b.date);
};

export default function UnpaidItemModal({ isOpen, onClose, item, onPlanCreated }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [forecast, setForecast] = useState(null);
    const [pots, setPots] = useState([]);
    const [user, setUser] = useState(null);
    const [emailBody, setEmailBody] = useState('');
    const { toast } = useToast();

    const calculateForecast = useCallback(async () => {
        if (!item) return;

        setLoading(true);
        try {
            const [recurringIncomes, otherMonthlyCosts, otherActiveDebts, allPots] = await Promise.all([
                Income.filter({ frequency: 'monthly' }),
                MonthlyCost.filter({ status: 'actief' }),
                Debt.filter({ status: 'actief' }),
                Pot.list()
            ]);
            setPots(allPots);

            const futureIncomeEvents = generateFutureIncomeEvents(recurringIncomes, 90);

            const otherCosts = [
                ...otherMonthlyCosts.filter(c => c.id !== item.id).map(c => ({...c, dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), c.payment_date)})),
                ...otherActiveDebts.filter(d => d.id !== item.id).map(d => ({...d, name: d.creditor_name, amount: d.monthly_payment, dueDate: new Date(d.payment_plan_date) }))
            ].filter(c => c.amount > 0);

            let runningBalance = 0;
            let lastDate = getStartOfToday();

            for (const incomeEvent of futureIncomeEvents) {
                const costsBeforeThisIncome = otherCosts.filter(cost => {
                    const costDueDateInThisCycle = new Date(incomeEvent.date.getFullYear(), incomeEvent.date.getMonth(), cost.payment_date || new Date(cost.dueDate).getDate());
                    return costDueDateInThisCycle > lastDate && costDueDateInThisCycle <= incomeEvent.date;
                });
                
                const sumOfCosts = costsBeforeThisIncome.reduce((sum, cost) => sum + cost.amount, 0);
                
                const balanceAfterIncome = runningBalance + incomeEvent.amount - sumOfCosts;

                if (balanceAfterIncome >= item.amount) {
                    setForecast({
                        possibleDate: incomeEvent.date,
                        nextIncome: incomeEvent,
                        costsUntilThen: {
                            items: costsBeforeThisIncome,
                            total: sumOfCosts,
                        },
                        availableAmount: balanceAfterIncome,
                        isPossible: true,
                    });
                    setLoading(false);
                    return;
                }
                
                runningBalance = balanceAfterIncome;
                lastDate = incomeEvent.date;
            }

            setForecast({
                isPossible: false,
                message: "Het lijkt er op dat je deze rekening de komende 3 maanden niet kunt betalen met je huidige budget. Het is belangrijk om hulp te zoeken."
            });

        } catch (error) {
            console.error("Error calculating forecast:", error);
            toast.error("Kon geen voorspelling maken.");
            setForecast({ isPossible: false, message: "Er is een fout opgetreden bij het berekenen." });
        } finally {
            setLoading(false);
        }
    }, [item, toast]);

    useEffect(() => {
        if (isOpen && item) {
            const loadData = async () => {
                const currentUser = await User.me();
                setUser(currentUser);
                calculateForecast();
            };
            loadData();
        }
    }, [isOpen, item, calculateForecast]);

    useEffect(() => {
        if (step === 3 && item && forecast && user) {
            const formattedDate = (() => {
                try {
                    return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long', year: 'numeric' }).format(forecast.possibleDate);
                } catch (e) {
                    return 'een latere datum';
                }
            })();
            
            const body = `Beste ${item.name},

Ik neem contact met u op over de openstaande betaling voor ${item.name} van €${item.amount.toFixed(2)}.

Door onvoorziene omstandigheden is het voor mij op dit moment niet mogelijk om deze rekening op tijd te betalen.

Ik heb mijn budget voor de komende periode zorgvuldig bekeken en op basis daarvan kan ik de volledige betaling voldoen op ${formattedDate}.

Ik wil deze betaling graag zo snel mogelijk in orde maken en hoop dat u akkoord kunt gaan met dit voorstel.

Alvast bedankt voor uw begrip.

Met vriendelijke groet,
${user.full_name || user.voornaam || 'Een klant'}
`;
            setEmailBody(body);
        }
    }, [step, item, forecast, user]);

    if (!isOpen) return null;

    const renderForecastStep = () => {
        if (loading) {
            return (
                <div className="text-center p-8">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold">Een moment, we kijken in je budget...</h3>
                    <p className="text-gray-600">We berekenen wanneer je '{item.name}' kunt betalen.</p>
                </div>
            );
        }

        if (!forecast?.isPossible) {
             return (
                <div className="text-center p-8">
                    <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h3 className="text-lg font-bold text-red-700">Betaling niet mogelijk</h3>
                    <p className="text-gray-600 mt-2">{forecast?.message || "Kon geen geschikt betaalmoment vinden."}</p>
                    <Button onClick={onClose} className="mt-4">Ok, begrepen</Button>
                </div>
            );
        }

        const nextIncomeDateStr = (() => {
            try {
                return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long' }).format(forecast.nextIncome.date);
            } catch (e) {
                return 'Onbekend';
            }
        })();

        const possibleDateStr = (() => {
            try {
                return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long', year: 'numeric' }).format(forecast.possibleDate);
            } catch (e) {
                return 'Onbekend';
            }
        })();

        return (
            <div>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">
                        <Calendar className="w-6 h-6 inline-block mr-3 text-green-500" />
                        Wanneer kun je betalen?
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Volgend inkomen:</p>
                        <p className="font-semibold">{nextIncomeDateStr} (+€{forecast.nextIncome.amount})</p>
                    </div>
                     <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Andere verplichtingen tot dan:</p>
                        <p className="font-semibold">-€{forecast.costsUntilThen.total.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                        <p className="text-sm text-yellow-800">Beschikbaar op {nextIncomeDateStr}:</p>
                        <p className="text-2xl font-bold text-yellow-900">€{forecast.availableAmount.toFixed(2)}</p>
                    </div>

                    <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                         <Lightbulb className="w-6 h-6 inline-block mr-2 text-green-700" />
                        <h3 className="text-lg font-bold text-green-800 inline-block">Je kunt de volledige €{item.amount} betalen op {possibleDateStr}</h3>
                    </div>
                    
                </CardContent>
                 <div className="flex justify-end gap-2 p-4">
                    <Button variant="outline" onClick={onClose}>Annuleren</Button>
                    <Button onClick={() => setStep(2)} className="bg-green-500 hover:bg-green-600">Doorgaan</Button>
                </div>
            </div>
        );
    };

    const renderPrioritizeStep = () => {
        if (!forecast?.isPossible) {
            return null;
        }

        const essentialCosts = [
            { name: item.name, amount: item.amount, isPot: false },
            ...forecast.costsUntilThen.items.map(c => ({ name: c.name, amount: c.amount, isPot: false })),
        ];

        const essentialPots = pots.filter(p => p.is_essential);
        const wishPots = pots.filter(p => !p.is_essential);

        const totalEssential = essentialCosts.reduce((sum, item) => sum + item.amount, 0) + essentialPots.reduce((sum, p) => sum + p.monthly_budget, 0);

        const nextIncomeDateStr = (() => {
            try {
                return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long' }).format(forecast.possibleDate);
            } catch (e) {
                return 'deze datum';
            }
        })();

        return (
             <div>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">
                        <Lightbulb className="w-6 h-6 inline-block mr-3 text-yellow-500" />
                        💡 Zo betaal je je {item.name}
                    </CardTitle>
                    <CardDescription className="pt-2">
                        Om je {item.name} van €{item.amount} te kunnen betalen op {nextIncomeDateStr}, moet je nu prioriteren:
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-6 h-6 text-green-600"/>
                            ✅ ESSENTIEEL (altijd betalen)
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                           {essentialCosts.map((cost, i) => (
                               <div key={`cost-${i}`} className="flex justify-between">
                                   <span>• {cost.name}</span>
                                   <span className="font-medium">€{cost.amount.toFixed(0)}</span>
                               </div>
                           ))}
                           {essentialPots.map(pot => (
                               <div key={pot.id} className="flex justify-between">
                                   <span>• Potje: {pot.name}</span>
                                   <span className="font-medium">€{pot.monthly_budget.toFixed(0)}</span>
                               </div>
                           ))}
                           <div className="border-t border-gray-200 my-2"></div>
                           <div className="flex justify-between font-bold">
                               <span>Totaal Essentieel</span>
                               <span>€{totalEssential.toFixed(0)}</span>
                           </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                            <Wallet className="w-6 h-6 text-orange-500"/>
                            🔶 MINDER BELANGRIJK (kan wachten)
                        </h3>
                        <div className="bg-orange-50 p-4 rounded-lg space-y-2 text-sm">
                           {wishPots.length > 0 ? wishPots.map(pot => (
                               <div key={pot.id} className="flex justify-between items-center text-gray-700">
                                   <span>• Potje: {pot.name} (€{pot.monthly_budget.toFixed(0)})</span>
                                   <span className="font-semibold text-red-600 flex items-center gap-1"><X className="w-4 h-4"/> Skip dit</span>
                               </div>
                           )) : (
                               <p className="text-gray-600">Je hebt geen 'wens' potjes om te skippen. Goed bezig!</p>
                           )}
                        </div>
                    </div>
                    
                    <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg text-center">
                        <p className="font-bold">Door je wensen te skippen, maak je ruimte om je {item.name} te betalen! 💪</p>
                    </div>

                    <p className="text-sm text-gray-600 pt-2">
                        Snap je het? Dan kunnen we een concept-mail voor je verhuurder maken.
                    </p>
                </CardContent>
                 <div className="flex justify-end gap-2 p-4 border-t">
                    <Button variant="outline" onClick={() => setStep(1)}>Terug</Button>
                    <Button onClick={() => setStep(3)} className="bg-green-600 hover:bg-green-700">Ja, snap ik <ArrowRight className="w-4 h-4 ml-2"/></Button>
                </div>
            </div>
        );
    };
    
    const handleCopy = () => {
        if (emailBody) {
            navigator.clipboard.writeText(emailBody);
            toast({
                title: "✅ Tekst gekopieerd!",
                description: "Je kunt de tekst nu in je e-mail plakken.",
            });
        }
    };
    
    const renderEmailStep = () => (
         <div>
            <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <Mail className="w-6 h-6 text-green-600"/>
                    Stap 3: E-mail naar {item?.name}
                </CardTitle>
                <CardDescription className="pt-2">
                    Hieronder staat een concept-e-mail. Kopieer de tekst en stuur deze naar de schuldeiser om je betalingsvoorstel te doen.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    value={emailBody} 
                    readOnly 
                    rows={15}
                    className="text-sm bg-gray-50"
                />
                <Button onClick={handleCopy} className="w-full bg-blue-500 hover:bg-blue-600">
                    <Copy className="w-4 h-4 mr-2" />
                    Kopieer de tekst
                </Button>
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)}>Terug</Button>
                <Button onClick={onPlanCreated} className="bg-green-600 hover:bg-green-700">Klaar!</Button>
            </div>
        </div>
    );

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <Card className="max-w-lg w-full transform transition-transform overflow-hidden">
                {step === 1 && renderForecastStep()}
                {step === 2 && renderPrioritizeStep()}
                {step === 3 && renderEmailStep()}
            </Card>
        </div>
    );
}