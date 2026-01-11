import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Check } from "lucide-react";
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
      // Extract data met AI
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

      // Process alle pagina's
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
        name: extractedData.creditor_name || '',
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
      <DialogContent className="max-w-2xl mx-4 max-h-[90vh] flex flex-col p-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
        {/* Custom Header */}
        <div className="relative p-6 md:p-10 pb-0">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <h2 className="font-bold text-[28px] text-gray-900 dark:text-white mb-3">
              Scan je Brief
            </h2>
            <p className="text-[15px] text-gray-500 dark:text-[#a1a1a1] max-w-md mx-auto leading-relaxed">
              Onze AI herkent automatisch de details zoals de schuldeiser, het bedrag en de vervaldatum.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 px-6 md:px-10 pb-6 md:pb-10">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Upload Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <div className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:bg-gray-100 dark:hover:bg-[#323232] text-center h-full">
                      <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
                        <Camera className="w-12 h-12 text-emerald-500 relative z-10" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Start Camera</h3>
                      <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Maak een foto van je fysieke brief.</p>
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
                    <div className="group flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:bg-gray-100 dark:hover:bg-[#323232] text-center h-full">
                      <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity"></div>
                        <Upload className="w-12 h-12 text-emerald-500 relative z-10" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">Bestand Uploaden</h3>
                      <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Selecteer een PDF of afbeelding van je computer.</p>
                    </div>
                  </label>
                </div>

                {/* Tips Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-base text-gray-900 dark:text-white">Tips voor een goede scan:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#a1a1a1]">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      Zorg voor voldoende licht
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#a1a1a1]">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      Leg de brief op een vlakke ondergrond
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#a1a1a1]">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      Zorg dat alle vier de hoeken zichtbaar zijn
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Cancel Button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleClose}
                    className="text-gray-500 dark:text-[#6b7280] font-medium hover:text-gray-700 dark:hover:text-white transition-colors text-sm px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    Annuleren
                  </button>
                </div>
              </motion.div>
            )}

            {/* Scanned Step */}
            {step === 'scanned' && uploadedPages.length > 0 && (
              <motion.div
                key="scanned"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">
                    {uploadedPages.length} pagina{uploadedPages.length > 1 ? "'s" : ''} gescand
                  </p>
                </div>

                <div className="space-y-2">
                  {uploadedPages.map((url, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-[#3a3a3a] flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Pagina {index + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePage(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
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
                    className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    💡 <strong>Meerdere pagina's?</strong> Scan alle pagina's van de brief voor de beste resultaten!
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
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
                      className="w-full border-gray-200 dark:border-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
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
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Doorgaan →
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-16 text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-30 rounded-full"></div>
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Brief wordt gescand...
                </h3>
                <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
                  AI leest de gegevens uit {uploadedPages.length} pagina{uploadedPages.length > 1 ? "'s" : ''}
                </p>
              </motion.div>
            )}

            {/* Review Step */}
            {step === 'review' && extractedData && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm text-emerald-800 dark:text-emerald-400 font-medium">
                    Gegevens uitgelezen! Controleer of alles klopt:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Schuldeiser</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {extractedData.creditor_name || 'Niet gevonden'}
                    </p>
                  </div>

                  {extractedData.case_number && (
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Dossiernummer</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {extractedData.case_number}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Hoofdsom</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(extractedData.original_amount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {extractedData.reminder_costs > 0 && (
                      <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                        <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Aanmaningskosten</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(extractedData.reminder_costs)}
                        </p>
                      </div>
                    )}

                    {extractedData.collection_costs > 0 && (
                      <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                        <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Incassokosten</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(extractedData.collection_costs)}
                        </p>
                      </div>
                    )}
                  </div>

                  {extractedData.interest_costs > 0 && (
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Rente & extra kosten</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(extractedData.interest_costs)}
                      </p>
                    </div>
                  )}

                  <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-300 dark:border-red-500/30 rounded-xl p-4">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">TOTAAL TE BETALEN</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {formatCurrency(extractedData.total_amount)}
                    </p>
                  </div>

                  {extractedData.payment_deadline && (
                    <div className="bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-300 dark:border-orange-500/30 rounded-xl p-4">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">⏰ UITERLIJKE BETAALDATUM</p>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                        {new Date(extractedData.payment_deadline).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {extractedData.contact_details && (
                    <div className="bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-1">Contact</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {extractedData.contact_details}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
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
                    className="flex-1 border-gray-200 dark:border-[#3a3a3a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                    disabled={isProcessing}
                  >
                    Opnieuw scannen
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="relative inline-block mb-6"
                >
                  <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-30 rounded-full"></div>
                  <CheckCircle2 className="w-20 h-20 text-emerald-500 relative z-10" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Schuld toegevoegd! 🎉
                </h3>
                <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">
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
