import React, { useState, useEffect, useMemo, useCallback } from "react";
import { User } from "@/api/entities";
import { Pot } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { vtblService, incomeService } from "@/components/services";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, Scale, Info, Link as LinkIcon, PiggyBank } from 'lucide-react';
import { createPageUrl } from "@/utils";
import PotjeModal from "../components/potjes/PotjeModal";
import PotjesInfoModal from "../components/potjes/PotjesInfoModal";
import PotDepositModal from "../components/potjes/PotDepositModal";
import PotActivityModal from "../components/potjes/PotActivityModal";
import { useTranslation } from "@/components/utils/LanguageContext";
import { formatCurrency } from "@/components/utils/formatters";

import { useLocation } from "react-router-dom";
import PotjesComparisonChart from "@/components/centvoorcent/PotjesComparisonChart";
import WishlistManager from "@/components/potjes/WishlistManager";


const getStartOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const potjesTranslations = {
  'potjes.myPots': { nl: 'Mijn Potjes', en: 'My Pots', es: 'Mis Fondos', pl: 'Moje Słoiki', de: 'Meine Töpfe', fr: 'Mes Cagnottes', tr: 'Kumbaralarım', ar: 'أوعيتي' },
  'potjes.missingIncome': { nl: 'Geen inkomen ingevoerd', en: 'No income entered', es: 'Sin ingresos ingresados', pl: 'Nie wprowadzono dochodu', de: 'Kein Einkommen eingegeben', fr: 'Aucun revenu saisi', tr: 'Gelir girilmedi', ar: 'لم يتم إدخال دخل' },
  'potjes.missingIncomeDescription': { nl: 'Om je potjes in te kunnen stellen heb je eerst inkomen nodig.', en: 'To set up your pots, you need to enter income first.', es: 'Para configurar tus fondos, primero necesitas ingresar ingresos.', pl: 'Aby skonfigurować swoje słoiki, musisz najpierw wprowadzić dochód.', de: 'Um Ihre Töpfe einzurichten, müssen Sie zuerst Einkommen eingeben.', fr: 'Pour configurer vos cagnottes, vous devez d\'abord saisir un revenu.', tr: 'Kumbaralarınızı ayarlamak için önce gelir girmeniz gerekir.', ar: 'لإعداد أوعيتك، تحتاج أولاً إلى إدخال الدخل.' },
  'potjes.enterIncomeButton': { nl: 'Inkomen invoeren', en: 'Enter income', es: 'Ingresar ingresos', pl: 'Wprowadź dochód', de: 'Einkommen eingeben', fr: 'Saisir een revenu', tr: 'Gelir gir', ar: 'أدخل الدخل' },
  'potjes.financialSpace': { nl: 'Financiële Ruimte', en: 'Financial Space', es: 'Espacio Financiero', pl: 'Przestrzeń Finansowa', de: 'Finanzieller Spielraum', fr: 'Espace Financier', tr: 'Mali Alan', ar: 'المساحة المالية' },
  'potjes.fixedIncome': { nl: 'Vast inkomen', en: 'Fixed income', es: 'Ingresos fijos', pl: 'Stały dochód', de: 'Festes Einkommen', fr: 'Revenu fixe', tr: 'Sabit gelir', ar: 'الدخل الثابت' },
  'potjes.fixedCostsArrangements': { nl: 'Vaste lasten + regelingen', en: 'Fixed costs + arrangements', es: 'Costos fijos + acuerdos', pl: 'Koszty stałe + ustalenia', de: 'Fixkosten + Vereinbarungen', fr: 'Frais fixes + arrangements', tr: 'Sabit masraflar + düzenlemeler', ar: 'التكاليف الثابتة + الترتيبات' },
  'potjes.availableForPots': { nl: 'Beschikbaar voor potjes', en: 'Available for pots', es: 'Disponible para fondos', pl: 'Dostępne dla słoików', de: 'Verfügbar für Töpfe', fr: 'Disponible pour cagnottes', tr: 'Kumbaralar voorhanden', ar: 'متاح للأوعية' },
  'potjes.allocatedToPots': { nl: 'Toegewezen aan Potjes', en: 'Allocated to Pots', es: 'Asignado a Fondos', pl: 'Przypisane do Słoików', de: 'Zugeteilt an Töpfe', fr: 'Alloué aux Cagnottes', tr: 'Kumbaralara Tahsis Edildi', ar: 'المخصص للأوعية' },
  'potjes.perMonth': { nl: 'per maand', en: 'per month', es: 'por mes', pl: 'miesięcznie', de: 'pro Monat', fr: 'par mois', tr: 'ayda', ar: 'شهرياً' },
  'potjes.remaining': { nl: 'over', en: 'remaining', es: 'restante', pl: 'pozostało', de: 'übrig', fr: 'restant', tr: 'kalan', ar: 'المتبقي' },
  'potjes.overAllocatedWarning': { nl: 'Je hebt meer toegewezen dan je beschikbaar hebt!', en: 'You have allocated more than you have available!', es: '¡Has asignado más de lo que tienes disponible!', pl: 'Przypisałeś więcej niż masz dostępne!', de: 'Sie haben mehr zugeteilt als Sie verfügbar haben!', fr: 'Vous avez alloué plus que ce que vous avez disponible!', tr: 'Mevcut olandan fazla tahsis ettiniz!', ar: 'لقد خصصت أكثر مما لديك!' },
  'potjes.addPot': { nl: 'Potje Toevoegen', en: 'Add Pot', es: 'Agregar Fondo', pl: 'Dodaj Słoik', de: 'Topf Hinzufügen', fr: 'Ajouter Cagnotte', tr: 'Kumbara Ekle', ar: 'إضافة وعاء' },
  'potjes.budget': { nl: 'Budget', en: 'Budget', es: 'Presupuesto', pl: 'Budżet', de: 'Budget', fr: 'Budget', tr: 'Bütçe', ar: 'الميزانية' },
  'potjes.spent': { nl: 'Uitgegeven', en: 'Spent', es: 'Gastado', pl: 'Wydane', de: 'Ausgegeben', fr: 'Dépensé', tr: 'Harcanan', ar: 'المنفق' },
  'potjes.viewLink': { nl: 'Bekijk link', en: 'View link', es: 'Ver enlace', pl: 'Zobacz link', de: 'Link ansehen', fr: 'Voir le lien', tr: 'Linki görüntüle', ar: 'عرض الرابط' },
  'potjes.weekly': { nl: 'Wekelijks', en: 'Weekly', es: 'Semanal', pl: 'Tygodniowo', de: 'Zweiwöchentlich', fr: 'Hebdomadaire', tr: 'Haftalık', ar: 'أسبوعي' },
  'potjes.biweekly': { nl: 'Tweewekelijks', en: 'Biweekly', es: 'Quincenal', pl: 'Dwutygodniowo', de: 'Zweiwöchentlich', fr: 'Bihebdomadaire', tr: 'İki haftada bir', ar: 'كل أسبوعين' },
  'potjes.monthly': { nl: 'Maandelijks', en: 'Monthly', es: 'Mensual', pl: 'Miesięcznie', de: 'Monatlich', fr: 'Mensuel', tr: 'Aylık', ar: 'شهري' },
  'potjes.flexible': { nl: 'Flexibel', en: 'Flexible', es: 'Flexible', pl: 'Elastyczny', de: 'Flexibel', fr: 'Flexible', tr: 'Esnek', ar: 'مرن' },
};

