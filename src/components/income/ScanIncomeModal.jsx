
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast"; // Corrected import path based on the outline
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ScanIncomeModal({ isOpen, onClose, onConfirm }) {
  const [step, setStep] = useState('upload'); // upload, processing, review, success
  const [extractedData, setExtractedData] = useState(null);
  const [isRecurring, setIsRecurring] = useState('no'); // 'yes' or 'no'
  const [scanType, setScanType] = useState('extra'); // 'vast' or 'extra'
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Alleen foto\'s (JPG, PNG) en PDF\'s zijn toegestaan');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Bestand is te groot (max 10MB)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const { file_url } = await UploadFile({ file });
      
      // CORRECTIE: Schema versimpeld. AI hoeft niet meer te raden wat het type is.
      const schema = {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Een korte beschrijving, bv. 'Loonstrook [Maand]' of 'Factuur [Nummer] voor [Klant]'. Probeer de maand of het factuurnummer te vinden."
          },
          amount: {
            type: "number",
            description: "Het NETTO te ontvangen bedrag. Zoek naar 'Nettoloon', 'Totaal te ontvangen', of het eindbedrag op een factuur."
          },
          date: {
            type: "string",
            format: "date",
            description: "De datum van het document of de betaaldatum (formaat: YYYY-MM-DD)."
          }
        },
        required: ["description", "amount", "date"]
      };

      const result = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: schema
      });

      if (result.status === 'success' && result.output) {
        setExtractedData(result.output);
        setStep('review');
      } else {
        setError(result.details || 'Kon geen gegevens uit het document halen. Probeer een duidelijkere foto.');
        setStep('upload');
      }
    } catch (err) {
      console.error("Error scanning income document:", err);
      setError('Er ging iets mis bij het scannen. Probeer het opnieuw.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmClick = () => {
    if (extractedData) {
      const incomeData = {
        ...extractedData,
        amount: parseFloat(extractedData.amount) || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        isRecurring: isRecurring === 'yes', // Pass isRecurring state
        scanType: scanType, // Pass scanType state
      };

      onConfirm(incomeData);
      // De parent component (IncomePage) sluit de modal
    }
  };

  const handleClose = () => {
    setStep('upload');
    setExtractedData(null);
    setError(null);
    setIsRecurring('no'); // Reset isRecurring
    setScanType('extra'); // Reset scanType
    setIsProcessing(false);
    onClose();
  };
  
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' && typeof amount !== 'string') return 'N/A';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'N/A';
    return `€${numAmount.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#4CAF50]" />
            Scan Factuur of Loonstrook
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 pt-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Hoe werkt het?</p>
                    <ul className="space-y-1 text-xs">
                      <li>📄 Maak een foto van je loonstrook of factuur</li>
                      <li>🤖 AI leest de belangrijkste gegevens uit</li>
                      <li>✅ Jij controleert en bevestigt de gegevens</li>
                      <li>💰 Het inkomen wordt toegevoegd aan je overzicht</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" disabled={isProcessing}/>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#4CAF50] transition-colors text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Foto maken</p>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" disabled={isProcessing}/>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#4CAF50] transition-colors text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Uploaden</p>
                  </div>
                </label>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center">
              <Loader2 className="w-16 h-16 text-[#4CAF50] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document wordt geanalyseerd...</h3>
              <p className="text-sm text-gray-600">AI leest de gegevens uit</p>
            </motion.div>
          )}

          {step === 'review' && extractedData && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">Controleer de uitgelezen gegevens:</p>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Omschrijving</p>
                  <p className="text-sm font-semibold text-gray-900">{extractedData.description || 'Niet gevonden'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Datum</p>
                        <p className="text-sm font-semibold text-gray-900">{extractedData.date || 'Niet gevonden'}</p>
                    </div>
                     <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <Select value={scanType} onValueChange={setScanType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extra">Extra Inkomen</SelectItem>
                            <SelectItem value="vast">Vast Inkomen</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-xs text-green-700 font-medium mb-1">NETTO BEDRAG</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(extractedData.amount)}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <Label className="text-sm font-medium">Is dit een terugkerend inkomen?</Label>
                    <p className="text-xs text-gray-500 mb-3">Kies 'Ja' voor salaris, 'Nee' voor een eenmalige factuur.</p>
                    <RadioGroup value={isRecurring} onValueChange={setIsRecurring} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="is-recurring-no" />
                            <Label htmlFor="is-recurring-no">Nee (eenmalig)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="is-recurring-yes" />
                            <Label htmlFor="is-recurring-yes">Ja (terugkerend)</Label>
                        </div>
                    </RadioGroup>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">Opnieuw</Button>
                <Button onClick={handleConfirmClick} className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]">Volgende</Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Inkomen toegevoegd! 🎉</h3>
              <p className="text-sm text-gray-600">Je overzicht is bijgewerkt.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
