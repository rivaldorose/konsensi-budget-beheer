import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function IncomeInfoModal({ isOpen, onClose }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[500px] p-0 gap-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] rounded-[24px] overflow-hidden">
                <div className="p-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-14 h-14 rounded-full bg-blue-400/10 dark:bg-blue-500/20 flex items-center justify-center mb-4 border border-blue-400/30 dark:border-blue-500/30">
                            <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-3xl">info</span>
                        </div>
                        <h2 className="text-[24px] font-bold text-[#1F2937] dark:text-white text-center">
                            Hoe werkt Inkomen?
                        </h2>
                    </div>

                    {/* Content Sections */}
                    <div className="flex flex-col gap-8">
                        {/* Vast Inkomen */}
                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#10B981]/10 dark:bg-[#10b981]/20 flex items-center justify-center border border-[#10B981]/20 dark:border-[#10b981]/30">
                                <span className="material-symbols-outlined text-[#10B981] text-2xl">bolt</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[#1F2937] dark:text-white text-lg font-semibold leading-tight">
                                    Vast Inkomen
                                </h3>
                                <p className="text-[#6B7280] dark:text-[#a1a1a1] text-sm leading-relaxed">
                                    Dit is je basisinkomen dat elke maand terugkeert, zoals salaris, uitkering of zorgtoeslag. We gebruiken dit om je maandelijkse budget en vaste lasten te berekenen.
                                </p>
                            </div>
                        </div>

                        {/* Extra Inkomen */}
                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#60A5FA]/10 dark:bg-[#3b82f6]/20 flex items-center justify-center border border-[#60A5FA]/20 dark:border-[#3b82f6]/30">
                                <span className="material-symbols-outlined text-[#60A5FA] dark:text-[#3b82f6] text-2xl">redeem</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[#1F2937] dark:text-white text-lg font-semibold leading-tight">
                                    Extra Inkomen
                                </h3>
                                <p className="text-[#6B7280] dark:text-[#a1a1a1] text-sm leading-relaxed">
                                    Eenmalige bedragen zoals bonussen, cadeaus of vakantiegeld. Dit geld is ideaal om extra af te lossen op schulden of om in je spaarpotjes te stoppen.
                                </p>
                            </div>
                        </div>

                        {/* Slimme Automatisering */}
                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#10B981]/10 dark:bg-[#10b981]/20 flex items-center justify-center border border-[#10B981]/20 dark:border-[#10b981]/30">
                                <span className="material-symbols-outlined text-[#10B981] text-2xl">document_scanner</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-[#1F2937] dark:text-white text-lg font-semibold leading-tight">
                                    Slimme Automatisering
                                </h3>
                                <p className="text-[#6B7280] dark:text-[#a1a1a1] text-sm leading-relaxed">
                                    Je kunt loonstroken scannen! Onze AI leest de gegevens uit en verwerkt deze automatisch in je overzicht en werkschema.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-10">
                        <button
                            onClick={onClose}
                            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md shadow-[#10B981]/20 active:scale-[0.98]"
                        >
                            Begrepen
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