const Potjes = () => {
  const { t: tFromHook, language } = useTranslation();
  const { toast } = useToast();
  const location = useLocation();

  const t = useCallback((key, options) => {
    let translation = potjesTranslations[key]?.[language];
    if (translation) {
      if (options) {
        Object.keys(options).forEach(optionKey => {
          translation = translation.replace(`{${optionKey}}`, options[optionKey]);
        });
      }
      return translation;
    }
    return tFromHook(key, options);
  }, [language, tFromHook]);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [potjes, setPotjes] = useState([]);
  const [potjeSpendings, setPotjeSpendings] = useState({});
  const [potNotifications, setPotNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedPot, setSelectedPot] = useState(null);
  const [vtblData, setVtblData] = useState(null);
  const [error, setError] = useState(null);
  const [totalIncome, setTotalIncome] = useState(0);

  // New state for deposit modal
  const [depositPot, setDepositPot] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  // New state for activity modal
  const [activityPot, setActivityPot] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);



  // NIBUD percentages (hard-coded)
  const NIBUD_PERCENTAGES = {
    'wonen': 35,
    'eten_drinken': 15,
    'vervoer': 10,
    'uitgaan': 8,
    'zorg': 6,
    'energie': 5,
    'telefoon_internet': 3,
    'kleding': 5,
    'sparen_buffer': 12,
    'overig': 1
  };

  const NIBUD_LABELS = {
    'wonen': 'Wonen',
    'eten_drinken': 'Eten & Drinken',
    'vervoer': 'Vervoer',
    'uitgaan': 'Uitgaan',
    'zorg': 'Zorg',
    'energie': 'Energie',
    'telefoon_internet': 'Telefoon/Internet',
    'kleding': 'Kleding',
    'sparen_buffer': 'Sparen/Buffer',
    'overig': 'Overig'
  };

  const fetchData = useCallback(async () => {
    console.log('🔄 Potjes: fetchData called');
    setLoading(true);
    setError(null);
    
    try {
      const userData = await User.me();
      console.log('👤 User loaded:', userData.email);
      setUser(userData);

      const userFilter = { created_by: userData.email };
      
      console.log('📊 Fetching potjes data...');
      let [allPots, allIncomes, allCosts, allDebts, allTransactions] = await Promise.all([
        Pot.filter(userFilter),
        Income.filter(userFilter),
        MonthlyCost.filter(userFilter),
        Debt.filter(userFilter),
        Transaction.filter(userFilter)
      ]);

      // 🍔 Automatisch Bad Habits potje aanmaken als het niet bestaat
      const hasBadHabits = allPots.some(p => p.name === 'Bad Habits');
      if (!hasBadHabits) {
        console.log('🍔 Bad Habits potje bestaat niet, aanmaken...');
        const newPot = await Pot.create({
          name: 'Bad Habits',
          icon: '🍔',
          description: 'Uitgaven die je eigenlijk niet nodig had (fastfood, impulsaankopen, etc.)',
          pot_type: 'expense',
          category: 'uitgaan',
          is_essential: false,
          monthly_budget: 50,
          spending_frequency: 'flexible',
          payment_day: 1,
          display_order: 999
        });
        allPots = [...allPots, newPot];
        console.log('✅ Bad Habits potje aangemaakt!');
      }

      console.log('✅ Data fetched:', {
        pots: allPots.length,
        incomes: allIncomes.length,
        costs: allCosts.length,
        debts: allDebts.length,
        transactions: allTransactions.length
      });

      setPotjes(allPots.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));

      const incomeData = incomeService.processIncomeData(allIncomes, new Date());
      const totalMonthlyIncome = incomeData.total;
      setTotalIncome(totalMonthlyIncome);
      
      console.log('💰 Total Income (vast + extra):', totalMonthlyIncome);

      // 🔥 LIVE BEREKENING: Bereken vaste lasten EXACT zoals MaandelijkseLasten pagina
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day
      
      const activeCosts = allCosts.filter(cost => {
        // Als er start_date is, gebruik die logica
        if (cost.start_date) {
          const startDate = new Date(cost.start_date);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = cost.end_date ? new Date(cost.end_date) : null;
          if (endDate) endDate.setHours(0, 0, 0, 0);
          
          // Check of vandaag binnen de actieve periode valt
          const isAfterStart = today >= startDate;
          const isBeforeEnd = !endDate || today <= endDate;
          
          return isAfterStart && isBeforeEnd;
        }
        
        // Legacy: als geen start_date, gebruik oude status logica
        return cost.status === 'actief';
      });
      
      const totalFixedCosts = activeCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);

      // 🔥 LIVE BEREKENING: Bereken schuldregelingen direct
      const activeDebtPayments = allDebts
        .filter(d => d.status === 'betalingsregeling' && d.monthly_payment)
        .reduce((sum, debt) => sum + (debt.monthly_payment || 0), 0);

      console.log('💰 Calculating VTBL...');
      const vtbl = await vtblService.calculateVtbl(allIncomes, allCosts, allDebts);
      console.log('✅ VTBL calculated:', vtbl);
      
      // 🔥 Override VTBL met live berekeningen
      vtbl.vasteLasten = totalFixedCosts;
      vtbl.huidigeRegelingen = activeDebtPayments;
      
      console.log('🔥 Live calculated:', {
        vasteLasten: totalFixedCosts,
        huidigeRegelingen: activeDebtPayments,
        total: totalFixedCosts + activeDebtPayments
      });
      
      setVtblData(vtbl);

      const monthStart = getStartOfMonth(new Date());
      const monthEnd = getEndOfMonth(new Date());

      // 🔍 DEBUG: Log alle transacties
      console.log('🔍 All transactions for this month:', allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= monthStart && txDate <= monthEnd;
      }).map(tx => ({
        id: tx.id,
        category: tx.category,
        amount: tx.amount,
        date: tx.date,
        type: tx.type
      })));

      // Bereken spendings per potje
      const spendingsMap = {};
      allPots.forEach(pot => {
        if (pot.pot_type === 'expense') { 
          const potTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            const isInMonth = txDate >= monthStart && txDate <= monthEnd;
            const isExpense = tx.type === 'expense'; 
            const categoryMatches = tx.category === pot.name; // This should ideally match pot.category if that's where expense category is stored. Currently using pot.name
            
            console.log(`🔍 Checking transaction for pot "${pot.name}" (Tx ID: ${tx.id}):`, {
              txCategory: tx.category,
              potName: pot.name,
              matches: categoryMatches,
              isExpense,
              isInMonth,
              txAmount: tx.amount,
              txDate: tx.date
            });
            
            return isInMonth && isExpense && categoryMatches;
          });
          
          const totalSpent = potTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
          spendingsMap[pot.id] = totalSpent;
          
          console.log(`💸 Pot "${pot.name}" (ID: ${pot.id}):`, {
            matchedTransactions: potTransactions.length,
            transactions: potTransactions.map(tx => ({
              amount: tx.amount,
              date: tx.date,
              description: tx.description,
              category: tx.category
            })),
            totalSpent: totalSpent
          });
        } else {
          spendingsMap[pot.id] = 0;
        }
      });
      
      setPotjeSpendings(spendingsMap);

      // Notifications voor potjes
      const notifications = [];
      allPots.forEach(pot => {
        if (pot.pot_type === 'savings') {
          const progress = pot.target_amount ? ((pot.current_amount || 0) / pot.target_amount) * 100 : 0;
          
          if (progress >= 100) {
            notifications.push({
              type: 'success',
              message: `🎉 ${pot.icon} ${pot.name} doel bereikt! Je hebt ${formatCurrency(pot.current_amount)} gespaard!`
            });
          } else if (progress >= 75) {
            notifications.push({
              type: 'info',
              message: `🎯 ${pot.icon} ${pot.name} is bijna vol! Nog ${formatCurrency((pot.target_amount || 0) - (pot.current_amount || 0))} te gaan`
            });
          }
          return;
        }

        const spent = spendingsMap[pot.id] || 0;
        const remaining = (pot.monthly_budget || 0) - spent;
        const percentage = (pot.monthly_budget || 0) > 0 ? (spent / pot.monthly_budget) * 100 : 0;

        if (percentage >= 90 && remaining > 0) {
          notifications.push({
            type: 'warning',
            message: `${pot.icon} ${pot.name} is bijna op (${formatCurrency(remaining)} over)`
          });
        } else if (remaining < 0) {
          notifications.push({
            type: 'danger',
            message: `${pot.icon} ${pot.name} heeft een tekort van ${formatCurrency(Math.abs(remaining))}`
          });
        }
      });
      setPotNotifications(notifications);


      console.log('✅ Potjes page data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching potjes data:', error);
      setError(error.message);
      toast({ 
        title: 'Fout bij laden', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Effect voor initiële data load (alleen 1x bij mount)
  useEffect(() => {
    console.log('🚀 Potjes page mounted, fetching data...');
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.openAddPot) {
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const totalAllocated = useMemo(() => {
    return potjes.reduce((sum, pot) => sum + (parseFloat(pot.monthly_budget) || 0), 0);
  }, [potjes]);

  // ✅ Bereken beschikbaar voor potjes: TOTAAL inkomen - vaste lasten - regelingen
  const fixedCostsAndArrangements = vtblData ? (vtblData.vasteLasten + vtblData.huidigeRegelingen) : 0;
  const availableForPots = totalIncome - fixedCostsAndArrangements;
  const remaining = availableForPots - totalAllocated;

  const sortedPotjes = useMemo(() => {
    return [...potjes].sort((a, b) => {
      // Prioritize savings pots first, then essential, then display order
      if (a.pot_type !== b.pot_type) {
        return a.pot_type === 'savings' ? -1 : 1;
      }
      if (a.is_essential !== b.is_essential) {
        return a.is_essential ? -1 : 1;
      }
      return (a.display_order || 0) - (b.display_order || 0);
    });
  }, [potjes]);

  // 🆕 Bereken NIBUD vergelijking per categorie
  const potjesChartData = useMemo(() => {
    const NIBUD_PERCENTAGES_LOCAL = {
      'wonen': 35,
      'eten_drinken': 15,
      'vervoer': 10,
      'uitgaan': 8,
      'zorg': 6,
      'energie': 5,
      'telefoon_internet': 3,
      'kleding': 5,
      'sparen_buffer': 12,
      'overig': 1
    };

    const NIBUD_LABELS_LOCAL = {
      'wonen': 'Wonen',
      'eten_drinken': 'Eten & Drinken',
      'vervoer': 'Vervoer',
      'uitgaan': 'Uitgaan',
      'zorg': 'Zorg',
      'energie': 'Energie',
      'telefoon_internet': 'Telefoon/Internet',
      'kleding': 'Kleding',
      'sparen_buffer': 'Sparen/Buffer',
      'overig': 'Overig'
    };

    const categoryMap = {};

    // Group potjes by category
    potjes.filter(p => p.pot_type === 'expense' && p.category).forEach(pot => {
      if (!categoryMap[pot.category]) {
        categoryMap[pot.category] = {
          category: pot.category,
          label: NIBUD_LABELS_LOCAL[pot.category] || pot.category,
          budget: 0,
          spent: 0,
          nibud_advice: totalIncome * (NIBUD_PERCENTAGES_LOCAL[pot.category] || 0) / 100,
          nibud_percentage: NIBUD_PERCENTAGES_LOCAL[pot.category] || 0
        };
      }
      categoryMap[pot.category].budget += pot.monthly_budget || 0;
      categoryMap[pot.category].spent += potjeSpendings[pot.id] || 0;
    });

    return Object.values(categoryMap).filter(c => c.budget > 0 || c.spent > 0);
  }, [potjes, potjeSpendings, totalIncome]);

  const handleSelectPot = useCallback((pot) => {
    setSelectedPot(pot);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedPot(null);
  }, []);

  const handlePotSaved = useCallback(() => {
    console.log('✅ Pot saved, refreshing data...');
    setShowModal(false);
    setSelectedPot(null);
    fetchData(); // Herlaad data na save
  }, [fetchData]);

  // New deposit handlers
  const handleOpenDeposit = useCallback((pot) => {
    setDepositPot(pot);
    setShowDepositModal(true);
  }, []);

  const handleDepositComplete = useCallback(() => {
    console.log('✅ Deposit complete, refreshing data...');
    setShowDepositModal(false);
    setDepositPot(null);
    fetchData(); // Herlaad data
  }, [fetchData]);

  // New activity handlers
  const handleViewActivity = useCallback((pot) => {
    setActivityPot(pot);
    setShowActivityModal(true);
  }, []);

  // Handler for when a transaction is deleted
  const handleTransactionDeleted = useCallback(() => {
    console.log('✅ Transaction deleted, refreshing data...');
    fetchData(); // Reload all data
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[var(--konsensi-primary)] mx-auto"></div>
        <p className="text-gray-600 text-sm mt-4">Potjes laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fout bij laden</h2>
        <p className="text-gray-600 mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData}>Opnieuw proberen</Button>
      </div>
    );
  }

  // ✅ Check op TOTAAL inkomen
  if (!totalIncome || totalIncome === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('potjes.missingIncome')}</h2>
        <p className="text-gray-600 mb-6 max-w-md">{t('potjes.missingIncomeDescription')}</p>
        <Button
          onClick={() => window.location.href = createPageUrl('Income')}
          className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
        >
          {t('potjes.enterIncomeButton')}
        </Button>
      </div>
    );
  }

  const showLowBudgetWarning = availableForPots <= 0 && totalIncome > 0;

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🏺 {t('potjes.myPots')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Verdeel je inkomen over verschillende enveloppes</p>
        </div>
        <div className="flex gap-2">
          {/* ✅ INFO BUTTON TERUG */}
          <Button
            variant="outline"
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-2"
          >
            <Info className="w-5 h-5" />
            <span className="hidden sm:inline">Info</span>
          </Button>
          
          {potNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowInfoModal(true)}
              className="relative"
            >
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              <span className="hidden sm:inline">{potNotifications.length} meldingen</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {potNotifications.length}
              </span>
            </Button>
          )}
          
          <Button
            data-tour="add-pot"
            onClick={() => setShowModal(true)}
            className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('potjes.addPot')}
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            Enveloppe Overzicht
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Je totale inkomen verdeeld over je uitgaven</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">💰 Totaal Inkomen (deze maand)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
              {vtblData && (
                <p className="text-xs text-gray-500 mt-1">
                  Vast: {formatCurrency(vtblData.vastInkomen)} + 
                  Extra: {formatCurrency(totalIncome - vtblData.vastInkomen)}
                </p>
              )}
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">🏠 Vaste Lasten + Regelingen</p>
              <p className="text-2xl font-bold text-red-600">-{formatCurrency(fixedCostsAndArrangements)}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">📊 Beschikbaar voor Potjes</p>
              <p className={`text-2xl font-bold ${availableForPots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.max(0, availableForPots))}
              </p>
            </div>
          </div>

          {showLowBudgetWarning && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-orange-900 mb-1">Geen ruimte voor potjes</h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Je vaste lasten en betalingsregelingen ({formatCurrency(fixedCostsAndArrangements)}) 
                    zijn momenteel hoger dan of gelijk aan je inkomen ({formatCurrency(totalIncome)}). 
                  </p>
                  <div className="text-xs text-orange-700">
                    <strong>Tip:</strong> Bekijk je vaste lasten en betalingsregelingen om te zien waar je kunt besparen, 
                    of verhoog je inkomen door extra werk of toeslagen aan te vragen.
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showLowBudgetWarning && availableForPots > 0 && (
            <div className="bg-white/90 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{t('potjes.allocatedToPots')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(totalAllocated)} <span className="text-sm text-gray-500">/ {formatCurrency(availableForPots)}</span>
                </span>
              </div>
              <Progress value={Math.min((totalAllocated / availableForPots) * 100, 100)} className="h-3" />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} te veel toegewezen` : `${formatCurrency(remaining)} ${t('potjes.remaining')}`}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((totalAllocated / availableForPots) * 100)}% verdeeld
                </span>
              </div>
              {remaining < 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {t('potjes.overAllocatedWarning')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🆕 NIBUD VERGELIJKING GRAFIEK */}
      {potjesChartData.length > 0 && (
        <PotjesComparisonChart 
          categoryData={potjesChartData}
          totalIncome={totalIncome}
        />
      )}

      {/* 🎁 VERLANGLIJSTEN WIDGET */}
      {user && <WishlistManager userEmail={user.email} />}

      {sortedPotjes.length === 0 ? (
        <Card data-tour="pots-overview" className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen potjes aangemaakt</h3>
            <p className="text-gray-600 mb-6">Maak je eerste potje aan om je budget te beheren</p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Eerste potje maken
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div data-tour="pots-overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPotjes.map(potje => {
            const spent = potjeSpendings[potje.id] || 0;
            const remaining = (potje.monthly_budget || 0) - spent;
            const potjeProgress = (potje.monthly_budget || 0) > 0 ? (spent / potje.monthly_budget) * 100 : 0;

            // 🆕 Voor spaarpotjes: bereken voortgang naar doel
            const savingsProgress = potje.pot_type === 'savings' && potje.target_amount
              ? Math.min(100, ((potje.current_amount || 0) / potje.target_amount) * 100)
              : 0;

            const savingsRemaining = potje.pot_type === 'savings'
              ? (potje.target_amount || 0) - (potje.current_amount || 0)
              : 0;

            // 🆕 NIBUD berekening voor dit potje
            const nibudPercentage = potje.category ? NIBUD_PERCENTAGES[potje.category] : null;
            const nibudAmount = nibudPercentage && totalIncome > 0 
              ? Math.round((totalIncome * nibudPercentage) / 100)
              : null;
            const nibudLabel = potje.category ? NIBUD_LABELS[potje.category] : null;

            return (
              <Card 
                key={potje.id} 
                className="flex flex-col hover:shadow-lg transition-shadow" 
              >
                <CardHeader 
                  onClick={() => potje.pot_type === 'expense' && handleSelectPot(potje)} 
                  className={potje.pot_type === 'expense' ? 'cursor-pointer' : ''}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{potje.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{potje.name}</h3>
                        {potje.pot_type === 'savings' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Sparen
                          </span>
                        )}
                      </div>
                      {potje.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{potje.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {potje.pot_type === 'savings' ? (
                          <>Maandelijks: <span className="font-medium">{formatCurrency(potje.monthly_budget || 0)}</span></>
                        ) : (
                          <>{t('potjes.budget')}: <span className="font-medium">{formatCurrency(potje.monthly_budget || 0)}</span></>
                        )}
                      </p>
                      
                      {/* 🆕 NIBUD RICHTLIJN TONEN */}
                      {nibudAmount !== null && nibudLabel && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>💡</span>
                          <span>NIBUD richtlijn ({nibudLabel}): {formatCurrency(nibudAmount)} ({nibudPercentage}%)</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                  {potje.pot_type === 'savings' ? (
                    // SPAARPOTJE WEERGAVE
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Gespaard</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(potje.current_amount || 0)}
                          </span>
                        </div>
                        <Progress value={savingsProgress} className="h-2" />
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-500">
                            {savingsRemaining > 0 
                              ? `Nog ${formatCurrency(savingsRemaining)} te gaan`
                              : '🎉 Doel bereikt!'
                            }
                          </span>
                          <span className="text-gray-500">{Math.round(savingsProgress)}%</span>
                        </div>
                        {potje.target_date && (
                          <p className="text-xs text-gray-500 mt-2">
                            📅 Doel: {new Date(potje.target_date).toLocaleDateString('nl-NL')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenDeposit(potje)}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          size="sm"
                        >
                          <PiggyBank className="w-4 h-4 mr-2" />
                          Storten
                        </Button>
                        <Button
                          onClick={() => handleSelectPot(potje)}
                          variant="outline"
                          size="sm"
                        >
                          Bewerken
                        </Button>
                      </div>
                    </>
                  ) : (
                    // UITGAVEN POTJE WEERGAVE (bestaand)
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">{t('potjes.spent')}</span>
                          <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatCurrency(spent)}
                          </span>
                        </div>
                        <Progress value={Math.min(potjeProgress, 100)} className="h-2" />
                        <div className="flex justify-between text-xs mt-1">
                          <span className={remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {remaining < 0 ? `${formatCurrency(Math.abs(remaining))} te veel` : `${formatCurrency(remaining)} ${t('potjes.remaining')}`}
                          </span>
                          <span className="text-gray-500">{Math.round(potjeProgress)}%</span>
                        </div>

                        {/* Bad Habits Warning */}
                        {(potje.name.toLowerCase().includes('bad habit') || potje.name.toLowerCase().includes('slechte gewoontes')) && spent > 0 && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-xs text-orange-800 flex items-center gap-1">
                              ⚠️ Dit zijn uitgaven die je eigenlijk niet nodig had
                            </p>
                          </div>
                        )}
                      </div>

                      {potje.spending_frequency && potje.spending_frequency !== 'flexible' && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          📅 {t(`potjes.${potje.spending_frequency}`)}
                          {potje.payment_day && ` - dag ${potje.payment_day}`}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewActivity(potje);
                        }}
                        className="mt-3 w-full text-xs"
                      >
                        📋 Bekijk activiteit
                      </Button>
                    </>
                  )}

                  {/* ✅ LINK VOOR BEIDE POT TYPES */}
                  {potje.external_link && (
                    <a 
                      href={potje.external_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2 flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {potje.pot_type === 'savings' ? 'Bekijk product' : t('potjes.viewLink')}
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card 
            className="border-dashed border-2 border-gray-300 hover:border-[var(--konsensi-primary)] transition-colors cursor-pointer" 
            onClick={() => setShowModal(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">{t('potjes.addPot')}</h3>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ✅ MODALS */}
      <PotjeModal 
        pot={selectedPot}
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handlePotSaved}
      />
     
      <PotjesInfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        notifications={potNotifications}
      />

      {/* 🆕 DEPOSIT MODAL */}
      <PotDepositModal 
        pot={depositPot}
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setDepositPot(null);
        }}
        onDeposited={handleDepositComplete}
      />

      {/* 🆕 ACTIVITY MODAL */}
      <PotActivityModal 
        pot={activityPot}
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setActivityPot(null);
        }}
        spent={activityPot ? (potjeSpendings[activityPot.id] || 0) : 0}
        onTransactionDeleted={handleTransactionDeleted}
      />
    </motion.div>
  );
};

export default Potjes;