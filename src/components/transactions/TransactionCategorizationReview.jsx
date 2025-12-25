import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Sparkles, Check, X, AlertCircle, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/components/utils/formatters";
import { useToast } from "@/components/ui/use-toast";

export default function TransactionCategorizationReview({ isOpen, onClose, onReviewComplete }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadUncategorizedTransactions();
        }
    }, [isOpen]);

    const loadUncategorizedTransactions = async () => {
        setLoading(true);
        try {
            const user = await base44.auth.me();
            
            // Load transactions that need review (low confidence or not verified)
            const allTransactions = await base44.entities.Transaction.filter({
                created_by: user.email
            }, '-created_date', 50);

            const needReview = allTransactions.filter(t => 
                !t.manually_verified && 
                (t.ai_confidence < 80 || !t.ai_suggested_category)
            );

            setTransactions(needReview);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast({
                title: 'Fout',
                description: 'Kon transacties niet laden',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (transaction) => {
        setProcessing(true);
        try {
            await base44.entities.Transaction.update(transaction.id, {
                manually_verified: true,
                category: transaction.ai_suggested_category || transaction.category
            });

            setTransactions(prev => prev.filter(t => t.id !== transaction.id));
            
            toast({
                title: '✅ Goedgekeurd',
                description: 'Categorisatie bevestigd'
            });
        } catch (error) {
            console.error('Error approving:', error);
            toast({
                title: 'Fout',
                description: 'Kon niet goedkeuren',
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCorrect = async (transaction, newCategory) => {
        setProcessing(true);
        try {
            await base44.entities.Transaction.update(transaction.id, {
                category: newCategory,
                manually_verified: true,
                ai_confidence: 100 // User correction = 100% confidence
            });

            setTransactions(prev => prev.filter(t => t.id !== transaction.id));
            
            toast({
                title: '✅ Gecorrigeerd',
                description: `Categorie aangepast naar "${newCategory}"`
            });
        } catch (error) {
            console.error('Error correcting:', error);
            toast({
                title: 'Fout',
                description: 'Kon niet corrigeren',
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleRecategorize = async (transaction) => {
        setProcessing(true);
        try {
            const response = await base44.functions.invoke('categorizeTransaction', {
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type
            });

            if (response.data.success) {
                await base44.entities.Transaction.update(transaction.id, {
                    ai_suggested_category: response.data.category,
                    ai_confidence: response.data.confidence
                });

                // Reload transactions
                await loadUncategorizedTransactions();
                
                toast({
                    title: '🤖 Opnieuw gecategoriseerd',
                    description: `Nieuwe suggestie: ${response.data.category}`
                });
            }
        } catch (error) {
            console.error('Error recategorizing:', error);
            toast({
                title: 'Fout',
                description: 'Kon niet opnieuw categoriseren',
                variant: 'destructive'
            });
        } finally {
            setProcessing(false);
        }
    };

    const categories = [
        'boodschappen', 'vervoer', 'entertainment', 'restaurants',
        'kleding', 'gezondheidszorg', 'utilities', 'abonnementen',
        'huishouden', 'sport', 'cadeaus', 'overig'
    ];

    const getConfidenceColor = (confidence) => {
        if (confidence >= 80) return 'text-green-600 bg-green-50';
        if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        Controleer AI Categorisaties
                        <Badge variant="secondary">{transactions.length} te bekijken</Badge>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Alles is gecategoriseerd!
                        </h3>
                        <p className="text-gray-600">
                            Alle transacties zijn geverifieerd en correct gecategoriseerd.
                        </p>
                        <Button onClick={onClose} className="mt-4">Sluiten</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {transactions.map((transaction, index) => (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="border-2">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {transaction.description}
                                                        </h4>
                                                        <Badge variant="outline">
                                                            {formatCurrency(transaction.amount)}
                                                        </Badge>
                                                        {transaction.ai_confidence && (
                                                            <Badge className={getConfidenceColor(transaction.ai_confidence)}>
                                                                {transaction.ai_confidence}% zeker
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">AI Suggestie:</p>
                                                            <Badge className="bg-purple-100 text-purple-800">
                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                {transaction.ai_suggested_category || transaction.category}
                                                            </Badge>
                                                        </div>
                                                        
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Corrigeer naar:</p>
                                                            <Select 
                                                                defaultValue={transaction.ai_suggested_category || transaction.category}
                                                                onValueChange={(value) => handleCorrect(transaction, value)}
                                                                disabled={processing}
                                                            >
                                                                <SelectTrigger className="w-40">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {categories.map(cat => (
                                                                        <SelectItem key={cat} value={cat}>
                                                                            {cat}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleApprove(transaction)}
                                                            disabled={processing}
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Goedkeuren
                                                        </Button>
                                                        
                                                        <Button
                                                            onClick={() => handleRecategorize(transaction)}
                                                            disabled={processing}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <TrendingUp className="w-4 h-4 mr-1" />
                                                            Opnieuw categoriseren
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                Later bekijken
                            </Button>
                            <p className="text-sm text-gray-600">
                                💡 Hoe meer je corrigeert, hoe slimmer de AI wordt!
                            </p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}