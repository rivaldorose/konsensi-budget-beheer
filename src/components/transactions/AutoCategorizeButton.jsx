import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Transaction } from "@/api/entities";
import { categorizeTransaction } from "@/api/functions";
import { useToast } from "@/components/ui/use-toast";

export default function AutoCategorizeButton({ transaction, onCategorized }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAutoCategorize = async () => {
        setLoading(true);
        try {
            const response = await categorizeTransaction({
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type
            });

            if (response.success) {
                // Update transaction with AI suggestion
                await Transaction.update(transaction.id, {
                    category: response.category,
                    ai_suggested_category: response.category,
                    ai_confidence: response.confidence
                });

                toast({
                    title: '🤖 Gecategoriseerd!',
                    description: `Categorie: ${response.category} (${response.confidence}% zeker)`,
                });

                if (onCategorized) {
                    onCategorized(response);
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