import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const SummaryRow = ({ label, value, onEdit, step }) => (
  <div className="flex justify-between items-start py-3 border-b border-gray-100 dark:border-[#2a2a2a] last:border-b-0">
    <div>
      <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || 'N.v.t.'}</p>
    </div>
    {onEdit && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(step)}
        className="text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
      >
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
    <div className="space-y-4">
       <h3 className="text-lg font-semibold text-gray-900 dark:text-white pb-2">✅ Controleer je gegevens</h3>

      <div className="border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-4 bg-white dark:bg-[#1a1a1a]">
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