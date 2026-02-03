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

export default function Step4DateStatus({ formData, updateFormData, vtblData }) {
  const monthlyPayment = parseFloat(formData.monthly_payment) || 0;
  const totalDebt = (parseFloat(formData.principal_amount) || 0) + (parseFloat(formData.collection_costs) || 0) + (parseFloat(formData.interest_amount) || 0);
  const monthsToPayOff = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0;

  // Recalculate VTLB with this new payment included
  const hasVtbl = vtblData && vtblData.vastInkomen > 0;
  const currentRegelingen = hasVtbl ? (vtblData.huidigeRegelingen || 0) : 0;
  const newTotalRegelingen = currentRegelingen + monthlyPayment;
  const newBeschikbaar = hasVtbl ? Math.max(0, vtblData.vastInkomen - vtblData.vasteLasten - newTotalRegelingen) : 0;
  const newAflosCapaciteit = newBeschikbaar * 0.15;
  const isSustainable = hasVtbl && monthlyPayment > 0 && (vtblData.vastInkomen - vtblData.vasteLasten - newTotalRegelingen) >= 0;

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

          {/* Full VTLB recalculation */}
          {hasVtbl && monthlyPayment > 0 && (
            <div className={`rounded-xl p-4 space-y-3 ${
              isSustainable
                ? 'bg-white dark:bg-[#1a1a1a] border border-green-200 dark:border-green-500/20'
                : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined !text-[18px] ${isSustainable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isSustainable ? 'check_circle' : 'warning'}
                </span>
                <span className={`text-sm font-semibold ${isSustainable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {isSustainable ? 'Haalbaar' : 'Niet haalbaar'} — VTLB herberekening
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#a1a1a1]">Vast inkomen</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(vtblData.vastInkomen)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-[#a1a1a1]">Vaste lasten</span>
                  <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(vtblData.vasteLasten)}</span>
                </div>
                {currentRegelingen > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-[#a1a1a1]">Bestaande regelingen</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">- {formatCurrency(currentRegelingen)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-400 font-medium">+ Deze regeling (nieuw)</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">- {formatCurrency(monthlyPayment)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-1.5 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">= Nieuw beschikbaar</span>
                  <span className={`font-bold ${newBeschikbaar > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(newBeschikbaar)}
                  </span>
                </div>
              </div>

              {!isSustainable && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Met deze regeling kom je {formatCurrency(Math.abs(vtblData.vastInkomen - vtblData.vasteLasten - newTotalRegelingen))} tekort per maand.
                  Overweeg een lager maandbedrag af te spreken.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
