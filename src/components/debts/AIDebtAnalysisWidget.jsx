import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Brain, 
  TrendingDown, 
  Calendar, 
  Zap, 
  Snowflake, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  Target,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvokeLLM } from '@/api/integrations';
import { formatCurrency, formatDateSafe } from '@/components/utils/formatters';

// Bereken maanden tot afbetaling
const calculateMonthsToPayoff = (totalDebt, monthlyPayment, interestRate = 0) => {
  if (monthlyPayment <= 0) return Infinity;
  if (interestRate === 0) return Math.ceil(totalDebt / monthlyPayment);
  
  const monthlyRate = interestRate / 100 / 12;
  if (monthlyPayment <= totalDebt * monthlyRate) return Infinity;
  
  return Math.ceil(
    Math.log(monthlyPayment / (monthlyPayment - totalDebt * monthlyRate)) / Math.log(1 + monthlyRate)
  );
};

// Bereken totale rente betaald
const calculateTotalInterest = (totalDebt, monthlyPayment, interestRate, months) => {
  if (interestRate === 0 || months === Infinity) return 0;
  return Math.max(0, (monthlyPayment * months) - totalDebt);
};

// Sorteer schulden volgens strategie
const sortDebtsByStrategy = (debts, strategy) => {
  const activeDebts = debts.filter(d => 
    d.status !== 'afbetaald' && 
    (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)) > 0
  );
  
  if (strategy === 'snowball') {
    // Kleinste schuld eerst
    return [...activeDebts].sort((a, b) => {
      const remainingA = parseFloat(a.amount || 0) - parseFloat(a.amount_paid || 0);
      const remainingB = parseFloat(b.amount || 0) - parseFloat(b.amount_paid || 0);
      return remainingA - remainingB;
    });
  } else if (strategy === 'avalanche') {
    // Hoogste rente eerst
    return [...activeDebts].sort((a, b) => {
      const rateA = parseFloat(a.interest_rate || 0);
      const rateB = parseFloat(b.interest_rate || 0);
      return rateB - rateA;
    });
  }
  return activeDebts;
};

// Simuleer afbetaling per strategie
const simulatePayoff = (debts, monthlyBudget, strategy) => {
  const sortedDebts = sortDebtsByStrategy(debts, strategy);
  if (sortedDebts.length === 0) return { months: 0, totalInterest: 0, schedule: [] };
  
  let remainingDebts = sortedDebts.map(d => ({
    ...d,
    remaining: parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0),
    monthlyPayment: parseFloat(d.monthly_payment || 0)
  }));
  
  let month = 0;
  let totalInterest = 0;
  const schedule = [];
  let extraBudget = Math.max(0, monthlyBudget - remainingDebts.reduce((sum, d) => sum + d.monthlyPayment, 0));
  
  while (remainingDebts.some(d => d.remaining > 0) && month < 360) {
    month++;
    let availableExtra = extraBudget;
    
    remainingDebts.forEach((debt, index) => {
      if (debt.remaining <= 0) return;
      
      // Bereken rente
      const monthlyRate = (parseFloat(debt.interest_rate || 0) / 100) / 12;
      const interest = debt.remaining * monthlyRate;
      totalInterest += interest;
      debt.remaining += interest;
      
      // Betaal minimum
      let payment = Math.min(debt.monthlyPayment, debt.remaining);
      debt.remaining -= payment;
      
      // Extra naar eerste schuld in volgorde
      if (index === 0 && availableExtra > 0) {
        const extraPayment = Math.min(availableExtra, debt.remaining);
        debt.remaining -= extraPayment;
        availableExtra -= extraPayment;
        payment += extraPayment;
      }
      
      if (debt.remaining <= 0.01) {
        debt.remaining = 0;
        // Freed up payment gaat naar extra budget
        extraBudget += debt.monthlyPayment;
        
        schedule.push({
          debtName: debt.creditor_name,
          paidOffMonth: month,
          paidOffDate: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
        });
      }
    });
    
    // Re-sort voor volgende maand
    if (strategy === 'snowball') {
      remainingDebts = remainingDebts
        .filter(d => d.remaining > 0)
        .sort((a, b) => a.remaining - b.remaining);
    }
  }
  
  return { months: month, totalInterest, schedule };
};

