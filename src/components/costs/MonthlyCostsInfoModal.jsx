import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function MonthlyCostsInfoModal({ isOpen, onClose }) {
    const features = [
        {
            icon: 'receipt_long',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            title: 'Vaste lasten registreren',
            desc: 'Huur, energie, verzekeringen, abonnementen — alles op één plek.',
        },
        {
            icon: 'calendar_month',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            title: 'Betaaldag instellen',
            desc: 'Krijg herinneringen en zie welke betalingen eraan komen.',
        },
        {
            icon: 'category',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            title: 'Categorieën',
            desc: 'Groepeer op wonen, utilities, verzekeringen, etc.',
        },
        {
            icon: 'date_range',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            title: 'Start- en einddatum',
            desc: 'Voor tijdelijke kosten of contracten die aflopen.',
        },
    ];

    const tips = [
        'Check regelmatig of je alle abonnementen nog gebruikt',
        'Vergelijk jaarlijks je energie en verzekeringen',
        'Gebruik check-in om betalingen te bevestigen',
        'Zet een einddatum bij proefabonnementen',
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-[#1a1a1a] border-0 dark:border dark:border-[#2a2a2a] rounded-[24px]">
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 pb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                        </div>
                        <h2 className="text-white text-xl font-bold">Vaste Lasten</h2>
                        <p className="text-white/80 text-sm mt-1">Beheer je maandelijkse uitgaven</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto">
                    {/* Features */}
                    <div className="space-y-3">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#2a2a2a]">
                                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    <span className={`material-symbols-outlined ${f.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-4 border border-amber-200 dark:border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                            <span className="font-bold text-sm text-amber-800 dark:text-amber-400">Tips</span>
                        </div>
                        <ul className="space-y-1.5">
                            {tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                                    <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all text-sm"
                    >
                        Begrepen
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
