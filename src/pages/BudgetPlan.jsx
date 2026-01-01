import React, { useState, useEffect } from 'react';
import { Income } from '@/api/entities';
import { MonthlyCost } from '@/api/entities';
import { Debt } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Pot } from '@/api/entities';
import { createPageUrl } from '@/utils';
import AddTransactionModal from '@/components/budget/AddTransactionModal';

export default function BudgetPlan() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overzicht');
  const [transactionFilter, setTransactionFilter] = useState('Alles');
  const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Financial data
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [fixedCosts, setFixedCosts] = useState(0);
    const [debtPayments, setDebtPayments] = useState(0);
    const [saldo, setSaldo] = useState(0);
    
    // Transaction list & categories
    const [transactions, setTransactions] = useState([]);
    const [potBreakdown, setPotBreakdown] = useState([]);
    const [allPots, setAllPots] = useState([]);
  const [debts, setDebts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
  }, [selectedMonth]);

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
        
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
        
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
            const incomeData = await Income.filter({ created_by: userData.email });
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
                created_by: userData.email 
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
                created_by: userData.email 
            });
            
            const filteredDebts = debtsData.filter(debt => {
                if (!debt.payment_plan_date) return false;
                const paymentDay = new Date(debt.payment_plan_date).getDate();
                const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            
            const debtPaymentsTotal = filteredDebts.reduce((sum, debt) => 
                sum + (parseFloat(debt.monthly_payment) || 0), 0
            );
      setDebts(filteredDebts);

      // Load transactions
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

            setTotalIncome(incomeTotal);
            setTotalExpenses(expensesTotal);
            setFixedCosts(fixedTotal);
            setDebtPayments(debtPaymentsTotal);
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
                ...filteredTransactions.filter(tx => tx.type === 'expense').map(tx => ({
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
            const potsData = await Pot.filter({ created_by: userData.email });
            const expensePots = potsData.filter(p => p.pot_type === 'expense');
            
      const potColors = {
        'Wonen': '#10b77f',
        'Boodschappen': '#3b82f6',
        'Vervoer': '#f59e0b',
        'Abonnementen': '#8b5cf6',
        'Overig': '#ef4444'
      };
            
            const totalPotSpent = expensePots.reduce((sum, pot) => sum + (parseFloat(pot.spent) || 0), 0);
            
      // Calculate category breakdown
      const categoryMap = {};
      allTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
        const cat = tx.category || 'Overig';
        if (!categoryMap[cat]) {
          categoryMap[cat] = 0;
        }
        categoryMap[cat] += tx.amount;
      });

      const breakdown = Object.entries(categoryMap).map(([name, amount]) => ({
        name,
        amount,
        color: potColors[name] || '#6b7280',
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      })).sort((a, b) => b.amount - a.amount);

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

  const filteredTransactions = transactions.filter(tx => {
    // Filter by type
    if (transactionFilter === 'Inkomsten' && tx.type !== 'income') return false;
    if (transactionFilter === 'Uitgaven' && tx.type !== 'expense') return false;
    
    // Filter by search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return tx.description.toLowerCase().includes(searchLower) || 
             tx.category.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'Wonen': 'home',
      'Boodschappen': 'shopping_cart',
      'Vervoer': 'directions_car',
      'Abonnementen': 'smartphone',
      'Inkomen': 'arrow_upward',
      'Betalingsregeling': 'handshake',
      'Overig': 'more_horiz'
    };
    return icons[category] || 'category';
  };

  const getCategoryColor = (category, type) => {
    if (type === 'income') return '#10b77f';
    const colors = {
      'Wonen': '#10b77f',
      'Boodschappen': '#3b82f6',
      'Vervoer': '#f59e0b',
      'Abonnementen': '#8b5cf6',
      'Overig': '#ef4444'
    };
    return colors[category] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-600"></div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
      <header className="bg-[#f8fcfa] dark:bg-[#141f1b] border-b border-[#e7f3ef] dark:border-[#2a2a2a] sticky top-0 z-50">
        <div className="px-6 md:px-10 py-3 flex items-center justify-between max-w-[1400px] mx-auto w-full">
          {/* Logo Section */}
          <div className="flex items-center gap-4 text-[#0d1b17] dark:text-white">
            <div className="size-6 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-text-main dark:text-white text-xl font-bold tracking-tight">Konsensi</h2>
          </div>
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-primary text-sm font-bold border-b-2 border-primary pb-1" href={createPageUrl('BudgetPlan')}>Budgetplan</a>
            <a className="text-text-main dark:text-gray-400 hover:text-primary text-sm font-medium transition-colors" href={createPageUrl('Potjes')}>Potjes</a>
            <a className="text-text-main dark:text-gray-400 hover:text-primary text-sm font-medium transition-colors" href={createPageUrl('Settings')}>Instellingen</a>
          </nav>
          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              aria-label="Settings" 
              className="flex items-center justify-center size-10 rounded-full bg-[#e7f3ef] dark:bg-[#2a2a2a] text-text-main dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-[#3a3a3a] transition-colors"
              onClick={() => window.location.href = createPageUrl('Settings')}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button 
              aria-label="Toggle Theme" 
              className="flex items-center justify-center size-10 rounded-full bg-[#e7f3ef] dark:bg-[#2a2a2a] text-text-main dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-[#3a3a3a] transition-colors"
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined text-[20px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
                        <button
              aria-label="User Profile" 
              className="flex items-center justify-center size-10 rounded-full bg-[#e7f3ef] dark:bg-[#2a2a2a] text-text-main dark:text-white hover:bg-[#d0e6dd] dark:hover:bg-[#3a3a3a] transition-colors"
              onClick={() => window.location.href = createPageUrl('Settings')}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
                        </button>
                    </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-extrabold tracking-tight">Budgetplan: Maandoverzicht</h1>
            <p className="text-text-secondary dark:text-gray-400 text-base">Jouw inkomsten en uitgaven op een rij voor {getMonthName(selectedMonth)}</p>
          </div>
          {/* Month Picker */}
          <button 
            className="group flex items-center justify-between gap-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:border-primary/50 dark:hover:border-primary/50 text-text-main dark:text-white px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all min-w-[200px]"
            onClick={() => {
              const newMonth = new Date(selectedMonth);
              newMonth.setMonth(newMonth.getMonth() + 1);
              setSelectedMonth(newMonth);
            }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors text-[20px]">calendar_month</span>
              <span className="font-bold text-sm">{getMonthName(selectedMonth)}</span>
                    </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">expand_more</span>
          </button>
                </div>
                
        {/* Tabs Section */}
        <div className="mb-8 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overzicht')}
              className={`flex items-center justify-center border-b-[3px] pb-3 px-4 transition-colors ${
                activeTab === 'overzicht'
                  ? 'border-primary text-primary dark:text-primary bg-white dark:bg-[#1a1a1a] rounded-t-lg'
                  : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
              }`}
            >
              <span className="text-base font-bold tracking-tight">Overzicht</span>
            </button>
                        <button
              onClick={() => setActiveTab('betalingsregelingen')}
              className={`flex items-center justify-center border-b-[3px] pb-3 px-4 transition-colors ${
                activeTab === 'betalingsregelingen'
                  ? 'border-primary text-primary dark:text-primary bg-white dark:bg-[#1a1a1a] rounded-t-lg'
                  : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
              }`}
            >
              <span className="text-base font-medium tracking-tight">Betalingsregelingen</span>
                        </button>
                </div>
            </div>

        {/* Tab Content: Overzicht */}
        {activeTab === 'overzicht' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Balance & Transactions */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Main Card */}
              <div className="bg-surface-light dark:bg-[#1a1a1a] rounded-2xl p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a]">
                {/* Balance Section */}
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">account_balance_wallet</span>
                    <h2 className="text-text-main dark:text-white text-xl font-bold">Huidig Saldo</h2>
                                </div>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                    <span className={`text-5xl md:text-6xl font-extrabold tracking-tight ${saldo >= 0 ? 'text-primary' : 'text-red-500'}`}>
                      {formatCurrency(saldo)}
                    </span>
                    <span className="text-text-secondary dark:text-gray-400 text-sm pb-2 font-medium">Beschikbaar na vaste lasten en potjes</span>
                                </div>
                            </div>

                {/* Filter & Search Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['Alles', 'Inkomsten', 'Uitgaven'].map((filter) => (
                                        <button
                        key={filter}
                        onClick={() => setTransactionFilter(filter)}
                        className={`flex h-9 items-center px-5 rounded-full text-sm font-bold shadow-sm transition-transform active:scale-95 whitespace-nowrap ${
                          transactionFilter === filter
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-[#2a2a2a] text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] hover:text-text-main dark:hover:text-white'
                        }`}
                      >
                        {filter}
                                        </button>
                                    ))}
                                </div>
                  <div className="relative w-full md:w-auto">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 material-symbols-outlined text-[20px]">search</span>
                    <input 
                      className="w-full md:w-64 pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2a2a2a] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-text-main dark:text-white" 
                      placeholder="Zoek transacties..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Transactions List */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-text-main dark:text-white text-lg font-bold mb-2">Overzicht transacties</h3>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary dark:text-gray-400">
                      <p>Geen transacties gevonden</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const categoryColor = getCategoryColor(tx.category, tx.type);
                      const icon = getCategoryIcon(tx.category);
                      
                                        return (
                                            <div 
                                                key={tx.id}
                          className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors border border-transparent hover:border-gray-100 dark:hover:border-[#2a2a2a] group"
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="size-10 rounded-full flex items-center justify-center transition-colors group-hover:scale-110"
                              style={{
                                backgroundColor: isIncome ? `${categoryColor}1a` : `${categoryColor}1a`,
                                color: categoryColor
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = categoryColor;
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = `${categoryColor}1a`;
                                e.currentTarget.style.color = categoryColor;
                              }}
                            >
                              <span className="material-symbols-outlined">{icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-text-main dark:text-white font-bold text-sm md:text-base">{tx.description}</span>
                              <span className="text-text-secondary dark:text-gray-400 text-xs md:text-sm">{tx.category}</span>
                                                    </div>
                                                </div>
                          <div className="text-right">
                            <p 
                              className="font-bold text-sm md:text-base"
                              style={{ color: categoryColor }}
                            >
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs md:text-sm">{formatDate(tx.date)}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                </div>
            </div>

            {/* Right Column: Spending Categories (Widget) */}
            <div className="lg:col-span-4">
              <div className="bg-surface-light dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a] sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-text-main dark:text-white text-lg font-bold">Uitgaven per Categorie</h3>
                  <span className="text-xs font-bold bg-gray-100 dark:bg-[#2a2a2a] text-text-secondary dark:text-gray-400 px-2 py-1 rounded">
                    {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}% van Budget
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  {potBreakdown.map((category) => {
                    const percentage = totalExpenses > 0 ? Math.round((category.amount / totalExpenses) * 100) : 0;
                    const icon = getCategoryIcon(category.name);
                    
                    return (
                      <div key={category.name} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-text-main dark:text-white font-bold">
                            <span className="material-symbols-outlined text-[18px]" style={{ color: category.color }}>{icon}</span>
                            {category.name}
                          </div>
                          <span className="font-bold">{formatCurrency(category.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-[#333] rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: category.color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Betalingsregelingen */}
        {activeTab === 'betalingsregelingen' && (
          <div className="bg-surface-light dark:bg-[#1a1a1a] rounded-2xl p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2a2a2a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-text-main dark:text-white text-2xl font-bold mb-1">Jouw Betalingsregelingen</h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm">Overzicht van al je actieve en afgeronde betalingsregelingen.</p>
              </div>
              <button 
                className="flex items-center gap-2 bg-primary hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm"
                onClick={() => window.location.href = createPageUrl('debts')}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Nieuwe Betalingsregeling
              </button>
                    </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Schuldeiser</th>
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Bedrag</th>
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Maandelijks</th>
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Volgende Betaaldag</th>
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-2 text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-right">Acties</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {debts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-text-secondary dark:text-gray-400">
                        Geen betalingsregelingen gevonden
                      </td>
                    </tr>
                  ) : (
                    debts.map((debt) => {
                      const nextPayment = debt.payment_plan_date ? new Date(debt.payment_plan_date) : null;
                      const isActive = debt.status === 'betalingsregeling';
                      
                      return (
                        <tr key={debt.id} className="border-b border-gray-50 dark:border-[#222] hover:bg-gray-50/50 dark:hover:bg-[#222] transition-colors">
                          <td className="py-4 px-2 font-bold text-text-main dark:text-white">{debt.creditor_name}</td>
                          <td className="py-4 px-2 text-text-secondary dark:text-gray-400">{formatCurrency(parseFloat(debt.total_amount) || 0)}</td>
                          <td className="py-4 px-2 text-text-main dark:text-white font-medium">{formatCurrency(parseFloat(debt.monthly_payment) || 0)}</td>
                          <td className="py-4 px-2 text-text-secondary dark:text-gray-400">
                            {nextPayment ? formatDate(nextPayment.toISOString()) : '-'}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isActive 
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'
                            }`}>
                              {isActive ? 'Actief' : 'Afgerond'}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right">
                            <a 
                              className="text-primary hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-sm hover:underline" 
                              href={createPageUrl('debts')}
                            >
                              Details
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
                        </div>
                    </div>
        )}
      </main>

      {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => loadData()}
                userEmail={user?.email}
            />
        </div>
    );
}
