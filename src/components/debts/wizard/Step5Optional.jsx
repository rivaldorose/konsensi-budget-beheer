import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Step5Optional({ formData, updateFormData }) {
  const inputClass = "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280]";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bijna klaar! Nog wat optionele details.</h2>
      <p className="text-gray-500 dark:text-[#a1a1a1]">Deze gegevens maken je administratie compleet, maar zijn niet verplicht.</p>

      <div className="space-y-2">
        <Label htmlFor="case_number" className="text-gray-900 dark:text-white">Dossiernummer</Label>
        <Input
          id="case_number"
          placeholder="bijv. ABC-2024-001"
          value={formData.case_number || ''}
          onChange={(e) => updateFormData({ case_number: e.target.value })}
          className={inputClass}
        />
      </div>

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="payment_details" className="border-gray-200 dark:border-[#2a2a2a]">
          <AccordionTrigger className="text-gray-900 dark:text-white hover:no-underline">Betaalgegevens</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="payment_iban" className="text-gray-900 dark:text-white">IBAN Rekeningnummer</Label>
              <Input
                id="payment_iban"
                placeholder="NL12ABCD0123456789"
                value={formData.payment_iban || ''}
                onChange={(e) => updateFormData({ payment_iban: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_account_name" className="text-gray-900 dark:text-white">Ten name van</Label>
              <Input
                id="payment_account_name"
                placeholder="Naam van de ontvanger"
                value={formData.payment_account_name || ''}
                onChange={(e) => updateFormData({ payment_account_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_reference" className="text-gray-900 dark:text-white">Betalingskenmerk</Label>
              <Input
                id="payment_reference"
                placeholder="Vast kenmerk voor betalingen"
                value={formData.payment_reference || ''}
                onChange={(e) => updateFormData({ payment_reference: e.target.value })}
                className={inputClass}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="contact" className="border-gray-200 dark:border-[#2a2a2a]">
          <AccordionTrigger className="text-gray-900 dark:text-white hover:no-underline">Contactpersoon</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="contact_person_name" className="text-gray-900 dark:text-white">Naam contactpersoon</Label>
              <Input
                id="contact_person_name"
                placeholder="bijv. Jan Jansen"
                value={formData.contact_person_name || ''}
                onChange={(e) => updateFormData({ contact_person_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person_details" className="text-gray-900 dark:text-white">Contactgegevens (tel/mail)</Label>
              <Input
                id="contact_person_details"
                placeholder="0612345678 of mail@provider.com"
                value={formData.contact_person_details || ''}
                onChange={(e) => updateFormData({ contact_person_details: e.target.value })}
                className={inputClass}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="notes" className="border-gray-200 dark:border-[#2a2a2a]">
          <AccordionTrigger className="text-gray-900 dark:text-white hover:no-underline">Notities</AccordionTrigger>
          <AccordionContent className="pt-2">
            <Textarea
              placeholder="Extra informatie over deze schuld..."
              value={formData.notes || ''}
              onChange={(e) => updateFormData({ notes: e.target.value })}
              className={inputClass}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}