import React from 'react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';

export default function Feedback() {
    const { t } = useTranslation();

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">💬 Feedback & Suggesties</h1>
            </div>

            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-[24px] p-4">
                <p className="text-sm text-[#1F2937] dark:text-white">
                    <strong>Help ons Konsensi te verbeteren!</strong> Meld bugs, deel feedback of vraag nieuwe functies aan. 
                    Je kunt anoniem of met je naam feedback geven. We lezen alles en werken eraan!
                </p>
            </div>

            <Card className="shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] overflow-hidden bg-white dark:bg-[#1a2c26]">
                <CardContent className="p-0">
                    <iframe 
                        src="https://konsensi-feedback-board-b7eacdbc.base44.app/FeedbackBoard?embed=true" 
                        width="100%" 
                        height="700px" 
                        style={{ border: 'none' }}
                        title="Konsensi Feedback Board"
                    />
                </CardContent>
            </Card>
        </div>
    );
}