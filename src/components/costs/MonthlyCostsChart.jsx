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

const MonthlyCostsChart = ({ allMonthlyCosts = [], allUnexpectedCosts = [] }) => {
  // Bereken data voor de laatste 12 maanden
  const chartData = useMemo(() => {
    const now = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(now, 11 - i);
      return getStartOfMonth(monthDate);
    });

    return last12Months.map(monthStart => {
      const monthEnd = getEndOfMonth(monthStart);
      
      // ✅ NIEUWE LOGICA: Check welke vaste lasten actief waren in DEZE specifieke maand
      const activeCostsForMonth = allMonthlyCosts.filter(cost => {
        // Als er start_date is, gebruik die logica
        if (cost.start_date) {
          const costStartDate = new Date(cost.start_date);
          const costEndDate = cost.end_date ? new Date(cost.end_date) : null;
          
          // Check of deze maand binnen de actieve periode valt
          const isAfterStart = monthStart >= getStartOfMonth(costStartDate);
          const isBeforeEnd = !costEndDate || monthEnd <= getEndOfMonth(costEndDate);
          
          return isAfterStart && isBeforeEnd;
        }
        
        // Legacy: als geen start_date, gebruik status
        return cost.status === 'actief';
      });

      const fixedTotal = activeCostsForMonth.reduce((sum, cost) => 
        sum + parseFloat(cost.amount || 0), 0
      );
      
      // Onverwachte kosten voor deze specifieke maand
      const unexpectedForMonth = allUnexpectedCosts.filter(cost => {
        if (!cost.date) return false;
        const costDate = new Date(cost.date);
        return isWithinInterval(costDate, { start: monthStart, end: monthEnd });
      });
      
      const unexpectedTotal = unexpectedForMonth.reduce((sum, cost) => 
        sum + parseFloat(cost.amount || 0), 0
      );

      return {
        month: formatMonthShort(monthStart),
        fullDate: formatMonthYearFull(monthStart),
        vast: fixedTotal,
        onverwacht: unexpectedTotal,
        totaal: fixedTotal + unexpectedTotal
      };
    });
  }, [allMonthlyCosts, allUnexpectedCosts]);

  // Bereken gemiddelden en totalen
  const stats = useMemo(() => {
    const totals = chartData.reduce((acc, month) => ({
      vast: acc.vast + month.vast,
      onverwacht: acc.onverwacht + month.onverwacht,
      totaal: acc.totaal + month.totaal
    }), { vast: 0, onverwacht: 0, totaal: 0 });

    return {
      avgVast: totals.vast / 12,
      avgOnverwacht: totals.onverwacht / 12,
      avgTotaal: totals.totaal / 12,
      totalYear: totals.totaal
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.fullDate}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Vast: {formatCurrency(payload[0].payload.vast)}
            </p>
            <p className="text-sm text-orange-600">
              Onverwacht: {formatCurrency(payload[0].payload.onverwacht)}
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
    <div className="bg-white dark:bg-transparent rounded-xl p-5">
      {/* Grafiek */}
      <div style={{ width: '100%', height: 300 }} className="bg-white dark:bg-white rounded-xl p-4">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOnverwacht" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
              name="Vaste Lasten"
              stackId="1"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorVast)"
            />
            <Area
              type="monotone"
              dataKey="onverwacht"
              name="Onverwachte Kosten"
              stackId="1"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorOnverwacht)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        Gebaseerd op de laatste 12 maanden
      </p>
    </div>
  );
};

export default MonthlyCostsChart;