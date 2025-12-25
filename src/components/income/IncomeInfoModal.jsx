import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    TrendingUp, 
    Calendar,
    Repeat,
    Gift,
    Lightbulb,
    Clock
} from 'lucide-react';

export default function IncomeInfoModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        Hoe werkt Inkomsten?
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Introductie */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800">
                            💰 Hier beheer je al je inkomsten. Dit helpt om een goed overzicht te krijgen van wat er binnenkomt.
                        </p>
                    </div>

                    {/* Uitleg secties */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Repeat className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Vast Inkomen</h3>
                                <p className="text-sm text-gray-600">
                                    Terugkerend inkomen zoals salaris, uitkering of studiefinanciering. Dit wordt elke maand automatisch meegeteld.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Gift className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Extra Inkomen</h3>
                                <p className="text-sm text-gray-600">
                                    Eenmalige inkomsten zoals bonussen, cadeaus, verkoop of belastingteruggave. Dit telt alleen mee in de maand dat je het ontvangt.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Variabel Inkomen</h3>
                                <p className="text-sm text-gray-600">
                                    Als je inkomen elke maand anders is (bijv. oproepkracht), kun je dit aangeven. Je kunt dan elke maand het bedrag bijwerken.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Frequentie</h3>
                                <p className="text-sm text-gray-600">
                                    Geef aan hoe vaak je betaald wordt: wekelijks, tweewekelijks, vierwekelijks of maandelijks. Het maandbedrag wordt automatisch berekend.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 mb-1">Tips</h4>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Voeg al je inkomstenbronnen toe voor een volledig overzicht</li>
                                    <li>• Vergeet vakantiegeld en 13e maand niet!</li>
                                    <li>• Bij variabel inkomen: update regelmatig je bedrag</li>
                                    <li>• Scan je loonstrook om inkomen automatisch toe te voegen</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}