import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/components/utils/LanguageContext';

export default function DisputeForm({ onGenerateLetter, onBack }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState({
    paymentDate: "",
    paymentReference: "",
    cancelDate: "",
    correctAmount: "",
    otherReason: "",
  });

  const handleDetailChange = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    if (!reason) return false;
    if (reason === 'already_paid' && (!details.paymentDate || !details.paymentReference)) return false;
    if (reason === 'cancelled' && !details.cancelDate) return false;
    if (reason === 'amount_wrong' && !details.correctAmount) return false;
    if (reason === 'other' && !details.otherReason) return false;
    return true;
  };

  const handleGenerate = () => {
    if (!isFormValid()) return;
    
    let generatedDetails = {};
    if (reason === 'already_paid') {
        generatedDetails.paymentDate = details.paymentDate;
        generatedDetails.paymentReference = details.paymentReference;
    }
    if (reason === 'cancelled') generatedDetails.cancelDate = details.cancelDate;
    if (reason === 'amount_wrong') generatedDetails.correctAmount = details.correctAmount;
    if (reason === 'other') generatedDetails.otherReason = details.otherReason;

    onGenerateLetter(reason, generatedDetails);
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">{'< Terug naar keuze'}</Button>
      <h3 className="text-lg font-semibold">{t('dispute.why')}</h3>
      
      <RadioGroup value={reason} onValueChange={setReason}>
        <div className="flex items-start space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="never_received" id="r1" />
          <div className="flex-1">
            <p className="font-medium">{t('dispute.neverReceived')}</p>
          </div>
        </div>

        <div className="flex items-start space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="already_paid" id="r2" />
          <div className="flex-1">
            <p className="font-medium">{t('dispute.alreadyPaid')}</p>
            {reason === 'already_paid' && (
              <div className="mt-2 space-y-2 pl-8">
                <Input type="date" value={details.paymentDate} onChange={(e) => handleDetailChange('paymentDate', e.target.value)} />
                <Input placeholder={t('dispute.paymentReference')} value={details.paymentReference} onChange={(e) => handleDetailChange('paymentReference', e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="cancelled" id="r3" />
          <div className="flex-1">
            <p className="font-medium">{t('dispute.cancelled')}</p>
            {reason === 'cancelled' && (
              <Input type="date" className="mt-2" value={details.cancelDate} onChange={(e) => handleDetailChange('cancelDate', e.target.value)} />
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="amount_wrong" id="r4" />
          <div className="flex-1">
            <p className="font-medium">{t('dispute.amountWrong')}</p>
            {reason === 'amount_wrong' && (
              <Input type="number" className="mt-2" placeholder={t('dispute.correctAmountPlaceholder')} value={details.correctAmount} onChange={(e) => handleDetailChange('correctAmount', e.target.value)} />
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
          <RadioGroupItem value="other" id="r5" />
          <div className="flex-1">
            <p className="font-medium">{t('dispute.otherReasonTitle')}</p>
            {reason === 'other' && (
              <Textarea className="mt-2" placeholder={t('dispute.otherReasonPlaceholder')} value={details.otherReason} onChange={(e) => handleDetailChange('otherReason', e.target.value)} />
            )}
          </div>
        </div>
      </RadioGroup>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">{t('dispute.dontForget')}</h4>
              <p className="text-sm text-amber-800 mt-1 mb-3">{t('dispute.addAttachments')}</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800">
                <li><span className="font-semibold">{t('dispute.ifPaid')}</span> {t('dispute.proofOfPayment')}</li>
                <li><span className="font-semibold">{t('dispute.ifCancelled')}</span> {t('dispute.cancellationConfirmation')}</li>
                <li><span className="font-semibold">{t('dispute.ifContract')}</span> {t('dispute.contractOrCorrespondence')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onBack}>{t('common.previous')}</Button>
        <Button onClick={handleGenerate} disabled={!isFormValid()}>{t('dispute.generateLetter')}</Button>
      </div>
    </div>
  );
}