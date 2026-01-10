
import React, { useState, useEffect } from 'react';
import { Pot } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Income } from '@/api/entities'; // Added import
import { incomeService } from '@/components/services'; // Added import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/components/ui/toast';
import { Trash2, Link as LinkIcon, CreditCard, PiggyBank, ShoppingBag, Info } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/components/utils/formatters";

const frequencyOptions = [
    { value: 'monthly', label: '1x per maand', description: 'Grote voorraad inkopen' },
    { value: 'weekly', label: 'Elke week', description: 'Kleinere boodschappen wekelijks' },
    { value: 'biweekly', label: 'Elke 2 weken', description: 'Grotere boodschappen 2x/maand' },
    { value: 'flexible', label: 'Flexibel/wisselend', description: 'Geen vast patroon' },
];

const dayOptions = [
    { value: 1, label: 'Maandag' }, { value: 2, label: 'Dinsdag' }, { value: 3, label: 'Woensdag' },
    { value: 4, label: 'Donderdag' }, { value: 5, label: 'Vrijdag' }, { value: 6, label: 'Zaterdag' }, { value: 0, label: 'Zondag' }
];
  
const iconOptions = ['💰', '🍔', '🚗', '🏠', '🎉', '👕', '❤️', '💡', '📱', '🧾', '🎁', '✈️', '💪', '🐷', '🎓', '🏛️', '💻', '🧴', '🛡️', '📺', '🍻', '🎨'];

const nibudCategories = [
    { value: null, label: 'Geen categorie', percentage: 0 },
    { value: 'wonen', label: 'Wonen', percentage: 35 },
    { value: 'eten_drinken', label: 'Eten & Drinken', percentage: 15 },
    { value: 'vervoer', label: 'Vervoer', percentage: 10 },
    { value: 'uitgaan', label: 'Uitgaan', percentage: 8 },
    { value: 'zorg', label: 'Zorg', percentage: 6 },
    { value: 'energie', label: 'Energie', percentage: 5 },
    { value: 'telefoon_internet', label: 'Telefoon/Internet', percentage: 3 },
    { value: 'kleding', label: 'Kleding', percentage: 5 },
    { value: 'sparen_buffer', label: 'Sparen/Buffer', percentage: 12 },
    { value: 'overig', label: 'Overig', percentage: 1 },
];

const initialFormData = {
    name: '',
    icon: '💰',
    description: '', 
    external_link: '', 
    pot_type: 'expense',
    category: null,
    is_essential: true,
    monthly_budget: '',
    spending_frequency: 'monthly',
    payment_day: 1,
    first_payment_date: new Date().toISOString().split('T')[0],
    target_amount: '',
    current_amount: 0,
    target_date: '',
};

const initialPaymentData = {
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
};

