
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { MonthlyCost } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Pot } from '@/api/entities';
import { Income } from '@/api/entities';
import { User } from '@/api/entities';
import { incomeService } from '@/components/services';
import { formatCurrency } from '@/components/utils/formatters';

// NIBUD percentages voor automatische budget suggesties
const NIBUD_PERCENTAGES = {
  'wonen': 35,
  'eten_drinken': 15,
  'vervoer': 10,
  'uitgaan': 8,
  'zorg': 6,
  'energie': 5,
  'telefoon_internet': 3,
  'kleding': 5,
  'sparen_buffer': 12,
  'overig': 1
};

const NIBUD_LABELS = {
  'wonen': 'Wonen',
  'eten_drinken': 'Eten & Drinken',
  'vervoer': 'Vervoer',
  'uitgaan': 'Uitgaan',
  'zorg': 'Zorg',
  'energie': 'Energie',
  'telefoon_internet': 'Telefoon/Internet',
  'kleding': 'Kleding',
  'sparen_buffer': 'Sparen/Buffer',
  'overig': 'Overig'
};

const iconOptions = ['💰', '🍔', '🚗', '🏠', '🎉', '👕', '❤️', '💡', '📱', '🧾', '🎁', '✈️', '💪', '🐷', '🎓', '🏛️', '💻', '🧴', '🛡️', '📺', '🍻', '🎨'];

// Mapping voor automatische icoon selectie op basis van categorie
const CATEGORY_ICONS = {
  'wonen': '🏠',
  'eten_drinken': '🍔',
  'vervoer': '🚗',
  'uitgaan': '🎉',
  'zorg': '❤️',
  'energie': '💡',
  'telefoon_internet': '📱',
  'kleding': '👕',
  'sparen_buffer': '🐷',
  'overig': '💰'
};

