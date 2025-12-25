
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Step3Amount({ formData, updateFormData }) {
  const handleAmountChange = (field, rawValue) => {
    // Accepteer zowel komma's als punten, maar zet intern om naar een punt.
    // Verwijder duizend-separators (punten of komma's die niet de laatste zijn) en valutasymbolen.
    const value = rawValue.toString();
    // Replace commas with dots for decimal conversion.
    // Remove any character that is not a digit or a dot.
    const sanitizedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');

    // Ensure there's only one decimal point.
    const parts = sanitizedValue.split('.');
    let finalValue = sanitizedValue;
    if (parts.length > 2) {
      // If more than one dot, take the first part as integer, and concatenate subsequent parts as decimal.
      // E.g., "1.2.3" becomes "1.23", "1,2,3" becomes "1.23"
      finalValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    updateFormData({ [field]: finalValue });
  };
  
  const principal = parseFloat(formData.principal_amount) || 0;
  const collection = parseFloat(formData.collection_costs) || 0;
  const interest = parseFloat(formData.interest_amount) || 0;
  const total = principal + collection + interest;
  
  const extraCostsAccordion = (
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="text-sm text-primary hover:no-underline py-2">Extra kosten toevoegen (incasso, rente)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="collectionCosts">Incassokosten</Label>
               <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                        id="collectionCosts"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formData.collection_costs}
                        onChange={(e) => handleAmountChange('collection_costs', e.target.value)}
                        className="pl-7"
                    />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestAmount">Rente</Label>
              <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                        id="interestAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formData.interest_amount}
                        onChange={(e) => handleAmountChange('interest_amount', e.target.value)}
                        className="pl-7"
                    />
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  );

  const amountPaidInput = (
    <div className="space-y-2">
      <Label htmlFor="amountPaid">Al betaald (optioneel)</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        <Input
          id="amountPaid"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={formData.amount_paid}
          onChange={(e) => handleAmountChange('amount_paid', e.target.value)}
          className="pl-7"
        />
      </div>
    </div>
  );

  if (formData.is_personal_loan) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="principalAmount">Hoeveel heb je geleend? *</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                        id="principalAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="100,00"
                        value={formData.principal_amount}
                        onChange={(e) => handleAmountChange('principal_amount', e.target.value)}
                        className="pl-7"
                    />
                </div>
            </div>
            
            {extraCostsAccordion}
            
            <Separator />
            
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="font-semibold">TOTAAL SCHULDBEDRAG</span>
                <span className="font-bold text-xl">€{total.toFixed(2)}</span>
            </div>

            {amountPaidInput}

            <div className="space-y-3">
              <Label>Afspraak over terugbetaling?</Label>
               <RadioGroup 
                 value={formData.has_repayment_plan} 
                 onValueChange={(value) => updateFormData({ has_repayment_plan: value })}
               >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="repay-no" />
                  <Label htmlFor="repay-no">Nee, geen vaste afspraak</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="repay-yes" />
                  <Label htmlFor="repay-yes">Ja, we hebben een afspraak</Label>
                </div>
              </RadioGroup>
              {formData.has_repayment_plan === 'yes' && (
                <div className="flex items-center gap-2 pl-6 pt-2">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="50,00"
                            value={formData.repayment_amount}
                            onChange={(e) => handleAmountChange('repayment_amount', e.target.value)}
                            className="pl-7 w-32"
                        />
                    </div>
                    <p>per</p>
                    <Select value={formData.repayment_frequency} onValueChange={(v) => updateFormData({ repayment_frequency: v })}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="maand">maand</SelectItem>
                            <SelectItem value="week">week</SelectItem>
                            <SelectItem value="tweewekelijks">2 weken</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              )}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Hoeveel ben je schuldig?</h3>
      <div className="space-y-2">
        <Label htmlFor="principalAmount">Hoofdsom *</Label>
         <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            <Input
                id="principalAmount"
                type="text"
                inputMode="decimal"
                placeholder="100,00"
                value={formData.principal_amount}
                onChange={(e) => handleAmountChange('principal_amount', e.target.value)}
                className="pl-7"
            />
        </div>
      </div>
      
      {extraCostsAccordion}
      
      <Separator />

      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
        <span className="font-semibold">TOTAAL</span>
        <span className="font-bold text-xl">€{total.toFixed(2)}</span>
      </div>

      {amountPaidInput}
    </div>
  );
}
