import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { Payslip } from '@/api/entities';
import { WorkDay } from '@/api/entities';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function PayslipScanModal({ isOpen, onClose, employers = [], onPayslipProcessed }) {
  const [step, setStep] = useState('upload'); // upload, review, success
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const { toast } = useToast();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload file
      const uploadResult = await UploadFile({ file });
      setFileUrl(uploadResult.file_url);

      // Extract data with AI
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            employer_name: { type: "string", description: "Naam van de werkgever" },
            period_start: { type: "string", description: "Startdatum loonperiode (YYYY-MM-DD)" },
            period_end: { type: "string", description: "Einddatum loonperiode (YYYY-MM-DD)" },
            payment_date: { type: "string", description: "Datum van uitbetaling (YYYY-MM-DD)" },
            gross_amount: { type: "number", description: "Bruto loon" },
            net_amount: { type: "number", description: "Netto loon" },
            total_hours: { type: "number", description: "Totaal gewerkte uren" },
            hourly_rate: { type: "number", description: "Uurloon" },
            deductions: { type: "number", description: "Totale inhoudingen" }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output) {
        setExtractedData(extractResult.output);
        setStep('review');
        toast({ title: '✅ Loonstrook gescand!' });
      } else {
        throw new Error(extractResult.details || 'Kon loonstrook niet lezen');
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

  const handleSavePayslip = async () => {
    if (!extractedData) return;

    setProcessing(true);
    try {
      // Voeg werkgever toe aan lijst als deze nog niet bestaat
      if (extractedData.employer_name && !employers.includes(extractedData.employer_name)) {
        const { User } = await import('@/api/entities');
        const user = await User.me();
        const newEmployers = [...(user.employers || []), extractedData.employer_name];
        await User.updateMe({ employers: newEmployers });
      }

      // Save payslip
      const payslip = await Payslip.create({
        employer: extractedData.employer_name,
        period_start: extractedData.period_start,
        period_end: extractedData.period_end,
        payment_date: extractedData.payment_date,
        gross_amount: extractedData.gross_amount || 0,
        net_amount: extractedData.net_amount,
        hours_worked: extractedData.total_hours,
        hourly_rate: extractedData.hourly_rate,
        deductions: extractedData.deductions || 0,
        file_url: fileUrl,
        is_processed: true
      });

      // Update workdays in this period to "gewerkt" and mark as paid
      if (extractedData.period_start && extractedData.period_end) {
        const { User } = await import('@/api/entities');
        const user = await User.me();

        const allWorkDays = await WorkDay.filter({ user_id: user.id });
        const periodStart = new Date(extractedData.period_start);
        const periodEnd = new Date(extractedData.period_end);

        // Filter werkdagen binnen deze periode
        const workDaysInPeriod = allWorkDays.filter(wd => {
          const wdDate = new Date(wd.date);
          return wdDate >= periodStart && wdDate <= periodEnd &&
                 (!wd.employer || wd.employer === extractedData.employer_name);
        });

        // Update werkdagen naar "gewerkt" en markeer als betaald
        for (const wd of workDaysInPeriod) {
          if (wd.status === 'gepland') {
            await WorkDay.update(wd.id, {
              status: 'gewerkt',
              is_paid: true,
              payslip_verified: true,
              hourly_rate: extractedData.hourly_rate || wd.hourly_rate
            });
          } else if (wd.status === 'gewerkt' && !wd.is_paid) {
            await WorkDay.update(wd.id, {
              is_paid: true,
              payslip_verified: true
            });
          }
        }

        if (workDaysInPeriod.length > 0) {
          toast({
            title: '✅ Werkdagen bijgewerkt',
            description: `${workDaysInPeriod.length} dagen gemarkeerd als betaald`
          });
        }
      }

      setStep('success');

      if (onPayslipProcessed) {
        onPayslipProcessed(payslip, extractedData.employer_name);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-[#0a0a0a]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.7)] w-full max-w-[600px] p-8 md:p-10 animate-in fade-in zoom-in duration-200 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 dark:text-[#6b7280] hover:text-gray-600 dark:hover:text-white transition-colors p-1"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Upload Step */}
        {step === 'upload' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <h3 className="font-display font-bold text-2xl text-[#1F2937] dark:text-white flex items-center gap-2">
                📄 Loonstrook Uploaden
              </h3>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-[#3a3a3a] rounded-2xl bg-gray-50 dark:bg-[#2a2a2a] p-10 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#10b981]/50 dark:hover:border-[#10b981]/50 transition-all group mb-8">
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-[#10b981] animate-spin" />
                  <p className="text-gray-600 dark:text-[#a1a1a1] font-medium">Loonstrook wordt gescand...</p>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <span className="material-symbols-outlined text-5xl text-[#10b981] drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">cloud_upload</span>
                  </div>
                  <p className="text-gray-600 dark:text-[#a1a1a1] text-base mb-6">
                    Upload je loonstrook (PDF of foto)
                  </p>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="payslip-upload"
                    onChange={handleFileUpload}
                  />

                  <label htmlFor="payslip-upload">
                    <span className="inline-flex items-center gap-2 bg-[#10b981] hover:bg-[#0da674] text-white dark:text-black font-bold px-8 py-3 rounded-xl cursor-pointer transition-colors shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                      Selecteer Bestand
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-[rgba(59,130,246,0.1)] border border-blue-200 dark:border-[#3b82f6]/30 rounded-2xl p-5 flex gap-4 items-start">
              <span className="material-symbols-outlined text-[#3b82f6] flex-shrink-0">lightbulb</span>
              <p className="text-sm text-blue-800 dark:text-[#a1a1a1] leading-relaxed">
                De AI leest automatisch: werkgever, periode, uren, uurloon en netto bedrag uit je loonstrook.
              </p>
            </div>
          </>
        )}

        {/* Review Step */}
        {step === 'review' && extractedData && (
          <>
            {/* Header */}
            <div className="mb-6">
              <h3 className="font-display font-bold text-2xl text-[#1F2937] dark:text-white">
                Controleer Gegevens
              </h3>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 dark:bg-[#10b981]/10 border border-green-200 dark:border-[#10b981]/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-[#34d399] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Loonstrook succesvol gescand! Controleer de gegevens:
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Werkgever */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Werkgever</label>
                <input
                  type="text"
                  value={extractedData.employer_name || ''}
                  onChange={(e) => setExtractedData({...extractedData, employer_name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                />
                {extractedData.employer_name && !employers.includes(extractedData.employer_name) && (
                  <p className="text-xs text-blue-600 dark:text-[#3b82f6]">
                    ✨ Deze werkgever wordt automatisch toegevoegd aan je lijst
                  </p>
                )}
              </div>

              {/* Periode */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Periode van</label>
                  <input
                    type="date"
                    value={extractedData.period_start || ''}
                    onChange={(e) => setExtractedData({...extractedData, period_start: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Periode tot</label>
                  <input
                    type="date"
                    value={extractedData.period_end || ''}
                    onChange={(e) => setExtractedData({...extractedData, period_end: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* Uitbetalingsdatum */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Uitbetalingsdatum</label>
                <input
                  type="date"
                  value={extractedData.payment_date || ''}
                  onChange={(e) => setExtractedData({...extractedData, payment_date: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                />
              </div>

              {/* Uren & Uurloon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Gewerkte uren</label>
                  <input
                    type="number"
                    step="0.5"
                    value={extractedData.total_hours || ''}
                    onChange={(e) => setExtractedData({...extractedData, total_hours: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Uurloon (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.hourly_rate || ''}
                    onChange={(e) => setExtractedData({...extractedData, hourly_rate: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* Bruto & Netto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Bruto loon (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.gross_amount || ''}
                    onChange={(e) => setExtractedData({...extractedData, gross_amount: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Netto loon (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.net_amount || ''}
                    onChange={(e) => setExtractedData({...extractedData, net_amount: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-bold text-[#10b981] focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
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
                onClick={handleSavePayslip}
                disabled={processing}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#10b981] hover:bg-[#0da674] text-white dark:text-black font-bold text-sm shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="mb-6">
              <CheckCircle2 className="w-20 h-20 mx-auto text-[#10b981] drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
            </div>
            <h3 className="text-2xl font-display font-bold text-[#1F2937] dark:text-white mb-3">
              Loonstrook Verwerkt!
            </h3>
            <p className="text-gray-600 dark:text-[#a1a1a1] mb-6">
              Je werkdagen zijn bijgewerkt en gemarkeerd als betaald.
            </p>
            {extractedData?.payment_date && (
              <p className="text-sm text-gray-500 dark:text-[#6b7280] mb-6 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                Uitbetaling: {new Date(extractedData.payment_date).toLocaleDateString('nl-NL')}
              </p>
            )}
            <button
              onClick={handleClose}
              className="px-10 py-3 rounded-xl bg-[#10b981] hover:bg-[#0da674] text-white dark:text-black font-bold text-sm shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
