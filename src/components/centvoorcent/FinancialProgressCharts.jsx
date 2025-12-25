import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/components/utils/formatters";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function FinancialProgressCharts({ monthlyData, historicalData = [] }) {
    // Bereid data voor grafieken
    const chartData = historicalData.length > 0 ? historicalData : [
        {
            month: 'Deze maand',
            inkomen: monthlyData.total_income || 0,
            uitgaven: (monthlyData.fixed_costs || 0) + (monthlyData.pots_spent || 0),
            besparingen: monthlyData.savings || 0
        }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Bereken trends
    const incomeTrend = monthlyData.total_income > monthlyData.fixed_costs + monthlyData.pots_spent;
    const savingsTrend = (monthlyData.savings || 0) > 0;

    return (
        <div className="space-y-6">
            {/* Trend Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Totaal Inkomen</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(monthlyData.total_income || 0)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Totale Uitgaven</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency((monthlyData.fixed_costs || 0) + (monthlyData.pots_spent || 0))}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${savingsTrend ? 'from-blue-50 to-cyan-50' : 'from-gray-50 to-slate-50'}`}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Besparingen</p>
                                <p className={`text-2xl font-bold ${savingsTrend ? 'text-blue-900' : 'text-gray-600'}`}>
                                    {formatCurrency(monthlyData.savings || 0)}
                                </p>
                            </div>
                            <Activity className={`w-8 h-8 ${savingsTrend ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bar Chart - Inkomen vs Uitgaven */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">📊 Inkomen vs Uitgaven</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="inkomen" fill="#10b981" name="Inkomen" />
                            <Bar dataKey="uitgaven" fill="#f59e0b" name="Uitgaven" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Line Chart - Besparingen Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">📈 Besparingen Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="besparingen" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                name="Besparingen"
                                dot={{ fill: '#3b82f6', r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}