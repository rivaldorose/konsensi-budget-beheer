
import React, { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Debt } from "@/api/entities";
import { DebtPayment } from "@/api/entities";
import { PaymentDocument } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, DollarSign, Loader2, CheckCircle2, Sparkles, Upload, X, FileText, Wand2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";
import { gamificationService, XP_REWARDS } from "@/services/gamificationService";
import { supabase } from "@/lib/supabase";

// Parse PDF text to extract payment data
async function parsePdfText(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return extractPaymentData(fullText);
}

// Extract payment info from text using common Dutch bank statement patterns
function extractPaymentData(text) {
  const result = { amount: null, date: null, description: null, method: null };

  // Amount patterns: €123,45 or EUR 123,45 or 123.45 or 1.234,56
  const amountPatterns = [
    /€\s*([\d.,]+)/,
    /EUR\s*([\d.,]+)/i,
    /bedrag[:\s]*([\d.,]+)/i,
    /totaal[:\s]*€?\s*([\d.,]+)/i,
    /af[:\s]*€?\s*([\d.,]+)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Handle Dutch number format: 1.234,56 -> 1234.56
      let numStr = match[1].replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(numStr);
      if (parsed > 0 && parsed < 1000000) {
        result.amount = parsed;
        break;
      }
    }
  }

  // Date patterns: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD
  const datePatterns = [
    /(\d{2})[-/.](\d{2})[-/.](\d{4})/,
    /(\d{4})[-/.](\d{2})[-/.](\d{2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let year, month, day;
      if (match[1].length === 4) {
        [, year, month, day] = match;
      } else {
        [, day, month, year] = match;
      }
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 2020) {
        result.date = dateStr;
        break;
      }
    }
  }

  // Description: look for omschrijving/kenmerk/referentie
  const descPatterns = [
    /omschrijving[:\s]*(.{5,80})/i,
    /kenmerk[:\s]*(.{5,50})/i,
    /referentie[:\s]*(.{5,50})/i,
    /betreft[:\s]*(.{5,80})/i,
  ];

  for (const pattern of descPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.description = match[1].trim();
      break;
    }
  }

  // Payment method
  if (/incasso/i.test(text)) result.method = 'incasso';
  else if (/overboek|overboeking|overschrijving/i.test(text)) result.method = 'bank_transfer';
  else if (/ideal|i\.?deal/i.test(text)) result.method = 'bank_transfer';

  return result;
}

