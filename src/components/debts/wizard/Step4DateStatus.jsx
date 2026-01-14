import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusTypes = [
  { value: 'niet_actief', label: 'Niet Actief' },
  { value: 'wachtend', label: 'Wachtend' },
  { value: 'betalingsregeling', label: 'Betalingsregeling' },
  { value: 'afbetaald', label: 'Afbetaald' },
];

export default function Step4DateStatus({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="originDate" className="text-gray-900 dark:text-white">Wanneer ontstond deze schuld? *</Label>
        <Input
          id="originDate"
          type="date"
          value={formData.origin_date}
          onChange={(e) => updateFormData({ origin_date: e.target.value })}
          className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white [color-scheme:dark]"
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
    </div>
  );
}