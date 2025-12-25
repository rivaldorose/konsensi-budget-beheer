import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/utils/LanguageContext';
import { X, CheckCircle, Lightbulb, Info } from 'lucide-react';

const Section = ({ icon, title, children }) => (
  <div className="mt-4">
    <h3 className="font-bold text-base flex items-center gap-2 mb-2">
      <span className="text-xl">{icon}</span>
      {title}
    </h3>
    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
      {children}
    </ul>
  </div>
);

const BenefitItem = ({ children }) => (
    <li className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
        <span className="text-gray-700">{children}</span>
    </li>
);

export default function CentVoorCentInfoModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="w-6 h-6 text-green-600" />
            {t('infoModal.centVoorCent.title', { defaultValue: 'Wat is Cent voor Cent?' })}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t('infoModal.centVoorCent.intro', { defaultValue: 'Cent voor Cent is je maandelijkse kasboek. Het geeft een compleet overzicht van wat er in een maand binnenkomt en uitgaat.' })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <hr/>
            <h2 className="font-semibold text-gray-800 uppercase tracking-wide text-sm">{t('infoModal.centVoorCent.whatYouSeeTitle', { defaultValue: 'Wat zie je hier?' })}</h2>

            <Section icon="💰" title={t('infoModal.centVoorCent.incomeTitle', { defaultValue: 'Inkomen' })}>
                <li><strong>{t('infoModal.centVoorCent.incomeTotalTitle', { defaultValue: 'Totaal Inkomen' })}:</strong> {t('infoModal.centVoorCent.incomeTotalDesc', { defaultValue: 'Vast + Extra inkomsten deze maand' })}</li>
                <li><strong>{t('infoModal.centVoorCent.incomeFixedTitle', { defaultValue: 'Vast Inkomen' })}:</strong> {t('infoModal.centVoorCent.incomeFixedDesc', { defaultValue: 'Je stabiele maandinkomen' })}</li>
                <li><strong>{t('infoModal.centVoorCent.incomeExtraTitle', { defaultValue: 'Extra Inkomen' })}:</strong> {t('infoModal.centVoorCent.incomeExtraDesc', { defaultValue: 'Eenmalige meevallers' })}</li>
            </Section>

            <Section icon="💳" title={t('infoModal.centVoorCent.expensesTitle', { defaultValue: 'Uitgaven' })}>
                 <li><strong>{t('infoModal.centVoorCent.expensesFixedTitle', { defaultValue: 'Vaste Lasten' })}:</strong> {t('infoModal.centVoorCent.expensesFixedDesc', { defaultValue: 'Al je terugkerende kosten' })}</li>
                <li><strong>{t('infoModal.centVoorCent.expensesSavedTitle', { defaultValue: 'Gespaard' })}:</strong> {t('infoModal.centVoorCent.expensesSavedDesc', { defaultValue: 'Wat je overhoudt (Inkomen - Uitgaven - Potjes)' })}</li>
            </Section>

            <Section icon="🏺" title="Potjes">
                <li><strong>Potjes Budget:</strong> Totaal maandelijks budget dat je hebt ingesteld voor al je potjes</li>
                <li><strong>Uitgegeven:</strong> Hoeveel je daadwerkelijk hebt uitgegeven aan je potjes deze maand</li>
                <li><strong>Overblijvend:</strong> Het verschil tussen budget en uitgaven (positief = bespaard, negatief = overschrijding)</li>
                <li className="text-xs text-gray-500 mt-2">💡 Potjes helpen je variabele uitgaven zoals boodschappen, uitjes en vervoer beter te beheren</li>
            </Section>

            <Section icon="📉" title={t('infoModal.centVoorCent.debtsTitle', { defaultValue: 'Schulden' })}>
                <li><strong>{t('infoModal.centVoorCent.debtsTotalTitle', { defaultValue: 'Totale Schuld' })}:</strong> {t('infoModal.centVoorCent.debtsTotalDesc', { defaultValue: 'Openstaand bedrag van al je schulden' })}</li>
                <li><strong>{t('infoModal.centVoorCent.debtsPaidTitle', { defaultValue: 'Betaald deze maand' })}:</strong> {t('infoModal.centVoorCent.debtsPaidDesc', { defaultValue: 'Totaal afgelost deze maand' })}</li>
                <li><strong>Extra Aflossingen:</strong> Bedrag bovenop de minimale maandbetalingen</li>
            </Section>
            
            <hr className="mt-6"/>
            <h2 className="font-semibold text-gray-800 uppercase tracking-wide text-sm pt-2">{t('infoModal.centVoorCent.whyUsefulTitle', { defaultValue: 'Waarom is dit handig?' })}</h2>

            <ul className="space-y-2 text-sm pt-2">
                <BenefitItem>{t('infoModal.centVoorCent.benefit1', { defaultValue: 'Zie in één oogopslag je financiële situatie' })}</BenefitItem>
                <BenefitItem>{t('infoModal.centVoorCent.benefit2', { defaultValue: 'Vergelijk maanden om je voortgang te volgen' })}</BenefitItem>
                <BenefitItem>{t('infoModal.centVoorCent.benefit3', { defaultValue: 'Check of je genoeg overhoudt na vaste lasten' })}</BenefitItem>
                <BenefitItem>Zie precies hoe je je potjes budget beheert en waar je kunt besparen</BenefitItem>
                <BenefitItem>{t('infoModal.centVoorCent.benefit4', { defaultValue: 'Volg hoeveel je aflost op schulden' })}</BenefitItem>
            </ul>
            
             <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">📅 Automatisch Rapport</p>
                    <p>Dit rapport wordt elke 1e van de maand automatisch voor je gegenereerd. Je krijgt een notificatie zodra het klaar is!</p>
                </div>
            </div>

        </div>

        <DialogFooter>
          <Button onClick={onClose}>{t('common.close', { defaultValue: 'Sluiten' })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}