import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, AlertTriangle, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import { vtblService } from '@/components/services';
import { createPageUrl } from '@/utils';

// Helper component for displaying a line item in the calculation
const CalculationRow = ({ label, value, isTotal = false, isSubtle = false, tooltip }) => (
    <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t mt-2 pt-3 font-bold' : ''} ${isSubtle ? 'text-sm text-gray-600' : 'text-base'}`}>
        <span title={tooltip}>{label}</span>
        <span className={isTotal ? 'text-lg' : ''}>€{value.toFixed(2)}</span>
    </div>
);

export default function VTLBCalculator() {
    const [vtblData, setVtblData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { t } = useTranslation();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await vtblService.calculateVtbl();
            setVtblData(result);
        } catch (error) {
            console.error("Error calculating VTBL:", error);
            toast({
                title: "Fout bij berekenen",
                description: "Kon de VTBL-gegevens niet ophalen.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!vtblData) {
        return (
            <div className="p-6 text-center">
                 <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Berekening niet beschikbaar</h2>
                <p className="text-gray-600">We konden je financiële ruimte niet berekenen. Controleer of je inkomen en vaste lasten zijn ingevuld.</p>
            </div>
        );
    }

    const { vastInkomen, vasteLasten, huidigeRegelingen, beschikbaar, tussenlasten, buffer, aflosCapaciteit } = vtblData;
    const hasCapacity = aflosCapaciteit > 0;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            <Button 
                variant="ghost" 
                onClick={() => window.location.href = createPageUrl('Debts')}
                className="mb-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar Betaalachterstanden
            </Button>
            
            <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold">Jouw Financiële Ruimte</h1>
                <p className="text-gray-600 mt-1">Dit is de basis voor elk betalingsvoorstel.</p>
            </div>

            <Card className={`border-2 ${hasCapacity ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        {hasCapacity ? <CheckCircle className="text-green-600" /> : <AlertTriangle className="text-red-600" />}
                        <span>Je Afloscapaciteit per maand</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-4xl font-bold text-center mb-2 ${hasCapacity ? 'text-green-700' : 'text-red-700'}`}>
                        €{aflosCapaciteit.toFixed(2)}
                    </p>
                    <p className="text-center text-sm text-gray-700">
                        {hasCapacity
                            ? "Dit is het bedrag dat je maandelijks realistisch kunt gebruiken om je schulden af te lossen."
                            : "Je hebt momenteel geen ruimte om schulden af te lossen. Richt je op het verlagen van kosten."}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Hoe komen we hieraan?</CardTitle>
                    <CardDescription>Deze berekening is gebaseerd op de gegevens die je hebt ingevuld.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">1. Berekening van je vrije budget</h3>
                        <div className="p-4 rounded-lg bg-gray-50 border">
                            <CalculationRow label="✅ Vast inkomen" value={vastInkomen} />
                            <CalculationRow label="❌ Vaste lasten" value={vasteLasten * -1} />
                            <CalculationRow label="❌ Huidige betalingsregelingen" value={huidigeRegelingen * -1} />
                            <CalculationRow label="Beschikbaar voor budget" value={beschikbaar} isTotal={true} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">2. Verdeling van je vrije budget</h3>
                         <div className="p-4 rounded-lg bg-gray-50 border">
                            <CalculationRow label="🛒 Boodschappen & overige lasten (60%)" value={tussenlasten} isSubtle={true} tooltip="Voor eten, vervoer, kleding, etc." />
                            <CalculationRow label="🐷 Buffer & Sparen (25%)" value={buffer} isSubtle={true} tooltip="Voor onverwachte kosten en spaardoelen." />
                            <CalculationRow label="💡 Jouw Afloscapaciteit (15%)" value={aflosCapaciteit} isTotal={true} tooltip="Dit bedrag is beschikbaar voor schuldeisers." />
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-shrink-0">
                        <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-semibold text-blue-900">Klopt de berekening niet?</h3>
                        <p className="text-sm text-blue-800">
                            Deze berekening is gebaseerd op je ingevulde inkomen, vaste lasten en woonsituatie. Pas deze aan voor een accurate berekening.
                        </p>
                    </div>
                    <Button onClick={() => window.location.href = createPageUrl('Settings')}>
                        Gegevens aanpassen
                    </Button>
                </CardContent>
            </Card>

             <div className="text-center text-xs text-gray-500 pt-4">
                <p>
                    Deze berekening is een vereenvoudigde versie gebaseerd op de VTBL-normen.
                    <a href="https://www.bureauwsnp.nl/wsnp/vtlb-calculator.aspx" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
                        Officiële calculator <ExternalLink className="inline w-3 h-3"/>
                    </a>
                </p>
            </div>
        </div>
    );
}