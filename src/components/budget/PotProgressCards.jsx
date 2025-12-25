import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pot } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { formatCurrency } from "@/components/utils/formatters";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

export default function PotProgressCards({ userEmail, periodStart, periodEnd }) {
  const [pots, setPots] = useState([]);
  const [spending, setSpending] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userEmail, periodStart, periodEnd]);

  const loadData = async () => {
    if (!userEmail) return;
    
    try {
      const [potsData, transactionsData] = await Promise.all([
        Pot.filter({ created_by: userEmail, pot_type: 'expense' }),
        Transaction.filter({ created_by: userEmail, type: 'expense' })
      ]);

      setPots(potsData);

      // Calculate spending per pot for the period
      const spendingMap = {};
      potsData.forEach(pot => {
        const potTransactions = transactionsData.filter(tx => {
          const txDate = new Date(tx.date);
          const inPeriod = txDate >= periodStart && txDate <= periodEnd;
          const matchesPot = tx.category === pot.name;
          return inPeriod && matchesPot;
        });
        
        spendingMap[pot.id] = potTransactions.reduce((sum, tx) => 
          sum + (parseFloat(tx.amount) || 0), 0
        );
      });
      
      setSpending(spendingMap);
    } catch (error) {
      console.error('Error loading pot progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-xl h-48" />;
  }

  if (pots.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Voortgang per Potje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pots.map(pot => {
            const budget = pot.monthly_budget || 0;
            const spent = spending[pot.id] || 0;
            const remaining = budget - spent;
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && percentage <= 100;
            const isHealthy = percentage <= 80;

            // Calculate daily budget remaining
            const today = new Date();
            const daysLeft = Math.max(1, Math.ceil((periodEnd - today) / (1000 * 60 * 60 * 24)));
            const dailyBudget = remaining > 0 ? remaining / daysLeft : 0;

            return (
              <div 
                key={pot.id}
                className={`p-4 rounded-xl border-2 ${
                  isOverBudget ? 'border-red-200 bg-red-50' :
                  isWarning ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{pot.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{pot.name}</h4>
                      <p className="text-xs text-gray-500">
                        Budget: {formatCurrency(budget)}
                      </p>
                    </div>
                  </div>
                  {isOverBudget && <AlertTriangle className="w-5 h-5 text-red-500" />}
                  {isWarning && <TrendingDown className="w-5 h-5 text-yellow-600" />}
                  {isHealthy && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>

                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={`h-2 mb-2 ${
                    isOverBudget ? '[&>div]:bg-red-500' :
                    isWarning ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-green-500'
                  }`}
                />

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(spent)} uitgegeven
                  </span>
                  <span className={`font-medium ${
                    isOverBudget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isOverBudget 
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} over`
                    }
                  </span>
                </div>

                {!isOverBudget && remaining > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      💡 Nog {formatCurrency(dailyBudget)}/dag voor {daysLeft} dagen
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}