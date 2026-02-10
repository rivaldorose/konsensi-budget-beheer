
import React from 'react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/utils/LanguageContext";
import { Info, FileText, Bot, Send, Clock, CheckCircle, ChevronRight, X, Sparkles, Scale, BookOpen, MessageSquareWarning, ShieldCheck, CalendarX, Contact } from "lucide-react";

const Step = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);

const AccordionInfo = ({ icon, title, children }) => (
     <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 text-gray-500 flex items-center justify-center">
            {icon}
        </div>
        <div className="flex-1">
            <h4 className="font-medium text-gray-800">{title}</h4>
            <div className="text-sm text-gray-600 mt-2 space-y-2">
                {children}
            </div>
        </div>
    </div>
);

export default function PaymentPlanInfoModal({ isOpen, onClose, onStartPlan }) {
    const { t } = useTranslation();

    const steps = [
        { icon: <Scale className="w-5 h-5 text-purple-600" />, title: t('paymentInfoModal.step1Title'), description: t('paymentInfoModal.step1Desc') },
        { icon: <BookOpen className="w-5 h-5 text-blue-600" />, title: t('paymentInfoModal.step2Title'), description: t('paymentInfoModal.step2Desc') },
        { icon: <Sparkles className="w-5 h-5 text-yellow-500" />, title: t('paymentInfoModal.step3Title'), description: t('paymentInfoModal.step3Desc') },
        { icon: <Send className="w-5 h-5 text-green-600" />, title: t('paymentInfoModal.step4Title'), description: t('paymentInfoModal.step4Desc') },
        { icon: <Clock className="w-5 h-5 text-orange-600" />, title: t('paymentInfoModal.step5Title'), description: t('paymentInfoModal.step5Desc') },
        { icon: <CheckCircle className="w-5 h-5 text-teal-600" />, title: t('paymentInfoModal.step6Title'), description: t('paymentInfoModal.step6Desc') },
    ];
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        {t('paymentInfoModal.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    <p className="text-gray-700">{t('paymentInfoModal.intro')}</p>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-800 mb-4 uppercase text-sm tracking-wider">{t('paymentInfoModal.processTitle')}</h3>
                        <div className="space-y-4">
                            {steps.map((step, index) => <Step key={index} {...step} />)}
                        </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="vtbl">
                            <AccordionTrigger>{t('paymentInfoModal.accordionVtblTitle')}</AccordionTrigger>
                            <AccordionContent>
                                <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('paymentInfoModal.accordionVtblContent')) }} />
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="letters">
                            <AccordionTrigger>{t('paymentInfoModal.accordionLettersTitle')}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3">
                                    <AccordionInfo icon={<FileText />} title={t('paymentInfoModal.letterProposal')}> {t('paymentInfoModal.letterProposalDesc')} </AccordionInfo>
                                    <AccordionInfo icon={<ShieldCheck />} title={t('paymentInfoModal.letterRelief')}> {t('paymentInfoModal.letterReliefDesc')} </AccordionInfo>
                                    <AccordionInfo icon={<MessageSquareWarning />} title={t('paymentInfoModal.letterDispute')}> {t('paymentInfoModal.letterDisputeDesc')} </AccordionInfo>
                                    <AccordionInfo icon={<CalendarX />} title={t('paymentInfoModal.letterVerjaring')}> {t('paymentInfoModal.letterVerjaringDesc')} </AccordionInfo>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="rejected">
                            <AccordionTrigger>{t('paymentInfoModal.accordionRejectedTitle')}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3">
                                    <AccordionInfo icon={<Contact />} title={t('paymentInfoModal.rejectedOption1')}> {t('paymentInfoModal.rejectedOption1Desc')} </AccordionInfo>
                                    <AccordionInfo icon={<Bot />} title={t('paymentInfoModal.rejectedOption2')}> {t('paymentInfoModal.rejectedOption2Desc')} </AccordionInfo>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <DialogFooter className="pt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>{t('paymentInfoModal.closeButton')}</Button>
                    <Button onClick={onStartPlan} className="bg-green-600 hover:bg-green-700">{t('paymentInfoModal.startButton')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
