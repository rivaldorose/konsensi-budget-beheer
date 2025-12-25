import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  ChevronDown,
  Target,
  PiggyBank,
  CreditCard,
  Receipt,
  Sparkles,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatCurrency } from '@/components/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

// Advice types with styling
const ADVICE_TYPES = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    badgeColor: 'bg-amber-100 text-amber-700'
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    badgeColor: 'bg-green-100 text-green-700'
  },
  info: {
    icon: Lightbulb,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  alert: {
    icon: TrendingUp,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-700'
  }
};

// Generate personalized advice based on financial data
function generateAdvice(data) {
  const {
    totalIncome = 0,
    totalFixedCosts = 0,
    totalDebt = 0,
    debtPaidThisMonth = 0,
    monthlyDebtPayment = 0,
    pots = [],
    transactions = [],
    previousMonthTransactions = [],
    monthlyCosts = [],
    previousMonthCosts = [],
    debts = []
  } = data;

  const adviceList = [];
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - currentDay;

  // 1. Analyze spending patterns by category
  const categorySpending = {};
  const prevCategorySpending = {};

  transactions.forEach(t => {
    if (t.type === 'expense' && t.category) {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + (t.amount || 0);
    }
  });

  previousMonthTransactions.forEach(t => {
    if (t.type === 'expense' && t.category) {
      prevCategorySpending[t.category] = (prevCategorySpending[t.category] || 0) + (t.amount || 0);
    }
  });

  // Compare spending patterns
  Object.entries(categorySpending).forEach(([category, amount]) => {
    const prevAmount = prevCategorySpending[category] || 0;
    if (prevAmount > 0) {
      const percentChange = ((amount - prevAmount) / prevAmount) * 100;
      
      if (percentChange > 30 && amount > 50) {
        const categoryLabels = {
          'eten_drinken': 'eten & drinken',
          'entertainment': 'entertainment',
          'transport': 'vervoer',
          'shopping': 'winkelen',
          'health': 'gezondheid',
          'boodschappen': 'boodschappen'
        };
        
        adviceList.push({
          id: `spending-${category}`,
          type: 'warning',
          title: `${Math.round(percentChange)}% meer uitgegeven aan ${categoryLabels[category] || category}`,
          description: `Je hebt deze maand ${formatCurrency(amount)} uitgegeven, vorige maand was dit ${formatCurrency(prevAmount)}. Bekijk je potjes om je budget aan te passen.`,
          linkTo: 'Potjes',
          linkText: 'Budget aanpassen',
          priority: 2
        });
      }
    }
  });

  // 2. Check pot budget warnings
  pots.forEach(pot => {
    if (pot.pot_type === 'expense' && pot.budget > 0) {
      const spent = pot.spent || 0;
      const percentUsed = (spent / pot.budget) * 100;
      const remaining = pot.budget - spent;

      if (percentUsed >= 90 && percentUsed < 100) {
        adviceList.push({
          id: `pot-almost-${pot.id}`,
          type: 'warning',
          title: `Potje "${pot.name}" is bijna op`,
          description: `Je hebt nog ${formatCurrency(remaining)} over (${Math.round(100 - percentUsed)}%). Overweeg je budget aan te passen of minder uit te geven.`,
          linkTo: 'Potjes',
          linkText: 'Potjes bekijken',
          priority: 1
        });
      } else if (percentUsed >= 100) {
        adviceList.push({
          id: `pot-over-${pot.id}`,
          type: 'alert',
          title: `Potje "${pot.name}" is overschreden`,
          description: `Je hebt ${formatCurrency(spent - pot.budget)} meer uitgegeven dan begroot. Pas je budget aan of beperk verdere uitgaven.`,
          linkTo: 'Potjes',
          linkText: 'Budget aanpassen',
          priority: 1
        });
      } else if (percentUsed < 30 && daysRemaining < 10) {
        adviceList.push({
          id: `pot-underused-${pot.id}`,
          type: 'success',
          title: `Goed bezig met "${pot.name}"!`,
          description: `Je hebt nog ${formatCurrency(remaining)} over met ${daysRemaining} dagen te gaan. Je kunt dit overhouden of naar een spaarpotje verplaatsen.`,
          linkTo: 'Potjes',
          linkText: 'Naar spaarpot',
          priority: 3
        });
      }
    }
  });

  // 3. Fixed costs alerts
  const upcomingCosts = monthlyCosts.filter(cost => {
    if (!cost.start_date || cost.status !== 'actief') return false;
    return cost.payment_date > currentDay && cost.payment_date <= currentDay + 5;
  });

  if (upcomingCosts.length > 0) {
    const totalUpcoming = upcomingCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    adviceList.push({
      id: 'upcoming-costs',
      type: 'info',
      title: `${upcomingCosts.length} betaling${upcomingCosts.length > 1 ? 'en' : ''} komende 5 dagen`,
      description: `Totaal ${formatCurrency(totalUpcoming)} aan vaste lasten. Zorg dat je voldoende saldo hebt.`,
      linkTo: 'MaandelijkseLasten',
      linkText: 'Vaste lasten bekijken',
      priority: 2
    });
  }

  // Check for cost increases next month
  const nextMonthCostIncrease = monthlyCosts.filter(cost => {
    if (!cost.start_date) return false;
    const startDate = new Date(cost.start_date);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return startDate >= nextMonth && startDate < new Date(today.getFullYear(), today.getMonth() + 2, 1);
  });

  if (nextMonthCostIncrease.length > 0) {
    const totalIncrease = nextMonthCostIncrease.reduce((sum, c) => sum + (c.amount || 0), 0);
    adviceList.push({
      id: 'cost-increase',
      type: 'warning',
      title: 'Je vaste lasten stijgen volgende maand',
      description: `${nextMonthCostIncrease.length} nieuwe vaste last${nextMonthCostIncrease.length > 1 ? 'en' : ''} start${nextMonthCostIncrease.length === 1 ? '' : 'en'} volgende maand (+${formatCurrency(totalIncrease)}/maand).`,
      linkTo: 'MaandelijkseLasten',
      linkText: 'Details bekijken',
      priority: 1
    });
  }

  // 4. Debt payment progress
  if (monthlyDebtPayment > 0 && totalDebt > 0) {
    const debtProgress = (debtPaidThisMonth / monthlyDebtPayment) * 100;
    
    if (debtProgress >= 80 && debtProgress < 100) {
      adviceList.push({
        id: 'debt-almost-goal',
        type: 'success',
        title: 'Aflosdoel bijna bereikt! 🎯',
        description: `Je hebt ${formatCurrency(debtPaidThisMonth)} van ${formatCurrency(monthlyDebtPayment)} afgelost (${Math.round(debtProgress)}%). Nog ${formatCurrency(monthlyDebtPayment - debtPaidThisMonth)} te gaan!`,
        linkTo: 'Debts',
        linkText: 'Aflossing registreren',
        priority: 1
      });
    } else if (debtProgress >= 100) {
      adviceList.push({
        id: 'debt-goal-reached',
        type: 'success',
        title: 'Aflosdoel bereikt! 🎉',
        description: `Geweldig! Je hebt dit maand ${formatCurrency(debtPaidThisMonth)} afgelost en je doel behaald. Blijf zo doorgaan!`,
        linkTo: 'Debts',
        linkText: 'Voortgang bekijken',
        priority: 2
      });
    } else if (debtProgress < 50 && daysRemaining < 10) {
      adviceList.push({
        id: 'debt-behind',
        type: 'warning',
        title: 'Aflossing achter op schema',
        description: `Je hebt nog ${formatCurrency(monthlyDebtPayment - debtPaidThisMonth)} te betalen met ${daysRemaining} dagen te gaan. Bekijk je betalingsregelingen.`,
        linkTo: 'Debts',
        linkText: 'Schulden bekijken',
        priority: 1
      });
    }
  }

  // 5. Urgent debts
  const urgentDebts = debts.filter(d => 
    d.urgency_level && 
    ['deurwaarder_dreigt', 'dagvaarding', 'vonnis', 'beslag_dreigt', 'beslag_actief'].includes(d.urgency_level)
  );

  if (urgentDebts.length > 0) {
    adviceList.push({
      id: 'urgent-debts',
      type: 'alert',
      title: `${urgentDebts.length} urgente schuld${urgentDebts.length > 1 ? 'en' : ''} vereist aandacht`,
      description: 'Er zijn schulden met een hoge urgentie. Bekijk de adempauze-opties of neem contact op met schuldhulp.',
      linkTo: 'Adempauze',
      linkText: 'Hulp bekijken',
      priority: 0
    });
  }

  // 6. Savings opportunity
  const availableAfterCosts = totalIncome - totalFixedCosts - monthlyDebtPayment;
  const totalPotBudget = pots.filter(p => p.pot_type === 'expense').reduce((sum, p) => sum + (p.budget || 0), 0);
  const surplus = availableAfterCosts - totalPotBudget;

  if (surplus > 100) {
    adviceList.push({
      id: 'savings-opportunity',
      type: 'info',
      title: `${formatCurrency(surplus)} niet toegewezen aan potjes`,
      description: 'Je hebt ruimte over in je budget. Overweeg een spaarpotje aan te maken voor onverwachte uitgaven of een leuk doel.',
      linkTo: 'Potjes',
      linkText: 'Spaarpotje maken',
      priority: 3
    });
  }

  // 7. Income vs expense ratio
  const totalSpentThisMonth = Object.values(categorySpending).reduce((sum, v) => sum + v, 0) + totalFixedCosts;
  if (totalIncome > 0) {
    const spendingRatio = (totalSpentThisMonth / totalIncome) * 100;
    
    if (spendingRatio > 95) {
      adviceList.push({
        id: 'high-spending-ratio',
        type: 'alert',
        title: 'Je geeft bijna al je inkomen uit',
        description: `${Math.round(spendingRatio)}% van je inkomen gaat naar uitgaven. Probeer minimaal 5-10% te sparen voor onverwachte kosten.`,
        linkTo: 'BudgetPlan',
        linkText: 'Budget bekijken',
        priority: 1
      });
    } else if (spendingRatio < 70 && totalIncome > 1000) {
      adviceList.push({
        id: 'good-savings-rate',
        type: 'success',
        title: 'Goede spaarquote! 💪',
        description: `Je houdt ${Math.round(100 - spendingRatio)}% van je inkomen over. Overweeg dit te gebruiken voor je buffer of spaardoelen.`,
        linkTo: 'Potjes',
        linkText: 'Spaardoelen',
        priority: 3
      });
    }
  }

  // Sort by priority (lower = more important)
  return adviceList.sort((a, b) => a.priority - b.priority);
}

