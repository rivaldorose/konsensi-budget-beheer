import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AutoCategorizeButton({ transaction, onCategorized }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAutoCategorize = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('categorizeTransaction', {
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type
            });

            if (response.data.success) {
                // Update transaction with AI suggestion
                await base44.entities.Transaction.update(transaction.id, {
                    category: response.data.category,
                    ai_suggested_category: response.data.category,
                    ai_confidence: response.data.confidence
                });

                toast({
                    title: '🤖 Gecategoriseerd!',
                    description: `Categorie: ${response.data.category} (${response.data.confidence}% zeker)`,
                });

                if (onCategorized) {
                    onCategorized(response.data);
                }
            }
        } catch (error) {
            console.error('Error auto-categorizing:', error);
            toast({
                title: 'Fout',
                description: 'Kon niet automatisch categoriseren',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleAutoCategorize}
            disabled={loading}
            size="sm"
            variant="outline"
            className="gap-2"
        >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Bezig...' : 'Auto-categoriseer'}
        </Button>
    );
}