import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/components/utils/formatters';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}</span>: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function PotjesComparisonChart({ categoryData, totalIncome }) {
  if (!categoryData || categoryData.length === 0) {
    return null;
  }

  const chartData = categoryData
    .filter(cat => cat.budget > 0 || cat.spent > 0)
    .map(cat => ({
      naam: cat.label,
      'NIBUD advies': cat.nibud_advice,
      'jouw budget': cat.budget,
      'uitgegeven': cat.spent
    }));

  const stats = {
    nibudTotal: categoryData.reduce((sum, cat) => sum + cat.nibud_advice, 0),
    budgetTotal: categoryData.reduce((sum, cat) => sum + cat.budget, 0),
    spentTotal: categoryData.reduce((sum, cat) => sum + cat.spent, 0)
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:border-b [&[data-state=open]]:border-gray-100">
            <div className="flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5" />
              <span className="text-base font-medium">Potjes Vergelijking met NIBUD</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-4">
            {/* Statistieken */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">NIBUD Advies</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.nibudTotal, { decimals: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Jouw Budget</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.budgetTotal, { decimals: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Uitgegeven</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.spentTotal, { decimals: 0 })}
                </p>
              </div>
            </div>

            {/* Grafiek met vloeiende lijnen */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <defs>
                      {/* Kleuren aangepast voor vloeiender effect */}
                      <linearGradient id="colorNibud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="naam" 
                      stroke="#9ca3af" 
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `€${Math.round(value)}`}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area
                      type="monotone"
                      dataKey="NIBUD advies"
                      name="NIBUD advies"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNibud)"
                    />
                    <Area
                      type="monotone"
                      dataKey="jouw budget"
                      name="Jouw budget"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBudget)"
                    />
                    <Area
                      type="monotone"
                      dataKey="uitgegeven"
                      name="Uitgegeven"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSpent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Vergelijk je potjes met NIBUD-richtlijnen op basis van je inkomen van {formatCurrency(totalIncome)}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}