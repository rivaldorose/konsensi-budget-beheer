
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
          <AccordionTrigger className="text-sm text-[#10b981] hover:no-underline py-2">Extra kosten toevoegen (incasso, rente)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="collectionCosts" className="text-gray-900 dark:text-white">Incassokosten</Label>
               <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
                    <Input
                        id="collectionCosts"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formData.collection_costs}
                        onChange={(e) => handleAmountChange('collection_costs', e.target.value)}
                        className="pl-7 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestAmount" className="text-gray-900 dark:text-white">Rente</Label>
              <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
                    <Input
                        id="interestAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formData.interest_amount}
                        onChange={(e) => handleAmountChange('interest_amount', e.target.value)}
                        className="pl-7 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  );

  const amountPaidInput = (
    <div className="space-y-2">
      <Label htmlFor="amountPaid" className="text-gray-900 dark:text-white">Al betaald (optioneel)</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
        <Input
          id="amountPaid"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={formData.amount_paid}
          onChange={(e) => handleAmountChange('amount_paid', e.target.value)}
          className="pl-7 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  if (formData.is_personal_loan) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="principalAmount" className="text-gray-900 dark:text-white">Hoeveel heb je geleend? *</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
                    <Input
                        id="principalAmount"
                        type="text"
                        inputMode="decimal"
                        placeholder="100,00"
                        value={formData.principal_amount}
                        onChange={(e) => handleAmountChange('principal_amount', e.target.value)}
                        className="pl-7 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {extraCostsAccordion}

            <Separator className="bg-gray-200 dark:bg-[#2a2a2a]" />

            <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
                <span className="font-semibold text-gray-900 dark:text-white">TOTAAL SCHULDBEDRAG</span>
                <span className="font-bold text-xl text-[#10b981]">€{total.toFixed(2)}</span>
            </div>

            {amountPaidInput}

            <div className="space-y-3">
              <Label className="text-gray-900 dark:text-white">Afspraak over terugbetaling?</Label>
               <RadioGroup
                 value={formData.has_repayment_plan}
                 onValueChange={(value) => updateFormData({ has_repayment_plan: value })}
               >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="repay-no" className="border-gray-300 dark:border-[#3a3a3a] text-[#10b981]" />
                  <Label htmlFor="repay-no" className="text-gray-900 dark:text-white">Nee, geen vaste afspraak</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="repay-yes" className="border-gray-300 dark:border-[#3a3a3a] text-[#10b981]" />
                  <Label htmlFor="repay-yes" className="text-gray-900 dark:text-white">Ja, we hebben een afspraak</Label>
                </div>
              </RadioGroup>
              {formData.has_repayment_plan === 'yes' && (
                <div className="flex items-center gap-2 pl-6 pt-2">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="50,00"
                            value={formData.repayment_amount}
                            onChange={(e) => handleAmountChange('repayment_amount', e.target.value)}
                            className="pl-7 w-32 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                        />
                    </div>
                    <p className="text-gray-900 dark:text-white">per</p>
                    <Select value={formData.repayment_frequency} onValueChange={(v) => updateFormData({ repayment_frequency: v })}>
                        <SelectTrigger className="w-[120px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                            <SelectItem value="maand" className="text-gray-900 dark:text-white">maand</SelectItem>
                            <SelectItem value="week" className="text-gray-900 dark:text-white">week</SelectItem>
                            <SelectItem value="tweewekelijks" className="text-gray-900 dark:text-white">2 weken</SelectItem>
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hoeveel ben je schuldig?</h3>
      <div className="space-y-2">
        <Label htmlFor="principalAmount" className="text-gray-900 dark:text-white">Hoofdsom *</Label>
         <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280]">€</span>
            <Input
                id="principalAmount"
                type="text"
                inputMode="decimal"
                placeholder="100,00"
                value={formData.principal_amount}
                onChange={(e) => handleAmountChange('principal_amount', e.target.value)}
                className="pl-7 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
            />
        </div>
      </div>

      {extraCostsAccordion}

      <Separator className="bg-gray-200 dark:bg-[#2a2a2a]" />

      <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
        <span className="font-semibold text-gray-900 dark:text-white">TOTAAL</span>
        <span className="font-bold text-xl text-[#10b981]">€{total.toFixed(2)}</span>
      </div>

      {amountPaidInput}
    </div>
  );
}
