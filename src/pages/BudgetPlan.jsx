import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Income } from '@/api/entities';
import { MonthlyCost } from '@/api/entities';
import { Debt } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Pot } from '@/api/entities';
import { Expense } from '@/api/entities';
import { createPageUrl } from '@/utils';
import AddTransactionModal from '@/components/budget/AddTransactionModal';
import AddBudgetCategoryModal from '@/components/budget/AddBudgetCategoryModal';
import BankStatementScanModal from '@/components/income/BankStatementScanModal';

export default function BudgetPlan() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('overzicht');
    const [transactionFilter, setTransactionFilter] = useState('Alles');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [period, setPeriod] = useState('Maand');
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBankStatementModal, setShowBankStatementModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, transaction: null });
    const [deleting, setDeleting] = useState(false);

    // Financial data
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [fixedCosts, setFixedCosts] = useState(0);
    const [debtPayments, setDebtPayments] = useState(0);
    const [saldo, setSaldo] = useState(0);
    const [availableBudget, setAvailableBudget] = useState(0);
    
    // Transaction list & categories
    const [transactions, setTransactions] = useState([]);
    const [potBreakdown, setPotBreakdown] = useState([]);
    const [allPots, setAllPots] = useState([]);
    const [debts, setDebts] = useState([]);
    const [budgetCategories, setBudgetCategories] = useState([]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        loadData();
    }, []);
    
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [selectedMonth, period]);

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const getPeriodBounds = () => {
        const today = new Date(selectedMonth);
        today.setHours(0, 0, 0, 0);
        
        let startDate, endDate;
        
        if (period === 'Maand') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
        } else if (period === 'Week') {
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(today.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
        } else if (period === 'Dag') {
                startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
        } else {
            // 2-wekelijks
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 15);
                endDate.setHours(23, 59, 59, 999);
        }
        
        return { startDate, endDate, today };
    };

    const loadData = async () => {
        try {
            if (!user) {
                setLoading(true);
            }
            
            const userData = await User.me();
            setUser(userData);

            const { startDate, endDate } = getPeriodBounds();

            // Load income
            const incomeData = await Income.filter({ user_id: userData.id });
            const filteredIncome = incomeData.filter(income => {
                if (income.income_type === 'vast') {
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

            // Load monthly costs
            const monthlyCostsData = await MonthlyCost.filter({
                status: 'actief',
                user_id: userData.id
            });
            
            const today = new Date(selectedMonth);
            const filteredCosts = monthlyCostsData.filter(cost => {
                const paymentDay = cost.payment_date || 1;
                const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            
            const monthlyCostsTotal = filteredCosts.reduce((sum, cost) => 
                sum + (parseFloat(cost.amount) || 0), 0
            );

            // Load debts
            const debtsData = await Debt.filter({
                status: 'betalingsregeling',
                user_id: userData.id
            });

            // Filter debts: only show if the payment_plan_date has started (not future)
            // AND if the recurring payment day falls within this period
            const filteredDebts = debtsData.filter(debt => {
                if (!debt.payment_plan_date) return false;

                const planStartDate = new Date(debt.payment_plan_date);
                planStartDate.setHours(0, 0, 0, 0);

                // Don't show if the plan hasn't started yet
                if (planStartDate > endDate) return false;

                // Get the payment day of month from the plan start date
                const paymentDay = planStartDate.getDate();

                // Create the payment date for the CURRENT selected month
                const paymentDateThisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDay);

                // Check if payment date falls within the selected period
                return paymentDateThisMonth >= startDate && paymentDateThisMonth <= endDate;
            });

            const debtPaymentsTotal = filteredDebts.reduce((sum, debt) =>
                sum + (parseFloat(debt.monthly_payment) || 0), 0
            );
            setDebts(filteredDebts);

            // Load transactions (exclude debt_payments to avoid double counting)
            const transactionsData = await Transaction.filter({ user_id: userData.id });
            const filteredTransactions = transactionsData.filter(tx => {
                if (!tx || !tx.date) return false;
                const txDate = new Date(tx.date);
                // Exclude debt_payments category - these are already counted via Debt betalingsregeling
                if (tx.category === 'debt_payments') return false;
                return txDate >= startDate && txDate <= endDate;
            });

            const periodExpenses = filteredTransactions
                .filter(tx => tx && tx.type === 'expense')
                .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

            const expensesTotal = monthlyCostsTotal + debtPaymentsTotal + periodExpenses;
            const saldoTotal = incomeTotal - expensesTotal;
            const fixedTotal = monthlyCostsTotal + debtPaymentsTotal;
            const available = incomeTotal - expensesTotal;

            setTotalIncome(incomeTotal);
            setTotalExpenses(expensesTotal);
            setFixedCosts(fixedTotal);
            setDebtPayments(debtPaymentsTotal);
            setSaldo(saldoTotal);
            setAvailableBudget(available);

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
                    category: 'Inkomen'
                })),
                ...filteredCosts.map(cost => ({
                    id: `cost-${cost.id}`,
                    type: 'expense',
                    description: cost.name,
                    amount: parseFloat(cost.amount),
                    date: cost.start_date || new Date().toISOString().split('T')[0],
                    category: cost.category === 'wonen' ? 'Wonen' : 
                              cost.category === 'abonnementen' || cost.category === 'streaming_diensten' ? 'Abonnementen' :
                              cost.category || 'Overig'
                })),
                ...filteredDebts.map(debt => ({
                    id: `debt-${debt.id}`,
                    type: 'expense',
                    description: `${debt.creditor_name} (Regeling)`,
                    amount: parseFloat(debt.monthly_payment),
                    date: debt.payment_plan_date,
                    category: 'Betalingsregeling'
                })),
                ...filteredTransactions.filter(tx => tx && tx.type === 'expense').map(tx => ({
                    id: `tx-${tx.id}`,
                    type: 'expense',
                    description: tx.description || 'Uitgave',
                    amount: parseFloat(tx.amount),
                    date: tx.date,
                    category: tx.category || 'Boodschappen'
                }))
            ];

            allTransactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            setTransactions(allTransactions);

            // Load pots
            const potsData = await Pot.filter({ user_id: userData.id });
            const expensePots = potsData.filter(p => p.pot_type === 'expense');
            
            const potColors = {
                'Wonen': '#10b77f',
                'Boodschappen': '#ef4444',
                'Vervoer': '#3b82f6',
                'Abonnementen': '#8b5cf6',
                'Overig': '#f59e0b'
            };
            
            // Calculate category breakdown
            const categoryMap = {};
            allTransactions.filter(tx => tx && tx.type === 'expense').forEach(tx => {
                const cat = tx.category || 'Overig';
                if (!categoryMap[cat]) {
                    categoryMap[cat] = { amount: 0, budget: 0 };
                }
                categoryMap[cat].amount += tx.amount;
            });

            // Match with pots for budgets
            expensePots.forEach(pot => {
                const catName = pot.name || 'Overig';
                if (categoryMap[catName]) {
                    categoryMap[catName].budget = parseFloat(pot.budget || 0);
                }
            });

            // Set budget for Betalingsregeling based on total monthly debt payments
            if (categoryMap['Betalingsregeling']) {
                categoryMap['Betalingsregeling'].budget = debtPaymentsTotal;
            }

            const breakdown = Object.entries(categoryMap).map(([name, data]) => ({
                name,
                amount: data.amount,
                budget: data.budget || 0,
                color: potColors[name] || '#6b7280',
                percentage: expensesTotal > 0 ? Math.round((data.amount / expensesTotal) * 100) : 0,
                remaining: (data.budget || 0) - data.amount,
                isOverBudget: data.amount > (data.budget || 0)
            })).sort((a, b) => b.amount - a.amount);

            setPotBreakdown(breakdown);
            setAllPots(expensePots);
            setBudgetCategories(breakdown);

        } catch (error) {
            console.error('Error loading budget data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (transaction) => {
        if (!transaction || !transaction.id) return;

        setDeleting(true);
        try {
            const [type, id] = transaction.id.split('-');

            switch (type) {
                case 'income':
                    await Income.delete(id);
                    break;
                case 'cost':
                    await MonthlyCost.delete(id);
                    break;
                case 'debt':
                    // Don't delete the debt itself, just skip for now
                    // Debts should be managed on the debts page
                    break;
                case 'tx':
                    await Transaction.delete(id);
                    break;
                default:
                    console.error('Unknown transaction type:', type);
            }

            setDeleteConfirm({ show: false, transaction: null });
            await loadData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2 
        }).format(amount);
    };

    const getMonthName = (date) => {
        return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    };

    const getPeriodDisplay = () => {
        const { startDate, endDate } = getPeriodBounds();
        if (period === 'Maand') {
            return `${startDate.getDate()} - ${endDate.getDate()} ${getMonthName(selectedMonth)}`;
        } else if (period === 'Week') {
            return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`;
        } else if (period === 'Dag') {
            return startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
        } else {
            return `${startDate.getDate()} - ${endDate.getDate()} ${getMonthName(selectedMonth)}`;
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        if (!tx) return false;
        if (transactionFilter === 'Inkomen' && tx.type !== 'income') return false;
        if (transactionFilter === 'Uitgaven' && tx.type !== 'expense') return false;
        if (transactionFilter === 'Betalingsregelingen' && tx.category !== 'Betalingsregeling') return false;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (tx.description || '').toLowerCase().includes(searchLower) ||
                   (tx.category || '').toLowerCase().includes(searchLower);
        }
        
        return true;
    });

    const getCategoryIcon = (category) => {
        const icons = {
            'Wonen': 'home',
            'Boodschappen': 'shopping_cart',
            'Vervoer': 'directions_car',
            'Transport': 'directions_car',
            'Abonnementen': 'smartphone',
            'Inkomen': 'trending_up',
            'Betalingsregeling': 'handshake',
            'Overig': 'more_horiz',
            'Energie & Water': 'bolt'
        };
        return icons[category] || 'category';
    };

    const getCategoryColor = (category, type) => {
        if (type === 'income') return '#10b77f';
        const colors = {
            'Wonen': '#10b77f',
            'Boodschappen': '#ef4444',
            'Vervoer': '#3b82f6',
            'Transport': '#3b82f6',
            'Abonnementen': '#8b5cf6',
            'Overig': '#f59e0b',
            'Energie & Water': '#f59e0b'
        };
        return colors[category] || '#6b7280';
    };

    const getDonutChartData = () => {
        const colors = ['#10b77f', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b'];
        let currentPercent = 0;
        return potBreakdown.slice(0, 5).map((cat, idx) => {
            const start = currentPercent;
            currentPercent += cat.percentage;
            return {
                ...cat,
                startPercent: start,
                endPercent: currentPercent,
                color: colors[idx % colors.length]
            };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-600"></div>
            </div>
        );
    }

    const donutData = getDonutChartData();
    const budgetPercentage = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
    const remainingPercentage = 100 - budgetPercentage;

    return (
        <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a]">
            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col gap-8">
                {/* Page Header */}
                <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl">pie_chart</span>
                            <h1 className="text-[#1F2937] dark:text-white text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Budgetplan</h1>
                            <button className="text-gray-400 dark:text-[#a1a1a1] hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[18px] sm:text-[22px]">help</span>
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-[#a1a1a1] text-sm sm:text-base md:text-lg font-medium pl-1">Stel je maandelijkse budget samen en houd overzicht</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto flex-wrap">
                        <button
                            onClick={() => setShowBankStatementModal(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-[#a1a1a1] px-3 sm:px-5 py-2 sm:py-3 rounded-[24px] font-bold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[16px] sm:text-[20px]">qr_code_scanner</span>
                            <span className="hidden xs:inline">Scan</span>
                        </button>
                        <Link
                            to="/BudgetHelp"
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-[#a1a1a1] px-3 sm:px-5 py-2 sm:py-3 rounded-[24px] font-bold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[16px] sm:text-[20px]">help</span>
                            <span className="hidden xs:inline">Hulp</span>
                        </Link>
                        <button
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 sm:gap-2 bg-primary text-white px-3 sm:px-6 py-2 sm:py-3 rounded-[24px] font-bold text-xs sm:text-sm hover:bg-[#059669] hover:scale-[1.02] transition-all shadow-lg shadow-primary/30"
                            onClick={() => setShowCategoryModal(true)}
                        >
                            <span className="material-symbols-outlined text-[16px] sm:text-[20px]">add</span>
                            <span className="hidden xs:inline">Nieuw</span>
                        </button>
                    </div>
                </section>

                {/* Period Filter Bar */}
                <section className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-2 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Period Toggles */}
                    <div className="flex bg-transparent rounded-xl p-1 w-full md:w-auto overflow-x-auto scrollbar-hide">
                        {['Dag', 'Week', '2-wekelijks', 'Maand'].map((p) => (
                            <label key={p} className="cursor-pointer">
                                <input 
                                    className="peer sr-only" 
                                    name="period" 
                                    type="radio"
                                    checked={period === p}
                                    onChange={() => setPeriod(p)}
                                />
                                <span className={`block px-6 py-2 rounded-[24px] text-sm font-semibold transition-all ${
                                    period === p
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                                }`}>{p}</span>
                            </label>
                        ))}
                    </div>
                    {/* Date Selector */}
                    <div className="flex items-center gap-3 pr-2 w-full md:w-auto justify-between md:justify-end">
                        <button 
                            onClick={() => {
                                const newMonth = new Date(selectedMonth);
                                newMonth.setMonth(newMonth.getMonth() - 1);
                                setSelectedMonth(newMonth);
                            }}
                            className="size-9 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-[#1F2937] dark:text-white font-bold text-sm md:text-base">{getPeriodDisplay()}</span>
                            <button className="size-9 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                const newMonth = new Date(selectedMonth);
                                newMonth.setMonth(newMonth.getMonth() + 1);
                                setSelectedMonth(newMonth);
                            }}
                            className="size-9 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                </div>
                </section>

                {/* Hero Budget Card */}
                <section className="relative w-full overflow-hidden rounded-[16px] sm:rounded-[24px] bg-gradient-to-br from-primary to-[#059669] p-4 sm:p-8 md:p-10 shadow-[0_8px_24px_rgba(16,185,129,0.3)] text-white">
                    {/* Decorative circle */}
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-8 relative z-10">
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex items-center gap-2 text-white/90">
                                <span className="material-symbols-outlined text-[16px] sm:text-[20px]">account_balance_wallet</span>
                                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">Totaal Beschikbaar</span>
                            </div>
                            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">{formatCurrency(totalIncome)}</div>
                            <div className="mt-2 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 items-center">
                                <div className="inline-flex items-center backdrop-blur-md bg-white/15 rounded-xl px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-semibold border border-white/10">
                                    UITGEGEVEN: {formatCurrency(totalExpenses)}
                                </div>
                            </div>
                            {/* Alert Box */}
                            {budgetPercentage > 70 && (
                                <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl backdrop-blur-md bg-red-500/15 border-l-4 border-red-500 max-w-xl">
                                    <span className="material-symbols-outlined text-red-100 shrink-0 text-[18px] sm:text-[24px]">error</span>
                                    <p className="text-xs sm:text-sm text-red-50 font-medium leading-relaxed">
                                        Je budget is bijna op! Nog {remainingPercentage}% over deze {period.toLowerCase()}.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-start lg:items-end gap-1 sm:gap-2 min-w-0 sm:min-w-[200px]">
                            <span className="text-white/80 text-xs sm:text-sm font-bold tracking-wider uppercase">Nog Over</span>
                            <div className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white">{formatCurrency(availableBudget)}</div>
                        </div>
                    </div>
                </section>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* LEFT COLUMN (45%) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Breakdown Card */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a]">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-purple-500">pie_chart</span>
                                    <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">Uitsplitsing</h3>
                                </div>
                                <button className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white">
                                    <span className="material-symbols-outlined">expand_less</span>
                                        </button>
                            </div>
                            {/* Donut Chart Area */}
                            <div className="flex flex-col items-center justify-center py-4 relative">
                                <div className="relative size-56 rounded-full" style={{
                                    background: `conic-gradient(${donutData.map((d, i) => `${d.color} ${d.startPercent}% ${d.endPercent}%`).join(', ')})`
                                }}>
                                    <div className="absolute inset-0 m-auto size-40 bg-white dark:bg-[#1a1a1a] rounded-full flex flex-col items-center justify-center shadow-inner">
                                        <span className="text-[11px] font-bold text-gray-400 dark:text-[#a1a1a1] uppercase tracking-wide">Uitgegeven</span>
                                        <span className="text-2xl font-extrabold text-[#1F2937] dark:text-white">{formatCurrency(totalExpenses)}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Legend */}
                            <div className="mt-6 flex flex-col gap-3">
                                {potBreakdown.slice(0, 5).map((category) => (
                                    <div key={category.name} className="flex justify-between items-center text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <span className="size-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                                            <span className="text-gray-600 dark:text-gray-300">{category.name}</span>
                                        </div>
                                        <span className="font-bold text-[#1F2937] dark:text-white">{category.percentage}%</span>
                                    </div>
                                    ))}
                                </div>
                                                    </div>

                        {/* Timeline Chart Placeholder */}
                        <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] flex-1">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">Budget Overzicht</h3>
                                <div className="flex bg-gray-100 dark:bg-[#111] p-1 rounded-lg">
                                    <button className="px-3 py-1 text-xs font-bold text-white bg-primary rounded-md shadow-sm">Maand</button>
                                    <button className="px-3 py-1 text-xs font-bold text-gray-500 dark:text-[#a1a1a1] rounded-md hover:text-gray-900 dark:hover:text-white">Jaar</button>
                                                    </div>
                                                </div>
                            {/* Chart Visual (CSS Bars) */}
                            <div className="h-48 flex items-end justify-between gap-2 text-xs text-gray-400 dark:text-[#a1a1a1] font-medium">
                                {['Sep', 'Okt', 'Nov', 'Dec', 'Jan', 'Feb'].map((month, idx) => (
                                    <div key={month} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className={`w-full rounded-t-lg h-[${60 + idx * 10}%] group-hover:opacity-80 transition-all relative ${
                                            month === 'Jan' ? 'bg-primary' : 'bg-gray-100 dark:bg-[#2a2a2a]'
                                        }`} style={{ height: `${60 + idx * 10}%` }}>
                                            {month === 'Jan' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-[#2a2a2a] text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 opacity-0 group-hover:opacity-100">
                                                    {formatCurrency(totalExpenses)}
                                            </div>
                                            )}
                                </div>
                                        <span className={month === 'Jan' ? 'text-primary font-bold' : ''}>{month}</span>
                            </div>
                                ))}
                            </div>
                        </div>
                </div>

                    {/* RIGHT COLUMN (55%) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#1F2937] dark:text-white">home_app_logo</span>
                                <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white">Mijn Budget Categorieën</h2>
                            </div>
                            <button 
                                className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-[24px] text-sm font-bold hover:bg-[#059669] transition-colors shadow-sm"
                                onClick={() => setShowCategoryModal(true)}
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                <span>Categorie</span>
                            </button>
                            </div>
                        <div className="flex flex-col gap-4">
                            {budgetCategories.map((category) => {
                                const percentage = category.budget > 0 ? Math.round((category.amount / category.budget) * 100) : 0;
                                const icon = getCategoryIcon(category.name);
                                const status = category.isOverBudget ? 'Overschreden' : percentage > 80 ? 'Bijna op' : 'Op koers';
                                const statusColor = category.isOverBudget ? 'red' : percentage > 80 ? 'yellow' : 'primary';
                                
                                        return (
                                    <div key={category.name} className="bg-[#1F2937] dark:bg-[#1a1a1a] text-white rounded-[24px] p-5 cursor-pointer hover:translate-x-1 transition-transform duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-[#2a2a2a] group">
                                        <div className="flex gap-4 items-start">
                                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                statusColor === 'red' ? 'bg-red-500/20 text-red-400' :
                                                statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-primary/20 text-primary'
                                            }`}>
                                                <span className="material-symbols-outlined">{icon}</span>
                                                    </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-lg leading-tight">{category.name}</h4>
                                                        <span className="text-xs text-white/50 font-medium">Maandelijks</span>
                                                </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                                                        statusColor === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                                        statusColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                                        'bg-primary/20 text-primary border-primary/20'
                                                    }`}>{status}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 dark:bg-[#333] h-2 rounded-full overflow-hidden mb-3">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            statusColor === 'red' ? 'bg-red-500' :
                                                            statusColor === 'yellow' ? 'bg-yellow-500' :
                                                            'bg-primary'
                                                        }`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="text-xs space-y-0.5">
                                                        <div className="text-white/80">Besteed: <span className="font-bold">{formatCurrency(category.amount)}</span></div>
                                                        <div className="text-white/40">Budget: {formatCurrency(category.budget || 0)}</div>
                                                </div>
                                                    <div className="text-right">
                                                        <div className={`font-bold text-lg ${
                                                            category.isOverBudget ? 'text-red-400' : 'text-primary'
                                                        }`}>
                                                            {category.isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(category.remaining))}
                                            </div>
                                                        <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                                                            {category.isOverBudget ? 'Tekort' : 'Over'}
                            </div>
                </div>
            </div>
                        </div>
                    </div>
                        </div>
                                );
                            })}
                    </div>
                        </div>
                    </div>

                {/* Transactions Section */}
                <section className="bg-white dark:bg-[#1a1a1a] rounded-[16px] sm:rounded-[24px] p-4 sm:p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] mb-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-white">Transacties</h3>
                        <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a1a1a1] text-[18px] sm:text-[20px]">search</span>
                                <input
                                    className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] text-xs sm:text-sm rounded-[24px] pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary w-full outline-none transition-all placeholder:text-gray-400 dark:placeholder-[#a1a1a1] font-medium text-[#1F2937] dark:text-white"
                                    placeholder="Zoek..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-3 sm:px-4 py-2 sm:py-2.5 rounded-[24px] text-xs sm:text-sm font-bold text-gray-600 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors">
                                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">swap_vert</span>
                                <span className="hidden sm:inline">Sorteer</span>
                            </button>
                            <button className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#2a2a2a] px-3 sm:px-4 py-2 sm:py-2.5 rounded-[24px] text-xs sm:text-sm font-bold text-gray-600 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#333] transition-colors">
                                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">filter_list</span>
                                <span className="hidden sm:inline">Filter</span>
                            </button>
                        </div>
                    </div>
                    {/* Filter Tabs */}
                    <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide mb-4 sm:mb-6 border-b border-gray-100 dark:border-[#2a2a2a] pb-2">
                        {['Alles bekijken', 'Inkomen', 'Uitgaven', 'Betalingsregelingen'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Alles bekijken') setTransactionFilter('Alles');
                                    else if (tab === 'Inkomen') setTransactionFilter('Inkomen');
                                    else if (tab === 'Uitgaven') setTransactionFilter('Uitgaven');
                                    else setTransactionFilter('Betalingsregelingen');
                                }}
                                className={`whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border border-transparent transition-colors ${
                                    (tab === 'Alles bekijken' && transactionFilter === 'Alles') ||
                                    (tab === 'Inkomen' && transactionFilter === 'Inkomen') ||
                                    (tab === 'Uitgaven' && transactionFilter === 'Uitgaven') ||
                                    (tab === 'Betalingsregelingen' && transactionFilter === 'Betalingsregelingen')
                                        ? 'text-primary bg-primary/10 border-primary/20'
                                        : 'text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white'
                                }`}
                            >
                                {tab === 'Alles bekijken' ? 'Alles' : tab === 'Betalingsregelingen' ? 'Regelingen' : tab}
                            </button>
                        ))}
                            </div>
                    {/* Transaction List */}
                    <div className="flex flex-col gap-2 sm:gap-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-[#a1a1a1]">
                                <p className="text-sm">Geen transacties gevonden</p>
                            </div>
                        ) : (
                            filteredTransactions.map((tx) => {
                                if (!tx) return null;
                                const isIncome = tx.type === 'income';
                                const categoryColor = getCategoryColor(tx.category, tx.type);
                                const icon = getCategoryIcon(tx.category);

                                return (
                                    <div
                                        key={tx.id}
                                        className="group bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-[16px] sm:rounded-[24px] p-3 sm:p-4 hover:bg-white dark:hover:bg-[#282828] hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div 
                                                className={`size-11 rounded-xl flex items-center justify-center transition-colors ${
                                                    isIncome ? 'bg-primary/10 text-primary' : 
                                                    categoryColor === '#ef4444' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                                    categoryColor === '#3b82f6' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                    'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                                } group-hover:scale-105`}
                                            >
                                                <span className="material-symbols-outlined">{icon}</span>
                                </div>
                                    <div>
                                                <p className="font-bold text-[#1F2937] dark:text-white">{tx.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-[#a1a1a1] font-medium mt-0.5">{tx.category} • {formatDate(tx.date)}</p>
                                    </div>
                                    </div>
                                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-14 sm:pl-0">
                                            <span className={`font-extrabold text-lg ${
                                                isIncome ? 'text-primary' : 'text-[#1F2937] dark:text-white'
                                            }`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                isIncome
                                                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-300'
                                            }`}>Voltooid</span>
                                            {!tx.id.startsWith('debt-') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirm({ show: true, transaction: tx });
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
                                                    title="Verwijderen"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            )}
                                </div>
                                </div>
                                );
                            })
                        )}
                            </div>
                    {/* Pagination */}
                    <div className="mt-8 flex justify-center items-center gap-2">
                        <button className="size-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm shadow-sm">1</button>
                        <button className="size-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white font-bold text-sm transition-colors">2</button>
                        <button className="size-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white font-bold text-sm transition-colors">3</button>
                        <span className="text-gray-400 dark:text-[#a1a1a1] text-sm">...</span>
                        <button className="size-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#a1a1a1] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-700 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-8 right-8 z-40">
                <button className="size-16 rounded-full bg-gradient-to-br from-primary to-[#059669] text-white shadow-lg hover:shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group" title="Leencapaciteit Calculator">
                    <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">calculate</span>
                </button>
            </div>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadData()}
                userEmail={user?.email}
            />

            {/* Add Budget Category Modal */}
            <AddBudgetCategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSuccess={() => loadData()}
                monthlyIncome={totalIncome}
            />

            {/* Bank Statement Scan Modal */}
            <BankStatementScanModal
                isOpen={showBankStatementModal}
                onClose={() => setShowBankStatementModal(false)}
                onSuccess={() => {
                    setShowBankStatementModal(false);
                    loadData();
                }}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">delete</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">Transactie verwijderen</h3>
                                <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Deze actie kan niet ongedaan worden gemaakt</p>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Weet je zeker dat je <span className="font-bold">{deleteConfirm.transaction?.description}</span> van {formatCurrency(deleteConfirm.transaction?.amount || 0)} wilt verwijderen?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, transaction: null })}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#222] transition-colors disabled:opacity-50"
                            >
                                Annuleren
                            </button>
                            <button
                                onClick={() => handleDeleteTransaction(deleteConfirm.transaction)}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                        Verwijderen...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                        Verwijderen
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
