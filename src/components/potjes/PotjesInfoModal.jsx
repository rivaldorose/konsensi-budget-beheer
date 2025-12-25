import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, PiggyBank, Lightbulb, AlertTriangle, Calculator, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/components/utils/formatters';

const Section = ({ icon, title, children }) => (
  <div className="mb-6">
    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-3">
      {React.cloneElement(icon, { className: "w-5 h-5" })}
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const CategoryCard = ({ name, percentage, example }) => (
    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-900">{name}</h4>
            <span className="text-lg font-bold text-green-600">{percentage}%</span>
        </div>
        <p className="text-xs text-gray-600">{example}</p>
    </div>
);

export default function PotjesInfoModal({ isOpen, onClose, notifications }) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    // NIBUD categorieën met voorbeelden
    const nibudCategories = [
        { name: 'Wonen', percentage: 35, example: 'Huur, hypotheek, onderhoud' },
        { name: 'Eten & Drinken', percentage: 15, example: 'Boodschappen, maaltijden' },
        { name: 'Sparen/Buffer', percentage: 12, example: 'Noodfonds, grote aankopen' },
        { name: 'Vervoer', percentage: 10, example: 'Auto, OV, brandstof' },
        { name: 'Uitgaan', percentage: 8, example: 'Restaurant, entertainment' },
        { name: 'Zorg', percentage: 6, example: 'Medicijnen, zorgkosten' },
        { name: 'Energie', percentage: 5, example: 'Gas, water, licht' },
        { name: 'Kleding', percentage: 5, example: 'Kleding, schoenen' },
        { name: 'Telefoon/Internet', percentage: 3, example: 'Abonnementen' },
        { name: 'Overig', percentage: 1, example: 'Onverwachte kosten' },
    ];

    const exampleIncome = 2000;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                 <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <BookOpen className="w-6 h-6 text-blue-500" />
                        Over Potjes & de NIBUD-methode
                    </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="py-4">
                        <Section icon={<PiggyBank className="text-green-500"/>} title="Wat is de NIBUD-methode?">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Het NIBUD (Nationaal Instituut voor Budgetvoorlichting) heeft op basis van jarenlang onderzoek 
                                bepaald hoeveel Nederlandse huishoudens gemiddeld uitgeven per categorie. Deze percentages 
                                helpen jou om je budget realistisch in te delen.
                            </p>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-3">
                                <div className="flex items-start gap-3">
                                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-sm text-blue-900 mb-1">Zo werkt het:</p>
                                        <p className="text-xs text-blue-800">
                                            Elk potje krijgt een percentage van jouw <strong>maandinkomen</strong>. 
                                            Konsensi rekent automatisch uit hoeveel euro dat is, zodat jij niet hoeft te rekenen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section icon={<TrendingUp className="text-purple-500"/>} title="NIBUD Budget Categorieën">
                            <p className="text-sm text-gray-600 mb-3">
                                Hieronder zie je de standaard NIBUD-percentages. Bij een inkomen van 
                                <strong> {formatCurrency(exampleIncome, { decimals: 0 })}</strong> zou dit betekenen:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {nibudCategories.map((cat, idx) => (
                                    <CategoryCard 
                                        key={idx}
                                        name={cat.name}
                                        percentage={cat.percentage}
                                        example={cat.example}
                                    />
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-900">
                                    <strong>💡 Let op:</strong> Bij een inkomen van {formatCurrency(exampleIncome, { decimals: 0 })} 
                                    zou je bijvoorbeeld {formatCurrency((exampleIncome * 0.15), { decimals: 0 })} per maand kunnen 
                                    besteden aan Eten & Drinken (15%), en {formatCurrency((exampleIncome * 0.05), { decimals: 0 })} 
                                    aan Kleding (5%).
                                </p>
                            </div>
                        </Section>

                        <Section icon={<Lightbulb className="text-amber-500"/>} title="Tips voor gebruik">
                           <ul className="list-none space-y-3 text-sm text-gray-700">
                               <li className="flex items-start gap-2">
                                   <span className="text-green-500 font-bold mt-0.5">✓</span>
                                   <span><strong>Het zijn richtlijnen:</strong> Jouw situatie kan afwijken. Gebruik de NIBUD-percentages als startpunt en pas aan waar nodig.</span>
                               </li>
                               <li className="flex items-start gap-2">
                                   <span className="text-green-500 font-bold mt-0.5">✓</span>
                                   <span><strong>Automatisch berekend:</strong> Wanneer je een NIBUD-categorie kiest, berekent Konsensi automatisch het euro-bedrag op basis van jouw inkomen.</span>
                               </li>
                               <li className="flex items-start gap-2">
                                   <span className="text-green-500 font-bold mt-0.5">✓</span>
                                   <span><strong>Blijf flexibel:</strong> Je kunt elk bedrag handmatig aanpassen. Woon je goedkoper? Steek dat verschil in sparen of schulden aflossen.</span>
                               </li>
                               <li className="flex items-start gap-2">
                                   <span className="text-green-500 font-bold mt-0.5">✓</span>
                                   <span><strong>Check regelmatig:</strong> Evalueer maandelijks of je budgetten nog kloppen en pas aan waar nodig.</span>
                               </li>
                           </ul>
                        </Section>

                        {notifications && notifications.length > 0 && (
                            <Section icon={<AlertTriangle className="text-yellow-500"/>} title="Actuele Waarschuwingen">
                                {notifications.map(notif => (
                                    <div key={notif.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="font-semibold text-sm text-yellow-800">{notif.title}</p>
                                        <p className="text-xs text-yellow-700 mt-1">{notif.message}</p>
                                    </div>
                                ))}
                            </Section>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4 border-t">
                    <Button onClick={onClose}>Begrepen</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}