import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { User, Income } from '@/api/entities';
import { formatCurrency } from '@/components/utils/formatters';

// Dutch VAT rates
const VAT_RATES = [
  { value: 21, label: '21% (Standaard tarief)' },
  { value: 9, label: '9% (Verlaagd tarief)' },
  { value: 0, label: '0% (Vrijgesteld)' }
];

export default function InvoiceScanModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // upload, review, success
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const { toast } = useToast();

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Upload file to storage
      const fileName = `${user.id}/invoices/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payslips') // Reuse payslips bucket
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('payslips')
          .getPublicUrl(fileName);
        setFileUrl(publicUrl);
      }

      // Call parse-invoice Edge Function
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-invoice', {
        body: { fileBase64, mimeType }
      });

      if (parseError) {
        throw new Error(parseError.message || 'Kon factuur niet scannen');
      }

      if (parseResult.error) {
        throw new Error(parseResult.error);
      }

      if (parseResult.success && parseResult.data) {
        setExtractedData(parseResult.data);
        setStep('review');
        toast({ title: '✅ Factuur gescand!' });
      } else {
        throw new Error('Kon factuur niet lezen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '❌ Fout bij scannen',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!extractedData) return;

    setProcessing(true);
    try {
      const user = await User.me();
      if (!user) throw new Error('Niet ingelogd');

      // Create income record with invoice details
      // The NETTO amount (excl. BTW) is the real income
      const incomeData = {
        user_id: user.id,
        name: `Factuur ${extractedData.invoice_number} - ${extractedData.client_name}`,
        description: extractedData.description || `Factuur aan ${extractedData.client_name}`,
        amount: extractedData.subtotal, // Net amount - this is the real income!
        income_type: 'extra', // Invoices are typically one-time income
        date: extractedData.invoice_date, // Use date field for extra income
        is_active: true,

        // Invoice-specific fields
        is_invoice: true,
        invoice_number: extractedData.invoice_number,
        client_name: extractedData.client_name,
        gross_amount: extractedData.total_amount,
        vat_percentage: extractedData.vat_percentage,
        vat_amount: extractedData.vat_amount,
        file_url: fileUrl
      };

      const income = await Income.create(incomeData);

      // Create or update BTW Reserve potje
      if (extractedData.vat_amount > 0) {
        // Check if BTW potje exists
        const { data: existingPots } = await supabase
          .from('pots')
          .select('*')
          .eq('user_id', user.id)
          .eq('pot_type', 'btw_reserve')
          .limit(1);

        if (existingPots && existingPots.length > 0) {
          // Update existing BTW potje - add to current amount
          const pot = existingPots[0];
          await supabase
            .from('pots')
            .update({
              current_amount: (pot.current_amount || 0) + extractedData.vat_amount,
              target_amount: (pot.target_amount || 0) + extractedData.vat_amount
            })
            .eq('id', pot.id);
        } else {
          // Create new BTW Reserve potje
          await supabase
            .from('pots')
            .insert({
              user_id: user.id,
              name: 'BTW Reserve',
              description: 'Gereserveerd voor BTW aangifte aan de Belastingdienst',
              target_amount: extractedData.vat_amount,
              current_amount: extractedData.vat_amount,
              pot_type: 'btw_reserve',
              color: '#f59e0b', // Amber color
              icon: 'account_balance'
            });
        }
      }

      // Save detailed invoice record
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          income_id: income.id,
          invoice_number: extractedData.invoice_number,
          invoice_date: extractedData.invoice_date,
          due_date: extractedData.due_date,
          client_name: extractedData.client_name,
          client_address: extractedData.client_address,
          client_kvk: extractedData.client_kvk,
          client_btw_number: extractedData.client_btw_number,
          subtotal: extractedData.subtotal,
          vat_percentage: extractedData.vat_percentage,
          vat_amount: extractedData.vat_amount,
          total_amount: extractedData.total_amount,
          status: 'verzonden',
          file_url: fileUrl,
          description: extractedData.description,
          line_items: extractedData.line_items
        });

      if (invoiceError) {
        console.error('Invoice save error:', invoiceError);
        // Continue anyway - income is already saved
      }

      setStep('success');

      toast({
        title: '✅ Factuur opgeslagen!',
        description: `Netto inkomen: ${formatCurrency(extractedData.subtotal)} | BTW te reserveren: ${formatCurrency(extractedData.vat_amount)}`
      });

      if (onSuccess) {
        onSuccess(income, extractedData);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: '❌ Fout bij opslaan',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setExtractedData(null);
    setFileUrl('');
    onClose();
  };

  // Calculate VAT when percentage changes
  const recalculateVat = (newPercentage) => {
    const subtotal = extractedData.subtotal;
    const newVatAmount = Math.round(subtotal * (newPercentage / 100) * 100) / 100;
    const newTotal = Math.round((subtotal + newVatAmount) * 100) / 100;

    setExtractedData({
      ...extractedData,
      vat_percentage: newPercentage,
      vat_amount: newVatAmount,
      total_amount: newTotal
    });
  };

  // Recalculate when subtotal changes
  const recalculateFromSubtotal = (newSubtotal) => {
    const vatPercentage = extractedData.vat_percentage;
    const newVatAmount = Math.round(newSubtotal * (vatPercentage / 100) * 100) / 100;
    const newTotal = Math.round((newSubtotal + newVatAmount) * 100) / 100;

    setExtractedData({
      ...extractedData,
      subtotal: newSubtotal,
      vat_amount: newVatAmount,
      total_amount: newTotal
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] rounded-[24px] overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-8 md:p-10">
          {/* Upload Step */}
          {step === 'upload' && (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#f59e0b] text-2xl">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-[#1F2937] dark:text-white">
                      Factuur Scannen
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">Voor ZZP'ers / Freelancers</p>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-2xl bg-gray-50 dark:bg-[#2a2a2a] p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#f59e0b]/50 dark:hover:border-[#f59e0b]/50 transition-all group mb-6">
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-5xl text-[#f59e0b] animate-spin">progress_activity</span>
                    <p className="text-gray-600 dark:text-[#a1a1a1] font-medium">Factuur wordt gescand...</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5">
                      <span className="material-symbols-outlined text-5xl text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">cloud_upload</span>
                    </div>
                    <p className="text-gray-600 dark:text-[#a1a1a1] text-base mb-6">
                      Upload je factuur (PDF of foto)
                    </p>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      id="invoice-upload"
                      onChange={handleFileUpload}
                    />

                    <label htmlFor="invoice-upload">
                      <span className="inline-flex items-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold px-8 py-3 rounded-xl cursor-pointer transition-colors shadow-lg">
                        Selecteer Bestand
                      </span>
                    </label>
                  </>
                )}
              </div>

              {/* Info Box - BTW Warning */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 flex gap-4 items-start">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 flex-shrink-0 text-xl">warning</span>
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">BTW is niet jouw geld!</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed">
                    De BTW die je factureert moet je elk kwartaal afdragen aan de Belastingdienst.
                    We scheiden dit bedrag automatisch van je echte inkomen.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Review Step */}
          {step === 'review' && extractedData && (
            <>
              {/* Header */}
              <div className="mb-6">
                <h3 className="font-bold text-2xl text-[#1F2937] dark:text-white">
                  Controleer Factuur
                </h3>
              </div>

              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-400 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Factuur gescand! Controleer de BTW gegevens:
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Factuurnummer</label>
                    <input
                      type="text"
                      value={extractedData.invoice_number || ''}
                      onChange={(e) => setExtractedData({...extractedData, invoice_number: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Factuurdatum</label>
                    <input
                      type="date"
                      value={extractedData.invoice_date || ''}
                      onChange={(e) => setExtractedData({...extractedData, invoice_date: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Client */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Klant / Opdrachtgever</label>
                  <input
                    type="text"
                    value={extractedData.client_name || ''}
                    onChange={(e) => setExtractedData({...extractedData, client_name: e.target.value})}
                    placeholder="Naam van de klant"
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Omschrijving</label>
                  <input
                    type="text"
                    value={extractedData.description || ''}
                    onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                    placeholder="Bijv. Website ontwikkeling"
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* BTW Section */}
                <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#f59e0b]">percent</span>
                    BTW Berekening
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Netto Bedrag */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Netto (excl. BTW)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.subtotal || ''}
                          onChange={(e) => recalculateFromSubtotal(parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-8 pr-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ Dit is je echte inkomen
                      </p>
                    </div>

                    {/* BTW Percentage */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">BTW Tarief</label>
                      <select
                        value={extractedData.vat_percentage || 21}
                        onChange={(e) => recalculateVat(parseFloat(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                      >
                        {VAT_RATES.map((rate) => (
                          <option key={rate.value} value={rate.value}>{rate.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* BTW Amount & Total */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* BTW Bedrag */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 tracking-widest">BTW Bedrag</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.vat_amount || ''}
                          onChange={(e) => setExtractedData({...extractedData, vat_amount: parseFloat(e.target.value) || 0})}
                          className="w-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                        />
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ Te reserveren voor Belastingdienst
                      </p>
                    </div>

                    {/* Totaal */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Totaal (incl. BTW)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.total_amount || ''}
                          readOnly
                          className="w-full bg-gray-100 dark:bg-[#333] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-[#1F2937] dark:text-white outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 border border-[#f59e0b]/30 rounded-xl p-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jouw inkomen (netto)</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(extractedData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">BTW reserve</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(extractedData.vat_amount)}</span>
                  </div>
                  <div className="border-t border-[#f59e0b]/30 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Klant betaalt</span>
                    <span className="text-xl font-bold text-[#1F2937] dark:text-white">{formatCurrency(extractedData.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-[#1F2937] dark:text-white font-bold text-sm transition-all"
                >
                  Terug
                </button>
                <button
                  onClick={handleSaveInvoice}
                  disabled={processing}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      Verwerken...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Opslaan
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Success Step */}
          {step === 'success' && extractedData && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">check_circle</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-3">
                Factuur Verwerkt!
              </h3>
              <p className="text-gray-600 dark:text-[#a1a1a1] mb-6">
                Je factuur is opgeslagen met gescheiden BTW.
              </p>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-xl p-6 mb-6 text-left">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500 dark:text-[#a1a1a1]">Jouw inkomen</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(extractedData.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500 dark:text-[#a1a1a1]">BTW ({extractedData.vat_percentage}%)</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(extractedData.vat_amount)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-3 mt-3">
                  <div className="flex items-start gap-2 text-left">
                    <span className="material-symbols-outlined text-amber-500 text-lg flex-shrink-0 mt-0.5">info</span>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Vergeet niet om €{extractedData.vat_amount.toFixed(2)} te reserveren voor je BTW aangifte!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="px-10 py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm shadow-lg transition-all"
              >
                Sluiten
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
