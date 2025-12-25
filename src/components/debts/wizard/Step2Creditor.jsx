import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step2Creditor({ formData, updateFormData }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="creditorName" className="text-base font-semibold">
          {formData.is_personal_loan ? 'Naam van de persoon' : 'Naam schuldeiser'}
        </Label>
        <Input
          id="creditorName"
          placeholder={formData.is_personal_loan ? "Bijv. Oma, Beste vriend, ..." : "Bijv. Eneco, Vodafone, ..."}
          value={formData.creditor_name}
          onChange={(e) => updateFormData({ creditor_name: e.target.value })}
          className="mt-2"
        />
      </div>

      {formData.is_personal_loan ? (
        <>
          <div>
            <Label htmlFor="loanRelationship" className="text-base font-semibold">
              Relatie
            </Label>
            <Select
              value={formData.loan_relationship}
              onValueChange={(value) => updateFormData({ loan_relationship: value, loan_relationship_description: value === 'anders' ? formData.loan_relationship_description : '' })}
            >
              <SelectTrigger id="loanRelationship" className="mt-2">
                <SelectValue placeholder="Selecteer relatie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="familie">Familie</SelectItem>
                <SelectItem value="vriend">Vriend</SelectItem>
                <SelectItem value="anders">Anders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.loan_relationship === 'anders' && (
            <div>
              <Label htmlFor="relationshipDescription" className="text-base font-semibold">
                Omschrijf de relatie
              </Label>
              <Input
                id="relationshipDescription"
                placeholder="Bijv. Buurman, Collega, Ex-partner, ..."
                value={formData.loan_relationship_description || ''}
                onChange={(e) => updateFormData({ loan_relationship_description: e.target.value })}
                className="mt-2"
              />
            </div>
          )}
        </>
      ) : (
        <div>
          <Label htmlFor="creditorType" className="text-base font-semibold">
            Type schuldeiser
          </Label>
          <Select
            value={formData.creditor_type}
            onValueChange={(value) => updateFormData({ creditor_type: value })}
          >
            <SelectTrigger id="creditorType" className="mt-2">
              <SelectValue placeholder="Selecteer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="energie">⚡ Energie</SelectItem>
              <SelectItem value="telecom">📞 Telecom</SelectItem>
              <SelectItem value="zorgverzekeraar">🏥 Zorgverzekeraar</SelectItem>
              <SelectItem value="bank">🏦 Bank</SelectItem>
              <SelectItem value="webshop">🛒 Webshop/Winkel</SelectItem>
              <SelectItem value="overheid">🏛️ Overheid</SelectItem>
              <SelectItem value="incassobureau">📋 Incassobureau</SelectItem>
              <SelectItem value="deurwaarder">⚖️ Deurwaarder</SelectItem>
              <SelectItem value="anders">❓ Anders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}