import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Debt, User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

import Step1Type from './Step1Type';
import Step2Creditor from './Step2Creditor';
import Step3Amount from './Step3Amount';
import Step4DateStatus from './Step4DateStatus';
import Step5Optional from './Step5Optional';
import Step6Summary from './Step6Summary';

const TOTAL_STEPS = 6;

export default function DebtWizard({ isOpen, onClose, onSave }) {
  const initialFormData = {
    is_personal_loan: false,
    creditor_name: '',
    creditor_type: '',
    loan_relationship: 'familie',
    loan_relationship_description: '', // Nieuw veld toegevoegd
    principal_amount: '',
    collection_costs: '',
    interest_amount: '',
    amount_paid: '',
    has_repayment_plan: 'no',
    repayment_amount: '',
    repayment_frequency: 'maand',
    origin_date: new Date().toISOString().split('T')[0],
    status: 'niet_actief',
    case_number: '',
    payment_iban: '',
    payment_account_name: '',
    payment_reference: '',
    notes: ''
  };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleNext = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  const goToStep = (stepNumber) => setStep(stepNumber);

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  const validateStep = useCallback(() => {
    switch (step) {
      case 1:
        return formData.is_personal_loan !== null;
      case 2:
        return !!formData.creditor_name && (formData.is_personal_loan ? !!formData.loan_relationship : !!formData.creditor_type);
      case 3:
        return parseFloat(formData.principal_amount) > 0;
      case 4:
        return !!formData.origin_date && !!formData.status;
      case 5:
        return true; // Alles optioneel
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, formData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get current user for user_id
      const currentUser = await User.me();
      if (!currentUser?.id) {
        throw new Error('Niet ingelogd');
      }

      const dataToSave = {
        user_id: currentUser.id,
        name: formData.creditor_name, // Required field in database
        is_personal_loan: formData.is_personal_loan,
        creditor_name: formData.creditor_name,
        creditor_type: formData.is_personal_loan ? null : formData.creditor_type,
        loan_relationship: formData.is_personal_loan ? formData.loan_relationship : null,
        loan_relationship_description: formData.is_personal_loan && formData.loan_relationship === 'anders' ? formData.loan_relationship_description : null, // Nieuw veld verwerkt
        principal_amount: parseFloat(formData.principal_amount) || 0,
        collection_costs: parseFloat(formData.collection_costs) || 0,
        interest_amount: parseFloat(formData.interest_amount) || 0,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        repayment_amount: formData.has_repayment_plan === 'yes' ? (parseFloat(formData.repayment_amount) || 0) : null,
        repayment_frequency: formData.has_repayment_plan === 'yes' ? formData.repayment_frequency : null,
        origin_date: formData.origin_date,
        status: formData.status,
        case_number: formData.case_number,
        payment_iban: formData.payment_iban,
        payment_account_name: formData.payment_account_name,
        payment_reference: formData.payment_reference,
        notes: formData.notes
      };

      dataToSave.amount = dataToSave.principal_amount + dataToSave.collection_costs + dataToSave.interest_amount;
      
      // Voor een betalingsregeling status, kopieer de terugbetalingsinfo
      if (dataToSave.status === 'betalingsregeling' && dataToSave.repayment_amount) {
          dataToSave.monthly_payment = dataToSave.repayment_amount;
          dataToSave.payment_plan_date = new Date().toISOString().split('T')[0];
      }

      await Debt.create(dataToSave);
      
      toast({
        title: "Succes!",
        description: "De schuld is succesvol toegevoegd.",
      });
      onSave(); // Refresh data on the main page
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error saving debt:", error);
      toast({
        title: "Fout",
        description: "Kon de schuld niet opslaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setStep(1);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Type formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Creditor formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Amount formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4DateStatus formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5Optional formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <Step6Summary formData={formData} goToStep={goToStep} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] flex flex-col bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#2a2a2a]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-gray-900 dark:text-white">Nieuwe Schuld Toevoegen</DialogTitle>
          <div className="text-sm text-gray-500 dark:text-[#a1a1a1] pt-2">
            <p>Stap {step} van {TOTAL_STEPS}</p>
            <Progress value={(step / TOTAL_STEPS) * 100} className="w-full mt-1 h-2 bg-gray-200 dark:bg-[#2a2a2a] [&>div]:bg-[#10b981]" />
          </div>
        </DialogHeader>

        <div className="py-4 overflow-y-auto flex-1 text-gray-900 dark:text-white">{renderStep()}</div>

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          {step > 1 && (
             <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto text-gray-600 dark:text-[#10b981] hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
              Vorige
            </Button>
          )}
          {step < TOTAL_STEPS && (
            <Button onClick={handleNext} disabled={!validateStep()} className="w-full sm:w-auto ml-auto bg-[#10b981] hover:bg-[#059669] text-black dark:text-black">
              Volgende
            </Button>
          )}
          {step === TOTAL_STEPS && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-black dark:text-black ml-auto"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}