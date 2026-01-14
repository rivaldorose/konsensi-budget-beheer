import React, { useState } from 'react';
import { Loan } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, HandCoins, Handshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


export default function AddLoanModal({ isOpen, onClose, onLoanAdded }) {
    const [step, setStep] = useState(1);
    const [loanType, setLoanType] = useState(null);
    const [personName, setPersonName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const resetState = () => {
        setStep(1);
        setLoanType(null);
        setPersonName('');
        setAmount('');
        setDueDate('');
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSelectType = (type) => {
        setLoanType(type);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await Loan.create({
                type: loanType,
                person_name: personName,
                amount: parseFloat(amount),
                due_date: dueDate,
                loan_date: new Date().toISOString().split('T')[0],
                status: 'active'
            });

            toast({
                title: "✅ Lening toegevoegd",
                description: `De lening is succesvol opgeslagen in je budgetplan.`,
            });
            onLoanAdded();
            handleClose();
        } catch (error) {
            console.error("Failed to add loan:", error);
            toast({
                title: "❌ Fout",
                description: "Kon de lening niet toevoegen.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep2Valid = personName && amount && parseFloat(amount) > 0 && dueDate;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-0">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DialogHeader className="p-6">
                                <DialogTitle>💸 Lening toevoegen</DialogTitle>
                            </DialogHeader>
                            <div className="p-6 pt-0 space-y-4">
                                <p className="text-sm text-muted-foreground">Wat is de situatie?</p>
                                <Button
                                    variant="outline"
                                    className="w-full h-auto text-left justify-start p-4"
                                    onClick={() => handleSelectType('borrowed')}
                                >
                                    <HandCoins className="w-6 h-6 mr-4 text-red-500" />
                                    <div>
                                        <span className="font-semibold">Ik wil geld lenen</span>
                                        <p className="text-xs text-muted-foreground">Ik moet dit bedrag terugbetalen.</p>
                                    </div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-auto text-left justify-start p-4"
                                    onClick={() => handleSelectType('lent')}
                                >
                                    <Handshake className="w-6 h-6 mr-4 text-green-500" />
                                    <div>
                                        <span className="font-semibold">Ik wil geld uitlenen</span>
                                        <p className="text-xs text-muted-foreground">Ik krijg dit bedrag terug.</p>
                                    </div>
                                </Button>
                            </div>
                            <DialogFooter className="p-6 pt-0">
                                <Button variant="ghost" onClick={handleClose}>Annuleren</Button>
                            </DialogFooter>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.2 }}
                        >
                            <form onSubmit={handleSubmit}>
                                <DialogHeader className="p-6 pb-4">
                                    <DialogTitle className="text-lg flex items-center gap-2">
                                        {loanType === 'borrowed' ? 'Geld terugbetalen' : 'Geld terugkrijgen'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="px-6 space-y-4">
                                    <div>
                                        <Label htmlFor="person_name">{loanType === 'borrowed' ? 'Van wie?' : 'Aan wie?'}</Label>
                                        <Input
                                            id="person_name"
                                            value={personName}
                                            onChange={(e) => setPersonName(e.target.value)}
                                            placeholder="Naam"
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="amount">Hoeveel?</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="€ 0,00"
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="due_date">{loanType === 'borrowed' ? 'Wanneer terugbetalen?' : 'Wanneer krijg je het terug?'}</Label>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="p-6 pt-4 flex justify-between">
                                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Terug
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting || !isStep2Valid}
                                    >
                                        {isSubmitting ? 'Opslaan...' : 'Lening toevoegen'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}