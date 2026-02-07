import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/utils/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/components/utils/formatters';

const Section = ({ icon, title, children }) => (
  <div className="mb-6">
    <h3 className="flex items-center gap-2 font-bold text-[#131d0c] dark:text-text-primary mb-3">
      <span className="material-symbols-outlined !text-[20px]">{icon}</span>
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const CategoryCard = ({ name, percentage, example, color }) => (
  <div className={`p-3 rounded-xl border ${color}`}>
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-semibold text-sm text-[#131d0c] dark:text-text-primary">{name}</h4>
      <span className="text-lg font-bold text-primary dark:text-primary-green">{percentage}%</span>
    </div>
    <p className="text-xs text-gray-600 dark:text-text-tertiary">{example}</p>
  </div>
);

export default function PotjesInfoModal({ isOpen, onClose, notifications }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // NIBUD categorieën met voorbeelden en kleuren
  const nibudCategories = [
    { name: 'Wonen', percentage: 35, example: 'Huur, hypotheek, onderhoud', color: 'bg-blue-50 dark:bg-accent-blue/10 border-blue-200 dark:border-accent-blue/20' },
    { name: 'Eten & Drinken', percentage: 15, example: 'Boodschappen, maaltijden', color: 'bg-green-50 dark:bg-primary-green/10 border-green-200 dark:border-primary-green/20' },
    { name: 'Sparen/Buffer', percentage: 12, example: 'Noodfonds, grote aankopen', color: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
    { name: 'Vervoer', percentage: 10, example: 'Auto, OV, brandstof', color: 'bg-purple-50 dark:bg-accent-purple/10 border-purple-200 dark:border-accent-purple/20' },
    { name: 'Uitgaan', percentage: 8, example: 'Restaurant, entertainment', color: 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' },
    { name: 'Zorg', percentage: 6, example: 'Medicijnen, zorgkosten', color: 'bg-red-50 dark:bg-accent-red/10 border-red-200 dark:border-accent-red/20' },
    { name: 'Energie', percentage: 5, example: 'Gas, water, licht', color: 'bg-orange-50 dark:bg-accent-orange/10 border-orange-200 dark:border-accent-orange/20' },
    { name: 'Kleding', percentage: 5, example: 'Kleding, schoenen', color: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' },
    { name: 'Telefoon/Internet', percentage: 3, example: 'Abonnementen', color: 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' },
    { name: 'Overig', percentage: 1, example: 'Onverwachte kosten', color: 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20' },
  ];

  const exampleIncome = 2000;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl text-[#131d0c] dark:text-text-primary">
            <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue !text-[24px]">menu_book</span>
            Over Potjes & de NIBUD-methode
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4 overflow-y-auto">
          <div className="py-4">
            <Section icon="savings" title="Wat is de NIBUD-methode?">
              <p className="text-sm text-gray-700 dark:text-text-secondary leading-relaxed">
                Het NIBUD (Nationaal Instituut voor Budgetvoorlichting) heeft op basis van jarenlang onderzoek
                bepaald hoeveel Nederlandse huishoudens gemiddeld uitgeven per categorie. Deze percentages
                helpen jou om je budget realistisch in te delen.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-accent-blue/10 border border-blue-200 dark:border-accent-blue/20 rounded-xl mt-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue !text-[20px] mt-0.5 flex-shrink-0">calculate</span>
                  <div>
                    <p className="font-semibold text-sm text-blue-900 dark:text-accent-blue mb-1">Zo werkt het:</p>
                    <p className="text-xs text-blue-800 dark:text-text-secondary">
                      Elk potje krijgt een percentage van jouw <strong className="dark:text-text-primary">maandinkomen</strong>.
                      Konsensi rekent automatisch uit hoeveel euro dat is, zodat jij niet hoeft te rekenen.
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            <Section icon="trending_up" title="NIBUD Budget Categorieën">
              <p className="text-sm text-gray-600 dark:text-text-secondary mb-3">
                Hieronder zie je de standaard NIBUD-percentages. Bij een inkomen van
                <strong className="text-[#131d0c] dark:text-text-primary"> {formatCurrency(exampleIncome, { decimals: 0 })}</strong> zou dit betekenen:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nibudCategories.map((cat, idx) => (
                  <CategoryCard
                    key={idx}
                    name={cat.name}
                    percentage={cat.percentage}
                    example={cat.example}
                    color={cat.color}
                  />
                ))}
              </div>

              <div className="mt-4 p-4 bg-amber-50 dark:bg-accent-orange/10 border border-amber-200 dark:border-accent-orange/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-accent-orange !text-[18px] mt-0.5">lightbulb</span>
                  <p className="text-sm text-amber-900 dark:text-text-secondary">
                    <strong className="text-amber-900 dark:text-accent-orange">Let op:</strong> Bij een inkomen van {formatCurrency(exampleIncome, { decimals: 0 })}
                    zou je bijvoorbeeld {formatCurrency((exampleIncome * 0.15), { decimals: 0 })} per maand kunnen
                    besteden aan Eten & Drinken (15%), en {formatCurrency((exampleIncome * 0.05), { decimals: 0 })}
                    aan Kleding (5%).
                  </p>
                </div>
              </div>
            </Section>

            <Section icon="tips_and_updates" title="Tips voor gebruik">
              <ul className="list-none space-y-3 text-sm text-gray-700 dark:text-text-secondary">
                <li className="flex items-start gap-3 p-3 bg-green-50 dark:bg-primary-green/5 rounded-xl border border-green-100 dark:border-primary-green/10">
                  <span className="material-symbols-outlined text-primary dark:text-primary-green !text-[20px] mt-0.5 flex-shrink-0">check_circle</span>
                  <span><strong className="text-[#131d0c] dark:text-text-primary">Het zijn richtlijnen:</strong> Jouw situatie kan afwijken. Gebruik de NIBUD-percentages als startpunt en pas aan waar nodig.</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-accent-blue/5 rounded-xl border border-blue-100 dark:border-accent-blue/10">
                  <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue !text-[20px] mt-0.5 flex-shrink-0">auto_awesome</span>
                  <span><strong className="text-[#131d0c] dark:text-text-primary">Automatisch berekend:</strong> Wanneer je een NIBUD-categorie kiest, berekent Konsensi automatisch het euro-bedrag op basis van jouw inkomen.</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-accent-purple/5 rounded-xl border border-purple-100 dark:border-accent-purple/10">
                  <span className="material-symbols-outlined text-accent-purple dark:text-accent-purple !text-[20px] mt-0.5 flex-shrink-0">swap_horiz</span>
                  <span><strong className="text-[#131d0c] dark:text-text-primary">Blijf flexibel:</strong> Je kunt elk bedrag handmatig aanpassen. Woon je goedkoper? Steek dat verschil in sparen of schulden aflossen.</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-accent-orange/5 rounded-xl border border-orange-100 dark:border-accent-orange/10">
                  <span className="material-symbols-outlined text-accent-orange dark:text-accent-orange !text-[20px] mt-0.5 flex-shrink-0">calendar_month</span>
                  <span><strong className="text-[#131d0c] dark:text-text-primary">Check regelmatig:</strong> Evalueer maandelijks of je budgetten nog kloppen en pas aan waar nodig.</span>
                </li>
              </ul>
            </Section>

            {notifications && notifications.length > 0 && (
              <Section icon="warning" title="Actuele Waarschuwingen">
                <div className="space-y-2">
                  {notifications.map((notif, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 dark:bg-accent-yellow/10 border border-yellow-200 dark:border-accent-yellow/20 rounded-xl">
                      <p className="font-semibold text-sm text-yellow-800 dark:text-accent-yellow">{notif.title || notif.type}</p>
                      <p className="text-xs text-yellow-700 dark:text-text-secondary mt-1">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-gray-100 dark:border-dark-border">
          <Button
            onClick={onClose}
            className="bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold px-6 py-2 rounded-xl"
          >
            Begrepen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
