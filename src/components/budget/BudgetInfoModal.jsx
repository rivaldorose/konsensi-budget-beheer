import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    PieChart, 
    PiggyBank,
    Calculator,
    Lightbulb,
    Target
} from 'lucide-react';

export default function BudgetInfoModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-green-600" />
                        Hoe werkt het Budgetplan?
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Introductie */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800">
                            📊 Het budgetplan geeft je een overzicht van je financiën en helpt je om grip te krijgen op je geld.
                        </p>
                    </div>

                    {/* Uitleg secties */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Inkomsten</h3>
                                <p className="text-sm text-gray-600">
                                    Je totale inkomsten deze maand, inclusief salaris, uitkeringen en extra inkomsten.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Uitgaven</h3>
                                <p className="text-sm text-gray-600">
                                    Al je vaste lasten (huur, verzekeringen, abonnementen) plus eventuele betalingsregelingen voor schulden.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calculator className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Saldo</h3>
                                <p className="text-sm text-gray-600">
                                    Wat er overblijft na aftrek van vaste lasten. Dit bedrag kun je verdelen over je potjes.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <PiggyBank className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Potjes</h3>
                                <p className="text-sm text-gray-600">
                                    Verdeel je saldo over verschillende categorieën zoals boodschappen, vervoer en vrije tijd.
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
                                    <li>• Houd je uitgaven bij via de "Scan bon" functie</li>
                                    <li>• Bekijk de AI-suggesties voor bespaartips</li>
                                    <li>• Check regelmatig je voortgang per potje</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabs uitleg */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            De tabbladen
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <span className="font-medium">📊 Overzicht:</span>
                                <span className="text-gray-600 ml-1">Zie je financiële situatie in één oogopslag</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <span className="font-medium">💰 Verdelen:</span>
                                <span className="text-gray-600 ml-1">Verdeel je budget over de potjes</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <span className="font-medium">📈 Voortgang:</span>
                                <span className="text-gray-600 ml-1">Bekijk hoeveel je per potje hebt uitgegeven</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <span className="font-medium">📅 Historie:</span>
                                <span className="text-gray-600 ml-1">Bekijk je financiële geschiedenis per maand</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}