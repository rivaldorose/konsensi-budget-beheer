import React from 'react';
import { useTranslation } from '@/components/utils/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';

export default function Feedback() {
    const { t } = useTranslation();

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">💬 Feedback & Suggesties</h1>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800">
                    <strong>Help ons Konsensi te verbeteren!</strong> Meld bugs, deel feedback of vraag nieuwe functies aan. 
                    Je kunt anoniem of met je naam feedback geven. We lezen alles en werken eraan!
                </p>
            </div>

            <Card className="shadow-sm overflow-hidden">
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