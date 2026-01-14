import React, { useState } from 'react';
import { Pot } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { PiggyBank, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/components/utils/formatters';

export default function PotDepositModal({ pot, isOpen, onClose, onDeposited }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    if (!pot || !isOpen) return null;

    const handleDeposit = async (e) => {
        e.preventDefault();
        
        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: "Vul een geldig bedrag in", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const depositAmount = parseFloat(amount);
            const newCurrentAmount = (pot.current_amount || 0) + depositAmount;

            // 1. Update het spaarpotje
            await Pot.update(pot.id, {
                current_amount: newCurrentAmount
            });

            // 2. Registreer als transaction (zodat het zichtbaar is in je budget)
            await Transaction.create({
                type: 'expense', // Expense want je geeft geld uit (naar sparen)
                amount: depositAmount,
                description: description || `Storting in ${pot.name}`,
                category: pot.name, // Gebruik potje naam als categorie
                date: new Date().toISOString().split('T')[0]
            });

            toast({ 
                title: "💰 Gestort!",
                description: `${formatCurrency(depositAmount)} toegevoegd aan ${pot.name}`,
                variant: "success"
            });

            // Reset form
            setAmount('');
            setDescription('');
            
            // Callback
            onDeposited();
            onClose();

        } catch (error) {
            console.error("Error depositing:", error);
            toast({ 
                title: "Fout bij storten", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setSaving(false);
        }
    };

    const remainingAmount = (pot.target_amount || 0) - (pot.current_amount || 0);
    const progressPercentage = pot.target_amount 
        ? Math.min(100, ((pot.current_amount || 0) / pot.target_amount) * 100)
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-green-500" />
                        Storten in {pot.icon} {pot.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleDeposit} className="space-y-4">
                    {/* Voortgang */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Huidig gespaard</span>
                            <span className="font-bold text-green-700">
                                {formatCurrency(pot.current_amount || 0)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{progressPercentage.toFixed(0)}% van doel</span>
                            <span>Nog {formatCurrency(remainingAmount)} te gaan</span>
                        </div>
                    </div>

                    {/* Bedrag input */}
                    <div>
                        <Label htmlFor="amount">Bedrag om te storten *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {amount && parseFloat(amount) > 0 && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Na storting: {formatCurrency((pot.current_amount || 0) + parseFloat(amount))} / {formatCurrency(pot.target_amount)}
                            </p>
                        )}
                    </div>

                    {/* Beschrijving (optioneel) */}
                    <div>
                        <Label htmlFor="description">Notitie (optioneel)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="bv. Spaargeld januari"
                        />
                    </div>

                    {/* Snelle bedragen */}
                    <div>
                        <Label className="text-xs text-gray-500 mb-2 block">Snelkeuze:</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[10, 25, 50, 100].map(quickAmount => (
                                <Button
                                    key={quickAmount}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmount(quickAmount.toString())}
                                    className="text-xs"
                                >
                                    €{quickAmount}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={saving || !amount || parseFloat(amount) <= 0}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            {saving ? 'Bezig...' : 'Storten'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}