
import React, { useState, useRef } from "react";
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
import { UploadPrivateFile, ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, DollarSign, Loader2, CheckCircle2, Sparkles, Upload, X, FileText, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";
import { gamificationService, XP_REWARDS } from "@/services/gamificationService";

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
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  if (!debt) return null;

  const remainingAmount = (debt.amount || 0) - (debt.amount_paid || 0);
  const isAlreadyPaid = remainingAmount <= 0;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Ongeldig bestandstype", description: "Alleen JPG, PNG en PDF bestanden zijn toegestaan.", variant: "destructive" });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Bestand te groot", description: "Maximale bestandsgrootte is 10MB.", variant: "destructive" });
      return;
    }

    setSelectedFile(file);

    // Automatically extract data from the file
    await extractDataFromFile(file);
  };

  const extractDataFromFile = async (file) => {
    setExtracting(true);
    try {
      // 1. Upload file first (use UploadFile for public URL needed for extraction)
      // The AI service requires a publicly accessible URL for processing.
      const { file_url } = await UploadFile({ file });

      // 2. Define schema for extraction
      const schema = {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Het betaalde bedrag in euro's (alleen het nummer, geen valutasymbool)"
          },
          payment_date: {
            type: "string",
            description: "De betalingsdatum in het formaat YYYY-MM-DD"
          },
          description: {
            type: "string",
            description: "Omschrijving van de betaling of betalingskenmerk"
          },
          recipient: {
            type: "string",
            description: "Naam van de ontvanger/begunstigde"
          }
        }
      };

      // 3. Extract data using AI
      const result = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: schema
      });

      if (result.status === "success" && result.output) {
        const data = result.output;
        
        // Fill form fields with extracted data
        if (data.amount) setAmount(data.amount.toString());
        if (data.payment_date) setPaymentDate(data.payment_date);
        if (data.description) setNotes(data.description);

        toast({ 
          title: "✨ Gegevens uitgelezen!", 
          description: "Controleer de ingevulde velden en pas aan indien nodig.",
          variant: "success"
        });
      } else {
        toast({ 
          title: "Kon gegevens niet uitlezen", 
          description: "Vul de gegevens handmatig in.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error extracting data:", error);
      toast({ 
        title: "Fout bij uitlezen", 
        description: "Vul de gegevens handmatig in.", 
        variant: "destructive" 
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      // 1. Upload file for permanent storage if selected
      let fileInfo = null;
      if (selectedFile) {
        setUploading(true);
        try {
          const { file_uri } = await UploadPrivateFile({ file: selectedFile });
          fileInfo = {
            name: selectedFile.name,
            uri: file_uri,
            size: selectedFile.size
          };
        } catch (error) {
          console.error("Error uploading file:", error);
          toast({ title: "Upload mislukt", description: "Kon bankafschrift niet uploaden, maar betaling wordt wel opgeslagen.", variant: "destructive" });
        } finally {
          setUploading(false);
        }
      }

      // 2. Register payment
      const newPayment = await DebtPayment.create({
        debt_id: debt.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes,
        status: "betaald"
      });

      // 3. Save document if uploaded
      if (fileInfo) {
        await PaymentDocument.create({
          debt_id: debt.id,
          payment_id: newPayment.id,
          document_type: 'betalingsbewijs',
          file_name: fileInfo.name,
          file_uri: fileInfo.uri,
          file_size: fileInfo.size,
        });
      }

      // 4. CREATE AUTOMATIC TRANSACTION FOR THIS PAYMENT
      await Transaction.create({
        type: 'expense',
        amount: paymentAmount,
        description: `Aflossing ${debt.creditor_name}`,
        category: 'debt_payments', // Fixed category for debt payments
        date: paymentDate
      });

      // 5. Calculate CORRECT amount_paid by summing ALL payments
      const allPayments = await DebtPayment.filter({ debt_id: debt.id });
      const correctAmountPaid = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const debtIsNowFullyPaid = correctAmountPaid >= debt.amount;

      // 6. Update debt with CORRECT amount_paid
      const updateData = {
        amount_paid: correctAmountPaid,
      };

      // 7. Award XP for payment
      let xpAwarded = 0;
      try {
        const currentUser = await User.me();
        if (currentUser?.id) {
          // Award XP for making a payment
          await gamificationService.addXP(currentUser.id, XP_REWARDS.PAYMENT_MADE, "payment_made");
          xpAwarded = XP_REWARDS.PAYMENT_MADE;

          // Award bonus XP for extra payment (payment higher than monthly payment arrangement)
          const monthlyPayment = debt.monthly_payment || debt.repayment_amount || 0;
          if (monthlyPayment > 0 && paymentAmount > monthlyPayment) {
            await gamificationService.addXP(currentUser.id, XP_REWARDS.EXTRA_PAYMENT_MADE, "extra_payment_made");
            xpAwarded += XP_REWARDS.EXTRA_PAYMENT_MADE;
          }

          // Award bonus XP if debt is fully paid
          if (debtIsNowFullyPaid && debt.status !== 'afbetaald') {
            await gamificationService.addXP(currentUser.id, XP_REWARDS.DEBT_FULLY_PAID, "debt_fully_paid");
            xpAwarded += XP_REWARDS.DEBT_FULLY_PAID;
          }
        }
      } catch (xpError) {
        console.error("Error awarding XP:", xpError);
      }

      // 8. If fully paid for the first time, update status and show celebration
      if (debtIsNowFullyPaid && debt.status !== 'afbetaald') {
        updateData.status = 'afbetaald';

        // Update database EERST
        await Debt.update(debt.id, updateData);

        // Dan celebration tonen
        setIsFullyPaid(true);
        setCelebrating(true);

        // Show celebration for 3 seconds, DAN refresh parent data, DAN close
        setTimeout(async () => {
          setCelebrating(false);

          // EERST: Refresh parent data
          if (onPaymentAdded) await onPaymentAdded();

          // DAN: Toast
          toast({
            title: "🎉 Schuld afgelost!",
            description: `${debt.creditor_name} is volledig afbetaald! +${xpAwarded} XP`,
          });

          // LAATSTE: Modal sluiten
          onClose();
        }, 3000);
      } else {
        // Normale flow: update en direct door
        await Debt.update(debt.id, updateData);

        // EERST: Refresh parent data
        if (onPaymentAdded) await onPaymentAdded();

        // DAN: Toast
        toast({
          title: isAlreadyPaid ? "Betaling toegevoegd" : `Betaling geregistreerd +${xpAwarded} XP`,
          description: isAlreadyPaid
            ? "Historische betaling is succesvol toegevoegd!"
            : `Nog ${formatCurrency(debt.amount - correctAmountPaid)} te gaan!`,
        });

        // LAATSTE: Modal sluiten
        onClose();
      }

    } catch (error) {
      console.error("Error registering payment:", error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
      setSaving(false);
    }
  };

  const handleQuickAmount = (percentage) => {
    if (isAlreadyPaid) {
      // For already paid debts, suggest the original debt amount
      const quickAmount = debt.amount * percentage;
      setAmount(quickAmount.toFixed(2));
    } else {
      const quickAmount = remainingAmount * percentage;
      setAmount(quickAmount.toFixed(2));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
              >
                <Sparkles className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Gefeliciteerd! 🎉
              </h2>
              <p className="text-xl text-gray-700 mb-2">
                Je hebt {debt.creditor_name} volledig afbetaald!
              </p>
              <p className="text-lg text-green-600 font-semibold">
                {formatCurrency(debt.amount)} schuld-vrij! 💪
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
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  {isAlreadyPaid ? "Historische Betaling Toevoegen" : "Betaling Registreren"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Debt info */}
                <div className={`${isAlreadyPaid ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                  <p className="font-semibold text-gray-900">{debt.creditor_name}</p>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Totaal schuld:</span>
                    <span className="font-bold">{formatCurrency(debt.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Al betaald:</span>
                    <span className="font-bold text-green-600">{formatCurrency(debt.amount_paid || 0)}</span>
                  </div>
                  {!isAlreadyPaid && (
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-300 mt-2">
                      <span className="text-gray-900 font-medium">Nog te gaan:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(remainingAmount)}</span>
                    </div>
                  )}
                  {isAlreadyPaid && (
                    <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                      💡 Deze schuld is al afbetaald. Je voegt nu een historische betaling toe.
                    </div>
                  )}
                </div>

                {/* File upload with AI extraction */}
                <div>
                  <Label>Bankafschrift (optioneel)</Label>
                  {extracting && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Gegevens uitlezen...</p>
                        <p className="text-xs text-blue-700">AI leest het bankafschrift uit</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    {!selectedFile ? (
                      <label className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={extracting}
                        />
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <Wand2 className="w-5 h-5 text-purple-500" />
                          </div>
                          <p className="text-sm text-gray-600 font-medium">Klik om bankafschrift te uploaden</p>
                          <p className="text-xs text-gray-500 mt-1">AI leest automatisch bedrag en datum uit</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG of PDF (max 10MB)</p>
                        </div>
                      </label>
                    ) : (
                      <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleRemoveFile}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          disabled={extracting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick amount buttons */}
                {!isAlreadyPaid && (
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">Snel invullen:</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAmount(0.25)}
                      >
                        25%
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAmount(0.50)}
                      >
                        50%
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAmount(0.75)}
                      >
                        75%
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAmount(1)}
                        className="font-bold"
                      >
                        Alles
                      </Button>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <Label htmlFor="amount">Bedrag (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {isAlreadyPaid && parseFloat(amount) > debt.amount && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Bedrag is hoger dan de oorspronkelijke schuld
                    </p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date">Datum *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                {/* Payment method */}
                <div>
                  <Label htmlFor="method">Betaalmethode</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Overschrijving</SelectItem>
                      <SelectItem value="incasso">Automatische incasso</SelectItem>
                      <SelectItem value="contant">Contant</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notities (optioneel)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bijv. referentienummer"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={saving || uploading || extracting}>
                    Annuleren
                  </Button>
                  <Button type="submit" disabled={saving || uploading || extracting} className="flex-1 bg-green-600 hover:bg-green-700">
                    {(saving || uploading) ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploading ? 'Uploaden...' : 'Opslaan...'}</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Registreren</>
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
