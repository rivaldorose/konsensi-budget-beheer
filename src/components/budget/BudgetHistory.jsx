import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from "@/api/entities";
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { formatCurrency } from "@/components/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function BudgetHistory({ userEmail }) {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState('6');

  useEffect(() => {
    loadHistory();
  }, [userEmail, selectedMonths]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { User } = await import('@/api/entities');
      const user = await User.me();
      if (!user) return;
      const [transactions, incomes, costs] = await Promise.all([
        Transaction.filter({ user_id: user.id, type: 'expense' }),
        Income.filter({ user_id: user.id }),
        MonthlyCost.filter({ user_id: user.id })
      ]);

      const months = parseInt(selectedMonths);
      const data = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthLabel = monthDate.toLocaleDateString('nl-NL', { month: 'short' });

        // Calculate income for month
        const monthIncome = incomes.reduce((sum, inc) => {
          if (inc.income_type === 'vast') {
            // Check if active during this month
            if (inc.start_date && new Date(inc.start_date) > monthEnd) return sum;
            if (inc.end_date && new Date(inc.end_date) < monthDate) return sum;
            return sum + (parseFloat(inc.monthly_equivalent) || parseFloat(inc.amount) || 0);
          } else {
            // Extra income - check if in this month
            if (!inc.date) return sum;
            const incDate = new Date(inc.date);
            if (incDate >= monthDate && incDate <= monthEnd) {
              return sum + (parseFloat(inc.amount) || 0);
            }
            return sum;
          }
        }, 0);

        // Calculate fixed costs for month
        const monthCosts = costs.reduce((sum, cost) => {
          // Check if cost is active during this specific month
          if (cost.start_date) {
            if (new Date(cost.start_date) > monthEnd) return sum;
            if (cost.end_date && new Date(cost.end_date) < monthDate) return sum;
            return sum + (parseFloat(cost.amount) || 0);
          }
          // Legacy: no start_date, use status
          if (cost.status === 'actief' || cost.status === 'active' || cost.is_active === true) {
            return sum + (parseFloat(cost.amount) || 0);
          }
          return sum;
        }, 0);

        // Calculate variable expenses for month
        const monthExpenses = transactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= monthDate && txDate <= monthEnd;
          })
          .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        const totalExpenses = monthCosts + monthExpenses;
        const savings = monthIncome - totalExpenses;

        data.push({
          month: monthLabel,
          inkomen: Math.round(monthIncome),
          vasteLasten: Math.round(monthCosts),
          variabel: Math.round(monthExpenses),
          gespaard: Math.round(Math.max(0, savings)),
          saldo: Math.round(savings)
        });
      }

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading budget history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate trends
  const getTrend = () => {
    if (monthlyData.length < 2) return null;
    const lastMonth = monthlyData[monthlyData.length - 1];
    const prevMonth = monthlyData[monthlyData.length - 2];
    const diff = lastMonth.saldo - prevMonth.saldo;
    return { diff, percentage: prevMonth.saldo !== 0 ? Math.round((diff / Math.abs(prevMonth.saldo)) * 100) : 0 };
  };

  const trend = getTrend();

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-xl h-64" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 Historisch Overzicht
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Bekijk je bestedingspatroon over tijd
            </p>
          </div>
          <Select value={selectedMonths} onValueChange={setSelectedMonths}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 maanden</SelectItem>
              <SelectItem value="6">6 maanden</SelectItem>
              <SelectItem value="12">12 maanden</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend Indicator */}
        {trend && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
            trend.diff > 0 ? 'bg-green-50' : trend.diff < 0 ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            {trend.diff > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : trend.diff < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-600" />
            ) : (
              <Minus className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <p className={`font-medium ${
                trend.diff > 0 ? 'text-green-800' : trend.diff < 0 ? 'text-red-800' : 'text-gray-700'
              }`}>
                {trend.diff > 0 ? '+' : ''}{formatCurrency(trend.diff)} t.o.v. vorige maand
                {trend.percentage !== 0 && (
                  <span className="text-sm ml-1">({trend.diff > 0 ? '+' : ''}{trend.percentage}%)</span>
                )}
              </p>
              <p className="text-xs text-gray-600">
                {trend.diff > 0 
                  ? 'Goed bezig! Je saldo verbetert.' 
                  : trend.diff < 0 
                    ? 'Let op: je geeft meer uit dan vorige maand.'
                    : 'Je saldo blijft stabiel.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(value), name]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="inkomen" name="Inkomen" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vasteLasten" name="Vaste Lasten" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="variabel" name="Variabele Uitgaven" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {monthlyData.length > 0 && (() => {
            const avgIncome = monthlyData.reduce((s, m) => s + m.inkomen, 0) / monthlyData.length;
            const avgExpenses = monthlyData.reduce((s, m) => s + m.vasteLasten + m.variabel, 0) / monthlyData.length;
            const avgSavings = monthlyData.reduce((s, m) => s + Math.max(0, m.saldo), 0) / monthlyData.length;
            const savingsRate = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 100) : 0;

            return (
              <>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Gem. Inkomen</p>
                  <p className="font-bold text-green-600">{formatCurrency(avgIncome)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Gem. Uitgaven</p>
                  <p className="font-bold text-red-600">{formatCurrency(avgExpenses)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Gem. Gespaard</p>
                  <p className="font-bold text-blue-600">{formatCurrency(avgSavings)}</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Spaarquote</p>
                  <p className="font-bold text-purple-600">{savingsRate}%</p>
                </div>
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}