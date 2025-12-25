import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, Home, Utensils, Car, Gamepad2, Heart, CreditCard, PiggyBank } from "lucide-react";

const categoryConfig = {
  housing: {
    label: 'Wonen',
    recommended: 30,
    icon: Home,
    color: '#3b82f6'
  },
  food: {
    label: 'Voedsel',
    recommended: 15,
    icon: Utensils,
    color: '#10b981'
  },
  transport: {
    label: 'Vervoer',
    recommended: 10,
    icon: Car,
    color: '#f59e0b'
  },
  entertainment: {
    label: 'Ontspanning',
    recommended: 10,
    icon: Gamepad2,
    color: '#8b5cf6'
  },
  healthcare: {
    label: 'Zorgkosten',
    recommended: 5,
    icon: Heart,
    color: '#ef4444'
  },
  debt_payments: {
    label: 'Schulden',
    recommended: 15,
    icon: CreditCard,
    color: '#6b7280'
  },
  savings: {
    label: 'Sparen',
    recommended: 10,
    icon: PiggyBank,
    color: '#059669'
  },
  other: {
    label: 'Overig',
    recommended: 5,
    icon: PieChartIcon,
    color: '#84cc16'
  }
};

function CircularProgress({ percentage, color, size = 80 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-800">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

export default function BudgetCategoryRings({ expenses, totalIncome, loading }) {
  if (loading) {
    return (
      <Card className="glass-card border-0 rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-800 text-xl font-bold">Budget per Categorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate spending per category
  const categorySpending = {};
  expenses.forEach(expense => {
    const category = expense.category || 'other';
    categorySpending[category] = (categorySpending[category] || 0) + expense.amount;
  });

  return (
    <Card className="glass-card border-0 rounded-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-gray-800 text-xl font-bold flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-600" />
          Budget per Categorie
        </CardTitle>
        <p className="text-gray-600 text-sm">Percentage van totaal inkomen besteed</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const spent = categorySpending[key] || 0;
            const spentPercentage = totalIncome > 0 ? (spent / totalIncome) * 100 : 0;
            const recommendedAmount = (totalIncome * config.recommended) / 100;
            const Icon = config.icon;
            
            // Determine status color
            let statusColor = config.color;
            if (spentPercentage > config.recommended * 1.2) {
              statusColor = '#ef4444'; // Red for over budget
            } else if (spentPercentage > config.recommended) {
              statusColor = '#f59e0b'; // Yellow for approaching limit
            }

            return (
              <div key={key} className="text-center">
                <div className="flex flex-col items-center mb-3">
                  <CircularProgress 
                    percentage={Math.min(spentPercentage, 100)} 
                    color={statusColor}
                    size={80}
                  />
                  <div className="mt-2 p-2 bg-gray-100 rounded-full">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{config.label}</h4>
                <p className="text-xs text-gray-600 mb-1">
                  €{spent.toFixed(0)} / €{recommendedAmount.toFixed(0)}
                </p>
                <div className="text-xs">
                  <span className={`font-medium ${
                    spentPercentage > config.recommended * 1.2 ? 'text-red-600' :
                    spentPercentage > config.recommended ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {spentPercentage.toFixed(1)}% van {config.recommended}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Binnen budget</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Bijna over budget</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Over budget</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}