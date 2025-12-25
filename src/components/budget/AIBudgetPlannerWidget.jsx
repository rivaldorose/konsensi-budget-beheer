import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  PiggyBank,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Coins,
  Wallet,
  BarChart3,
  Clock,
  Zap,
  Bell,
  CreditCard,
  Scale,
  Play,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/components/utils/formatters';

// NIBUD categorieën met gemiddelde percentages
const NIBUD_CATEGORIES = {
  wonen: { label: 'Wonen', percentage: 30, icon: '🏠' },
  boodschappen: { label: 'Boodschappen', percentage: 15, icon: '🛒' },
  vervoer: { label: 'Vervoer', percentage: 10, icon: '🚗' },
  verzekeringen: { label: 'Verzekeringen', percentage: 8, icon: '🛡️' },
  kleding: { label: 'Kleding', percentage: 5, icon: '👕' },
  persoonlijk: { label: 'Persoonlijke verzorging', percentage: 3, icon: '💄' },
  vrije_tijd: { label: 'Vrije tijd', percentage: 8, icon: '🎉' },
  sparen: { label: 'Sparen', percentage: 10, icon: '💰' },
  overig: { label: 'Overig', percentage: 11, icon: '📦' }
};

// Bereken maanden tot doel
const calculateMonthsToGoal = (currentAmount, targetAmount, monthlySaving) => {
  if (monthlySaving <= 0) return Infinity;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / monthlySaving);
};

