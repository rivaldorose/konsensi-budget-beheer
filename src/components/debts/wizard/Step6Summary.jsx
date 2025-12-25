import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const SummaryRow = ({ label, value, onEdit, step }) => (
  <div className="flex justify-between items-start py-2">
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || 'N.v.t.'}</p>
    </div>
    {onEdit && (
      <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
        <Edit className="w-4 h-4 mr-2" />
        Bewerk
      </Button>
    )}
  </div>
);

export default function Step6Summary({ formData, goToStep }) {
  const totalAmount = (parseFloat(formData.principal_amount) || 0) + (parseFloat(formData.collection_costs) || 0) + (parseFloat(formData.interest_amount) || 0);

  const creditorTypeLabels = {
    energie: 'Energie', telecom: 'Telecom', zorgverzekeraar: 'Zorgverzekeraar',
    bank: 'Bank', webshop: 'Webshop/Winkel', overheid: 'Overheid',
    incassobureau: 'Incassobureau', deurwaarder: 'Deurwaarder', anders: 'Anders'
  };

  const statusLabels = {
    niet_actief: 'Niet Actief', wachtend: 'Wachtend',
    betalingsregeling: 'Betalingsregeling', afbetaald: 'Afbetaald'
  };

  return (
    <div className="space-y-2">
       <h3 className="text-lg font-semibold pb-2">✅ Controleer je gegevens</h3>
      
      <div className="border rounded-lg p-4 space-y-1 divide-y">
        <SummaryRow 
            label={formData.is_personal_loan ? "Geleend van" : "Schuldeiser"} 
            value={formData.creditor_name} 
            onEdit={goToStep}
            step={2}
        />
        <SummaryRow 
            label={formData.is_personal_loan ? "Relatie" : "Type"} 
            value={formData.is_personal_loan ? formData.loan_relationship : creditorTypeLabels[formData.creditor_type]} 
            onEdit={goToStep}
            step={2}
        />
         <SummaryRow 
            label="Totaalbedrag" 
            value={`€${totalAmount.toFixed(2)}`}
            onEdit={goToStep}
            step={3}
        />
         <SummaryRow 
            label="Datum ontstaan" 
            value={formData.origin_date ? new Date(formData.origin_date).toLocaleDateString('nl-NL') : ''}
            onEdit={goToStep}
            step={4}
        />
        <SummaryRow 
            label="Status" 
            value={statusLabels[formData.status]}
            onEdit={goToStep}
            step={4}
        />
        <SummaryRow 
            label="Dossiernummer" 
            value={formData.case_number}
            onEdit={goToStep}
            step={5}
        />
         <SummaryRow 
            label="Contactpersoon" 
            value={formData.contact_person_name}
            onEdit={goToStep}
            step={5}
        />
        <SummaryRow 
            label="Notities" 
            value={formData.notes}
            onEdit={goToStep}
            step={5}
        />
      </div>
    </div>
  );
}