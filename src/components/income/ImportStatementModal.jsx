
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/components/utils/formatters";
import { format, startOfDay } from "date-fns";
import { nl } from "date-fns/locale";
import { Income } from "@/api/entities";
import { Transaction } from "@/api/entities";

export default function ImportStatementModal({ isOpen, onClose, onImportComplete }) {
  const [step, setStep] = useState('upload'); // upload, processing, review, success
  const [file, setFile] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState({ imported: 0, skipped: 0 });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setError('Alleen CSV en PDF bestanden zijn toegestaan');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Bestand is te groot (max 5MB)');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecteer eerst een bestand');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      // Stap 1: Upload het bestand
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Stap 2: Definieer het schema voor transacties
      const schema = {
        type: "object",
        properties: {
          transactions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  format: "date",
                  description: "Datum van de transactie (YYYY-MM-DD)"
                },
                description: {
                  type: "string",
                  description: "Omschrijving/beschrijving van de transactie"
                },
                amount: {
                  type: "number",
                  description: "Bedrag (positief voor inkomsten, negatief voor uitgaven)"
                },
                type: {
                  type: "string",
                  enum: ["income", "expense"],
                  description: "Type transactie: income (inkomst) of expense (uitgave)"
                },
                counterparty: {
                  type: "string",
                  description: "Naam van de tegenpartij (afzender bij income, ontvanger bij expense)"
                }
              },
              required: ["date", "description", "amount", "type"]
            }
          }
        },
        required: ["transactions"]
      };

      // Stap 3: AI extractie
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: schema
      });

      if (result.status === 'success' && result.output && result.output.transactions) {
        const transactions = result.output.transactions;
        
        // Sorteer op datum (nieuwste eerst)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setExtractedTransactions(transactions);
        // Selecteer standaard alle transacties
        setSelectedTransactions(transactions.map((_, idx) => idx));
        setStep('review');
      } else {
        setError(result.details || 'Kon geen transacties vinden in het bestand. Controleer of het een geldig bankafschrift is.');
        setStep('upload');
      }

    } catch (err) {
      console.error("Error processing file:", err);
      setError('Er ging iets mis bij het verwerken van het bestand. Probeer het opnieuw.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTransaction = (index) => {
    setSelectedTransactions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const toggleAll = () => {
    if (selectedTransactions.length === extractedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(extractedTransactions.map((_, idx) => idx));
    }
  };

  const isDuplicate = (transaction, existingRecords) => {
    // Duplicaat als: zelfde datum + bedrag + vergelijkbare beschrijving
    const transactionDate = startOfDay(new Date(transaction.date)).getTime();
    const amount = Math.abs(transaction.amount);
    const description = transaction.description ? transaction.description.toLowerCase().trim() : '';

    return existingRecords.some(record => {
      const recordDate = startOfDay(new Date(record.date)).getTime();
      const recordAmount = Math.abs(parseFloat(record.amount || 0));
      const recordDescription = (record.description || '').toLowerCase().trim();

      // Check datum match (zelfde dag)
      const dateMatch = transactionDate === recordDate;
      
      // Check bedrag match (exact)
      const amountMatch = Math.abs(recordAmount - amount) < 0.01; // Allow for floating point inaccuracies
      
      // Check beschrijving similarity (minimaal 70% overlap)
      const descriptionMatch = recordDescription.includes(description) || 
                               description.includes(recordDescription) ||
                               similarity(description, recordDescription) > 0.7;

      return dateMatch && amountMatch && descriptionMatch;
    });
  };

  // Simple string similarity check using Levenshtein Distance
  const similarity = (s1, s2) => {
    if (!s1 || !s2) return 0; // Handle null/undefined strings
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    // increment along the first column of each row
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    // increment along the first row of each column
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const transactionsToImport = selectedTransactions.map(idx => extractedTransactions[idx]);
      
      // Haal bestaande records op voor duplicaat check
      // Fetch existing incomes with income_type 'extra' or equivalent for bank imports
      const existingIncomes = await Income.filter({ income_type: 'extra' }); 
      // Fetch all existing expenses
      const existingExpenses = await Transaction.filter({ type: 'expense' });

      let importedCount = 0;
      let skippedCount = 0;

      for (const transaction of transactionsToImport) {
        // Determine which existing records to check against based on transaction type
        const existingRecords = transaction.type === 'income' ? existingIncomes : existingExpenses;
        
        // Check duplicaat
        const duplicate = isDuplicate(transaction, existingRecords);
        
        if (duplicate) {
          skippedCount++;
          continue; // Skip this transaction if it's a duplicate
        }

        // Importeer nieuwe transactie
        if (transaction.type === 'income') {
          await Income.create({
            description: transaction.description,
            amount: Math.abs(transaction.amount), // Ensure amount is positive for income
            income_type: 'extra', // Mark as 'extra' income, adjustable as per actual entity needs
            date: transaction.date,
            is_active: true, // Assuming new incomes are active
            monthly_equivalent: 0, // Assuming not a recurring monthly income
            notes: `Geïmporteerd via bankafschrift${transaction.counterparty ? ` - ${transaction.counterparty}` : ''}`
          });
        } else { // type === 'expense'
          await Transaction.create({
            type: 'expense',
            description: transaction.description,
            amount: Math.abs(transaction.amount), // Ensure amount is positive for expense
            date: transaction.date,
            category: 'other', // Default category, might need user input or AI categorization in future
            notes: `Geïmporteerd via bankafschrift${transaction.counterparty ? ` - ${transaction.counterparty}` : ''}`
          });
        }
        
        importedCount++;
      }

      setImportStats({ imported: importedCount, skipped: skippedCount });
      setStep('success');
      
      // Auto-close na 3 seconden
      setTimeout(() => {
        onImportComplete();
        handleClose();
      }, 3000);

    } catch (err) {
      console.error("Error importing transactions:", err);
      setError('Er ging iets mis bij het importeren.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setExtractedTransactions([]);
    setSelectedTransactions([]);
    setError(null);
    setIsProcessing(false);
    setImportStats({ imported: 0, skipped: 0 }); // Reset import stats on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-6 h-6 text-[#4CAF50]" />
            Importeer Bankafschrift
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
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Hoe werkt het?</p>
                    <ul className="space-y-1 text-xs">
                      <li>📄 Upload je bankafschrift (PDF of CSV)</li>
                      <li>🤖 AI leest automatisch alle transacties uit</li>
                      <li>🔍 We detecteren duplicaten zodat je geen dubbele data krijgt</li>
                      <li>✅ Jij controleert en importeert wat je wilt</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#4CAF50] transition-colors">
                <input
                  type="file"
                  accept=".csv,.pdf,application/pdf,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={isProcessing}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-base font-medium text-gray-700 mb-1">
                    {file ? file.name : 'Klik om bestand te selecteren'}
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV of PDF (max 5MB)
                  </p>
                </label>
              </div>

              {/* Tips */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Tips:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Download je bankafschrift vanuit je online banking omgeving</li>
                  <li>• Zorg dat alle transacties goed leesbaar zijn</li>
                  <li>• We ondersteunen de meeste Nederlandse banken</li>
                </ul>
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

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]"
                  disabled={!file || isProcessing}
                >
                  Verwerk Bestand
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
                Bankafschrift wordt verwerkt...
              </h3>
              <p className="text-sm text-gray-600">
                AI leest de transacties uit en detecteert duplicaten
              </p>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    {extractedTransactions.length} transacties gevonden
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                  className="text-xs"
                >
                  {selectedTransactions.length === extractedTransactions.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                {extractedTransactions.map((transaction, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 bg-white rounded-lg border transition-all ${
                      selectedTransactions.includes(idx) ? 'border-[#4CAF50]' : 'border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={selectedTransactions.includes(idx)}
                      onCheckedChange={() => toggleTransaction(idx)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {transaction.description}
                        </p>
                        <Badge variant={transaction.type === 'income' ? 'success' : 'destructive'}>
                          {transaction.type === 'income' ? '💰 Inkomen' : '💸 Uitgave'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{format(new Date(transaction.date), 'd MMM yyyy', { locale: nl })}</span>
                        {transaction.counterparty && (
                          <span className="truncate ml-2">{transaction.counterparty}</span>
                        )}
                      </div>
                    </div>
                    <p className={`font-bold text-base ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Let op:</strong> Duplicaten worden automatisch gefilterd. Alleen nieuwe transacties worden geïmporteerd.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Terug
                </Button>
                <Button
                  onClick={handleImport}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#2D6A31]"
                  disabled={selectedTransactions.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importeren...
                    </>
                  ) : (
                    `Importeer ${selectedTransactions.length} transacties`
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
                Import voltooid! 🎉
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  ✅ {importStats.imported} transactie(s) geïmporteerd
                </p>
                {importStats.skipped > 0 && (
                  <p className="text-sm text-gray-600">
                    ⏭️ {importStats.skipped} duplicaat/duplicaten overgeslagen
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
