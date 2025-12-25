import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusLabels = {
  niet_actief: 'Niet Actief', wachtend: 'Wachtend',
  betalingsregeling: 'Betalingsregeling', afbetaald: 'Afbetaald'
};

export default function DebtEditForm({ debt, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (debt) {
      setFormData({
        creditor_name: debt.creditor_name || '',
        principal_amount: debt.principal_amount || '0',
        amount_paid: debt.amount_paid || '0',
        status: debt.status || 'niet_actief',
        notes: debt.notes || ''
      });
    }
  }, [debt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create a new object with only the fields from the form
    const updatedFields = {
        creditor_name: formData.creditor_name,
        principal_amount: parseFloat(formData.principal_amount) || 0,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        status: formData.status,
        notes: formData.notes
    };
    
    // We also need to recalculate the main 'amount' if principal_amount changes.
    // The original debt object has the other cost fields.
    const collection_costs = debt.collection_costs || 0;
    const interest_amount = debt.interest_amount || 0;
    updatedFields.amount = updatedFields.principal_amount + collection_costs + interest_amount;

    onSave(updatedFields);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!debt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schuld Bewerken</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label>Schuldeiser</Label>
            <Input value={formData.creditor_name || ''} onChange={(e) => handleChange('creditor_name', e.target.value)} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Hoofdsom</Label>
              <Input type="number" step="0.01" value={formData.principal_amount || ''} onChange={(e) => handleChange('principal_amount', e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Totaal Betaald</Label>
              <Input type="number" step="0.01" value={formData.amount_paid || ''} onChange={(e) => handleChange('amount_paid', e.target.value)} />
            </div>
          </div>
          
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notities</Label>
            <Textarea value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
              Bijwerken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}