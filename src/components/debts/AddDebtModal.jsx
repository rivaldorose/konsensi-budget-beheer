
import React, { useState, useEffect } from "react";
// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Assuming these utilities exist as per outline
// For internationalization:
import { useTranslations } from "next-intl"; 
// For toast notifications:
import { useToast } from "@/components/ui/use-toast";
// For currency formatting and debt calculation:
import { formatCurrency } from '@/components/utils/formatters';
import { calculateTotalAmount } from '@/components/utils/debtCalculators';


export default function AddDebtModal({ isOpen, onClose, onDebtAdded, existingDebt }) {
  // Initialize translation function. Assuming 'debts' namespace.
  const t = useTranslations("Debts"); 
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    creditor_name: '',
    principal_amount: '',
    origin_date: new Date().toISOString().split('T')[0], // Default to today's date
    collection_costs: '0',
    interest_amount: '0',
    interest_rate: '0', 
    status: 'niet_actief',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to pre-fill form for editing or reset for adding
  useEffect(() => {
    if (existingDebt) {
      setFormData({
        creditor_name: existingDebt.creditor_name || '',
        principal_amount: String(existingDebt.principal_amount || ''),
        origin_date: existingDebt.origin_date ? new Date(existingDebt.origin_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        collection_costs: String(existingDebt.collection_costs || '0'),
        interest_amount: String(existingDebt.interest_amount || '0'),
        interest_rate: String(existingDebt.interest_rate || '0'),
        status: existingDebt.status || 'niet_actief',
        notes: existingDebt.notes || ''
      });
    } else {
      // Reset form when modal opens for adding a new debt
      setFormData({
        creditor_name: '',
        principal_amount: '',
        origin_date: new Date().toISOString().split('T')[0],
        collection_costs: '0',
        interest_amount: '0',
        interest_rate: '0',
        status: 'niet_actief',
        notes: ''
      });
    }
  }, [isOpen, existingDebt]); // Re-run when modal opens/closes or existingDebt changes

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrincipalBlur = (e) => {
    // Ensure principal_amount is formatted as a valid number with two decimal places
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
      setFormData(prev => ({ ...prev, principal_amount: '0.00' }));
    } else {
      setFormData(prev => ({ ...prev, principal_amount: value.toFixed(2) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Calculate total amount using the provided utility function
    const totalAmount = calculateTotalAmount(formData);

    const submissionData = {
      ...formData,
      principal_amount: parseFloat(formData.principal_amount) || 0,
      collection_costs: parseFloat(formData.collection_costs) || 0,
      interest_amount: parseFloat(formData.interest_amount) || 0,
      interest_rate: parseFloat(formData.interest_rate) || 0, 
      amount: totalAmount, // This will be the total calculated amount
    };

    // If existingDebt is provided, include its ID for update operations
    if (existingDebt && existingDebt.id) {
      submissionData.id = existingDebt.id;
    }

    try {
      await onDebtAdded(submissionData);
      toast({
        title: t(existingDebt ? 'toast.editSuccessTitle' : 'toast.addSuccessTitle'),
        description: t(existingDebt ? 'toast.editSuccessDescription' : 'toast.addSuccessDescription'),
        variant: "success", 
      });
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Failed to save debt:", error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.errorMessage', { message: error.message || t('toast.genericError') }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total debt for display in the summary section
  const totalAmount = calculateTotalAmount(formData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingDebt ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {t('addDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="creditor_name">{t('creditorName')}</Label>
            <Input id="creditor_name" name="creditor_name" value={formData.creditor_name} onChange={handleInputChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal_amount">{t('principalAmount')}</Label>
              <Input id="principal_amount" name="principal_amount" type="number" step="0.01" value={formData.principal_amount} onChange={handleInputChange} onBlur={handlePrincipalBlur} placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin_date">{t('originDate')}</Label>
              <Input id="origin_date" name="origin_date" type="date" value={formData.origin_date} onChange={handleInputChange} required />
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>{t('optionalCosts')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="collection_costs">{t('collectionCosts')}</Label>
                    <Input id="collection_costs" name="collection_costs" type="number" step="0.01" value={formData.collection_costs} onChange={handleInputChange} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interest_amount">{t('interestAmount')}</Label>
                    <Input id="interest_amount" name="interest_amount" type="number" step="0.01" value={formData.interest_amount} onChange={handleInputChange} placeholder="0.00" />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="interest_rate">{t('interestRateLabel')}</Label>
                    <Input id="interest_rate" name="interest_rate" type="number" step="0.01" value={formData.interest_rate} onChange={handleInputChange} placeholder="e.g. 14" />
                    <p className="text-xs text-muted-foreground">{t('interestRateDescription')}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="p-4 bg-gray-100 rounded-md text-center">
            <p className="text-sm text-gray-600">{t('totalDebtAmount')}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('status')}</Label>
            <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="niet_actief">{t('statusOptions.notActive')}</SelectItem>
                <SelectItem value="wachtend">{t('statusOptions.waiting')}</SelectItem>
                <SelectItem value="betalingsregeling">{t('statusOptions.paymentPlan')}</SelectItem>
                <SelectItem value="afbetaald">{t('statusOptions.paidOff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder={t('notesPlaceholder')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : (existingDebt ? t('common.saveChanges') : t('addDebtButton'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
