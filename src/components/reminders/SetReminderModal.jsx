import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, X } from 'lucide-react';

export default function SetReminderModal({ warning, isOpen, onClose, onSave }) {
    const [daysBefore, setDaysBefore] = useState('3');
    const [channels, setChannels] = useState(['in-app']);

    useEffect(() => {
        if (warning?.data?.reminder_days_before) {
            setDaysBefore(String(warning.data.reminder_days_before));
        } else {
            setDaysBefore('3');
        }
    }, [warning]);
    
    if (!isOpen || !warning) return null;

    const handleSave = () => {
        onSave(warning, parseInt(daysBefore, 10));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-[var(--konsensi-primary)]" />
                        Herinnering Instellen
                    </DialogTitle>
                    <DialogDescription>
                        Voor de uitgave "{warning.data.transactionName}" van €{warning.data.transactionAmount?.toFixed(2)}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div>
                        <Label className="font-semibold">Herinner me:</Label>
                        <RadioGroup value={daysBefore} onValueChange={setDaysBefore} className="mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id="d1" />
                                <Label htmlFor="d1">1 dag van tevoren</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="2" id="d2" />
                                <Label htmlFor="d2">2 dagen van tevoren</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="3" id="d3" />
                                <Label htmlFor="d3">3 dagen van tevoren (standaard)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="7" id="d7" />
                                <Label htmlFor="d7">1 week van tevoren</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div>
                        <Label className="font-semibold">Via:</Label>
                        <div className="mt-2 space-y-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox id="ch-app" checked={channels.includes('in-app')} onCheckedChange={(checked) => setChannels(c => checked ? [...c, 'in-app'] : c.filter(i => i !== 'in-app'))} />
                                <Label htmlFor="ch-app" className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-gray-600"/> In-app notificatie
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 opacity-50 cursor-not-allowed">
                                <Checkbox id="ch-mail" disabled />
                                <Label htmlFor="ch-mail" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500"/> E-mail (binnenkort beschikbaar)
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Annuleren
                    </Button>
                    <Button onClick={handleSave} className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]">
                        Herinnering Opslaan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}