export default function PotjeModal({ pot, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState(initialFormData);
    const [addPayment, setAddPayment] = useState(false);
    const [paymentData, setPaymentData] = useState(initialPaymentData);
    const [userIncome, setUserIncome] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        const loadUserIncome = async () => {
            try {
                const user = await User.me();

                // Haal alle inkomens op van de gebruiker
                const allIncomes = await Income.filter({ user_id: user.id });
                
                // Gebruik incomeService om het totale inkomen te berekenen
                const incomeData = incomeService.processIncomeData(allIncomes, new Date());
                const totalIncome = incomeData.total;
                
                setUserIncome(totalIncome);
            } catch (error) {
                console.error('Error loading user income:', error);
                setUserIncome(0);
            }
        };
        
        if (isOpen) {
            loadUserIncome();
            
            if (pot) {
                setFormData({
                    id: pot.id,
                    name: pot.name || '',
                    icon: pot.icon || '💰',
                    description: pot.description || '', 
                    external_link: pot.external_link || '', 
                    pot_type: pot.pot_type || 'expense',
                    category: pot.category || null,
                    is_essential: pot.is_essential !== false,
                    monthly_budget: pot.monthly_budget || '',
                    spending_frequency: pot.spending_frequency || 'monthly',
                    payment_day: pot.payment_day || 1,
                    first_payment_date: pot.first_payment_date || new Date().toISOString().split('T')[0],
                    target_amount: pot.target_amount || '',
                    current_amount: pot.current_amount || 0,
                    target_date: pot.target_date || '',
                });
                setAddPayment(false);
            } else {
                setFormData(initialFormData);
                setAddPayment(false);
                setPaymentData(initialPaymentData);
            }
        }
    }, [pot, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast({ title: "Vul een naam in", variant: "destructive"});
            return;
        }

        if (formData.pot_type === 'expense') {
            if (!formData.monthly_budget || formData.monthly_budget === '') {
                toast({ title: "Vul een maandbudget in", variant: "destructive"});
                return;
            }
        }

        if (formData.pot_type === 'savings') {
            if (!formData.target_amount || formData.target_amount === '') {
                toast({ title: "Vul een doelbedrag in voor je spaarpotje", variant: "destructive"});
                return;
            }
        }

        if (addPayment && !paymentData.amount) {
            toast({ title: "Vul een bedrag in voor de betaling", variant: "destructive"});
            return;
        }

        try {
            const dataToSave = { 
                ...formData, 
                monthly_budget: parseFloat(formData.monthly_budget || 0),
                target_amount: formData.pot_type === 'savings' ? parseFloat(formData.target_amount || 0) : 0,
                current_amount: formData.pot_type === 'savings' ? parseFloat(formData.current_amount || 0) : 0,
                category: formData.category || null,
            };
            let savedPot;

            if (formData.id) {
                await Pot.update(formData.id, dataToSave);
                savedPot = { ...formData, ...dataToSave };
                toast({title: `Potje "${formData.name}" bijgewerkt!`});
            } else {
                savedPot = await Pot.create(dataToSave);
                toast({title: `Potje "${formData.name}" aangemaakt!`});
            }

            if (addPayment && paymentData.amount && formData.pot_type === 'expense') {
                await Transaction.create({
                    type: 'expense',
                    amount: parseFloat(paymentData.amount),
                    category: savedPot.name,
                    description: paymentData.description || `Betaling voor ${savedPot.name}`,
                    date: paymentData.date,
                });
                toast({title: `Betaling van €${paymentData.amount} geregistreerd!`, variant: 'success'});
            }

            onSave();
        } catch (error) {
            console.error("Error saving pot:", error);
            toast({title: "Fout bij opslaan van potje.", variant: "destructive"});
        }
    };
    
    const handleDelete = async () => {
        if(confirm(`Weet je zeker dat je het potje "${formData.name}" wilt verwijderen?`)){
            try {
                await Pot.delete(formData.id);
                toast({title: "Potje verwijderd."});
                onSave();
            } catch (error) {
                toast({title: "Kon potje niet verwijderen.", variant: "destructive"});
            }
        }
    };

    const getAmountPerFrequency = () => {
        const budget = parseFloat(formData.monthly_budget) || 0;
        switch (formData.spending_frequency) {
            case 'weekly': return `(${formatCurrency(budget / 4.33)} per week)`;
            case 'biweekly': return `(${formatCurrency(budget / 2)} per keer)`;
            case 'monthly': return `(${formatCurrency(budget)} in één keer)`;
            default: return '';
        }
    };

    const progressPercentage = formData.pot_type === 'savings' && formData.target_amount 
        ? Math.min(100, (parseFloat(formData.current_amount || 0) / parseFloat(formData.target_amount)) * 100)
        : 0;

    const selectedCategory = nibudCategories.find(cat => cat.value === formData.category);
    
    // NIBUD richtlijn berekening
    const nibudRichtlijn = selectedCategory && selectedCategory.percentage > 0 && userIncome > 0
        ? Math.round((userIncome * selectedCategory.percentage) / 100)
        : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{formData.icon} {formData.id ? `${formData.name} bewerken` : 'Nieuw potje aanmaken'}</DialogTitle>
                     {formData.name && <DialogDescription>{formData.pot_type === 'savings' ? '🐷 Spaarpotje' : (formData.is_essential ? '⚠️ Noodzakelijk' : '💭 Wens')}</DialogDescription>}
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-4">
                    {!formData.id && (
                        <div className="border-b pb-4">
                            <Label className="font-semibold mb-3 block">Type potje</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={formData.pot_type === 'expense' ? 'default' : 'outline'}
                                    onClick={() => setFormData({ ...formData, pot_type: 'expense' })}
                                    className="h-auto py-4 flex-col gap-2"
                                >
                                    <ShoppingBag className="w-6 h-6" />
                                    <div>
                                        <div className="font-semibold">Uitgaven</div>
                                        <div className="text-xs opacity-70">Boodschappen, etc.</div>
                                    </div>
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.pot_type === 'savings' ? 'default' : 'outline'}
                                    onClick={() => setFormData({ ...formData, pot_type: 'savings' })}
                                    className="h-auto py-4 flex-col gap-2"
                                >
                                    <PiggyBank className="w-6 h-6" />
                                    <div>
                                        <div className="font-semibold">Sparen</div>
                                        <div className="text-xs opacity-70">Doelen bereiken</div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    )}

                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div>
                            <Label htmlFor="pot-name">Naam</Label>
                            <Input
                            id="pot-name"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="mt-1"
                            placeholder={formData.pot_type === 'savings' ? "bv. Vakantie, Nieuwe laptop..." : "bv. Boodschappen, Kleding..."}
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="pot-description">Beschrijving (optioneel)</Label>
                            <Textarea
                                id="pot-description"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="mt-1"
                                placeholder={formData.pot_type === 'savings' ? "Waar spaar je voor?" : "Waar is dit potje voor?"}
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="pot-link" className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" />
                                Link (optioneel)
                            </Label>
                            <Input
                                id="pot-link"
                                type="url"
                                value={formData.external_link}
                                onChange={e => setFormData({...formData, external_link: e.target.value})}
                                className="mt-1"
                                placeholder={formData.pot_type === 'savings' ? "https://... (product link, webshop, etc.)" : "https://... (factuur, website schuldeiser, etc.)"}
                            />
                        </div>

                        <div>
                            <Label htmlFor="pot-icon">Icoon</Label>
                            <Select
                            value={formData.icon}
                            onValueChange={(value) => setFormData({ ...formData, icon: value })}
                            >
                            <SelectTrigger id="pot-icon" className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {iconOptions.map(icon => (
                                <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="pot-category">Categorie (optioneel)</Label>
                            <Select
                                value={formData.category || 'none'}
                                onValueChange={(value) => setFormData({ ...formData, category: value === 'none' ? null : value })}
                            >
                                <SelectTrigger id="pot-category" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {nibudCategories.map(cat => (
                                        <SelectItem key={cat.value || 'none'} value={cat.value || 'none'}>
                                            {cat.label} {cat.percentage > 0 && `(${cat.percentage}%)`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {selectedCategory && selectedCategory.percentage > 0 && (
                                <div className="mt-2 text-sm text-gray-600">
                                    💡 NIBUD richtlijn voor {selectedCategory.label}: {
                                        userIncome > 0 
                                            ? `${formatCurrency(nibudRichtlijn)} (${selectedCategory.percentage}% van je salaris)`
                                            : `${selectedCategory.percentage}% van je salaris (vul salaris in om bedrag te zien)`
                                    }
                                </div>
                            )}
                        </div>
                    </motion.div>
                    
                    {formData.pot_type === 'savings' ? (
                        <>
                            <div>
                                <Label htmlFor="target_amount">Doelbedrag *</Label>
                                <Input
                                    id="target_amount"
                                    type="number"
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    className="mt-1"
                                    placeholder="1000"
                                />
                            </div>

                            <div>
                                <Label htmlFor="current_amount">Huidig gespaard bedrag</Label>
                                <Input
                                    id="current_amount"
                                    type="number"
                                    value={formData.current_amount}
                                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                                    className="mt-1"
                                    placeholder="0"
                                />
                                {formData.target_amount && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Voortgang</span>
                                            <span className="font-semibold">{progressPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="monthly_budget">Maandelijkse storting</Label>
                                <Input
                                    id="monthly_budget"
                                    type="number"
                                    value={formData.monthly_budget}
                                    onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                                    className="mt-1"
                                    placeholder="50"
                                />
                                <p className="text-xs text-gray-500 mt-1">Hoeveel wil je elke maand sparen?</p>
                            </div>

                            <div>
                                <Label htmlFor="target_date">Streefdatum (optioneel)</Label>
                                <Input
                                    id="target_date"
                                    type="date"
                                    value={formData.target_date}
                                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Label htmlFor="monthly_budget">Maandbudget *</Label>
                                <Input
                                    id="monthly_budget"
                                    type="number"
                                    value={formData.monthly_budget}
                                    onChange={(e) => setFormData({ ...formData, monthly_budget: e.target.value })}
                                    className="mt-1"
                                    placeholder="180"
                                />
                            </div>

                            <div>
                                <Label>Type potje</Label>
                                <div className="flex gap-4 mt-2">
                                    <Button
                                        type="button"
                                        variant={formData.is_essential ? 'default' : 'outline'}
                                        onClick={() => setFormData({ ...formData, is_essential: true })}
                                    >
                                        ⚠️ Noodzakelijk
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={!formData.is_essential ? 'default' : 'outline'}
                                        onClick={() => setFormData({ ...formData, is_essential: false })}
                                    >
                                        💭 Wens
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <Label className="font-semibold">📅 Hoe vaak geef je dit uit?</Label>
                                <RadioGroup 
                                    value={formData.spending_frequency} 
                                    onValueChange={(value) => setFormData({ ...formData, spending_frequency: value })}
                                    className="mt-2 space-y-2"
                                >
                                    {frequencyOptions.map(opt => (
                                        <div key={opt.value} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                                            <RadioGroupItem value={opt.value} id={opt.value} />
                                            <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between items-center">
                                                    <span>{opt.label} <span className="text-gray-500">{opt.value === formData.spending_frequency ? getAmountPerFrequency() : ''}</span></span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-normal">{opt.description}</p>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {formData.spending_frequency !== 'flexible' && formData.spending_frequency !== 'monthly' && (
                                 <div>
                                    <Label>Op welke dag meestal?</Label>
                                    <Select value={String(formData.payment_day)} onValueChange={v => setFormData({...formData, payment_day: Number(v)})}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            {dayOptions.map(day => <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                             {formData.spending_frequency === 'monthly' && (
                                 <div>
                                    <Label>Op welke dag van de maand?</Label>
                                     <Input type="number" min="1" max="31" value={formData.payment_day} onChange={e => setFormData({...formData, payment_day: Number(e.target.value)})} />
                                </div>
                            )}
                            {formData.spending_frequency === 'biweekly' && (
                                 <div>
                                    <Label>Eerste betaling</Label>
                                    <Input type="date" value={formData.first_payment_date} onChange={e => setFormData({...formData, first_payment_date: e.target.value})} />
                                </div>
                            )}

                            {!formData.id && (
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="add-payment" 
                                            checked={addPayment}
                                            onCheckedChange={setAddPayment}
                                        />
                                        <Label htmlFor="add-payment" className="font-semibold flex items-center gap-2 cursor-pointer">
                                            <CreditCard className="w-4 h-4" />
                                            Direct een betaling registreren?
                                        </Label>
                                    </div>

                                    <AnimatePresence>
                                        {addPayment && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3 pl-6 border-l-2 border-blue-200"
                                            >
                                                <div>
                                                    <Label htmlFor="payment-amount">Bedrag *</Label>
                                                    <Input
                                                        id="payment-amount"
                                                        type="number"
                                                        step="0.01"
                                                        value={paymentData.amount}
                                                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                                        className="mt-1"
                                                        placeholder="25.00"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="payment-date">Datum</Label>
                                                    <Input
                                                        id="payment-date"
                                                        type="date"
                                                        value={paymentData.date}
                                                        onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="payment-description">Omschrijving (optioneel)</Label>
                                                    <Input
                                                        id="payment-description"
                                                        value={paymentData.description}
                                                        onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                                                        className="mt-1"
                                                        placeholder="bv. Albert Heijn boodschappen"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            <div className="border-t pt-4 space-y-2">
                                 <h4 className="font-semibold pt-2">💡 Tips</h4>
                                <p className="text-xs text-gray-600">Wekelijks boodschappen doen helpt om verse producten te kopen en minder voedsel te verspillen. Maandelijks vereist meer planning.</p>
                            </div>
                        </>
                    )}

                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between pt-4">
                        {formData.id && <Button variant="destructive" onClick={handleDelete} type="button" className="sm:mr-auto"><Trash2 className="w-4 h-4 mr-2"/> Potje verwijderen</Button>}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} type="button">Annuleren</Button>
                            <Button type="submit">Opslaan</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
