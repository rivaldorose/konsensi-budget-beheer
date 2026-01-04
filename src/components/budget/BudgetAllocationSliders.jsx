import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Pot } from "@/api/entities";
import { formatCurrency } from "@/components/utils/formatters";
import { AlertTriangle, Check, PiggyBank, Save } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export default function BudgetAllocationSliders({ 
  availableForPots, 
  totalIncome, 
  fixedCosts,
  userEmail,
  onUpdate 
}) {
  const { toast } = useToast();
  const [pots, setPots] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPots();
  }, [userEmail]);

  const loadPots = async () => {
    const { User } = await import('@/api/entities');
    const user = await User.me();
    if (!user) return;
    const potsData = await Pot.filter({ user_id: user.id, pot_type: 'expense' });
    setPots(potsData);
    
    // Initialize allocations from current budgets
    const initial = {};
    potsData.forEach(pot => {
      initial[pot.id] = pot.monthly_budget || 0;
    });
    setAllocations(initial);
  };

  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remaining = availableForPots - totalAllocated;
  const isOverBudget = remaining < 0;

  const handleSliderChange = (potId, value) => {
    setAllocations(prev => ({
      ...prev,
      [potId]: value[0]
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        pots.map(pot => 
          Pot.update(pot.id, { monthly_budget: allocations[pot.id] || 0 })
        )
      );
      toast({ title: '✅ Budgetten opgeslagen!' });
      setHasChanges(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({ title: '❌ Fout bij opslaan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoDistribute = () => {
    if (pots.length === 0) return;
    const perPot = Math.floor(availableForPots / pots.length);
    const newAllocations = {};
    pots.forEach(pot => {
      newAllocations[pot.id] = perPot;
    });
    setAllocations(newAllocations);
    setHasChanges(true);
  };

  if (pots.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center">
          <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Maak eerst potjes aan om je budget te verdelen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📊 Budget Toewijzen
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Verdeel je beschikbare budget over je potjes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoDistribute}>
              Automatisch verdelen
            </Button>
            {hasChanges && (
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving || isOverBudget}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-1" />
                Opslaan
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Bar */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Beschikbaar voor potjes</span>
            <span className="font-bold text-gray-900">{formatCurrency(availableForPots)}</span>
          </div>
          <Progress 
            value={Math.min((totalAllocated / availableForPots) * 100, 100)} 
            className="h-3 mb-2" 
          />
          <div className="flex justify-between text-sm">
            <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-green-600'}>
              {isOverBudget 
                ? `${formatCurrency(Math.abs(remaining))} te veel toegewezen`
                : `${formatCurrency(remaining)} nog te verdelen`
              }
            </span>
            <span className="text-gray-500">
              {formatCurrency(totalAllocated)} toegewezen
            </span>
          </div>
          
          {isOverBudget && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              Je budget is hoger dan beschikbaar. Pas de verdeling aan.
            </div>
          )}
        </div>

        {/* Income Breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700">Inkomen</p>
            <p className="font-bold text-green-800">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-red-700">Vaste Lasten</p>
            <p className="font-bold text-red-800">-{formatCurrency(fixedCosts)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">Beschikbaar</p>
            <p className="font-bold text-blue-800">{formatCurrency(availableForPots)}</p>
          </div>
        </div>

        {/* Sliders per Pot */}
        <div className="space-y-5">
          {pots.map(pot => {
            const allocation = allocations[pot.id] || 0;
            const percentage = availableForPots > 0 
              ? Math.round((allocation / availableForPots) * 100) 
              : 0;
            
            return (
              <div key={pot.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{pot.icon}</span>
                    <span className="font-medium text-gray-900">{pot.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{formatCurrency(allocation)}</span>
                    <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                  </div>
                </div>
                
                <Slider
                  value={[allocation]}
                  max={availableForPots}
                  step={5}
                  onValueChange={(value) => handleSliderChange(pot.id, value)}
                  className="cursor-pointer"
                />
                
                <div className="flex justify-between text-xs text-gray-400">
                  <span>€0</span>
                  <span>{formatCurrency(availableForPots)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}