export default function AIDebtAnalysisWidget({ debts, vtlbData }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [extraPayment, setExtraPayment] = useState(0);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  const activeDebts = debts.filter(d => 
    d.status !== 'afbetaald' && 
    (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)) > 0
  );
  
  const totalDebt = activeDebts.reduce((sum, d) => 
    sum + (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)), 0
  );
  
  const currentMonthlyPayment = activeDebts.reduce((sum, d) => 
    sum + parseFloat(d.monthly_payment || 0), 0
  );
  
  const availableCapacity = vtlbData?.aflosCapaciteit || vtlbData?.aangepastBeschikbaar * 0.15 || 0;
  const maxExtra = Math.max(0, availableCapacity - currentMonthlyPayment);

  useEffect(() => {
    if (activeDebts.length > 0) {
      runAnalysis();
    }
  }, [debts]);

  const runAnalysis = async () => {
    if (activeDebts.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      const totalMonthlyBudget = currentMonthlyPayment + extraPayment;
      
      // Simuleer beide strategieën
      const snowballResult = simulatePayoff(activeDebts, totalMonthlyBudget, 'snowball');
      const avalancheResult = simulatePayoff(activeDebts, totalMonthlyBudget, 'avalanche');
      
      // Bepaal aanbevolen strategie
      let recommendation = 'snowball';
      let reasoning = '';
      
      const hasHighInterest = activeDebts.some(d => parseFloat(d.interest_rate || 0) > 10);
      const interestDifference = snowballResult.totalInterest - avalancheResult.totalInterest;
      const monthsDifference = snowballResult.months - avalancheResult.months;
      
      if (hasHighInterest && interestDifference > 100) {
        recommendation = 'avalanche';
        reasoning = `Je hebt schulden met hoge rente. Met de Lawine-methode bespaar je ${formatCurrency(interestDifference)} aan rente.`;
      } else if (activeDebts.length > 3) {
        recommendation = 'snowball';
        reasoning = `Met ${activeDebts.length} schulden geeft de Sneeuwbal-methode snelle successen die je motiveren.`;
      } else {
        recommendation = avalancheResult.totalInterest < snowballResult.totalInterest ? 'avalanche' : 'snowball';
        reasoning = recommendation === 'avalanche' 
          ? 'De Lawine-methode bespaart je het meeste geld.'
          : 'De Sneeuwbal-methode geeft je snelle kleine overwinningen.';
      }

      // AI analyse voor extra inzichten
      let aiInsights = null;
      try {
        const debtSummary = activeDebts.map(d => ({
          naam: d.creditor_name,
          bedrag: parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0),
          rente: parseFloat(d.interest_rate || 0),
          maandelijks: parseFloat(d.monthly_payment || 0),
          urgentie: d.urgency_level
        }));

        const response = await InvokeLLM({
          prompt: `Analyseer deze schulden en geef 2-3 korte, praktische tips voor afbetaling.
          
Schulden: ${JSON.stringify(debtSummary)}
Totale schuld: €${totalDebt.toFixed(2)}
Maandelijks budget: €${totalMonthlyBudget.toFixed(2)}
Beschikbare extra capaciteit: €${maxExtra.toFixed(2)}

Geef tips in het Nederlands, max 1 zin per tip. Focus op actiegerichte adviezen.`,
          response_json_schema: {
            type: "object",
            properties: {
              tips: {
                type: "array",
                items: { type: "string" }
              },
              prioriteit: {
                type: "string",
                description: "Welke schuld eerst aanpakken en waarom (1 zin)"
              },
              waarschuwing: {
                type: "string",
                description: "Eventuele waarschuwing of aandachtspunt (optioneel)"
              }
            }
          }
        });
        
        aiInsights = response;
      } catch (error) {
        console.error('AI analysis failed:', error);
      }

      setAnalysis({
        snowball: snowballResult,
        avalanche: avalancheResult,
        recommendation,
        reasoning,
        aiInsights,
        totalDebt,
        monthlyBudget: totalMonthlyBudget
      });
      
      setSelectedStrategy(recommendation);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPayoffDate = (months) => {
    if (months === Infinity || months > 360) return 'Niet berekend';
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  };

  if (activeDebts.length === 0) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white overflow-hidden">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-indigo-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-indigo-500" />
          AI Schuld Analyse
          <Badge variant="secondary" className="ml-2 text-xs bg-indigo-100 text-indigo-700">
            {activeDebts.length} actief
          </Badge>
          <ChevronDown className={`w-5 h-5 text-gray-500 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </CardTitle>
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
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Totale schuld</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalDebt)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Maandelijks</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(currentMonthlyPayment)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Extra ruimte</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(maxExtra)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Schulden</p>
                  <p className="text-lg font-bold text-gray-900">{activeDebts.length}</p>
                </div>
              </div>

              {/* Extra betaling slider */}
              {maxExtra > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Extra maandelijkse aflossing</p>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                      +{formatCurrency(extraPayment)}
                    </Badge>
                  </div>
                  <Slider
                    value={[extraPayment]}
                    onValueChange={([value]) => setExtraPayment(value)}
                    max={maxExtra}
                    step={10}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>€0</span>
                    <span>{formatCurrency(maxExtra)}</span>
                  </div>
                  {extraPayment !== (analysis?.monthlyBudget - currentMonthlyPayment) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={runAnalysis}
                      className="mt-3 w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Herbereken scenario's
                    </Button>
                  )}
                </div>
              )}

              {/* Loading state */}
              {isAnalyzing && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                  <span className="text-gray-600">AI analyseert je schulden...</span>
                </div>
              )}

              {/* Analysis Results */}
              {analysis && !isAnalyzing && (
                <>
                  {/* Strategy Comparison */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Snowball */}
                    <div 
                      className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                        selectedStrategy === 'snowball' 
                          ? 'border-blue-400 shadow-md' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => setSelectedStrategy('snowball')}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Snowflake className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Sneeuwbal</h4>
                          <p className="text-xs text-gray-500">Kleinste schuld eerst</p>
                        </div>
                        {analysis.recommendation === 'snowball' && (
                          <Badge className="ml-auto bg-green-100 text-green-700 border-0">
                            Aanbevolen
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Schuldenvrij op:</span>
                          <span className="font-medium">{getPayoffDate(analysis.snowball.months)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Totale rente:</span>
                          <span className="font-medium text-red-600">{formatCurrency(analysis.snowball.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Duur:</span>
                          <span className="font-medium">{analysis.snowball.months} maanden</span>
                        </div>
                      </div>

                      {analysis.snowball.schedule.length > 0 && selectedStrategy === 'snowball' && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Afbetalingsvolgorde:</p>
                          <div className="space-y-1">
                            {analysis.snowball.schedule.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="truncate">{item.debtName}</span>
                                <span className="text-gray-400 text-xs ml-auto">
                                  {item.paidOffDate && !isNaN(item.paidOffDate.getTime())
                                    ? item.paidOffDate.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })
                                    : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Avalanche */}
                    <div 
                      className={`bg-white rounded-xl p-4 border-2 transition-all cursor-pointer ${
                        selectedStrategy === 'avalanche' 
                          ? 'border-orange-400 shadow-md' 
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => setSelectedStrategy('avalanche')}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Lawine</h4>
                          <p className="text-xs text-gray-500">Hoogste rente eerst</p>
                        </div>
                        {analysis.recommendation === 'avalanche' && (
                          <Badge className="ml-auto bg-green-100 text-green-700 border-0">
                            Aanbevolen
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Schuldenvrij op:</span>
                          <span className="font-medium">{getPayoffDate(analysis.avalanche.months)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Totale rente:</span>
                          <span className="font-medium text-red-600">{formatCurrency(analysis.avalanche.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Duur:</span>
                          <span className="font-medium">{analysis.avalanche.months} maanden</span>
                        </div>
                      </div>

                      {analysis.avalanche.schedule.length > 0 && selectedStrategy === 'avalanche' && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Afbetalingsvolgorde:</p>
                          <div className="space-y-1">
                            {analysis.avalanche.schedule.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="truncate">{item.debtName}</span>
                                <span className="text-gray-400 text-xs ml-auto">
                                  {item.paidOffDate && !isNaN(item.paidOffDate.getTime())
                                    ? item.paidOffDate.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })
                                    : '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <Brain className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">AI Aanbeveling</h4>
                        <p className="text-sm text-gray-700">{analysis.reasoning}</p>
                        
                        {analysis.aiInsights && (
                          <div className="mt-3 space-y-2">
                            {analysis.aiInsights.prioriteit && (
                              <div className="flex items-start gap-2">
                                <Target className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600">{analysis.aiInsights.prioriteit}</p>
                              </div>
                            )}
                            
                            {analysis.aiInsights.tips?.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600">{tip}</p>
                              </div>
                            ))}
                            
                            {analysis.aiInsights.waarschuwing && (
                              <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-amber-700">{analysis.aiInsights.waarschuwing}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comparison Summary */}
                  {analysis.snowball.totalInterest !== analysis.avalanche.totalInterest && (
                    <div className="bg-white rounded-lg p-3 border border-gray-100 flex items-center gap-3">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        {analysis.avalanche.totalInterest < analysis.snowball.totalInterest ? (
                          <>
                            Met de <strong>Lawine-methode</strong> bespaar je{' '}
                            <strong className="text-green-600">
                              {formatCurrency(analysis.snowball.totalInterest - analysis.avalanche.totalInterest)}
                            </strong>{' '}
                            aan rente t.o.v. de Sneeuwbal-methode.
                          </>
                        ) : (
                          <>
                            Beide methodes kosten ongeveer evenveel rente. Kies de methode die het beste bij jou past.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}