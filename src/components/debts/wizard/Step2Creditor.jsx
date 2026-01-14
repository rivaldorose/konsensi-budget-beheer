import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step2Creditor({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="creditorName" className="text-base font-semibold text-gray-900 dark:text-white">
          {formData.is_personal_loan ? 'Naam van de persoon' : 'Naam schuldeiser'}
        </Label>
        <Input
          id="creditorName"
          placeholder={formData.is_personal_loan ? "Bijv. Oma, Beste vriend, ..." : "Bijv. Eneco, Vodafone, ..."}
          value={formData.creditor_name}
          onChange={(e) => updateFormData({ creditor_name: e.target.value })}
          className="mt-2 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10b981] dark:focus:border-[#10b981]"
        />
      </div>

      {formData.is_personal_loan ? (
        <>
          <div>
            <Label htmlFor="loanRelationship" className="text-base font-semibold text-gray-900 dark:text-white">
              Relatie
            </Label>
            <Select
              value={formData.loan_relationship}
              onValueChange={(value) => updateFormData({ loan_relationship: value, loan_relationship_description: value === 'anders' ? formData.loan_relationship_description : '' })}
            >
              <SelectTrigger id="loanRelationship" className="mt-2 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                <SelectValue placeholder="Selecteer relatie" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                <SelectItem value="familie" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">Familie</SelectItem>
                <SelectItem value="vriend" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">Vriend</SelectItem>
                <SelectItem value="anders" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">Anders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.loan_relationship === 'anders' && (
            <div>
              <Label htmlFor="relationshipDescription" className="text-base font-semibold text-gray-900 dark:text-white">
                Omschrijf de relatie
              </Label>
              <Input
                id="relationshipDescription"
                placeholder="Bijv. Buurman, Collega, Ex-partner, ..."
                value={formData.loan_relationship_description || ''}
                onChange={(e) => updateFormData({ loan_relationship_description: e.target.value })}
                className="mt-2 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10b981] dark:focus:border-[#10b981]"
              />
            </div>
          )}
        </>
      ) : (
        <div>
          <Label htmlFor="creditorType" className="text-base font-semibold text-gray-900 dark:text-white">
            Type schuldeiser
          </Label>
          <Select
            value={formData.creditor_type}
            onValueChange={(value) => updateFormData({ creditor_type: value })}
          >
            <SelectTrigger id="creditorType" className="mt-2 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
              <SelectValue placeholder="Selecteer type" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
              <SelectItem value="energie" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">⚡ Energie</SelectItem>
              <SelectItem value="telecom" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">📞 Telecom</SelectItem>
              <SelectItem value="zorgverzekeraar" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">🏥 Zorgverzekeraar</SelectItem>
              <SelectItem value="bank" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">🏦 Bank</SelectItem>
              <SelectItem value="webshop" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">🛒 Webshop/Winkel</SelectItem>
              <SelectItem value="overheid" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">🏛️ Overheid</SelectItem>
              <SelectItem value="incassobureau" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">📋 Incassobureau</SelectItem>
              <SelectItem value="deurwaarder" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">⚖️ Deurwaarder</SelectItem>
              <SelectItem value="anders" className="text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-[#2a2a2a]">❓ Anders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}