
import React, { useState, useEffect, useMemo } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, AlertTriangle, ArrowLeft } from 'lucide-react';
import { berekenMaxIncasso } from '@/components/utils/debtCalculators';

const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const BreakdownRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">€{value.toFixed(2)}</span>
    </div>
);

export default function PartialRecognitionForm({ debt, onGenerateLetter, onBack }) {
    const hoofdsomGevorderd = debt.original_amount || 0;
    const renteGevorderd = debt.interest_costs || 0;
    const incassoGevorderd = debt.collection_costs || 0;
    const totaalGevorderd = debt.total_amount || 0;

    const [erkend, setErkend] = useState({
        hoofdsom: hoofdsomGevorderd,
        rente: renteGevorderd,
        incasso: incassoGevorderd,
    });
    
    const [keuzes, setKeuzes] = useState({
        hoofdsom: 'volledig',
        rente: 'volledig',
        incasso: 'volledig',
    });

    const [inputs, setInputs] = useState({
        hoofdsom: '',
        rente: '',
        incasso: '',
    });

    useEffect(() => {
        let nieuweErkenning = {}; // Corrected: Initialize as empty object to recalculate
        
        // Hoofdsom
        if (keuzes.hoofdsom === 'volledig') nieuweErkenning.hoofdsom = hoofdsomGevorderd;
        else if (keuzes.hoofdsom === 'gedeeltelijk') nieuweErkenning.hoofdsom = parseFloat(inputs.hoofdsom) || 0;
        else nieuweErkenning.hoofdsom = 0;

        // Rente
        if (keuzes.rente === 'volledig') nieuweErkenning.rente = renteGevorderd;
        else if (keuzes.rente === 'gedeeltelijk') nieuweErkenning.rente = parseFloat(inputs.rente) || 0;
        else nieuweErkenning.rente = 0;

        // Incasso
        if (keuzes.incasso === 'volledig') nieuweErkenning.incasso = incassoGevorderd;
        else if (keuzes.incasso === 'gedeeltelijk') nieuweErkenning.incasso = parseFloat(inputs.incasso) || 0;
        else nieuweErkenning.incasso = 0;

        setErkend(nieuweErkenning);
    }, [keuzes, inputs, hoofdsomGevorderd, renteGevorderd, incassoGevorderd]);

    const totaalErkend = useMemo(() => erkend.hoofdsom + erkend.rente + erkend.incasso, [erkend]);
    const totaalBetwist = useMemo(() => totaalGevorderd - totaalErkend, [totaalGevorderd, totaalErkend]);

    const handleKeuzeChange = (categorie, waarde) => {
        setKeuzes(prev => ({ ...prev, [categorie]: waarde }));
    };

    const handleInputChange = (categorie, waarde) => {
        setInputs(prev => ({ ...prev, [categorie]: waarde }));
    };

    const wettelijkMaxIncasso = useMemo(() => berekenMaxIncasso(hoofdsomGevorderd), [hoofdsomGevorderd]);
    
    const handleGenerate = () => {
        onGenerateLetter({
            gevorderd: {
                hoofdsom: hoofdsomGevorderd,
                rente: renteGevorderd,
                incasso: incassoGevorderd,
                totaal: totaalGevorderd,
            },
            erkend: {
                ...erkend,
                totaal: totaalErkend,
            },
            betwist: {
                hoofdsom: hoofdsomGevorderd - erkend.hoofdsom,
                rente: renteGevorderd - erkend.rente,
                incasso: incassoGevorderd - erkend.incasso,
                totaal: totaalBetwist,
            },
            keuzes,
            inputs,
        });
    };

    return (
        <div className="space-y-8 p-1">
            <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar keuze
            </Button>
            
            <Section title="Gevorderd door schuldeiser">
                <Card>
                    <CardContent className="p-4 space-y-2">
                        <BreakdownRow label="Hoofdsom" value={hoofdsomGevorderd} />
                        <BreakdownRow label="Rente" value={renteGevorderd} />
                        <BreakdownRow label="Incassokosten" value={incassoGevorderd} />
                        <div className="border-t my-2"></div>
                        <BreakdownRow label="Totaal gevorderd" value={totaalGevorderd} />
                    </CardContent>
                </Card>
            </Section>

            <Section title="Wat erken je?">
                 <RadioGroup onValueChange={(v) => handleKeuzeChange('hoofdsom', v)} value={keuzes.hoofdsom}>
                    <Label className="font-semibold">Hoofdsom</Label>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="volledig" id="h1" /><Label htmlFor="h1">Volledig (€{hoofdsomGevorderd.toFixed(2)})</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="gedeeltelijk" id="h2" /><Label htmlFor="h2">Gedeeltelijk:</Label><Input type="number" step="0.01" placeholder="Bedrag" className="h-8 w-28 ml-2" disabled={keuzes.hoofdsom !== 'gedeeltelijk'} value={inputs.hoofdsom} onChange={e => handleInputChange('hoofdsom', e.target.value)} /></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="niet" id="h3" /><Label htmlFor="h3">Niet</Label></div>
                </RadioGroup>

                <RadioGroup onValueChange={(v) => handleKeuzeChange('rente', v)} value={keuzes.rente}>
                    <Label className="font-semibold">Rente</Label>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="volledig" id="r1" /><Label htmlFor="r1">Volledig (€{renteGevorderd.toFixed(2)})</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="gedeeltelijk" id="r2" /><Label htmlFor="r2">Gedeeltelijk:</Label><Input type="number" step="0.01" placeholder="Bedrag" className="h-8 w-28 ml-2" disabled={keuzes.rente !== 'gedeeltelijk'} value={inputs.rente} onChange={e => handleInputChange('rente', e.target.value)} /></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="niet" id="r3" /><Label htmlFor="r3">Niet - Te hoog berekend</Label></div>
                </RadioGroup>

                <RadioGroup onValueChange={(v) => handleKeuzeChange('incasso', v)} value={keuzes.incasso}>
                    <Label className="font-semibold">Incassokosten</Label>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="volledig" id="i1" /><Label htmlFor="i1">Volledig (€{incassoGevorderd.toFixed(2)})</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="gedeeltelijk" id="i2" /><Label htmlFor="i2">Gedeeltelijk:</Label><Input type="number" step="0.01" placeholder="Bedrag" className="h-8 w-28 ml-2" disabled={keuzes.incasso !== 'gedeeltelijk'} value={inputs.incasso} onChange={e => handleInputChange('incasso', e.target.value)} /></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="niet" id="i3" /><Label htmlFor="i3">Niet - Boven wettelijk maximum</Label></div>
                </RadioGroup>
            </Section>

            <Section title="Jouw berekening">
                 <Card className="bg-gray-50 dark:bg-card-elevated">
                    <CardContent className="p-4 space-y-2">
                        <BreakdownRow label="Hoofdsom erkend" value={erkend.hoofdsom} />
                        <BreakdownRow label="Rente erkend" value={erkend.rente} />
                        <BreakdownRow label="Incasso erkend" value={erkend.incasso} />
                        <div className="border-t my-2"></div>
                        <div className="flex justify-between items-center text-base font-bold">
                            <span>Totaal erkend:</span>
                            <span className="text-green-600">€{totaalErkend.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between items-center text-base font-bold">
                            <span>Betwist bedrag:</span>
                            <span className="text-red-600">€{totaalBetwist.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </Section>
            
            <Section title="💡 Wettelijke maxima">
                 <Card variant="outline">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Check wettelijk maximum incassokosten</CardTitle>
                        <Calculator className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-2">Voor een hoofdsom van €{hoofdsomGevorderd.toFixed(2)}</p>
                        <div className="text-2xl font-bold">€{wettelijkMaxIncasso.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Volgens Besluit Incassokosten (BIK)</p>
                         {incassoGevorderd > wettelijkMaxIncasso && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-md text-xs flex items-start gap-2">
                               <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                               <span>De gevorderde incassokosten (€{incassoGevorderd.toFixed(2)}) zijn hoger dan het wettelijk maximum. Je kunt dit betwisten.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Section>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" onClick={onBack} className="flex-1">Vorige</Button>
                <Button onClick={handleGenerate} className="flex-1 bg-green-600 hover:bg-green-700">Genereer brief</Button>
            </div>
        </div>
    );
}
