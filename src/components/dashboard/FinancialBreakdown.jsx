
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from '@/components/utils/formatters';


const FinancialBreakdown = ({ breakdownData, totalIncome, t }) => {
  const COLORS = ['#16a34a', '#4ade80', '#86efac', '#d1fae5']; // Green-600, 400, 300, 200

  if (!breakdownData || breakdownData.length === 0 || totalIncome === 0) {
    return (
      <Card className="bg-white shadow-sm rounded-xl border-none">
        <CardHeader>
          <CardTitle className="text-base font-medium capitalize">{t('financialBreakdown.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full text-center p-8">
          <div>
            <div className="text-3xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">{t('financialBreakdown.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = breakdownData.filter(d => d.value > 0);

  return (
    <Card className="bg-white shadow-sm rounded-xl border-none">
        <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="p-5 hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="text-base font-medium capitalize">{t('financialBreakdown.title')}</CardTitle>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="flex flex-col items-center pt-0">
                    <div style={{ width: '100%', height: 220 }} className="relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            innerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            cornerRadius={8}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                           <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            innerRadius={55}
                            fill="#8884d8"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            cornerRadius={8}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
                            ))}
                          </Pie>
                           <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={50}
                            innerRadius={30}
                            fill="#8884d8"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={2}
                            cornerRadius={8}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.3}/>
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                         <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalIncome, { decimals: 0 })}</p>
                         <p className="text-xs text-gray-500 capitalize">{t('financialBreakdown.totalIncome')}</p>
                      </div>
                    </div>
                    <div className="w-full space-y-3 mt-6 px-4">
                      {chartData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-gray-600">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-800">{formatCurrency(item.value, { decimals: 0 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </Card>
  );
};

export default FinancialBreakdown;
