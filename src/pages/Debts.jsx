import React, { useState, useEffect, useMemo } from "react";
import { Debt } from "@/api/entities";
import { DebtStrategy } from "@/api/entities";
import { DebtPayoffSchedule } from "@/api/entities";
import { DebtPayment } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { vtblService } from "@/components/services";
import DebtForm from "../components/debts/DebtForm";
import DebtDetailsModal from "../components/debts/DebtDetailsModal";
import StrategyChoiceModal from "../components/debts/StrategyChoiceModal";
import ActiveStrategyWidget from "../components/debts/ActiveStrategyWidget";
import DebtWizard from "../components/debts/wizard/DebtWizard";
import DebtFilters from "../components/debts/DebtFilters";
import DebtJourneyWidget from "../components/debts/DebtJourneyWidget";
import DebtChallengesWidget from "../components/debts/DebtChallengesWidget";
import DebtAchievementsModal from "../components/debts/DebtAchievementsModal";
import DebtsInfoModal from "../components/debts/DebtsInfoModal";
import ScanDebtModal from "../components/debts/ScanDebtModal";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/components/utils/formatters";

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  betalingsregeling: 'Betalingsregeling',
  afbetaald: 'Afbetaald',
  actief: 'Actief',
  aanmaning: 'Aanmaning'
};

