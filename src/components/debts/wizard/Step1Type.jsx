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
      <h3 className="text-lg font-semibold">Wat voor schuld is het?</h3>
      <RadioGroup value={isPersonalLoan} onValueChange={handleChange}>
        <Card className={`p-4 cursor-pointer hover:border-primary ${isPersonalLoan === 'false' ? 'border-primary bg-primary/5' : ''}`}>
          <Label htmlFor="type-business" className="flex items-center gap-4 cursor-pointer">
            <RadioGroupItem value="false" id="type-business" />
            <Building className="w-6 h-6 text-gray-700" />
            <div>
              <p className="font-medium">Schuld bij een bedrijf</p>
              <p className="text-sm text-muted-foreground">Bijv. webshop, energieleverancier, incassobureau.</p>
            </div>
          </Label>
        </Card>
        <Card className={`p-4 cursor-pointer hover:border-primary ${isPersonalLoan === 'true' ? 'border-primary bg-primary/5' : ''}`}>
          <Label htmlFor="type-personal" className="flex items-center gap-4 cursor-pointer">
            <RadioGroupItem value="true" id="type-personal" />
            <User className="w-6 h-6 text-gray-700" />
            <div>
              <p className="font-medium">Persoonlijke lening</p>
              <p className="text-sm text-muted-foreground">Geld geleend van familie, vrienden, etc.</p>
            </div>
          </Label>
        </Card>
      </RadioGroup>
    </div>
  );
}