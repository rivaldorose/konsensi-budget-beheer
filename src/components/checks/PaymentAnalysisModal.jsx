
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Sparkles, Download, Mail, Copy } from "lucide-react";
import { format, addDays, addWeeks, addMonths, parseISO, isBefore, isAfter } from "date-fns";
import { nl } from "date-fns/locale";
import { formatCurrency } from "@/components/utils/formatters";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { Pot } from "@/api/entities";
import { PaymentStatus } from "@/api/entities";
import { Notification } from "@/api/entities";

export default function PaymentAnalysisModal({ isOpen, onClose, unpaidItem, currentMonth }) {
  const [analyzing, setAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();

  // Haal data op voor analyse
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => User.me(),
  });

  const { data: incomes = [] } = useQuery({
    queryKey: ['incomes', user?.email],
    queryFn: () => Income.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: costs = [] } = useQuery({
    queryKey: ['monthlyCosts', user?.email],
    queryFn: () => MonthlyCost.filter({ created_by: user.email, status: 'actief' }),
    enabled: !!user,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['debts', user?.email],
    queryFn: () => Debt.filter({ created_by: user.email, status: 'betalingsregeling' }),
    enabled: !!user,
  });

  const { data: potjes = [] } = useQuery({
    queryKey: ['pots', user?.email],
    queryFn: () => Pot.filter({ created_by: user.email }),
    enabled: !!user,
  });

  // NIEUWE MUTATION: Bevestig uitstel
  const confirmPostponeMutation = useMutation({
    mutationFn: async ({ newDate, potsToAdjust }) => {
      const results = {
        paymentStatus: null,
        adjustedPots: [],
        notification: null
      };

      // 1. Update PaymentStatus met nieuwe datum
      const existingStatus = await PaymentStatus.filter({
        cost_id: unpaidItem.id,
        month: currentMonth,
        user_id: user.id
      });

      if (existingStatus.length > 0) {
        results.paymentStatus = await PaymentStatus.update(existingStatus[0].id, {
          postponed_to_date: format(newDate, 'yyyy-MM-dd'),
          notes: `Uitgesteld via analyse. ${potsToAdjust.length > 0 ? `${potsToAdjust.length} potjes aangepast.` : ''}`
        });
      } else {
        results.paymentStatus = await PaymentStatus.create({
          cost_id: unpaidItem.id,
          cost_name: unpaidItem.name || unpaidItem.creditor_name,
          cost_amount: unpaidItem.amount || unpaidItem.monthly_payment,
          month: currentMonth,
          is_paid: false,
          postponed_to_date: format(newDate, 'yyyy-MM-dd'),
          due_date: format(new Date(), 'yyyy-MM-dd'), // Assuming due_date is current date if postponed
          notes: `Uitgesteld via analyse. ${potsToAdjust.length > 0 ? `${potsToAdjust.length} potjes aangepast.` : ''}`,
          user_id: user.id
        });
      }

      // 2. Pas potjes aan (als strategie 'postpone_pots' is)
      if (potsToAdjust.length > 0) {
        for (const pot of potsToAdjust) {
          const updated = await Pot.update(pot.id, {
            monthly_budget: 0,
            // Bewaar origineel budget in een note
            notes: `Tijdelijk op €0 gezet voor betaling van ${unpaidItem.name || unpaidItem.creditor_name}. Was: €${pot.monthly_budget}`
          });
          results.adjustedPots.push(updated);
        }
      }

      // 3. Maak notificatie aan voor herinnering
      results.notification = await Notification.create({
        title: `💰 Betaling ${unpaidItem.name || unpaidItem.creditor_name}`,
        message: `Vergeet niet om ${formatCurrency(unpaidItem.amount || unpaidItem.monthly_payment)} te betalen voor ${unpaidItem.name || unpaidItem.creditor_name}`,
        type: 'fixed_cost',
        priority: 'high',
        is_read: false,
        link: '/VasteLastenCheck',
        user_id: user.id
      });

      return results;
    },
    onSuccess: (results) => {
      // Invalidate queries om data te refreshen
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['pots'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast({
        title: "✅ Betaling uitgesteld!",
        description: `Je betaling is uitgesteld naar ${format(selectedDate, 'd MMMM yyyy', { locale: nl })}. ${results.adjustedPots.length > 0 ? `${results.adjustedPots.length} potjes zijn aangepast.` : ''}`,
      });

      // After successful mutation, generate letter and show preview
      if (analysis && selectedDate && user) {
        const creditorName = unpaidItem.name || unpaidItem.creditor_name || '[Naam schuldeiser]';
        const amount = formatCurrency(unpaidItem.amount || unpaidItem.monthly_payment);
        const newPaymentDate = format(selectedDate, 'd MMMM yyyy', { locale: nl });
        const reason = analysis.strategy === 'next_income'
          ? 'ik op dit moment financieel niet in staat ben om deze betaling te verrichten vóór mijn volgende inkomsten'
          : analysis.strategy === 'postpone_pots'
          ? 'ik mijn andere financiële verplichtingen moet herstructureren om deze betaling te kunnen doen'
          : 'ik meer tijd nodig heb om mijn financiële situatie te stabiliseren';

        const letter = `Geachte heer/mevrouw,

Betreft: Betalingsregeling voor ${creditorName}
Dossiernummer: ${unpaidItem.case_number || '[Uw dossiernummer]'}

Hierbij informeer ik u dat ik op dit moment niet in staat ben om de betaling van ${amount} op de oorspronkelijke vervaldatum te voldoen.

Dit komt doordat ${reason}.

Ik wil graag mijn betalingsverplichting nakomen en stel daarom voor om het bedrag van ${amount} te betalen op ${newPaymentDate}.

Op deze datum beschik ik over voldoende financiële middelen om de betaling te verrichten. Ik heb mijn financiële situatie zorgvuldig geanalyseerd en ben ervan overtuigd dat ik deze nieuwe betalingsdatum kan nakomen.

Persoonlijke gegevens:
Naam: ${user?.full_name || user?.voornaam || '[Uw naam]'}
Adres: ${user?.adres || '[Uw adres]'}
Postcode en plaats: ${user?.postcode || '[Postcode]'} ${user?.stad || '[Stad]'}
Telefoonnummer: ${user?.telefoonnummer || '[Telefoonnummer]'}

Ik verzoek u vriendelijk om:
- Akkoord te gaan met de nieuwe betaaldatum van ${newPaymentDate}
- Geen verdere incassomaatregelen te treffen tot deze datum
- Mij schriftelijk te bevestigen dat u akkoord gaat met dit voorstel

Ik neem mijn financiële verplichtingen serieus en doe er alles aan om deze situatie op te lossen. Mocht u vragen hebben of aanvullende informatie nodig hebben, dan kunt u mij bereiken via bovenstaande contactgegevens.

Bij voorbaat dank voor uw begrip en medewerking.

Met vriendelijke groet,

${user?.full_name || user?.voornaam || '[Uw naam]'}
${format(new Date(), 'd MMMM yyyy', { locale: nl })}`;

        setGeneratedLetter(letter);
        setShowLetterPreview(true);
      } else {
        // Fallback if required data for letter is missing
        onClose();
      }
    },
    onError: (error) => {
      console.error('Error postponing payment:', error);
      toast({
        title: "❌ Fout",
        description: "Er ging iets mis bij het uitstellen. Probeer het opnieuw.",
        variant: "destructive"
      });
    }
  });

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast({
      title: "📋 Gekopieerd!",
      description: "Brief is gekopieerd naar klembord",
    });
  };

  const handleDownloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Uitstel_betaling_${unpaidItem.name || 'betaling'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "📥 Gedownload!",
      description: "Brief is gedownload als tekstbestand",
    });
  };

  useEffect(() => {
    if (!unpaidItem || !user) return;

    const analyzePaymentOptions = async () => {
      setAnalyzing(true);
      setShowLetterPreview(false); // Reset preview state when re-analyzing

      // Simuleer even een loading (maakt het realistischer)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ GEFIXED: Gebruik start_date/end_date logica ipv is_active
      const activeFixedIncomes = incomes.filter(income => {
        if (income.income_type !== 'vast') return false;
        
        // Check of inkomen actief is op basis van start/end date
        if (income.start_date) {
          const startDate = new Date(income.start_date);
          const endDate = income.end_date ? new Date(income.end_date) : null;
          
          const isAfterStart = today >= startDate;
          const isBeforeEnd = !endDate || today <= endDate;

          return isAfterStart && isBeforeEnd;
        }
        
        // Fallback voor oude records zonder start_date
        return income.is_active !== false;
      });

      console.log('🔍 Actieve vaste inkomsten:', activeFixedIncomes);

      // STAP 1: Bereken wanneer het volgende inkomen komt
      const nextIncomeDate = calculateNextIncomeDate(activeFixedIncomes);
      
      // Breakdown van inkomsten
      const incomeBreakdown = activeFixedIncomes.map(income => ({
        description: income.description,
        amount: income.monthly_equivalent || income.amount || 0,
        frequency: income.frequency,
        date: income.day_of_month
      }));
      
      const nextIncomeAmount = activeFixedIncomes.reduce((sum, inc) => sum + (inc.monthly_equivalent || inc.amount || 0), 0);

      console.log('💰 Totaal volgend inkomen:', nextIncomeAmount);

      // STAP 2: Bereken andere verplichte uitgaven tussen nu en volgende inkomen
      const upcomingExpenses = calculateUpcomingExpenses(costs, debts, nextIncomeDate, unpaidItem);

      // STAP 3: Bereken potjes die uitgesteld kunnen worden
      const postponablePots = potjes.filter(pot => !pot.is_essential);
      const postponableAmount = postponablePots.reduce((sum, pot) => sum + (pot.monthly_budget || 0), 0);

      // STAP 4: Bereken wanneer je WEL kunt betalen
      const unpaidAmount = unpaidItem.amount || unpaidItem.monthly_payment || 0;
      const availableAfterIncome = nextIncomeAmount - upcomingExpenses.total;
      

      let canPayDate = null;
      let strategy = null;

      if (availableAfterIncome >= unpaidAmount) {
        // Je kunt betalen na je volgende inkomen
        canPayDate = nextIncomeDate;
        strategy = 'next_income';
      } else if (availableAfterIncome + postponableAmount >= unpaidAmount) {
        // Je kunt betalen als je potjes uitstelt
        canPayDate = nextIncomeDate;
        strategy = 'postpone_pots';
      } else {
        // Je hebt meer tijd nodig, check inkomen daarna
        const secondIncomeDate = addMonths(nextIncomeDate, 1);
        canPayDate = secondIncomeDate;
        strategy = 'later_income';
      }

      setAnalysis({
        nextIncomeDate,
        nextIncomeAmount,
        incomeBreakdown, // NIEUW
        upcomingExpenses: upcomingExpenses.items,
        upcomingExpensesTotal: upcomingExpenses.total,
        postponablePots,
        postponableAmount,
        availableAfterIncome,
        unpaidAmount,
        canPayDate,
        strategy,
        surplus: availableAfterIncome - unpaidAmount,
      });

      setSelectedDate(canPayDate);
      setAnalyzing(false);
    };

    analyzePaymentOptions();
  }, [unpaidItem, incomes, costs, debts, potjes, user, currentMonth]); // Added currentMonth to dependencies

  const calculateNextIncomeDate = (regularIncomes) => {
    if (regularIncomes.length === 0) return addMonths(today, 1);

    // Neem het eerste vaste inkomen en bereken de volgende datum
    const firstIncome = regularIncomes[0];
    
    if (firstIncome.frequency === 'monthly' && firstIncome.day_of_month) {
      const nextMonth = today.getDate() > firstIncome.day_of_month ? addMonths(today, 1) : today;
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), firstIncome.day_of_month);
    }

    if (firstIncome.frequency === 'weekly') {
      return addWeeks(today, 1);
    }

    if (firstIncome.frequency === 'biweekly') {
      return addWeeks(today, 2);
    }

    // Default: over een maand
    return addMonths(today, 1);
  };

  const calculateUpcomingExpenses = (costs, debts, untilDate, excludeItem) => {
    const items = [];
    let total = 0;

    // Vaste lasten die nog moeten
    costs.forEach(cost => {
      if (cost.id === excludeItem?.id && cost.name === excludeItem?.name) return; // Skip het item dat we analyseren
      
      const costDate = new Date(today.getFullYear(), today.getMonth(), cost.payment_date);
      if (isBefore(costDate, untilDate) && isAfter(costDate, today)) {
        items.push({
          name: cost.name,
          amount: cost.amount,
          date: costDate,
          type: 'cost'
        });
        total += cost.amount;
      }
    });

    // Schulden die nog moeten
    debts.forEach(debt => {
      if (debt.id === excludeItem?.id && debt.creditor_name === excludeItem?.creditor_name) return;
      
      if (debt.payment_plan_date) {
        const debtDate = new Date(debt.payment_plan_date);
        const debtDay = debtDate.getDate();
        const thisMonthDebtDate = new Date(today.getFullYear(), today.getMonth(), debtDay);
        
        if (isBefore(thisMonthDebtDate, untilDate) && isAfter(thisMonthDebtDate, today)) {
          items.push({
            name: debt.creditor_name,
            amount: debt.monthly_payment,
            date: thisMonthDebtDate,
            type: 'debt'
          });
          total += debt.monthly_payment;
        }
      }
    });

    return { items, total };
  };

  const handleConfirmDate = async () => {
    if (!analysis || !selectedDate || !user) return; // Ensure user is available for mutation

    const potsToAdjust = analysis.strategy === 'postpone_pots' ? analysis.postponablePots : [];

    confirmPostponeMutation.mutate({
      newDate: selectedDate,
      potsToAdjust
    });
  };

  if (!isOpen || !unpaidItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            📊 Wanneer kun je {unpaidItem.name || unpaidItem.creditor_name} betalen?
          </DialogTitle>
        </DialogHeader>

        {showLetterPreview ? (
          /* BRIEF PREVIEW SCHERM */
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">Brief voor schuldeiser</h3>
                  <p className="text-sm text-blue-700">
                    Gebruik deze brief om je schuldeiser te informeren over de nieuwe betaaldatum
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <pre className="whitespace-pre-wrap text-sm font-sans text-gray-800 leading-relaxed">
                  {generatedLetter}
                </pre>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleCopyLetter}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Kopieer Brief
              </Button>
              <Button
                onClick={handleDownloadLetter}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download als .txt
              </Button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 mb-1">Volgende stappen:</p>
                  <ol className="list-decimal list-inside text-green-700 space-y-1">
                    <li>Print deze brief of stuur hem per e-mail naar de schuldeiser</li>
                    <li>Bewaar een kopie voor jezelf</li>
                    <li>Je ontvangt een herinnering op {format(selectedDate, 'd MMMM', { locale: nl })}</li>
                    <li>Betaal op tijd om je afspraak na te komen</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLetterPreview(false);
                  onClose();
                }}
                className="flex-1"
              >
                Sluiten
              </Button>
            </div>
          </div>
        ) : analyzing ? (
          /* LOADING STATE */
          <div className="py-12 text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-400 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Analyseren van je financiële situatie...</p>
            <p className="text-sm text-gray-500">We kijken naar je inkomsten, uitgaven en beschikbare ruimte</p>
          </div>
        ) : analysis ? (
          /* ANALYSE RESULTAAT */
          <div className="space-y-6">
            {/* Resultaat card */}
            <Card className={`${analysis.strategy === 'next_income' ? 'bg-green-50 border-green-200' : analysis.strategy === 'postpone_pots' ? 'bg-yellow-50 border-yellow-200' : 'bg-orange-50 border-orange-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {analysis.strategy === 'next_income' ? '✅' : analysis.strategy === 'postpone_pots' ? '⚠️' : '⏰'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">
                      {analysis.strategy === 'next_income' && 'Goed nieuws! Je kunt betalen na je volgende salaris'}
                      {analysis.strategy === 'postpone_pots' && 'Je kunt betalen als je andere uitgaven uitstelt'}
                      {analysis.strategy === 'later_income' && 'Je hebt iets meer tijd nodig'}
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      {analysis.strategy === 'next_income' && `Na je salaris op ${format(analysis.nextIncomeDate, 'd MMMM', { locale: nl })} heb je genoeg ruimte om ${formatCurrency(analysis.unpaidAmount)} te betalen.`}
                      {analysis.strategy === 'postpone_pots' && `Je hebt ${formatCurrency(analysis.postponableAmount)} aan niet-essentiële potjes die je kunt uitstellen om deze betaling te doen.`}
                      {analysis.strategy === 'later_income' && `Het is verstandig om te wachten tot ${format(analysis.canPayDate, 'd MMMM', { locale: nl })} voordat je deze betaling doet.`}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">Voorgestelde betaaldatum: {format(analysis.canPayDate, 'd MMMM yyyy', { locale: nl })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details sectie */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* VERBETERDE Inkomen card met breakdown */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Volgend inkomen</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {formatCurrency(analysis.nextIncomeAmount)}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Op {format(analysis.nextIncomeDate, 'd MMMM', { locale: nl })}
                  </p>
                  
                  {/* NIEUW: Breakdown van inkomsten */}
                  {analysis.incomeBreakdown && analysis.incomeBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Breakdown:</p>
                      <div className="space-y-1">
                        {analysis.incomeBreakdown.map((income, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{income.description}</span>
                            <span className="font-medium text-gray-800">{formatCurrency(income.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Andere uitgaven */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold">Andere verplichte uitgaven</h4>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mb-1">
                    {formatCurrency(analysis.upcomingExpensesTotal)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tussen nu en {format(analysis.nextIncomeDate, 'd MMM', { locale: nl })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming expenses lijst */}
            {analysis.upcomingExpenses.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Andere betalingen die nog moeten
                  </h4>
                  <div className="space-y-2">
                    {analysis.upcomingExpenses.map((expense, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <span className="font-medium">{expense.name}</span>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                          <div className="text-xs text-gray-500">{format(expense.date, 'd MMM', { locale: nl })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Potjes die uitgesteld kunnen worden */}
            {analysis.strategy === 'postpone_pots' && analysis.postponablePots.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    Deze niet-essentiële potjes kun je tijdelijk uitstellen
                  </h4>
                  <div className="space-y-2">
                    {analysis.postponablePots.map((pot) => (
                      <div key={pot.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                        <span className="flex items-center gap-2">
                          <span>{pot.icon}</span>
                          <span className="font-medium">{pot.name}</span>
                        </span>
                        <span className="font-semibold">{formatCurrency(pot.monthly_budget)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">
                    💡 Door deze potjes een maand over te slaan, kun je deze betaling wel doen.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Beschikbaar na inkomen */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Beschikbaar na je salaris</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatCurrency(analysis.availableAfterIncome)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Moet betalen</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analysis.unpaidAmount)}
                    </p>
                  </div>
                </div>
                {analysis.surplus >= 0 && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Je houdt nog {formatCurrency(analysis.surplus)} over!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waarschuwing als potjes worden aangepast */}
            {analysis.strategy === 'postpone_pots' && analysis.postponablePots.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900 mb-1">Let op!</p>
                    <p className="text-yellow-700">
                      Door te bevestigen worden {analysis.postponablePots.length} niet-essentiële {analysis.postponablePots.length === 1 ? 'potje' : 'potjes'} tijdelijk op €0 gezet. 
                      Je kunt ze later weer activeren.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actie knoppen */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={confirmPostponeMutation.isPending}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleConfirmDate}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={confirmPostponeMutation.isPending}
              >
                {confirmPostponeMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verwerken...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Bevestig: betaal op {format(selectedDate, 'd MMM', { locale: nl })}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
