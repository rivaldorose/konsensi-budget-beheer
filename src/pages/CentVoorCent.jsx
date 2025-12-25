import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { MonthlyReport } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Info, Calendar, Clock, Coins, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { formatCurrency } from "@/components/utils/formatters";
// Native date helpers - NO date-fns
const formatMonthYear = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
};

const formatYearMonth = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const subMonthsNative = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};
import CentVoorCentInfoModal from "@/components/info/CentVoorCentInfoModal";
import PotjesComparisonChart from "@/components/centvoorcent/PotjesComparisonChart";
import AIFinancialInsights from "@/components/centvoorcent/AIFinancialInsights";
import FinancialProgressCharts from "@/components/centvoorcent/FinancialProgressCharts";
import TransactionCategorizationReview from "@/components/transactions/TransactionCategorizationReview";
import { Pot } from "@/api/entities";

export default function CentVoorCent() {
  const [selectedMonth, setSelectedMonth] = useState(formatYearMonth(new Date()));
  const [selectedReport, setSelectedReport] = useState(null); // Renamed 'report' to 'selectedReport'
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [generating, setGenerating] = useState(false); // New state for report generation
  const [showCategorizationReview, setShowCategorizationReview] = useState(false);
  const [badHabitsSpent, setBadHabitsSpent] = useState(0);
  const [user, setUser] = useState(null);

  const { toast } = useToast();
  const { t, language } = useTranslation(); // Added 't' for translations

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      const monthDate = `${selectedMonth}-01`;
      
      const existingReports = await MonthlyReport.filter({ 
        created_by: userData.email,
        month: monthDate 
      });

      if (existingReports.length > 0) {
        setSelectedReport(existingReports[0]); // Updated to selectedReport
      } else {
        setSelectedReport(null); // Updated to selectedReport
      }

      // Load bad habits pot spending
      try {
        const allPots = await Pot.filter({ created_by: userData.email });
        const badHabitsPot = allPots.find(p => p.name.toLowerCase().includes('bad habit') || p.name.toLowerCase().includes('slechte gewoontes'));
        
        if (badHabitsPot) {
          const monthStart = new Date(selectedMonth + '-01');
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);

          const { Transaction } = await import('@/api/entities');
          const allTransactions = await Transaction.filter({ created_by: userData.email });
          
          const badHabitsTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= monthStart && 
                   txDate <= monthEnd && 
                   tx.type === 'expense' && 
                   tx.category === badHabitsPot.name;
          });

          const totalBadHabits = badHabitsTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          setBadHabitsSpent(totalBadHabits);
        } else {
          setBadHabitsSpent(0);
        }
      } catch (error) {
        console.error('Error loading bad habits:', error);
        setBadHabitsSpent(0);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: t('common.error'),
        description: t('centvoorcent.loadReportError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      console.log('🔄 Generating report for month:', selectedMonth);
      
      // Call the backend function to generate the report
      const response = await base44.functions.invoke('generateMonthlyReport', { 
        month: selectedMonth 
      });

      if (response.data.success) {
        toast({
          title: '✅ Rapport gegenereerd!',
          description: `Je financiële overzicht voor ${formatMonthYear(new Date(`${selectedMonth}-01`))} is klaar.`,
        });
        
        // Reload the report to show the fresh data
        await loadReport();
      } else {
        throw new Error(response.data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: 'Fout bij genereren',
        description: 'Er ging iets mis bij het maken van je rapport. Probeer het opnieuw.',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = subMonthsNative(new Date(), i);
      options.push({
        value: formatYearMonth(date),
        label: formatMonthYear(date)
      });
    }
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[var(--konsensi-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // New UI for when no report is available
  if (!selectedReport) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('centvoorcent.noReportTitle')}
          </h2>
          <p className="text-gray-600 mb-6">{t('centvoorcent.noReportDescription')}</p>
          <Button onClick={handleGenerateReport} disabled={generating}>
            {generating ? t('common.loading') : t('centvoorcent.generateReport')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6"> {/* Updated div classnames */}
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6"> {/* This remains max-w-7xl as it's part of the original design for the header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold lowercase" style={{ color: '#255c3d' }}>
              cent voor cent
            </h1>
            <p className="text-gray-600 lowercase capitalize">
              {formatMonthYear(new Date(`${selectedMonth}-01`))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCategorizationReview(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Review
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowInfoModal(true)}>
              <Info className="w-4 h-4 mr-2" />
              info
            </Button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-lg capitalize"
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notitie */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">📅 Maandelijks Overzicht</p>
            <p>
              Dit rapport wordt <strong>elke 1e van de maand</strong> automatisch gegenereerd voor de <strong>vorige maand</strong>. 
              Het geeft je een accuraat beeld van je financiële situatie over die hele maand.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: Financieel Overzicht (LEFT) + Advies Cards (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* LEFT SIDE: Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: INKOMEN */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium lowercase" style={{ color: '#255c3d' }}>totaal inkomen</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedReport.total_income || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">regulier</span>
                <span className="text-xl font-semibold text-gray-700">
                  {formatCurrency(selectedReport.regular_income || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">extra inkomen</span>
                <span className="text-xl font-semibold text-green-600">
                  {formatCurrency(selectedReport.extra_income || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: UITGAVEN */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium lowercase" style={{ color: '#255c3d' }}>totaal vaste lasten</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedReport.fixed_costs || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">potjes budget</span>
                <span className="text-xl font-semibold text-gray-700">
                  {formatCurrency(selectedReport.pots_budget || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">bespaard</span>
                <span className={`text-xl font-semibold ${(selectedReport.savings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedReport.savings || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2b: POTJES */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium lowercase" style={{ color: '#255c3d' }}>potjes overzicht</span>
                <span className="text-2xl">🏺</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">totaal budget</span>
                <span className="text-xl font-semibold text-gray-700">
                  {formatCurrency(selectedReport.pots_budget || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">uitgegeven</span>
                <span className="text-xl font-semibold text-orange-600">
                  {formatCurrency(selectedReport.pots_spent || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">overblijvend</span>
                <span className={`text-xl font-semibold ${(selectedReport.pots_remaining || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedReport.pots_remaining || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: SCHULDEN */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium lowercase" style={{ color: '#255c3d' }}>totale schuld</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedReport.total_debt || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">afbetaald deze maand</span>
                <span className="text-xl font-semibold text-purple-600">
                  {formatCurrency(selectedReport.debt_paid || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 lowercase">extra aflossingen</span>
                <span className="text-xl font-semibold text-green-600">
                  {formatCurrency(selectedReport.extra_debt_payments || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: Advies Cards */}
        <div className="space-y-4">
          {selectedReport.compliments && selectedReport.compliments.map((compliment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm lowercase" style={{ color: '#255c3d' }}>advies</CardTitle>
                  <p className="text-xs text-gray-500">this month ▼</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{compliment.icon}</span>
                    <p className="text-gray-800 text-sm leading-relaxed">{compliment.text}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🆕 SECTION 1.5: Potjes Grafiek */}
      {selectedReport.pots_by_category && selectedReport.pots_by_category.length > 0 && (
        <div className="mb-8">
          <PotjesComparisonChart 
            categoryData={selectedReport.pots_by_category} 
            totalIncome={selectedReport.total_income || 0}
          />
        </div>
      )}

      {/* 🤖 SECTION 1.6: AI Inzichten */}
      <div className="mb-8">
        <AIFinancialInsights 
          monthlyData={selectedReport} 
          selectedMonth={selectedMonth}
        />
      </div>

      {/* 📊 SECTION 1.7: Visuele Grafieken */}
      <div className="mb-8">
        <FinancialProgressCharts 
          monthlyData={selectedReport}
          historicalData={[]}
        />
      </div>

      {/* SECTION 2: Samenvatting */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle style={{ color: '#255c3d' }}>samenvatting</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Inkomen sectie */}
            {selectedReport.summary_text && selectedReport.summary_text.includes('inkomen') && (
              <div className="flex items-start gap-3">
                <div className="text-3xl">💰</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Inkomen</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {(selectedReport.extra_income || 0) > 0 
                      ? `Je hebt meer ${formatCurrency(selectedReport.extra_income || 0)} netto binnengehaald! Super gedaan! 🎉`
                      : `Je reguliere inkomen blijft stabiel op ${formatCurrency(selectedReport.regular_income || 0)}.`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Maandelijks lasten sectie */}
            <div className="flex items-start gap-3">
              <div className="text-3xl">🏠</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Maandelijkse lasten</h3>
                <p className="text-gray-700 leading-relaxed">
                  {(selectedReport.fixed_costs || 0) <= (selectedReport.total_income || 0) * 0.5
                    ? "Alles is ruim op tijd betaald! Heel keurig gaat daar mee uit of gas of water! 👏"
                    : (selectedReport.fixed_costs || 0) <= (selectedReport.total_income || 0) * 0.7
                    ? "Je lasten zijn hoog maar nog wel onder controle. Let op dat het niet verder stijgt!"
                    : "Je vaste lasten zijn te hoog voor je inkomen. Tijd om te kijken waar je kunt besparen. 💪"
                  }
                </p>
              </div>
            </div>

            {/* Potjes sectie */}
            <div className="flex items-start gap-3">
              <div className="text-3xl">🏺</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">Potjes</h3>
                <p className="text-gray-700 leading-relaxed">
                  {(selectedReport.pots_remaining || 0) >= 0
                    ? `Super! Je hebt ${formatCurrency(selectedReport.pots_remaining)} overgehouden in je potjes budget. Goed beheerd! 👏`
                    : `Je hebt ${formatCurrency(Math.abs(selectedReport.pots_remaining))} meer uitgegeven dan gepland. Volgende maand beter opletten!`
                  }
                </p>
              </div>
            </div>

            {/* Bad Habits sectie */}
            {badHabitsSpent > 0 && (
              <div className="flex items-start gap-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-3xl">🍔</div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 mb-2">Bad Habits</h3>
                  <p className="text-orange-800 leading-relaxed">
                    Je hebt {formatCurrency(badHabitsSpent)} uitgegeven aan dingen die je eigenlijk niet nodig had. 
                    {badHabitsSpent > 50 
                      ? ' Probeer dit volgende maand te verminderen! 💪' 
                      : ' Dit valt wel mee, goed bezig! 👍'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Betaalachterstanden sectie */}
            {(selectedReport.total_debt || 0) > 0 && (
              <div className="flex items-start gap-3">
                <div className="text-3xl">💳</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2">Betaalachterstanden</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {(selectedReport.debt_paid || 0) === 0
                      ? `Nog geen aflossing deze maand, dat komt goed! Je totale schuld staat op ${formatCurrency(selectedReport.total_debt || 0)}.`
                      : `Super! Je hebt ${formatCurrency(selectedReport.debt_paid || 0)} afgelost deze maand! 🎯`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Positieve feedback */}
            {(selectedReport.savings || 0) > 0 && (
              <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-3xl">✨</div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-2">Dit klinkt als ...................</h3>
                  <p className="text-green-800 leading-relaxed">
                    Dat jij lekker bezig bent ik ben trots op jou! 🌟
                  </p>
                </div>
              </div>
            )}

            {/* Negatieve feedback / waarschuwing */}
            {(selectedReport.savings || 0) < 0 && (
              <div className="flex items-start gap-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 mb-2">Let op!</h3>
                  <p className="text-orange-800 leading-relaxed">
                    Je gaf meer uit dan je binnenkreeg deze maand. Probeer volgende maand wat te besparen. Je kunt dit! 💪
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Algemeen Advies */}
        <Card>
          <CardHeader>
            <CardTitle className="lowercase" style={{ color: '#255c3d' }}>algemeen advies</CardTitle>
            <p className="text-xs text-gray-500">this month ▼</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              minder uit eten en stop abonnementen ruim optijd
            </p>
          </CardContent>
        </Card>

        {/* Verbeter Punten */}
        <Card>
          <CardHeader>
            <CardTitle className="lowercase" style={{ color: '#255c3d' }}>verbeter punten</CardTitle>
            <p className="text-xs text-gray-500">this month ▼</p>
          </CardHeader>
          <CardContent>
            {selectedReport.improvement_points && selectedReport.improvement_points.length > 0 ? (
              <div className="space-y-3">
                {selectedReport.improvement_points.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-xl">{improvement.icon}</span>
                    <p className="text-gray-700 text-sm">{improvement.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">
                Niks te verbeteren! Je doet het fantastisch 🌟
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <CentVoorCentInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <TransactionCategorizationReview 
        isOpen={showCategorizationReview} 
        onClose={() => setShowCategorizationReview(false)}
        onReviewComplete={() => {
          setShowCategorizationReview(false);
          loadReport(); // Refresh report after categorization
        }}
      />
    </div>
  );
}