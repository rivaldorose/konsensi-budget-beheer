import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/components/utils/formatters';

const statusTypes = [
  { value: 'niet_actief', label: 'Niet Actief' },
  { value: 'wachtend', label: 'Wachtend' },
  { value: 'betalingsregeling', label: 'Betalingsregeling' },
  { value: 'afbetaald', label: 'Afbetaald' },
];

export default function Step4DateStatus({ formData, updateFormData, vtblBudget }) {
  const monthlyPayment = parseFloat(formData.monthly_payment) || 0;
  const totalDebt = (parseFloat(formData.principal_amount) || 0) + (parseFloat(formData.collection_costs) || 0) + (parseFloat(formData.interest_amount) || 0);
  const monthsToPayOff = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="originDate" className="text-gray-900 dark:text-white">Wanneer ontstond deze schuld? *</Label>
        <Input
          id="originDate"
          type="date"
          value={formData.origin_date}
          onChange={(e) => updateFormData({ origin_date: e.target.value })}
          className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white dark:[color-scheme:dark]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status" className="text-gray-900 dark:text-white">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value })}>
          <SelectTrigger id="status" className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
            {statusTypes.map(type => (
              <SelectItem key={type.value} value={type.value} className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payment arrangement fields */}
      {formData.status === 'betalingsregeling' && (
        <div className="space-y-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 !text-[20px]">handshake</span>
            <span className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Betalingsregeling</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyPayment" className="text-gray-900 dark:text-white">Afgesproken maandbedrag *</Label>
            <Input
              id="monthlyPayment"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.monthly_payment || ''}
              onChange={(e) => updateFormData({ monthly_payment: e.target.value })}
              className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
            />
          </div>

          {/* Duration estimate */}
          {monthlyPayment > 0 && totalDebt > 0 && (
            <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="material-symbols-outlined !text-[16px]">schedule</span>
              <span>
                Bij {formatCurrency(monthlyPayment)}/mnd is deze schuld over <strong>{monthsToPayOff} maanden</strong> afgelost
                {monthsToPayOff > 12 && <span> ({(monthsToPayOff / 12).toFixed(1)} jaar)</span>}
              </span>
            </div>
          )}

          {/* VTLB sustainability check */}
          {vtblBudget !== undefined && vtblBudget !== null && monthlyPayment > 0 && (
            <div className={`text-sm flex items-center gap-2 rounded-lg p-2 ${
              monthlyPayment <= vtblBudget
                ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              <span className="material-symbols-outlined !text-[16px]">
                {monthlyPayment <= vtblBudget ? 'check_circle' : 'warning'}
              </span>
              {monthlyPayment <= vtblBudget ? (
                <span>Past binnen je VTLB budget van {formatCurrency(vtblBudget)}/mnd</span>
              ) : (
                <span>
                  <strong>Let op:</strong> Dit bedrag is hoger dan je beschikbare VTLB budget van {formatCurrency(vtblBudget)}/mnd.
                  Je komt {formatCurrency(monthlyPayment - vtblBudget)} tekort.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
