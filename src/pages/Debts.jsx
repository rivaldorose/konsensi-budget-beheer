import React, { useState, useEffect, useMemo } from "react";
import { Debt } from "@/api/entities";
import { DebtStrategy } from "@/api/entities";
import { DebtPayoffSchedule } from "@/api/entities";
import { DebtPayment } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { vtblService } from "@/components/services";
import { genereerBatchVoorstellen, formatVoorstelVoorUI } from "@/services/arrangementEngine";
import IntelligentProposalCard, { IntelligentProposalSummary, IntelligentProposalBadge } from "../components/debts/IntelligentProposalCard";
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
import ArrangementStappenplanModal from "../components/debts/ArrangementStappenplanModal";
import { createPageUrl } from "@/utils";
import { formatCurrency, formatDateSafe } from "@/components/utils/formatters";

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
  const [showStappenplan, setShowStappenplan] = useState(false);
  const [stappenplanDebt, setStappenplanDebt] = useState(null);
  const [showPaidDebts, setShowPaidDebts] = useState(false);
  const [intelligentProposals, setIntelligentProposals] = useState(null);
  const [showIntelligentSection, setShowIntelligentSection] = useState(true);
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

        // Genereer intelligente betalingsvoorstellen op de achtergrond
        if (vtblResult && data.length > 0) {
          console.log('[Debts] Generating intelligent proposals...');
          const userProfiel = {
            werksituatie: userData.vtlb_settings?.werksituatie || 'standaard',
            leefsituatie: userData.vtlb_settings?.leefsituatie || 'alleenstaand'
          };
          const batchResult = genereerBatchVoorstellen(data, vtblResult, userProfiel, 'standaard');
          if (batchResult.success) {
            // Format voor UI
            const formattedProposals = batchResult.voorstellen.map(v => formatVoorstelVoorUI(v));
            setIntelligentProposals({
              ...batchResult,
              uiVoorstellen: formattedProposals.filter(Boolean)
            });
            console.log('[Debts] Intelligent proposals generated:', batchResult.voorstellen.length);
          }
        }
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

  // Reset showPaidDebts when there are debts that are no longer fully paid
  // This ensures the user sees the updated debt list after deleting payments
  useEffect(() => {
    if (showPaidDebts && debts.length > 0) {
      const allStillPaidOff = debts.every(d => d.status === 'afbetaald');
      if (!allStillPaidOff) {
        console.log('[Debts] Some debts are no longer fully paid, resetting showPaidDebts');
        setShowPaidDebts(false);
      }
    }
  }, [debts, showPaidDebts]);

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
        if (!isNaN(debtDate.getTime())) {
          if (filters.dateFrom) matchesDate = matchesDate && debtDate >= new Date(filters.dateFrom);
          if (filters.dateTo) matchesDate = matchesDate && debtDate <= new Date(filters.dateTo);
        }
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
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
        // Handle invalid dates by treating them as epoch (1970)
        if (isNaN(aValue.getTime())) aValue = new Date(0);
        if (isNaN(bValue.getTime())) bValue = new Date(0);
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

  const activeDebts = debts.filter(d => d.status === 'actief' || d.status === 'active' || d.status === 'betalingsregeling').length;
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
  if (allPaidOff && !showPaidDebts) {
    const totalPaidOffAmount = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
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
        <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-lg mx-auto">
            {/* Celebration animation */}
            <div className="text-8xl mb-6 animate-bounce">🎊</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131d0c] dark:text-white mb-3 font-display">
              Alle schulden afbetaald!
            </h2>
            <p className="text-gray-600 dark:text-[#9CA3AF] mb-2 text-lg">
              Wat een ongelooflijke prestatie! Je hebt het gedaan! 🏆
            </p>
            <div className="bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 mb-8">
              <p className="text-green-800 dark:text-green-400 font-bold text-xl">
                {formatCurrency(totalPaidOffAmount)} afgelost
              </p>
              <p className="text-green-600 dark:text-green-500 text-sm">
                {debts.length} schuld{debts.length > 1 ? 'en' : ''} volledig afbetaald
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#131d0c] dark:text-white mb-4">Wat wil je nu doen?</h3>

              {/* Option 1: Register new debts */}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center gap-4 p-5 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#2a2a2a] hover:border-primary dark:hover:border-primary-green rounded-2xl transition-all group"
              >
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 !text-[28px]">add_circle</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-[#131d0c] dark:text-white text-lg group-hover:text-primary dark:group-hover:text-primary-green transition-colors">
                    Nieuwe schuld registreren
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
                    Heb je nog een openstaande schuld? Voeg deze toe.
                  </p>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-[#6b7280] group-hover:text-primary dark:group-hover:text-primary-green !text-[24px]">arrow_forward</span>
              </button>

              {/* Option 2: Start savings plan */}
              <button
                onClick={() => window.location.href = createPageUrl('Goals')}
                className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border-2 border-green-200 dark:border-green-500/20 hover:border-green-400 dark:hover:border-green-400 rounded-2xl transition-all group"
              >
                <div className="w-14 h-14 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 !text-[28px]">savings</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-green-800 dark:text-green-400 text-lg">
                    Start een spaarplan 💰
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    Zet het geld dat je overhad nu opzij voor je toekomst!
                  </p>
                </div>
                <span className="material-symbols-outlined text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300 !text-[24px]">arrow_forward</span>
              </button>

              {/* Option 3: View old/paid debts */}
              <button
                onClick={() => setShowPaidDebts(true)}
                className="w-full flex items-center gap-4 p-5 bg-gray-50 dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#2a2a2a] hover:border-gray-400 dark:hover:border-[#3a3a3a] rounded-2xl transition-all group"
              >
                <div className="w-14 h-14 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-500 dark:text-[#a1a1a1] !text-[28px]">history</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-bold text-[#131d0c] dark:text-white text-lg group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                    Bekijk afbetaalde schulden
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
                    Zie je geschiedenis en wat je hebt bereikt
                  </p>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-[#6b7280] group-hover:text-gray-600 dark:group-hover:text-gray-400 !text-[24px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        <DebtWizard isOpen={showAddForm} onClose={() => setShowAddForm(false)} onSave={loadDebts} />
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
          {/* Banner for viewing paid debts when all are paid */}
          {allPaidOff && showPaidDebts && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎊</span>
                <div>
                  <p className="font-bold text-green-800 dark:text-green-400">Je bekijkt je afbetaalde schulden</p>
                  <p className="text-sm text-green-700 dark:text-green-500">Alle {debts.length} schulden zijn volledig afbetaald!</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaidDebts(false)}
                className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-green-300 dark:border-green-500/30 rounded-xl text-green-800 dark:text-green-400 font-semibold text-sm hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                Terug
              </button>
            </div>
          )}

          {/* Page Header */}
          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#131d0c] dark:text-white font-display">
                {allPaidOff && showPaidDebts ? 'Afbetaalde Schulden' : 'Betaalachterstanden'}
              </h1>
          {paidOffDebts > 0 && !allPaidOff && (
                <p className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2 mt-1">
                  <span>🎉</span> {paidOffDebts} schuld{paidOffDebts > 1 ? 'en' : ''} afbetaald!
                </p>
              )}
              {/* Search below header */}
              <div className="mt-2 sm:mt-4 relative w-full sm:max-w-md">
                <span className="material-symbols-outlined absolute left-3 sm:left-4 top-2.5 sm:top-3 text-gray-400 dark:text-[#6b7280] !text-[20px]">search</span>
                <input
                  className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-4 rounded-xl border-none bg-white dark:bg-[#2a2a2a] shadow-soft text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-[#a1a1a1] focus:ring-2 focus:ring-[#b4ff7a] dark:focus:ring-[#10b981] outline-none transition-all text-sm sm:text-base"
                  placeholder="Zoek op naam of status..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
        </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
              <button
            onClick={() => setShowFilters(true)}
                className="h-9 sm:h-11 px-3 sm:px-5 rounded-xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-text-main dark:text-text-primary font-semibold text-xs sm:text-sm hover:border-primary/30 dark:hover:border-primary-green/30 hover:bg-primary/5 dark:hover:bg-primary-green/5 flex items-center gap-1 sm:gap-2 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined !text-[16px] sm:!text-[18px] text-primary dark:text-primary-green">filter_list</span>
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button
            onClick={() => setShowScanModal(true)}
                className="h-9 sm:h-11 px-3 sm:px-5 rounded-xl border-2 border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white font-semibold text-xs sm:text-sm hover:border-gray-400 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] flex items-center gap-1 sm:gap-2 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined !text-[16px] sm:!text-[18px] text-gray-500 dark:text-[#a1a1a1]">document_scanner</span>
                <span className="hidden xs:inline">Scan</span>
              </button>
              <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setShowAddChoiceModal(true);
              } else {
                setShowAddForm(true);
              }
            }}
                className="h-9 sm:h-11 px-3 sm:px-5 rounded-xl bg-[#b4ff7a] dark:bg-[#10b981] text-[#131d0c] dark:text-black font-bold text-xs sm:text-sm hover:bg-[#a2f565] dark:hover:bg-[#34d399] active:bg-[#059669] flex items-center gap-1 sm:gap-2 shadow-sm transition-all transform hover:-translate-y-0.5 flex-shrink-0 ml-auto"
              >
                <span className="material-symbols-outlined !text-[18px] sm:!text-[20px] font-bold">add</span>
                <span className="hidden sm:inline">Nieuwe Schuld</span>
              </button>
        </div>
          </header>

          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Afloscapaciteit */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft flex flex-col gap-3 sm:gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    <span className="material-symbols-outlined !text-[18px] sm:!text-[24px]">track_changes</span>
        </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Afloscapaciteit</span>
      </div>
                <button onClick={() => setShowVtlbInfo(true)} className="material-symbols-outlined text-gray-300 dark:text-[#6b7280] cursor-help !text-[16px] sm:!text-[20px] hover:text-gray-500 dark:hover:text-white transition-colors">help</button>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#131d0c] dark:text-white font-display">
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
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft flex flex-col gap-3 sm:gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                    <span className="material-symbols-outlined !text-[18px] sm:!text-[24px]">warning</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Openstaand</span>
              </div>
              <button
                onClick={() => setShowTotalAmount(!showTotalAmount)}
                  className="material-symbols-outlined text-gray-300 dark:text-[#6b7280] cursor-pointer hover:text-gray-500 dark:hover:text-white !text-[16px] sm:!text-[20px] transition-colors"
                >
                  {showTotalAmount ? 'visibility_off' : 'visibility'}
              </button>
            </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-400 font-display">
                  {showTotalAmount ? formatCurrency(totalDebtAmount) : '€ ••••'}
                </p>
                <p className="text-gray-500 dark:text-[#a1a1a1] text-xs sm:text-sm font-medium mt-1">{debts.filter(d => d.status !== 'afbetaald').length} schulden</p>
              </div>
            </div>

            {/* Strategie */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft flex flex-col gap-3 sm:gap-4 relative group hover:border-gray-200 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-300 sm:col-span-2 md:col-span-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="size-8 sm:size-10 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
                    <span className="material-symbols-outlined !text-[18px] sm:!text-[24px]">bolt</span>
            </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#a1a1a1] uppercase tracking-wide">Strategie</span>
                </div>
              </div>
              <div>
            {activeStrategy ? (
              <>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-1 font-display capitalize">
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

          {/* Intelligente Betalingsregelingen Section */}
          {intelligentProposals && intelligentProposals.uiVoorstellen?.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-soft overflow-hidden">
              <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors group"
                onClick={() => setShowIntelligentSection(!showIntelligentSection)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-full">
                    <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#131d0c] dark:text-white font-display">Intelligente Regelingen</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {intelligentProposals.totaal?.aantalSchulden || 0} voorstellen • €{intelligentProposals.totaal?.maandBedrag?.toFixed(2) || '0.00'}/mnd totaal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {intelligentProposals.totaal?.gemiddeldeSuccessKans >= 60 && (
                    <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      {intelligentProposals.totaal?.gemiddeldeSuccessKans}% kans
                    </span>
                  )}
                  <span className={`material-symbols-outlined text-gray-400 dark:text-[#a1a1a1] group-hover:text-gray-600 dark:group-hover:text-white transition-all ${showIntelligentSection ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>

              {showIntelligentSection && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Summary */}
                  <IntelligentProposalSummary batchResult={intelligentProposals} />

                  {/* Individual Proposals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {intelligentProposals.uiVoorstellen.map((voorstel) => (
                      <IntelligentProposalCard
                        key={voorstel.id}
                        voorstel={voorstel}
                        onSelectProposal={(v) => {
                          // Vind de bijbehorende schuld en open het stappenplan
                          const matchingDebt = debts.find(d => d.id === v.id);
                          if (matchingDebt) {
                            setStappenplanDebt(matchingDebt);
                            setShowStappenplan(true);
                          }
                        }}
                      />
                    ))}
                  </div>

                  {/* Info text */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    💡 Deze voorstellen zijn berekend op basis van je VTLB en incassobureau acceptatie criteria
                  </p>
                </div>
              )}
            </div>
          )}

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
                {/* Journey and Challenges Grid */}
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

          {/* Debt List - Mobile Cards / Desktop Table */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-soft overflow-hidden w-full">

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100 dark:divide-[#2a2a2a]">
            {paginatedDebts.map((debt) => {
              const creditorIcon = getCreditorIcon(debt.creditor_type, debt.creditor_name);
              const status = debt.status || 'niet_actief';
              return (
                <div
                  key={debt.id}
                  className="p-4 active:bg-gray-50 dark:active:bg-[#2a2a2a] transition-colors"
                  onClick={() => handleViewDetails(debt)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`size-12 rounded-xl ${creditorIcon.bgColor} flex items-center justify-center ${creditorIcon.iconColor} flex-shrink-0`}>
                      <span className="material-symbols-outlined !text-[22px]">{creditorIcon.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[#131d0c] dark:text-white text-sm truncate">{debt.creditor_name}</p>
                          <p className="text-xs text-gray-400 dark:text-[#a1a1a1]">{creditorTypeLabels[debt.creditor_type] || 'Schuldeiser'}</p>
                        </div>
                        <p className="font-bold text-[#131d0c] dark:text-white text-sm flex-shrink-0">
                          {showTotalAmount ? formatCurrency(debt.amount || 0) : '€ ••••'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.niet_actief}`}>
                          {statusLabels[status] || status}
                        </span>
                        {formatDateSafe(debt.origin_date, { day: 'numeric', month: 'short' }) && (
                          <span className="text-xs text-gray-400 dark:text-[#a1a1a1]">
                            {formatDateSafe(debt.origin_date, { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      {status === 'betalingsregeling' && debt.monthly_payment && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {formatCurrency(debt.monthly_payment)}/mnd • {Math.ceil(((debt.amount || 0) - (debt.amount_paid || 0)) / debt.monthly_payment)} mnd
                        </p>
                      )}
                      {/* Intelligent Proposal Badge (mobile) */}
                      {status !== 'betalingsregeling' && status !== 'afbetaald' && intelligentProposals?.uiVoorstellen?.find(v => v.id === debt.id) && (
                        <div className="mt-2">
                          <IntelligentProposalBadge voorstel={intelligentProposals.uiVoorstellen.find(v => v.id === debt.id)} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
                        {formatDateSafe(debt.origin_date, {
                            day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) || '-'}
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
                          {/* Intelligent Proposal Badge (desktop) */}
                          {status !== 'betalingsregeling' && status !== 'afbetaald' && intelligentProposals?.uiVoorstellen?.find(v => v.id === debt.id) && (
                            <IntelligentProposalBadge voorstel={intelligentProposals.uiVoorstellen.find(v => v.id === debt.id)} />
                          )}
                        </div>
                      </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-purple-600 dark:text-purple-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 transition-colors flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStappenplanDebt(debt);
                                setShowStappenplan(true);
                              }}
                            >
                              <span className="material-symbols-outlined !text-[16px]">route</span>
                              Stappenplan
                            </button>
                            <button
                              className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-green-500 dark:hover:text-green-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(debt);
                              }}
                            >
                              Details
                            </button>
                          </div>
                      </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Pagination */}
          {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-[#a1a1a1] order-2 sm:order-1">
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedDebts.length)} van {filteredAndSortedDebts.length}
              </p>
              <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                    className="px-2 sm:px-4 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span className="hidden sm:inline">Vorige</span>
                  <span className="material-symbols-outlined sm:hidden !text-[16px]">chevron_left</span>
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
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
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
                    className="px-2 sm:px-4 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-transparent text-gray-700 dark:text-white text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2a2a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span className="hidden sm:inline">Volgende</span>
                  <span className="material-symbols-outlined sm:hidden !text-[16px]">chevron_right</span>
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
        onUpdate={loadDebts}
      />

      <StrategyChoiceModal
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        monthlyBudget={vtblData?.aflosCapaciteit > 0 ? vtblData.aflosCapaciteit : (availableBudget > 0 ? availableBudget : 0)}
        vtblData={vtblData}
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

      <ArrangementStappenplanModal
        debt={stappenplanDebt}
        isOpen={showStappenplan}
        onClose={() => {
          setShowStappenplan(false);
          setStappenplanDebt(null);
        }}
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
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1a1a1a] rounded-t-3xl z-10">
              <h3 className="text-lg font-bold text-[#131d0c] dark:text-white font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">calculate</span>
                VTLB & Afloscapaciteit
              </h3>
              <button onClick={() => setShowVtlbInfo(false)} className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Uitleg */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>VTLB</strong> = Vrij Te Laten Bedrag — het bedrag dat je <strong>minimaal nodig hebt om van te leven</strong>. De rest kun je gebruiken om schulden af te lossen.
                </p>
              </div>

              {/* VTLB Result Card */}
              {vtblData && (
                <div className={`rounded-2xl p-5 border-2 ${
                  vtblData.statusColor === 'green'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : vtblData.statusColor === 'orange'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                }`}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Netto inkomen</p>
                      <p className="text-gray-900 dark:text-white font-bold text-base">{formatCurrency(vtblData.vastInkomen || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">VTLB (Beslagvrije voet)</p>
                      <p className="text-amber-600 dark:text-amber-400 font-bold text-base">- {formatCurrency(vtblData.vtlbTotaal || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Vaste lasten</p>
                      <p className="text-orange-600 dark:text-orange-400 font-bold text-base">- {formatCurrency(vtblData.vasteLasten || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Lopende regelingen</p>
                      <p className="text-purple-600 dark:text-purple-400 font-bold text-base">- {formatCurrency(vtblData.huidigeRegelingen || 0)}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">Afloscapaciteit</p>
                      <p className={`font-extrabold text-2xl ${
                        vtblData.statusColor === 'green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : vtblData.statusColor === 'orange'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(vtblData.afloscapaciteit || vtblData.aflosCapaciteit || 0)}
                      </p>
                    </div>
                    <div className={`flex items-center justify-center gap-2 text-sm font-bold mt-2 ${
                      vtblData.statusColor === 'green'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : vtblData.statusColor === 'orange'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      <span className="material-symbols-outlined text-base">
                        {vtblData.statusColor === 'green' ? 'check_circle' : vtblData.statusColor === 'orange' ? 'warning' : 'error'}
                      </span>
                      {vtblData.statusLabel || 'Berekend'}
                    </div>
                  </div>
                </div>
              )}

              {/* VTLB Breakdown */}
              {vtblData?.breakdown && vtblData.hasVtlbSettings && (
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-2 text-sm">
                  <h4 className="font-bold text-[#131d0c] dark:text-white text-sm flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-500 !text-[18px]">functions</span>
                    VTLB Opbouw
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Basisbedrag ({vtblData.leefsituatie ? vtblData.leefsituatie.replace(/_/g, ' ') : 'Alleenstaand'})</span>
                    <span className="font-medium">{formatCurrency(vtblData.breakdown.basisBedrag || 0)}</span>
                  </div>
                  {(vtblData.breakdown.kinderToeslag || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">+ Kindertoeslag ({vtblData.aantalKinderen} kind{vtblData.aantalKinderen > 1 ? 'eren' : ''})</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(vtblData.breakdown.kinderToeslag)}</span>
                    </div>
                  )}
                  {(vtblData.breakdown.woonkostenCorrectie || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">+ Woonkosten correctie</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(vtblData.breakdown.woonkostenCorrectie)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">+ Eigen risico zorgverzekering</span>
                    <span className="font-medium">{formatCurrency(vtblData.breakdown.eigenRisico || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">+ Reservering</span>
                    <span className="font-medium">{formatCurrency(vtblData.breakdown.reservering || 0)}</span>
                  </div>
                  {(vtblData.breakdown.arbeidsToeslag || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">+ Arbeidstoeslag</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(vtblData.breakdown.arbeidsToeslag)}</span>
                    </div>
                  )}
                  {(vtblData.breakdown.individueleLasten || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">+ Individuele lasten</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(vtblData.breakdown.individueleLasten)}</span>
                    </div>
                  )}
                  <hr className="border-gray-200 dark:border-[#2a2a2a] my-2" />
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 dark:text-white">Totaal VTLB</span>
                    <span className="text-amber-600 dark:text-amber-400">{formatCurrency(vtblData.vtlbTotaal || 0)}</span>
                  </div>
                  {vtblData.is95ProcentRegel && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ⚠️ 95% regel toegepast: VTLB is gemaximeerd op 95% van je inkomen
                    </p>
                  )}
                </div>
              )}

              {/* Fallback als geen VTLB settings */}
              {vtblData && !vtblData.hasVtlbSettings && (
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-2 text-sm">
                  <h4 className="font-bold text-[#131d0c] dark:text-white text-sm flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-500 !text-[18px]">functions</span>
                    Simpele berekening
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-[#a1a1a1]">Vast inkomen</span>
                    <span className="font-medium text-[#131d0c] dark:text-white">{formatCurrency(vtblData.vastInkomen || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-[#a1a1a1]">Vaste lasten</span>
                    <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(vtblData.vasteLasten || 0)}</span>
                  </div>
                  {(vtblData.huidigeRegelingen || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-[#a1a1a1]">Lopende regelingen</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">- {formatCurrency(vtblData.huidigeRegelingen)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-2 flex justify-between">
                    <span className="font-bold text-[#131d0c] dark:text-white">= Afloscapaciteit</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(vtblData.afloscapaciteit || vtblData.aflosCapaciteit || 0)}</span>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 mt-3">
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      💡 Stel je VTLB in voor een nauwkeurigere berekening op basis van officiële WSNP-normen.
                    </p>
                  </div>
                </div>
              )}

              {/* Geen data */}
              {!vtblData && (
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-[#a1a1a1]">Je inkomen</span>
                    <span className="font-medium text-[#131d0c] dark:text-white">{formatCurrency(user?.monthly_income || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-[#a1a1a1]">Min: vaste lasten</span>
                    <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(user?.monthly_fixed_costs || 0)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-2 flex justify-between">
                    <span className="font-bold text-[#131d0c] dark:text-white">= Beschikbaar</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(availableBudget)}</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
                💡 Dit bedrag kun je maandelijks gebruiken voor betalingsregelingen met schuldeisers.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVtlbInfo(false);
                    window.location.href = createPageUrl('VTLBSettings');
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[20px]">settings</span>
                  VTLB Instellingen
                </button>
                <button
                  onClick={() => {
                    setShowVtlbInfo(false);
                    window.location.href = createPageUrl('VTLBCalculator');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[20px]">calculate</span>
                  Calculator
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
