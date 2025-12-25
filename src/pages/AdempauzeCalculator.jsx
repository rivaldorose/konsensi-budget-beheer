
import React, { useState, useEffect } from "react";
import { incomeService } from '@/components/services';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";

export default function AdempauzeCalculator() {
  const [income, setIncome] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadIncome = async () => {
      try {
        const currentFixedIncome = await incomeService.getFixedIncome();
        setIncome(currentFixedIncome.toString());
        calculateProtection(currentFixedIncome);
      } catch (error) {
        console.error("Error loading income:", error);
      }
    };
    loadIncome();
  }, []);

  const calculateProtection = (monthlyIncome) => {
    const incomeNum = parseFloat(monthlyIncome) || 0;
    
    if (incomeNum === 0) {
      setResult({
        status: 'volledig_beschermd',
        protectedAmount: 0,
        maxBeslag: 0,
        breakdown: [],
        message: '✅ Je bent volledig beschermd. Zonder inkomen kunnen schuldeisers niets bij je halen.'
      });
      return;
    }
    
    if (incomeNum < 1626) {
      setResult({
        status: 'beslagvrije_voet',
        protectedAmount: incomeNum,
        maxBeslag: 0,
        breakdown: [],
        message: '✅ Al je inkomen valt onder de beslagvrije voet en is volledig beschermd.'
      });
      return;
    }
    
    // Calculate beslag
    let remaining = incomeNum - 1626;
    const breakdown = [];
    let totalBeslag = 0;
    
    // Eerste €229: 10%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 229);
      const beslag = chunk * 0.10;
      breakdown.push({ range: 'Eerste €229', percentage: '10%', amount: beslag });
      totalBeslag += beslag;
      remaining -= chunk;
    }
    
    // Volgende €229: 20%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 229);
      const beslag = chunk * 0.20;
      breakdown.push({ range: 'Volgende €229', percentage: '20%', amount: beslag });
      totalBeslag += beslag;
      remaining -= chunk;
    }
    
    // Volgende €229: 30%
    if (remaining > 0) {
      const chunk = Math.min(remaining, 229);
      const beslag = chunk * 0.30;
      breakdown.push({ range: 'Volgende €229', percentage: '30%', amount: beslag });
      totalBeslag += beslag;
      remaining -= chunk;
    }
    
    // Rest: 40%
    if (remaining > 0) {
      const beslag = remaining * 0.40;
      breakdown.push({ range: 'Rest', percentage: '40%', amount: beslag });
      totalBeslag += beslag;
    }
    
    setResult({
      status: 'gedeeltelijk_beschermd',
      protectedAmount: 1626,
      maxBeslag: totalBeslag,
      breakdown,
      message: `Je houdt altijd minimaal ${formatCurrency(1626)} per maand over. Maximum mogelijk beslag: ${formatCurrency(totalBeslag)}/maand.`
    });
  };

  const handleCalculate = () => {
    calculateProtection(income);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = createPageUrl('Adempauze')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Terug naar Adempauze
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bereken Jouw Situatie</h1>
          <p className="text-gray-600">Zie precies hoeveel je beschermd bent</p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Jouw Maandinkomen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="income">Netto inkomen per maand</Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                  <Input
                    id="income"
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    onBlur={handleCalculate}
                    className="pl-8"
                    placeholder="0"
                  />
                </div>
                <Button onClick={handleCalculate}>
                  Bereken
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-2 ${result.status === 'volledig_beschermd' || result.status === 'beslagvrije_voet' ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
              <CardHeader>
                <CardTitle>Jouw Situatie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Beslagvrije voet 2025</p>
                  <p className="text-4xl font-bold text-gray-900">{formatCurrency(1626)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Jouw beschermde inkomen:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(result.protectedAmount, { decimals: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Maximum mogelijk beslag:</span>
                    <span className="text-xl font-bold text-red-600">{formatCurrency(result.maxBeslag, { decimals: 0 })}</span>
                  </div>
                </div>

                {result.breakdown.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Gedetailleerde Berekening:</h3>
                    <div className="space-y-2">
                      {result.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.range} × {item.percentage}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Totaal mogelijk beslag:</span>
                        <span className="text-red-600">{formatCurrency(result.maxBeslag)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`rounded-lg p-4 ${result.status === 'volledig_beschermd' || result.status === 'beslagvrije_voet' ? 'bg-green-100 border border-green-300' : 'bg-amber-100 border border-amber-300'}`}>
                  <p className={`font-medium ${result.status === 'volledig_beschermd' || result.status === 'beslagvrije_voet' ? 'text-green-900' : 'text-amber-900'}`}>
                    {result.message}
                  </p>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        )}

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              <strong>Let op:</strong> Dit is een indicatieve berekening. De werkelijke situatie kan complexer zijn. 
              Neem contact op met gemeente schuldhulpverlening voor persoonlijk advies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
