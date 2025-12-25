import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Award, Shield, ThumbsUp, BrainCircuit, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { formatCurrency } from '@/components/utils/formatters';

export default function AvalancheExplanationModal({ isOpen, onClose, budget, strategyResult, savings }) {
    const { t } = useTranslation();

    const firstDebt = strategyResult?.schedule[0];
    const secondDebt = strategyResult?.schedule[1];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">⚡</span> {t('strategy.avalanche.title')}
                    </DialogTitle>
                    <DialogDescription>{t('strategy.explanation.subtitle')}</DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full"><X className="h-4 w-4" /></Button>
                </DialogClose>

                <div className="max-h-[75vh] overflow-y-auto px-6 pb-6 space-y-6 text-gray-800">
                    <section>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><ThumbsUp className="text-purple-500"/> {t('strategy.explanation.whatIsIt.title')}</h3>
                        <p className="text-sm leading-relaxed">{t('strategy.explanation.avalanche.whatIsIt.p1')}</p>
                        <p className="text-sm leading-relaxed mt-2">{t('strategy.explanation.avalanche.whatIsIt.p2')}</p>
                    </section>

                    {strategyResult && (
                        <section className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><BrainCircuit className="text-purple-500"/> {t('strategy.explanation.yourSituation.title')}</h3>
                            <p className="text-sm mb-4">{t('strategy.explanation.yourSituation.p1', { budget: formatCurrency(budget) })}</p>

                            <div className="space-y-4">
                                {firstDebt && (
                                    <div className="bg-white p-3 rounded-md shadow-sm">
                                        <p className="font-bold text-purple-800">{t('strategy.explanation.step1')}: {firstDebt.debt_name} ({formatCurrency(firstDebt.amount)})</p>
                                        <p className="text-xs text-gray-600 mt-1">{t('strategy.explanation.avalanche.step1.p1', { interest_rate: firstDebt.interest_rate, interest_cost: formatCurrency(firstDebt.amount * (firstDebt.interest_rate/100) / 12) })}</p>
                                        <p className="text-xs text-gray-600">{t('strategy.explanation.avalanche.step1.p2')}</p>
                                        <p className="text-xs text-gray-600">{t('strategy.explanation.avalanche.step1.p3', { months: firstDebt.months_to_payoff })}</p>
                                    </div>
                                )}
                                {secondDebt && (
                                     <div className="bg-white p-3 rounded-md shadow-sm">
                                        <p className="font-bold text-purple-800">{t('strategy.explanation.step2')}: {secondDebt.debt_name} ({formatCurrency(secondDebt.amount)})</p>
                                        <p className="text-xs text-gray-600 mt-1">{t('strategy.explanation.avalanche.step2.p1', { interest_rate: secondDebt.interest_rate })}</p>
                                        <p className="text-xs text-gray-600">{t('strategy.explanation.avalanche.step2.p2', { budget: formatCurrency(budget) })}</p>
                                        <p className="text-xs text-gray-600">{t('strategy.explanation.avalanche.step2.p3', { months: secondDebt.months_to_payoff })}</p>
                                    </div>
                                )}
                                <p className="text-xs text-center text-gray-500 pt-2">...{t('strategy.explanation.andSoOn', { count: strategyResult.schedule.length })}</p>
                            </div>
                        </section>
                    )}

                    <section>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Award className="text-green-500"/> {t('strategy.explanation.whySmart.title')}</h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            <li>{t('strategy.explanation.avalanche.whySmart.li1')}</li>
                            <li>{t('strategy.explanation.avalanche.whySmart.li2')}</li>
                            {savings > 0 && <li>{t('strategy.explanation.avalanche.whySmart.li3', { savings: formatCurrency(savings) })}</li>}
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Shield className="text-red-500"/> {t('strategy.explanation.disadvantage.title')}</h3>
                        <ul className="list-disc list-inside text-sm space-y-1">
                           <li>{t('strategy.explanation.avalanche.disadvantage.li1', { months: firstDebt?.months_to_payoff || 'enige' })}</li>
                           <li>{t('strategy.explanation.avalanche.disadvantage.li2')}</li>
                        </ul>
                    </section>

                     <section className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">{t('strategy.explanation.whichToChoose.title')}</h3>
                        <p className="text-sm mt-3"><strong>{t('strategy.explanation.chooseAvalancheIf.title')}</strong></p>
                        <ul className="list-disc list-inside text-sm space-y-1 pl-4">
                           <li>{t('strategy.explanation.chooseAvalancheIf.li1')}</li>
                           <li>{t('strategy.explanation.chooseAvalancheIf.li2')}</li>
                           <li>{t('strategy.explanation.chooseAvalancheIf.li3')}</li>
                        </ul>
                    </section>

                    <div className="text-center pt-4">
                        <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">{t('common.gotIt')}</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}