const statusColors = {
  niet_actief: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border border-gray-200 dark:border-[#3a3a3a]',
  wachtend: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20',
  betalingsregeling: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  afbetaald: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20',
  actief: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20',
  aanmaning: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 animate-pulse'
};

const creditorTypeLabels = {
  energie: 'Energieleverancier',
  telecom: 'Telecom',
  zorgverzekeraar: 'Zorgverzekeraar',
  bank: 'Bank',
  webshop: 'Webshop',
  overheid: 'Overheid',
  incassobureau: 'Incassobureau',
  deurwaarder: 'Deurwaarder',
  anders: 'Anders',
  incasso: 'Incasso',
  incasso_en_deurwaarder: 'Incasso & Deurwaarder'
};

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('origin_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [showTotalAmount, setShowTotalAmount] = useState(false);
  const [payoffSchedule, setPayoffSchedule] = useState([]);
  const [user, setUser] = useState(null);
  const [vtblData, setVtblData] = useState(null);
  const [totalPaidAllTime, setTotalPaidAllTime] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [currentMonthPaid, setCurrentMonthPaid] = useState(0);
  const [paymentCountThisMonth, setPaymentCountThisMonth] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showVtlbInfo, setShowVtlbInfo] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        creditorType: 'all',
        minAmount: '',
        maxAmount: '',
        dateFrom: '',
        dateTo: '',
        searchTerm: ''
      });
      const [currentPage, setCurrentPage] = useState(1);
      const ITEMS_PER_PAGE = 20;
      const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const loadDebts = React.useCallback(async () => {
    try {
      console.log('[Debts] Starting loadDebts...');
      const userData = await User.me();
      console.log('[Debts] User loaded:', userData?.email, 'ID:', userData?.id);
      setUser(userData);

      console.log('[Debts] Fetching debts with user_id:', userData.id);
      const data = await Debt.filter({ user_id: userData.id }, '-created_date');
      console.log('[Debts] Debts loaded:', data?.length);
      setDebts(data);

      const strategies = await DebtStrategy.filter({ user_id: userData.id });
      console.log('[Debts] Strategies loaded:', strategies?.length);
      if (strategies.length > 0) {
        setActiveStrategy(strategies[0]);
        const schedule = await DebtPayoffSchedule.filter({ strategy_id: strategies[0].id });
        setPayoffSchedule(schedule.sort((a, b) => a.payment_order - b.payment_order));
      } else {
        setActiveStrategy(null);
        setPayoffSchedule([]);
      }

      try {
        console.log('[Debts] Loading VTBL data...');
        const vtblResult = await vtblService.calculateVtbl();
        console.log('[Debts] VTBL loaded');
        setVtblData(vtblResult);
      } catch (error) {
        console.error("Error loading VTBL data:", error);
      }

      try {
        console.log('[Debts] Loading payments...');
        const allPayments = await DebtPayment.filter({ user_id: userData.id });
        const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        setTotalPaidAllTime(totalPaid);
        setPaymentCount(allPayments.length);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= startOfMonth;
        });
        setCurrentMonthPaid(thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
        setPaymentCountThisMonth(thisMonthPayments.length);
        console.log('[Debts] Payments loaded');
      } catch (error) {
        console.error("Error loading payments:", error);
      }

      console.log('[Debts] Setting loading to false');
      setLoading(false);
    } catch (error) {
      console.error("Error loading debts:", error);
      toast({ title: "Fout bij het laden van schulden", variant: "destructive" });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = async (debtData) => {
    try {
      console.log('[Debts] Saving debt data:', debtData);
      if (editingDebt) {
        await Debt.update(editingDebt.id, debtData);
        toast({ title: "Schuld bijgewerkt! 📝" });
      } else {
        // Add user_id and ensure name field is set (required by database)
        const dataWithUserId = {
          ...debtData,
          user_id: user.id,
          name: debtData.name || debtData.creditor_name || 'Onbekende schuld'
        };
        console.log('[Debts] Creating debt with user_id:', dataWithUserId);
        await Debt.create(dataWithUserId);
        toast({ title: "Schuld toegevoegd! 💚" });
      }
      setShowAddForm(false);
      setEditingDebt(null);
      loadDebts();
    } catch (error) {
      console.error("Error saving debt:", error);
      console.error("Error details:", error.message, error.hint, error.details);
      toast({ title: "Fout bij het opslaan", variant: "destructive" });
    }
  };

  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setShowAddForm(true);
  };

  const handleDelete = async (debtId) => {
    try {
      await Debt.delete(debtId);
      toast({ title: "Schuld verwijderd" });
      setShowDetails(false);
      loadDebts();
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast({ title: "Fout bij het verwijderen", variant: "destructive" });
    }
  };

  const handleDebtScanned = async (scannedData) => {
    try {
      if (scannedData.case_number) {
        const existingDebts = await Debt.filter({
          case_number: scannedData.case_number,
          user_id: user.id
        });

        if (existingDebts.length > 0) {
          const existingDebt = existingDebts[0];
          const updateData = {
            principal_amount: scannedData.principal_amount,
            collection_costs: scannedData.collection_costs,
            interest_amount: scannedData.interest_amount,
            amount: scannedData.amount,
            notes: (existingDebt.notes || '') + `\n\nBijgewerkt op ${new Date().toLocaleDateString('nl-NL')} - nieuwe bedragen gescand`
          };
          await Debt.update(existingDebt.id, updateData);
          await loadDebts();
          toast({ title: "📝 Schuld bijgewerkt!" });
          return;
        }
      }
      // Ensure name field is set (required by database)
      const dataToCreate = {
        ...scannedData,
        name: scannedData.name || scannedData.creditor_name || 'Onbekende schuld'
      };
      await Debt.create(dataToCreate);
      await loadDebts();
      toast({ title: "✅ Schuld toegevoegd!" });
    } catch (error) {
      console.error("Error processing scanned debt:", error);
      toast({ title: "Fout bij verwerken", variant: "destructive" });
    }
  };

  const handleViewDetails = (debt) => {
    setSelectedDebt(debt);
    setShowDetails(true);
  };

  const getCreditorIcon = (type, name) => {
    if (type === 'deurwaarder' || type === 'incasso_en_deurwaarder' || type === 'overheid') {
      return { icon: 'gavel', bgColor: 'bg-red-50 dark:bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400' };
    }
    if (name) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('cjib')) {
        return { icon: 'gavel', bgColor: 'bg-red-50 dark:bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400' };
      }
      }
    if (statusLabels[type] === 'Afbetaald') {
      return { icon: 'check_circle', bgColor: 'bg-green-50 dark:bg-green-500/10', iconColor: 'text-green-600 dark:text-green-400' };
      }
    return { icon: 'description', bgColor: 'bg-gray-100 dark:bg-[#2a2a2a]', iconColor: 'text-gray-500 dark:text-[#a1a1a1]' };
  };

  const filteredAndSortedDebts = useMemo(() => {
        let filtered = debts.filter(debt => {
          const combinedSearchTerm = searchTerm || filters.searchTerm || '';
          const statusLabel = statusLabels[debt.status]?.toLowerCase() || '';
          const matchesSearch = combinedSearchTerm === '' || 
            debt.creditor_name.toLowerCase().includes(combinedSearchTerm.toLowerCase()) ||
            (debt.case_number && debt.case_number.toLowerCase().includes(combinedSearchTerm.toLowerCase())) ||
            statusLabel.includes(combinedSearchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || debt.status === filters.status;
      const matchesCreditorType = filters.creditorType === 'all' || debt.creditor_type === filters.creditorType;
      const debtAmount = debt.amount || 0;
      const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
      const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
      const matchesAmount = debtAmount >= minAmount && debtAmount <= maxAmount;
      let matchesDate = true;
      if (debt.origin_date) {
        const debtDate = new Date(debt.origin_date);
        if (filters.dateFrom) matchesDate = matchesDate && debtDate >= new Date(filters.dateFrom);
        if (filters.dateTo) matchesDate = matchesDate && debtDate <= new Date(filters.dateTo);
        }
      return matchesSearch && matchesStatus && matchesCreditorType && matchesAmount && matchesDate;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === 'amount') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      } else if (sortField === 'origin_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
        }, [debts, searchTerm, filters, sortField, sortDirection]);

        React.useEffect(() => {
          setCurrentPage(1);
        }, [searchTerm, filters]);

        const totalPages = Math.ceil(filteredAndSortedDebts.length / ITEMS_PER_PAGE);
  const paginatedDebts = useMemo(() => {
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          return filteredAndSortedDebts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        }, [filteredAndSortedDebts, currentPage]);

  const activeDebts = debts.filter(d => d.status === 'actief' || d.status === 'betalingsregeling').length;
  const paidOffDebts = debts.filter(d => d.status === 'afbetaald').length;
  const totalDebtAmount = debts
    .filter(d => d.status !== 'afbetaald')
    .reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);
  
  const calculateAvailableBudget = () => {
    if (!user) return 0;
    const income = user.monthly_income || 0;
    const fixedCosts = user.monthly_fixed_costs || 0;
    return Math.max(0, income - fixedCosts);
  };
  
  const availableBudget = calculateAvailableBudget();
  
  const handleDeactivateStrategy = async () => {
    if (!activeStrategy) return;
    try {
      await DebtStrategy.update(activeStrategy.id, { is_active: false });
      setActiveStrategy(null);
      setPayoffSchedule([]);
      toast({ title: "Strategie gedeactiveerd" });
    } catch (error) {
      console.error("Error deactivating strategy:", error);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500 dark:border-green-400"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Laden...</p>
        </div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body">
        <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20">
          <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
            <input className="sr-only" id="theme-toggle" type="checkbox" checked={darkMode} onChange={toggleTheme} />
            <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>light_mode</span>
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>dark_mode</span>
              <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
            </div>
          </label>
        </div>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-[#131d0c] dark:text-white mb-2">Nog geen schulden geregistreerd</h2>
            <p className="text-gray-600 dark:text-[#9CA3AF] mb-6">Registreer je betaalachterstanden om grip te krijgen op je financiën.</p>
            <button 
            onClick={() => setShowAddForm(true)}
              className="bg-primary dark:bg-primary-green hover:bg-primary-dark dark:hover:bg-light-green text-secondary dark:text-dark-bg font-bold px-6 py-3 rounded-[24px] shadow-sm transition-all"
          >
              <span className="material-symbols-outlined !text-[20px] mr-2">add</span>
            Eerste schuld toevoegen
            </button>
        </div>
          <DebtWizard isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSave={loadDebts} />
        </div>
      </div>
    );
  }

  const allPaidOff = debts.every(d => d.status === 'afbetaald');
  if (allPaidOff) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body">
        <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20">
          <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
            <input className="sr-only" id="theme-toggle" type="checkbox" checked={darkMode} onChange={toggleTheme} />
            <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>light_mode</span>
              <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>dark_mode</span>
              <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
            </div>
          </label>
        </div>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-2xl font-bold text-[#131d0c] dark:text-white mb-2">Alle schulden afbetaald!</h2>
            <p className="text-gray-600 dark:text-[#9CA3AF] mb-6">Wat een prestatie! Je hebt het gedaan.</p>
                    </div>
                  </div>
              </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body antialiased">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20">
        <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
          <input className="sr-only" id="theme-toggle" type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>light_mode</span>
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>dark_mode</span>
            <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full flex justify-center py-8 px-4 sm:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-8">
          {/* Page Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#131d0c] dark:text-white font-display">Betaalachterstanden</h1>
          {paidOffDebts > 0 && (
                <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2 mt-1">
                  <span>🎉</span> {paidOffDebts} schuld{paidOffDebts > 1 ? 'en' : ''} afbetaald!
                </p>
              )}
              {/* Search below header */}
              <div className="mt-4 relative max-w-md w-full">
                <span className="material-symbols-outlined absolute left-4 top-3 text-gray-400 dark:text-[#6b7280]">search</span>
                <input
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-[#2a2a2a] shadow-soft text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-[#a1a1a1] focus:ring-2 focus:ring-[#b4ff7a] dark:focus:ring-[#10b981] outline-none transition-all"
                  placeholder="Zoek op naam of status..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
        </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
            onClick={() => setShowFilters(true)}
                className="h-11 px-5 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white font-semibold text-sm hover:border-gray-400 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined !text-[18px] text-gray-500 dark:text-[#a1a1a1]">filter_list</span>
                Filters
              </button>
              <button
            onClick={() => setShowScanModal(true)}
                className="h-11 px-5 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white font-semibold text-sm hover:border-gray-400 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined !text-[18px] text-gray-500 dark:text-[#a1a1a1]">document_scanner</span>
                Scan Brief
              </button>
              <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setShowAddChoiceModal(true);
              } else {
                setShowAddForm(true);
              }
            }}
                className="h-11 px-5 rounded-xl bg-[#b4ff7a] dark:bg-[#10b981] text-[#131d0c] dark:text-black font-bold text-sm hover:bg-[#a2f565] dark:hover:bg-[#34d399] active:bg-[#059669] flex items-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined !text-[20px] font-bold">add</span>
                Nieuwe Schuld
              </button>
        </div>
          </header>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Afloscapaciteit */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl p-6 shadow-soft flex flex-col gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    <span className="material-symbols-outlined">track_changes</span>
        </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Afloscapaciteit</span>
      </div>
                <button onClick={() => setShowVtlbInfo(true)} className="material-symbols-outlined text-gray-300 dark:text-[#6b7280] cursor-help text-sm hover:text-gray-500 dark:hover:text-white transition-colors">help</button>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#131d0c] dark:text-white font-display">
              {vtblData ? formatCurrency(vtblData.aflosCapaciteit) : formatCurrency(availableBudget)}
            </p>
                <a
                  className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 mt-2 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
              onClick={() => window.location.href = createPageUrl('VTLBCalculator')}
            >
                  VTLB berekenen <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Openstaand */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl p-6 shadow-soft flex flex-col gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Openstaand</span>
              </div>
              <button
                onClick={() => setShowTotalAmount(!showTotalAmount)}
                  className="material-symbols-outlined text-gray-300 dark:text-[#6b7280] cursor-pointer hover:text-gray-500 dark:hover:text-white text-sm transition-colors"
                >
                  {showTotalAmount ? 'visibility_off' : 'visibility'}
              </button>
            </div>
              <div>
                <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 font-display">
                  {showTotalAmount ? formatCurrency(totalDebtAmount) : '€ ••••'}
                </p>
                <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium mt-1">{debts.filter(d => d.status !== 'afbetaald').length} schulden</p>
              </div>
            </div>

            {/* Strategie */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl p-6 shadow-soft flex flex-col gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                    <span className="material-symbols-outlined">bolt</span>
            </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Strategie</span>
                </div>
              </div>
              <div>
            {activeStrategy ? (
              <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-1 font-display capitalize">
                  {activeStrategy.strategy_type === 'snowball' ? '❄️ Sneeuwbal' :
                   activeStrategy.strategy_type === 'avalanche' ? '⚡ Lawine' :
                   '⚖️ Gelijk'}
                </p>
                    <a
                      className="text-purple-600 dark:text-purple-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                  onClick={() => setShowStrategyModal(true)}
                >
                      Wijzigen <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                    </a>
              </>
            ) : (
              <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-1 font-display">Geen strategie</p>
                    <a
                      className="text-purple-600 dark:text-purple-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                  onClick={() => setShowStrategyModal(true)}
                >
                      Kies strategie <span className="material-symbols-outlined !text-[16px]">arrow_forward</span>
                    </a>
              </>
            )}
              </div>
            </div>
      </div>

          {/* Voortgang & Uitdagingen Section (Collapsible) */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-soft overflow-hidden">
            <div
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group"
          onClick={() => setShowGamification(!showGamification)}
        >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <h3 className="text-lg font-bold text-[#131d0c] dark:text-white font-display">Voortgang & Uitdagingen</h3>
          </div>
              <span className={`material-symbols-outlined text-gray-400 dark:text-[#a1a1a1] group-hover:text-gray-600 dark:group-hover:text-white transition-all ${showGamification ? 'rotate-180' : ''}`}>expand_more</span>
            </div>
        {showGamification && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DebtJourneyWidget
                debts={debts}
                totalPaid={totalPaidAllTime}
                paymentCount={paymentCount}
                onViewAll={() => setShowAchievements(true)}
              />
              <DebtChallengesWidget
                currentMonthPaid={currentMonthPaid}
                paymentCountThisMonth={paymentCountThisMonth}
                onChallengeComplete={loadDebts}
              />
            </div>
        </div>
                  )}
                </div>

          {/* Active Strategy Widget */}
          {activeStrategy && (
            <ActiveStrategyWidget 
              strategy={activeStrategy}
              schedule={payoffSchedule}
              debts={debts}
              onDeactivate={handleDeactivateStrategy}
            />
          )}

          {/* Debt List Table */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-soft overflow-hidden w-full">
          <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    <th
                      className="text-left py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-[#131d0c] dark:hover:text-white transition-colors"
                      onClick={() => handleSort('creditor_name')}
                    >
                      <div className="flex items-center gap-1">
                        Naam/Incasso <span className="material-symbols-outlined !text-[16px] opacity-70">unfold_more</span>
                      </div>
                  </th>
                    <th
                      className="text-left py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-[#131d0c] dark:hover:text-white transition-colors"
                      onClick={() => handleSort('origin_date')}
                    >
                      <div className="flex items-center gap-1">
                        Datum <span className="material-symbols-outlined !text-[16px] opacity-70">unfold_more</span>
                      </div>
                  </th>
                    <th className="text-left py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                      Dossiernummer
                    </th>
                    <th
                      className="text-left py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-[#131d0c] dark:hover:text-white transition-colors"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1">
                        Bedrag <span className="material-symbols-outlined !text-[16px] opacity-70">unfold_more</span>
                      </div>
                  </th>
                    <th
                      className="text-left py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-[#131d0c] dark:hover:text-white transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status <span className="material-symbols-outlined !text-[16px] opacity-70">unfold_more</span>
                      </div>
                  </th>
                    <th className="text-right py-5 px-6 text-gray-500 dark:text-[#a1a1a1] text-xs font-semibold uppercase tracking-wider">
                      Acties
                    </th>
                </tr>
              </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                {paginatedDebts.map((debt) => {
                  const creditorIcon = getCreditorIcon(debt.creditor_type, debt.creditor_name);
                    const status = debt.status || 'niet_actief';
                  
                  return (
                      <tr
                      key={debt.id}
                        className="group hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(debt)}
                      >
                        <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl ${creditorIcon.bgColor} border ${creditorIcon.bgColor.includes('dark:') ? 'border-gray-300 dark:border-[#3a3a3a]' : 'border-gray-200'} flex items-center justify-center ${creditorIcon.iconColor} transition-colors`}>
                              <span className="material-symbols-outlined !text-[20px]">{creditorIcon.icon}</span>
                          </div>
                          <div>
                              <p className="font-bold text-[#131d0c] dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{debt.creditor_name}</p>
                              <p className="text-xs text-gray-400 dark:text-[#a1a1a1]">{creditorTypeLabels[debt.creditor_type] || debt.creditor_type || 'Schuldeiser'}</p>
                          </div>
                        </div>
                      </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-white font-medium">
                        {debt.origin_date && new Date(debt.origin_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                        <td className="py-4 px-6 text-sm text-gray-400 dark:text-[#a1a1a1]">
                        {debt.case_number || '-'}
                      </td>
                        <td className="py-4 px-6 font-bold text-[#131d0c] dark:text-white">
                          {showTotalAmount ? formatCurrency(debt.amount || 0) : '€ ••••'}
                      </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.niet_actief}`}>
                              {statusLabels[status] || status}
                            </span>
                            {status === 'betalingsregeling' && debt.monthly_payment && (
                              <span className="text-[10px] text-gray-500 dark:text-[#9CA3AF] font-medium ml-1">
                                {formatCurrency(debt.monthly_payment)}/mnd ({Math.ceil(((debt.amount || 0) - (debt.amount_paid || 0)) / debt.monthly_payment)} mnd)
                                </span>
                          )}
                        </div>
                      </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(debt);
                            }}
                        >
                          Details
                          </button>
                      </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Pagination */}
          {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-sm text-gray-600 dark:text-[#a1a1a1]">
                Tonen {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedDebts.length)} van {filteredAndSortedDebts.length}
              </p>
              <div className="flex items-center gap-2">
                  <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Vorige
                  </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                        <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-xl text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-[#b4ff7a] dark:bg-[#10b981] text-[#131d0c] dark:text-black'
                              : 'border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                          }`}
                      >
                        {pageNum}
                        </button>
                    );
                  })}
                </div>
                  <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Volgende
                  </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <DebtWizard isOpen={showAddForm && !editingDebt} onClose={() => setShowAddForm(false)} onSave={loadDebts} />
      
      {editingDebt && (
        <DebtForm
          debt={editingDebt}
          isOpen={showAddForm && !!editingDebt}
          onClose={() => {
            setShowAddForm(false);
            setEditingDebt(null);
          }}
          onSave={async (data) => {
            await Debt.update(editingDebt.id, data);
            toast({ title: "Schuld bijgewerkt! 📝" });
            setShowAddForm(false);
            setEditingDebt(null);
            loadDebts();
          }}
        />
      )}

      <DebtDetailsModal
        debt={selectedDebt}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedDebt(null);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <StrategyChoiceModal
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        monthlyBudget={availableBudget > 0 ? availableBudget : 100}
        onStrategyChosen={loadDebts}
      />

      <DebtFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        debts={debts}
        totalPaidFromPayments={totalPaidAllTime}
      />

      <DebtAchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
        totalPaid={totalPaidAllTime}
        paymentCount={paymentCount}
        clearedDebts={paidOffDebts}
        allDebtsCleared={debts.length > 0 && debts.every(d => d.status === 'afbetaald')}
      />

      <DebtsInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

      <ScanDebtModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onDebtScanned={handleDebtScanned}
      />

      {/* Add Choice Modal (Mobile) */}
      {showAddChoiceModal && (
        <>
          <div className="fixed inset-0 z-[2000] bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowAddChoiceModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#2a2a2a] rounded-t-3xl p-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#131d0c] dark:text-white">Nieuwe schuld toevoegen</h2>
              <button onClick={() => setShowAddChoiceModal(false)} className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddChoiceModal(false);
                  setShowScanModal(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border-2 border-blue-200 dark:border-blue-500/20 rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl">📸</div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-[#131d0c] dark:text-white text-lg">Scan incassobrief</h3>
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a1]">Maak een foto van je brief</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowAddChoiceModal(false);
                  setShowAddForm(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#3a3a3a] border-2 border-gray-200 dark:border-[#2a2a2a] rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-600 dark:text-[#a1a1a1] !text-[28px]">edit</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-[#131d0c] dark:text-white text-lg">Handmatig invoeren</h3>
                  <p className="text-sm text-gray-600 dark:text-[#a1a1a1]">Vul de gegevens zelf in</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* VTLB Info Modal */}
      {showVtlbInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#131d0c] dark:text-white font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">calculate</span>
              Wat is VTLB?
              </h3>
              <button onClick={() => setShowVtlbInfo(false)} className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                <strong>VTLB</strong> = Vrij Te Laten Bedrag
              </p>
            </div>
              <p className="text-gray-700 dark:text-[#a1a1a1]">
              Dit is het bedrag dat je <strong>minimaal nodig hebt om van te leven</strong>. De rest kun je gebruiken om schulden af te lossen.
            </p>
              <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#a1a1a1]">Je inkomen</span>
                  <span className="font-medium text-[#131d0c] dark:text-white">{formatCurrency(user?.monthly_income || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-[#a1a1a1]">Min: VTLB (levensonderhoud)</span>
                  <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency((user?.monthly_income || 0) - availableBudget)}</span>
              </div>
                <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-2 flex justify-between">
                  <span className="font-medium text-[#131d0c] dark:text-white">= Afloscapaciteit</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(availableBudget)}</span>
              </div>
            </div>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
              💡 Dit bedrag kun je maandelijks gebruiken voor betalingsregelingen met schuldeisers.
            </p>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