export default function AIBudgetPlannerWidget({ 
  income = 0, 
  fixedCosts = 0, 
  variableExpenses = 0,
  currentSavings = 0,
  pots = [],
  transactions = [],
  goals = []
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [savingsGoal, setSavingsGoal] = useState(1000);
  const [monthlyTarget, setMonthlyTarget] = useState(100);
  const [showForecast, setShowForecast] = useState(false);
  
  // What-if scenario state
  const [scenarioMode, setScenarioMode] = useState(null); // 'debt' | 'savings' | 'custom'
  const [scenarioExtraDebt, setScenarioExtraDebt] = useState(50);
  const [scenarioExtraSavings, setScenarioExtraSavings] = useState(50);
  const [notifications, setNotifications] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const availableBudget = Math.max(0, income - fixedCosts);
  const currentSpending = variableExpenses;
  const potentialSavings = Math.max(0, availableBudget - currentSpending);

  useEffect(() => {
    if (income > 0) {
      runAnalysis();
    }
  }, [income, fixedCosts, variableExpenses]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // Bereken huidige verdeling
      const currentDistribution = {
        fixed: fixedCosts,
        variable: variableExpenses,
        available: availableBudget,
        savings: potentialSavings
      };

      // Analyseer uitgavenpatronen per categorie
      const categorySpending = {};
      transactions.forEach(t => {
        if (t.type === 'expense') {
          const cat = t.category || 'overig';
          categorySpending[cat] = (categorySpending[cat] || 0) + (t.amount || 0);
        }
      });

      // NIBUD vergelijking
      const nibudComparison = {};
      Object.entries(NIBUD_CATEGORIES).forEach(([key, config]) => {
        const recommended = income * (config.percentage / 100);
        const actual = categorySpending[key] || 0;
        nibudComparison[key] = {
          ...config,
          recommended,
          actual,
          difference: actual - recommended,
          status: actual <= recommended ? 'good' : actual <= recommended * 1.2 ? 'warning' : 'over'
        };
      });

      // AI analyse voor tips en allocatie
      let aiInsights = null;
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyseer dit budget en geef 3-4 korte, praktische tips.

Inkomen: €${income.toFixed(2)}/maand
Vaste lasten: €${fixedCosts.toFixed(2)}/maand  
Variabele uitgaven: €${variableExpenses.toFixed(2)}/maand
Beschikbaar: €${availableBudget.toFixed(2)}/maand
Huidige besparing: €${potentialSavings.toFixed(2)}/maand

Uitgaven per categorie: ${JSON.stringify(categorySpending)}

Geef concrete besparingstips en budget allocatie adviezen in het Nederlands. Max 1-2 zinnen per tip.`,
          response_json_schema: {
            type: "object",
            properties: {
              budgetScore: {
                type: "number",
                description: "Score van 1-100 voor hoe gezond het budget is"
              },
              summary: {
                type: "string",
                description: "Korte samenvatting van het budget in 1 zin"
              },
              savingsTips: {
                type: "array",
                items: { type: "string" },
                description: "Concrete besparingstips"
              },
              allocationSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    currentAmount: { type: "number" },
                    suggestedAmount: { type: "number" },
                    reason: { type: "string" }
                  }
                },
                description: "Suggesties voor budget allocatie aanpassingen"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Waarschuwingen of aandachtspunten"
              },
              opportunities: {
                type: "array",
                items: { type: "string" },
                description: "Besparingsmogelijkheden"
              }
            }
          }
        });

        aiInsights = response;
      } catch (error) {
        console.error('AI analysis failed:', error);
      }

      // Forecasting berekenen
      const forecast = [];
      let projectedSavings = currentSavings;
      const monthlyContribution = potentialSavings * 0.5; // 50% van beschikbaar naar sparen

      for (let i = 1; i <= 12; i++) {
        projectedSavings += monthlyContribution;
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        forecast.push({
          month: date.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' }),
          savings: projectedSavings,
          goal: savingsGoal
        });
      }

      // Generate proactive notifications
      const newNotifications = [];
      
      // Check for budget overspending risks
      Object.entries(nibudComparison).forEach(([key, data]) => {
        if (data.status === 'over') {
          newNotifications.push({
            type: 'warning',
            title: `${data.icon} ${data.label} overschrijding`,
            message: `Je geeft ${formatCurrency(data.difference)} meer uit dan aanbevolen.`,
            action: 'Bekijk tips om te besparen'
          });
        }
      });
      
      // Check for savings opportunities
      if (potentialSavings > income * 0.15) {
        newNotifications.push({
          type: 'opportunity',
          title: '💰 Spaarkans gedetecteerd',
          message: `Je kunt mogelijk ${formatCurrency(potentialSavings * 0.3)} extra sparen per maand.`,
          action: 'Bekijk scenario\'s'
        });
      }
      
      // Low savings warning
      if (potentialSavings < income * 0.05 && potentialSavings >= 0) {
        newNotifications.push({
          type: 'alert',
          title: '⚠️ Lage spaarruimte',
          message: 'Je houdt minder dan 5% van je inkomen over. Bekijk waar je kunt besparen.',
          action: 'Bekijk besparingstips'
        });
      }
      
      // Negative balance warning
      if (potentialSavings < 0) {
        newNotifications.push({
          type: 'critical',
          title: '🚨 Negatief saldo',
          message: `Je geeft ${formatCurrency(Math.abs(potentialSavings))} meer uit dan je verdient.`,
          action: 'Direct actie nodig'
        });
      }
      
      setNotifications(newNotifications);

      // Dynamic budget adjustments
      const dynamicAdjustments = [];
      if (aiInsights?.allocationSuggestions) {
        aiInsights.allocationSuggestions.forEach(suggestion => {
          if (suggestion.suggestedAmount < suggestion.currentAmount) {
            dynamicAdjustments.push({
              category: suggestion.category,
              current: suggestion.currentAmount,
              suggested: suggestion.suggestedAmount,
              savings: suggestion.currentAmount - suggestion.suggestedAmount,
              reason: suggestion.reason
            });
          }
        });
      }

      setAnalysis({
        currentDistribution,
        categorySpending,
        nibudComparison,
        aiInsights,
        forecast,
        potentialMonthlySavings: potentialSavings,
        healthScore: aiInsights?.budgetScore || calculateHealthScore(income, fixedCosts, variableExpenses),
        dynamicAdjustments
      });

    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateHealthScore = (income, fixed, variable) => {
    if (income === 0) return 0;
    const savingsRate = (income - fixed - variable) / income;
    if (savingsRate >= 0.2) return 90;
    if (savingsRate >= 0.1) return 75;
    if (savingsRate >= 0.05) return 60;
    if (savingsRate >= 0) return 40;
    return 20;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Uitstekend';
    if (score >= 60) return 'Goed';
    if (score >= 40) return 'Kan beter';
    return 'Aandacht nodig';
  };

  if (income === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
      <CardHeader 
        className="pb-3"
      >
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Brain className="w-5 h-5 text-purple-500" />
            <span className="text-lg font-semibold">AI Budgetplanner</span>
            <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Smart
            </Badge>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-purple-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoModal(true);
            }}
          >
            <Info className="w-4 h-4 text-purple-600" />
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4">
              {/* Proactive Notifications */}
              {notifications.length > 0 && (
                <div className="space-y-2 mb-4">
                  {notifications.slice(0, 2).map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        notif.type === 'critical' ? 'bg-red-50 border-red-200' :
                        notif.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                        notif.type === 'opportunity' ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        notif.type === 'critical' ? 'text-red-500' :
                        notif.type === 'warning' ? 'text-amber-500' :
                        notif.type === 'opportunity' ? 'text-green-500' :
                        'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                        <p className="text-xs text-gray-600">{notif.message}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => setActiveTab(notif.type === 'opportunity' ? 'scenarios' : 'savings')}
                      >
                        {notif.action}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overzicht', icon: BarChart3 },
                  { id: 'scenarios', label: 'Wat-als', icon: Scale },
                  { id: 'allocation', label: 'Allocatie', icon: PiggyBank },
                  { id: 'savings', label: 'Besparen', icon: Coins },
                  { id: 'forecast', label: 'Voorspelling', icon: TrendingUp }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loading state */}
              {isAnalyzing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                  <span className="text-gray-600">AI analyseert je budget...</span>
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === 'overview' && analysis && !isAnalyzing && (
                <div className="space-y-4">
                  {/* Health Score */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-900">Budget Gezondheid</span>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.healthScore)}`}>
                        {analysis.healthScore}/100
                      </div>
                    </div>
                    <Progress 
                      value={analysis.healthScore} 
                      className="h-3 mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      {analysis.aiInsights?.summary || getScoreLabel(analysis.healthScore)}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">Inkomen</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">Vaste lasten</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(fixedCosts)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">Variabel</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(variableExpenses)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">Beschikbaar</p>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(potentialSavings)}</p>
                    </div>
                  </div>

                  {/* AI Insights */}
                  {analysis.aiInsights && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">AI Inzichten</h4>
                      </div>

                      {/* Warnings */}
                      {analysis.aiInsights.warnings?.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {analysis.aiInsights.warnings.map((warning, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-700">{warning}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tips */}
                      <div className="space-y-2">
                        {analysis.aiInsights.savingsTips?.slice(0, 3).map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* What-If Scenarios Tab */}
              {activeTab === 'scenarios' && analysis && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-medium text-gray-900">Wat-als Scenario's</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Simuleer verschillende financiële keuzes en zie direct het effect op je budget.
                    </p>
                  </div>

                  {/* Scenario Selector */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Extra Debt Payment Scenario */}
                    <div 
                      className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                        scenarioMode === 'debt' ? 'border-orange-400 shadow-md' : 'border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => setScenarioMode(scenarioMode === 'debt' ? null : 'debt')}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <CreditCard className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Extra Aflossen</h4>
                          <p className="text-xs text-gray-500">Schulden sneller afbetalen</p>
                        </div>
                      </div>
                      
                      {scenarioMode === 'debt' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 pt-3 border-t border-gray-100"
                        >
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Extra aflossing/maand</span>
                              <span className="font-medium text-orange-600">{formatCurrency(scenarioExtraDebt)}</span>
                            </div>
                            <Slider
                              value={[scenarioExtraDebt]}
                              onValueChange={([v]) => setScenarioExtraDebt(v)}
                              max={Math.min(potentialSavings, 500)}
                              min={0}
                              step={10}
                            />
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Overblijvend voor sparen:</span>
                              <span className="font-medium">{formatCurrency(potentialSavings - scenarioExtraDebt)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Schuld sneller vrij:</span>
                              <span className="font-medium text-orange-600">
                                {scenarioExtraDebt > 0 ? `~${Math.round(scenarioExtraDebt * 12 / 100)} maanden` : '-'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Extra Savings Scenario */}
                    <div 
                      className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                        scenarioMode === 'savings' ? 'border-green-400 shadow-md' : 'border-gray-200 hover:border-green-200'
                      }`}
                      onClick={() => setScenarioMode(scenarioMode === 'savings' ? null : 'savings')}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <PiggyBank className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Extra Sparen</h4>
                          <p className="text-xs text-gray-500">Buffer sneller opbouwen</p>
                        </div>
                      </div>
                      
                      {scenarioMode === 'savings' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 pt-3 border-t border-gray-100"
                        >
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Extra sparen/maand</span>
                              <span className="font-medium text-green-600">{formatCurrency(scenarioExtraSavings)}</span>
                            </div>
                            <Slider
                              value={[scenarioExtraSavings]}
                              onValueChange={([v]) => setScenarioExtraSavings(v)}
                              max={Math.min(potentialSavings, 500)}
                              min={0}
                              step={10}
                            />
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Totaal sparen/maand:</span>
                              <span className="font-medium">{formatCurrency((potentialSavings * 0.5) + scenarioExtraSavings)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">€1000 buffer in:</span>
                              <span className="font-medium text-green-600">
                                {calculateMonthsToGoal(0, 1000, (potentialSavings * 0.5) + scenarioExtraSavings)} maanden
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Comparison View */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Play className="w-5 h-5 text-purple-500" />
                      Scenario Vergelijking (12 maanden)
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Huidige koers</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(potentialSavings * 0.5 * 12)}
                        </p>
                        <p className="text-xs text-gray-500">gespaard in 1 jaar</p>
                      </div>
                      
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Extra aflossen</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(scenarioExtraDebt * 12)}
                        </p>
                        <p className="text-xs text-gray-500">minder schuld</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Extra sparen</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(((potentialSavings * 0.5) + scenarioExtraSavings) * 12)}
                        </p>
                        <p className="text-xs text-gray-500">gespaard in 1 jaar</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">AI Aanbeveling</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {potentialSavings < 100 
                              ? 'Focus eerst op het verlagen van je uitgaven voordat je extra gaat aflossen of sparen.'
                              : scenarioExtraDebt > scenarioExtraSavings 
                                ? 'Schulden aflossen is verstandig bij hoge rente. Zorg wel voor minimaal €500 buffer.'
                                : 'Extra sparen is slim. Een buffer van 3 maanden inkomen geeft financiële rust.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Allocation Tab */}
              {activeTab === 'allocation' && analysis && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-purple-500" />
                      Budget Allocatie vs NIBUD
                    </h4>
                    
                    <div className="space-y-3">
                      {Object.entries(analysis.nibudComparison).slice(0, 6).map(([key, data]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <span>{data.icon}</span>
                              <span className="text-gray-700">{data.label}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                data.status === 'good' ? 'text-green-600' : 
                                data.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(data.actual)}
                              </span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-500">{formatCurrency(data.recommended)}</span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                                data.status === 'good' ? 'bg-green-400' : 
                                data.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.min(100, (data.actual / data.recommended) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Allocation Suggestions */}
                  {analysis.aiInsights?.allocationSuggestions?.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        AI Allocatie Suggesties
                      </h4>
                      <div className="space-y-3">
                        {analysis.aiInsights.allocationSuggestions.map((suggestion, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-purple-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{suggestion.category}</span>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">{formatCurrency(suggestion.currentAmount)}</span>
                                <ArrowRight className="w-4 h-4 text-purple-500" />
                                <span className="text-purple-600 font-medium">{formatCurrency(suggestion.suggestedAmount)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">{suggestion.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Savings Tab */}
              {activeTab === 'savings' && analysis && !isAnalyzing && (
                <div className="space-y-4">
                  {/* Potential Savings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-gray-900">Potentiële Besparing</h4>
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-1">
                      {formatCurrency(potentialSavings)}<span className="text-lg text-gray-500">/maand</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Dit is wat je kunt sparen na al je uitgaven
                    </p>
                  </div>

                  {/* Savings Opportunities */}
                  {analysis.aiInsights?.opportunities?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Besparingsmogelijkheden
                      </h4>
                      <div className="space-y-2">
                        {analysis.aiInsights.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{opp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Savings Calculator */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      Spaardoel Calculator
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Spaardoel</label>
                        <Input
                          type="number"
                          value={savingsGoal}
                          onChange={(e) => setSavingsGoal(parseFloat(e.target.value) || 0)}
                          className="text-lg font-medium"
                          placeholder="€ 1.000"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-600">Maandelijks sparen</label>
                          <span className="font-medium text-purple-600">{formatCurrency(monthlyTarget)}</span>
                        </div>
                        <Slider
                          value={[monthlyTarget]}
                          onValueChange={([value]) => setMonthlyTarget(value)}
                          max={potentialSavings}
                          min={10}
                          step={10}
                        />
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Doel bereikt in:</span>
                          <span className="font-bold text-purple-600">
                            {calculateMonthsToGoal(currentSavings, savingsGoal, monthlyTarget) === Infinity 
                              ? '∞' 
                              : `${calculateMonthsToGoal(currentSavings, savingsGoal, monthlyTarget)} maanden`
                            }
                          </span>
                        </div>
                        {calculateMonthsToGoal(currentSavings, savingsGoal, monthlyTarget) < Infinity && (
                          <p className="text-xs text-gray-500 mt-1">
                            📅 {new Date(Date.now() + calculateMonthsToGoal(currentSavings, savingsGoal, monthlyTarget) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Forecast Tab */}
              {activeTab === 'forecast' && analysis && !isAnalyzing && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      12-Maanden Voorspelling
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Gebaseerd op {formatCurrency(potentialSavings * 0.5)} maandelijks sparen
                    </p>

                    {/* Forecast Chart */}
                    <div className="space-y-2">
                      {analysis.forecast.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16">{item.month}</span>
                          <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (item.savings / savingsGoal) * 100)}%` }}
                            />
                            {item.savings >= savingsGoal && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700 w-20 text-right">
                            {formatCurrency(item.savings)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Goal line indicator */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-0.5 bg-green-500"></div>
                      <span>Spaardoel: {formatCurrency(savingsGoal)}</span>
                    </div>
                  </div>

                  {/* Scenario Comparison */}
                  <div className="grid md:grid-cols-3 gap-3">
                    {[
                      { 
                        label: 'Conservatief', 
                        rate: 0.3, 
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-blue-100',
                        textColor: 'text-blue-600',
                        description: '30% van beschikbaar'
                      },
                      { 
                        label: 'Aanbevolen', 
                        rate: 0.5, 
                        bgColor: 'bg-purple-50',
                        borderColor: 'border-purple-100',
                        textColor: 'text-purple-600',
                        description: '50% van beschikbaar'
                      },
                      { 
                        label: 'Agressief', 
                        rate: 0.7, 
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-100',
                        textColor: 'text-green-600',
                        description: '70% van beschikbaar'
                      }
                    ].map((scenario) => {
                      const monthlyAmount = potentialSavings * scenario.rate;
                      const months = calculateMonthsToGoal(currentSavings, savingsGoal, monthlyAmount);
                      
                      return (
                        <div 
                          key={scenario.label}
                          className={`${scenario.bgColor} rounded-lg p-3 border ${scenario.borderColor}`}
                        >
                          <p className="font-medium text-gray-900">{scenario.label}</p>
                          <p className="text-xs text-gray-500 mb-2">{scenario.description}</p>
                          <p className={`text-lg font-bold ${scenario.textColor}`}>
                            {formatCurrency(monthlyAmount)}/mnd
                          </p>
                          <p className="text-xs text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {months === Infinity ? '∞' : `${months} maanden`}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Budget Adjustments */}
                  {analysis.dynamicAdjustments?.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <h4 className="font-medium text-gray-900">AI Budget Aanpassingen</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Op basis van je uitgavenpatronen stellen we de volgende aanpassingen voor:
                      </p>
                      <div className="space-y-2">
                        {analysis.dynamicAdjustments.map((adj, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <span className="text-sm text-gray-700">{adj.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 line-through">{formatCurrency(adj.current)}</span>
                              <ArrowRight className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium text-amber-600">{formatCurrency(adj.suggested)}</span>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                +{formatCurrency(adj.savings)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Analyse vernieuwen
                </Button>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Over AI Budgetplanner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              De AI Budgetplanner analyseert je inkomen, uitgaven en spaardoelen om je te helpen slimmere financiële beslissingen te maken.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Budget Analyse</p>
                  <p className="text-xs text-gray-600">Krijg inzicht in je financiële gezondheid met een score van 0-100</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Scale className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Wat-als Scenario's</p>
                  <p className="text-xs text-gray-600">Simuleer verschillende keuzes zoals extra aflossen of sparen</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Slimme Suggesties</p>
                  <p className="text-xs text-gray-600">Ontvang AI-gedreven tips voor betere budget allocatie</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Spaardoel Voorspelling</p>
                  <p className="text-xs text-gray-600">Zie wanneer je je spaardoelen bereikt met verschillende strategieën</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs text-purple-800">
                💡 <strong>Tip:</strong> De AI analyseert je budget automatisch en geeft proactieve meldingen over mogelijke besparingen of risico's.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}