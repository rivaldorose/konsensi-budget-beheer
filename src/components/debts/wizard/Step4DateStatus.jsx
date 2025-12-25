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
        <Label htmlFor="originDate">Wanneer ontstond deze schuld? *</Label>
        <Input
          id="originDate"
          type="date"
          value={formData.origin_date}
          onChange={(e) => updateFormData({ origin_date: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => updateFormData({ status: value })}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}