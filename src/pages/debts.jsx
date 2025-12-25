import React, { useState, useEffect } from "react";
import { Debt } from "@/api/entities";
import { DebtStrategy } from "@/api/entities";
import { DebtPayoffSchedule } from "@/api/entities";
import { DebtPayment } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { vtblService } from "@/components/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Plus,
  ArrowUpDown,
  FileText,
  Shield,
  Building,
  ShoppingBag,
  Zap,
  Calculator,
  Target,
  Eye,
  EyeOff,
  ChevronDown,
  HelpCircle,
  Pencil,
  X
} from "lucide-react";
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
import AIDebtAnalysisWidget from "../components/debts/AIDebtAnalysisWidget";
import ScanDebtModal from "../components/debts/ScanDebtModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "@/components/utils/formatters";

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  betalingsregeling: 'Betalingsregeling',
  afbetaald: 'Afbetaald'
};

const statusColors = {
  niet_actief: 'bg-gray-400 text-white',
  wachtend: 'bg-yellow-500 text-white',
  betalingsregeling: 'bg-blue-500 text-white',
  afbetaald: 'bg-green-500 text-white'
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

  const loadDebts = React.useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      const data = await Debt.filter({ created_by: userData.email }, '-created_date');
      setDebts(data);
      
      // Load active strategy
      const strategies = await DebtStrategy.filter({ created_by: userData.email, is_active: true });
      if (strategies.length > 0) {
        setActiveStrategy(strategies[0]);
        const schedule = await DebtPayoffSchedule.filter({ strategy_id: strategies[0].id });
        setPayoffSchedule(schedule.sort((a, b) => a.payment_order - b.payment_order));
      } else {
        setActiveStrategy(null);
        setPayoffSchedule([]);
      }
      
      // Load VTBL data
      try {
        const vtblResult = await vtblService.calculateVtbl();
        setVtblData(vtblResult);
      } catch (error) {
        console.error("Error loading VTBL data:", error);
      }
      
      // Load all payments to calculate total paid (same as Dashboard)
      try {
        const allPayments = await DebtPayment.filter({ created_by: userData.email });
        const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        setTotalPaidAllTime(totalPaid);
        setPaymentCount(allPayments.length);
        
        // Calculate this month's payments
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthPayments = allPayments.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= startOfMonth;
        });
        setCurrentMonthPaid(thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
        setPaymentCountThisMonth(thisMonthPayments.length);
      } catch (error) {
        console.error("Error loading payments:", error);
      }
      
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
      if (editingDebt) {
        await Debt.update(editingDebt.id, debtData);
        toast({ title: "Schuld bijgewerkt! 📝" });
      } else {
        await Debt.create(debtData);
        
        if (debtData.status === 'actief') {
          toast({
            title: "Schuld toegevoegd! 💚",
            description: "Trots op je dat je actie neemt!"
          });
        } else {
          toast({
            title: "Schuld geregistreerd! 📝",
            description: "Je hebt de eerste stap al gezet door het te registreren"
          });
        }
      }
      
      setShowAddForm(false);
      setEditingDebt(null);
      loadDebts();
    } catch (error) {
      console.error("Error saving debt:", error);
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
      // Check if debt with same case_number already exists
      if (scannedData.case_number) {
        const existingDebts = await Debt.filter({ 
          case_number: scannedData.case_number,
          created_by: user.email 
        });

        if (existingDebts.length > 0) {
          // Update existing debt with new amounts
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
          toast({ 
            title: "📝 Schuld bijgewerkt!",
            description: "Je kunt nu de volgende brief scannen"
          });
          return;
        }
      }

      // Create new debt if no duplicate found
      await Debt.create(scannedData);
      await loadDebts();
      toast({ 
        title: "✅ Schuld toegevoegd!",
        description: "Je kunt nu de volgende brief scannen"
      });
    } catch (error) {
      console.error("Error processing scanned debt:", error);
      toast({ 
        title: "Fout bij verwerken", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleViewDetails = (debt) => {
    setSelectedDebt(debt);
    setShowDetails(true);
  };

  const getCreditorIcon = (type, name) => {
    if (type === 'deurwaarder' || type === 'incasso_en_deurwaarder') {
      return { icon: Shield, color: 'bg-blue-100 text-blue-600' };
    }
    
    if (name) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('eneco') || lowerName.includes('vattenfall') || lowerName.includes('essent')) {
        return { icon: Zap, color: 'bg-yellow-100 text-yellow-600' };
      }
      if (lowerName.includes('bank') || lowerName.includes('ing') || lowerName.includes('rabobank')) {
        return { icon: Building, color: 'bg-green-100 text-green-600' };
      }
      if (lowerName.includes('bol') || lowerName.includes('zalando') || lowerName.includes('shop')) {
        return { icon: ShoppingBag, color: 'bg-pink-100 text-pink-600' };
      }
    }
    
    return { icon: FileText, color: 'bg-gray-100 text-gray-600' };
  };

  const filteredAndSortedDebts = React.useMemo(() => {
        let filtered = debts.filter(debt => {
          // Zoekterm (uit header of filter modal) - zoek ook op status
          const combinedSearchTerm = searchTerm || filters.searchTerm || '';
          const statusLabel = statusLabels[debt.status]?.toLowerCase() || '';
          const matchesSearch = combinedSearchTerm === '' || 
            debt.creditor_name.toLowerCase().includes(combinedSearchTerm.toLowerCase()) ||
            (debt.case_number && debt.case_number.toLowerCase().includes(combinedSearchTerm.toLowerCase())) ||
            statusLabel.includes(combinedSearchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filters.status === 'all' || debt.status === filters.status;
      
      // Creditor type filter
      const matchesCreditorType = filters.creditorType === 'all' || debt.creditor_type === filters.creditorType;
      
      // Bedrag filter
      const debtAmount = debt.amount || 0;
      const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
      const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
      const matchesAmount = debtAmount >= minAmount && debtAmount <= maxAmount;
      
      // Datum filter
      let matchesDate = true;
      if (debt.origin_date) {
        const debtDate = new Date(debt.origin_date);
        if (filters.dateFrom) {
          matchesDate = matchesDate && debtDate >= new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          matchesDate = matchesDate && debtDate <= new Date(filters.dateTo);
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
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
        }, [debts, searchTerm, filters, sortField, sortDirection]);

        // Reset page when filters change
        React.useEffect(() => {
          setCurrentPage(1);
        }, [searchTerm, filters]);

        // Paginering
        const totalPages = Math.ceil(filteredAndSortedDebts.length / ITEMS_PER_PAGE);
        const paginatedDebts = React.useMemo(() => {
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          return filteredAndSortedDebts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        }, [filteredAndSortedDebts, currentPage]);

  const activeDebts = debts.filter(d => d.status === 'actief').length;
  const paidOffDebts = debts.filter(d => d.status === 'afbetaald').length;
  // Bereken het daadwerkelijk openstaande bedrag: totaal schuldbedrag MINUS wat al afbetaald is
  const totalDebtAmount = debts
    .filter(d => d.status !== 'afbetaald')
    .reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);
  
  // Calculate VTLB / available budget for strategy
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

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <motion.div 
        className="p-6 flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nog geen schulden geregistreerd</h2>
          <p className="text-gray-600 mb-6">Registreer je betaalachterstanden om grip te krijgen op je financiën.</p>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Eerste schuld toevoegen
          </Button>
        </div>
        
        <DebtWizard
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={loadDebts}
        />
      </motion.div>
    );
  }

  const allPaidOff = debts.every(d => d.status === 'afbetaald');
  if (allPaidOff) {
    return (
      <motion.div 
        className="p-6 flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🎊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Alle schulden afbetaald!</h2>
          <p className="text-gray-600 mb-6">Wat een prestatie! Je hebt het gedaan.</p>
          
          <Card className="mt-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Je Geschiedenis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-500 text-white">✅</Badge>
                      <span className="font-medium">{debt.creditor_name}</span>
                    </div>
                    <span className="text-green-600 font-bold">€{(debt.amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="px-4 py-4 md:p-6 space-y-4 md:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-green-500">Betaalachterstanden</h1>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Uitleg"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          {paidOffDebts > 0 && (
            <p className="text-green-600">🎉 {paidOffDebts} schuld{paidOffDebts > 1 ? 'en' : ''} afbetaald!</p>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 flex-1 sm:flex-none"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {(filters.status !== 'all' || filters.creditorType !== 'all' || filters.minAmount || filters.maxAmount || filters.dateFrom || filters.dateTo) && (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowScanModal(true)}
            className="flex items-center gap-2 flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            📸
            <span className="hidden sm:inline">Scan Brief</span>
            <span className="sm:hidden">Scan</span>
          </Button>
          <Button 
            data-tour="add-debt"
            size="sm"
            onClick={() => {
              // On mobile, show choice modal. On desktop, go straight to form
              if (window.innerWidth < 768) {
                setShowAddChoiceModal(true);
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-green-500 hover:bg-green-600 flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nieuwe Schuld</span>
            <span className="sm:hidden">Nieuw</span>
          </Button>
        </div>
      </div>

      <div className="w-full md:max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Zoek op naam of status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-1">
            {filteredAndSortedDebts.length} resultaten gevonden
          </p>
        )}
      </div>

      {/* VTLB / Budget Info Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm text-gray-600">Afloscapaciteit</span>
              </div>
              <button
                onClick={() => setShowVtlbInfo(true)}
                className="p-1 rounded-full hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                title="Wat is VTLB?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {vtblData ? formatCurrency(vtblData.aflosCapaciteit) : formatCurrency(availableBudget)}
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs sm:text-sm text-blue-600"
              onClick={() => window.location.href = createPageUrl('VTLBCalculator')}
            >
              VTLB berekenen →
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="text-xs sm:text-sm text-gray-600">Openstaand</span>
              </div>
              <button 
                onClick={() => setShowTotalAmount(!showTotalAmount)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={showTotalAmount ? "Bedrag verbergen" : "Bedrag tonen"}
              >
                {showTotalAmount ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-600">
              {showTotalAmount ? formatCurrency(totalDebtAmount) : "€ ••••"}
            </p>
            <p className="text-xs text-gray-500">{debts.filter(d => d.status !== 'afbetaald').length} schulden</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <span className="text-base sm:text-lg">⚡</span>
              <span className="text-xs sm:text-sm text-gray-600">Strategie</span>
            </div>
            {activeStrategy ? (
              <>
                <p className="text-base sm:text-lg font-bold text-purple-600 capitalize">
                  {activeStrategy.strategy_type === 'snowball' ? '❄️ Sneeuwbal' : 
                   activeStrategy.strategy_type === 'avalanche' ? '⚡ Lawine' : 
                   '⚖️ Gelijk'}
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs sm:text-sm text-purple-600"
                  onClick={() => setShowStrategyModal(true)}
                >
                  Wijzigen →
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-gray-500">Geen strategie</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs sm:text-sm text-purple-600"
                  onClick={() => setShowStrategyModal(true)}
                >
                  Kies strategie →
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Debt Analysis Widget */}
      <AIDebtAnalysisWidget 
        debts={debts}
        vtlbData={vtblData}
      />

      {/* Active Strategy Widget */}
      {activeStrategy && (
        <ActiveStrategyWidget 
          strategy={activeStrategy}
          schedule={payoffSchedule}
          debts={debts}
          onDeactivate={handleDeactivateStrategy}
        />
      )}

      {/* Gamification Widgets - Collapsible */}
      <Card className="border-purple-200">
        <CardHeader 
          className="cursor-pointer py-2 sm:py-3 hover:bg-gray-50 transition-colors px-3 sm:px-6"
          onClick={() => setShowGamification(!showGamification)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              🎮 Voortgang & Uitdagingen
            </CardTitle>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showGamification ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        {showGamification && (
          <CardContent className="pt-0 px-3 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
          </CardContent>
        )}
      </Card>

      {activeDebts > 0 && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <CardContent className="p-3 sm:p-4">
            <p className="font-medium text-green-800 text-sm sm:text-base">
              💪 {activeDebts} actieve regeling{activeDebts > 1 ? 'en' : ''}! Blijf volhouden.
            </p>
            <p className="text-xs sm:text-sm text-green-600">
              Openstaand: {formatCurrency(totalDebtAmount)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3" data-tour="debt-list">
        {/* Mobile Sort Options */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-gray-500 flex-shrink-0">Sorteer:</span>
          {[
            { field: 'creditor_name', label: 'Naam' },
            { field: 'amount', label: 'Bedrag' },
            { field: 'origin_date', label: 'Datum' },
            { field: 'status', label: 'Status' }
          ].map(opt => (
            <button
              key={opt.field}
              onClick={() => handleSort(opt.field)}
              className={`px-3 py-1.5 rounded-full text-sm flex-shrink-0 flex items-center gap-1 ${
                sortField === opt.field 
                  ? 'bg-green-100 text-green-700 font-medium' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {opt.label}
              {sortField === opt.field && (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>

        {paginatedDebts.map((debt) => {
          const creditorIcon = getCreditorIcon(debt.creditor_type, debt.creditor_name);
          const IconComponent = creditorIcon.icon;
          
          return (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              onClick={() => handleViewDetails(debt)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${creditorIcon.color} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{debt.creditor_name}</p>
                    <p className="text-sm text-gray-500">{creditorTypeLabels[debt.creditor_type] || debt.creditor_type || 'Schuldeiser'}</p>
                  </div>
                </div>
                <Badge className={`${statusColors[debt.status]} flex-shrink-0`}>
                  {statusLabels[debt.status]}
                </Badge>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {showTotalAmount ? formatCurrency(debt.amount || 0) : "€ ••••"}
                  </p>
                  {debt.status === 'betalingsregeling' && debt.monthly_payment && (
                    <p className="text-sm text-blue-600">
                      {formatCurrency(debt.monthly_payment)}/mnd
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {debt.origin_date && new Date(debt.origin_date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  {debt.case_number && (
                    <p className="text-xs text-gray-400">#{debt.case_number}</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Vorige
            </Button>
            <span className="text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Volgende
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <Card data-tour="debt-list" className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left">
                  <th className="p-4 font-medium text-gray-700">
                    <button 
                      onClick={() => handleSort('creditor_name')}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Naam/incasso
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="p-4 font-medium text-gray-700">
                    <button 
                      onClick={() => handleSort('origin_date')}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Datum
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="p-4 font-medium text-gray-700">Dossiernummer</th>
                  <th className="p-4 font-medium text-gray-700">
                    <button 
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Bedrag
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="p-4 font-medium text-gray-700">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Status
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </th>
                  <th className="p-4 font-medium text-gray-700">Acties</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDebts.map((debt) => {
                  const creditorIcon = getCreditorIcon(debt.creditor_type, debt.creditor_name);
                  const IconComponent = creditorIcon.icon;
                  
                  return (
                    <motion.tr 
                      key={debt.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${creditorIcon.color} flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{debt.creditor_name}</p>
                            <p className="text-sm text-gray-500">{creditorTypeLabels[debt.creditor_type] || debt.creditor_type || 'Schuldeiser'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">
                        {debt.origin_date && new Date(debt.origin_date).toLocaleDateString('nl-NL', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-gray-700">
                        {debt.case_number || '-'}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {showTotalAmount ? formatCurrency(debt.amount || 0) : "€ ••••"}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <Badge className={statusColors[debt.status]}>
                            {statusLabels[debt.status]}
                          </Badge>
                          {debt.status === 'betalingsregeling' && debt.monthly_payment && (
                            <div className="text-xs text-blue-600">
                              {formatCurrency(debt.monthly_payment)}/mnd
                              {((debt.amount || 0) - (debt.amount_paid || 0)) > 0 && (
                                <span className="text-gray-500 ml-1">
                                  ({Math.ceil(((debt.amount || 0) - (debt.amount_paid || 0)) / debt.monthly_payment)} mnd)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(debt)}
                        >
                          Details
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Tonen {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedDebts.length)} van {filteredAndSortedDebts.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Vorige
                </Button>
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
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-green-500 hover:bg-green-600' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

                        {/* Wizard voor nieuwe schulden */}
      <DebtWizard
        isOpen={showAddForm && !editingDebt}
        onClose={() => setShowAddForm(false)}
        onSave={loadDebts}
      />

      {/* Form voor bewerken */}
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

      <DebtsInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      <ScanDebtModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onDebtScanned={handleDebtScanned}
      />

      {/* Add Choice Modal (Mobile) */}
      {showAddChoiceModal && (
        <>
          <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" onClick={() => setShowAddChoiceModal(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[2001] bg-white rounded-t-3xl p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nieuwe schuld toevoegen</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddChoiceModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAddChoiceModal(false);
                  setShowScanModal(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">
                  📸
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Scan incassobrief</h3>
                  <p className="text-sm text-gray-600">Maak een foto van je brief</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddChoiceModal(false);
                  setShowAddForm(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Pencil className="w-7 h-7 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">Handmatig invoeren</h3>
                  <p className="text-sm text-gray-600">Vul de gegevens zelf in</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* VTLB Info Modal */}
      <Dialog open={showVtlbInfo} onOpenChange={setShowVtlbInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Wat is VTLB?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>VTLB</strong> = Vrij Te Laten Bedrag
              </p>
            </div>
            
            <p className="text-gray-700">
              Dit is het bedrag dat je <strong>minimaal nodig hebt om van te leven</strong>. De rest kun je gebruiken om schulden af te lossen.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Je inkomen</span>
                <span className="font-medium">€ 2.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Min: VTLB (levensonderhoud)</span>
                <span className="font-medium text-red-600">- € 1.500</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-900">= Afloscapaciteit</span>
                <span className="font-bold text-blue-600">€ 500</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              💡 Dit bedrag kun je maandelijks gebruiken voor betalingsregelingen met schuldeisers.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      </motion.div>
      );
}