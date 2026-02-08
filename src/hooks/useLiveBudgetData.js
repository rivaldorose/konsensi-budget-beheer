/**
 * Live Budget Data Hook
 *
 * Haalt budget data op en synchroniseert automatisch met alle bronnen.
 * Toont notificaties bij wijzigingen van externe bronnen.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Income, MonthlyCost, Debt, Transaction, User, Pot, Expense } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

// Polling interval in ms (elke 5 seconden checken voor updates)
const POLL_INTERVAL = 5000;

export function useLiveBudgetData(selectedMonth, period) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Data states
  const [incomes, setIncomes] = useState([]);
  const [monthlyCosts, setMonthlyCosts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pots, setPots] = useState([]);

  // Voor change detection
  const previousDataRef = useRef({
    incomes: [],
    monthlyCosts: [],
    debts: [],
    pots: []
  });

  const isInitialLoadRef = useRef(true);

  // Get period bounds
  const getPeriodBounds = useCallback(() => {
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

    return { startDate, endDate };
  }, [selectedMonth, period]);

  // Detecteer wijzigingen en toon notificaties
  const detectChanges = useCallback((newData, prevData, type) => {
    if (isInitialLoadRef.current) return;

    const newIds = new Set(newData.map(item => item.id));
    const prevIds = new Set(prevData.map(item => item.id));

    // Nieuwe items
    const addedItems = newData.filter(item => !prevIds.has(item.id));
    // Verwijderde items
    const removedItems = prevData.filter(item => !newIds.has(item.id));
    // Gewijzigde items (amount changed)
    const changedItems = newData.filter(item => {
      const prevItem = prevData.find(p => p.id === item.id);
      if (!prevItem) return false;
      return JSON.stringify(item) !== JSON.stringify(prevItem);
    });

    // Toon notificaties
    addedItems.forEach(item => {
      const name = item.description || item.name || item.creditor || item.creditor_name || 'Item';
      const amount = item.amount || item.monthly_payment || 0;

      toast({
        title: `${type} toegevoegd`,
        description: `${name}: €${parseFloat(amount).toFixed(2)}`,
        className: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      });
    });

    removedItems.forEach(item => {
      const name = item.description || item.name || item.creditor || item.creditor_name || 'Item';

      toast({
        title: `${type} verwijderd`,
        description: name,
        className: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      });
    });

    changedItems.forEach(item => {
      const name = item.description || item.name || item.creditor || item.creditor_name || 'Item';
      const amount = item.amount || item.monthly_payment || 0;

      toast({
        title: `${type} gewijzigd`,
        description: `${name}: €${parseFloat(amount).toFixed(2)}`,
        className: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      });
    });
  }, [toast]);

  // Load all data
  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && isInitialLoadRef.current) {
        setLoading(true);
      }

      const userData = await User.me();
      setUser(userData);

      const { startDate, endDate } = getPeriodBounds();

      // Parallel data loading
      const [
        incomeData,
        monthlyCostsData,
        debtsData,
        transactionsData,
        potsData
      ] = await Promise.all([
        Income.filter({ user_id: userData.id }),
        MonthlyCost.filter({ user_id: userData.id }),
        Debt.filter({ user_id: userData.id }),
        Transaction.filter({ user_id: userData.id }),
        Pot.filter({ user_id: userData.id })
      ]);

      // Detect changes before updating state
      detectChanges(incomeData, previousDataRef.current.incomes, 'Inkomen');
      detectChanges(monthlyCostsData.filter(c => c.status === 'actief'), previousDataRef.current.monthlyCosts, 'Vaste last');
      detectChanges(debtsData.filter(d => d.status === 'betalingsregeling'), previousDataRef.current.debts, 'Betalingsregeling');
      detectChanges(potsData, previousDataRef.current.pots, 'Potje');

      // Update previous data reference
      previousDataRef.current = {
        incomes: incomeData,
        monthlyCosts: monthlyCostsData.filter(c => c.status === 'actief'),
        debts: debtsData.filter(d => d.status === 'betalingsregeling'),
        pots: potsData
      };

      // Filter income for current period
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

      // Filter monthly costs for current period
      const today = new Date(selectedMonth);
      const filteredCosts = monthlyCostsData
        .filter(cost => cost.status === 'actief')
        .filter(cost => {
          const paymentDay = cost.payment_date || 1;
          const paymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
          return paymentDate >= startDate && paymentDate <= endDate;
        });

      // Filter debts with active payment plans
      const filteredDebts = debtsData
        .filter(d => d.status === 'betalingsregeling')
        .filter(debt => {
          if (!debt.payment_plan_date) return false;

          const planStartDate = new Date(debt.payment_plan_date);
          planStartDate.setHours(0, 0, 0, 0);

          if (planStartDate > endDate) return false;

          const paymentDay = planStartDate.getDate();
          const planStartMonth = planStartDate.getMonth();
          const planStartYear = planStartDate.getFullYear();

          const selectedYear = startDate.getFullYear();
          const selectedMonthNum = startDate.getMonth();

          if (selectedYear < planStartYear ||
              (selectedYear === planStartYear && selectedMonthNum < planStartMonth)) {
            return false;
          }

          const paymentDateThisMonth = new Date(selectedYear, selectedMonthNum, paymentDay);
          paymentDateThisMonth.setHours(12, 0, 0, 0);

          return paymentDateThisMonth >= startDate && paymentDateThisMonth <= endDate;
        });

      // Filter transactions
      const filteredTransactions = transactionsData.filter(tx => {
        if (!tx || !tx.date) return false;
        const txDate = new Date(tx.date);
        if (tx.category === 'debt_payments') return false;
        return txDate >= startDate && txDate <= endDate;
      });

      setIncomes(filteredIncome);
      setMonthlyCosts(filteredCosts);
      setDebts(filteredDebts);
      setTransactions(filteredTransactions);
      setPots(potsData);

      isInitialLoadRef.current = false;

    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  }, [getPeriodBounds, detectChanges, selectedMonth]);

  // Delete handlers that sync back to original pages
  const deleteIncome = useCallback(async (incomeId) => {
    try {
      await Income.delete(incomeId);
      toast({
        title: 'Inkomen verwijderd',
        description: 'Het inkomen is verwijderd uit je overzicht.',
      });
      await loadData(false);
      return true;
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: 'Fout bij verwijderen',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadData, toast]);

  const deleteMonthlyCost = useCallback(async (costId) => {
    try {
      await MonthlyCost.update(costId, { status: 'inactief' });
      toast({
        title: 'Vaste last gedeactiveerd',
        description: 'De vaste last is gedeactiveerd. Je kunt het herstellen op de Vaste Lasten pagina.',
      });
      await loadData(false);
      return true;
    } catch (error) {
      console.error('Error deactivating monthly cost:', error);
      toast({
        title: 'Fout bij deactiveren',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadData, toast]);

  const stopDebtPaymentPlan = useCallback(async (debtId) => {
    try {
      await Debt.update(debtId, {
        status: 'open',
        payment_plan_date: null,
        monthly_payment: null
      });
      toast({
        title: 'Betalingsregeling gestopt',
        description: 'De schuld is terug naar status "open". Je kunt een nieuwe regeling starten op de Schulden pagina.',
      });
      await loadData(false);
      return true;
    } catch (error) {
      console.error('Error stopping payment plan:', error);
      toast({
        title: 'Fout bij stoppen regeling',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadData, toast]);

  const deleteTransaction = useCallback(async (transactionId) => {
    try {
      await Transaction.delete(transactionId);
      toast({
        title: 'Transactie verwijderd',
        description: 'De transactie is verwijderd uit je overzicht.',
      });
      await loadData(false);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Fout bij verwijderen',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadData, toast]);

  const deletePot = useCallback(async (potId) => {
    try {
      await Pot.delete(potId);
      toast({
        title: 'Potje verwijderd',
        description: 'Het potje is verwijderd uit je overzicht.',
      });
      await loadData(false);
      return true;
    } catch (error) {
      console.error('Error deleting pot:', error);
      toast({
        title: 'Fout bij verwijderen',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadData, toast]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling for live updates
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadData(false);
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [loadData]);

  // Reload when period or month changes
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      loadData(false);
    }
  }, [selectedMonth, period, loadData]);

  // Calculate totals
  const totalIncome = incomes.reduce((sum, income) => {
    if (income.income_type === 'vast') {
      return sum + (parseFloat(income.monthly_equivalent) || parseFloat(income.amount) || 0);
    }
    return sum + (parseFloat(income.amount) || 0);
  }, 0);

  const totalMonthlyCosts = monthlyCosts.reduce((sum, cost) =>
    sum + (parseFloat(cost.amount) || 0), 0
  );

  const totalDebtPayments = debts.reduce((sum, debt) =>
    sum + (parseFloat(debt.monthly_payment) || 0), 0
  );

  const totalTransactionExpenses = transactions
    .filter(tx => tx && tx.type === 'expense')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  const totalExpenses = totalMonthlyCosts + totalDebtPayments + totalTransactionExpenses;
  const availableBudget = totalIncome - totalExpenses;

  return {
    loading,
    user,
    // Raw data
    incomes,
    monthlyCosts,
    debts,
    transactions,
    pots,
    // Calculated totals
    totalIncome,
    totalMonthlyCosts,
    totalDebtPayments,
    totalTransactionExpenses,
    totalExpenses,
    availableBudget,
    // Actions
    refresh: () => loadData(false),
    deleteIncome,
    deleteMonthlyCost,
    stopDebtPaymentPlan,
    deleteTransaction,
    deletePot,
  };
}

export default useLiveBudgetData;