export default function PersonalizedAdviceWidget({ 
  financialData,
  maxItems = 3,
  showAll = false,
  onDismiss
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedAdvice, setDismissedAdvice] = useState(() => {
    try {
      const stored = localStorage.getItem('dismissedAdvice');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean up old dismissals (older than 24 hours)
        const now = Date.now();
        const cleaned = Object.fromEntries(
          Object.entries(parsed).filter(([_, timestamp]) => now - timestamp < 86400000)
        );
        return cleaned;
      }
    } catch (e) {
      console.error('Error loading dismissed advice:', e);
    }
    return {};
  });

  const advice = useMemo(() => {
    if (!financialData) return [];
    return generateAdvice(financialData);
  }, [financialData]);

  const visibleAdvice = useMemo(() => {
    const filtered = advice.filter(a => !dismissedAdvice[a.id]);
    return showAll ? filtered : filtered.slice(0, maxItems);
  }, [advice, dismissedAdvice, maxItems, showAll]);

  const handleDismiss = (adviceId) => {
    const updated = { ...dismissedAdvice, [adviceId]: Date.now() };
    setDismissedAdvice(updated);
    localStorage.setItem('dismissedAdvice', JSON.stringify(updated));
    if (onDismiss) onDismiss(adviceId);
  };

  if (visibleAdvice.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-purple-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Gepersonaliseerd Advies
          {visibleAdvice.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-700">
              {visibleAdvice.length}
            </Badge>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-500 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </CardTitle>
      </CardHeader>
      {isExpanded && (
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleAdvice.map((item, index) => {
            const typeConfig = ADVICE_TYPES[item.type] || ADVICE_TYPES.info;
            const IconComponent = typeConfig.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-lg border ${typeConfig.bgColor} ${typeConfig.borderColor}`}
              >
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
                  aria-label="Verberg advies"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                  <div className={`p-2 rounded-lg bg-white/70 ${typeConfig.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {item.description}
                    </p>
                    
                    {item.linkTo && (
                      <Link to={createPageUrl(item.linkTo)}>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-xs bg-white/70 hover:bg-white"
                        >
                          {item.linkText}
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {advice.length > maxItems && !showAll && (
          <Link to={createPageUrl('BudgetPlan')}>
            <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              Bekijk alle {advice.length} adviezen
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
      )}
    </Card>
  );
}