export default function PaymentRegistrationModal({ isOpen, onClose, debt, onPaymentAdded }) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  if (!debt) return null;

  const remainingAmount = (debt.amount || 0) - (debt.amount_paid || 0);
  const isAlreadyPaid = remainingAmount <= 0;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Ongeldig bestandstype", description: "Alleen JPG, PNG en PDF bestanden zijn toegestaan.", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Maximale bestandsgrootte is 10MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    setExtractionResult(null);

    if (file.type === 'application/pdf') {
      await extractFromPdf(file);
    }
  };

  const extractFromPdf = async (file) => {
    setExtracting(true);
    try {
      const data = await parsePdfText(file);
      setExtractionResult(data);

      let filled = 0;
      if (data.amount) { setAmount(data.amount.toFixed(2)); filled++; }
      if (data.date) { setPaymentDate(data.date); filled++; }
      if (data.description) { setNotes(data.description); filled++; }
      if (data.method) { setPaymentMethod(data.method); filled++; }

      if (filled > 0) {
        toast({
          title: `${filled} veld${filled > 1 ? 'en' : ''} automatisch ingevuld`,
          description: "Controleer de gegevens en bevestig.",
          variant: "success"
        });
      } else {
        toast({
          title: "Geen gegevens gevonden",
          description: "Vul de gegevens handmatig in.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error parsing PDF:", error);
      toast({
        title: "Kon PDF niet lezen",
        description: "Vul de gegevens handmatig in.",
        variant: "destructive"
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const paymentAmount = parseFloat(amount);

      if (!paymentAmount || paymentAmount <= 0) {
        toast({ title: "Ongeldig bedrag", description: "Vul een geldig bedrag in.", variant: "destructive" });
        setSaving(false);
        return;
      }

      // 1. Upload file to Supabase Storage if selected
      let fileUrl = null;
      if (selectedFile) {
        setUploading(true);
        try {
          const fileName = `${Date.now()}-${selectedFile.name}`;
          const { data, error } = await supabase.storage
            .from('attachments')
            .upload(fileName, selectedFile);
          if (!error && data) {
            const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(data.path);
            fileUrl = urlData?.publicUrl || null;
          }
        } catch (error) {
          console.error("Error uploading file:", error);
        } finally {
          setUploading(false);
        }
      }

      // 2. Register payment
      const newPayment = await DebtPayment.create({
        debt_id: debt.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        date: paymentDate,
        payment_method: paymentMethod,
        notes: notes,
        status: "betaald"
      });

      // 3. Save document reference if uploaded
      if (fileUrl && newPayment) {
        await PaymentDocument.create({
          debt_id: debt.id,
          payment_id: newPayment.id,
          document_type: 'betalingsbewijs',
          file_name: selectedFile.name,
          file_url: fileUrl,
          file_uri: fileUrl,
          file_size: selectedFile.size,
        }).catch(err => console.error("Error saving document:", err));
      }

      // 4. Create automatic transaction
      await Transaction.create({
        type: 'expense',
        amount: paymentAmount,
        description: `Aflossing ${debt.creditor_name}`,
        category: 'debt_payments',
        date: paymentDate
      }).catch(err => console.error("Error creating transaction:", err));

      // 5. Calculate correct amount_paid
      const allPayments = await DebtPayment.filter({ debt_id: debt.id });
      const correctAmountPaid = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const debtIsNowFullyPaid = correctAmountPaid >= debt.amount;

      const updateData = { amount_paid: correctAmountPaid };

      // 6. Award XP
      let xpAwarded = 0;
      try {
        const currentUser = await User.me();
        if (currentUser?.id) {
          await gamificationService.addXP(currentUser.id, XP_REWARDS.PAYMENT_MADE, "payment_made");
          xpAwarded = XP_REWARDS.PAYMENT_MADE;

          const monthlyPayment = debt.monthly_payment || debt.repayment_amount || 0;
          if (monthlyPayment > 0 && paymentAmount > monthlyPayment) {
            await gamificationService.addXP(currentUser.id, XP_REWARDS.EXTRA_PAYMENT_MADE, "extra_payment_made");
            xpAwarded += XP_REWARDS.EXTRA_PAYMENT_MADE;
          }

          if (debtIsNowFullyPaid && debt.status !== 'afbetaald') {
            await gamificationService.addXP(currentUser.id, XP_REWARDS.DEBT_FULLY_PAID, "debt_fully_paid");
            xpAwarded += XP_REWARDS.DEBT_FULLY_PAID;
          }
        }
      } catch (xpError) {
        console.error("Error awarding XP:", xpError);
      }

      // 7. Handle fully paid or normal flow
      if (debtIsNowFullyPaid && debt.status !== 'afbetaald') {
        updateData.status = 'afbetaald';
        await Debt.update(debt.id, updateData);

        setIsFullyPaid(true);
        setCelebrating(true);

        setTimeout(async () => {
          setCelebrating(false);
          if (onPaymentAdded) await onPaymentAdded();
          toast({
            title: "Schuld afgelost!",
            description: `${debt.creditor_name} is volledig afbetaald! +${xpAwarded} XP`,
          });
          onClose();
        }, 3000);
      } else {
        await Debt.update(debt.id, updateData);
        if (onPaymentAdded) await onPaymentAdded();
        toast({
          title: isAlreadyPaid ? "Betaling toegevoegd" : `Betaling geregistreerd +${xpAwarded} XP`,
          description: isAlreadyPaid
            ? "Historische betaling is succesvol toegevoegd!"
            : `Nog ${formatCurrency(debt.amount - correctAmountPaid)} te gaan!`,
        });
        onClose();
      }

    } catch (error) {
      console.error("Error registering payment:", error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
      setSaving(false);
    }
  };

  const handleQuickAmount = (percentage) => {
    const base = isAlreadyPaid ? debt.amount : remainingAmount;
    setAmount((base * percentage).toFixed(2));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
        <AnimatePresence mode="wait">
          {celebrating ? (
            <motion.div
              key="celebration"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="py-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
              >
                <Sparkles className="w-24 h-24 text-yellow-500 dark:text-accent-yellow mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold text-text-main dark:text-text-primary mb-2">
                Gefeliciteerd!
              </h2>
              <p className="text-xl text-text-muted dark:text-text-secondary mb-2">
                Je hebt {debt.creditor_name} volledig afbetaald!
              </p>
              <p className="text-lg text-primary dark:text-primary-green font-semibold">
                {formatCurrency(debt.amount)} schuld-vrij!
              </p>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-8 text-6xl"
              >
                🎊
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-text-main dark:text-text-primary">
                  <DollarSign className="w-5 h-5 text-primary dark:text-primary-green" />
                  {isAlreadyPaid ? "Historische Betaling Toevoegen" : "Betaling Registreren"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Debt info card */}
                <div className={`rounded-xl p-4 border ${isAlreadyPaid
                  ? 'bg-purple-50 dark:bg-accent-purple/10 border-purple-200 dark:border-accent-purple/20'
                  : 'bg-blue-50 dark:bg-accent-blue/10 border-blue-200 dark:border-accent-blue/20'
                }`}>
                  <p className="font-semibold text-text-main dark:text-text-primary">{debt.creditor_name}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-text-muted dark:text-text-secondary">Totaal schuld:</span>
                    <span className="font-bold text-text-main dark:text-text-primary">{formatCurrency(debt.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted dark:text-text-secondary">Al betaald:</span>
                    <span className="font-bold text-primary dark:text-primary-green">{formatCurrency(debt.amount_paid || 0)}</span>
                  </div>
                  {!isAlreadyPaid && (
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-300 dark:border-accent-blue/30 mt-2">
                      <span className="text-text-main dark:text-text-primary font-medium">Nog te gaan:</span>
                      <span className="font-bold text-accent-orange dark:text-accent-orange">{formatCurrency(remainingAmount)}</span>
                    </div>
                  )}
                  {isAlreadyPaid && (
                    <div className="mt-3 p-2 bg-purple-100 dark:bg-accent-purple/20 rounded-lg text-xs text-purple-800 dark:text-purple-300">
                      Deze schuld is al afbetaald. Je voegt nu een historische betaling toe.
                    </div>
                  )}
                </div>

                {/* Bank statement upload */}
                <div>
                  <Label className="text-text-main dark:text-text-primary">Bankafschrift uploaden</Label>
                  <p className="text-xs text-text-muted dark:text-text-tertiary mt-0.5 mb-2">Upload een PDF en de gegevens worden automatisch ingevuld</p>

                  {extracting && (
                    <div className="p-3 bg-blue-50 dark:bg-accent-blue/10 border border-blue-200 dark:border-accent-blue/20 rounded-xl flex items-center gap-3 mb-2">
                      <Loader2 className="w-5 h-5 text-accent-blue animate-spin flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">PDF wordt gelezen...</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Gegevens worden automatisch herkend</p>
                      </div>
                    </div>
                  )}

                  {extractionResult && !extracting && (
                    <div className="p-3 bg-emerald-50 dark:bg-primary-green/10 border border-emerald-200 dark:border-primary-green/20 rounded-xl flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-primary dark:text-primary-green flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Gegevens uitgelezen!</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Controleer hieronder en bevestig.</p>
                      </div>
                    </div>
                  )}

                  {!selectedFile ? (
                    <label className="cursor-pointer block">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={extracting}
                      />
                      <div className="border-2 border-dashed border-gray-300 dark:border-dark-border-accent rounded-xl p-5 hover:border-primary dark:hover:border-primary-green transition-colors text-center group">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Upload className="w-8 h-8 text-text-muted dark:text-text-tertiary group-hover:text-primary dark:group-hover:text-primary-green transition-colors" />
                          <Wand2 className="w-5 h-5 text-accent-purple" />
                        </div>
                        <p className="text-sm text-text-main dark:text-text-primary font-medium">Klik om bankafschrift te uploaden</p>
                        <p className="text-xs text-text-muted dark:text-text-tertiary mt-1">PDF wordt automatisch gelezen en ingevuld</p>
                        <p className="text-xs text-text-muted dark:text-text-tertiary mt-0.5">PDF, JPG of PNG (max 10MB)</p>
                      </div>
                    </label>
                  ) : (
                    <div className="border border-emerald-200 dark:border-primary-green/30 bg-emerald-50 dark:bg-primary-green/10 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-primary dark:text-primary-green flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-main dark:text-text-primary truncate">{selectedFile.name}</p>
                          <p className="text-xs text-text-muted dark:text-text-tertiary">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="h-8 w-8 text-text-muted dark:text-text-tertiary hover:text-status-red dark:hover:text-accent-red flex-shrink-0"
                        disabled={extracting}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quick amount buttons */}
                {!isAlreadyPaid && (
                  <div>
                    <Label className="text-sm text-text-muted dark:text-text-secondary mb-2 block">Snel invullen:</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '25%', value: 0.25 },
                        { label: '50%', value: 0.50 },
                        { label: '75%', value: 0.75 },
                        { label: 'Alles', value: 1 },
                      ].map(({ label, value }) => (
                        <Button
                          key={label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAmount(value)}
                          className={`border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated ${value === 1 ? 'font-bold' : ''}`}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-text-main dark:text-text-primary">Bedrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary"
                  />
                  {isAlreadyPaid && parseFloat(amount) > debt.amount && (
                    <p className="text-xs text-accent-orange mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Bedrag is hoger dan de oorspronkelijke schuld
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date" className="text-text-main dark:text-text-primary">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary"
                  />
                </div>

                {/* Payment method */}
                <div>
                  <Label htmlFor="method" className="text-text-main dark:text-text-primary">Betaalmethode</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
                      <SelectItem value="bank_transfer">Overschrijving</SelectItem>
                      <SelectItem value="incasso">Automatische incasso</SelectItem>
                      <SelectItem value="contant">Contant</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-text-main dark:text-text-primary">Notities (optioneel)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bijv. referentienummer"
                    className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-gray-200 dark:border-dark-border text-text-main dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated"
                    disabled={saving || uploading || extracting}
                  >
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || uploading || extracting}
                    className="flex-1 bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold"
                  >
                    {(saving || uploading) ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploading ? 'Uploaden...' : 'Opslaan...'}</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Bevestigen</>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
