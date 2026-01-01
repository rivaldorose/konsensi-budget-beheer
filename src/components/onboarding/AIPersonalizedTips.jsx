import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";

export default function AIPersonalizedTips({ user }) {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (user) {
            generateTips();
        }
    }, [user]);

    const generateTips = async () => {
        setLoading(true);
        try {
            // Build context from user data
            const context = `
Gebruiker financiële situatie:
- Maandelijks inkomen: €${user.monthly_income || 0}
- Inkomensbron: ${user.income_source || 'onbekend'}
- Heeft schulden: ${user.has_debts ? 'ja' : 'nee'}
${user.has_debts ? `- Totale schuld: €${user.total_debt_amount || 0}` : ''}
${user.has_debts ? `- Aantal schuldeisers: ${user.debt_count_range || 'onbekend'}` : ''}
- Leeftijd: ${user.age || 'onbekend'}
${user.story ? `- Verhaal: ${user.story}` : ''}
            `.trim();

            const response = await InvokeLLM({
                prompt: `Je bent een empathische financiële coach. Analyseer de volgende situatie en geef 4 concrete, praktische tips. Elke tip moet een categorie hebben (advies, waarschuwing, of positief) en moet persoonlijk en bemoedigend zijn.

${context}

Geef de tips terug in dit EXACTE JSON formaat (geen extra tekst):
{
  "tips": [
    {
      "category": "advies",
      "title": "Korte titel",
      "description": "Concrete actie die ze kunnen nemen"
    }
  ]
}

Categorieën: "advies" (algemeen advies), "waarschuwing" (let op iets), "positief" (bemoediging)`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tips: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    category: { type: "string" },
                                    title: { type: "string" },
                                    description: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            if (response.tips && Array.isArray(response.tips)) {
                setTips(response.tips);
            }
        } catch (error) {
            console.error('Error generating tips:', error);
            // Fallback tips
            setTips([
                {
                    category: 'advies',
                    title: 'Start met je inkomsten',
                    description: 'Begin met het registreren van al je inkomsten om een compleet overzicht te krijgen.'
                },
                {
                    category: 'positief',
                    title: 'Goede eerste stap!',
                    description: 'Het feit dat je hier bent en actie onderneemt is al een geweldige stap vooruit.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category) => {
        switch(category) {
            case 'waarschuwing':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'positief':
                return <Heart className="w-5 h-5 text-green-500" />;
            default:
                return <Lightbulb className="w-5 h-5 text-blue-500" />;
        }
    };

    const getCategoryColor = (category) => {
        switch(category) {
            case 'waarschuwing':
                return 'from-orange-50 to-red-50 border-orange-200';
            case 'positief':
                return 'from-green-50 to-emerald-50 border-green-200';
            default:
                return 'from-blue-50 to-indigo-50 border-blue-200';
        }
    };

    if (!user) return null;

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Jouw Persoonlijke Tips
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
                            <span className="text-gray-600">AI analyseert je situatie...</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tips.map((tip, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-gradient-to-r ${getCategoryColor(tip.category)} rounded-lg p-4 border-2`}
                            >
                                <div className="flex items-start gap-3">
                                    {getCategoryIcon(tip.category)}
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">{tip.title}</h4>
                                        <p className="text-sm text-gray-700">{tip.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        
                        <Button
                            onClick={generateTips}
                            variant="outline"
                            className="w-full mt-4"
                            size="sm"
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Nieuwe tips genereren
                        </Button>
                    </div>
                )}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}