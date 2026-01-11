import React, { useState } from 'react';
import { Transaction } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CreditCard } from 'lucide-react';
import { formatCurrency } from "@/components/utils/formatters";

export default function PotPaymentModal({ isOpen, onClose, pot, onPaymentAdded }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    if (!pot) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.description || !formData.amount) {
            toast({ title: "Vul een omschrijving en bedrag in", variant: "destructive"});
            return;
        }

        setSaving(true);
        try {
            await Transaction.create({
                type: 'expense',
                amount: parseFloat(formData.amount),
                description: formData.description, // 🔥 bijv. "GVB"
                category: `Potje: ${pot.name}`, // 🔥 bijv. "Potje: Vervoer"
                date: formData.date,
            });

            toast({ 
                title: 'Uitgave geregistreerd!',
                description: `€${parseFloat(formData.amount).toFixed(2)} uitgegeven aan ${pot.name}`
            });
            
            // Reset form
            setFormData({
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
            });
            
            if (onPaymentAdded) onPaymentAdded();
            onClose();
        } catch (error) {
            console.error("Error registering payment:", error);
            toast({ title: 'Fout bij opslaan', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Betaling doen uit {pot.icon} {pot.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Budget:</span> {formatCurrency(pot.monthly_budget || 0)}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="payment-description">Omschrijving *</Label>
                        <Input
                            id="payment-description"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="bv. Albert Heijn, Bol.com..."
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="payment-amount">Bedrag (€) *</Label>
                        <Input
                            id="payment-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            placeholder="0.00"
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="payment-date">Datum *</Label>
                        <Input
                            id="payment-date"
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            className="mt-1"
                            required
                        />
                    </div>

                    <DialogFooter className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} type="button" disabled={saving}>
                            Annuleren
                        </Button>
                        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Opslaan...
                                </>
                            ) : (
                                'Betaling opslaan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}