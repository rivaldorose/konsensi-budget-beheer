import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
    Wallet, 
    Calendar, 
    AlertTriangle, 
    CheckCircle2, 
    ChevronDown, 
    ChevronUp,
    Sparkles,
    TrendingUp,
    Receipt,
    CreditCard,
    PiggyBank,
    ArrowRight,
    Info,
    Plus,
    X,
    Check,
    Square,
    CheckSquare
} from 'lucide-react';
import { MonthlyCost } from '@/api/entities';
import { Debt } from '@/api/entities';
import { Pot } from '@/api/entities';
import { formatCurrency } from '@/components/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

export default function MonthlyBudgetPlanner({ isOpen, onClose, user, onBudgetSet }) {
    const [step, setStep] = useState(1);
    const [availableMoney, setAvailableMoney] = useState('');
    const [loading, setLoading] = useState(true);
    const [upcomingPayments, setUpcomingPayments] = useState([]);
    const [debtPayments, setDebtPayments] = useState([]);
    const [pots, setPots] = useState([]);
    const [expandedSection, setExpandedSection] = useState('payments');
    const [potAllocations, setPotAllocations] = useState({});
    
    // Selectie en aangepaste bedragen voor betalingen
    const [selectedPayments, setSelectedPayments] = useState({});
    const [customPaymentAmounts, setCustomPaymentAmounts] = useState({});
    const [selectedDebts, setSelectedDebts] = useState({});
    const [customDebtAmounts, setCustomDebtAmounts] = useState({});
    
    // Extra handmatige kosten
    const [extraCosts, setExtraCosts] = useState([]);
    const [showAddCost, setShowAddCost] = useState(false);
    const [newCostName, setNewCostName] = useState('');
    const [newCostAmount, setNewCostAmount] = useState('');
    
    // Potjes selectie en nieuw potje aanmaken
    const [selectedPots, setSelectedPots] = useState({});
    const [showAddPot, setShowAddPot] = useState(false);
    const [newPotName, setNewPotName] = useState('');
    const [newPotIcon, setNewPotIcon] = useState('💰');
    const [newPotBudget, setNewPotBudget] = useState('');

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;

    useEffect(() => {
        if (isOpen && user) {
            loadPaymentData();
        }
    }, [isOpen, user]);

    const loadPaymentData = async () => {
        setLoading(true);
        try {
            // Haal vaste lasten op die nog betaald moeten worden deze maand
            const costs = await MonthlyCost.filter({ 
                status: 'actief',
                created_by: user.email 
            });
            
            // Filter op betalingen die nog moeten komen (payment_date >= vandaag)
            const upcoming = costs
                .filter(cost => cost.payment_date >= currentDay)
                .sort((a, b) => a.payment_date - b.payment_date);
            
            setUpcomingPayments(upcoming);
            
            // Initialiseer selectie - standaard alles aangevinkt
            const initialSelectedPayments = {};
            const initialCustomAmounts = {};
            upcoming.forEach(p => {
                initialSelectedPayments[p.id] = true;
                initialCustomAmounts[p.id] = parseFloat(p.amount) || 0;
            });
            setSelectedPayments(initialSelectedPayments);
            setCustomPaymentAmounts(initialCustomAmounts);

            // Haal schulden met betalingsregeling op
            const debts = await Debt.filter({ 
                status: 'betalingsregeling',
                created_by: user.email 
            });
            
            // Filter schulden waarvan betaling nog moet komen
            const upcomingDebts = debts.filter(debt => {
                if (!debt.payment_plan_date) return true; // Als geen datum, toon altijd
                const paymentDay = new Date(debt.payment_plan_date).getDate();
                return paymentDay >= currentDay;
            });
            
            setDebtPayments(upcomingDebts);
            
            // Initialiseer schulden selectie
            const initialSelectedDebts = {};
            const initialDebtAmounts = {};
            upcomingDebts.forEach(d => {
                initialSelectedDebts[d.id] = true;
                initialDebtAmounts[d.id] = parseFloat(d.monthly_payment) || 0;
            });
            setSelectedDebts(initialSelectedDebts);
            setCustomDebtAmounts(initialDebtAmounts);

            // Haal potjes op
            const potsData = await Pot.filter({ created_by: user.email });
            const expensePots = potsData.filter(p => p.pot_type === 'expense');
            setPots(expensePots);

            // Initialiseer allocaties op huidige budgetten
            const initialAllocations = {};
            const initialSelectedPots = {};
            expensePots.forEach(pot => {
                initialAllocations[pot.id] = parseFloat(pot.budget) || 0;
                initialSelectedPots[pot.id] = true; // Standaard alle potjes aangevinkt
            });
            setPotAllocations(initialAllocations);
            setSelectedPots(initialSelectedPots);

        } catch (error) {
            console.error('Error loading payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Bereken totalen - alleen geselecteerde items met aangepaste bedragen
    const totalUpcomingPayments = upcomingPayments
        .filter(p => selectedPayments[p.id])
        .reduce((sum, p) => sum + (customPaymentAmounts[p.id] || 0), 0);
    const totalDebtPayments = debtPayments
        .filter(d => selectedDebts[d.id])
        .reduce((sum, d) => sum + (customDebtAmounts[d.id] || 0), 0);
    const totalExtraCosts = extraCosts.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalFixedCosts = totalUpcomingPayments + totalDebtPayments + totalExtraCosts;
    
    const availableAmount = parseFloat(availableMoney) || 0;
    const afterFixedCosts = availableAmount - totalFixedCosts;
    
    const totalPotAllocations = pots
        .filter(p => selectedPots[p.id])
        .reduce((sum, p) => sum + (potAllocations[p.id] || 0), 0);
    const remainingAfterPots = afterFixedCosts - totalPotAllocations;

    const handlePotAllocationChange = (potId, value) => {
        setPotAllocations(prev => ({
            ...prev,
            [potId]: parseFloat(value) || 0
        }));
    };

    const togglePayment = (id) => {
        setSelectedPayments(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleDebt = (id) => {
        setSelectedDebts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const updatePaymentAmount = (id, value) => {
        setCustomPaymentAmounts(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }));
    };

    const updateDebtAmount = (id, value) => {
        setCustomDebtAmounts(prev => ({
            ...prev,
            [id]: parseFloat(value) || 0
        }));
    };

    const addExtraCost = () => {
        if (!newCostName || !newCostAmount) return;
        setExtraCosts(prev => [...prev, {
            id: `extra-${Date.now()}`,
            name: newCostName,
            amount: parseFloat(newCostAmount) || 0
        }]);
        setNewCostName('');
        setNewCostAmount('');
        setShowAddCost(false);
    };

    const removeExtraCost = (id) => {
        setExtraCosts(prev => prev.filter(c => c.id !== id));
    };

    const togglePot = (id) => {
        setSelectedPots(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const addNewPot = async () => {
        if (!newPotName || !newPotBudget) return;
        try {
            const newPot = await Pot.create({
                name: newPotName,
                icon: newPotIcon,
                pot_type: 'expense',
                budget: parseFloat(newPotBudget) || 0,
                spent: 0
            });
            setPots(prev => [...prev, newPot]);
            setPotAllocations(prev => ({
                ...prev,
                [newPot.id]: parseFloat(newPotBudget) || 0
            }));
            setSelectedPots(prev => ({
                ...prev,
                [newPot.id]: true
            }));
            setNewPotName('');
            setNewPotIcon('💰');
            setNewPotBudget('');
            setShowAddPot(false);
        } catch (error) {
            console.error('Error creating pot:', error);
        }
    };

    const handleConfirm = async () => {
        try {
            // Update pot budgets - alleen geselecteerde potjes
            const updatePromises = [];
            for (const pot of pots) {
                if (selectedPots[pot.id] && potAllocations[pot.id] !== undefined) {
                    updatePromises.push(
                        Pot.update(pot.id, { 
                            budget: potAllocations[pot.id],
                            spent: parseFloat(pot.spent) || 0 // Behoud huidige spent, niet resetten
                        })
                    );
                }
            }
            
            // Wacht tot alle updates klaar zijn
            await Promise.all(updatePromises);
            
            console.log('✅ Budget opgeslagen voor', updatePromises.length, 'potjes');
            
            // Sluit modal EERST
            onClose();
            
            // Wacht iets langer voor database sync
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Roep callback aan NA sluiten en delay
            if (onBudgetSet) {
                onBudgetSet({
                    availableMoney: availableAmount,
                    fixedCosts: totalFixedCosts,
                    potAllocations,
                    remaining: remainingAfterPots
                });
            }
        } catch (error) {
            console.error('Error saving budget:', error);
        }
    };

    const distributeEvenly = () => {
        if (pots.length === 0 || afterFixedCosts <= 0) return;
        
        const perPot = Math.floor(afterFixedCosts / pots.length);
        const newAllocations = {};
        pots.forEach(pot => {
            newAllocations[pot.id] = perPot;
        });
        setPotAllocations(newAllocations);
    };

    const suggestBudget = () => {
        if (pots.length === 0 || afterFixedCosts <= 0) return;
        
        // Slim verdelen: 50% boodschappen, rest verdeeld
        const newAllocations = {};
        const boodschappenPot = pots.find(p => 
            p.name.toLowerCase().includes('boodschap') || 
            p.name.toLowerCase().includes('eten')
        );
        
        let remaining = afterFixedCosts;
        
        if (boodschappenPot) {
            // 50% voor boodschappen
            const boodschappenBudget = Math.round(afterFixedCosts * 0.5);
            newAllocations[boodschappenPot.id] = boodschappenBudget;
            remaining -= boodschappenBudget;
        }
        
        // Rest verdelen over andere potjes
        const otherPots = pots.filter(p => p.id !== boodschappenPot?.id);
        if (otherPots.length > 0) {
            const perPot = Math.floor(remaining / otherPots.length);
            otherPots.forEach(pot => {
                newAllocations[pot.id] = perPot;
            });
        }
        
        // Als er geen boodschappen pot is, verdeel alles gelijk
        if (!boodschappenPot) {
            const perPot = Math.floor(afterFixedCosts / pots.length);
            pots.forEach(pot => {
                newAllocations[pot.id] = perPot;
            });
        }
        
        setPotAllocations(newAllocations);
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Wallet className="w-6 h-6 text-green-600" />
                        Maandbudget Planner
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-green-500"></div>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Step 1: Hoeveel heb je? */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                            <Label className="text-green-800 font-semibold mb-2 block">
                                💰 Hoeveel geld heb je nu beschikbaar?
                            </Label>
                            <p className="text-sm text-green-700 mb-3">
                                Vul in hoeveel je hebt ontvangen of op je rekening staat
                            </p>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                                <Input
                                    type="number"
                                    placeholder="bijv. 1500"
                                    value={availableMoney}
                                    onChange={(e) => setAvailableMoney(e.target.value)}
                                    className="pl-8 text-2xl font-bold h-14 bg-white"
                                />
                            </div>
                        </div>

                        {availableAmount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Overzicht vaste lasten */}
                                <Card className="border-orange-200">
                                    <CardHeader 
                                        className="py-3 cursor-pointer"
                                        onClick={() => setExpandedSection(expandedSection === 'payments' ? '' : 'payments')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Receipt className="w-5 h-5 text-orange-500" />
                                                Nog te betalen deze maand
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-orange-600">
                                                    {formatCurrency(totalFixedCosts)}
                                                </span>
                                                {expandedSection === 'payments' ? 
                                                    <ChevronUp className="w-4 h-4" /> : 
                                                    <ChevronDown className="w-4 h-4" />
                                                }
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <AnimatePresence>
                                        {expandedSection === 'payments' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <CardContent className="pt-0 space-y-2">
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        ✏️ Vink aan wat je wilt meetellen en pas bedragen aan
                                                    </p>
                                                    
                                                    {upcomingPayments.length === 0 && debtPayments.length === 0 && extraCosts.length === 0 ? (
                                                        <p className="text-sm text-gray-500 text-center py-2">
                                                            🎉 Geen openstaande betalingen meer deze maand!
                                                        </p>
                                                    ) : (
                                                        <>
                                                            {/* Vaste lasten */}
                                                            {upcomingPayments.map(payment => (
                                                                <div key={payment.id} className={`flex items-center gap-2 py-2 border-b border-gray-100 last:border-0 ${!selectedPayments[payment.id] ? 'opacity-50' : ''}`}>
                                                                    <button 
                                                                        onClick={() => togglePayment(payment.id)}
                                                                        className="flex-shrink-0"
                                                                    >
                                                                        {selectedPayments[payment.id] ? 
                                                                            <CheckSquare className="w-5 h-5 text-green-600" /> : 
                                                                            <Square className="w-5 h-5 text-gray-400" />
                                                                        }
                                                                    </button>
                                                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                                                        {payment.payment_date}e
                                                                    </Badge>
                                                                    <span className="text-sm flex-1 truncate">{payment.name}</span>
                                                                    <div className="relative w-20 flex-shrink-0">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={customPaymentAmounts[payment.id] || ''}
                                                                            onChange={(e) => updatePaymentAmount(payment.id, e.target.value)}
                                                                            className="pl-5 h-8 text-sm text-right"
                                                                            disabled={!selectedPayments[payment.id]}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Schulden */}
                                                            {debtPayments.map(debt => (
                                                                <div key={debt.id} className={`flex items-center gap-2 py-2 border-b border-gray-100 last:border-0 ${!selectedDebts[debt.id] ? 'opacity-50' : ''}`}>
                                                                    <button 
                                                                        onClick={() => toggleDebt(debt.id)}
                                                                        className="flex-shrink-0"
                                                                    >
                                                                        {selectedDebts[debt.id] ? 
                                                                            <CheckSquare className="w-5 h-5 text-green-600" /> : 
                                                                            <Square className="w-5 h-5 text-gray-400" />
                                                                        }
                                                                    </button>
                                                                    <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                                    <span className="text-sm flex-1 truncate">{debt.creditor_name}</span>
                                                                    <div className="relative w-20 flex-shrink-0">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={customDebtAmounts[debt.id] || ''}
                                                                            onChange={(e) => updateDebtAmount(debt.id, e.target.value)}
                                                                            className="pl-5 h-8 text-sm text-right"
                                                                            disabled={!selectedDebts[debt.id]}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Extra handmatige kosten */}
                                                            {extraCosts.map(cost => (
                                                                <div key={cost.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0 bg-blue-50 -mx-4 px-4">
                                                                    <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                                    <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                    <span className="text-sm flex-1 truncate text-blue-800">{cost.name}</span>
                                                                    <span className="font-medium text-blue-800 text-sm">
                                                                        {formatCurrency(cost.amount)}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => removeExtraCost(cost.id)}
                                                                        className="p-1 hover:bg-blue-100 rounded"
                                                                    >
                                                                        <X className="w-4 h-4 text-blue-600" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}

                                                    {/* Extra kost toevoegen */}
                                                    {showAddCost ? (
                                                        <div className="flex items-center gap-2 pt-2 border-t">
                                                            <Input
                                                                placeholder="Naam"
                                                                value={newCostName}
                                                                onChange={(e) => setNewCostName(e.target.value)}
                                                                className="h-8 text-sm flex-1"
                                                            />
                                                            <div className="relative w-20">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={newCostAmount}
                                                                    onChange={(e) => setNewCostAmount(e.target.value)}
                                                                    className="pl-5 h-8 text-sm text-right"
                                                                />
                                                            </div>
                                                            <Button size="sm" className="h-8 px-2" onClick={addExtraCost}>
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAddCost(false)}>
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="w-full mt-2 border-dashed"
                                                            onClick={() => setShowAddCost(true)}
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Andere kost toevoegen
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>

                                {/* Berekening */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Beschikbaar</span>
                                        <span className="font-medium text-green-600">{formatCurrency(availableAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Vaste lasten</span>
                                        <span className="font-medium text-red-600">- {formatCurrency(totalFixedCosts)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                        <span>Over voor potjes</span>
                                        <span className={afterFixedCosts >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                            {formatCurrency(afterFixedCosts)}
                                        </span>
                                    </div>
                                </div>

                                {afterFixedCosts < 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-red-800">Let op!</p>
                                            <p className="text-sm text-red-700">
                                                Je hebt niet genoeg om alle vaste lasten te betalen. 
                                                Er mist {formatCurrency(Math.abs(afterFixedCosts))}.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Potjes verdeling */}
                                {afterFixedCosts > 0 && pots.length > 0 && (
                                    <Card className="border-blue-200">
                                        <CardHeader className="py-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <PiggyBank className="w-5 h-5 text-blue-500" />
                                                    Verdeel over potjes
                                                </CardTitle>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={distributeEvenly}
                                                        className="text-xs h-7"
                                                    >
                                                        Gelijk
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={suggestBudget}
                                                        className="text-xs h-7 text-green-600"
                                                    >
                                                        <Sparkles className="w-3 h-3 mr-1" />
                                                        Slim
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 space-y-3">
                                            <p className="text-xs text-gray-500 mb-2">
                                                ✏️ Vink aan welke potjes je wilt gebruiken
                                            </p>

                                            {pots.map(pot => (
                                                <div key={pot.id} className={`flex items-center gap-2 ${!selectedPots[pot.id] ? 'opacity-50' : ''}`}>
                                                    <button 
                                                        onClick={() => togglePot(pot.id)}
                                                        className="flex-shrink-0"
                                                    >
                                                        {selectedPots[pot.id] ? 
                                                            <CheckSquare className="w-5 h-5 text-green-600" /> : 
                                                            <Square className="w-5 h-5 text-gray-400" />
                                                        }
                                                    </button>
                                                    <span className="text-xl w-8">{pot.icon || '💰'}</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{pot.name}</p>
                                                    </div>
                                                    <div className="relative w-20">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                                        <Input
                                                            type="number"
                                                            value={potAllocations[pot.id] || ''}
                                                            onChange={(e) => handlePotAllocationChange(pot.id, e.target.value)}
                                                            className="pl-5 h-8 text-sm text-right"
                                                            disabled={!selectedPots[pot.id]}
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Nieuw potje toevoegen */}
                                            {showAddPot ? (
                                                <div className="flex items-center gap-2 pt-2 border-t mt-2">
                                                    <select
                                                        value={newPotIcon}
                                                        onChange={(e) => setNewPotIcon(e.target.value)}
                                                        className="h-8 w-12 text-center border rounded text-lg"
                                                    >
                                                        {['💰', '🛒', '🍔', '🚗', '👕', '🎮', '💊', '🎁', '✈️', '📱'].map(icon => (
                                                            <option key={icon} value={icon}>{icon}</option>
                                                        ))}
                                                    </select>
                                                    <Input
                                                        placeholder="Naam"
                                                        value={newPotName}
                                                        onChange={(e) => setNewPotName(e.target.value)}
                                                        className="h-8 text-sm flex-1"
                                                    />
                                                    <div className="relative w-20">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={newPotBudget}
                                                            onChange={(e) => setNewPotBudget(e.target.value)}
                                                            className="pl-5 h-8 text-sm text-right"
                                                        />
                                                    </div>
                                                    <Button size="sm" className="h-8 px-2" onClick={addNewPot}>
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAddPot(false)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full mt-2 border-dashed"
                                                    onClick={() => setShowAddPot(true)}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Nieuw potje aanmaken
                                                </Button>
                                            )}

                                            <div className="border-t pt-3 mt-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Totaal potjes</span>
                                                    <span className="font-medium">{formatCurrency(totalPotAllocations)}</span>
                                                </div>
                                                <div className="flex justify-between font-bold mt-1">
                                                    <span>Nog over</span>
                                                    <span className={remainingAfterPots >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(remainingAfterPots)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Samenvatting */}
                                {afterFixedCosts >= 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-green-800">Samenvatting</span>
                                        </div>
                                        <div className="text-sm text-green-700 space-y-1">
                                            <p>📅 Nog {daysRemaining} dagen tot einde maand</p>
                                            <p>💵 Per dag beschikbaar: {formatCurrency(remainingAfterPots / Math.max(daysRemaining, 1))}</p>
                                            {remainingAfterPots > 0 && (
                                                <p>💡 Tip: Zet {formatCurrency(remainingAfterPots)} opzij als buffer!</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Annuleren
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={availableAmount <= 0}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Budget Instellen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}