export default function ScanCostModal({ isOpen, onClose, onCostAdded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [existingPots, setExistingPots] = useState([]);
  const [userIncome, setUserIncome] = useState(0);
  const [selectedPotOption, setSelectedPotOption] = useState('');
  const [newPotBudget, setNewPotBudget] = useState('');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      try {
        const user = await User.me();
        
        // Haal inkomen op
        const allIncomes = await Income.filter({ created_by: user.email });
        const incomeData = incomeService.processIncomeData(allIncomes, new Date());
        setUserIncome(incomeData.total);
        
        // Haal bestaande uitgaven-potjes op
        const allPots = await Pot.filter({ created_by: user.email, pot_type: 'expense' });
        setExistingPots(allPots);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      toast({ title: 'Selecteer een bestand', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setExtracting(true);

    try {
      // Upload bestand
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      // Extractie schema
      const schema = {
        type: 'object',
        properties: {
          naam: { type: 'string' },
          bedrag: { type: 'number' },
          datum: { type: 'string' },
          categorie: { type: 'string' }
        }
      };

      // Data extractie
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: schema
      });

      if (extractResult.status === 'success' && extractResult.output) {
        setExtractedData(extractResult.output);
        toast({ title: 'Bon succesvol gescand!' });
      } else {
        throw new Error('Kon geen data extraheren');
      }
    } catch (error) {
      console.error('Extract error:', error);
      toast({ 
        title: 'Fout bij scannen', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handlePotSelectionChange = (value) => {
    setSelectedPotOption(value);
    
    // Check of het een nieuwe NIBUD categorie is (niet een bestaand potje)
    const isExistingPot = existingPots.some(pot => pot.name === value);
    
    if (!isExistingPot && value !== 'onverwachte_kosten') {
      // Het is een NIBUD categorie - bereken suggestie
      const categoryKey = Object.keys(NIBUD_LABELS).find(key => NIBUD_LABELS[key] === value);
      if (categoryKey && NIBUD_PERCENTAGES[categoryKey] && userIncome > 0) {
        const suggestedBudget = Math.round((userIncome * NIBUD_PERCENTAGES[categoryKey]) / 100);
        setNewPotBudget(suggestedBudget.toString());
        setShowBudgetInput(true);
      } else {
        setNewPotBudget('');
        setShowBudgetInput(true);
      }
    } else if (value === 'onverwachte_kosten') {
      // Onverwachte kosten - geen NIBUD suggestie
      setNewPotBudget('');
      setShowBudgetInput(true);
    } else {
      // Bestaand potje
      setShowBudgetInput(false);
      setNewPotBudget('');
    }
  };

  const convertToISODate = (dateString) => {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    // Check of het al ISO formaat is (yyyy-mm-dd)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Probeer dd-mm-yyyy formaat
    const ddmmyyyyMatch = dateString.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Probeer dd/mm/yyyy formaat
    const ddmmyyyySlashMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyySlashMatch) {
      const [, day, month, year] = ddmmyyyySlashMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Als niks werkt, gebruik vandaag
    console.warn('Could not parse date:', dateString, '- using today');
    return new Date().toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!extractedData || !selectedPotOption) {
      toast({ title: 'Selecteer een potje/categorie', variant: 'destructive' });
      return;
    }

    if (showBudgetInput && !newPotBudget) {
      toast({ title: 'Vul een maandbudget in voor het nieuwe potje', variant: 'destructive' });
      return;
    }

    try {
      const user = await User.me();
      let finalPotName = selectedPotOption;
      
      // Check of we een nieuw potje moeten aanmaken
      const existingPot = existingPots.find(pot => pot.name === selectedPotOption);
      
      if (!existingPot && showBudgetInput) {
        // Maak nieuw potje aan
        const categoryKey = Object.keys(NIBUD_LABELS).find(key => NIBUD_LABELS[key] === selectedPotOption);
        const icon = categoryKey ? CATEGORY_ICONS[categoryKey] : '💰';
        
        const newPotData = {
          name: selectedPotOption === 'onverwachte_kosten' ? 'Onverwachte Kosten' : selectedPotOption,
          icon: icon,
          pot_type: 'expense',
          category: categoryKey || null,
          monthly_budget: parseFloat(newPotBudget),
          is_essential: true,
          spending_frequency: 'flexible'
        };
        
        console.log('🆕 Creating new pot:', newPotData);
        const createdPot = await Pot.create(newPotData);
        console.log('✅ Pot created:', createdPot);
        
        finalPotName = createdPot.name;
        
        toast({ 
          title: `Potje "${finalPotName}" aangemaakt!`,
          description: `Met budget: ${formatCurrency(parseFloat(newPotBudget))}`
        });
      }

      // 🔥 FIX: Converteer datum naar ISO formaat
      const isoDate = convertToISODate(extractedData.datum);
      console.log('📅 Date conversion:', extractedData.datum, '->', isoDate);

      // Maak transaction aan met EXACTE pot naam en CORRECTE datum
      const transactionData = {
        type: 'expense',
        amount: parseFloat(extractedData.bedrag || 0),
        description: extractedData.naam || 'Gescande uitgave',
        category: finalPotName,
        date: isoDate // 🔥 Gebruik geconverteerde ISO datum
      };
      
      console.log('💳 Creating transaction:', transactionData);
      const createdTransaction = await Transaction.create(transactionData);
      console.log('✅ Transaction created:', createdTransaction);

      toast({ 
        title: 'Uitgave toegevoegd!',
        description: `${formatCurrency(extractedData.bedrag)} gekoppeld aan ${finalPotName}`
      });

      if (onCostAdded) onCostAdded();
      handleClose();
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({ 
        title: 'Fout bij opslaan', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setExtractedData(null);
    setSelectedPotOption('');
    setNewPotBudget('');
    setShowBudgetInput(false);
    onClose();
  };

  // Dropdown opties: bestaande potjes + NIBUD categorieën
  const potOptions = [
    ...existingPots.map(pot => ({ value: pot.name, label: `${pot.icon} ${pot.name} (bestaand)`, isExisting: true })),
    { value: 'separator', label: '--- Nieuwe potjes ---', disabled: true },
    ...Object.entries(NIBUD_LABELS).map(([key, label]) => {
      const exists = existingPots.some(pot => pot.name === label);
      return exists ? null : { value: label, label: `${CATEGORY_ICONS[key]} ${label} (nieuw)`, isExisting: false };
    }).filter(Boolean),
    { value: 'onverwachte_kosten', label: '💰 Onverwachte Kosten (nieuw)', isExisting: false }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📸 Bon Scannen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!extractedData ? (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">Upload een foto van je bon</p>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {file && !extracting && (
                <Button onClick={handleExtract} className="w-full">
                  Bon Scannen
                </Button>
              )}

              {extracting && (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Bon wordt gescand...</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Bon gescand!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Naam:</span> {extractedData.naam || '-'}</div>
                  <div><span className="font-medium">Bedrag:</span> {formatCurrency(extractedData.bedrag || 0)}</div>
                  <div><span className="font-medium">Datum:</span> {extractedData.datum || '-'}</div>
                  {extractedData.categorie && (
                    <div><span className="font-medium">Categorie:</span> {extractedData.categorie}</div>
                  )}
                </div>
              </div>

              <div>
                <Label>Koppel aan potje</Label>
                <Select value={selectedPotOption} onValueChange={handlePotSelectionChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kies een potje..." />
                  </SelectTrigger>
                  <SelectContent>
                    {potOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showBudgetInput && (
                <div>
                  <Label>Maandbudget voor nieuw potje</Label>
                  <Input
                    type="number"
                    value={newPotBudget}
                    onChange={(e) => setNewPotBudget(e.target.value)}
                    placeholder="100"
                    className="mt-1"
                  />
                  {newPotBudget && userIncome > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 NIBUD suggestie op basis van je inkomen
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Annuleren
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Opslaan
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
