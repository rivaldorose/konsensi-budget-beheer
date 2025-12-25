import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";

export default function AIFinancialInsights({ monthlyData, selectedMonth }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (monthlyData) {
            generateInsights();
        }
    }, [monthlyData, selectedMonth]);

    const generateInsights = async () => {
        setLoading(true);
        try {
            const context = `
Financiële data voor ${selectedMonth}:
- Totaal inkomen: €${monthlyData.total_income || 0}
- Vaste lasten: €${monthlyData.fixed_costs || 0}
- Potjes budget: €${monthlyData.pots_budget || 0}
- Potjes uitgegeven: €${monthlyData.pots_spent || 0}
- Besparingen: €${monthlyData.savings || 0}
- Totale schuld: €${monthlyData.total_debt || 0}
- Schuld afbetaald: €${monthlyData.debt_paid || 0}
            `.trim();

            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Je bent een empathische financiële coach. Analyseer deze maandelijkse financiële data en geef 4 concrete inzichten. Wees praktisch, bemoedigend en specifiek.

${context}

Geef terug in dit EXACTE JSON formaat:
{
  "insights": [
    {
      "type": "spending_pattern",
      "title": "Korte titel",
      "description": "Concreet inzicht over uitgavepatroon",
      "icon": "💡"
    },
    {
      "type": "savings_advice",
      "title": "Korte titel",
      "description": "Praktisch besparingsadvies",
      "icon": "💰"
    },
    {
      "type": "positive_feedback",
      "title": "Korte titel",
      "description": "Positieve feedback",
      "icon": "✨"
    },
    {
      "type": "warning",
      "title": "Korte titel",
      "description": "Waarschuwing of aandachtspunt",
      "icon": "⚠️"
    }
  ]
}

Types: "spending_pattern" (patronen in uitgaven), "savings_advice" (hoe te besparen), "positive_feedback" (compliment), "warning" (waarschuwing)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        insights: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    icon: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (response.insights && Array.isArray(response.insights)) {
                setInsights(response.insights);
            }
        } catch (error) {
            console.error('Error generating insights:', error);
            // Fallback insights
            setInsights([
                {
                    type: 'positive_feedback',
                    title: 'Goed bezig!',
                    description: 'Je houdt je uitgaven bij en dat is een belangrijke stap.',
                    icon: '✨'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getInsightColor = (type) => {
        switch(type) {
            case 'warning':
                return 'from-orange-50 to-red-50 border-orange-200';
            case 'positive_feedback':
                return 'from-green-50 to-emerald-50 border-green-200';
            case 'savings_advice':
                return 'from-blue-50 to-cyan-50 border-blue-200';
            case 'spending_pattern':
                return 'from-purple-50 to-pink-50 border-purple-200';
            default:
                return 'from-gray-50 to-slate-50 border-gray-200';
        }
    };

    return (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Financiële Inzichten
                    </CardTitle>
                    <Button
                        onClick={generateInsights}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Vernieuwen
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
                            <span className="text-gray-600">AI analyseert je financiën...</span>
                        </div>
                    </div>
                ) : insights ? (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {insights.map((insight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`bg-gradient-to-r ${getInsightColor(insight.type)} rounded-lg p-4 border-2`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{insight.icon}</span>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                                            <p className="text-sm text-gray-700">{insight.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Klik op vernieuwen om AI-inzichten te genereren
                    </div>
                )}
            </CardContent>
        </Card>
    );
}