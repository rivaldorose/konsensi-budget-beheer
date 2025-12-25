import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { Income } from '@/api/entities';
import { MonthlyCost } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Pot } from '@/api/entities';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function AddTransactionModal({ isOpen, onClose, onSuccess, userEmail }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('expense');
    const [saving, setSaving] = useState(false);
    const [pots, setPots] = useState([]);
    
    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [selectedPot, setSelectedPot] = useState('');
    const [expenseType, setExpenseType] = useState('eenmalig'); // eenmalig, vast
    const [incomeType, setIncomeType] = useState('extra'); // extra, vast
    
    // Vaste lasten categorieën
    const costCategories = [
        { value: 'wonen', label: '🏠 Wonen' },
        { value: 'utilities', label: '💡 Gas/Water/Licht' },
        { value: 'verzekeringen', label: '🛡️ Verzekeringen' },
        { value: 'abonnementen', label: '📱 Abonnementen' },
        { value: 'vervoer', label: '🚗 Vervoer' },
        { value: 'boodschappen', label: '🛒 Boodschappen' },
        { value: 'other', label: '📦 Overig' }
    ];

    useEffect(() => {
        if (isOpen && userEmail) {
            loadPots();
        }
    }, [isOpen, userEmail]);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setCategory('');
            setSelectedPot('');
            setExpenseType('eenmalig');
            setIncomeType('extra');
        }
    }, [isOpen]);

    const loadPots = async () => {
        try {
            const potsData = await Pot.filter({ created_by: userEmail });
            setPots(potsData.filter(p => p.pot_type === 'expense'));
        } catch (error) {
            console.error('Error loading pots:', error);
        }
    };

    const handleSave = async () => {
        if (!description || !amount) {
            toast({ title: '⚠️ Vul alle velden in', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const parsedAmount = parseFloat(amount);

            if (activeTab === 'income') {
                // Inkomen toevoegen
                if (incomeType === 'vast') {
                    await Income.create({
                        description,
                        amount: parsedAmount,
                        income_type: 'vast',
                        frequency: 'monthly',
                        monthly_equivalent: parsedAmount,
                        start_date: date,
                        is_active: true
                    });
                } else {
                    await Income.create({
                        description,
                        amount: parsedAmount,
                        income_type: 'extra',
                        date: date
                    });
                }
                
                // Ook als transactie registreren
                await Transaction.create({
                    type: 'income',
                    amount: parsedAmount,
                    description,
                    category: 'inkomen',
                    date
                });

                toast({ title: '✅ Inkomen toegevoegd!' });

            } else {
                // Uitgave toevoegen
                if (expenseType === 'vast') {
                    // Vaste last toevoegen
                    const dayOfMonth = new Date(date).getDate();
                    await MonthlyCost.create({
                        name: description,
                        amount: parsedAmount,
                        payment_date: dayOfMonth,
                        category: category || 'other',
                        status: 'actief',
                        start_date: date
                    });
                    toast({ title: '✅ Vaste last toegevoegd!' });

                } else if (selectedPot) {
                    // Aan potje koppelen
                    const pot = pots.find(p => p.id === selectedPot);
                    if (pot) {
                        const newSpent = (parseFloat(pot.spent) || 0) + parsedAmount;
                        await Pot.update(pot.id, { spent: newSpent });
                    }
                    
                    // Transactie registreren
                    await Transaction.create({
                        type: 'expense',
                        amount: parsedAmount,
                        description,
                        category: pot?.name || 'overig',
                        date
                    });
                    toast({ title: '✅ Uitgave toegevoegd aan potje!' });

                } else {
                    // Losse uitgave
                    await Transaction.create({
                        type: 'expense',
                        amount: parsedAmount,
                        description,
                        category: category || 'overig',
                        date
                    });
                    toast({ title: '✅ Uitgave toegevoegd!' });
                }
            }

            onSuccess?.();
            onClose();

        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: '❌ Fout bij opslaan', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Transactie Toevoegen</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="expense" className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Uitgave
                        </TabsTrigger>
                        <TabsTrigger value="income" className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Inkomen
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="expense" className="space-y-4 mt-4">
                        <div>
                            <Label>Beschrijving</Label>
                            <Input
                                placeholder="Bijv. Boodschappen Albert Heijn"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Bedrag (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Datum</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Type uitgave</Label>
                            <Select value={expenseType} onValueChange={setExpenseType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="eenmalig">💸 Eenmalige uitgave</SelectItem>
                                    <SelectItem value="vast">🔄 Vaste last (maandelijks)</SelectItem>
                                    <SelectItem value="potje">🏺 Koppel aan potje</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {expenseType === 'vast' && (
                            <div>
                                <Label>Categorie vaste last</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kies categorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {costCategories.map(cat => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {expenseType === 'potje' && (
                            <div>
                                <Label>Kies potje</Label>
                                <Select value={selectedPot} onValueChange={setSelectedPot}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecteer een potje" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pots.map(pot => (
                                            <SelectItem key={pot.id} value={pot.id}>
                                                {pot.icon} {pot.name} (€{(pot.budget - (pot.spent || 0)).toFixed(0)} over)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="income" className="space-y-4 mt-4">
                        <div>
                            <Label>Beschrijving</Label>
                            <Input
                                placeholder="Bijv. Salaris januari"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Bedrag (€)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Datum</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Type inkomen</Label>
                            <Select value={incomeType} onValueChange={setIncomeType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="extra">💰 Eenmalig inkomen</SelectItem>
                                    <SelectItem value="vast">🔄 Vast inkomen (maandelijks)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Annuleren
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Opslaan...
                            </>
                        ) : (
                            '✅ Opslaan'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}