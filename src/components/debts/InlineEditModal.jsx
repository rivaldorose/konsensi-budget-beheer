import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function InlineEditModal({ isOpen, onClose, field, title, currentValue, onSave, inputType = 'text' }) {
    const [value, setValue] = useState(currentValue);

    useEffect(() => {
        setValue(currentValue);
    }, [currentValue, isOpen]);

    const handleSave = () => {
        onSave(field, value);
        onClose();
    };

    const InputComponent = inputType === 'textarea' ? Textarea : Input;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title} bewerken</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor={field} className="sr-only">{title}</Label>
                    <InputComponent 
                        id={field} 
                        value={value || ''} 
                        onChange={(e) => setValue(e.target.value)} 
                        autoFocus
                        rows={5}
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Annuleren</Button>
                    <Button onClick={handleSave}>Opslaan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}