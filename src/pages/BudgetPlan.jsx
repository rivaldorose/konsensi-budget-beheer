import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { Income } from '@/api/entities';
import { MonthlyCost } from '@/api/entities';
import { Debt } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Pot } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/components/utils/formatters';
import { 
    Plus, 
    Upload, 
    Lightbulb,
    Briefcase,
    ShoppingCart,
    Home,
    Music,
    CreditCard,
    Calendar,
    Sliders,
    BarChart3,
    History,
    HelpCircle,
    Camera,
    X,
    Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddTransactionModal from '@/components/budget/AddTransactionModal';
import BudgetAllocationSliders from '@/components/budget/BudgetAllocationSliders';
import PotProgressCards from '@/components/budget/PotProgressCards';
import BudgetHistory from '@/components/budget/BudgetHistory';
import SmartSuggestions from '@/components/budget/SmartSuggestions';
import BudgetInfoModal from '@/components/budget/BudgetInfoModal';
import AIBudgetPlannerWidget from '@/components/budget/AIBudgetPlannerWidget';
import MonthlyBudgetPlanner from '@/components/budget/MonthlyBudgetPlanner';
import BudgetOverviewCard from '@/components/budget/BudgetOverviewCard';
import LentLoansWidget from '@/components/budget/LentLoansWidget';

export default function BudgetPlan() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [periodFilter, setPeriodFilter] = useState('Maand');
    const [transactionTab, setTransactionTab] = useState('inkomsten');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    const [activeTab, setActiveTab] = useState('overzicht');
    
    // Financial data
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [fixedCosts, setFixedCosts] = useState(0);
    const [debtPayments, setDebtPayments] = useState(0);
    const [availableForPots, setAvailableForPots] = useState(0);
    const [saldo, setSaldo] = useState(0);
    
    // Transaction list & categories
    const [transactions, setTransactions] = useState([]);
    const [potBreakdown, setPotBreakdown] = useState([]);
    const [allPots, setAllPots] = useState([]);
    const [showScanModal, setShowScanModal] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [showBudgetPlanner, setShowBudgetPlanner] = useState(false);
    const [budgetOverviewRefresh, setBudgetOverviewRefresh] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);
    
    // Herbereken data wanneer periodFilter verandert (zonder reload)
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [periodFilter]);

    // Bereken periode grenzen
    const getPeriodBounds = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate, endDate;
        
        switch (periodFilter) {
            case 'Dag':
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'Week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay() + 1); // Maandag
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '2 Weken':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 13);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'Maand':
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
        }
        
        return { startDate, endDate, today };
    };

    const loadData = async () => {
        try {
            // Alleen loading tonen bij eerste keer laden
            if (!user) {
                setLoading(true);
            }
            
            const userData = await User.me();
            setUser(userData);

            const { startDate, endDate, today } = getPeriodBounds();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();

            const incomeData = await Income.filter({ created_by: userData.email });
            
            // Filter inkomsten op geselecteerde periode
            const filteredIncome = incomeData.filter(income => {
                if (income.income_type === 'vast') {
                    // Vast inkomen: check of het actief is in de geselecteerde periode
                    if (income.is_active === false) return false;
                    if (income.start_date) {
                        const incomeStartDate = new Date(income.start_date);
                        if (incomeStartDate > endDate) return false;
                    }
                    if (income.end_date) {
                        const incomeEndDate = new Date(income.end_date);
                        if (incomeEndDate < startDate) return false;
                    }
                    return true;
                } else {
                    // Extra inkomen: alleen als datum in geselecteerde periode valt
                    if (!income.date) return false;
                    const incomeDate = new Date(income.date);
                    return incomeDate >= startDate && incomeDate <= endDate;
                }
            });
            
            const incomeTotal = filteredIncome.reduce((sum, income) => {
                if (income.income_type === 'vast') {
                    return sum + (parseFloat(income.monthly_equivalent) || parseFloat(income.amount) || 0);
                } else {
                    return sum + (parseFloat(income.amount) || 0);
                }
            }, 0);

            const monthlyCostsData = await MonthlyCost.filter({ 
                status: 'actief',
                created_by: userData.email 
            });
            
            // Filter vaste lasten op periode (check payment_date binnen periode)
            const filteredCosts = monthlyCostsData.filter(cost => {
                // Check of de betaaldag binnen de geselecteerde periode valt
                const paymentDay = cost.payment_date || 1;
                const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            
            const monthlyCostsTotal = filteredCosts.reduce((sum, cost) => 
                sum + (parseFloat(cost.amount) || 0), 0
            );

            const debtsData = await Debt.filter({ 
                status: 'betalingsregeling',
                created_by: userData.email 
            });
            
            // Filter schulden op periode
            const filteredDebts = debtsData.filter(debt => {
                if (!debt.payment_plan_date) return false;
                const paymentDay = new Date(debt.payment_plan_date).getDate();
                const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            
            const debtPaymentsTotal = filteredDebts.reduce((sum, debt) => 
                sum + (parseFloat(debt.monthly_payment) || 0), 0
            );

            const transactionsData = await Transaction.filter({ created_by: userData.email });
            const filteredTransactions = transactionsData.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= startDate && txDate <= endDate;
            });
            
            const periodExpenses = filteredTransactions
                .filter(tx => tx.type === 'expense')
                .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

            const expensesTotal = monthlyCostsTotal + debtPaymentsTotal + periodExpenses;
            const saldoTotal = incomeTotal - expensesTotal;
            const fixedTotal = monthlyCostsTotal + debtPaymentsTotal;
            const availableTotal = incomeTotal - fixedTotal;

            setTotalIncome(incomeTotal);
            setTotalExpenses(expensesTotal);
            setFixedCosts(fixedTotal);
            setDebtPayments(debtPaymentsTotal);
            setAvailableForPots(availableTotal);
            setSaldo(saldoTotal);

            // Build transactions list
            const allTransactions = [
                ...filteredIncome.map(income => ({
                    id: `income-${income.id}`,
                    type: 'income',
                    description: income.description,
                    amount: income.income_type === 'vast' 
                        ? (parseFloat(income.monthly_equivalent) || parseFloat(income.amount))
                        : parseFloat(income.amount),
                    date: income.date || income.start_date,
                    category: 'Werk',
                    icon: Briefcase
                })),
                ...filteredCosts.map(cost => ({
                    id: `cost-${cost.id}`,
                    type: 'expense',
                    description: cost.name,
                    amount: parseFloat(cost.amount),
                    date: cost.start_date || new Date().toISOString().split('T')[0],
                    category: cost.category === 'wonen' ? 'Wonen' : 
                              cost.category === 'abonnementen' || cost.category === 'streaming_diensten' ? 'Abonnementen' :
                              cost.category || 'Overig',
                    icon: cost.category === 'wonen' ? Home : 
                          cost.category === 'abonnementen' || cost.category === 'streaming_diensten' ? Music : Calendar
                })),
                ...filteredDebts.map(debt => ({
                    id: `debt-${debt.id}`,
                    type: 'expense',
                    description: `${debt.creditor_name} (Regeling)`,
                    amount: parseFloat(debt.monthly_payment),
                    date: debt.payment_plan_date,
                    category: 'Betalingsregeling',
                    icon: CreditCard
                })),
                ...filteredTransactions.filter(tx => tx.type === 'expense').map(tx => ({
                    id: `tx-${tx.id}`,
                    type: 'expense',
                    description: tx.description || 'Uitgave',
                    amount: parseFloat(tx.amount),
                    date: tx.date,
                    category: tx.category || 'Boodschappen',
                    icon: ShoppingCart
                }))
            ];

            allTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            setTransactions(allTransactions);

            // Haal potjes op en bereken uitgaven per potje
            const potsData = await Pot.filter({ created_by: userData.email });
            const expensePots = potsData.filter(p => p.pot_type === 'expense');
            
            const potColors = [
                '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', 
                '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
            ];
            
            const totalPotSpent = expensePots.reduce((sum, pot) => sum + (parseFloat(pot.spent) || 0), 0);
            
            const breakdown = expensePots.map((pot, index) => ({
                name: pot.name,
                icon: pot.icon || '💰',
                amount: parseFloat(pot.spent) || 0,
                budget: parseFloat(pot.budget) || 0,
                percentage: totalPotSpent > 0 ? Math.round(((parseFloat(pot.spent) || 0) / totalPotSpent) * 100) : 0,
                color: potColors[index % potColors.length]
            })).filter(p => p.budget > 0).sort((a, b) => b.amount - a.amount);

            setPotBreakdown(breakdown);
            setAllPots(expensePots);

        } catch (error) {
            console.error('Error loading budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    const { startDate, endDate } = getPeriodBounds();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">💰 Budgetplan</h1>
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Uitleg"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-gray-500 text-sm hidden md:block">
                            {(() => {
                                const formatDateStr = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
                                return `${formatDateStr(startDate)} - ${formatDateStr(endDate)}`;
                            })()}
                        </p>
                        <Button 
                            onClick={() => setShowBudgetPlanner(true)}
                            className="hidden md:flex bg-green-600 hover:bg-green-700 text-white shadow-md"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            💰 Budget Plannen
                        </Button>
                    </div>
                </div>
                
                {/* Mobiele Budget Planner Knop - groot en opvallend */}
                <Button 
                    onClick={() => setShowBudgetPlanner(true)}
                    className="md:hidden w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg py-6 text-lg font-semibold rounded-xl"
                >
                    <Calendar className="w-5 h-5 mr-2" />
                    💰 Budget Plannen
                </Button>

                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start">
                    {['Dag', 'Week', '2 Weken', 'Maand'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setPeriodFilter(period)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                periodFilter === period 
                                    ? 'bg-white shadow-sm text-gray-900 font-medium' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="overzicht" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Overzicht</span>
                    </TabsTrigger>
                    <TabsTrigger value="verdelen" className="flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        <span className="hidden sm:inline">Verdelen</span>
                    </TabsTrigger>
                    <TabsTrigger value="voortgang" className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        <span className="hidden sm:inline">Voortgang</span>
                    </TabsTrigger>
                    <TabsTrigger value="historie" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Historie</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Overzicht (existing content) */}
                <TabsContent value="overzicht">

            {/* AI Budget Planner Widget */}
            <AIBudgetPlannerWidget 
                income={totalIncome}
                fixedCosts={fixedCosts}
                variableExpenses={totalExpenses - fixedCosts}
                currentSavings={0}
                pots={allPots}
                transactions={transactions}
                goals={[]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left Column - Kasboek */}
                <div className="lg:col-span-2">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">Kasboek</CardTitle>
                                    <p className="text-sm text-gray-500">Overzicht van je financiën</p>
                                </div>
                                <Button 
                                    className="bg-gray-900 hover:bg-gray-800 text-white"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Toevoegen
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Summary Row */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">Inkomsten</p>
                                    <p className="text-xl font-bold text-green-600">
                                        € {totalIncome.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">Uitgaven</p>
                                    <p className="text-xl font-bold text-red-600">
                                        € {totalExpenses.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>Vaste lasten:</span>
                                            <span>€{(fixedCosts - debtPayments).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        {debtPayments > 0 && (
                                            <div className="flex justify-between">
                                                <span>Regelingen:</span>
                                                <span>€{debtPayments.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">Saldo</p>
                                    <p className={`text-xl font-bold ${saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                        € {saldo.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Transaction Tabs */}
                            <div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {[
                                        { key: 'inkomsten', label: 'Inkomsten', count: transactions.filter(t => t.type === 'income').length },
                                        { key: 'uitgaven', label: 'Uitgaven', count: transactions.filter(t => t.type === 'expense').length }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setTransactionTab(tab.key)}
                                            className={`py-3 text-sm font-medium rounded-full transition-colors ${
                                                transactionTab === tab.key
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {tab.label} ({tab.count})
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                    {transactions
                                        .filter(tx => {
                                            if (transactionTab === 'inkomsten') return tx.type === 'income';
                                            if (transactionTab === 'uitgaven') return tx.type === 'expense';
                                            return true;
                                        })
                                        .map((tx) => {
                                        const Icon = tx.icon;
                                        return (
                                            <div 
                                                key={tx.id}
                                                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {tx.category} · {formatDate(tx.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {tx.type === 'income' ? '+' : '−'}€ {tx.amount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Bon Scanner */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                📷 Bon Scanner
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                                onClick={() => setShowScanModal(true)}
                            >
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-3">Scan een bon en koppel aan potje</p>
                                <Button variant="outline" className="bg-gray-100 border-0 hover:bg-gray-200">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Selecteer of maak foto
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Uitgaven per Potje */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Budgetverdeling</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {potBreakdown.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-2">Geen potjes gevonden</p>
                                ) : (
                                    potBreakdown.map((pot) => {
                                        const budgetPercentage = totalIncome > 0 ? Math.round((pot.budget / totalIncome) * 100) : 0;
                                        const spentPercentage = pot.budget > 0 ? Math.round((pot.amount / pot.budget) * 100) : 0;
                                        return (
                                            <div key={pot.name} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{pot.icon}</span>
                                                        <span className="text-sm text-gray-700">{pot.name}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">{budgetPercentage}% van inkomen</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all ${spentPercentage > 100 ? 'bg-red-500' : spentPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>€{pot.amount.toFixed(0)} uitgegeven</span>
                                                    <span>€{pot.budget.toFixed(0)} budget</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Smart Suggestions */}
                    <SmartSuggestions 
                        userEmail={user?.email} 
                        totalIncome={totalIncome} 
                    />
                </div>
            </div>

            {/* Budget Overzicht Card - onderaan en inklapbaar */}
            <BudgetOverviewCard 
                userEmail={user?.email}
                onPlanBudget={() => setShowBudgetPlanner(true)}
                onRefresh={setBudgetOverviewRefresh}
            />

            {/* Uitgeleende Leningen Widget */}
            <LentLoansWidget userEmail={user?.email} />

                </TabsContent>

                {/* Tab 2: Budget Verdelen */}
                <TabsContent value="verdelen">
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-semibold text-blue-900 mb-1">📊 Leer Budgetteren</h3>
                            <p className="text-sm text-blue-800">
                                Hier kun je je beschikbare geld verdelen over je potjes. 
                                Sleep de schuifjes om te bepalen hoeveel je aan elke categorie wilt besteden.
                                Probeer je budget zo te verdelen dat je aan het eind van de maand geld overhoudt!
                            </p>
                        </div>
                        
                        <BudgetAllocationSliders
                            availableForPots={availableForPots}
                            totalIncome={totalIncome}
                            fixedCosts={fixedCosts}
                            userEmail={user?.email}
                            onUpdate={loadData}
                        />
                    </div>
                </TabsContent>

                {/* Tab 3: Voortgang per Potje */}
                <TabsContent value="voortgang">
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <h3 className="font-semibold text-green-900 mb-1">📈 Realtime Feedback</h3>
                            <p className="text-sm text-green-800">
                                Hier zie je precies hoeveel je hebt uitgegeven per potje en hoeveel je nog over hebt.
                                Groen = goed op schema, Geel = bijna op, Rood = over budget.
                            </p>
                        </div>

                        <PotProgressCards
                            userEmail={user?.email}
                            periodStart={startDate}
                            periodEnd={endDate}
                        />

                        {/* Smart Suggestions */}
                        <SmartSuggestions 
                            userEmail={user?.email} 
                            totalIncome={totalIncome} 
                        />
                    </div>
                </TabsContent>

                {/* Tab 4: Historisch Overzicht */}
                <TabsContent value="historie">
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h3 className="font-semibold text-purple-900 mb-1">📚 Leer van je Verleden</h3>
                            <p className="text-sm text-purple-800">
                                Bekijk hoe je bestedingspatroon zich ontwikkelt over de maanden. 
                                Zo kun je zien waar je verbetert en waar nog ruimte is voor groei.
                            </p>
                        </div>

                        <BudgetHistory userEmail={user?.email} />
                    </div>
                </TabsContent>
            </Tabs>

            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadData()}
                userEmail={user?.email}
            />

            <BudgetInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />

            <MonthlyBudgetPlanner
                isOpen={showBudgetPlanner}
                onClose={() => setShowBudgetPlanner(false)}
                user={user}
                onBudgetSet={(budgetData) => {
                    console.log('📋 Budget ingesteld, refreshing overview...');
                    // Refresh budget overview
                    if (budgetOverviewRefresh) {
                        console.log('🔄 Calling budgetOverviewRefresh...');
                        budgetOverviewRefresh();
                    } else {
                        console.warn('⚠️ budgetOverviewRefresh is not set!');
                    }

                    toast({ 
                        title: '✅ Budget ingesteld!', 
                        description: `Je hebt €${budgetData.availableMoney?.toFixed(2)} verdeeld over je potjes.`
                    });
                }}
            />

            {/* Bon Scan Modal */}
            <Dialog open={showScanModal} onOpenChange={(open) => {
                setShowScanModal(open);
                if (!open) {
                    setScannedData(null);
                    setScanning(false);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            📷 Bon Scannen
                        </DialogTitle>
                    </DialogHeader>

                    {!scannedData ? (
                        <div className="space-y-4 py-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    Upload een foto van je kassabon. De AI leest automatisch de winkel, het bedrag en de datum.
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                {scanning ? (
                                    <div className="space-y-3">
                                        <Loader2 className="w-10 h-10 text-gray-400 mx-auto animate-spin" />
                                        <p className="text-sm text-gray-600">Bon wordt verwerkt...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-4">Upload een foto van je bon</p>
                                        
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            id="bon-upload-budget"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                
                                                setScanning(true);
                                                try {
                                                    const uploadResult = await base44.integrations.Core.UploadFile({ file });
                                                    
                                                    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
                                                        file_url: uploadResult.file_url,
                                                        json_schema: {
                                                            type: "object",
                                                            properties: {
                                                                merchant: { type: "string", description: "Naam van de winkel" },
                                                                date: { type: "string", description: "Datum van aankoop (YYYY-MM-DD)" },
                                                                total: { type: "number", description: "Totaalbedrag" }
                                                            }
                                                        }
                                                    });
                                                    
                                                    if (extractResult.status === 'success' && extractResult.output) {
                                                        setScannedData({
                                                            merchant: extractResult.output.merchant || 'Gescande bon',
                                                            date: extractResult.output.date || new Date().toISOString().split('T')[0],
                                                            amount: extractResult.output.total || 0,
                                                            selectedPot: ''
                                                        });
                                                    } else {
                                                        throw new Error('Kon bon niet lezen');
                                                    }
                                                } catch (error) {
                                                    console.error('Scan error:', error);
                                                    toast({ 
                                                        title: '❌ Fout bij scannen', 
                                                        description: error.message,
                                                        variant: 'destructive' 
                                                    });
                                                    setScanning(false);
                                                }
                                            }}
                                        />
                                        
                                        <label htmlFor="bon-upload-budget">
                                            <Button type="button" className="bg-[#386641] hover:bg-[#2A4B30]" asChild>
                                                <span className="cursor-pointer">
                                                    <Camera className="w-4 h-4 mr-2" />
                                                    Maak foto / Upload
                                                </span>
                                            </Button>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800">
                                    ✅ Bon gescand! Controleer de gegevens en kies een potje.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label>Winkel / Beschrijving</Label>
                                    <Input
                                        value={scannedData.merchant}
                                        onChange={(e) => setScannedData({...scannedData, merchant: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Bedrag (€)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={scannedData.amount}
                                            onChange={(e) => setScannedData({...scannedData, amount: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Datum</Label>
                                        <Input
                                            type="date"
                                            value={scannedData.date}
                                            onChange={(e) => setScannedData({...scannedData, date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>🏺 Koppel aan potje</Label>
                                    <Select 
                                        value={scannedData.selectedPot} 
                                        onValueChange={(value) => setScannedData({...scannedData, selectedPot: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kies een potje..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="geen">Geen potje (algemene uitgave)</SelectItem>
                                            {allPots.map(pot => (
                                                <SelectItem key={pot.id} value={pot.id}>
                                                    {pot.icon} {pot.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Door een potje te kiezen wordt de uitgave automatisch bijgehouden
                                    </p>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setScannedData(null);
                                        setScanning(false);
                                    }}
                                >
                                    Opnieuw scannen
                                </Button>
                                <Button
                                    className="bg-[#386641] hover:bg-[#2A4B30]"
                                    onClick={async () => {
                                        try {
                                            // Create transaction
                                            await Transaction.create({
                                                type: 'expense',
                                                amount: scannedData.amount,
                                                category: scannedData.selectedPot && scannedData.selectedPot !== 'geen' 
                                                    ? allPots.find(p => p.id === scannedData.selectedPot)?.name || 'Overig'
                                                    : 'Overig',
                                                description: scannedData.merchant,
                                                date: scannedData.date
                                            });

                                            // Update pot spent amount if linked
                                            if (scannedData.selectedPot && scannedData.selectedPot !== 'geen') {
                                                const pot = allPots.find(p => p.id === scannedData.selectedPot);
                                                if (pot) {
                                                    await Pot.update(pot.id, {
                                                        spent: (parseFloat(pot.spent) || 0) + scannedData.amount
                                                    });
                                                }
                                            }

                                            toast({ 
                                                title: '✅ Uitgave opgeslagen!', 
                                                description: scannedData.selectedPot && scannedData.selectedPot !== 'geen'
                                                    ? `Gekoppeld aan ${allPots.find(p => p.id === scannedData.selectedPot)?.name}`
                                                    : 'Als algemene uitgave'
                                            });

                                            setShowScanModal(false);
                                            setScannedData(null);
                                            loadData();
                                        } catch (error) {
                                            console.error('Error saving:', error);
                                            toast({ 
                                                title: '❌ Fout bij opslaan', 
                                                description: error.message,
                                                variant: 'destructive' 
                                            });
                                        }
                                    }}
                                >
                                    💾 Opslaan
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}