import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";

export default function ScanDebtModal({ isOpen, onClose, onDebtScanned }) {
  const [step, setStep] = useState('upload'); // upload, scanned, processing, review, success
  const [uploadedPages, setUploadedPages] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Alleen foto\'s (JPG, PNG) en PDF\'s zijn toegestaan');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Bestand is te groot (max 10MB)');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Upload de file
      const { file_url } = await UploadFile({ file });
      setUploadedPages([...uploadedPages, file_url]);
      setStep('scanned');
    } catch (err) {
      console.error("Error uploading file:", err);
      setError('Er ging iets mis bij het uploaden. Probeer het opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPages = async () => {
    if (uploadedPages.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {

      // 2. Extract data met AI
      const schema = {
        type: "object",
        properties: {
          creditor_name: {
            type: "string",
            description: "Naam van het incassobureau of schuldeiser"
          },
          creditor_type: {
            type: "string",
            enum: ["energie", "telecom", "zorgverzekeraar", "bank", "retail", "overheid", "incasso", "deurwaarder", "anders"],
            description: "Type schuldeiser, probeer te herkennen uit de brief"
          },
          case_number: {
            type: "string",
            description: "Dossiernummer of referentienummer"
          },
          original_amount: {
            type: "number",
            description: "Oorspronkelijk schuldbedrag (hoofdsom)"
          },
          reminder_costs: {
            type: "number",
            description: "Aanmaningskosten (apart van incassokosten)"
          },
          collection_costs: {
            type: "number",
            description: "Incassokosten (apart van aanmaningskosten)"
          },
          interest_costs: {
            type: "number",
            description: "Rente en extra kosten"
          },
          total_amount: {
            type: "number",
            description: "Totaal te betalen bedrag"
          },
          debt_date: {
            type: "string",
            description: "Datum waarop schuld is ontstaan (format: YYYY-MM-DD)"
          },
          payment_deadline: {
            type: "string",
            description: "Uiterlijke betaaldatum zoals vermeld op de brief (format: YYYY-MM-DD)"
          },
          contact_person: {
            type: "string",
            description: "Naam contactpersoon indien vermeld"
          },
          contact_details: {
            type: "string",
            description: "Telefoonnummer of email van schuldeiser"
          }
        }
      };

      // Process alle pagina's - gebruik file_urls parameter bij meerdere pagina's
      const result = await ExtractDataFromUploadedFile({
        file_url: uploadedPages[0],
        file_urls: uploadedPages,
        json_schema: schema
      });

      if (result.status === 'success' && result.output) {
        setExtractedData(result.output);
        setStep('review');
      } else {
        setError(result.details || 'Kon geen gegevens uit de brief halen. Probeer een duidelijkere foto.');
        setStep('scanned');
      }
    } catch (err) {
      console.error("Error scanning debt:", err);
      setError('Er ging iets mis bij het scannen. Probeer het opnieuw.');
      setStep('scanned');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Get current user for user_id
      const currentUser = await User.me();
      if (!currentUser?.id) {
        throw new Error('Niet ingelogd');
      }

      const debtData = {
        user_id: currentUser.id,
        name: extractedData.creditor_name || '', // Required field in database
        creditor_name: extractedData.creditor_name || '',
        creditor_type: extractedData.creditor_type || 'incasso',
        case_number: extractedData.case_number || '',
        principal_amount: parseFloat(extractedData.original_amount) || 0,
        reminder_costs: parseFloat(extractedData.reminder_costs) || 0,
        collection_costs: parseFloat(extractedData.collection_costs) || 0,
        interest_amount: parseFloat(extractedData.interest_costs) || 0,
        amount: parseFloat(extractedData.total_amount) || 0,
        amount_paid: 0,
        origin_date: extractedData.debt_date || new Date().toISOString().split('T')[0],
        payment_deadline: extractedData.payment_deadline || null,
        status: 'niet_actief',
        contact_person_name: extractedData.contact_person || '',
        contact_person_details: extractedData.contact_details || '',
        notes: `Gescand uit brief op ${new Date().toLocaleDateString('nl-NL')}`
      };

      console.log('💾 Schuld opslaan:', debtData);
      await onDebtScanned(debtData);
      console.log('✅ Schuld opgeslagen!');
      
      setStep('success');
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('❌ Fout bij opslaan:', err);
      setError('Kon schuld niet opslaan. Probeer het opnieuw.');
      setIsProcessing(false);
    }
  };

  const handleRemovePage = (index) => {
    setUploadedPages(uploadedPages.filter((_, i) => i !== index));
    if (uploadedPages.length === 1) {
      setStep('upload');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setUploadedPages([]);
    setExtractedData(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '€0,00';
    return `€${parseFloat(amount).toFixed(2).replace('.', ',')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-4 max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#4CAF50]" />
            Scan Incassobrief
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6 py-4 pb-24 md:pb-4">

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Hoe werkt het?</p>
                    <ul className="space-y-1 text-xs">
                      <li>📸 Maak een duidelijke foto van je incassobrief</li>
                      <li>🤖 AI leest automatisch alle gegevens uit</li>
                      <li>✅ Jij controleert en bevestigt de gegevens</li>
                      <li>💾 Schuld wordt toegevoegd aan je overzicht</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#4CAF50] transition-colors text-center">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Foto maken</p>
                    <p className="text-xs text-gray-500 mt-1">Gebruik camera</p>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#4CAF50] transition-colors text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Uploaden</p>
                    <p className="text-xs text-gray-500 mt-1">Kies bestand</p>
                  </div>
                </label>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Tips voor beste resultaat:</strong><br/>
                  • Zorg voor goede verlichting<br/>
                  • Houd camera recht boven de brief<br/>
                  • Zorg dat alle tekst scherp en leesbaar is
                </p>
              </div>
            </motion.div>
          )}

          {step === 'scanned' && uploadedPages.length > 0 && (
            <motion.div
              key="scanned"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  {uploadedPages.length} pagina{uploadedPages.length > 1 ? "'s" : ''} gescand
                </p>
              </div>

              <div className="space-y-2">
                {uploadedPages.map((url, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Pagina {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePage(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Verwijder
                    </Button>
                  </div>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Meerdere pagina's?</strong> Scan alle pagina's van de brief voor de beste resultaten!
                </p>
              </div>

              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                    asChild
                  >
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Scan volgende pagina
                    </span>
                  </Button>
                </label>
                <Button
                  onClick={handleProcessPages}
                  disabled={isProcessing}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]"
                >
                  Doorgaan →
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <Loader2 className="w-16 h-16 text-[#4CAF50] animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Brief wordt gescand...
              </h3>
              <p className="text-sm text-gray-600">
                AI leest de gegevens uit {uploadedPages.length} pagina{uploadedPages.length > 1 ? "'s" : ''}
              </p>
            </motion.div>
          )}

          {step === 'review' && extractedData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Gegevens uitgelezen! Controleer of alles klopt:
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Schuldeiser</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {extractedData.creditor_name || 'Niet gevonden'}
                  </p>
                </div>

                {extractedData.case_number && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Dossiernummer</p>
                    <p className="text-sm font-medium text-gray-900">
                      {extractedData.case_number}
                    </p>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Hoofdsom</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(extractedData.original_amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {extractedData.reminder_costs > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Aanmaningskosten</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(extractedData.reminder_costs)}
                      </p>
                    </div>
                  )}

                  {extractedData.collection_costs > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Incassokosten</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(extractedData.collection_costs)}
                      </p>
                    </div>
                  )}
                </div>

                {extractedData.interest_costs > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Rente & extra kosten</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(extractedData.interest_costs)}
                    </p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium mb-1">TOTAAL TE BETALEN</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(extractedData.total_amount)}
                  </p>
                </div>

                {extractedData.payment_deadline && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <p className="text-xs text-orange-600 font-medium mb-1">⏰ UITERLIJKE BETAALDATUM</p>
                    <p className="text-lg font-bold text-orange-700">
                      {new Date(extractedData.payment_deadline).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {extractedData.contact_details && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    <p className="text-sm font-medium text-gray-900">
                      {extractedData.contact_details}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Controleer altijd:</strong> AI is slim, maar kan fouten maken. Check of de bedragen kloppen met je brief!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload');
                    setUploadedPages([]);
                  }}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Opnieuw scannen
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    'Klopt, toevoegen!'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Schuld toegevoegd! 🎉
              </h3>
              <p className="text-sm text-gray-600">
                Je kunt nu een betalingsregeling starten
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}