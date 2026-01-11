import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Building, User } from 'lucide-react';

export default function Step1Type({ formData, updateFormData }) {
  const isPersonalLoan = formData.is_personal_loan.toString();
  
  const handleChange = (value) => {
    updateFormData({ is_personal_loan: value === 'true' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wat voor schuld is het?</h3>
      <RadioGroup value={isPersonalLoan} onValueChange={handleChange}>
        <Card className={`p-4 cursor-pointer border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-[#10b981] dark:hover:border-[#10b981] ${isPersonalLoan === 'false' ? 'border-[#10b981] bg-[#10b981]/5 dark:bg-[#10b981]/10' : ''}`}>
          <Label htmlFor="type-business" className="flex items-center gap-4 cursor-pointer">
            <RadioGroupItem value="false" id="type-business" className="border-gray-300 dark:border-[#3a3a3a] text-[#10b981]" />
            <Building className="w-6 h-6 text-gray-700 dark:text-[#a1a1a1]" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Schuld bij een bedrijf</p>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Bijv. webshop, energieleverancier, incassobureau.</p>
            </div>
          </Label>
        </Card>
        <Card className={`p-4 cursor-pointer border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-[#10b981] dark:hover:border-[#10b981] ${isPersonalLoan === 'true' ? 'border-[#10b981] bg-[#10b981]/5 dark:bg-[#10b981]/10' : ''}`}>
          <Label htmlFor="type-personal" className="flex items-center gap-4 cursor-pointer">
            <RadioGroupItem value="true" id="type-personal" className="border-gray-300 dark:border-[#3a3a3a] text-[#10b981]" />
            <User className="w-6 h-6 text-gray-700 dark:text-[#a1a1a1]" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Persoonlijke lening</p>
              <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Geld geleend van familie, vrienden, etc.</p>
            </div>
          </Label>
        </Card>
      </RadioGroup>
    </div>
  );
}