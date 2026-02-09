import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/components/utils/formatters';

// Native date helpers - NO date-fns
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

const subMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

const isWithinInterval = (date, { start, end }) => {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
};

const formatMonthShort = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(date);
};

const formatMonthYearFull = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
};

const IncomeChart = ({ allIncomes = [] }) => {
  // Bereken data voor huidige jaar (max 12 maanden)
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-based
    const monthsThisYear = currentMonth + 1; // jan=1, feb=2
    const monthCount = Math.min(monthsThisYear, 12);
    const last12Months = Array.from({ length: monthCount }, (_, i) => {
      const monthDate = subMonths(now, monthCount - 1 - i);
      return getStartOfMonth(monthDate);
    });

    return last12Months.map(monthStart => {
      const monthEnd = getEndOfMonth(monthStart);
      
      // Filter vaste inkomsten voor deze maand
      const fixedIncomesForMonth = allIncomes.filter(income => {
        if (income.income_type !== 'vast') return false;
        
        // Check of inkomen actief was in deze maand
        if (income.start_date) {
          const startDate = new Date(income.start_date);
          const endDate = income.end_date ? new Date(income.end_date) : null;
          
          const isAfterStart = monthStart >= getStartOfMonth(startDate);
          const isBeforeEnd = !endDate || monthEnd <= getEndOfMonth(endDate);
          
          return isAfterStart && isBeforeEnd;
        }
        
        return income.is_active !== false;
      });

      // Filter extra inkomsten voor deze maand
      const extraIncomesForMonth = allIncomes.filter(income => {
        if (income.income_type !== 'extra' || !income.date) return false;
        const incomeDate = new Date(income.date);
        return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
      });

      const fixedTotal = fixedIncomesForMonth.reduce((sum, i) => 
        sum + (parseFloat(i.monthly_equivalent) || parseFloat(i.amount) || 0), 0
      );
      
      const extraTotal = extraIncomesForMonth.reduce((sum, i) => 
        sum + (parseFloat(i.amount) || 0), 0
      );

      return {
        month: formatMonthShort(monthStart),
        fullDate: formatMonthYearFull(monthStart),
        vast: fixedTotal,
        extra: extraTotal,
        totaal: fixedTotal + extraTotal
      };
    });
  }, [allIncomes]);

  // Bereken gemiddelden en totalen
  const stats = useMemo(() => {
    const totals = chartData.reduce((acc, month) => ({
      vast: acc.vast + month.vast,
      extra: acc.extra + month.extra,
      totaal: acc.totaal + month.totaal
    }), { vast: 0, extra: 0, totaal: 0 });

    const count = chartData.length || 1;
    return {
      avgVast: totals.vast / count,
      avgExtra: totals.extra / count,
      avgTotaal: totals.totaal / count,
      totalYear: totals.totaal
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.fullDate}</p>
          <div className="space-y-1">
            <p className="text-sm text-green-600">
              Vast: {formatCurrency(payload[0].payload.vast)}
            </p>
            <p className="text-sm text-blue-600">
              Extra: {formatCurrency(payload[0].payload.extra)}
            </p>
            <p className="text-sm font-bold text-gray-900">
              Totaal: {formatCurrency(payload[0].payload.totaal)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white shadow-sm rounded-xl border-none">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-5 hover:no-underline">
            <CardHeader className="p-0 text-left">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Jaaroverzicht Inkomsten
              </CardTitle>
            </CardHeader>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            {/* Statistieken */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-700 mb-1">Gem. Vast</p>
                <p className="text-lg font-bold text-green-800">
                  {formatCurrency(stats.avgVast, { decimals: 0 })}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-1">Gem. Extra</p>
                <p className="text-lg font-bold text-blue-800">
                  {formatCurrency(stats.avgExtra, { decimals: 0 })}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-700 mb-1">Gem. Totaal</p>
                <p className="text-lg font-bold text-purple-800">
                  {formatCurrency(stats.avgTotaal, { decimals: 0 })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-700 mb-1">Totaal Jaar</p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(stats.totalYear, { decimals: 0 })}
                </p>
              </div>
            </div>

            {/* Grafiek */}
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value, { decimals: 0 })}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="vast"
                    name="Vast Inkomen"
                    stackId="1"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorVast)"
                  />
                  <Area
                    type="monotone"
                    dataKey="extra"
                    name="Extra Inkomen"
                    stackId="1"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorExtra)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Gebaseerd op dit jaar
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default IncomeChart;