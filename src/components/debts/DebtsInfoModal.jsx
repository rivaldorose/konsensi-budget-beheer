import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    CreditCard, 
    Target,
    Calculator,
    TrendingDown,
    Lightbulb,
    AlertCircle
} from 'lucide-react';

export default function DebtsInfoModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-orange-600" />
                        Hoe werkt Betaalachterstanden?
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-sm text-orange-800">
                            💳 Hier beheer je al je schulden en betaalachterstanden. Registreren is de eerste stap naar grip op je financiën!
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Schulden registreren</h3>
                                <p className="text-sm text-gray-600">
                                    Voeg je schulden toe met schuldeiser, bedrag en status. Je kunt ook persoonlijke leningen apart bijhouden.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Target className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Aflosstrategie</h3>
                                <p className="text-sm text-gray-600">
                                    Kies een strategie: <strong>Sneeuwbal</strong> (kleinste schuld eerst) of <strong>Lawine</strong> (hoogste rente eerst) om sneller schuldenvrij te worden.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calculator className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">VTLB / Afloscapaciteit</h3>
                                <p className="text-sm text-gray-600">
                                    Bereken hoeveel je maandelijks kunt aflossen. Dit helpt bij het opzetten van betalingsregelingen.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Status bijhouden</h3>
                                <p className="text-sm text-gray-600">
                                    Houd de status bij: Niet actief, Wachtend, Betalingsregeling of Afbetaald. Zo zie je je voortgang!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-1">Tips</h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Begin met alle schulden te registreren - ook kleine bedragen</li>
                                    <li>• Neem contact op met schuldeisers voor een betalingsregeling</li>
                                    <li>• Betaal altijd minimaal het afgesproken bedrag</li>
                                    <li>• Vier elke afbetaalde schuld - je doet het goed!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}