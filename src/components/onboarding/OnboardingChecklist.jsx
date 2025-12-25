import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function OnboardingChecklist({ user, onItemClick }) {
    const items = [
        {
            id: 'income',
            title: 'Voeg je inkomen toe',
            description: 'Start met het vastleggen van je maandelijkse inkomen',
            icon: '💰',
            link: createPageUrl('Income'),
            completed: user?.monthly_income > 0
        },
        {
            id: 'costs',
            title: 'Registreer vaste lasten',
            description: 'Voeg huur, energie en andere vaste kosten toe',
            icon: '🏠',
            link: createPageUrl('MaandelijkseLasten'),
            completed: false // You can add logic to check if costs exist
        },
        {
            id: 'budget',
            title: 'Stel je budget op',
            description: 'Maak een overzicht van je maandelijkse budget',
            icon: '📊',
            link: createPageUrl('BudgetView'),
            completed: false
        },
        {
            id: 'pots',
            title: 'Maak spaarpotjes',
            description: 'Organiseer je geld in verschillende potjes',
            icon: '🏺',
            link: createPageUrl('Potjes'),
            completed: false
        },
        {
            id: 'debts',
            title: 'Registreer schulden (indien van toepassing)',
            description: 'Krijg inzicht in je betaalachterstanden',
            icon: '💳',
            link: createPageUrl('Debts'),
            completed: user?.has_debts === false || (user?.has_debts && user?.total_debt_amount > 0)
        }
    ];

    const completedCount = items.filter(item => item.completed).length;
    const progressPercentage = (completedCount / items.length) * 100;

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Aan de slag!
                </CardTitle>
                <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{completedCount} van {items.length} voltooid</span>
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item, index) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onItemClick ? onItemClick(item) : window.location.href = item.link}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                            item.completed
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-xs text-gray-600">{item.description}</p>
                        </div>
                        {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                    </motion.button>
                ))}
            </CardContent>
        </Card>
    );
}