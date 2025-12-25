import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Receipt, 
    Calendar,
    Tag,
    Lightbulb,
    AlertCircle
} from 'lucide-react';

export default function MonthlyCostsInfoModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-blue-600" />
                        Hoe werkt Vaste Lasten?
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            🏠 Hier beheer je al je maandelijkse vaste kosten. Dit helpt om te zien hoeveel geld er elke maand automatisch uitgaat.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Wat zijn vaste lasten?</h3>
                                <p className="text-sm text-gray-600">
                                    Kosten die elke maand terugkomen, zoals huur, energie, verzekeringen, abonnementen en streamingdiensten.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Betaaldag</h3>
                                <p className="text-sm text-gray-600">
                                    Vul de dag van de maand in waarop de betaling plaatsvindt. Zo krijg je herinneringen en een overzicht van aankomende betalingen.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Tag className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Categorieën</h3>
                                <p className="text-sm text-gray-600">
                                    Groepeer je kosten per categorie (wonen, utilities, verzekeringen, etc.) voor een duidelijk overzicht.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Start- en einddatum</h3>
                                <p className="text-sm text-gray-600">
                                    Gebruik start- en einddatum voor tijdelijke kosten of contracten die aflopen.
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
                                    <li>• Controleer regelmatig of je alle abonnementen nog gebruikt</li>
                                    <li>• Vergelijk jaarlijks je energie en verzekeringen</li>
                                    <li>• Gebruik de check-in functie om betalingen te bevestigen</li>
                                    <li>• Zet een einddatum bij proefabonnementen</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}