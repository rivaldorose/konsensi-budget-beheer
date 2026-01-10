import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Euro, Calendar as CalendarIcon, Info } from "lucide-react";
import { 
  paymentFrequencies, 
  incomeCategories, 
  daysOfWeek,
  calculateMonthlyEquivalent,
  needsDayOfWeek,
  needsDayOfMonth
} from "../utils/frequencyHelpers";

export default function IncomeFormModal({ income, isOpen, onClose, onSave, editingIncome }) {
  // Use editingIncome if provided, otherwise fall back to income prop
  const incomeData = editingIncome || income;
  
  const [step, setStep] = useState(incomeData ? 2 : 1); // Start at step 1 (type selection) for new, step 2 for editing
  const [incomeType, setIncomeType] = useState(incomeData?.income_type || null);
  
  const [formData, setFormData] = useState(incomeData || {
    description: '',
    category: 'salaris',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    day_of_week: null,
    day_of_month: 25,
    is_active: true,
    is_variable: false,
    notes: '',
    income_type: 'vast',
    date: new Date().toISOString().split('T')[0]
  });

  const [monthlyEquivalent, setMonthlyEquivalent] = useState(0);
  
  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (incomeData) {
        setStep(2);
        setIncomeType(incomeData.income_type || 'vast');
      } else {
        setStep(1);
        setIncomeType(null);
      }
    }
  }, [isOpen, incomeData]);

  useEffect(() => {
    const equiv = calculateMonthlyEquivalent(parseFloat(formData.amount) || 0, formData.frequency);
    setMonthlyEquivalent(equiv);
  }, [formData.amount, formData.frequency]);

  useEffect(() => {
    if (incomeData) {
      setFormData({
        ...incomeData,
        amount: incomeData.amount?.toString() || '', // Ensure amount is a string for the input field
        day_of_week: incomeData.day_of_week || null, // Default to null if undefined
        day_of_month: incomeData.day_of_month || 25, // Default to 25 if undefined
        end_date: incomeData.end_date || '', // Default to empty string if undefined
        notes: incomeData.notes || '' // Default to empty string if undefined
      });
    }
  }, [incomeData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      income_type: incomeType,
      amount: parseFloat(formData.amount) || 0,
      monthly_equivalent: incomeType === 'vast' ? monthlyEquivalent : null,
      day_of_week: incomeType === 'vast' && needsDayOfWeek(formData.frequency) ? formData.day_of_week : null,
      day_of_month: incomeType === 'vast' && needsDayOfMonth(formData.frequency) ? formData.day_of_month : null,
      end_date: formData.end_date || null,
      date: incomeType === 'extra' ? formData.date : null,
      frequency: incomeType === 'vast' ? formData.frequency : null,
      is_variable: incomeType === 'vast' ? formData.is_variable : false,
      last_amount_update: formData.is_variable ? new Date().toISOString().split('T')[0] : null
    };

    onSave(data);
  };
  
  const handleTypeSelect = (type) => {
    setIncomeType(type);
    setStep(2);
  };

  // Add safety checks to ensure categoryInfo and freqInfo are always defined
  const categoryInfo = incomeCategories.find(c => c.value === formData.category) || incomeCategories[0];
  const freqInfo = paymentFrequencies.find(f => f.value === formData.frequency) || paymentFrequencies.find(f => f.value === 'monthly');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {incomeData ? 'Inkomen Bewerken' : 'Inkomen Toevoegen'}
          </DialogTitle>
          {step === 1 && (
            <p className="text-sm text-gray-500">Kies het type inkomen dat je wilt toevoegen</p>
          )}
        </DialogHeader>

        {/* Step 1: Type Selection */}
        {step === 1 && !incomeData && (
          <div className="space-y-4 py-4">
            <button
              type="button"
              onClick={() => setIncomeType('vast')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-green-400 hover:bg-green-50 ${
                incomeType === 'vast' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Vast Inkomen</h3>
                  <p className="text-sm text-gray-500">Terugkerend inkomen zoals salaris, uitkering of studiefinanciering</p>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setIncomeType('extra')}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-green-400 hover:bg-green-50 ${
                incomeType === 'extra' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Extra Inkomen</h3>
                  <p className="text-sm text-gray-500">Eenmalige inkomsten zoals bonussen, cadeaus of terugbetalingen</p>
                </div>
              </div>
            </button>
            
            <Button 
              type="button"
              onClick={() => setStep(2)}
              disabled={!incomeType}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volgende
            </Button>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Beschrijving */}
          <div>
            <Label htmlFor="description">Beschrijving *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={incomeType === 'vast' ? "bijv. Salaris, uitkering, studiefinanciering..." : "bijv. Bonus, cadeau, terugbetaling..."}
              required
            />
          </div>

          {/* Bedrag */}
          <div>
            <Label htmlFor="amount">Bedrag (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Extra Inkomen: alleen datum */}
          {incomeType === 'extra' && (
            <>
              <div>
                <Label htmlFor="date">Datum ontvangen *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              {/* Info banner voor extra inkomen */}
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  💡 Dit inkomen wordt alleen geteld in de geselecteerde maand
                </p>
              </div>
            </>
          )}

          {/* Vast Inkomen: uitgebreide opties */}
          {incomeType === 'vast' && (
            <>
              {/* Variabel inkomen toggle */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-400">Variabel inkomen?</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Aan zetten als je inkomen elke maand anders is (bijv. oproepkracht, onregelmatige diensten)
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_variable || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_variable: checked }))}
                  />
                </div>
                {formData.is_variable && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    💡 Je kunt het bedrag elke maand bijwerken via de bewerk-knop
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">Is dit je huidige baan?</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="currentJob"
                    checked={formData.is_active === true}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Ja</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="currentJob"
                    checked={formData.is_active === false}
                    onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Nee</span>
                </label>
              </div>

              <div>
                <Label htmlFor="start_date">Startdatum *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency">Hoe vaak ontvang je dit? *</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentFrequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Month (for monthly frequencies) */}
              {needsDayOfMonth(formData.frequency) && (
                <div>
                  <Label htmlFor="day_of_month">Op welke dag van de maand? *</Label>
                  <Select 
                    value={formData.day_of_month?.toString() || '25'} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_month: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}e van de maand
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Day of Week (for weekly frequencies) */}
              {needsDayOfWeek(formData.frequency) && (
                <div>
                  <Label htmlFor="day_of_week">Op welke dag? *</Label>
                  <Select 
                    value={formData.day_of_week?.toString() || '5'} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!incomeData && (
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Terug
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]">
              {incomeData ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}