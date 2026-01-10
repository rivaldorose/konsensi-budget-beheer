import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { Payslip } from '@/api/entities';
import { WorkDay } from '@/api/entities';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
        await User.updateMyUserData({ employers: newEmployers });
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Loonstrook Uploaden
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                  <p className="text-gray-600">Loonstrook wordt gescand...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">Upload je loonstrook (PDF of foto)</p>
                  
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    id="payslip-upload"
                    onChange={handleFileUpload}
                  />
                  
                  <label htmlFor="payslip-upload">
                    <Button type="button" className="bg-green-600 hover:bg-green-700" asChild>
                      <span className="cursor-pointer">
                        📄 Selecteer Bestand
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 De AI leest automatisch: werkgever, periode, uren, uurloon en netto bedrag uit je loonstrook.
              </p>
            </div>
          </div>
        )}

        {step === 'review' && extractedData && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✅ Loonstrook succesvol gescand! Controleer de gegevens:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Werkgever</Label>
                <Input
                  value={extractedData.employer_name || ''}
                  onChange={(e) => setExtractedData({...extractedData, employer_name: e.target.value})}
                />
                {extractedData.employer_name && !employers.includes(extractedData.employer_name) && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✨ Deze werkgever wordt automatisch toegevoegd aan je lijst
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Periode van</Label>
                  <Input
                    type="date"
                    value={extractedData.period_start || ''}
                    onChange={(e) => setExtractedData({...extractedData, period_start: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Periode tot</Label>
                  <Input
                    type="date"
                    value={extractedData.period_end || ''}
                    onChange={(e) => setExtractedData({...extractedData, period_end: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Uitbetalingsdatum</Label>
                <Input
                  type="date"
                  value={extractedData.payment_date || ''}
                  onChange={(e) => setExtractedData({...extractedData, payment_date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gewerkte uren</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={extractedData.total_hours || ''}
                    onChange={(e) => setExtractedData({...extractedData, total_hours: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Uurloon (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extractedData.hourly_rate || ''}
                    onChange={(e) => setExtractedData({...extractedData, hourly_rate: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bruto loon (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extractedData.gross_amount || ''}
                    onChange={(e) => setExtractedData({...extractedData, gross_amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Netto loon (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extractedData.net_amount || ''}
                    onChange={(e) => setExtractedData({...extractedData, net_amount: parseFloat(e.target.value)})}
                    className="font-bold text-green-600"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Terug
              </Button>
              <Button 
                onClick={handleSavePayslip} 
                className="bg-green-600 hover:bg-green-700"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verwerken...
                  </>
                ) : (
                  '💾 Opslaan'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loonstrook Verwerkt!</h3>
            <p className="text-gray-600 mb-4">
              Je werkdagen zijn bijgewerkt en gemarkeerd als betaald.
            </p>
            {extractedData?.payment_date && (
              <p className="text-sm text-gray-500">
                📅 Uitbetaling: {new Date(extractedData.payment_date).toLocaleDateString('nl-NL')}
              </p>
            )}
            <Button onClick={handleClose} className="mt-4 bg-green-600 hover:bg-green-700">
              Sluiten
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}