import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:mime;base64, prefix
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
      // Convert file to base64 for AI processing
      const fileBase64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      // Get current user for storage path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Upload file to storage with user folder for RLS
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payslips')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue anyway - AI parsing is more important
      }

      // Get public URL if upload succeeded
      if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('payslips')
          .getPublicUrl(fileName);
        setFileUrl(publicUrl);
      }

      // Call parse-payslip Edge Function
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-payslip', {
        body: {
          fileBase64,
          mimeType,
          payslipId: null // We'll create the payslip after parsing
        }
      });

      if (parseError) {
        throw new Error(parseError.message || 'Kon loonstrook niet scannen');
      }

      if (parseResult.error) {
        throw new Error(parseResult.error);
      }

      if (parseResult.success && parseResult.data) {
        // Map the parsed data to our extended format
        const parsed = parseResult.data;
        const mapped = {
          employer_name: parsed.employer_name,
          period_start: parsed.period_start,
          period_end: parsed.period_end,
          payment_date: parsed.period_end, // Use end of period as payment date
          bruto_loon: parsed.gross_income || parsed.breakdown?.bruto_loon || 0,
          totaal_bruto: parsed.gross_income || parsed.breakdown?.bruto_loon || 0,
          loonheffing: parsed.tax_deductions || parsed.breakdown?.loonheffing || 0,
          pensioenpremie: parsed.pension_contribution || parsed.breakdown?.pensioen || 0,
          premie_ww: parsed.social_security ? parsed.social_security * 0.3 : 0, // Estimate
          premie_zvw: parsed.social_security ? parsed.social_security * 0.7 : 0, // Estimate
          totaal_inhoudingen: (parsed.tax_deductions || 0) + (parsed.social_security || 0) + (parsed.pension_contribution || 0) + (parsed.other_deductions || 0),
          netto_loon: parsed.net_income || parsed.breakdown?.netto_loon || 0,
          uren_gewerkt: parsed.hours_worked || 0,
          uurloon: parsed.hourly_rate || 0,
          calculation_explanation: parsed.calculation_explanation
        };

        setExtractedData(mapped);
        setStep('review');
        toast({ title: '✅ Loonstrook gescand!' });
      } else {
        throw new Error('Kon loonstrook niet lezen');
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
      // Get current user
      const { User } = await import('@/api/entities');
      const user = await User.me();

      // Voeg werkgever toe aan lijst als deze nog niet bestaat
      if (extractedData.employer_name && !employers.includes(extractedData.employer_name)) {
        const newEmployers = [...(user.employers || []), extractedData.employer_name];
        await User.updateMe({ employers: newEmployers });
      }

      // Save payslip with all extracted data
      const payslip = await Payslip.create({
        user_id: user.id,
        employer: extractedData.employer_name,
        period_start: extractedData.period_start,
        period_end: extractedData.period_end,
        pay_date: extractedData.payment_date,
        date: extractedData.payment_date, // Keep for backwards compatibility
        amount: extractedData.netto_loon || 0, // Keep for backwards compatibility
        file_url: fileUrl,

        // Bruto bedragen
        bruto_loon: extractedData.bruto_loon || 0,
        vakantiegeld: extractedData.vakantiegeld || 0,
        overwerkuren: extractedData.overwerkuren || 0,
        bonus: extractedData.bonus || 0,
        onregelmatigheidstoeslag: extractedData.onregelmatigheidstoeslag || 0,
        ploegentoeslag: extractedData.ploegentoeslag || 0,
        eindejaarsuitkering: extractedData.eindejaarsuitkering || 0,
        totaal_bruto: extractedData.totaal_bruto || extractedData.bruto_loon || 0,

        // Inhoudingen - Belastingen
        loonheffing: extractedData.loonheffing || 0,
        premie_volksverzekeringen: extractedData.premie_volksverzekeringen || 0,
        premie_ww: extractedData.premie_ww || 0,
        premie_wia: extractedData.premie_wia || 0,
        premie_zvw: extractedData.premie_zvw || 0,
        bijdrage_zvw: extractedData.bijdrage_zvw || 0,

        // Inhoudingen - Pensioen
        pensioenpremie: extractedData.pensioenpremie || 0,
        pensioenpremie_werkgever: extractedData.pensioenpremie_werkgever || 0,
        wga_premie: extractedData.wga_premie || 0,

        // Andere inhoudingen
        inhouding_reiskosten: extractedData.inhouding_reiskosten || 0,
        inhouding_lease: extractedData.inhouding_lease || 0,
        inhouding_telefoon: extractedData.inhouding_telefoon || 0,
        inhouding_loonbeslag: extractedData.inhouding_loonbeslag || 0,
        inhouding_studieschuld: extractedData.inhouding_studieschuld || 0,
        inhouding_alimentatie: extractedData.inhouding_alimentatie || 0,
        andere_inhoudingen: extractedData.andere_inhoudingen || 0,
        totaal_inhoudingen: extractedData.totaal_inhoudingen || 0,

        // Vergoedingen
        reiskostenvergoeding: extractedData.reiskostenvergoeding || 0,
        thuiswerkvergoeding: extractedData.thuiswerkvergoeding || 0,
        onkostenvergoeding: extractedData.onkostenvergoeding || 0,
        maaltijdvergoeding: extractedData.maaltijdvergoeding || 0,
        totaal_vergoedingen: extractedData.totaal_vergoedingen || 0,

        // Netto resultaat
        netto_loon: extractedData.netto_loon || 0,

        // Werk details
        uren_gewerkt: extractedData.uren_gewerkt || 0,
        uurloon: extractedData.uurloon || 0,
        contract_uren: extractedData.contract_uren || 0,

        // Belasting details
        loonheffingskorting: extractedData.loonheffingskorting !== false,
        heffingskorting_bedrag: extractedData.heffingskorting_bedrag || 0,
        arbeidskorting: extractedData.arbeidskorting || 0,

        // Cumulatieve jaar totalen
        cum_bruto_loon: extractedData.cum_bruto_loon || 0,
        cum_loonheffing: extractedData.cum_loonheffing || 0,
        cum_zvw: extractedData.cum_zvw || 0,

        // Status
        status: 'geverifieerd'
      });

      // Update workdays in this period to "gewerkt" and mark as paid
      if (extractedData.period_start && extractedData.period_end) {
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

            {/* Form Fields - Scrollable */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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

              {/* Uren & Uurloon */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Gewerkte uren</label>
                  <input
                    type="number"
                    step="0.5"
                    value={extractedData.uren_gewerkt || ''}
                    onChange={(e) => setExtractedData({...extractedData, uren_gewerkt: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Uurloon (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={extractedData.uurloon || ''}
                    onChange={(e) => setExtractedData({...extractedData, uurloon: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* BRUTO BEDRAGEN Section */}
              <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-4 mt-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-green-500">trending_up</span>
                  Bruto Bedragen
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Bruto loon</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.bruto_loon || ''}
                      onChange={(e) => setExtractedData({...extractedData, bruto_loon: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Vakantiegeld</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.vakantiegeld || ''}
                      onChange={(e) => setExtractedData({...extractedData, vakantiegeld: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Overwerk</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.overwerkuren || ''}
                      onChange={(e) => setExtractedData({...extractedData, overwerkuren: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Bonus</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.bonus || ''}
                      onChange={(e) => setExtractedData({...extractedData, bonus: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Totaal Bruto</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      €{Number(extractedData.totaal_bruto || extractedData.bruto_loon || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* INHOUDINGEN Section */}
              <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-4 mt-4">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-red-500">trending_down</span>
                  Inhoudingen
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Loonheffing</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.loonheffing || ''}
                      onChange={(e) => setExtractedData({...extractedData, loonheffing: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Pensioenpremie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.pensioenpremie || ''}
                      onChange={(e) => setExtractedData({...extractedData, pensioenpremie: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">Premie ZVW</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.premie_zvw || ''}
                      onChange={(e) => setExtractedData({...extractedData, premie_zvw: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-[#6b7280]">WW-premie</label>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.premie_ww || ''}
                      onChange={(e) => setExtractedData({...extractedData, premie_ww: parseFloat(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
                  {extractedData.inhouding_loonbeslag > 0 && (
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-xs text-red-500 dark:text-red-400 font-medium">⚠️ Loonbeslag</label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.inhouding_loonbeslag || ''}
                        onChange={(e) => setExtractedData({...extractedData, inhouding_loonbeslag: parseFloat(e.target.value)})}
                        className="w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Totaal Inhoudingen</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      -€{Number(extractedData.totaal_inhoudingen || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* VERGOEDINGEN Section (only if there are any) */}
              {(extractedData.reiskostenvergoeding > 0 || extractedData.thuiswerkvergoeding > 0 || extractedData.totaal_vergoedingen > 0) && (
                <div className="border-t border-gray-200 dark:border-[#3a3a3a] pt-4 mt-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-blue-500">payments</span>
                    Vergoedingen (netto)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-[#6b7280]">Reiskosten</label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.reiskostenvergoeding || ''}
                        onChange={(e) => setExtractedData({...extractedData, reiskostenvergoeding: parseFloat(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-[#6b7280]">Thuiswerk</label>
                      <input
                        type="number"
                        step="0.01"
                        value={extractedData.thuiswerkvergoeding || ''}
                        onChange={(e) => setExtractedData({...extractedData, thuiswerkvergoeding: parseFloat(e.target.value)})}
                        className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#1F2937] dark:text-white focus:ring-2 focus:ring-[#10b981] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NETTO RESULTAAT Section */}
              <div className="border-t-2 border-[#10b981] dark:border-[#10b981] pt-4 mt-4">
                <div className="p-4 bg-[#10b981]/10 dark:bg-[#10b981]/20 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Netto Loon</span>
                      <p className="text-xs text-gray-500 dark:text-[#6b7280]">Uit te betalen</p>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.netto_loon || ''}
                      onChange={(e) => setExtractedData({...extractedData, netto_loon: parseFloat(e.target.value)})}
                      className="w-32 bg-white dark:bg-[#1a1a1a] border-2 border-[#10b981] rounded-xl px-4 py-2 text-xl font-bold text-[#10b981] text-right focus:ring-2 focus:ring-[#10b981] outline-none"
                    />
                  </div>
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
