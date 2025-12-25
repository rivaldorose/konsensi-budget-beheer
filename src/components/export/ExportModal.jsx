
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { subMonths, format } from 'date-fns';
import { generateReport } from '@/api/functions';
import { useToast } from "@/components/ui/use-toast";

export default function ExportModal({ isOpen, onClose, pageTitle, defaultPeriod = 'current_month' }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [formatType, setFormatType] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const [customPeriod, setCustomPeriod] = useState({
    from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleDownload = async () => {
    if (formatType !== 'pdf') {
        toast({ title: "Functie nog niet beschikbaar", description: "Alleen PDF export wordt momenteel ondersteund.", variant: "destructive" });
        return;
    }

    setIsDownloading(true);
    try {
        let periodParams = {
            period,
            from: null,
            to: null,
            // Include report type based on pageTitle for the backend
            type: pageTitle.toLowerCase().replace(' ', '_'),
            format: formatType,
        };

        if (period === 'custom') {
            periodParams.from = customPeriod.from;
            periodParams.to = customPeriod.to;
        }

        const response = await generateReport(periodParams);

        if (!response || response.status !== 200 || !response.data) {
           throw new Error(`PDF generatie mislukt met status: ${response ? response.status : 'onbekend'}`);
        }

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Konsensi_Financieel_Overzicht_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        onClose();

    } catch (error) {
        console.error("Error generating or downloading report:", error);
        toast({
            title: "Download Mislukt",
            description: "Er is een fout opgetreden bij het maken van het rapport. Probeer het later opnieuw.",
            variant: "destructive",
        });
    } finally {
        setIsDownloading(false);
    }
  };

  const now = new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporteer: {pageTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Wat wil je exporteren?</Label>
            <RadioGroup value={period} onValueChange={setPeriod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current_month" id="p1" />
                <Label htmlFor="p1">Deze maand ({format(now, 'MMMM')})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last_3_months" id="p2" />
                <Label htmlFor="p2">Afgelopen 3 maanden</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last_6_months" id="p3" />
                <Label htmlFor="p3">Afgelopen 6 maanden</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current_year" id="p4" />
                <Label htmlFor="p4">Heel jaar ({format(now, 'yyyy')})</Label>
              </div>
               <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="p5" />
                <Label htmlFor="p5">Alles</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="p6" />
                <Label htmlFor="p6">Aangepaste periode</Label>
              </div>
            </RadioGroup>
            {period === "custom" && (
              <div className="grid grid-cols-2 gap-2 pl-6 pt-2">
                <div>
                  <Label htmlFor="from-date" className="text-xs">Van</Label>
                  <Input id="from-date" type="date" value={customPeriod.from} onChange={e => setCustomPeriod({...customPeriod, from: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="to-date" className="text-xs">Tot</Label>
                  <Input id="to-date" type="date" value={customPeriod.to} onChange={e => setCustomPeriod({...customPeriod, to: e.target.value})} />
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Formaat</Label>
            <RadioGroup value={formatType} onValueChange={setFormatType} className="flex gap-4">
              <Label htmlFor="f-pdf" className={`flex-1 p-3 border rounded-lg cursor-pointer ${formatType === 'pdf' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                   <FileText className="w-5 h-5 text-red-500" />
                   <div>
                     <p className="font-medium">PDF</p>
                     <p className="text-xs text-muted-foreground">Overzichtelijk rapport</p>
                   </div>
                   <RadioGroupItem value="pdf" id="f-pdf" className="ml-auto"/>
                </div>
              </Label>
              <Label htmlFor="f-excel" className={`flex-1 p-3 border rounded-lg cursor-pointer ${formatType === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                 <div className="flex items-center gap-3">
                   <FileSpreadsheet className="w-5 h-5 text-green-700" />
                   <div>
                     <p className="font-medium">Excel</p>
                     <p className="text-xs text-muted-foreground">Bewerkbaar overzicht (binnenkort)</p>
                   </div>
                   <RadioGroupItem value="excel" id="f-excel" className="ml-auto" disabled/>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isDownloading}>Annuleren</Button>
          <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700" disabled={isDownloading}>
            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
            {isDownloading ? "Rapport genereren..." : "Downloaden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
